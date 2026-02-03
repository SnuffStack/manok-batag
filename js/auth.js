let currentUser = null

export async function checkAuthState() {
  // Sync with local session events (local mode) and ensure UI updates when session changes
  window.addEventListener('localAuthChange', (e) => {
    const user = e?.detail ?? null
    if (user) {
      currentUser = user
      try { loadUserData() } catch (e) { /* ignore */ }
    } else {
      currentUser = null
    }
  })

  // Initialize from existing local session if present
  try {
    const localCur = JSON.parse(localStorage.getItem('local_current_user') || 'null')
    if (localCur) currentUser = localCur
  } catch (e) { /* ignore */ }
}

export function initApp() {
  const app = document.getElementById('app')

  // Check if we're on auth page or dashboard
  if (!currentUser) {
    showAuthPage('login')
  }
}

export function showAuthPage(view = 'login') {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="auth-container">
      <div id="particles" class="particle-container"></div>
      <div class="chicken-auth-wrapper">
        <img src="/chicken.png" class="chicken-auth-img" alt="Chicken">
      </div>
      <div class="auth-box">
        <div id="auth-content">
          <div id="auth-form"></div>
        </div>
        <div class="auth-divider" style="margin-top:18px;">
        </div>
      </div>
    </div>
  `

  // Import initParticles if needed or use global
  import('./homepage.js').then(m => {
    if (typeof m.initParticles === 'function') m.initParticles()
  }).catch(() => {
    if (typeof window.initParticles === 'function') window.initParticles()
  })

  if (view === 'login') {
    showLogin()
  } else {
    showSignup()
  }
}

window.showSignup = function () {
  let authForm = document.getElementById('auth-form')
  // If the auth container isn't present, ensure the auth page is rendered
  if (!authForm) {
    try { showAuthPage() } catch (e) { }
    authForm = document.getElementById('auth-form')
    if (!authForm) {
      console.warn('showSignup: auth-form container not found')
      return
    }
  }

  authForm.innerHTML = `
    <form id="signup-form" onsubmit="handleSignup(event)" class="auth-card-form">
      <div class="auth-logo">
        <h2>CHICKEN BANANA</h2>
        <p class="auth-subtitle">The funniest way to earn GCash!</p>
      </div>

      <div class="form-group">
        <div class="input-icon">
          <input type="text" id="signup-email" placeholder="Email or Phone Number" required>
        </div>
      </div>

      <div class="form-group">
        <div class="input-icon" style="position:relative;">
          <input type="password" id="signup-password" placeholder="Password" required minlength="6">
          <button type="button" class="password-toggle" onclick="togglePassword('signup-password', this)">👁️</button>
        </div>
      </div>

      <div class="form-group">
        <div class="input-icon">
          <input type="text" id="referral-code" placeholder="Referral code (optional)">
        </div>
      </div>

      <button type="submit" class="btn btn-start">START FARMING</button>
      <div id="signup-message"></div>

      <div class="auth-small-link">
        <p>Already have an account? <a onclick="event.preventDefault(); showLogin();">Sign in!</a></p>
      </div>
    </form>
  `

  // Prefill referral code from URL (?ref=CODE) when available
  try {
    const params = new URLSearchParams(window.location.search || '')
    const ref = params.get('ref')
    if (ref) {
      const el = document.getElementById('referral-code')
      if (el) el.value = (ref || '').trim().toUpperCase()
    }
  } catch (e) { /* ignore */ }
}

window.showLogin = function () {
  const authForm = document.getElementById('auth-form')

  authForm.innerHTML = `
    <form id="login-form" onsubmit="handleLogin(event)" class="auth-card-form">
      <div class="auth-logo">
        <h2>CHICKEN BANANA</h2>
        <p class="auth-subtitle">The funniest way to earn GCash!</p>
      </div>

      <div class="form-group">
        <div class="input-icon">
          <input type="text" id="login-email" placeholder="Email or Phone Number" required>
        </div>
      </div>

      <div class="form-group">
        <div class="input-icon" style="position:relative;">
          <input type="password" id="login-password" placeholder="Password" required>
          <button type="button" class="password-toggle" onclick="togglePassword('login-password', this)">👁️</button>
        </div>
      </div>

      <button type="submit" class="btn btn-start">START FARMING</button>
      <div id="login-message"></div>

      <div class="auth-small-link">
        <p>Don't have an account? <a onclick="event.preventDefault(); showSignup();">Sign up!</a></p>
      </div>
    </form>
  `
}


window.handleSignup = async function (event) {
  event.preventDefault()
  const email = document.getElementById('signup-email').value
  const password = document.getElementById('signup-password').value
  const referralCode = document.getElementById('referral-code').value
  const messageDiv = document.getElementById('signup-message')
  const submitBtn = event.target.querySelector('button[type="submit"]')

  messageDiv.innerHTML = '<div class="alert alert-info">⏳ Creating your account...</div>'
  if (submitBtn) {
    submitBtn.disabled = true
    submitBtn.textContent = 'Creating...'
  }

  try {
    // Try server signup first (self-hosted/local DB)
    const statusResp = await fetch('/api/_status').catch(() => ({ ok: false }))
    if (statusResp.ok) {
      const resp = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, referral: referralCode || null })
      })
      if (resp.ok) {
        const body = await resp.json()
        // set local session and proceed
        localStorage.setItem('local_current_user', JSON.stringify({ id: body.user.id, email: body.user.email, is_admin: !!body.user.is_admin }))
        window.dispatchEvent(new CustomEvent('localAuthChange', { detail: { id: body.user.id, email: body.user.email, is_admin: !!body.user.is_admin } }))
        messageDiv.innerHTML = '<div class="alert alert-success">✅ Account created! Redirecting...</div>'
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create Account' }
        setTimeout(() => { try { loadUserData() } catch (e) { window.location.href = '/index.html' } }, 1000)
        return
      } else {
        const err = await resp.json().catch(() => ({ error: 'Server signup failed' }))
        throw new Error(err.error || 'Server signup failed')
      }
    }

    // If server not available, show generic message (or you could implement local-only signup if desired)
    messageDiv.innerHTML = '<div class="alert alert-error">❌ Server is currently unavailable. Please try again later.</div>'
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create Account' }

  } catch (error) {
    console.error('Signup error:', error)

    // Local fallback when Supabase DB is disabled
    const msg = (error && error.message) ? error.message : 'Error creating account'
    if (msg.includes('already')) {
      messageDiv.innerHTML = '<div class="alert alert-error">❌ Account already registered. Please login instead.</div>'
    } else {
      messageDiv.innerHTML = `<div class="alert alert-error">❌ ${msg}</div>`
    }
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create Account' }
    return

    let errorMessage = error.message || 'Error creating account'

    if (error.message && error.message.includes('already')) {
      errorMessage = '❌ Account already registered. Please login instead.'
    } else if (error.message && error.message.includes('weak')) {
      errorMessage = '❌ Password too weak. Use at least 6 characters.'
    }

    messageDiv.innerHTML = `<div class="alert alert-error">${errorMessage}</div>`
    if (submitBtn) {
      submitBtn.disabled = false
      submitBtn.textContent = 'Create Account'
    }
  }
}

window.handleLogin = async function (event) {
  event.preventDefault()
  const email = document.getElementById('login-email').value
  const password = document.getElementById('login-password').value
  const messageDiv = document.getElementById('login-message')
  const submitBtn = event.target.querySelector('button[type="submit"]')

  messageDiv.innerHTML = '<div class="alert alert-info">⏳ Signing in...</div>'
  if (submitBtn) submitBtn.disabled = true

  try {
    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (resp.ok) {
        const body = await resp.json()
        const loggedInUser = body.user

        // set local session
        localStorage.setItem('local_current_user', JSON.stringify({ id: loggedInUser.id, email: loggedInUser.email, is_admin: !!loggedInUser.is_admin }))
        // dispatch local event so listeners react immediately
        window.dispatchEvent(new CustomEvent('localAuthChange', { detail: { id: loggedInUser.id, email: loggedInUser.email, is_admin: !!loggedInUser.is_admin } }))
        if (loggedInUser.is_admin) localStorage.setItem('local_is_admin', 'true')
        currentUser = loggedInUser
        messageDiv.innerHTML = '<div class="alert alert-success">✅ Login successful! Redirecting...</div>'
        setTimeout(() => loadUserData(), 800)
        return
      } else if (resp.status === 401) {
        messageDiv.innerHTML = '<div class="alert alert-error">❌ Invalid credentials</div>'
        if (submitBtn) submitBtn.disabled = false
        return
      } else {
        throw new Error('Login failed')
      }
    } catch (e) {
      console.error('Login error', e)
      throw e
    }

  } catch (error) {
    console.error('Login error:', error)
    const msg = (error && error.message) ? error.message : 'Login failed. Please try again.'
    messageDiv.innerHTML = `<div class="alert alert-error">❌ ${msg}</div>`
    if (submitBtn) submitBtn.disabled = false
  }
}

// NEW: local auth helpers & seed admin
function loadLocalUsers() {
  try {
    let u = JSON.parse(localStorage.getItem('local_users') || 'null')
    if (!u) {
      // seed initial admin with provided credentials
      u = [{
        id: (crypto && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10),
        email: 'parrokitty@gmail.com',
        password: 'Ridge1228', // NOTE: plain text for dev only; hash in production
        bananas: 0,
        eggs: 0,
        balance: 0,
        kyc_status: 'approved',
        subscription: 'None',
        referral_code: null,
        is_admin: true,
        role: 'admin',
        created_at: new Date().toISOString()
      }]
      localStorage.setItem('local_users', JSON.stringify(u))
    }
    return u
  } catch (e) { return [] }
}

function setLocalCurrentUser(user) {
  localStorage.setItem('local_current_user', JSON.stringify({ id: user.id, email: user.email, is_admin: user.is_admin }))
  window.dispatchEvent(new CustomEvent('localAuthChange', { detail: user }))
}

// NEW: login handler for admin

async function getKYCCountToday() {
  return 0 // Limit removed
}

async function handleReferralBonus(referralCode) {
  // Try server first
  try {
    const usersResp = await fetch('/api/users')
    if (usersResp.ok) {
      const { users } = await usersResp.json()
      const ref = users.find(u => (u.referral_code || '').toUpperCase() === (referralCode || '').toUpperCase())
      if (ref) {
        await fetch(`/api/users/${ref.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bananas: (ref.bananas || 0) + 1, referrals: (ref.referrals || 0) + 1 })
        })
        return
      }
    }
  } catch (e) { /* server not available */ }

  // Local fallback
  const users = JSON.parse(localStorage.getItem('local_users') || '[]')
  const refUser = users.find(u => (u.referral_code || '').toUpperCase() === (referralCode || '').toUpperCase())
  if (refUser) {
    refUser.bananas = (refUser.bananas || 0) + 1
    refUser.referrals = (refUser.referrals || 0) + 1
    localStorage.setItem('local_users', JSON.stringify(users))
  }
}

function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  // Restore session from local storage if available
  const stored = localStorage.getItem('local_current_user')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (parsed && parsed.id) {
        currentUser = parsed
      }
    } catch (e) {
      localStorage.removeItem('local_current_user')
    }
  }

  // Route based on URL
  if (window.location.hash.includes('admin')) {
    import('./admin.js').then(m => m.showAdminPanel())
    return
  }

  loadUserData()
})

export async function loadUserData() {
  const messageDiv = document.getElementById('message')

  if (!currentUser) {
    // If we have no user in memory, check if we just tried to restore it
    const stored = localStorage.getItem('local_current_user')
    if (!stored) {
      // No session, if not on index/login, redirect
      if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/' && window.location.pathname !== '') {
        window.location.href = '/index.html'
      }
      return
    }
    // Try to parse again just in case (redundant but safe)
    try { currentUser = JSON.parse(stored) } catch (e) { }
  }

  if (!currentUser || !currentUser.id) return

  // Verify session with server and get fresh data
  try {
    const resp = await fetch(`/api/users/${currentUser.id}`)
    if (!resp.ok) {
      // invalid session or user deleted
      throw new Error('Session invalid')
    }
    const { user } = await resp.json()

    // Update current user with fresh data
    currentUser = user

    // Also update the local storage cache
    localStorage.setItem('local_current_user', JSON.stringify({ id: user.id, email: user.email, is_admin: !!user.is_admin }))

    // Local admin override check
    if (localStorage.getItem('local_is_admin') === 'true') {
      user.is_admin = true
    }

    // Stop BGM if entering dashboard or admin panel
    import('./homepage.js').then(m => m.stopBGM())

    // Check if user is admin
    if (user.is_admin) {
      // if we are explicitly asking for admin panel via hash or just logging in as admin
      const { showAdminPanel } = await import('./admin.js')
      showAdminPanel()
      return
    }




    // Show dashboard regardless of KYC status (per user request: "user can log in even its not approved yet")
    import('./dashboard.js').then(module => {
      module.showDashboard(user)
    })

  } catch (error) {
    console.error('Session restore failed:', error)
    // Only clear session if it's a 401/404 (auth error). If 500, might be server issue.
    // However, for simplicity in this local mode, we usually clear it.
    // Let's at least log it.

    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
      // stay here
    } else {
      // window.location.href = '/index.html'
    }
  }
}

export function showKYCPage(userData) {
  const app = document.getElementById('app')
  const existingPreview = userData && (userData.kyc_document_url || userData.kyc_document)
  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-box">
        <h1>📋 KYC Verification</h1>
        <p style="text-align: center; margin-bottom: 20px; color: var(--gray);">
          Please fill out your details and upload a valid ID to continue
        </p>
        <form id="kyc-form" onsubmit="handleKYC(event)">
          <div class="form-group">
            <label>First Name</label>
            <input type="text" id="kyc-first-name" required placeholder="First Name">
          </div>
          <div class="form-group">
            <label>Last Name</label>
            <input type="text" id="kyc-last-name" required placeholder="Last Name">
          </div>
          <div class="form-group">
            <label>Address</label>
            <textarea id="kyc-address" required placeholder="Full Address" style="width:100%; border:2px solid var(--border); border-radius:12px; padding:12px;"></textarea>
          </div>
          <div class="form-group">
            <label>Date of Birth</label>
            <input type="date" id="kyc-birthdate" required>
          </div>
          <div class="form-group">
            <label>ID Type</label>
            <select id="id-type" required>
              <option value="">Select ID Type</option>
              <option value="passport">Passport</option>
              <option value="drivers-license">Driver's License</option>
              <option value="national-id">National ID</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Upload ID Photo</label>
            <div class="file-upload" onclick="document.getElementById('id-file').click()">
              <input type="file" id="id-file" accept="image/*" required>
              <label class="file-upload-label" id="file-label">Click to upload ID</label>
            </div>
          </div>
          <button type="submit" class="btn btn-primary">Submit Verification</button>
          <div id="kyc-message"></div>
        </form>
        <div style="margin-top:20px; text-align:center;">
          <a onclick="goToLandingPage()" style="cursor:pointer; color:var(--gray);">Skip for now (Limited Access)</a>
        </div>
      </div>
    </div>
  `

  document.getElementById('id-file').addEventListener('change', (e) => {
    const label = document.getElementById('file-label')
    if (e.target.files.length > 0) {
      label.textContent = e.target.files[0].name
    } else {
      label.textContent = 'Click to upload ID'
    }
  })
}

window.handleKYC = async function (event) {
  event.preventDefault()
  const idType = document.getElementById('id-type').value
  const idFile = document.getElementById('id-file').files[0]
  const messageDiv = document.getElementById('kyc-message')

  const uid = currentUser ? currentUser.id : (JSON.parse(localStorage.getItem('local_current_user') || 'null') || {}).id

  if (!uid) {
    messageDiv.innerHTML = '<div class="alert alert-error">Session expired. Please <a href="/index.html">login again</a>.</div>'
    return
  }

  if (!idFile) {
    messageDiv.innerHTML = '<div class="alert alert-error">Please select an ID file</div>'
    return
  }

  try {
    // Check KYC limit (REMOVED)

    // Upload file to local API (server) if available, otherwise store locally
    const fd = new FormData()
    const idType = document.getElementById('id-type').value
    fd.append('userId', uid)
    fd.append('idType', idType)

    // Append new fields
    fd.append('first_name', document.getElementById('kyc-first-name').value.trim())
    fd.append('last_name', document.getElementById('kyc-last-name').value.trim())
    fd.append('address', document.getElementById('kyc-address').value.trim())
    fd.append('birthdate', document.getElementById('kyc-birthdate').value)

    fd.append('file', idFile, idFile.name)

    try {
      const statusResp = await fetch('/api/_status')
      if (!statusResp.ok) throw new Error('Server not available')

      const resp = await fetch('/api/kyc', { method: 'POST', body: fd })
      if (!resp.ok) throw new Error('KYC upload failed')
      const body = await resp.json()

      // Show preview and message
      const publicUrl = body.publicUrl
      // notify admin UI (if open in same browser) that a KYC submission was made on server
      try { window.dispatchEvent(new CustomEvent('serverKycSubmitted', { detail: { userId: uid, publicUrl } })) } catch (e) { /* ignore */ }

      messageDiv.innerHTML = `
        <div class="alert alert-success">KYC submitted! Please sign in again.</div>`

      // redirect to sign in not sign up (per req: "redirect to sign in not to sign up")
      setTimeout(async () => {
        // Clear session to force re-login or just go to login page
        // actually, redirecting to login page is requested.
        showAuthPage('login')
      }, 1500)
      return
    } catch (err) {
      messageDiv.innerHTML = '<div class="alert alert-error">❌ Upload failed: ' + err.message + '</div>'
    }
  } catch (error) {
    let msg = 'Error submitting KYC. Please try again.'
    if (error && error.message && error.message.includes('Database operations disabled')) {
      msg = 'Server unavailable — your KYC will be saved locally.'
    }
    messageDiv.innerHTML = `<div class="alert alert-error">${msg}</div>`
  }
}

function showKYCStatus(status) {
  const app = document.getElementById('app')
  const statusMessages = {
    pending: {
      title: '⏳ KYC Pending',
      message: 'Your KYC is being reviewed. Please check back later.',
      color: 'alert-info'
    },
    rejected: {
      title: '❌ KYC Rejected',
      message: 'Your KYC was rejected. Please submit again with a valid ID.',
      color: 'alert-error'
    }
  }

  const statusInfo = statusMessages[status]

  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-box">
        <div class="chicken-auth-wrapper" style="margin-bottom: 20px;">
          <img src="/chicken.png" class="chicken-auth-img" alt="Chicken" style="width: 80px; height: 80px;">
        </div>
        <h1 style="color: var(--primary); margin-bottom: 20px;">${statusInfo.title}</h1>
        <div class="alert ${statusInfo.color}" style="margin-bottom: 30px; font-weight: 500; padding: 20px;">
          ${statusInfo.message}
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
          ${status === 'rejected' ? `
            <button class="btn btn-primary" style="width: 100%;" onclick="location.reload()">Resubmit KYC</button>
          ` : ''}
          <button class="btn btn-secondary" style="width: 100%;" onclick="goToLandingPage()">Go to Landing Page</button>
          <button class="btn btn-cta-ghost" style="width: 100%; border: none; font-size: 12px; opacity: 0.7;" onclick="handleLogout()">Logout</button>
        </div>
      </div>
    </div>
  `

  // Define global helper for the button
  window.goToLandingPage = async function () {
    const { showHomepage } = await import('./homepage.js')
    showHomepage()
  }
}

export function getCurrentUser() {
  return currentUser
}

export async function logout() {
  try { await supabase.auth.signOut() } catch (e) { /* ignore signout errors for local mode */ }
  currentUser = null
  // clear any local-mode admin/session flags
  localStorage.removeItem('local_is_admin')
  localStorage.removeItem('local_current_user')
  window.dispatchEvent(new CustomEvent('localAuthChange', { detail: null }))
  showAuthPage('login')
}

window.togglePassword = function (inputId, button) {
  const input = document.getElementById(inputId)
  if (input.type === 'password') {
    input.type = 'text'
    button.textContent = '🙈'
  } else {
    input.type = 'password'
    button.textContent = '👁️'
  }
}

