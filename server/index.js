require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

function serializeValues(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      v !== null && typeof v === 'object' ? JSON.stringify(v) : v,
    ]),
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Health check
app.get('/health', (_, res) => res.json({ ok: true }));

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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cards/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cards WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cards', async (req, res) => {
  try {
    const card = serializeValues(req.body);
    const keys = Object.keys(card);
    const values = Object.values(card);
    const placeholders = keys.map((_, idx) => `$${idx + 1}`);
    const { rows } = await pool.query(
      `INSERT INTO cards (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values,
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/cards/:id', async (req, res) => {
  try {
    const updates = req.body;
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((k, idx) => `${k} = $${idx + 1}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE cards SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cards/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cards WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cards', async (req, res) => {
  try {
    await pool.query('DELETE FROM cards');
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CardVault API running on port ${PORT}`));
