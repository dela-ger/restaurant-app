const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath, err => {
    err ? console.error('SQLite open error:', err.message) 
    : console.log('Connected to SQLite database.');
})

db.exec(`PRAGMA foreign_keys = ON`);
module.exports = db;