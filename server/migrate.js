const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

console.log('Migrating database...');

try {
    // Users table additions
    const userCols = [
        'payment_method TEXT',
        'payment_number TEXT',
        'payment_name TEXT',
        'eggs_today INTEGER DEFAULT 0',
        'last_egg_date TEXT'
    ];

    userCols.forEach(col => {
        try {
            const colName = col.split(' ')[0];
            db.prepare(`ALTER TABLE users ADD COLUMN ${col}`).run();
            console.log(`Added ${colName} to users`);
        } catch (e) {
            if (!e.message.includes('duplicate column')) console.error(e.message);
        }
    });

    // KYC table additions
    const kycCols = [
        'first_name TEXT',
        'last_name TEXT',
        'address TEXT',
        'birthdate TEXT'
    ];

    kycCols.forEach(col => {
        try {
            const colName = col.split(' ')[0];
            db.prepare(`ALTER TABLE kyc ADD COLUMN ${col}`).run();
            console.log(`Added ${colName} to kyc`);
        } catch (e) {
            if (!e.message.includes('duplicate column')) console.error(e.message);
        }
    });

    console.log('Migration complete.');
} catch (e) {
    console.error('Migration failed:', e);
}
