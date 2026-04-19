require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const JSONB_FIELDS = new Set([
  'ai_identification_raw', 'value_source_breakdown', 'proof_links',
  'sample_listings', 'raw_response', 'top_10_cards',
]);

const TEXT_ARRAY_FIELDS = new Set(['tags']);

function serializeValues(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (JSONB_FIELDS.has(k) && v !== null && typeof v === 'object')
        return [k, JSON.stringify(v)];
      if (TEXT_ARRAY_FIELDS.has(k) && Array.isArray(v))
        return [k, v.length === 0 ? '{}' : `{${v.map(s => `"${s}"`).join(',')}}`];
      return [k, v];
    }),
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Health check
app.get('/health', (_, res) => res.json({ ok: true }));

// ─── Claude AI Proxy ──────────────────────────────────────────────────────────

app.post('/api/ai/claude', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── eBay Proxy ───────────────────────────────────────────────────────────────

app.get('/api/ebay/search', async (req, res) => {
  try {
    const appId = process.env.EBAY_APP_ID;
    const certId = process.env.EBAY_CERT_ID;

    if (!appId || !certId) {
      return res.status(503).json({ error: 'eBay credentials not configured' });
    }

    const isSandbox = process.env.EBAY_SANDBOX === 'true';
    const ebayBase = isSandbox ? 'https://api.sandbox.ebay.com' : 'https://api.ebay.com';

    // Get OAuth token
    const tokenRes = await fetch(`${ebayBase}/identity/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${appId}:${certId}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('eBay token error:', errText);
      return res.status(502).json({ error: 'eBay auth failed' });
    }

    const { access_token } = await tokenRes.json();

    // Search eBay
    const params = new URLSearchParams(req.query);
    const searchRes = await fetch(
      `${ebayBase}/buy/browse/v1/item_summary/search?${params}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        },
      },
    );

    const data = await searchRes.json();
    res.status(searchRes.status).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── TCG API Proxy ────────────────────────────────────────────────────────────

app.get('/api/tcgapi/search', async (req, res) => {
  try {
    const params = new URLSearchParams(req.query);
    const response = await fetch(`https://api.tcgapi.dev/v1/search?${params}`, {
      headers: { 'X-API-Key': process.env.TCGAPI_KEY },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Image Upload ─────────────────────────────────────────────────────────────

app.post('/api/upload', async (req, res) => {
  try {
    const { data } = req.body;
    const result = await cloudinary.uploader.upload(data, { folder: 'cardvault' });
    res.json({ url: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Cards ────────────────────────────────────────────────────────────────────

app.get('/api/cards', async (req, res) => {
  try {
    const { collection_type, sort_by = 'created_at', condition_simple, is_graded, rarity, min_value, max_value } = req.query;
    const conditions = [];
    const params = [];
    let i = 1;

    if (collection_type)          { conditions.push(`collection_type = $${i++}`);        params.push(collection_type); }
    if (condition_simple)         { conditions.push(`condition_simple = $${i++}`);        params.push(condition_simple); }
    if (is_graded !== undefined)  { conditions.push(`is_graded = $${i++}`);               params.push(is_graded === 'true'); }
    if (rarity)                   { conditions.push(`rarity = $${i++}`);                  params.push(rarity); }
    if (min_value)                { conditions.push(`estimated_value_usd >= $${i++}`);    params.push(parseFloat(min_value)); }
    if (max_value)                { conditions.push(`estimated_value_usd <= $${i++}`);    params.push(parseFloat(max_value)); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const validSorts = ['card_name', 'estimated_value_usd', 'created_at', 'updated_at', 'year'];
    const col = validSorts.includes(sort_by) ? sort_by : 'created_at';
    const dir = col === 'card_name' ? 'ASC' : 'DESC';

    const { rows } = await pool.query(
      `SELECT * FROM cards ${where} ORDER BY ${col} ${dir} NULLS LAST`,
      params,
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err.detail || err.toString() });
  }
});

app.get('/api/cards/search', async (req, res) => {
  try {
    const { q } = req.query;
    const { rows } = await pool.query(
      `SELECT * FROM cards
       WHERE card_name ILIKE $1 OR set_name ILIKE $1 OR notes ILIKE $1
       ORDER BY estimated_value_usd DESC NULLS LAST`,
      [`%${q}%`],
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err.detail || err.toString() });
  }
});

app.get('/api/cards/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cards WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err.detail || err.toString() });
  }
});

app.post('/api/cards', async (req, res) => {
  try {
    const card = serializeValues(req.body);
    const keys = Object.keys(card);
    const values = Object.values(card);
    const placeholders = keys.map((k, idx) =>
      TEXT_ARRAY_FIELDS.has(k) ? `$${idx + 1}::text[]` : `$${idx + 1}`,
    );
    const { rows } = await pool.query(
      `INSERT INTO cards (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values,
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err.detail || err.toString() });
  }
});

app.put('/api/cards/:id', async (req, res) => {
  try {
    const updates = serializeValues(req.body);
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((k, idx) =>
      TEXT_ARRAY_FIELDS.has(k) ? `${k} = $${idx + 1}::text[]` : `${k} = $${idx + 1}`,
    ).join(', ');
    const { rows } = await pool.query(
      `UPDATE cards SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err.detail || err.toString() });
  }
});

app.delete('/api/cards/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cards WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err.detail || err.toString() });
  }
});

app.delete('/api/cards', async (req, res) => {
  try {
    await pool.query('DELETE FROM cards');
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err.detail || err.toString() });
  }
});

// ─── Price Checks ─────────────────────────────────────────────────────────────

app.post('/api/price-checks', async (req, res) => {
  try {
    const pc = serializeValues(req.body);
    const keys = Object.keys(pc);
    const values = Object.values(pc);
    const placeholders = keys.map((_, idx) => `$${idx + 1}`);
    const { rows } = await pool.query(
      `INSERT INTO price_checks (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values,
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err.detail || err.toString() });
  }
});

app.get('/api/price-checks', async (req, res) => {
  try {
    const { card_id } = req.query;
    const { rows } = await pool.query(
      'SELECT * FROM price_checks WHERE card_id = $1 ORDER BY checked_at DESC',
      [card_id],
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err.detail || err.toString() });
  }
});

app.get('/api/price-checks/latest', async (req, res) => {
  try {
    const { card_id, source } = req.query;
    const { rows } = await pool.query(
      'SELECT * FROM price_checks WHERE card_id = $1 AND source = $2 ORDER BY checked_at DESC LIMIT 1',
      [card_id, source],
    );
    res.json(rows[0] ?? null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err.detail || err.toString() });
  }
});

// ─── Snapshots ────────────────────────────────────────────────────────────────

app.post('/api/snapshots', async (req, res) => {
  try {
    const snap = serializeValues(req.body);
    const keys = Object.keys(snap);
    const values = Object.values(snap);
    const placeholders = keys.map((_, idx) => `$${idx + 1}`);
    const { rows } = await pool.query(
      `INSERT INTO collection_snapshots (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values,
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err.detail || err.toString() });
  }
});

app.get('/api/snapshots', async (req, res) => {
  try {
    const { type, limit = '30' } = req.query;
    const params = [];
    let query = 'SELECT * FROM collection_snapshots';
    if (type) { query += ' WHERE collection_type = $1'; params.push(type); }
    query += ` ORDER BY snapshot_date DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit, 10));
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err.detail || err.toString() });
  }
});

app.get('/api/snapshots/latest', async (req, res) => {
  try {
    const { type } = req.query;
    const params = [];
    let query = 'SELECT * FROM collection_snapshots';
    if (type) { query += ' WHERE collection_type = $1'; params.push(type); }
    query += ' ORDER BY snapshot_date DESC LIMIT 1';
    const { rows } = await pool.query(query, params);
    res.json(rows[0] ?? null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err.detail || err.toString() });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CardVault API running on port ${PORT}`));
