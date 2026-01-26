const path = require('path')
const fs = require('fs')

const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'data.json')

function loadData() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = {
        users: [],
        kyc: [],
        cashouts: [],
        subscription_requests: [],
        settings: {
          payment_methods: {
            gcash: { name: 'GCash', number: '09XX-XXX-XXXX', accountName: 'Admin Name' },
            maya: { name: 'Maya', number: '09XX-XXX-XXXX', accountName: 'Admin Name' },
            gotyme: { name: 'GoTyme', number: 'XXXX-XXXX-XXXX', accountName: 'Admin Name' }
          }
        }
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    if (!raw) return { users: [], kyc: [], cashouts: [], subscription_requests: [], settings: {} };
    const data = JSON.parse(raw);
    if (!data.settings) data.settings = {};
    return data;
  } catch (e) {
    if (global.debugLog) global.debugLog('DB LOAD ERROR: ' + e.message);
    else console.error('DB LOAD ERROR:', e.message);
    return { users: [], kyc: [], cashouts: [] };
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
  } catch (e) {
    if (global.debugLog) global.debugLog('DB SAVE ERROR: ' + e.message);
    else console.error('DB SAVE ERROR:', e.message);
  }
}

function init() {
  const data = loadData()
  if (!data.users || data.users.length === 0) {
    const id = (Math.random().toString(36).slice(2, 10))
    const referral = generateReferralCode()
    const admin = {
      id,
      email: 'parrokitty@gmail.com',
      password: 'Ridge1228', // dev only
      bananas: 0,
      eggs: 0,
      balance: 0,
      kyc_status: 'approved',
      subscription: null,
      referral_code: referral,
      is_admin: true,
      role: 'admin',
      created_at: new Date().toISOString()
    }
    data.users = data.users || []
    data.users.push(admin)
    saveData(data)
    console.log('Seeded admin user:', 'parrokitty@gmail.com', 'code:', referral)
  }

  // Ensure default settings exist
  if (!data.settings || !data.settings.payment_methods) {
    data.settings = data.settings || {};
    data.settings.payment_methods = data.settings.payment_methods || {
      gcash: { name: 'GCash', number: '09XX-XXX-XXXX', accountName: 'Admin Name' },
      maya: { name: 'Maya', number: '09XX-XXX-XXXX', accountName: 'Admin Name' },
      gotyme: { name: 'GoTyme', number: 'XXXX-XXXX-XXXX', accountName: 'Admin Name' }
    };
    saveData(data);
  }
}

function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function getAllUsers() {
  const data = loadData()
  return (data.users || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

function getUserByIdentifier(identifier) {
  const data = loadData()
  return (data.users || []).find(u => u.email === identifier)
}

function getUserById(id) {
  const data = loadData()
  return (data.users || []).find(u => u.id === id)
}

function updateUser(id, fields) {
  const data = loadData()
  const u = (data.users || []).find(x => x.id === id)
  if (!u) return null
  Object.assign(u, fields)
  saveData(data)
  return u
}

function createUser({ id, email, password, bananas = 0, eggs = 0, balance = 0, referral_code = null, referred_by = null }) {
  const data = loadData()
  const uid = id || ((Math.random().toString(36).slice(2, 10)))
  const now = new Date().toISOString()
  const user = { id: uid, email, password, bananas, eggs, balance, referral_code, referred_by, kyc_status: 'none', kyc_submitted: false, created_at: now }
  data.users = data.users || []
  data.users.push(user)
  saveData(data)
  return user
}

function applyReferral(referralCode, newUserId) {
  if (!referralCode) return
  const data = loadData()
  const ref = (data.users || []).find(u => (u.referral_code || '').toUpperCase() === referralCode.toUpperCase())
  if (!ref) return

  // Update referrer
  ref.bananas = (ref.bananas || 0) + 1
  ref.referrals = (ref.referrals || 0) + 1

  // Update new user (in same data object)
  const newUser = (data.users || []).find(u => u.id === newUserId)
  if (newUser) {
    newUser.referred_by = ref.id
  }
  saveData(data)
}

// Cashout helpers
function createCashout({ id, userId, payment_method, account_details, amount }) {
  const data = loadData()
  const cid = id || (Math.random().toString(36).slice(2, 10))
  const now = new Date().toISOString()
  const co = { id: cid, userId, payment_method, account_details, amount, status: 'pending', requested_at: now }
  data.cashouts = data.cashouts || []
  data.cashouts.push(co)
  saveData(data)
  return co
}

function getPendingCashouts() {
  const data = loadData()
  return (data.cashouts || []).filter(c => c.status === 'pending').sort((a, b) => new Date(a.requested_at) - new Date(b.requested_at))
}

function getAllCashouts() {
  const data = loadData()
  return (data.cashouts || []).slice().sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at))
}

function updateCashoutStatus(id, status, reason) {
  const data = loadData()
  const coIdx = (data.cashouts || []).findIndex(c => c.id === id)
  if (coIdx === -1) return null
  const co = data.cashouts[coIdx]

  if (status === 'approved') {
    co.status = 'approved'
    co.approved_at = new Date().toISOString()
  } else if (status === 'rejected') {
    // Refund user balance
    const user = (data.users || []).find(u => u.id === co.userId)
    if (user) {
      user.balance = (user.balance || 0) + co.amount
    }
    // Remove from database as requested
    data.cashouts.splice(coIdx, 1)
  }
  saveData(data)
  return co
}

function getCashoutById(id) {
  const data = loadData()
  return (data.cashouts || []).find(c => c.id === id)
}

// KYC helpers
function createKyc({ id, userId, filename, filepath }) {
  const data = loadData()
  const kid = id || (Math.random().toString(36).slice(2, 10))
  const now = new Date().toISOString()
  const k = { id: kid, userId, filename, filepath, status: 'pending', submitted_at: now }
  data.kyc = data.kyc || []
  data.kyc.push(k)
  // update user
  const u = (data.users || []).find(x => x.id === userId || (x.email && x.email.toLowerCase() === String(userId || '').toLowerCase()))
  if (u) {
    u.kyc_status = 'pending'
    u.kyc_submitted = true
    u.kyc_submitted_at = now
  }
  saveData(data)
  return k
}

function getPendingKyc() {
  const data = loadData()
  return (data.kyc || []).filter(k => k.status === 'pending').sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))
}

function getAllKyc() {
  const data = loadData()
  return (data.kyc || []).slice().sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
}

function getKycById(id) {
  const data = loadData()
  return (data.kyc || []).find(k => k.id === id)
}

function getKycByUser(userId) {
  const data = loadData()
  return (data.kyc || []).filter(k => k.userId === userId).sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0] || null
}

function getCashoutsByUser(userId) {
  const data = loadData()
  return (data.cashouts || []).filter(c => c.userId === userId).sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at))
}

function updateKycStatus(id, status, reason) {
  const data = loadData()
  const k = (data.kyc || []).find(x => x.id === id)
  if (!k) return null
  const now = new Date().toISOString()

  if (status === 'approved') {
    k.status = 'approved'
    k.approved_at = now
    const u = (data.users || []).find(x => x.id === k.userId || (x.email && x.email.toLowerCase() === String(k.userId || '').toLowerCase()))
    if (u) {
      u.kyc_status = 'approved'
      u.kyc_approved_at = now
      u.kyc_rejection_reason = null
    }
  } else if (status === 'rejected') {
    k.status = 'rejected'
    k.rejection_reason = reason || null
    k.rejected_at = now
    const u = (data.users || []).find(x => x.id === k.userId || (x.email && x.email.toLowerCase() === String(k.userId || '').toLowerCase()))
    if (u) {
      u.kyc_status = 'rejected'
      u.kyc_rejection_reason = reason || null
    }
  }
  saveData(data)
  return k
}

function feedChicken(userId) {
  const data = loadData()
  const user = (data.users || []).find(u => u.id === userId)
  if (!user) throw new Error('User not found')

  // Validation
  if ((user.bananas || 0) < 2) throw new Error('Not enough bananas')

  // Update state
  user.bananas = (user.bananas || 0) - 2
  user.eggs = (user.eggs || 0) + 1
  user.balance = (user.balance || 0) + 1

  saveData(data)
  return user
}

function purchaseSubscription(userId, plan, cost) {
  const data = loadData()
  const user = (data.users || []).find(u => u.id === userId)
  if (!user) throw new Error('User not found')

  if ((user.balance || 0) < cost) throw new Error('Insufficient balance')

  // Update state
  user.balance -= cost
  user.subscription = plan
  user.subscription_purchased_at = new Date().toISOString()

  // Daily bonus for upgrade day? Optional - let's keep it simple for now

  saveData(data)
  return user
}

function createSubscriptionRequest(userId, plan, price, method, refNumber) {
  const data = loadData()
  const rid = Math.random().toString(36).slice(2, 10)
  const now = new Date().toISOString()

  const request = {
    id: rid,
    userId,
    plan,
    price,
    method,
    refNumber,
    status: 'pending',
    requested_at: now
  }

  data.subscription_requests = data.subscription_requests || []
  data.subscription_requests.push(request)
  saveData(data)
  return request
}

function getPendingSubscriptionRequests() {
  const data = loadData()
  return (data.subscription_requests || []).filter(r => r.status === 'pending').sort((a, b) => new Date(a.requested_at) - new Date(b.requested_at))
}

function getAllSubscriptionRequests() {
  const data = loadData()
  return (data.subscription_requests || []).slice().sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at))
}

function updateSubscriptionRequestStatus(id, status, reason) {
  const data = loadData()
  const request = (data.subscription_requests || []).find(r => r.id === id)
  if (!request) return null

  const now = new Date().toISOString()
  request.status = status
  if (reason) request.rejection_reason = reason
  request.processed_at = now

  if (status === 'approved') {
    const user = (data.users || []).find(u => u.id === request.userId)
    if (user) {
      user.subscription = request.plan
      user.subscription_purchased_at = now

      // Add bananas based on plan
      const bananaBonus = request.plan === 'premium' ? 20 : (request.plan === 'vip' ? 50 : 0)
      user.bananas = (user.bananas || 0) + bananaBonus
    }
  }

  saveData(data)
  return request
}


function toggleAdmin(userId, isAdmin) {
  const data = loadData()
  const user = (data.users || []).find(u => u.id === userId)
  if (!user) throw new Error('User not found')

  user.is_admin = !!isAdmin
  user.role = isAdmin ? 'admin' : 'user'
  if (isAdmin) user.admin_granted_at = new Date().toISOString()
  else user.admin_revoked_at = new Date().toISOString()

  saveData(data)
  return user
}



function claimDailyBonus(userId) {
  const data = loadData()
  const user = (data.users || []).find(u => u.id === userId)
  if (!user) throw new Error('User not found')

  if (!user.subscription || user.subscription === 'basic') throw new Error('No active premium subscription')

  const now = new Date()
  const last = user.last_daily_banana ? new Date(user.last_daily_banana) : null

  // check if already claimed today
  if (last && last.getDate() === now.getDate() && last.getMonth() === now.getMonth() && last.getFullYear() === now.getFullYear()) {
    throw new Error('Already claimed today')
  }

  const amount = user.subscription === 'premium' ? 20 : 50
  user.bananas = (user.bananas || 0) + amount
  user.last_daily_banana = now.toISOString()

  saveData(data)
  return { user, added: amount }
}

function createCashout(userId, amount, method, details) {
  const data = loadData()
  const user = (data.users || []).find(u => u.id === userId)
  if (!user) throw new Error('User not found')

  if ((user.balance || 0) < amount) throw new Error('Insufficient balance')

  // Check minimums based on previous cashout count
  const cashouts = (data.cashouts || []).filter(c => c.userId === userId)
  const count = cashouts.length

  let minimum = 200
  if (!user.subscription) {
    const mins = [5, 15, 50, 100, 200]
    minimum = mins[count] || 200
  } else {
    minimum = 0 // Subs have no minimum?
  }

  if (amount < minimum) throw new Error(`Minimum cashout is ${minimum}`)

  // Deduct balance
  user.balance = (user.balance || 0) - amount
  if (user.balance < 0) user.balance = 0 // safety

  const co = {
    id: Math.random().toString(36).slice(2, 10),
    userId,
    amount,
    payment_method: method || 'Manual',
    account_details: details || '',
    status: 'pending',
    requested_at: new Date().toISOString()
  }

  data.cashouts = data.cashouts || []
  data.cashouts.push(co)
  saveData(data)
  return co
}

function deleteUser(id) {
  const data = loadData()
  const initialCount = data.users.length
  data.users = data.users.filter(u => u.id !== id)

  // Also cleanup related KYC and Cashout records
  data.kyc = (data.kyc || []).filter(k => k.userId !== id)
  data.cashouts = (data.cashouts || []).filter(c => c.userId !== id)

  if (data.users.length !== initialCount) {
    saveData(data)
    return true
  }
  return false
}

// Settings helpers
function getSettings() {
  const data = loadData()
  return data.settings || {}
}

function updateSettings(newSettings) {
  const data = loadData()
  data.settings = Object.assign({}, data.settings, newSettings)
  saveData(data)
  return data.settings
}

// Removed init() call

module.exports = {
  init,
  generateReferralCode,
  getAllUsers,
  getUserByIdentifier,
  getUserById,
  createUser,
  applyReferral,
  // cashouts
  createCashout,
  getPendingCashouts,
  getAllCashouts,
  updateCashoutStatus,
  getCashoutById,
  getCashoutsByUser,
  // kyc
  createKyc,
  getPendingKyc,
  getAllKyc,
  getKycById,
  getKycByUser,
  updateKycStatus,
  // user update
  updateUser,
  // game mechanics
  feedChicken,
  purchaseSubscription,
  toggleAdmin,
  claimDailyBonus,
  // subscription requests
  createSubscriptionRequest,
  getPendingSubscriptionRequests,
  getAllSubscriptionRequests,
  updateSubscriptionRequestStatus,
  deleteUser,
  getSettings,
  updateSettings
}

