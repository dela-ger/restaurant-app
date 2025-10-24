const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

const db = new sqlite3.Database('./db/database.sqlite');

// GET /api/menu — now join category name too
router.get('/', (_req, res) => {
  db.all(`
    SELECT m.id, m.name, m.description, m.price, m.image_url,
           COALESCE(c.name, m.category) AS category, m.category_id
    FROM menu_items m
    LEFT JOIN categories c ON c.id = m.category_id
    ORDER BY category, name
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch menu' });
    res.json(rows);
  });
});

// GET /api/menu/categories — list categories
router.get('/categories', (_req, res) => {
  db.all(`SELECT id, name FROM categories ORDER BY name`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch categories' });
    res.json(rows);
  });
});

// POST /api/menu — create item
router.post('/', (req, res) => {
  const { name, description, price, image_url, category_id, category } = req.body || {};
  if (!name || typeof price !== 'number') {
    return res.status(400).json({ error: 'name and price are required' });
  }

  const insert = () => {
    db.run(`
      INSERT INTO menu_items (name, description, price, image_url, category_id, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, description || '', price, image_url || null, category_id || null, category || null],
    function (err) {
      if (err) return res.status(500).json({ error: 'Insert failed' });
      db.get(`SELECT * FROM menu_items WHERE id = ?`, [this.lastID], (_e, row) => res.json(row));
    });
  };

  // if category_id not provided but category name is, ensure it exists/resolve id
  if (!category_id && category) {
    db.run(`INSERT OR IGNORE INTO categories (name) VALUES (?)`, [category], function (err) {
      if (err) return res.status(500).json({ error: 'Category create failed' });
      db.get(`SELECT id FROM categories WHERE name = ?`, [category], (e2, cRow) => {
        if (e2) return res.status(500).json({ error: 'Category resolve failed' });
        req.body.category_id = cRow?.id || null;
        insert();
      });
    });
  } else {
    insert();
  }
});

// PATCH /api/menu/:id — update item
router.patch('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

  const { name, description, price, image_url, category_id, category } = req.body || {};

  const doUpdate = (catId) => {
    db.run(`
      UPDATE menu_items
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          price = COALESCE(?, price),
          image_url = COALESCE(?, image_url),
          category_id = COALESCE(?, category_id),
          category = COALESCE(?, category)
      WHERE id = ?
    `, [name ?? null, description ?? null, price ?? null, image_url ?? null, catId ?? category_id ?? null, category ?? null, id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Update failed' });
      db.get(`SELECT * FROM menu_items WHERE id = ?`, [id], (_e, row) => res.json(row));
    });
  };

  if (!category_id && category) {
    db.run(`INSERT OR IGNORE INTO categories (name) VALUES (?)`, [category], function (err) {
      if (err) return res.status(500).json({ error: 'Category create failed' });
      db.get(`SELECT id FROM categories WHERE name = ?`, [category], (e2, cRow) => {
        if (e2) return res.status(500).json({ error: 'Category resolve failed' });
        doUpdate(cRow?.id);
      });
    });
  } else {
    doUpdate();
  }
});

module.exports = router;