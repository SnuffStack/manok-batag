const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

console.log('--- KYC TABLE SCHEMA ---');
console.log(JSON.stringify(db.prepare("PRAGMA table_info(kyc)").all(), null, 2));

console.log('\n--- USERS TABLE SCHEMA ---');
console.log(JSON.stringify(db.prepare("PRAGMA table_info(users)").all(), null, 2));

db.close();
