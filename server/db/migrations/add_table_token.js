const sqlite3 = require('sqlite3').verbose();

(async () => {
  // dynamic import is fine if you're on CJS
  const { customAlphabet } = await import('nanoid');
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 10);

  const db = new sqlite3.Database('./db/database.sqlite');

  const run = (sql, params = []) =>
    new Promise((resolve, reject) => db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    }));

  const all = (sql, params = []) =>
    new Promise((resolve, reject) => db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    }));

  try {
    // 1) Add column if missing (no UNIQUE here)
    const cols = await all(`PRAGMA table_info(tables)`);
    const hasToken = cols.some(c => c.name === 'token');
    if (!hasToken) {
      await run(`ALTER TABLE tables ADD COLUMN token TEXT`);
      console.log('✅ Added tables.token');
    } else {
      console.log('ℹ️ tables.token already exists');
    }

    // 2) Ensure unique index (this is how SQLite enforces uniqueness post-add)
    await run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_tables_token ON tables(token)`);
    console.log('✅ Ensured unique index on tables.token');

    // 3) Backfill tokens where missing
    const rows = await all(`SELECT id, token FROM tables`);
    const missing = rows.filter(r => !r.token);
    if (missing.length) {
      await run('BEGIN');
      for (const r of missing) {
        await run(`UPDATE tables SET token = ? WHERE id = ?`, [nanoid(), r.id]);
      }
      await run('COMMIT');
      console.log(`✅ Backfilled ${missing.length} token(s)`);
    } else {
      console.log('ℹ️ All rows already have tokens');
    }

    console.log('🎉 Migration complete.');
  } catch (e) {
    console.error('❌ Migration failed:', e.message);
    try { await run('ROLLBACK'); } catch {}
  } finally {
    db.close();
  }
})();