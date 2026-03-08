require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');

const db = require('./db');

// Initialize database
db.init();

// Auto-run migrations to ensure schema is up to date
try {
    const Database = require('better-sqlite3');
    const migDb = new Database(process.env.DB_PATH || path.join(__dirname, 'database.db'));

    const migrations = [
        // Users table additions
        'ALTER TABLE users ADD COLUMN payment_method TEXT',
        'ALTER TABLE users ADD COLUMN payment_number TEXT',
        'ALTER TABLE users ADD COLUMN payment_name TEXT',
        'ALTER TABLE users ADD COLUMN eggs_today INTEGER DEFAULT 0',
        'ALTER TABLE users ADD COLUMN last_egg_date TEXT',
        'ALTER TABLE users ADD COLUMN kyc_approved_at TEXT',
        'ALTER TABLE users ADD COLUMN kyc_rejection_reason TEXT',
        'ALTER TABLE users ADD COLUMN kyc_document_url TEXT',
        'ALTER TABLE users ADD COLUMN kyc_id_type TEXT',
        // KYC table additions
        'ALTER TABLE kyc ADD COLUMN first_name TEXT',
        'ALTER TABLE kyc ADD COLUMN last_name TEXT',
        'ALTER TABLE kyc ADD COLUMN address TEXT',
        'ALTER TABLE kyc ADD COLUMN birthdate TEXT',
        'ALTER TABLE kyc ADD COLUMN idNumber TEXT',
        'ALTER TABLE kyc ADD COLUMN idType TEXT',
        'ALTER TABLE users ADD COLUMN referral_bonus_given INTEGER DEFAULT 0',
        'ALTER TABLE users ADD COLUMN has_subscribed INTEGER DEFAULT 0',
        'ALTER TABLE users ADD COLUMN manual_activation INTEGER DEFAULT 0'
    ];

    migrations.forEach(sql => {
        try { migDb.prepare(sql).run(); } catch (e) { /* column likely already exists */ }
    });

    migDb.close();
    console.log('Database migrations applied.');
} catch (e) {
    console.log('Migration check:', e.message);
}

const app = express();
const PORT = process.env.PORT || 4500;
const IS_PROD = process.env.NODE_ENV === 'production';

// Security & Performance Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Set to false if you have external scripts (like Google Fonts)
}));
app.use(compression());
app.use(cors());
app.use(morgan(IS_PROD ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate Limiting for Auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per window
    message: { error: 'Too many attempts, please try again after 15 minutes' }
});

// Serve static files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir, { maxAge: '1d' }));

// Also serve the public folder for static assets like icon and sounds
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve built frontend in production
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
} else {
    // Fallback for development if serving from parent
    app.use(express.static(path.join(__dirname, '..')));
}

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ─── STATUS ─────────────────────────────────────────────
app.get('/api/_status', (req, res) => {
    res.json({ ok: true, time: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ─── AUTH ────────────────────────────────────────────────
app.post('/api/signup', authLimiter, (req, res) => {
    try {
        const { email, password, referral } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        // Check if user already exists
        const existing = db.getUserByIdentifier(email);
        if (existing) return res.status(409).json({ error: 'Account already registered' });

        const referralCode = db.generateReferralCode();
        const user = db.createUser({ email, password, referral_code: referralCode });

        // Apply referral bonus if provided
        if (referral) {
            db.applyReferral(referral, user.id);
        }

        res.json({ user });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/login', authLimiter, (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        const user = db.getUserByIdentifier(email);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        // Auto-migration for plain text passwords
        const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
        let isValid = false;

        if (isHashed) {
            isValid = bcrypt.compareSync(password, user.password);
        } else {
            // Check plain text
            if (password === user.password) {
                isValid = true;
                // Upgrade to hash for future use
                const hashed = bcrypt.hashSync(password, 10);
                db.updateUser(user.id, { password: hashed });
            }
        }

        if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

        // Logic for 10-day expiry for free accounts
        const isFree = !user.subscription || user.subscription === 'None';
        const neverSubscribed = !user.has_subscribed;
        const notManuallyActivated = !user.manual_activation;
        const isNotAdmin = !user.is_admin;

        if (isFree && neverSubscribed && notManuallyActivated && isNotAdmin) {
            const createdAt = new Date(user.created_at);
            const now = new Date();
            const diffTime = Math.abs(now - createdAt);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 10) {
                return res.status(403).json({
                    error: 'Account Expired: Free account limited to 10 days. Please contact admin to activate or purchase a subscription.',
                    is_expired: true
                });
            }
        }

        res.json({ user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ─── USERS ──────────────────────────────────────────────
app.get('/api/users', (req, res) => {
    try {
        const users = db.getAllUsers();
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:id', (req, res) => {
    try {
        const user = db.getUserById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/users/:id', (req, res) => {
    try {
        const user = db.updateUser(req.params.id, req.body);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:id', (req, res) => {
    try {
        const deleted = db.deleteUser(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── KYC ────────────────────────────────────────────────
app.post('/api/kyc', upload.single('file'), (req, res) => {
    try {
        const { userId, idType, idNumber, first_name, last_name, address, birthdate } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId required' });

        const file = req.file;
        const filename = file ? file.filename : null;
        const filepath = file ? 'uploads/' + file.filename : null;

        // Check for duplicate identity
        const dup = db.checkDuplicateKyc(idNumber, first_name, last_name, birthdate);
        if (dup.duplicate) {
            return res.status(409).json({ error: dup.reason });
        }

        const kyc = db.createKyc({
            userId,
            filename,
            filepath,
            details: { idType, idNumber, first_name, last_name, address, birthdate }
        });

        const publicUrl = filepath ? '/' + filepath : null;
        res.json({ kyc, publicUrl });
    } catch (error) {
        console.error('KYC error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/kyc/pending', (req, res) => {
    try {
        const items = db.getPendingKyc();
        res.json({ items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/kyc', (req, res) => {
    try {
        const items = db.getAllKyc();
        res.json({ items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/kyc/user/:userId', (req, res) => {
    try {
        const item = db.getKycByUser(req.params.userId);
        if (!item) return res.status(404).json({ error: 'No KYC found for user' });
        res.json({ item });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/kyc/:id', (req, res) => {
    try {
        const { action, reason } = req.body;
        let status;
        if (action === 'approve') status = 'approved';
        else if (action === 'reject') status = 'rejected';
        else return res.status(400).json({ error: 'Invalid action' });

        const result = db.updateKycStatus(req.params.id, status, reason);
        if (!result) return res.status(404).json({ error: 'KYC not found' });
        res.json({ item: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/kyc/:id', (req, res) => {
    try {
        db.deleteKycRequest(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── CASHOUTS ───────────────────────────────────────────
app.post('/api/cashouts', (req, res) => {
    try {
        const { userId, amount, method, details } = req.body;

        // Check if withdrawals are enabled globally
        const settings = db.getSettings();
        if (settings.withdrawals_enabled === false || settings.withdrawals_enabled === '0' || settings.withdrawals_enabled === 'false') {
            return res.status(403).json({ error: 'Withdrawals are currently disabled by administrator.' });
        }

        const cashout = db.createCashout(userId, amount, method, details);
        res.json({ cashout });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/cashouts', (req, res) => {
    try {
        const items = db.getAllCashouts();
        res.json({ items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/cashouts/pending', (req, res) => {
    try {
        const items = db.getPendingCashouts();
        res.json({ items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/cashouts/user/:userId', (req, res) => {
    try {
        const items = db.getCashoutsByUser(req.params.userId);
        res.json({ items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/cashouts/:id', (req, res) => {
    try {
        const { status, reason } = req.body;
        const result = db.updateCashoutStatus(req.params.id, status, reason);
        res.json({ item: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/cashouts/:id', (req, res) => {
    try {
        db.deleteCashoutRequest(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── GAME MECHANICS ─────────────────────────────────────
app.post('/api/feed', (req, res) => {
    try {
        const { userId } = req.body;
        const user = db.feedChicken(userId);
        res.json({ user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/sell-eggs', (req, res) => {
    try {
        const { userId, amount } = req.body;
        const user = db.sellEggs(userId, amount);
        res.json({ user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/bonuses/daily', (req, res) => {
    try {
        const { userId } = req.body;
        const result = db.claimDailyBonus(userId);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/bananas/history/:userId', (req, res) => {
    try {
        const history = db.getBananaHistory(req.params.userId);
        res.json({ items: history });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/referrals/downlines/:userId', (req, res) => {
    try {
        const items = db.getDownlines(req.params.userId);
        res.json({ items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── SUBSCRIPTION REQUESTS ──────────────────────────────
app.delete('/api/subscription-requests/:id', (req, res) => {
    console.log('DELETE subscription request:', req.params.id);
    try {
        db.deleteSubscriptionRequest(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete sub error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/subscription-requests', (req, res) => {
    try {
        const items = db.getAllSubscriptionRequests();
        res.json({ items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/subscription-requests/pending', (req, res) => {
    try {
        const items = db.getPendingSubscriptionRequests();
        res.json({ items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/subscription-requests', upload.single('receipt'), (req, res) => {
    try {
        const { userId, plan, price, method, refNumber } = req.body;
        const receiptUrl = req.file ? '/uploads/' + req.file.filename : null;
        const result = db.createSubscriptionRequest(userId, plan, parseFloat(price), method, refNumber, receiptUrl);
        res.json({ item: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/subscription-requests/:id', (req, res) => {
    try {
        const { status, reason } = req.body;
        const result = db.updateSubscriptionRequestStatus(req.params.id, status, reason);
        if (!result) return res.status(404).json({ error: 'Request not found' });
        res.json({ item: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── ADMIN ──────────────────────────────────────────────
app.post('/api/admin/toggle', (req, res) => {
    try {
        const { userId, isAdmin } = req.body;
        const user = db.toggleAdmin(userId, isAdmin);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/banned-users', (req, res) => {
    try {
        const users = db.getBannedUsers();
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/activate-user', (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId required' });
        const user = db.activateUser(userId);
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── SETTINGS ───────────────────────────────────────────
app.get('/api/settings', (req, res) => {
    try {
        const settings = db.getSettings();
        res.json({ settings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/settings', (req, res) => {
    try {
        const settings = db.updateSettings(req.body);
        res.json({ settings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── ADMIN STATS/HISTORY ────────────────────────────────
app.get('/api/admin/stats', (req, res) => {
    try {
        const db_instance = require('./db');
        const allSubs = db_instance.getAllSubscriptionRequests();
        const allCashouts = db_instance.getAllCashouts();
        const approvedSubs = allSubs.filter(s => s.status === 'approved');
        const approvedCashouts = allCashouts.filter(c => c.status === 'approved');
        const totalSubRevenue = approvedSubs.reduce((sum, s) => sum + (s.price || 0), 0);
        const totalCashoutAmount = approvedCashouts.reduce((sum, c) => sum + (c.amount || 0), 0);
        res.json({
            totalSubscriptions: approvedSubs.length,
            totalSubscriptionRevenue: totalSubRevenue,
            totalCashouts: approvedCashouts.length,
            totalCashoutAmount: totalCashoutAmount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/history/subscriptions', (req, res) => {
    try {
        const items = db.getAllSubscriptionRequests().filter(s => s.status === 'approved');
        res.json({ items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/history/cashouts', (req, res) => {
    try {
        const items = db.getAllCashouts().filter(c => c.status === 'approved');
        res.json({ items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── SPA FALLBACK ───────────────────────────────────────
// Handle client-side routing: serve index.html for any unknown routes
app.get('*', (req, res) => {
    const indexPath = fs.existsSync(distPath)
        ? path.join(distPath, 'index.html')
        : path.join(__dirname, '..', 'index.html');
    res.sendFile(indexPath);
});

// ─── START SERVER ───────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🐔 Chicken Banana API running on http://localhost:${PORT}`);
});
