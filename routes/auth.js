const fs = require('fs');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const router = express.Router();

const db = new sqlite3.Database('data.db', (err) => {
    if (err) {
      console.error('Error connecting to database:', err.message);
    } else {
      console.log('Connected to database SQLite.');
    }
});

db.run(`
    CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT,
        state TEXT,
        error TEXT
    )
`, (err) => {
    if (err) {
        console.error('Error during creation table:', err);
    }
});

router.get('/callback', (req, res) => {
    res.render('callback', { title: 'OAuth Callback' });
});

router.post('/save-token', (req, res, next) => {
    const { token = "", state = "", error = "" } = req.body;
    const sqlInsert = `INSERT INTO tokens (token, state, error) VALUES (?, ?, ?)`;
    db.run(sqlInsert, [token, state, error || null], (err) => {
      if (err) {
        console.error('Database write error:', err.message);
      }
      res.send(`Data saved!`);
    });
});

router.get('/get-token', (req, res) => {
    const { state } = req.query;

    if (!state) {
        return res.status(400).json({ error: 'need a state param' });
    }

    let attempts = 0;
    const maxAttempts = 30;

    const intervalId = setInterval(() => {
        db.get('SELECT * FROM tokens WHERE state = ?', [state], (err, row) => {
            if (err) {
                console.error('Database query error:', err);
                clearInterval(intervalId);
                return res.status(500).json({ error: 'Database error' });
            }

            if (row) {
                db.run('DELETE FROM tokens WHERE id = ?', [row.id], () => {
                    clearInterval(intervalId);
                    return res.json({ token: row.token });
                });
            } else {
                attempts++;
                if (attempts >= maxAttempts) {
                    clearInterval(intervalId);
                    return res.status(404).json({ error: 'Token not found within 30 seconds' });
                }
            }
        });
    }, 1000);
});

router.get('/list', (req, res) => {
    db.all('SELECT * FROM tokens', [], (_, rows) => {
        res.send(`<pre>${JSON.stringify(rows, null, 2)}</pre>`);
    });
});

router.get('/logs', (req, res) => {
    db.all('SELECT * FROM logs ORDER BY created_at DESC', (_, rows) => {
      res.send(`<pre>${JSON.stringify(rows, null, 2)}</pre>`);
    });
});

module.exports = router;
