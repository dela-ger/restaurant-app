const express = require('express');
const db = require('../db/conn');
const router = express.Router();

// GET /api/analytics/top-items
router.get('/top-items', (req, res) => {
    console.log('Analytics: fetching top items');

  // optional date range query params ?days=7
  const days = Number(req.query.days) || 365;
  const since = `datetime('now', '-${days} days')`;

  const sql = `
    SELECT m.id AS item_id, m.name, SUM(o.quantity) AS total_qty
    FROM orders o
    JOIN menu_items m ON o.item_id = m.id
    WHERE o.placed_at >= ${since}
    GROUP BY o.item_id
    ORDER BY total_qty DESC
    LIMIT 10
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Analytics top-items error:', err.message);
      return res.status(500).json({ error: 'Failed to get analytics' });
    }
    res.json(rows);

  });
});

module.exports = router;