const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'server', 'database.db');
const db = new Database(dbPath);
const fs = require('fs');

try {
    const tableInfo = db.prepare("PRAGMA table_info(settings)").all();
    const indexList = db.prepare("PRAGMA index_list(settings)").all();
    const allRows = db.prepare("SELECT * FROM settings WHERE key = 'withdrawals_enabled'").all();

    const output = {
        tableInfo,
        indexList,
        rows: allRows
    };
    fs.writeFileSync('f:/manok-batag/db_schema_check.json', JSON.stringify(output, null, 2));
    console.log('Schema check successful.');
} catch (e) {
    fs.writeFileSync('f:/manok-batag/db_schema_check_error.log', e.message);
} finally {
    db.close();
}
