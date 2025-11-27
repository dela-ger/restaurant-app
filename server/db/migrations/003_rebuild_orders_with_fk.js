const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '..', 'database.sqlite'));

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

(async () => {
  try {
    await run('PRAGMA foreign_keys = OFF'); // required while restructuring
    await run('BEGIN IMMEDIATE TRANSACTION');

    // 1) Backup the old table (for safety)
    await run(`DROP TABLE IF EXISTS orders_backup`);
    await run(`CREATE TABLE orders_backup AS SELECT * FROM orders`);

    // 2) Create the new table with FKs
    //    - FK to menu_items(id)
    //    - (Optional) FK to tables(id) if you have a 'tables' table
    await run(`
      CREATE TABLE orders_new (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        table_id   INTEGER NOT NULL,
        item_id    INTEGER NOT NULL,
        quantity   INTEGER NOT NULL DEFAULT 1,
        status     TEXT    NOT NULL DEFAULT 'pending',
        placed_at  TEXT, -- store as ISO text; set when inserting
        FOREIGN KEY (item_id) REFERENCES menu_items(id) ON UPDATE CASCADE ON DELETE RESTRICT
        -- If you want to enforce table_id too, uncomment the line below
        -- ,FOREIGN KEY (table_id) REFERENCES tables(id) ON UPDATE CASCADE ON DELETE RESTRICT
      );
    `);

    // 3) Copy only valid rows (those that have a matching menu_items.id)
    //    If you also want to enforce valid table IDs, INNER JOIN tables t ON t.id = o.table_id
    await run(`
      INSERT INTO orders_new (id, table_id, item_id, quantity, status, placed_at)
      SELECT o.id, o.table_id, o.item_id, o.quantity, o.status, o.placed_at
      FROM orders o
      INNER JOIN menu_items m ON m.id = o.item_id
    `);

    // 4) Swap tables
    await run(`DROP TABLE orders`);
    await run(`ALTER TABLE orders_new RENAME TO orders`);

    // 5) Helpful indexes
    await run(`CREATE INDEX IF NOT EXISTS idx_orders_item_id ON orders(item_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_orders_placed_at ON orders(placed_at)`);

    await run('COMMIT');
    await run('PRAGMA foreign_keys = ON');

    console.log(' orders table rebuilt with foreign key(s)');
    console.log('ℹ Backup kept in table: orders_backup');
  } catch (err) {
    console.error('Migration failed:', err.message);
    try { await run('ROLLBACK'); } catch {}
  } finally {
    db.close();
  }
})();