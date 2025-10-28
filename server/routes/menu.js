const express = require('express');
const db = require('../db/conn'); // shared SQLite connection
const router = express.Router();

/* helpers */
function tableExists(name) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [name],
      (err, row) => err ? reject(err) : resolve(!!row));
  });
}
function columnExists(table, column) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${table})`, (err, rows) => {
      if (err) return reject(err);
      resolve(rows.some(r => r.name === column));
    });
  });
}

/* GET /api/menu (schema-aware) */
router.get('/', async (_req, res) => {
  try {
    const hasCategories = await tableExists('categories');
    const hasImageUrl  = await columnExists('menu_items', 'image_url');

    const imageSel = hasImageUrl ? 'm.image_url,' : '';
    const catSel   = hasCategories
      ? 'COALESCE(c.name, m.category) AS category, m.category_id'
      : 'm.category AS category, NULL AS category_id';
    const joinCat  = hasCategories ? 'LEFT JOIN categories c ON c.id = m.category_id' : '';

    const sql = `
      SELECT m.id, m.name, m.description, m.price, ${imageSel} ${catSel}
      FROM menu_items m
      ${joinCat}
      ORDER BY category, m.name
    `;

    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Menu SQL error:', err.message);
        return res.status(500).json({ error: 'Failed to fetch menu' });
      }
      res.json(rows);
    });
  } catch (e) {
    console.error('Menu route error:', e.message);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

/* GET /api/menu/categories (safe if table missing) */
router.get('/categories', async (_req, res) => {
  try {
    const hasCategories = await tableExists('categories');
    if (!hasCategories) return res.json([]);
    db.all(`SELECT id, name FROM categories ORDER BY name`, [], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch categories' });
      res.json(rows);
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/* GET /api/menu/:id */
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
  db.get(`SELECT * FROM menu_items WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});

/* POST /api/menu — create item (schema-aware) */
router.post('/', (req, res) => {
  const { name, description, price, image_url, category_id, category } = req.body || {};
  if (!name || typeof price !== 'number' || Number.isNaN(price)) {
    return res.status(400).json({ error: 'name and numeric price are required' });
  }

  db.all(`PRAGMA table_info(menu_items)`, (piErr, cols) => {
    if (piErr) {
      console.error('PRAGMA error:', piErr.message);
      return res.status(500).json({ error: 'DB schema error' });
    }
    const have = new Set(cols.map(c => c.name));

    const fields = ['name', 'description', 'price'];
    const values = [name, description || '', price];

    if (have.has('image_url') && image_url !== undefined) { fields.push('image_url'); values.push(image_url); }
    if (have.has('category_id') && category_id !== undefined) { fields.push('category_id'); values.push(category_id); }
    if (have.has('category') && category !== undefined) { fields.push('category'); values.push(category); }

    const placeholders = fields.map(() => '?').join(', ');
    const sql = `INSERT INTO menu_items (${fields.join(', ')}) VALUES (${placeholders})`;

    db.run(sql, values, function (insErr) {
      if (insErr) {
        console.error('POST /api/menu insert error:', insErr.message);
        return res.status(500).json({ error: 'Insert failed' });
      }
      db.get(`SELECT * FROM menu_items WHERE id = ?`, [this.lastID], (selErr, row) => {
        if (selErr) return res.status(500).json({ error: 'Load failed' });
        res.json(row);
      });
    });
  });
});

/* PATCH /api/menu/:id — schema-aware partial update */
router.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

  const { name, description, price, image_url, category_id, category } = req.body || {};

  db.get(`SELECT id FROM menu_items WHERE id = ?`, [id], (selErr, row) => {
    if (selErr) {
      console.error('PATCH select error:', selErr.message);
      return res.status(500).json({ error: 'DB error' });
    }
    if (!row) return res.status(404).json({ error: 'Not found' });

    db.all(`PRAGMA table_info(menu_items)`, (piErr, cols) => {
      if (piErr) {
        console.error('PRAGMA error:', piErr.message);
        return res.status(500).json({ error: 'DB schema error' });
      }
      const have = new Set(cols.map(c => c.name));

      const sets = [];
      const params = [];

      if (name !== undefined && have.has('name')) { sets.push('name = COALESCE(?, name)'); params.push(name); }
      if (description !== undefined && have.has('description')) { sets.push('description = COALESCE(?, description)'); params.push(description); }
      if (price !== undefined && have.has('price')) { sets.push('price = COALESCE(?, price)'); params.push(typeof price === 'number' ? price : null); }
      if (image_url !== undefined && have.has('image_url')) { sets.push('image_url = COALESCE(?, image_url)'); params.push(image_url); }
      if (category_id !== undefined && have.has('category_id')) { sets.push('category_id = COALESCE(?, category_id)'); params.push(category_id); }
      if (category !== undefined && have.has('category')) { sets.push('category = COALESCE(?, category)'); params.push(category); }

      if (!sets.length) return res.status(400).json({ error: 'No updatable fields found in schema' });

      const sql = `UPDATE menu_items SET ${sets.join(', ')} WHERE id = ?`;
      params.push(id);

      db.run(sql, params, function (updErr) {
        if (updErr) {
          console.error('PATCH update error:', updErr.message);
          return res.status(500).json({ error: 'update failed' });
        }
        db.get(`SELECT * FROM menu_items WHERE id = ?`, [id], (getErr, updated) => {
          if (getErr) return res.status(500).json({ error: 'reload failed' });

          res.json(updated);
        });
      });
    });
  });
});

module.exports = router;