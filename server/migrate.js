const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const dbHelper = require('./db');

const JSON_FILE = path.join(__dirname, 'data.json');
const DB_PATH = path.join(__dirname, 'database.db');

async function migrate() {
    if (!fs.existsSync(JSON_FILE)) {
        console.log('No data.json found. Creating fresh database...');
        dbHelper.init();
        return;
    }

    console.log('Found data.json. Starting migration...');
    const raw = fs.readFileSync(JSON_FILE, 'utf8');
    const data = JSON.parse(raw);

    // Initialize fresh DB (creates tables)
    dbHelper.init();

    const db = new Database(DB_PATH);

    // Migrate Users
    if (data.users && data.users.length > 0) {
        console.log(`Migrating ${data.users.length} users...`);
        const insertUser = db.prepare(`
      INSERT OR REPLACE INTO users (
        id, email, password, bananas, eggs, balance, kyc_status, kyc_submitted, 
        kyc_submitted_at, kyc_approved_at, kyc_rejection_reason, subscription, 
        subscription_purchased_at, referral_code, referred_by, is_admin, role, 
        created_at, last_daily_banana, referrals, admin_granted_at, admin_revoked_at, 
        kyc_document_url, kyc_id_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        for (const u of data.users) {
            insertUser.run(
                u.id, u.email, u.password || null, u.bananas || 0, u.eggs || 0, u.balance || 0,
                u.kyc_status || 'none', u.kyc_submitted ? 1 : 0, u.kyc_submitted_at || null,
                u.kyc_approved_at || null, u.kyc_rejection_reason || null, u.subscription || null,
                u.subscription_purchased_at || null, u.referral_code || null, u.referred_by || null,
                u.is_admin ? 1 : 0, u.role || 'user', u.created_at || new Date().toISOString(),
                u.last_daily_banana || null, u.referrals || 0, u.admin_granted_at || null,
                u.admin_revoked_at || null, u.kyc_document_url || null, u.kyc_id_type || null
            );
        }
    }

    // Migrate KYC
    if (data.kyc && data.kyc.length > 0) {
        console.log(`Migrating ${data.kyc.length} KYC records...`);
        const insertKyc = db.prepare(`
      INSERT OR REPLACE INTO kyc (id, userId, filename, filepath, status, submitted_at, approved_at, rejected_at, rejection_reason, idType)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        for (const k of data.kyc) {
            insertKyc.run(k.id, k.userId, k.filename, k.filepath, k.status || 'pending', k.submitted_at || null, k.approved_at || null, k.rejected_at || null, k.rejection_reason || null, k.idType || null);
        }
    }

    // Migrate Cashouts
    if (data.cashouts && data.cashouts.length > 0) {
        console.log(`Migrating ${data.cashouts.length} cashout requests...`);
        const insertCashout = db.prepare(`
      INSERT OR REPLACE INTO cashouts (id, userId, payment_method, account_details, amount, status, requested_at, approved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        for (const c of data.cashouts) {
            insertCashout.run(c.id, c.userId, c.payment_method, c.account_details, c.amount, c.status || 'pending', c.requested_at || null, c.approved_at || null);
        }
    }

    // Migrate Subscription Requests
    if (data.subscription_requests && data.subscription_requests.length > 0) {
        console.log(`Migrating ${data.subscription_requests.length} subscription requests...`);
        const insertSubReq = db.prepare(`
      INSERT OR REPLACE INTO subscription_requests (id, userId, plan, price, method, refNumber, status, requested_at, processed_at, rejection_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        for (const r of data.subscription_requests) {
            insertSubReq.run(r.id, r.userId, r.plan, r.price, r.method, r.refNumber, r.status || 'pending', r.requested_at || null, r.processed_at || null, r.rejection_reason || null);
        }
    }

    // Migrate Settings
    if (data.settings && data.settings.payment_methods) {
        console.log('Migrating settings...');
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run('payment_methods', JSON.stringify(data.settings.payment_methods));
    }

    console.log('Migration complete! database.db is ready.');
    console.log('You can now safely delete data.json if you wish.');
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
