const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/database.sqlite');

db.serialize(() => {
    // --- Create tables ---
    db.run(`CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_number INTEGER UNIQUE NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_id INTEGER,
        item_id INTEGER,
        quantity INTEGER,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY(table_id) REFERENCES tables(id),
        FOREIGN KEY(item_id) REFERENCES menu_items(id)
    )`);

    // --- Insert sample menu items ---
    const sampleMenu = [
        ['Margherita Pizza', 'Classic pizza with tomato sauce, mozzarella, and basil', 8.99, 'Main Course'],
        ['Caesar Salad', 'Crisp romaine lettuce with Caesar dressing, croutons, and Parmesan cheese', 6.49, 'Appetizer'],
        ['Spaghetti Carbonara', 'Pasta with eggs, cheese, pancetta, and pepper', 10.99, 'Main Course'],
        ['Tiramisu', 'Coffee-flavored Italian dessert with mascarpone cheese and cocoa', 5.99, 'Dessert']
    ];

    const insertMenu = db.prepare(`INSERT OR IGNORE INTO menu_items (name, description, price, category) VALUES (?, ?, ?, ?)`);

    sampleMenu.forEach(item => {
        insertMenu.run(item, (err) => {
            if (err) console.error('Error inserting menu item:', err.message);
        });
    });

    insertMenu.finalize();

    // --- Seed table numbers ---
    const insertTable = db.prepare(`INSERT OR IGNORE INTO tables (table_number) VALUES (?)`);
    for (let i = 1; i <= 10; i++) {
        insertTable.run(i, (err) => {
            if (err) console.error('Error inserting table:', err.message);
        });
    }

    insertTable.finalize();

    console.log('Database initialized with tables and sample data.');
});

db.close();
