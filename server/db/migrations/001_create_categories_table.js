const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database('./db/database.sqlite');

(async () => {
//   const db = new sqlite3.Database(path.join(__dirname, '..', 'database.sqlite'));

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );
    `, (err) => {
      if (err) console.error('CREATE categories table error:', err.message);
      else console.log('categories table ensured');
    });

    db.run(`
      ALTER TABLE menu_items
      ADD COLUMN category_id INTEGER;
    `, (err) => {
      // if “duplicate column name” you can ignore
      if (err && !/duplicate column name/i.test(err.message)) {
        console.error('ALTER menu_items add category_id error:', err.message);
      } else {
        console.log('menu_items.category_id column ensured');
      }
    });
  });

  db.close();
})();  