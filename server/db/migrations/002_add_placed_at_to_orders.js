const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database('./db/database.sqlite');

db.serialize(() => {
    db.run(`
        ALTER TABLE orders ADD COLUMN placed_at TEXT    
    `, (err) => {
        if (err && !/duplicate column name/i.test(err.message)) {
            return console.error('Error adding placed_at column:', err.message);
        } 
            console.log('placed_at column ready on orders (or already exists)');

        db.run(
            `UPDATE orders SET placed_at = datetime('now') WHERE placed_at IS NULL`,
            (updateErr) => {
                if (updateErr) {
                    console.error('Failed to backfill placed_at:', updateErr.message);
                } else {
                    console.log('Backfilled placed_at for existing orders');
                }
            }
        );
    });
});
db.close();