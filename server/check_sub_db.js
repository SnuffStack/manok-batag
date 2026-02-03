const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

console.log('Checking subscription_requests table columns...');
try {
    const info = db.prepare('PRAGMA table_info(subscription_requests)').all();
    const columns = info.map(c => c.name);
    console.log('Columns:', columns);

    if (!columns.includes('receipt_url')) {
        console.log('Adding receipt_url column...');
        db.prepare('ALTER TABLE subscription_requests ADD COLUMN receipt_url TEXT').run();
        console.log('Column added.');
    } else {
        console.log('receipt_url column exists.');
    }
} catch (e) {
    console.error(e);
}
