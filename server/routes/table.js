const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { generateQrPng } = require('../utils/qrGenerator');

const router = express.Router();
const db = new sqlite3.Database('./db/database.sqlite');

// POST /api/table/call-waiter — Notify waiter
router.post('/call-waiter', (req, res) => {
  const { table_id } = req.body || {};
  if (!Number.isInteger(table_id)) {
    return res.status(400).json({ error: 'Missing or invalid table_id. Send { "table_id": 1 }' });
  }
  console.log(`🛎️ Waiter requested at table ${table_id}`);
  return res.json({ message: 'Waiter has been notified.' });
});

// GET /api/table/stations — list all tables with tokens and preview URLs
router.get('/stations', (req, res) => {
  db.all(`SELECT id, table_number, token FROM tables ORDER BY table_number ASC`, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to load stations' });

    // BASE_URL is your frontend menu route, e.g. http://localhost:3000/menu
    const base = process.env.BASE_URL?.replace(/\/+$/, '') || 'http://localhost:3000/menu';
    const data = rows.map(r => ({
      id: r.id,
      table_number: r.table_number,
      token: r.token,
      url: `${base}?t=${encodeURIComponent(r.token)}`
    }));
    res.json(data);
  });
});

// POST /api/table/generate-qr — (re)generate QR codes for all tables
router.post('/generate-qr', async (req, res) => {
  const base = process.env.BASE_URL?.replace(/\/+$/, '') || 'http://localhost:3000/menu';
  db.all(`SELECT id, table_number, token FROM tables ORDER BY table_number ASC`, async (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to load tables' });

    try {
      const files = [];
      for (const r of rows) {
        const url = `${base}?t=${encodeURIComponent(r.token)}`;
        const filename = `table-${r.table_number}.png`;
        await generateQrPng({ filename, url });
        files.push({ table_number: r.table_number, filename, url, png: `/qrcodes/${filename}` });
      }
      res.json({ message: 'QR codes generated', files });
    } catch (e) {
      console.error('QR generation error:', e);
      res.status(500).json({ error: 'QR generation failed' });
    }
  });
});

// GET /api/table/:tableNumber/qr — generate (or overwrite) a single table’s QR and return PNG path
router.get('/:tableNumber/qr', (req, res) => {
  const tableNumber = parseInt(req.params.tableNumber, 10);
  if (!Number.isInteger(tableNumber)) return res.status(400).json({ error: 'Invalid table number' });

  const base = process.env.BASE_URL?.replace(/\/+$/, '') || 'http://localhost:3000/menu';
  db.get(`SELECT token FROM tables WHERE table_number = ?`, [tableNumber], async (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(404).json({ error: 'Table not found' });

    const url = `${base}?t=${encodeURIComponent(row.token)}`;
    const filename = `table-${tableNumber}.png`;

    try {
      await generateQrPng({ filename, url });
      res.json({ table_number: tableNumber, url, png: `/qrcodes/${filename}` });
    } catch (e) {
      console.error('QR create error:', e);
      res.status(500).json({ error: 'Failed to create QR' });
    }
  });
});

// GET /api/table/resolve/:token — resolve a token to table info (used by frontend on QR scan)
router.get('/resolve/:token', (req, res) => {
  const { token } = req.params;
  db.get(
    `SELECT id as table_id, table_number, token FROM tables WHERE token = ?`,
    [token],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!row) return res.status(404).json({ error: 'Invalid token' });
      res.json(row);
    }
    );
});

module.exports = router;