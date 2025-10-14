const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

const db = new sqlite3.Database('./db/database.sqlite');

// Get all menu items
router.get('/', (req, res) => {
    db.all('SELECT * FROM menu_items', [], (err, rows) => {
        if (err) {
            console.error('Error fetching menu items:', err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(rows);
    })
})

module.exports = router;