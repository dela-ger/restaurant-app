const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/database.sqlite');

db.serialize(() => {
    db.run(`ALTER TABLE menu_items ADD COLUMN image_url TEXT`, (err) => {
        if (err && !/duplicate column name/i.test(err.message)) {
            console.error('Error adding image_url column:', err.message);
        } else {
            console.log('image_url column ready on menu_items');
        }
    });

    //set a default image URL for existing records
    db.run(`UPDATE menu_items
        SET image_url = COALESCE(image_url,
        CASE name
        WHEN 'Burger' THEN '/uploads/sample/burger.jpg'
        WHEN 'Pizza' THEN '/uploads/sample/pizza.jpg'
        WHEN 'Pasta' THEN '/uploads/sample/pasta.jpg'
        END
        )`);
});

db.close();