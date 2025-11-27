const express = require('express');
const router = express.Router();

const db = require('../db/conn'); // shared SQLite connection

/* ----------------------------- status rules ----------------------------- */
const ALLOWED_STATUSES = ['pending', 'accepted', 'preparing', 'served', 'cancelled'];
const NEXT_STEPS = {
  pending:    ['accepted', 'cancelled'],
  accepted:   ['preparing', 'cancelled'],
  preparing:  ['served', 'cancelled'],
  served:     [],
  cancelled:  [],
};

/* ----------------------------- helpers ----------------------------- */
// return one order row (joins name/price for convenience)
function getOrder(id) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT o.id, o.table_id, o.item_id, o.quantity, o.status, m.name, m.price
       FROM orders o
       JOIN menu_items m ON o.item_id = m.id
       WHERE o.id = ?`,
      [id],
      (err, row) => (err ? reject(err) : resolve(row))
    );
  });
}

/* ----------------------------- create ----------------------------- */
/**
 * POST /api/order
 * Body: { table_id, items: [{ item_id, quantity }, ...] }
 * Inserts one row per item into "orders".
 */
router.post('/', (req, res) => {
  const { table_id, items } = req.body; // items = [{ item_id, quantity }]
  if (!table_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing table_id or items' });
  }

  const stmt = db.prepare(
    `INSERT INTO orders (table_id, item_id, quantity, placed_at) VALUES (?, ?, ?, datetime('now'))`
  );

  let hadError = false;
  items.forEach(({ item_id, quantity }) => {
    stmt.run(table_id, item_id, quantity, (err) => {
      if (err) {
        hadError = true;
        console.error('Error placing order:', err.message);
      }
    });
  });

  stmt.finalize((err) => {
    if (err || hadError) return res.status(500).json({ error: 'Order failed' });

    const io = req.app.get('io');
    if (io) io.emit('order:new', {
      table_id,
      items
    })
    res.json({ message: 'Order placed successfully' });
  });
});

/* ----------------------------- reads ------------------------------ */
/**
 * GET /api/order
 * Most recent 200 order rows (one per line item).
 */
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

/**
 * GET /api/order/:tableId
 * All orders for a given table.
 */
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

/* ----------------------------- update ----------------------------- */
/**
 * PATCH /api/order/:id
 * Body: { status }
 * Enforces legal status transitions.
 */
router.patch('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body || {};

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid order ID' });
  }
  if (!ALLOWED_STATUSES.includes(
status)) {

    return res
      .status(400)
      .json({ error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
  }

  try {
    const existing = await getOrder(id);
    if (!existing) return res.status(404).json({ error: 'Order not found' });

    const allowedNext = NEXT_STEPS[existing.status] || [];
    if (!allowedNext.includes(status) && existing.status !== status) {
      const allowedLabel = allowedNext.length ? allowedNext.join(', ') : '__';
      return res.status(409).json({
        error: `Illegal transition from "${existing.status}" to "${status}". Allowed next: [${allowedLabel}]`,
      });
    }

    db.run(`UPDATE orders SET status = ? WHERE id = ?`, [status, id], async (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update order status' });
      const updated = await getOrder(id);

      const io = req.app.get('io');
      if (io) io.emit('order:status', {
        id,
        status,
        table_id: updated?.table_id ?? null
      })
      res.json(updated);
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ----------------------------- deletes ---------------------------- */
/**
 * DELETE /api/order/cleanup
 * - ?status=served,cancelled   -> delete all orders with those statuses
 * - ?all=true                  -> delete ALL orders (⚠ irreversible)
 * NOTE: Must come BEFORE '/:orderId' so "cleanup" isn't treated as an id.
 */
router.delete('/cleanup', (req, res) => {
  const { all, status } = req.query;

  // delete ALL rows
  if (all === 'true') {
    db.run(`DELETE FROM orders`, [], function (err) {
      if (err) return res.status(500).json({ error: 'Failed to delete all orders' });
      return res.json({ deletedOrders: this.changes || 0 });
    });
    return;
  }

  // delete by statuses (supports comma-separated or repeated params)
  if (status) {
    const statuses = Array.isArray(status)
      ? status
      : String(status).split(',').map(s => s.trim()).filter(Boolean);

    if (!statuses.length) return res.status(400).json({ error: 'Empty status filter' });

    const placeholders = statuses.map(() => '?').join(',');
    db.run(
      `DELETE FROM orders WHERE status IN (${placeholders})`,
      statuses,
      function (err) {
        if (err) return res.status(500).json({ error: 'Failed to delete by status' });
        return res.json({ deletedOrders: this.changes || 0, statuses });
      }
    );
    return;
  }

  return res.status(400).json({ error: 'Provide ?status=served,cancelled or ?all=true' });
});

/**
 * DELETE /api/order/:orderId
 * Deletes a single order row (one line item).
 */
router.delete('/:orderId', (req, res) => {
  const orderId = Number(req.params.orderId);
  if (!Number.isInteger(orderId)) return res.status(400).json({ error: 'Invalid order id' });

  db.run(`DELETE FROM orders WHERE id = ?`, [orderId], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete order' });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deletedOrderId: orderId });
  });
});

module.exports = router;