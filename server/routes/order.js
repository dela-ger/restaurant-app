const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

const db = new sqlite3.Database('./db/database.sqlite');

// POST /api/order — Place a new order
router.post('/', (req, res) => {
  const { table_id, items } = req.body; // items = [{ item_id, quantity }]
 
  if (!table_id || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Missing table_id or items' });
  }

  const stmt = db.prepare(
    `INSERT INTO orders (table_id, item_id, quantity) VALUES (?, ?, ?)`
  );

  items.forEach(({ item_id, quantity }) => {
    stmt.run(table_id, item_id, quantity, (err) => {
      if (err) {
        console.error('Error placing order:', err.message);
      }
    });
  });

  stmt.finalize((err) => {
    if (err) return res.status(500).json({ error: 'Order failed' });
    res.json({ message: 'Order placed successfully' });
  });
});

// GET /api/order/:tableId — Get orders for a table
router.get('/:tableId', (req, res) => {
  const tableId = req.params.tableId;

  db.all(
    `SELECT o.id, o.quantity, o.status, m.name, m.price
     FROM orders o
     JOIN menu_items m ON o.item_id = m.id
     WHERE o.table_id = ?`,
    [tableId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching orders:', err.message);
        return res.status(500).json({ error: 'Failed to get orders' });
      }
      res.json(rows);
    }
  );
});

module.exports = router;