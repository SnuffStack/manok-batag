const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'server', 'database.db');
const db = new Database(dbPath);

try {
    const row = db.prepare("SELECT * FROM settings WHERE key = 'withdrawals_enabled'").get();
    console.log('Current withdrawals_enabled setting in DB:', row);
} catch (e) {
    console.error('Error reading DB:', e.message);
} finally {
    db.close();
}
