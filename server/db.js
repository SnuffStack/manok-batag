const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.db');
const db = new Database(DB_PATH);

// Initialize database with tables
function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password TEXT,
      bananas INTEGER DEFAULT 0,
      eggs INTEGER DEFAULT 0,
      balance REAL DEFAULT 0,
      kyc_status TEXT DEFAULT 'none',
      kyc_submitted BOOLEAN DEFAULT 0,
      kyc_submitted_at TEXT,
      kyc_approved_at TEXT,
      kyc_rejection_reason TEXT,
      subscription TEXT,
      subscription_purchased_at TEXT,
      referral_code TEXT UNIQUE,
      referred_by TEXT,
      is_admin BOOLEAN DEFAULT 0,
      role TEXT DEFAULT 'user',
      created_at TEXT,
      last_daily_banana TEXT,
      referrals INTEGER DEFAULT 0,
      admin_granted_at TEXT,
      admin_revoked_at TEXT,
      kyc_document_url TEXT,
      kyc_id_type TEXT
    );

    CREATE TABLE IF NOT EXISTS kyc (
      id TEXT PRIMARY KEY,
      userId TEXT,
      filename TEXT,
      filepath TEXT,
      status TEXT DEFAULT 'pending',
      submitted_at TEXT,
      approved_at TEXT,
      rejected_at TEXT,
      rejection_reason TEXT,
      idType TEXT
    );

    CREATE TABLE IF NOT EXISTS cashouts (
      id TEXT PRIMARY KEY,
      userId TEXT,
      payment_method TEXT,
      account_details TEXT,
      amount REAL,
      status TEXT DEFAULT 'pending',
      requested_at TEXT,
      approved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS subscription_requests (
      id TEXT PRIMARY KEY,
      userId TEXT,
      plan TEXT,
      price REAL,
      method TEXT,
      refNumber TEXT,
      status TEXT DEFAULT 'pending',
      requested_at TEXT,
      processed_at TEXT,
      rejection_reason TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE,
      value TEXT
    );
  `);

  // Seed admin if missing
  const adminCount = db.prepare('SELECT count(*) as count FROM users WHERE role = ?').get('admin').count;
  if (adminCount === 0) {
    const id = Math.random().toString(36).slice(2, 10);
    const referral = generateReferralCode();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (id, email, password, bananas, eggs, balance, kyc_status, referral_code, is_admin, role, created_at)
      VALUES (?, ?, ?, 0, 0, 0, 'approved', ?, 1, 'admin', ?)
    `).run(id, 'parrokitty@gmail.com', 'Ridge1228', referral, now);
    console.log('Seeded SQLite admin user: parrokitty@gmail.com');
  }

  // Ensure default settings exist
  const settingsCount = db.prepare('SELECT count(*) as count FROM settings WHERE key = ?').get('payment_methods').count;
  if (settingsCount === 0) {
    const initialMethods = {
      gcash: { name: 'GCash', number: '09XX-XXX-XXXX', accountName: 'Admin Name' },
      maya: { name: 'Maya', number: '09XX-XXX-XXXX', accountName: 'Admin Name' },
      gotyme: { name: 'GoTyme', number: 'XXXX-XXXX-XXXX', accountName: 'Admin Name' }
    };
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('payment_methods', JSON.stringify(initialMethods));
  }
}

function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getAllUsers() {
  return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
}

function getUserByIdentifier(identifier) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(identifier);
}

function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function updateUser(id, fields) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return getUserById(id);

  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const values = Object.values(fields);
  db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values, id);
  return getUserById(id);
}

function createUser({ id, email, password, bananas = 0, eggs = 0, balance = 0, referral_code = null, referred_by = null }) {
  const uid = id || Math.random().toString(36).slice(2, 10);
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO users (id, email, password, bananas, eggs, balance, referral_code, referred_by, kyc_status, kyc_submitted, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'none', 0, ?)
  `).run(uid, email, password, bananas, eggs, balance, referral_code, referred_by, now);
  return getUserById(uid);
}

function applyReferral(referralCode, newUserId) {
  if (!referralCode) return;
  const ref = db.prepare('SELECT * FROM users WHERE UPPER(referral_code) = ?').get(referralCode.toUpperCase());
  if (!ref) return;

  // Check if referrer is KYC approved
  if (ref.kyc_status !== 'approved') return;

  // Update referrer
  db.prepare('UPDATE users SET bananas = bananas + 1, referrals = referrals + 1 WHERE id = ?').run(ref.id);

  // Update new user
  db.prepare('UPDATE users SET referred_by = ? WHERE id = ?').run(ref.id, newUserId);
}

// Cashout helpers
function createCashout(userId, amount, method, details) {
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');
  if (user.balance < amount) throw new Error('Insufficient balance');

  // Check minimums based on previous cashout count
  const count = db.prepare('SELECT COUNT(*) as count FROM cashouts WHERE userId = ?').get(userId).count;
  let minimum = 200;
  if (!user.subscription || user.subscription === 'None') {
    const mins = [5, 15, 50, 100, 200];
    minimum = mins[count] || 200;
  } else {
    minimum = 0;
  }
  if (amount < minimum) throw new Error(`Minimum cashout is ${minimum}`);

  // Transaction for safety
  const runTransaction = db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, userId);
    const cid = Math.random().toString(36).slice(2, 10);
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO cashouts (id, userId, payment_method, account_details, amount, status, requested_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `).run(cid, userId, method, details, amount, now);
    return cid;
  });

  const cid = runTransaction();
  return db.prepare('SELECT * FROM cashouts WHERE id = ?').get(cid);
}

function getPendingCashouts() {
  return db.prepare("SELECT * FROM cashouts WHERE status = 'pending' ORDER BY requested_at ASC").all();
}

function getAllCashouts() {
  return db.prepare("SELECT * FROM cashouts ORDER BY requested_at DESC").all();
}

function getCashoutsByUser(userId) {
  return db.prepare('SELECT * FROM cashouts WHERE userId = ? ORDER BY requested_at DESC').all(userId);
}

function updateCashoutStatus(id, status, reason) {
  const co = db.prepare('SELECT * FROM cashouts WHERE id = ?').get(id);
  if (!co) return null;

  if (status === 'approved') {
    db.prepare("UPDATE cashouts SET status = 'approved', approved_at = ? WHERE id = ?").run(new Date().toISOString(), id);
  } else if (status === 'rejected') {
    // Refund user balance
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(co.amount, co.userId);
    // Delete record
    db.prepare('DELETE FROM cashouts WHERE id = ?').run(id);
  }
  return db.prepare('SELECT * FROM cashouts WHERE id = ?').get(id); // may return undefined if deleted
}

// KYC helpers
function createKyc({ userId, filename, filepath, details }) {
  const kid = Math.random().toString(36).slice(2, 10);
  const now = new Date().toISOString();

  const { first_name, last_name, address, birthdate } = details || {};

  db.prepare(`
    INSERT INTO kyc (id, userId, filename, filepath, status, submitted_at, first_name, last_name, address, birthdate)
    VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
  `).run(kid, userId, filename, filepath, now, first_name || null, last_name || null, address || null, birthdate || null);

  // update user
  db.prepare(`
    UPDATE users 
    SET kyc_status = 'pending', kyc_submitted = 1, kyc_submitted_at = ?
    WHERE id = ? OR LOWER(email) = ?
  `).run(now, userId, userId.toLowerCase());

  return db.prepare('SELECT * FROM kyc WHERE id = ?').get(kid);
}

function getPendingKyc() {
  return db.prepare("SELECT * FROM kyc WHERE status = 'pending' ORDER BY submitted_at ASC").all();
}

function getAllKyc() {
  return db.prepare("SELECT * FROM kyc ORDER BY submitted_at DESC").all();
}

function getKycByUser(userId) {
  return db.prepare('SELECT * FROM kyc WHERE userId = ? ORDER BY submitted_at DESC LIMIT 1').get(userId);
}

function updateKycStatus(id, status, reason) {
  const k = db.prepare('SELECT * FROM kyc WHERE id = ?').get(id);
  if (!k) return null;
  const now = new Date().toISOString();

  if (status === 'approved') {
    db.prepare("UPDATE kyc SET status = 'approved', approved_at = ? WHERE id = ?").run(now, id);
    db.prepare(`
      UPDATE users SET kyc_status = 'approved', kyc_approved_at = ?, kyc_rejection_reason = NULL 
      WHERE id = ? OR LOWER(email) = ?
    `).run(now, k.userId, k.userId.toLowerCase());
  } else if (status === 'rejected') {
    db.prepare("UPDATE kyc SET status = 'rejected', rejected_at = ?, rejection_reason = ? WHERE id = ?").run(now, reason, id);
    db.prepare(`
      UPDATE users SET kyc_status = 'rejected', kyc_rejection_reason = ? 
      WHERE id = ? OR LOWER(email) = ?
    `).run(reason, k.userId, k.userId.toLowerCase());
  }
  return db.prepare('SELECT * FROM kyc WHERE id = ?').get(id);
}

// Game mechanics
function feedChicken(userId) {
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');
  if (user.bananas < 2) throw new Error('Not enough bananas');

  // Check limits
  const isFree = !user.subscription || user.subscription === 'basic' || user.subscription === 'None';
  if (isFree) { // 'basic' is the 50 peso one, wait, user said "FREE acount 1 egg daily". 
    // Let's assume 'None' is free. 'basic' usually implies paid. 
    // Checking previous code: "basic" is 50 pesos. "None" is default.
    // So Free = 'None' (or null).

    // Using user logic: "on FREE acount 1 egg daily"
    // "on subscriptions: 4 daily bananas" -> implied basic?
    // Let's stick to: if subscription is null/None -> Free.
  }

  // Reload user to be sure (limit checking)
  // Logic: 
  // If Free: Max 1 egg today.

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

  let eggsToday = user.eggs_today || 0;
  const lastDate = user.last_egg_date;

  if (lastDate !== todayStr) {
    eggsToday = 0; // Reset if new day
  }

  const isTrulyFree = !user.subscription || user.subscription === 'None';
  if (isTrulyFree && eggsToday >= 1) {
    throw new Error('Daily egg limit reached for free account. Upgrade to earn more!');
  }

  // Update: -2 bananas, +1 egg (NO BALANCE INCREASE), update daily counters
  db.prepare(`
    UPDATE users 
    SET bananas = bananas - 2, 
        eggs = eggs + 1, 
        eggs_today = ?, 
        last_egg_date = ?
    WHERE id = ?
  `).run((lastDate !== todayStr ? 1 : eggsToday + 1), todayStr, userId);

  return getUserById(userId);
}

function sellEggs(userId, amount) {
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');
  if (user.eggs < amount) throw new Error('Not enough eggs');

  // Logic: 1 egg = 1 Peso (implied from previous "feed 2 bananas get 1 egg, +1 balance")
  const value = amount;

  db.prepare(`
    UPDATE users 
    SET eggs = eggs - ?, 
        balance = balance + ? 
    WHERE id = ?
  `).run(amount, value, userId);

  return getUserById(userId);
}

function claimDailyBonus(userId) {
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');
  if (!user.subscription || user.subscription === 'None') throw new Error('No active subscription');

  const now = new Date();
  const last = user.last_daily_banana ? new Date(user.last_daily_banana) : null;
  if (last && last.getDate() === now.getDate() && last.getMonth() === now.getMonth() && last.getFullYear() === now.getFullYear()) {
    throw new Error('Already claimed today');
  }

  let amount = 0;
  if (user.subscription === 'basic') amount = 4;
  else if (user.subscription === 'premium') amount = 20;
  else if (user.subscription === 'vip') amount = 50;

  if (amount === 0) throw new Error('Subscription has no daily bonus');

  db.prepare('UPDATE users SET bananas = bananas + ?, last_daily_banana = ? WHERE id = ?').run(amount, now.toISOString(), userId);

  return { user: getUserById(userId), added: amount };
}

// Subscription requests
function createSubscriptionRequest(userId, plan, price, method, refNumber, receiptUrl) {
  const rid = Math.random().toString(36).slice(2, 10);
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO subscription_requests (id, userId, plan, price, method, refNumber, receipt_url, status, requested_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(rid, userId, plan, price, method, refNumber, receiptUrl || null, now);
  return db.prepare('SELECT * FROM subscription_requests WHERE id = ?').get(rid);
}

function getPendingSubscriptionRequests() {
  return db.prepare("SELECT * FROM subscription_requests WHERE status = 'pending' ORDER BY requested_at ASC").all();
}

function getAllSubscriptionRequests() {
  return db.prepare("SELECT * FROM subscription_requests ORDER BY requested_at DESC").all();
}

function updateSubscriptionRequestStatus(id, status, reason) {
  const req = db.prepare('SELECT * FROM subscription_requests WHERE id = ?').get(id);
  if (!req) return null;
  const now = new Date().toISOString();

  db.prepare("UPDATE subscription_requests SET status = ?, rejection_reason = ?, processed_at = ? WHERE id = ?").run(status, reason || null, now, id);

  if (status === 'approved') {
    let bonus = 0;
    if (req.plan === 'basic') bonus = 4;
    else if (req.plan === 'premium') bonus = 20;
    else if (req.plan === 'vip') bonus = 50;

    db.prepare('UPDATE users SET subscription = ?, subscription_purchased_at = ?, bananas = bananas + ?, last_daily_banana = ? WHERE id = ?')
      .run(req.plan, now, bonus, now, req.userId);
  }
  return db.prepare('SELECT * FROM subscription_requests WHERE id = ?').get(id);
}

function toggleAdmin(userId, isAdmin) {
  const now = new Date().toISOString();
  if (isAdmin) {
    db.prepare("UPDATE users SET is_admin = 1, role = 'admin', admin_granted_at = ? WHERE id = ?").run(now, userId);
  } else {
    db.prepare("UPDATE users SET is_admin = 0, role = 'user', admin_revoked_at = ? WHERE id = ?").run(now, userId);
  }
  return getUserById(userId);
}

function deleteUser(id) {
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  if (result.changes > 0) {
    db.prepare('DELETE FROM kyc WHERE userId = ?').run(id);
    db.prepare('DELETE FROM cashouts WHERE userId = ?').run(id);
    db.prepare('DELETE FROM subscription_requests WHERE userId = ?').run(id);
    return true;
  }
  return false;
}

function getSettings() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'payment_methods'").get();
  return { payment_methods: row ? JSON.parse(row.value) : {} };
}

function updateSettings(newSettings) {
  const current = getSettings();
  const merged = Object.assign({}, current.payment_methods, newSettings.payment_methods);
  db.prepare("UPDATE settings SET value = ? WHERE key = 'payment_methods'").run(JSON.stringify(merged));
  return { payment_methods: merged };
}

module.exports = {
  init,
  generateReferralCode,
  getAllUsers,
  getUserByIdentifier,
  getUserById,
  createUser,
  applyReferral,
  createCashout,
  getPendingCashouts,
  getAllCashouts,
  getCashoutsByUser,
  updateCashoutStatus,
  createKyc,
  getPendingKyc,
  getAllKyc,
  getKycByUser,
  updateKycStatus,
  feedChicken,
  claimDailyBonus,
  createSubscriptionRequest,
  getPendingSubscriptionRequests,
  getAllSubscriptionRequests,
  updateSubscriptionRequestStatus,
  toggleAdmin,
  deleteUser,
  getSettings,
  updateSettings,
  updateUser,
  sellEggs
};
