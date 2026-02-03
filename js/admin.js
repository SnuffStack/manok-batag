// Supabase integration removed — use local DB or scripts instead.
// For development enable admin with:
//   localStorage.setItem('local_is_admin','true')

// Wrap previous isAdmin call with a robust fallback to support server and local modes
export async function isAdmin() {
  // explicit local override
  if (localStorage.getItem('local_is_admin') === 'true') return true

  // check session stored locally
  try {
    const cur = JSON.parse(localStorage.getItem('local_current_user') || 'null')
    if (cur && cur.is_admin) return true
  } catch (e) { /* ignore */ }

  // consult server users by email
  try {
    const resp = await fetch('/api/users')
    if (resp.ok) {
      const { users } = await resp.json()
      const cur = JSON.parse(localStorage.getItem('local_current_user') || 'null')
      const email = cur?.email || null
      if (email) {
        const match = users.find(u => (u.email || '').toLowerCase() === email.toLowerCase())
        if (match && match.is_admin) {
          localStorage.setItem('local_is_admin', 'true')
          try { localStorage.setItem('local_current_user', JSON.stringify({ id: match.id, email: match.email, is_admin: !!match.is_admin })) } catch (e) { }
          return true
        }
      }
    }
  } catch (e) { /* ignore */ }

  return false
}

export async function updateSidebarCounts() {
  const kycBadge = document.getElementById('nav-kyc-count')
  const cashBadge = document.getElementById('nav-cash-count')

  try {
    const [uResp, cResp, sResp] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/cashouts/pending'),
      fetch('/api/subscription-requests/pending')
    ])

    if (uResp.ok) {
      const body = await uResp.json()
      const pendingKYC = (body.users || []).filter(u => u.kyc_status === 'pending').length
      if (kycBadge) {
        kycBadge.textContent = pendingKYC
        kycBadge.style.display = pendingKYC > 0 ? 'inline-block' : 'none'
      }
    }

    if (cResp.ok) {
      const body = await cResp.json()
      const pendingCash = (body.items || []).length
      if (cashBadge) {
        cashBadge.textContent = pendingCash
        cashBadge.style.display = pendingCash > 0 ? 'inline-block' : 'none'
      }
    }

    if (sResp.ok) {
      const body = await sResp.json()
      const pendingSubs = (body.items || []).length
      const subBadge = document.getElementById('nav-sub-count')
      if (subBadge) {
        subBadge.textContent = pendingSubs
        subBadge.style.display = pendingSubs > 0 ? 'inline-block' : 'none'
      }
    }
  } catch (e) {
    console.error('Sidebar counts failed', e)
  }
}

export async function showAdminPanel() {
  const adminStatus = await isAdmin()
  if (!adminStatus) {
    // Non-blocking notification and safe redirect for unauthorized access
    if (typeof showToast === 'function') showToast('Access denied. Admin only.', 'error')
    setTimeout(() => { window.location.href = '/index.html' }, 700)
    return
  }

  const app = document.getElementById('app')

  app.innerHTML = `
    <div class="admin-dashboard">
      <!-- SIDEBAR -->
      <div class="admin-sidebar" id="admin-sidebar">
        <div class="admin-sidebar-header">
          <h2>🔐 Admin</h2>
          <p>Control Panel</p>
        </div>
        <nav class="admin-sidebar-nav">
          <a data-section="dashboard" onclick="showAdminSection('dashboard', event)" class="active"><span>📊</span>Dashboard</a>
          <a data-section="users" onclick="showAdminSection('users', event)"><span>👥</span>Users</a>
          <a data-section="kyc" onclick="showAdminSection('kyc', event)"><span>📋</span>KYC Pending <span class="nav-badge" id="nav-kyc-count" style="display:none">0</span></a>
          <a data-section="cashouts" onclick="showAdminSection('cashouts', event)"><span>💰</span>Cashouts <span class="nav-badge" id="nav-cash-count" style="display:none">0</span></a>
          <a data-section="subscriptions" onclick="showAdminSection('subscriptions', event)"><span>💎</span>Subscriptions <span class="nav-badge" id="nav-sub-count" style="display:none">0</span></a>
          <a data-section="admins" onclick="showAdminSection('admins', event)"><span>🔑</span>Admins</a>
        </nav>
      </div>

      <!-- MAIN CONTENT -->
      <div class="admin-main">
        <div class="admin-header">
          <button class="admin-toggle-sidebar" id="toggle-sidebar" onclick="toggleSidebar()">☰</button>
          <div class="admin-header-actions">
            <button class="btn-refresh" onclick="location.reload()">🔄 Refresh</button>
            <button class="btn-logout" onclick="handleAdminLogout()">🚪 Logout</button>
          </div>
        </div>
        
        <div class="admin-content-wrapper">
          <div id="admin-content">
            <div class="loading">Loading...</div>
          </div>
        </div>
      </div>
    </div>
  `

  // Add CSS if not already in head
  if (!document.querySelector('link[href*="admin.css"]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = '/css/admin.css'
    document.head.appendChild(link)
  }

  // Populate caches before loading sections
  await refreshCaches()

  showAdminSection('dashboard')
  updateSidebarCounts()

  // Ensure modal container exists (used for user details / confirmations)
  if (!document.getElementById('admin-modal-backdrop')) {
    const modalBackdrop = document.createElement('div')
    modalBackdrop.id = 'admin-modal-backdrop'
    modalBackdrop.className = 'admin-modal-backdrop'
    modalBackdrop.innerHTML = '<div class="admin-modal" id="admin-modal"><div class="admin-modal-content" id="admin-modal-content"></div></div>'
    document.body.appendChild(modalBackdrop)

    // close modal when clicking on backdrop (outside modal)
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'admin-modal-backdrop') closeAdminModal()
    })

    // close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAdminModal()
    })

    // Add toast container for user feedback
    if (!document.getElementById('admin-toast-container')) {
      const toastContainer = document.createElement('div')
      toastContainer.id = 'admin-toast-container'
      toastContainer.className = 'admin-toast-container'
      document.body.appendChild(toastContainer)
    }
  }
}

// NEW: toggle sidebar on mobile
window.toggleSidebar = function () {
  const sidebar = document.getElementById('admin-sidebar')
  sidebar.classList.toggle('collapsed')
}

// Close sidebar when clicking a nav link on mobile
window.showAdminSection = async function (section, event) {
  // Prevent default anchor navigation (if any)
  if (event && event.preventDefault) event.preventDefault()

  // DEBUG: console + small banner to confirm clicks
  try {
    console.log('showAdminSection called:', section, event)
    let debugBanner = document.getElementById('admin-debug-banner')
    if (!debugBanner) {
      debugBanner = document.createElement('div')
      debugBanner.id = 'admin-debug-banner'
      debugBanner.style.cssText = 'position:fixed;top:80px;right:20px;background:rgba(0,0,0,0.82);color:#fff;padding:8px 12px;border-radius:6px;z-index:3000;font-weight:700;box-shadow:0 6px 18px rgba(0,0,0,0.12)'
      document.body.appendChild(debugBanner)
    }
    debugBanner.textContent = `Loading ${section}...`
    setTimeout(() => { debugBanner.remove() }, 1400)
  } catch (e) { console.warn('Debug banner failed', e) }

  // Update nav active state
  document.querySelectorAll('.admin-sidebar-nav a').forEach(a => a.classList.remove('active'))
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active')
  } else {
    const el = document.querySelector(`.admin-sidebar-nav a[data-section="${section}"]`)
    if (el) el.classList.add('active')
  }

  // Close sidebar on mobile after clicking
  const sidebar = document.getElementById('admin-sidebar')
  if (window.innerWidth <= 768) {
    sidebar.classList.add('collapsed')
  }

  const content = document.getElementById('admin-content')

  // update location hash for deep linking
  try { history.replaceState && history.replaceState({}, '', '#admin-' + section) } catch (e) { }

  if (section === 'dashboard') {
    await loadDashboard()
  } else if (section === 'users') {
    await loadUsers()
  } else if (section === 'kyc') {
    await loadKYCPending()
  } else if (section === 'cashouts') {
    await loadCashouts()
  } else if (section === 'subscriptions') {
    await loadSubscriptions()
  } else if (section === 'admins') {
    await loadAdmins()
  }

  // scroll content to top so the user sees the new section immediately
  if (content && content.scrollTop !== undefined) content.scrollTop = 0
}

// NEW: dashboard overview
async function loadDashboard() {
  const content = document.getElementById('admin-content')
  content.innerHTML = '<div class="loading">Loading stats...</div>'

  let users = []
  let cashouts = []

  try {
    const [uResp, cResp] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/cashouts')
    ])
    if (uResp.ok) {
      const b = await uResp.json()
      users = b.users || []
    }
    if (cResp.ok) {
      const b = await cResp.json()
      cashouts = b.items || []
    }
  } catch (e) {
    console.error('Stats load failed', e)
  }

  const totalUsers = users.length
  const totalAdmins = users.filter(u => u.is_admin).length
  // For pending KYC, we should strictly check the pending list, but user status is a decent proxy
  const pendingKYC = users.filter(u => u.kyc_status === 'pending').length
  const pendingCashouts = cashouts.filter(c => c.status === 'pending').length

  content.innerHTML = `
    <div class="admin-stats">
      <div class="admin-stat-card">
        <div class="admin-stat-icon blue">👥</div>
        <div class="admin-stat-info">
          <h3>Total Users</h3>
          <p>${totalUsers}</p>
        </div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-icon orange">🔑</div>
        <div class="admin-stat-info">
          <h3>Admins</h3>
          <p>${totalAdmins}</p>
        </div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-icon red">📋</div>
        <div class="admin-stat-info">
          <h3>Pending KYC</h3>
          <p>${pendingKYC}</p>
        </div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-icon green">💰</div>
        <div class="admin-stat-info">
          <h3>Pending Cashouts</h3>
          <p>${pendingCashouts}</p>
        </div>
      </div>
    </div>

    <!-- Referral card (admin's personal link) -->
    <div class="panel-card">
      <div class="panel-header">
        <h2>Your Referral Link</h2>
      </div>
      <div class="panel-body referral-card">
        ${await (async () => {
      const current = getCurrentLocalUser()
      let me = null
      if (current) {
        // try match by id first, then by email (handles server-authenticated user)
        me = users.find(u => u.id === current.id) || users.find(u => (u.email || '').toLowerCase() === (current.email || '').toLowerCase())
      }
      // If still not found, try to fetch from server users and merge into local users
      if (!me && current && current.email) {
        try {
          const resp = await fetch('/api/users')
          if (resp.ok) {
            const { users: serverUsers } = await resp.json()
            const s = serverUsers.find(u => (u.email || '').toLowerCase() === (current.email || '').toLowerCase())
            if (s) {
              const localMatch = users.find(u => (u.email || '').toLowerCase() === (s.email || '').toLowerCase())
              if (localMatch) {
                localMatch.referral_code = localMatch.referral_code || (s.referral_code || generateReferralCode())
              } else {
                users.push({
                  id: s.id,
                  email: s.email,
                  bananas: s.bananas || 0,
                  eggs: s.eggs || 0,
                  balance: s.balance || 0,
                  kyc_status: s.kyc_status || 'pending',
                  subscription: s.subscription || null,
                  referral_code: s.referral_code || generateReferralCode(),
                  is_admin: !!s.is_admin,
                  role: s.role || null,
                  created_at: s.created_at || new Date().toISOString()
                })
              }
              saveUsersData(users)
              me = users.find(u => (u.email || '').toLowerCase() === (s.email || '').toLowerCase())
            }
          }
        } catch (e) { /* ignore */ }
      }
      let code = me && me.referral_code ? me.referral_code.toUpperCase() : null
      // If current admin has no referral code, generate and persist one automatically
      if (!code && me) {
        me.referral_code = generateReferralCode()
        saveUsersData(users)
        code = me.referral_code.toUpperCase()
        showToast('Referral code created', 'success')
      }
      if (!code) return `<div style="color:var(--gray)">No referral code assigned. Create one in <strong>Users → Create</strong>.</div>`
      const url = (location.origin || window.location.origin) + (location.pathname || '/') + '?ref=' + code
      return `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
              <div style="flex:1;min-width:220px">
                <div style="font-weight:800;font-size:15px;color:#233040">${code}</div>
                <div style="font-size:12px;color:var(--gray);margin-top:6px">Share this link to invite new users and earn bonuses.</div>
              </div>
              <div style="display:flex;gap:8px;align-items:center">
                <input id="admin-referral-link" readonly value="${url}" style="padding:8px 10px;border:1px solid var(--border);border-radius:6px;width:360px;max-width:50vw;background:#FBFBFD" />
                <button class="btn btn-secondary" onclick="(function(){ try{ navigator.clipboard.writeText(document.getElementById('admin-referral-link').value); showToast('Referral link copied', 'success') }catch(e){ showToast('Could not copy', 'error') } })()">Copy</button>
              </div>
            </div>
          `
    })()}
      </div>
    </div>

    <div style="text-align: center; padding: 40px; color: #999;">
      <p>Welcome to the Admin Panel. Select a section from the sidebar to get started.</p>
    </div>
  `
}

// Safe money formatter
function formatMoney(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

// Generate a short uppercase referral code (helper)
function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Helper functions for backwards compatibility (sync wrappers that return cached data)
// These use a simple in-memory cache that gets refreshed on each admin section load
let _cachedUsers = []
let _cachedCashouts = []

function loadUsersData() {
  // Return cached data (populated by async loaders)
  return _cachedUsers
}

function saveUsersData(users) {
  // No-op: data is saved via API calls, not local storage
  console.warn('saveUsersData called but data should be saved via API')
}

function loadCashoutsData() {
  // Return cached data
  return _cachedCashouts
}

// Helper to refresh caches from server
async function refreshCaches() {
  try {
    const [uResp, cResp] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/cashouts')
    ])
    if (uResp.ok) {
      const b = await uResp.json()
      _cachedUsers = b.users || []
    }
    if (cResp.ok) {
      const b = await cResp.json()
      _cachedCashouts = b.items || []
    }
  } catch (e) {
    console.error('Cache refresh failed', e)
  }
}

// Avatar helper function
function avatarFromEmail(email) {
  try {
    if (!email) return '?'
    // if email is actually a phone number
    if (/^\d+$/.test(email)) return '📱'
    const name = (email.split('@')[0] || '').replace(/[^a-zA-Z0-9]/g, ' ')
    const parts = name.split(' ').filter(Boolean)
    if (parts.length === 0) return '?'
    return parts.length === 1 ? parts[0].slice(0, 1).toUpperCase() : (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase()
  } catch (e) { return '?' }
}

// UID generator for backwards compatibility
function uid() {
  return Math.random().toString(36).slice(2, 10)
}

async function loadUsers() {
  const content = document.getElementById('admin-content')
  content.innerHTML = '<div class="loading">Loading users...</div>'

  let allUsers = []
  try {
    const resp = await fetch('/api/users')
    if (resp.ok) {
      const body = await resp.json()
      allUsers = body.users || []
    }
  } catch (e) {
    console.error('Failed to load users', e)
  }

  // Sort by created_at desc
  allUsers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const searchValue = document.getElementById('admin-user-search') ? document.getElementById('admin-user-search').value.trim().toLowerCase() : ''

  const filtered = allUsers.filter(u => {
    if (!searchValue) return true
    return (u.email || '').toLowerCase().includes(searchValue) ||
      ((u.referral_code || '').toLowerCase().includes(searchValue))
  })

  if (!filtered || filtered.length === 0) {
    content.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <h2>User Directory (0)</h2>
        </div>
        <div class="panel-body">
          <div class="admin-empty-state"><p>No users found.</p></div>
        </div>
      </div>
    `
    return
  }

  // Helper for avatar (inline to avoid dependency on removed function if not hoisted)
  const getAvatar = (email) => {
    try {
      if (!email) return ''
      const name = (email.split('@')[0] || '').replace(/[^a-zA-Z0-9]/g, ' ')
      const parts = name.split(' ').filter(Boolean)
      return parts.length === 1 ? parts[0].slice(0, 1).toUpperCase() : (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase()
    } catch (e) { return '' }
  }

  content.innerHTML = `
    <div class="panel-card">
      <div class="panel-header">
        <h2>User Directory (${filtered.length})</h2>
        <div class="panel-controls">
          <input id="admin-user-search" placeholder="Search by email or referral..." value="${searchValue}" oninput="loadUsers()" />
          <div class="panel-controls-buttons">
            <button class="btn btn-primary" onclick="createUser()">+ Create</button>
          </div>
        </div>
      </div>
      <div class="panel-body user-list">
        ${filtered.map(user => `
          <div class="user-list-item" onclick="showUserDetails('${user.id}')" onkeydown="if(event.key==='Enter' || event.key===' ') { event.preventDefault(); showUserDetails('${user.id}'); }" role="button" tabindex="0">
            <div class="user-left">
              <div class="user-avatar">${getAvatar(user.email)}</div>
              <div class="user-meta">
                <div class="user-email">${user.email || 'N/A'}</div>
                <div class="user-sub">${user.subscription || 'Free'} ${user.referral_code ? ` • CODE: ${user.referral_code.toUpperCase()}` : ''}</div>
              </div>
            </div>
            <div class="user-right-info">
              <div class="user-assets">
                <div class="asset">🍌 ${user.bananas || 0}</div>
                <div class="asset balance">₱${formatMoney(user.balance)}</div> 
              </div>
              <div class="user-status"><span class="status-badge ${user.kyc_status || 'pending'}">${user.kyc_status || 'pending'}</span></div>
              <div class="user-actions">
                <button class="btn btn-info btn-sm" onclick="event.stopPropagation(); showUserDetails('${user.id}')">View</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

// --- REPLACED: loadKYCPending to use local storage ---
async function loadKYCPending() {
  const content = document.getElementById('admin-content')

  // Try server-backed pending list first (server is source of truth)
  try {
    const resp = await fetch('/api/kyc/pending')
    if (resp.ok) {
      const { items } = await resp.json()
      if (items && items.length > 0) {
        // Fetch users to display email/metadata
        let usersMap = {}
        try {
          const uresp = await fetch('/api/users')
          if (uresp.ok) {
            const body = await uresp.json()
            usersMap = (body.users || []).reduce((acc, u) => { acc[u.id] = u; return acc }, {})
          }
        } catch (e) { /* ignore */ }

        // Enrich items: if we don't have a user for a k.userId, try fetching it individually
        for (let k of items) {
          if (!usersMap[k.userId]) {
            // if userId looks like an email, prefer a server-wide search by email
            if (typeof k.userId === 'string' && k.userId.includes('@')) {
              try {
                const bulk = await fetch('/api/users')
                if (bulk.ok) {
                  const body = await bulk.json()
                  const found = (body.users || []).find(u => (u.email || '').toLowerCase() === (k.userId || '').toLowerCase())
                  if (found) { usersMap[k.userId] = found; continue }
                }
              } catch (e) { /* ignore */ }
              // nothing found — leave unresolved so we'll display email string
              continue
            }

            // try fetching by id directly (may 404 if user missing)
            try {
              const r = await fetch('/api/users/' + encodeURIComponent(k.userId))
              if (r.ok) {
                const b = await r.json()
                usersMap[k.userId] = b.user
                continue
              }
            } catch (e) { /* ignore */ }

            // fallback: attempt to find by scanning all users for an email that matches the userId string
            try {
              const bulk = await fetch('/api/users')
              if (bulk.ok) {
                const body = await bulk.json()
                const found = (body.users || []).find(u => (u.id || '') === (k.userId || '') || (u.email || '').toLowerCase() === (String(k.userId || '')).toLowerCase())
                if (found) { usersMap[k.userId] = found }
              }
            } catch (e) { /* ignore */ }
          }
        }

        // Build HTML rows with friendly display (email when known, fallback to shortened id)
        const itemsHtml = items.map(k => {
          const u = usersMap[k.userId]
          const display = (u && u.email) ? u.email : (typeof k.userId === 'string' && k.userId.includes('@') ? k.userId : (String(k.userId || '').slice(0, 8) + '...'))
          const code = (u && u.referral_code) ? u.referral_code.toUpperCase() : '—'
          // Normalize file path: convert backslashes to forward slashes and ensure a leading slash
          const viewUrl = k.filepath ? (k.filepath.startsWith('http') ? k.filepath : ('/' + String(k.filepath).replace(/\\/g, '/').replace(/^\/+/, ''))) : ''
          return `
            <div class="kyc-card">
              <div class="kyc-left">
                <div class="user-avatar small">${avatarFromEmail(display)}</div>
                <div class="kyc-meta">
                  <div class="user-email">${display}</div>
                  <div class="user-sub">${k.idType || (u && u.kyc_id_type) || 'ID Document'} • ${k.submitted_at ? new Date(k.submitted_at).toLocaleDateString() : ''}</div>
                  <div class="user-code">CODE: ${code}</div>
                </div>
              </div>
              <div class="kyc-actions">
                <button type="button" class="btn btn-success" onclick="event.preventDefault(); approveKYC('${k.userId}', '${k.id}')">Approve</button>
                <button type="button" class="btn btn-danger" onclick="event.preventDefault(); rejectKYC('${k.userId}', '${k.id}')">Reject</button>
                ${viewUrl ? `<button type="button" class="btn btn-info" onclick="event.preventDefault(); previewKycDocument('${viewUrl}', '${display.replace(/'/g, "\\'")}')">View ID</button>` : ''}
              </div>
            </div>
          `
        }).join('')

        content.innerHTML = `
          <div class="panel-card">
            <div class="panel-header">
              <h2>Pending KYC (${items.length})</h2>
            </div>
            <div class="panel-body kyc-grid">
              ${itemsHtml}
            </div>
          </div>
        `
        return
      }
    }
  } catch (e) {
    /* ignore server errors */
  }

  content.innerHTML = '<div class="panel-card"><div class="panel-body"><div class="admin-empty-state"><p>No pending KYC requests.</p></div></div></div>'
}

async function loadCashouts() {
  const content = document.getElementById('admin-content')
  content.innerHTML = '<div class="loading">Loading cashouts...</div>'

  let cashouts = []
  let usersMap = {}

  try {
    // Load pending
    const resp = await fetch('/api/cashouts/pending')
    if (resp.ok) {
      const body = await resp.json()
      cashouts = body.items || []
    }

    // Load users for email mapping
    const uResp = await fetch('/api/users')
    if (uResp.ok) {
      const uBody = await uResp.json()
      usersMap = (uBody.users || []).reduce((acc, u) => { acc[u.id] = u; return acc }, {})
    }
  } catch (e) {
    console.error('Failed to load cashouts', e)
  }

  if (!cashouts || cashouts.length === 0) {
    content.innerHTML = '<div class="panel-card"><div class="panel-body"><div class="admin-empty-state"><p>No pending cashout requests.</p></div></div></div>'
    return
  }

  content.innerHTML = `
    <div class="panel-card">
      <div class="panel-header">
        <h2>Withdrawal Requests (${cashouts.length})</h2>
      </div>
      <div class="panel-body cashout-table">
        <div class="cashout-table-header">
          <div>USER</div>
          <div>METHOD</div>
          <div>AMOUNT</div>
          <div>STATUS</div>
        </div>
        ${cashouts.map(c => `
          <div class="cashout-row">
            <div class="cashout-user">${(usersMap[c.userId]?.email) || (c.userId || '').substring(0, 8)}</div>
            <div class="cashout-method">${c.payment_method || 'N/A'} • ${c.account_details || 'N/A'}</div>
            <div class="cashout-amount">₱${formatMoney(c.amount)}</div>
            <div class="cashout-actions">
              <button class="btn btn-info" onclick="openProcessCashoutModal('${c.id}')">Process</button>
              <button class="btn btn-secondary" style="margin-left:8px" onclick="openCashoutRejectModal('${c.id}')">Reject</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

async function loadSubscriptions() {
  const content = document.getElementById('admin-content')
  content.innerHTML = '<div class="loading">Loading subscription requests...</div>'

  try {
    const [sResp, uResp, setResp] = await Promise.all([
      fetch('/api/subscription-requests/pending'),
      fetch('/api/users'),
      fetch('/api/settings')
    ])

    if (!sResp.ok) throw new Error('Failed to load subscriptions')
    const { items } = await sResp.json()
    const { users } = await uResp.json()
    const { settings } = await setResp.json()
    const usersMap = users.reduce((acc, u) => { acc[u.id] = u; return acc }, {})
    const pm = settings?.payment_methods || {}

    content.innerHTML = `
      <div class="panel-card" style="margin-bottom: 30px; border: 2px solid var(--primary);">
        <div class="panel-header" style="background: rgba(255, 149, 0, 0.05);">
          <h2>⚙️ Global Payment Settings</h2>
          <p style="font-size: 12px; color: var(--gray);">Changing these affects what users see when they activate a subscription.</p>
        </div>
        <div class="panel-body">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            <!-- GCash -->
            <div style="padding: 15px; background: #f9f9f9; border-radius: 12px; border: 1px solid #eee;">
              <h3 style="margin-bottom: 12px; color: #333; font-size: 14px;">GCash Details</h3>
              <div class="form-group" style="margin-bottom: 10px;">
                <label style="font-size: 11px;">Account Number</label>
                <input type="text" id="set-gcash-number" value="${pm.gcash?.number || ''}" placeholder="09XX-XXX-XXXX" />
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px;">Account Name</label>
                <input type="text" id="set-gcash-name" value="${pm.gcash?.accountName || ''}" placeholder="Admin Name" />
              </div>
            </div>
            <!-- Maya -->
            <div style="padding: 15px; background: #f9f9f9; border-radius: 12px; border: 1px solid #eee;">
              <h3 style="margin-bottom: 12px; color: #333; font-size: 14px;">Maya Details</h3>
              <div class="form-group" style="margin-bottom: 10px;">
                <label style="font-size: 11px;">Account Number</label>
                <input type="text" id="set-maya-number" value="${pm.maya?.number || ''}" placeholder="09XX-XXX-XXXX" />
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px;">Account Name</label>
                <input type="text" id="set-maya-name" value="${pm.maya?.accountName || ''}" placeholder="Admin Name" />
              </div>
            </div>
            <!-- GoTyme -->
            <div style="padding: 15px; background: #f9f9f9; border-radius: 12px; border: 1px solid #eee;">
              <h3 style="margin-bottom: 12px; color: #333; font-size: 14px;">GoTyme Details</h3>
              <div class="form-group" style="margin-bottom: 10px;">
                <label style="font-size: 11px;">Account Number</label>
                <input type="text" id="set-gotyme-number" value="${pm.gotyme?.number || ''}" placeholder="XXXX-XXXX-XXXX" />
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px;">Account Name</label>
                <input type="text" id="set-gotyme-name" value="${pm.gotyme?.accountName || ''}" placeholder="Admin Name" />
              </div>
            </div>
          </div>
          <div style="margin-top: 20px; text-align: right;">
            <button class="btn btn-primary" style="width: auto; padding: 10px 30px;" onclick="updatePaymentSettings()">Save Settings</button>
          </div>
        </div>
      </div>

      <div class="panel-card">
        <div class="panel-header">
          <h2>Subscription Requests (${items.length})</h2>
        </div>
        <div class="panel-body">
          ${items.length === 0 ? '<div class="admin-empty-state"><p>No pending subscription requests.</p></div>' : `
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Payment</th>
                  <th>Reference</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(req => {
      const u = usersMap[req.userId]
      return `
                    <tr>
                      <td>
                        <div style="font-weight:700">${u?.email || 'N/A'}</div>
                        <div style="font-size:11px;color:#999">UID: ${req.userId.slice(0, 8)}</div>
                      </td>
                      <td><span class="status-badge approved">${req.plan.toUpperCase()}</span></td>
                      <td><strong>${req.method}</strong> (₱${req.price})</td>
                      <td><code>${req.refNumber}</code></td>
                      <td>${new Date(req.requested_at).toLocaleDateString()}</td>
                      <td>
                        <button class="btn btn-sm btn-success" onclick="approveSubscription('${req.id}')">Approve</button>
                        <button class="btn btn-sm btn-secondary" onclick="rejectSubscription('${req.id}')">Reject</button>
                      </td>
                    </tr>
                  `
    }).join('')}
              </tbody>
            </table>
          </div>
          `}
        </div>
      </div>
    `
  } catch (e) {
    content.innerHTML = `<div class="alert alert-error">Error: ${e.message}</div>`
  }
}

window.updatePaymentSettings = async function () {
  const gNumber = document.getElementById('set-gcash-number').value.trim()
  const gName = document.getElementById('set-gcash-name').value.trim()
  const mNumber = document.getElementById('set-maya-number').value.trim()
  const mName = document.getElementById('set-maya-name').value.trim()
  const tNumber = document.getElementById('set-gotyme-number').value.trim()
  const tName = document.getElementById('set-gotyme-name').value.trim()

  const payload = {
    payment_methods: {
      gcash: { name: 'GCash', number: gNumber, accountName: gName },
      maya: { name: 'Maya', number: mNumber, accountName: mName },
      gotyme: { name: 'GoTyme', number: tNumber, accountName: tName }
    }
  }

  try {
    const resp = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!resp.ok) throw new Error('Failed to update settings')
    showToast('Payment settings updated successfully!', 'success')
  } catch (e) {
    showToast(e.message, 'error')
  }
}

async function approveSubscription(requestId) {
  if (!confirm('Approve this subscription and grant bananas?')) return

  try {
    const resp = await fetch('/api/subscription-requests/' + requestId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' })
    })

    if (!resp.ok) throw new Error('Failed to approve')
    showToast('Subscription approved!', 'success')
    loadSubscriptions()
    updateSidebarCounts()
  } catch (e) {
    showToast(e.message, 'error')
  }
}

async function rejectSubscription(requestId) {
  const reason = prompt('Reason for rejection:')
  if (reason === null) return // cancelled

  try {
    const resp = await fetch('/api/subscription-requests/' + requestId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected', reason: reason || 'Payment not verified' })
    })

    if (!resp.ok) throw new Error('Failed to reject')
    showToast('Subscription rejected', 'info')
    loadSubscriptions()
    updateSidebarCounts()
  } catch (e) {
    showToast(e.message, 'error')
  }
}

async function loadAdmins() {
  const content = document.getElementById('admin-content')
  content.innerHTML = '<div class="loading">Loading admins...</div>'

  let admins = []
  try {
    const resp = await fetch('/api/users')
    if (resp.ok) {
      const body = await resp.json()
      admins = (body.users || []).filter(u => u.is_admin)
    }
  } catch (e) { console.error(e) }

  if (!admins || admins.length === 0) {
    content.innerHTML = '<div class="panel-card"><div class="panel-body"><div class="admin-empty-state"><p>No admins found.</p></div></div></div>'
    return
  }

  const getAvatar = (email) => {
    try {
      if (!email) return ''
      const name = (email.split('@')[0] || '').replace(/[^a-zA-Z0-9]/g, ' ')
      const parts = name.split(' ').filter(Boolean)
      return parts.length === 1 ? parts[0].slice(0, 1).toUpperCase() : (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase()
    } catch (e) { return '' }
  }

  content.innerHTML = `
    <div class="panel-card">
      <div class="panel-header"><h2>Admin Accounts (${admins.length})</h2></div>
      <div class="panel-body admin-grid">
        ${admins.map(a => `
          <div class="admin-card">
            <div class="user-left">
              <div class="user-avatar">${getAvatar(a.email)}</div>
              <div class="user-meta"><div class="user-email">${a.email}</div><div class="user-sub">Joined ${a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A'}</div></div>
            </div>
            <div class="user-actions"><button class="btn-sm btn-danger" onclick="revokeAdmin('${a.id}')">Revoke Admin</button></div>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

// --- IMPLEMENTED: actions that update local storage ---
async function grantAdmin(userId) {
  if (!confirm('Promote this user to admin?')) return
  try {
    const resp = await fetch('/api/admin/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isAdmin: true })
    })
    if (!resp.ok) throw new Error('Failed to promote')
    alert('User promoted to admin.')
    await loadUsers()
    await loadAdmins()
  } catch (e) {
    alert('Error: ' + e.message)
  }
}

async function revokeAdmin(userId) {
  if (!confirm('Revoke admin privileges?')) return
  try {
    const resp = await fetch('/api/admin/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isAdmin: false })
    })
    if (!resp.ok) throw new Error('Failed to revoke')
    alert('Admin privileges revoked.')
    await loadUsers()
    await loadAdmins()
  } catch (e) {
    alert('Error: ' + e.message)
  }
}



async function approveKYC(userId, kycId) {
  try {
    let idToUse = kycId
    if (!idToUse) {
      const kycResp = await fetch('/api/kyc/user/' + userId)
      if (!kycResp.ok) throw new Error('Could not find KYC record for user')
      const { item } = await kycResp.json()
      idToUse = item.id
    }

    const resp = await fetch('/api/kyc/' + idToUse, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' })
    })
    if (!resp.ok) throw new Error('Approval failed')

    closeAdminModal()
    showToast('KYC approved', 'success')
    await loadKYCPending()
    updateSidebarCounts()
    loadUsers() // Refresh user list status
  } catch (e) {
    showToast('Error: ' + e.message, 'error')
  }
}

async function rejectKYC(userId, kycId) {
  const reason = prompt('Reason for rejection:')
  if (!reason || !reason.trim()) return

  try {
    let idToUse = kycId
    if (!idToUse) {
      const kycResp = await fetch('/api/kyc/user/' + userId)
      if (!kycResp.ok) throw new Error('Could not find KYC record for user')
      const { item } = await kycResp.json()
      idToUse = item.id
    }

    const resp = await fetch('/api/kyc/' + idToUse, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', reason })
    })
    if (!resp.ok) throw new Error('Rejection failed')

    closeAdminModal()
    showToast('KYC rejected', 'info')
    await loadKYCPending()
    updateSidebarCounts()
    loadUsers()
  } catch (e) {
    showToast('Error: ' + e.message, 'error')
  }
}

// Open a modal to confirm processing a cashout
function openProcessCashoutModal(cashoutId) {
  const cashouts = loadCashoutsData()
  const c = cashouts.find(x => x.id === cashoutId)
  if (!c) return openAdminModal({ title: 'Cashout not found', body: '<p>Cashout not found.</p>', footer: '<button class="btn-primary" onclick="closeAdminModal()">Close</button>' })
  const users = loadUsersData().reduce((acc, u) => { acc[u.id] = u; return acc }, {})
  const user = users[c.userId]
  const body = `
    <div style="display:flex;gap:12px;align-items:flex-start">
      <div style="flex:1">
        <div><strong>User</strong><div style="font-weight:700;margin-top:6px">${user?.email || 'N/A'}</div></div>
        <div style="margin-top:10px"><strong>Method</strong><div style="font-weight:700;margin-top:6px">${c.payment_method || 'N/A'} • ${c.account_details || ''}</div></div>
      </div>
      <div style="text-align:right;min-width:160px">
        <div><strong>Amount</strong><div style="font-weight:800;color:#2E7D32;margin-top:6px">₱${formatMoney(c.amount)}</div></div>
        <div style="margin-top:12px"><small class="text-muted">Requested: ${c.requested_at ? new Date(c.requested_at).toLocaleString() : 'N/A'}</small></div>
      </div>
    </div>
  `
  const footer = `<button class="btn-secondary" onclick="closeAdminModal()">Cancel</button> <button class="btn btn-info" onclick="approveCashoutConfirmed('${c.id}')">Process</button>`
  openAdminModal({ title: 'Process Cashout', body, footer, large: false })
}

async function approveCashoutConfirmed(cashoutId) {
  try {
    const resp = await fetch('/api/cashouts/' + cashoutId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' })
    })
    if (!resp.ok) throw new Error('Failed to approve')

    closeAdminModal()
    showToast('Cashout processed', 'success')
    await loadCashouts()
    updateSidebarCounts()
  } catch (e) {
    showToast('Error: ' + e.message, 'error')
  }
}

async function rejectCashout(cashoutId) {
  if (!confirm('Are you sure you want to reject this cashout? The balance will be refunded to the user and this record will be deleted.')) return
  try {
    const resp = await fetch('/api/cashouts/' + cashoutId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' })
    })
    if (!resp.ok) throw new Error('Failed to reject')

    showToast('Cashout rejected and balance refunded', 'info')
    await loadCashouts()
    updateSidebarCounts()
  } catch (e) {
    showToast('Error: ' + e.message, 'error')
  }
}

// Keep aliases but point to the new direct handler
window.openCashoutRejectModal = rejectCashout
window.rejectCashoutConfirmed = (id) => rejectCashout(id)
window.rejectCashout = rejectCashout

// --- NEW: create user + show details helpers ---
async function createUser() {
  // open modal form for creating a user (allows setting referral data)
  const users = loadUsersData()
  const referralOptions = users.map(u => `<option value="${u.referral_code || ''}">${u.email} ${u.referral_code ? ' • ' + u.referral_code : ''}</option>`).join('')
  const body = `
    <form id="create-user-form" onsubmit="event.preventDefault(); createUserConfirmed();" style="display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;gap:8px">
        <div style="flex:1">
          <label>Email</label>
          <input id="create-email" type="email" required />
        </div>
        <div style="width:140px">
          <label>Bananas</label>
          <input id="create-bananas" type="number" value="0" />
        </div>
        <div style="width:140px">
          <label>Eggs</label>
          <input id="create-eggs" type="number" value="0" />
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <div style="flex:1">
          <label>Referral code (leave blank to generate)</label>
          <input id="create-referral" placeholder="e.g. ABC123" />
        </div>
        <div style="width:280px">
          <label>Referred by (optional)</label>
          <select id="create-upline">
            <option value="">— none —</option>
            ${referralOptions}
          </select>
        </div>
      </div>
    </form>
  `
  const footer = `<button class="btn-secondary" onclick="closeAdminModal()">Cancel</button> <button class="btn-primary" onclick="createUserConfirmed()">Create</button>`
  openAdminModal({ title: 'Create New User', body, footer, large: false })
}

function createUserConfirmed() {
  const emailEl = document.getElementById('create-email')
  if (!emailEl) return
  const email = (emailEl.value || '').trim().toLowerCase()
  if (!email) return showToast('Email is required', 'error')
  const users = loadUsersData()
  if (users.find(u => u.email === email)) return showToast('User already exists', 'error')

  const bananas = parseInt(document.getElementById('create-bananas').value, 10) || 0
  const eggs = parseInt(document.getElementById('create-eggs').value, 10) || 0
  let referral = (document.getElementById('create-referral').value || '').trim() || null
  const upline = (document.getElementById('create-upline').value || '').trim() || null

  if (!referral) referral = generateReferralCode()
  referral = referral.toUpperCase()

  // apply referral bonus if upline provided
  let referredBy = null
  if (upline) {
    const refUser = users.find(x => (x.referral_code || '').toUpperCase() === upline.toUpperCase())
    if (refUser) {
      refUser.bananas = (refUser.bananas || 0) + 1
      refUser.referrals = (refUser.referrals || 0) + 1
      referredBy = refUser.id
    }
  }

  const u = {
    id: uid(),
    email,
    bananas,
    eggs,
    balance: 0,
    kyc_status: 'pending',
    subscription: 'None',
    referral_code: referral,
    referred_by: referredBy,
    is_admin: false,
    role: 'user',
    created_at: new Date().toISOString()
  }
  users.push(u)
  saveUsersData(users)
  updateSidebarCounts()
  closeAdminModal()
  showToast('User created', 'success')
  loadUsers()
}

function openAdminModal({ title = '', body = '', footer = '', large = false } = {}) {
  if (!document.getElementById('admin-modal-backdrop')) return alert(title + "\n" + body.replace(/<[^>]*>/g, ''))
  const backdrop = document.getElementById('admin-modal-backdrop')
  const modalContent = document.getElementById('admin-modal-content')
  modalContent.innerHTML = `
    <div class="admin-modal-wrapper ${large ? 'large' : ''}">
      <div class="admin-modal-header">
        <h3>${title}</h3>
        <button class="admin-modal-close" onclick="closeAdminModal()">✕</button>
      </div>
      <div class="admin-modal-body">${body}</div>
      <div class="admin-modal-footer">${footer}</div>
    </div>
  `
  backdrop.classList.add('show')
  document.body.classList.add('modal-open')
}

function closeAdminModal() {
  const backdrop = document.getElementById('admin-modal-backdrop')
  if (!backdrop) return
  backdrop.classList.remove('show')
  document.body.classList.remove('modal-open')
}

// Preview KYC document in a modal
function previewKycDocument(url, email) {
  console.log('previewKycDocument called with:', { url, email });
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url)
  const isPdf = /\.pdf$/i.test(url)

  let bodyContent = ''
  if (isImage) {
    bodyContent = `
      <div style="text-align:center;max-height:70vh;overflow:auto">
        <img src="${url}" alt="KYC Document" style="max-width:100%;max-height:65vh;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.15)" onerror="console.error('Image load failed:', this.src); this.parentElement.innerHTML='<p style=\\'color:#C62828;padding:40px\\'>Failed to load image. The file may not exist or is not accessible.</p>'" />
      </div>
    `
  } else if (isPdf) {
    bodyContent = `
      <div style="text-align:center">
        <iframe src="${url}" style="width:100%;height:65vh;border:none;border-radius:8px"></iframe>
      </div>
    `
  } else {
    bodyContent = `
      <div style="text-align:center;padding:50px 20px">
        <div style="font-size:48px;margin-bottom:15px;opacity:0.6">📎</div>
        <p style="margin-bottom:25px;color:#666;font-weight:500">This file type (${url.split('.').pop().toUpperCase()}) cannot be previewed directly.</p>
        <a href="${url}" download class="btn btn-primary" style="display:inline-block;padding:14px 30px;text-decoration:none;border-radius:10px;font-weight:700;box-shadow:0 4px 15px rgba(255, 149, 0, 0.3)">DOWNLOAD FILE</a>
      </div>
    `
  }

  try {
    openAdminModal({
      title: `KYC Document - ${email || 'Preview'}`,
      body: bodyContent,
      footer: `
        <button type="button" class="btn btn-secondary" onclick="closeAdminModal()">Close</button> 
        <a href="${url}" target="_blank" class="btn btn-info" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center">Open in New Tab</a>
      `,
      large: true
    })
  } catch (e) {
    console.error('Modal open failed:', e)
    alert('Failed to open preview: ' + e.message)
  }
}

window.previewKycDocument = previewKycDocument

function showUserDetails(userId) {
  const users = loadUsersData()
  const u = users.find(x => x.id === userId)
  if (!u) return openAdminModal({ title: 'User not found', body: '<p>User not found.</p>', footer: '<button class="btn-primary" onclick="closeAdminModal()">Close</button>' })
  const referralsCount = loadUsersData().filter(x => x.referred_by === u.id).length
  const body = `
    <div class="user-details-card">
      <div class="ud-left">
        <div class="user-avatar large">${avatarFromEmail(u.email)}</div>
      </div>
      <div class="ud-center">
        <div class="ud-email">${u.email}</div>
        <div class="ud-code">CODE: ${u.referral_code ? (u.referral_code.toUpperCase()) : '—'}</div>
        <div style="margin-top:6px"><button class="btn-sm btn-secondary" onclick="adminCopyReferralLink('${u.id}')">Copy link</button></div>
        <div class="ud-meta">LVL ${u.level || 1} • ${u.subscription || 'None'} ${typeof referralsCount === 'number' ? ' • Referrals: ' + referralsCount : ''}</div>
        <div class="ud-stats" style="margin-top:10px;display:flex;gap:12px;color:#333;font-weight:700">
          <div>🍌 ${u.bananas || 0}</div>
          <div>Eggs: ${u.eggs || 0}</div>
          <div>₱${formatMoney(u.balance)}</div>
        </div>
      </div>
      <div class="ud-actions">
        ${u.kyc_status === 'pending' ? `<button class="btn btn-success" onclick="approveKYC('${u.id}')">Approve</button><button class="btn btn-secondary" style="margin-left:8px" onclick="rejectKYC('${u.id}')">Reject</button>` : `<div class="status-note">${(u.kyc_status || '').toUpperCase()}</div>`}
        ${u.kyc_document_url ? `<div style="margin-top:10px"><button class="btn btn-info btn-sm" style="width:100%" onclick="previewKycDocument('${u.kyc_document_url}', '${u.email.replace(/'/g, "\\'")}')">View ID</button></div>` : ''}
      </div>
    </div>
    <div style="margin-top:12px;font-size:12px;color:var(--gray)"><strong>Joined:</strong> ${u.created_at ? new Date(u.created_at).toLocaleString() : 'N/A'}</div>
  `
  const footer = `
    <button type="button" class="btn btn-danger" onclick="deleteUserConfirmed('${u.id}')" style="margin-right:auto">Delete User</button>
    <button type="button" class="btn btn-secondary" onclick="closeAdminModal()">Close</button> 
    <button type="button" class="btn btn-primary" onclick="openEditUserModal('${u.id}')">Edit</button>
  `
  openAdminModal({ title: 'User Details', body, footer, large: true })
}

async function deleteUserConfirmed(userId) {
  if (!confirm('Are you SURE you want to delete this user? This will also remove their KYC and cashout records. This cannot be undone.')) return

  try {
    const resp = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
    if (resp.ok) {
      showToast('User deleted successfully', 'success')
      closeAdminModal()
      loadUsers()
      updateSidebarCounts()
    } else {
      const body = await resp.json()
      showToast(body.error || 'Failed to delete user', 'error')
    }
  } catch (e) {
    console.error('Delete User error:', e)
    showToast('System error during deletion', 'error')
  }
}

function openEditUserModal(userId) {
  const users = loadUsersData()
  const u = users.find(x => x.id === userId)
  if (!u) return openAdminModal({ title: 'User not found', body: '<p>User not found.</p>', footer: '<button class="btn-primary" onclick="closeAdminModal()">Close</button>' })


  const body = `
    <form id="edit-user-form" onsubmit="event.preventDefault(); saveEditUser('${u.id}');">
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <div style="flex:1;min-width:220px">
          <label>Email</label>
          <input id="edit-email" aria-label="Email" value="${u.email}" />
        </div>
        <div style="width:140px">
          <label>Bananas</label>
          <input id="edit-bananas" type="number" aria-label="Bananas" value="${u.bananas || 0}" />
        </div>
        <div style="width:140px">
          <label>Eggs</label>
          <input id="edit-eggs" type="number" aria-label="Eggs" value="${u.eggs || 0}" />
        </div>
        <div style="width:160px">
          <label>Balance</label>
          <input id="edit-balance" type="number" step="0.01" aria-label="Balance" value="${u.balance || 0}" />
        </div>
      </div>
      <label>Subscription</label>
      <input id="edit-subscription" value="${u.subscription || 'None'}" />
      <label>Referral code</label>
      <input id="edit-referral" value="${u.referral_code || ''}" />
      <div id="edit-user-error" style="color:#C62828;font-weight:600;margin-top:6px;display:none" role="alert"></div>
    </form>
  `
  const footer = `<button class="btn-secondary" onclick="closeAdminModal()">Cancel</button> <button class="btn-primary" onclick="saveEditUser('${u.id}')">Save</button>`
  openAdminModal({ title: 'Edit User', body, footer, large: true })
  setTimeout(() => {
    const el = document.getElementById('edit-email')
    if (el) el.focus()
  }, 50)
}

function saveEditUser(userId) {
  const users = loadUsersData()
  const u = users.find(x => x.id === userId)
  if (!u) return openAdminModal({ title: 'User not found', body: '<p>User not found.</p>', footer: '<button class="btn-primary" onclick="closeAdminModal()">Close</button>' })
  const email = (document.getElementById('edit-email').value || '').trim()
  const bananas = parseInt(document.getElementById('edit-bananas').value, 10) || 0
  const eggs = parseInt(document.getElementById('edit-eggs').value, 10) || 0
  const balance = parseFloat(document.getElementById('edit-balance').value) || 0
  const subscription = (document.getElementById('edit-subscription').value || '').trim() || 'None'
  let referral_code = (document.getElementById('edit-referral').value || '').trim() || null
  if (referral_code) referral_code = referral_code.toUpperCase()

  const errorEl = document.getElementById('edit-user-error')
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
  if (!email) { if (errorEl) { errorEl.textContent = 'Email is required.'; errorEl.style.display = 'block' } return }
  if (!emailRegex.test(email)) { if (errorEl) { errorEl.textContent = 'Invalid email address.'; errorEl.style.display = 'block' } return }
  if (balance < 0) { if (errorEl) { errorEl.textContent = 'Balance cannot be negative.'; errorEl.style.display = 'block' } return }

  // clear errors
  if (errorEl) { errorEl.textContent = ''; errorEl.style.display = 'none' }

  u.email = email
  u.bananas = bananas
  u.eggs = eggs
  u.balance = balance
  u.subscription = subscription
  u.referral_code = referral_code
  saveUsersData(users)
  updateSidebarCounts()
  closeAdminModal()
  showToast('User updated successfully', 'success')
  loadUsers()
}

// --- NEW: current user helpers ---
function getCurrentLocalUser() {
  try { return JSON.parse(localStorage.getItem('local_current_user') || 'null') } catch (e) { return null }
}
function setCurrentLocalUserById(id) {
  const users = loadUsersData()
  const u = users.find(x => x.id === id)
  if (!u) return false
  localStorage.setItem('local_current_user', JSON.stringify({ id: u.id, email: u.email }))
  // notify auth change for UI if needed
  window.dispatchEvent(new CustomEvent('localAuthChange', { detail: { id: u.id } }))
  return true
}

// --- NEW: export CSV of users (applies current search filter) ---
function exportUsersCSV() {
  const all = loadUsersData()
  const searchValue = document.getElementById('admin-user-search') ? document.getElementById('admin-user-search').value.trim().toLowerCase() : ''
  const filtered = all.filter(u => {
    if (!searchValue) return true
    return (u.email || '').toLowerCase().includes(searchValue) ||
      ((u.referral_code || '').toLowerCase().includes(searchValue))
  })
  if (!filtered.length) return alert('No users to export.')
  const headers = ['id', 'email', 'bananas', 'eggs', 'balance', 'kyc_status', 'subscription', 'referral_code', 'is_admin', 'role', 'created_at']
  const rows = filtered.map(u => headers.map(h => `"${String(u[h] ?? '')}".replace(/"/g,'""')`).join(','))
  const csv = [headers.join(','), ...filtered.map(u => headers.map(h => `"${String(u[h] ?? '')}".replace(/"/g,'""')`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// --- NEW: edit user (simple prompts) ---
function editUser(userId) {
  // Open the edit user modal (modern UI) — saves will use `saveEditUser()`
  openEditUserModal(userId)
}

// --- NEW: impersonate / stop impersonation ---
function impersonateUser(userId) {
  if (!confirm('Impersonate this user? You will act as them in the UI.')) return
  if (setCurrentLocalUserById(userId)) {
    alert('Now impersonating user.')
    loadUsers()
  } else alert('User not found')
}
function stopImpersonation() {
  localStorage.removeItem('local_current_user')
  alert('Stopped impersonation.')
  loadUsers()
}



// expose functions used by inline onclicks
// Backwards-compatible wrappers for cashout handlers (old inline code may call these names)
function approveCashout(cashoutId) { return openProcessCashoutModal(cashoutId) }
// rejectCashout is already defined earlier

// Listen for server-side KYC submissions and refresh counts/UI automatically
window.addEventListener('serverKycSubmitted', (e) => {
  try { showToast('New KYC submitted', 'info') } catch (e) { /* ignore */ }
  updateSidebarCounts()
  // If admin currently viewing KYC section, refresh list
  try {
    const active = document.querySelector('.admin-sidebar-nav a.active')
    if (active && active.getAttribute('data-section') === 'kyc') {
      loadKYCPending()
    }
  } catch (e) { /* ignore */ }
})

// functions are now consolidated and assigned to window below


window.grantAdmin = grantAdmin
window.revokeAdmin = revokeAdmin
window.approveKYC = approveKYC
window.rejectKYC = rejectKYC
window.approveCashout = approveCashout
window.rejectCashout = rejectCashout
window.createUser = createUser
window.createUserConfirmed = createUserConfirmed
window.openProcessCashoutModal = openProcessCashoutModal
window.approveCashoutConfirmed = approveCashoutConfirmed
window.openCashoutRejectModal = openCashoutRejectModal
window.rejectCashoutConfirmed = rejectCashoutConfirmed
window.showUserDetails = showUserDetails
window.editUser = editUser
window.openEditUserModal = openEditUserModal
window.saveEditUser = saveEditUser
window.openAdminModal = openAdminModal
window.closeAdminModal = closeAdminModal
window.impersonateUser = impersonateUser
window.stopImpersonation = stopImpersonation
window.exportUsersCSV = exportUsersCSV
window.handleAdminLogout = handleAdminLogout
window.approveKYCConfirmed = approveKYC
window.openRejectReasonModal = rejectKYC
window.rejectKYCConfirmed = rejectKYC
window.approveSubscription = approveSubscription
window.rejectSubscription = rejectSubscription
window.deleteUserConfirmed = deleteUserConfirmed

// Referral helper (copy to clipboard)
// Referral helper (copy to clipboard)
function adminCopyReferralLink(userId) {
  const users = loadUsersData()
  const u = users.find(x => x.id === userId)
  if (!u) return showToast('User not found', 'error')
  if (!u.referral_code) return showToast('No referral code to copy', 'error')
  const url = (location.origin || window.location.origin) + (location.pathname || '/') + '?ref=' + u.referral_code

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => showToast('Referral link copied', 'success')).catch(() => fallbackCopy(url))
  } else {
    fallbackCopy(url)
  }

  function fallbackCopy(str) {
    try {
      const ta = document.createElement('textarea')
      ta.value = str
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
      showToast('Referral link copied', 'success')
    } catch (e) {
      showToast('Unable to copy referral link', 'error')
    }
  }
}

window.adminCopyReferralLink = adminCopyReferralLink

// Replace signOut with a local logout fallback
function handleAdminLogout() {
  // Clear admin session flags
  localStorage.removeItem('local_is_admin')
  localStorage.removeItem('local_current_user')

  // Dispatch event for any listeners
  window.dispatchEvent(new CustomEvent('localAuthChange', { detail: null }))

  // Redirect to home
  window.location.href = '/index.html'
}

// --- TOAST HELPERS ---
function showToast(message, type = 'info', timeout = 3000) {
  if (!document.getElementById('admin-toast-container')) return alert(message)
  const container = document.getElementById('admin-toast-container')
  const t = document.createElement('div')
  t.className = 'admin-toast admin-toast-' + type
  t.textContent = message
  container.appendChild(t)
  setTimeout(() => { t.classList.add('show') }, 10)
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 200) }, timeout)
}

window.showToast = showToast
