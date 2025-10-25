const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

const ALLOWED_STATUSES = ['pending', 'accepted','preparing', 'served', 'cancelled'];
const NEXT_STEPS = {
  pending: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['served', 'cancelled'],
  served: [],
  cancelled: []
}

// const db = new sqlite3.Database('./db/database.sqlite');
const db = require('../db/conn');

function getOrder(id) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT o.id, o.table_id, o.item_id, o.quantity, o.status, m.name, m.price
       FROM orders o JOIN menu_items m ON o.item_id = m.id
       WHERE o.id = ?`,
      [id],
      (err, row) => (err ? reject(err) : resolve(row))
    )
  })
}

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

router.get('/', (_req, res) => {
  db.all(
    `SELECT o.id, o.table_id, o.item_id, o.quantity, o.status, m.name, m.price
     FROM orders o
     JOIN menu_items m ON o.item_id = m.id
     ORDER BY o.id DESC
     LIMIT 200`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to load orders' });
      res.json(rows);
    }
  );
});

//PATCH /api/order/:id — Update order status
router.patch('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body || {};

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid order ID' });
  }
  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
  }

  try {
    const existing = await getOrder(id);
    if (!existing) return res.status(404).json({ error: 'Order not found' });

    const allowedNext = NEXT_STEPS[existing.status] || [];
    if (!allowedNext.includes(status) && existing.status !== status) {
      return res.status(409).json({
        error: `Illegal transition from "${existing.status}" to "${status}". Allowed next: [${allowedNext.json(', ') || '__'}]`
      });
    }

    db.run(`UPDATE orders SET status = ? WHERE id = ?`, [status, id], async (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update order status' });
      const updated = await getOrder(id);
      res.json(updated);
    });
  }catch (e) {
    console.error(e) 
    res.status(500).json({ error: 'Internal server error' })
    
  }
})

module.exports = router;