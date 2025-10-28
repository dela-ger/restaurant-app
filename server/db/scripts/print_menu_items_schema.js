const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '..', 'database.sqlite'));

db.all('PRAGMA table_info(menu_items);', (err, rows) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('menu_items schema:');
    rows.forEach(r => console.log(`- ${r.name} (${r.type})`));
  }
  db.close();
});