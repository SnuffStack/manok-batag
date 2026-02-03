require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const path = require('path')

const db = require('./db')
const multer = require('multer')
const fs = require('fs')

const uploadDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
const kycDir = path.join(uploadDir, 'kyc')
if (!fs.existsSync(kycDir)) fs.mkdirSync(kycDir, { recursive: true })

db.init() // Initialize DB here

function debugLog(msg) {
  const time = new Date().toISOString()
  const line = `[${time}] ${msg}\n`
  fs.appendFileSync(path.join(__dirname, 'debug.log'), line)
  console.log(msg)
}
global.debugLog = debugLog

debugLog('Server starting up...')

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, kycDir) },
  filename: function (req, file, cb) { cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`) }
})
const upload = multer({ storage })

const app = express()
const PORT = process.env.PORT || 4500

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

// Basic health endpoint
app.get('/api/ping', (req, res) => res.json({ ok: true, ts: Date.now() }))

// Simple signup endpoint: mirrors local fallback logic
app.post('/api/signup', (req, res) => {
  try {
    const { email: identifier, password, referral } = req.body
    if (!identifier) return res.status(400).json({ error: 'identifier required' })

    const existing = db.getUserByIdentifier(identifier)
    if (existing) return res.status(409).json({ error: 'Account already registered' })

    // generate referral code if missing
    const referral_code = db.generateReferralCode()

    // create user
    const user = db.createUser({ email: identifier, password, referral_code })

    // apply referral bonus if provided
    if (referral) db.applyReferral(referral, user.id)

    // don't include sensitive fields in response
    const publicUser = Object.assign({}, user)
    delete publicUser.password

    // set basic session via simple response (frontend will store local_current_user)
    return res.status(201).json({ user: publicUser })
  } catch (err) {
    console.error('signup error', err)
    return res.status(500).json({ error: 'server error' })
  }
})

// Login endpoint for local/self-hosted users
app.post('/api/login', (req, res) => {
  try {
    const { email: identifier, password } = req.body
    if (!identifier || !password) return res.status(400).json({ error: 'identifier and password required' })

    const user = db.getUserByIdentifier(identifier)
    if (!user || !user.password || user.password !== password) return res.status(401).json({ error: 'invalid credentials' })

    const publicUser = Object.assign({}, user)
    delete publicUser.password

    return res.json({ user: publicUser })
  } catch (err) {
    console.error('login error', err)
    return res.status(500).json({ error: 'server error' })
  }
})

// GET users (admin)
app.get('/api/users', (req, res) => {
  try {
    const users = db.getAllUsers()
    res.json({ users })
  } catch (err) {
    console.error('users error', err)
    res.status(500).json({ error: 'server error' })
  }
})

// simple ping to indicate server is available
app.get('/api/_status', (req, res) => res.json({ ok: true }))

// serve uploaded files
app.use('/uploads', express.static(uploadDir))

// KYC upload endpoint (multipart/form-data: file + userId + idType + details)
app.post('/api/kyc', upload.single('file'), (req, res) => {
  try {
    const { userId, idType, first_name, last_name, address, birthdate } = req.body
    if (!userId || userId === 'undefined') return res.status(400).json({ error: 'Valid userId required' })
    if (!req.file) return res.status(400).json({ error: 'file required' })

    // Use posix join so filepath uses forward slashes (URL-friendly)
    const fileRel = path.posix.join('uploads', 'kyc', req.file.filename)
    const publicUrl = `${req.protocol}://${req.get('host')}/${fileRel}`

    const kyc = db.createKyc({
      userId,
      filename: req.file.originalname,
      filepath: fileRel,
      details: { first_name, last_name, address, birthdate }
    })

    // Update user with document URL and id type
    try {
      db.updateUser(userId, {
        kyc_document_url: publicUrl,
        kyc_id_type: idType || null,
        kyc_submitted: true,
        kyc_status: 'pending',
        kyc_submitted_at: new Date().toISOString()
      })
    } catch (e) {
      console.warn('Failed to update user with KYC metadata', e)
    }

    return res.status(201).json({ kyc, publicUrl })
  } catch (err) {
    console.error('kyc upload error', err)
    return res.status(500).json({ error: 'server error' })
  }
})

// Get pending KYC submissions (admin)
app.get('/api/kyc/pending', (req, res) => {
  try {
    const items = db.getPendingKyc()
    return res.json({ items })
  } catch (err) {
    console.error('kyc pending error', err)
    return res.status(500).json({ error: 'server error' })
  }
})

// Get all KYC records
app.get('/api/kyc', (req, res) => {
  try {
    const items = db.getAllKyc()
    return res.json({ items })
  } catch (err) {
    console.error('kyc error', err)
    return res.status(500).json({ error: 'server error' })
  }
})

// GET single user by ID (for session validation)
app.get('/api/users/:id', (req, res) => {
  try {
    debugLog(`GET /api/users/${req.params.id}`)
    const user = db.getUserById(req.params.id)
    if (!user) {
      debugLog(`User ${req.params.id} not found`)
      return res.status(404).json({ error: 'user not found' })
    }

    // Remove password from response
    const publicUser = Object.assign({}, user)
    delete publicUser.password

    debugLog(`Found user: ${publicUser.email}`)
    res.json({ user: publicUser })
  } catch (err) {
    debugLog(`ERROR GET /api/users/${req.params.id}: ${err.message}\n${err.stack}`)
    res.status(500).json({ error: 'server error', message: err.message, stack: err.stack })
  }
})

// DELETE user (admin)
app.delete('/api/users/:id', (req, res) => {
  try {
    const success = db.deleteUser(req.params.id)
    if (!success) return res.status(404).json({ error: 'user not found' })
    return res.json({ ok: true })
  } catch (err) {
    console.error('delete user error', err)
    return res.status(500).json({ error: 'server error' })
  }
})

// Patch user (partial update) - allow payment details
app.patch('/api/users/:id', (req, res) => {
  try {
    const fields = req.body || {}
    // Security: allow specific fields only if not admin? 
    // For now, assume internal logic handles it or we trust the frontend for this local app.
    const user = db.updateUser(req.params.id, fields)
    if (!user) return res.status(404).json({ error: 'user not found' })
    return res.json({ user })
  } catch (err) {
    console.error('user patch error', err)
    return res.status(500).json({ error: 'server error', message: err.message })
  }
})

app.post('/api/sell-eggs', (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || !amount) return res.status(400).json({ error: 'Missing params' });
    const user = db.sellEggs(userId, parseInt(amount));
    // clean
    const publicUser = Object.assign({}, user);
    delete publicUser.password;
    return res.json({ user: publicUser });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Get latest KYC for a user
app.get('/api/kyc/user/:userId', (req, res) => {
  try {
    const item = db.getKycByUser(req.params.userId)
    if (!item) return res.status(404).json({ error: 'not found' })
    return res.json({ item })
  } catch (err) {
    console.error('kyc get error', err)
    return res.status(500).json({ error: 'server error' })
  }
})

// Approve or reject a KYC submission
app.patch('/api/kyc/:id', (req, res) => {
  try {
    const { action, reason } = req.body
    if (!action) return res.status(400).json({ error: 'action required' })
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'invalid action' })
    const k = db.updateKycStatus(req.params.id, action === 'approve' ? 'approved' : 'rejected', reason)
    return res.json({ k })
  } catch (err) {
    if (err.message.includes('limit reached')) return res.status(403).json({ error: err.message })
    console.error('kyc update error', err)
    return res.status(500).json({ error: 'server error' })
  }
})

// Cashout endpoints
app.get('/api/cashouts/pending', (req, res) => {
  try {
    const items = db.getPendingCashouts()
    return res.json({ items })
  } catch (err) {
    console.error('cashouts pending error', err)
    return res.status(500).json({ error: 'server error' })
  }
})

app.get('/api/cashouts', (req, res) => {
  try {
    const items = db.getAllCashouts()
    return res.json({ items })
  } catch (err) {
    console.error('cashouts error', err)
    return res.status(500).json({ error: 'server error' })
  }
})

app.get('/api/cashouts/user/:userId', (req, res) => {
  try {
    const items = db.getCashoutsByUser(req.params.userId)
    return res.json({ items })
  } catch (err) {
    console.error('cashouts user error', err)
    return res.status(500).json({ error: 'server error' })
  }
})

app.patch('/api/cashouts/:id', (req, res) => {
  try {
    const { status, reason } = req.body
    if (!status || !['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'status must be approved or rejected' })
    const co = db.updateCashoutStatus(req.params.id, status, reason)
    return res.json({ cashout: co })
  } catch (err) {
    console.error('cashout update error', err)
    return res.status(500).json({ error: 'server error' })
  }
})
// Subscription Requests
app.get('/api/subscription-requests/pending', (req, res) => {
  try {
    const items = db.getPendingSubscriptionRequests()
    return res.json({ items })
  } catch (err) {
    console.error('subscription requests pending error', err)
    return res.status(500).json({ error: 'server error' })
  }
})

app.get('/api/subscription-requests', (req, res) => {
  try {
    const items = db.getAllSubscriptionRequests()
    return res.json({ items })
  } catch (err) {
    console.error('subscription requests error', err)
    return res.status(500).json({ error: 'server error' })
  }
})

app.post('/api/subscription-requests', upload.single('receipt'), (req, res) => {
  try {
    const { userId, plan, price, method, refNumber } = req.body
    if (!userId || !plan || !price || !method || !refNumber) {
      return res.status(400).json({ error: 'Missing required payment details' })
    }

    let receiptUrl = null
    if (req.file) {
      const fileRel = path.posix.join('uploads', 'kyc', req.file.filename) // Reusing KYC folder for now or could create 'receipts'
      receiptUrl = `${req.protocol}://${req.get('host')}/${fileRel}`
    }

    const request = db.createSubscriptionRequest(userId, plan, price, method, refNumber, receiptUrl)
    return res.status(201).json({ request })
  } catch (err) {
    console.error('create subscription request error', err)
    return res.status(500).json({ error: 'server error' })
  }
})

app.patch('/api/subscription-requests/:id', (req, res) => {
  try {
    const { status, reason } = req.body
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'status must be approved or rejected' })
    }
    const request = db.updateSubscriptionRequestStatus(req.params.id, status, reason)
    if (!request) return res.status(404).json({ error: 'request not found' })
    return res.json({ request })
  } catch (err) {
    console.error('update subscription request error', err)
    return res.status(500).json({ error: 'server error' })
  }
})

// Settings API
app.get('/api/settings', (req, res) => {
  try {
    const settings = db.getSettings()
    return res.json({ settings })
  } catch (err) {
    console.error('get settings error', err)
    return res.status(500).json({ error: 'server error' })
  }
})

app.patch('/api/settings', (req, res) => {
  try {
    const fields = req.body || {}
    const settings = db.updateSettings(fields)
    return res.json({ settings })
  } catch (err) {
    console.error('update settings error', err)
    return res.status(500).json({ error: 'server error' })
  }
})



// Game Mechanics
app.post('/api/feed', (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ error: 'userId required' })

    const user = db.feedChicken(userId)
    // Remove sensitive data
    const publicUser = Object.assign({}, user)
    delete publicUser.password

    return res.json({ user: publicUser })
  } catch (err) {
    if (err.message === 'Not enough bananas') return res.status(400).json({ error: 'Not enough bananas' })
    console.error('Feed error', err)
    return res.status(500).json({ error: 'server error' })
  }
})

app.post('/api/subscribe', (req, res) => {
  try {
    const { userId, plan, price } = req.body
    if (!userId || !plan || !price) return res.status(400).json({ error: 'Missing params' })

    const user = db.purchaseSubscription(userId, plan, price)
    const publicUser = Object.assign({}, user)
    delete publicUser.password
    return res.json({ user: publicUser })
  } catch (err) {
    if (err.message === 'Insufficient balance') return res.status(400).json({ error: 'Insufficient balance' })
    console.error('Subscribe error', err)
    return res.status(500).json({ error: 'server error' })
  }
})

// Admin Management
app.post('/api/admin/toggle', (req, res) => {
  try {
    const { userId, isAdmin } = req.body
    if (!userId) return res.status(400).json({ error: 'userId required' })

    const user = db.toggleAdmin(userId, isAdmin)
    return res.json({ user })
  } catch (err) {
    console.error('Admin toggle error', err)
    return res.status(500).json({ error: 'server error', message: err.message })
  }
})

app.post('/api/cashouts', (req, res) => {
  try {
    const { userId, amount, method, details } = req.body
    if (!userId || !amount) return res.status(400).json({ error: 'userId and amount required' })
    const cashout = db.createCashout(userId, parseFloat(amount), method, details)
    return res.json({ cashout })
  } catch (err) {
    if (err.message.includes('Insufficient') || err.message.includes('Minimum')) return res.status(400).json({ error: err.message })
    console.error('create cashout error', err)
    return res.status(500).json({ error: 'server error' })
  }
})

app.post('/api/bonuses/daily', (req, res) => {
  try {
    const { userId } = req.body
    const result = db.claimDailyBonus(userId)
    return res.json(result)
  } catch (err) {
    if (err.message.includes('No active')) return res.status(400).json({ error: err.message })
    if (err.message.includes('Already claimed')) return res.status(400).json({ error: err.message })
    console.error('daily bonus error', err)
    return res.status(500).json({ error: 'server error' })
  }
})

app.use((err, req, res, next) => {

  console.error('Unexpected error', err)
  res.status(500).json({ error: 'internal' })
})

const server = app.listen(PORT, '0.0.0.0', () => {
  debugLog(`Chicken Banana API listening on http://0.0.0.0:${PORT}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    debugLog(`PORT ${PORT} already in use. Retrying...`)
  } else {
    debugLog(`SERVER ERROR: ${err.message}\n${err.stack}`)
  }
})
