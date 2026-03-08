const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'server', 'database.db');
const db = new Database(dbPath);

process.on('uncaughtException', (err) => {
    fs.writeFileSync('f:/manok-batag/db_check_error.log', err.message + '\n' + err.stack);
    process.exit(1);
});

const fs = require('fs');

try {
    const row = db.prepare("SELECT * FROM settings WHERE key = 'withdrawals_enabled'").get();
    const rows = db.prepare("SELECT * FROM settings").all();
    const output = {
        setting: row,
        all_settings: rows
    };
    fs.writeFileSync('f:/manok-batag/db_check_output.json', JSON.stringify(output, null, 2));
    console.log('DB check successful.');
} catch (e) {
    fs.writeFileSync('f:/manok-batag/db_check_error.log', e.message);
    console.error('Error reading DB:', e.message);
} finally {
    db.close();
}
