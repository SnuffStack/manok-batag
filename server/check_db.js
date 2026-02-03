const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

console.log('Checking users table columns...');
try {
    const info = db.prepare('PRAGMA table_info(users)').all();
    const columns = info.map(c => c.name);
    console.log('Columns:', columns);

    const missing = ['payment_method', 'payment_name', 'payment_number'].filter(c => !columns.includes(c));
    if (missing.length > 0) {
        console.log('MISSING COLUMNS:', missing);
    } else {
        console.log('All required columns present.');
    }
} catch (e) {
    console.error(e);
}
