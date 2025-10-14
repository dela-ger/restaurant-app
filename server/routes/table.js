const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

const db = new sqlite3.Database('./db/database.sqlite');

// POST /api/table/call-waiter — Notify waiter
router.post('/call-waiter', (req, res) => {
  const { table_id } = req.body;

  if (!table_id) return res.status(400).json({ error: 'Missing table_id' });

  // Here we could log this request or trigger a staff notification
  console.log(`🛎️ Waiter requested at table ${table_id}`);
  res.json({ message: 'Waiter has been notified.' });
});

module.exports = router;