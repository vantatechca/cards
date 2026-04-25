require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'cardvault-jwt-secret';

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

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Health check
app.get('/health', (_, res) => res.json({ ok: true }));

// ─── Auth ─────────────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows[0]) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email.toLowerCase(), password_hash, name ?? null],
    );
    const user = rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// ─── TCG Price Lookup Proxy ───────────────────────────────────────────────────

app.get('/api/tcgpricelookup/search', async (req, res) => {
  try {
    const params = new URLSearchParams(req.query);
    const response = await fetch(`https://tcgpricelookup.com/api/cards/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${process.env.TCGPRICELOOKUP_KEY}`,
        'Accept': 'application/json',
      },
    });
    const text = await response.text();
    if (text.trim().startsWith('<')) {
      console.error('TCG Price Lookup returned HTML — check API key/endpoint');
      return res.status(502).json({ error: 'Invalid response from TCG Price Lookup' });
    }
    res.status(response.status).json(JSON.parse(text));
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
    const text = await response.text();
    if (text.trim().startsWith('<')) {
      console.error('TCG API returned HTML — check API key/endpoint');
      return res.status(502).json({ error: 'Invalid response from TCG API' });
    }
    res.status(response.status).json(JSON.parse(text));
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

// ─── Cards (protected) ────────────────────────────────────────────────────────

app.get('/api/cards', authenticateToken, async (req, res) => {
  try {
    const { collection_type, sort_by = 'created_at', condition_simple, is_graded, rarity, min_value, max_value } = req.query;
    const conditions = [];
    const params = [];
    let i = 1;

    // Always filter by the authenticated user
    conditions.push(`user_id = $${i++}`);
    params.push(req.user.id);

    if (collection_type)          { conditions.push(`collection_type = $${i++}`);        params.push(collection_type); }
    if (condition_simple)         { conditions.push(`condition_simple = $${i++}`);        params.push(condition_simple); }
    if (is_graded !== undefined)  { conditions.push(`is_graded = $${i++}`);               params.push(is_graded === 'true'); }
    if (rarity)                   { conditions.push(`rarity = $${i++}`);                  params.push(rarity); }
    if (min_value)                { conditions.push(`estimated_value_usd >= $${i++}`);    params.push(parseFloat(min_value)); }
    if (max_value)                { conditions.push(`estimated_value_usd <= $${i++}`);    params.push(parseFloat(max_value)); }

    const where = `WHERE ${conditions.join(' AND ')}`;
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

app.get('/api/cards/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    const { rows } = await pool.query(
      `SELECT * FROM cards
       WHERE (card_name ILIKE $1 OR set_name ILIKE $1 OR notes ILIKE $1) AND user_id = $2
       ORDER BY estimated_value_usd DESC NULLS LAST`,
      [`%${q}%`, req.user.id],
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err.detail || err.toString() });
  }
});

app.get('/api/cards/:id', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM cards WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err.detail || err.toString() });
  }
});

app.post('/api/cards', authenticateToken, async (req, res) => {
  try {
    const card = serializeValues({ ...req.body, user_id: req.user.id });
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

app.put('/api/cards/:id', authenticateToken, async (req, res) => {
  try {
    const updates = serializeValues(req.body);
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((k, idx) =>
      TEXT_ARRAY_FIELDS.has(k) ? `${k} = $${idx + 1}::text[]` : `${k} = $${idx + 1}`,
    ).join(', ');
    const { rows } = await pool.query(
      `UPDATE cards SET ${setClause} WHERE id = $${keys.length + 1} AND user_id = $${keys.length + 2} RETURNING *`,
      [...values, req.params.id, req.user.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err.detail || err.toString() });
  }
});

app.delete('/api/cards/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM cards WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err.detail || err.toString() });
  }
});

app.delete('/api/cards', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM cards WHERE user_id = $1', [req.user.id]);
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
