const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'server', 'database.db'));

try {
    const rows = db.prepare("SELECT * FROM settings").all();
    console.log('Settings Rows:', JSON.stringify(rows, null, 2));
} catch (e) {
    console.error('Error reading settings:', e.message);
}
db.close();
