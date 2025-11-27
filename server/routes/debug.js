const express = require('express');
const db = require('../db/conn');
const router = express.Router();

router.get('/fk', (_req, res) => {
    db.get('PRAGMA foreign_keys', (err, row) => {
        if (err) return res.status(500).json({ error: 'Failed to get foreign key status' });
        res.json(row)
    })
})

module.exports = router;