import { getCurrentUser, logout } from './auth.js'

let userData = null

export function initDashboard() {
  // Dashboard will be loaded when auth is confirmed
}

export async function showDashboard(data) {
  // Check if user is admin
  const { isAdmin, showAdminPanel } = await import('./admin.js')
  if (await isAdmin()) {
    showAdminPanel()
    return
  }

  userData = data
  const app = document.getElementById('app')

  app.innerHTML = `
    <div class="dashboard-wrapper">
      <header class="dashboard-header">
        <div class="header-main">
          <div class="user-greeting">
            <span class="emoji-bounce">🐔</span>
            <div class="greeting-text">
              <h1>Welcome, Henpreneur!</h1>
            </div>
          </div>
          <button class="logout-pill" onclick="handleLogout()">
            <span>Logout</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </header>

      <main class="dashboard-content">
        <div class="stats-container">
          <div class="stat-card bananas">
            <div class="stat-icon">🍌</div>
            <div class="stat-info">
              <span class="stat-label">Bananas</span>
              <span class="stat-value" id="banana-count">${data.bananas || 0}</span>
            </div>
          </div>
          <div class="stat-card eggs">
            <div class="stat-icon">🥚</div>
            <div class="stat-info">
              <span class="stat-label">Eggs</span>
              <span class="stat-value" id="egg-count">${data.eggs || 0}</span>
            </div>
          </div>
          <div class="stat-card balance">
            <div class="stat-icon">💰</div>
            <div class="stat-info">
              <span class="stat-label">Balance</span>
              <span class="stat-value" id="balance-count">₱${data.balance || 0}</span>
            </div>
          </div>
        </div>
        
        <div class="farm-section card">
          <div class="card-header">
            <span class="card-title">🐔 Your Farm</span>
            <span class="card-subtitle">Feed your chicken to earn eggs!</span>
          </div>
          <div class="farm-display">
            <div class="grassy-field">
              <div class="chicken-shadow"></div>
              <div class="chicken-main" id="chicken">
                <img src="/chicken.png" alt="Chicken" />
              </div>
            </div>
          </div>
          <div class="farm-controls">
            <button class="btn-feed" id="feed-btn" onclick="feedChicken()">
              <span class="btn-text">Feed 2 Bananas</span>
              <span class="btn-icon">🍌</span>
            </button>
            <p id="chicken-status" class="status-text">Ready to feed! Feed 2 bananas to get 1 egg.</p>
          </div>
        </div>
        
        <div class="subscription-section card">
          <div class="card-header">
            <span class="card-title">💎 Farm Upgrades</span>
            <span class="card-subtitle">Boost your earnings with a subscription</span>
          </div>
          <div class="subscriptions-grid">
            <div class="subscription-card ${data.subscription === 'basic' ? 'active' : ''}">
              <div class="subscription-tag">BASIC</div>
              <div class="subscription-price">₱50</div>
              <ul class="subscription-features">
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> No minimum cashout</li>
              </ul>
              ${data.subscription === 'basic' ? '<button class="btn-subscription active" disabled>Current Subscription</button>' : `<button class="btn-subscription" onclick="purchaseSubscription('basic', 50)">Activate Subscription</button>`}
            </div>
            
            <div class="subscription-card featured ${data.subscription === 'premium' ? 'active' : ''}">
              <div class="subscription-tag">PREMIUM</div>
              <div class="subscription-price">₱100</div>
              <ul class="subscription-features">
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> 20 daily bananas</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> No minimum cashout</li>
              </ul>
              ${data.subscription === 'premium' ? '<button class="btn-subscription active" disabled>Current Subscription</button>' : `<button class="btn-subscription" onclick="purchaseSubscription('premium', 100)">Activate Subscription</button>`}
            </div>
            
            <div class="subscription-card ${data.subscription === 'vip' ? 'active' : ''}">
              <div class="subscription-tag">VIP</div>
              <div class="subscription-price">₱200</div>
              <ul class="subscription-features">
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> 50 daily bananas</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> No minimum cashout</li>
              </ul>
              ${data.subscription === 'vip' ? '<button class="btn-subscription active" disabled>Current Subscription</button>' : `<button class="btn-subscription" onclick="purchaseSubscription('vip', 200)">Activate Subscription</button>`}
            </div>
          </div>
        </div>

        <div id="subscription-status-banner"></div>

        <div class="referral-section card">
          <div class="card-header">
            <span class="card-title">📢 Invite Friends</span>
            <span class="card-subtitle">Earn 1 Banana for every sign-up via your link!</span>
          </div>
          <div class="referral-container">
            <div class="referral-input-group">
              <input type="text" id="referral-link" readonly value="${window.location.origin}/?ref=${data.referral_code}">
              <button class="btn-copy" onclick="copyUserReferralLink()">
                <span id="copy-text">Copy Link</span>
              </button>
            </div>
          </div>
        </div>
        
        <div class="cashout-section card">
          <div class="card-header">
            <span class="card-title">💸 Earnings Cashout</span>
            <span class="card-subtitle">Withdraw your balance to GCash/Maya</span>
          </div>
          <div class="cashout-container">
            <div class="cashout-input-group">
              <div class="input-with-prefix">
                <span>₱</span>
                <input type="number" id="cashout-amount" placeholder="0.00" min="1" step="0.01">
              </div>
              <button class="btn-cashout" onclick="requestCashout()">Request Withdrawal</button>
            </div>
            <div id="cashout-message"></div>
            
            <div class="history-container">
              <h3>Recent Withdrawals</h3>
              <div id="cashout-history-list" class="history-list">
                <div class="skeleton-loader"></div>
              </div>
        </div>
      </main>

      <footer class="dashboard-footer">
        <div class="footer-content">
          <div class="footer-brand">
            <span class="footer-logo">Chicken Banana 🐔🍌</span>
            <p>The funniest way to earn GCash!</p>
          </div>
          <div class="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Support</a>
          </div>
          <div class="footer-bottom">
            <p>&copy; 2026 Chicken Banana. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  `

  updateBananaDisplay()
  loadCashoutHistory()
  checkDailyBananas()
  checkSubscriptionRequests()
}

async function checkSubscriptionRequests() {
  const banner = document.getElementById('subscription-status-banner')
  if (!banner) return

  try {
    const resp = await fetch('/api/subscription-requests')
    if (resp.ok) {
      const { items } = await resp.json()
      const myRequest = items.find(r => r.userId === userData.id && r.status === 'pending')
      if (myRequest) {
        banner.innerHTML = `
          <div class="alert alert-info">
            <strong>Subcription Pending:</strong> Your request for ${myRequest.plan.toUpperCase()} plan is currently being verified by an admin.
          </div>
        `
        // Disable "Activate Subscription" buttons
        document.querySelectorAll('.btn-subscription').forEach(btn => {
          if (!btn.classList.contains('active')) {
            btn.disabled = true
            btn.textContent = 'Pending...'
          }
        })
      }
    }
  } catch (e) { console.log('Req check fail', e) }
}

function updateBananaDisplay() {
  const bananaCount = userData.bananas || 0
  const feedBtn = document.getElementById('feed-btn')

  if (feedBtn) {
    feedBtn.disabled = bananaCount < 2
  }
}

window.feedChicken = async function () {
  if (userData.bananas < 2) {
    alert('You need at least 2 bananas to feed the chicken!')
    return
  }

  const chicken = document.getElementById('chicken')
  const feedBtn = document.getElementById('feed-btn')
  const statusDiv = document.getElementById('chicken-status')

  feedBtn.disabled = true
  statusDiv.textContent = 'Feeding chicken...'

  // Feeding animation
  chicken.classList.add('eating')

  // Wait for animation
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Egg laying animation
  chicken.classList.remove('eating')
  chicken.classList.add('laying')

  const egg = document.createElement('div')
  egg.className = 'egg-animation'
  egg.textContent = '🥚'
  const chickenRect = chicken.getBoundingClientRect()
  egg.style.left = chickenRect.left + chickenRect.width / 2 + 'px'
  egg.style.top = chickenRect.top + chickenRect.height / 2 + 'px'
  document.body.appendChild(egg)

  setTimeout(() => {
    egg.remove()
  }, 1000)

  // Call API
  try {
    const resp = await fetch('/api/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userData.id })
    })

    if (!resp.ok) {
      const err = await resp.json()
      throw new Error(err.error || 'Feeding failed')
    }

    const { user } = await resp.json()
    userData = user // Update local state with server state

    // Balance update animation
    const balanceCard = document.querySelector('#balance-count').closest('.stat-card')
    const balanceRect = balanceCard.getBoundingClientRect()
    const eggRect = chicken.getBoundingClientRect()

    const balanceIcon = document.createElement('div')
    balanceIcon.className = 'balance-update'
    balanceIcon.textContent = '🥚'
    balanceIcon.style.left = eggRect.left + 'px'
    balanceIcon.style.top = eggRect.top + 'px'
    balanceIcon.style.setProperty('--balance-x', `${balanceRect.left - eggRect.left}px`)
    balanceIcon.style.setProperty('--balance-y', `${balanceRect.top - eggRect.top}px`)
    document.body.appendChild(balanceIcon)

    setTimeout(() => {
      balanceIcon.remove()
    }, 1500)

    // Update UI with a small delay for animation sync
    setTimeout(() => {
      document.getElementById('banana-count').textContent = userData.bananas
      document.getElementById('egg-count').textContent = userData.eggs
      document.getElementById('balance-count').textContent = `₱${userData.balance}`

      const balanceValue = document.getElementById('balance-count')
      balanceValue.classList.add('pulse-highlight')
      setTimeout(() => balanceValue.classList.remove('pulse-highlight'), 500)

      chicken.classList.remove('laying')
      statusDiv.textContent = 'Chicken laid an egg! +₱1 added to balance.'
      updateBananaDisplay()
    }, 1000)

    setTimeout(() => {
      statusDiv.textContent = 'Ready to feed! Feed 2 bananas to get 1 egg.'
      feedBtn.disabled = false
    }, 3000)

  } catch (error) {
    console.error('Feed error:', error)
    statusDiv.textContent = 'Error: ' + error.message
    chicken.classList.remove('eating')
    chicken.classList.remove('laying')
    updateBananaDisplay() // Reset bananas if failed
    alert(error.message)
    feedBtn.disabled = false
  }
}

window.selectSubscription = function (plan, event) {
  // Visual feedback
  document.querySelectorAll('.subscription-plan').forEach(p => {
    p.classList.remove('active')
  })
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active')
  }
}

window.purchaseSubscription = async function (plan, price) {
  let settings = { payment_methods: {} }
  try {
    const resp = await fetch('/api/settings')
    if (resp.ok) {
      const body = await resp.json()
      settings = body.settings || settings
    }
  } catch (e) { console.error('Settings fetch failed', e) }

  const pm = settings.payment_methods || {}

  const modal = document.createElement('div')
  modal.id = 'payment-modal'
  modal.className = 'auth-container' // reuse container style
  modal.style.position = 'fixed'
  modal.style.top = '0'
  modal.style.left = '0'
  modal.style.width = '100%'
  modal.style.height = '100%'
  modal.style.background = 'rgba(0,0,0,0.8)'
  modal.style.zIndex = '1000'
  modal.style.display = 'flex'
  modal.style.justifyContent = 'center'
  modal.style.alignItems = 'center'

  modal.innerHTML = `
    <div class="auth-box" style="max-width: 500px; position: relative;">
      <button onclick="this.closest('#payment-modal').remove()" style="position: absolute; right: 20px; top: 20px; border: none; background: none; font-size: 24px; cursor: pointer;">&times;</button>
      <h2 style="color: var(--primary-green);">Activate ${plan.toUpperCase()}</h2>
      <p style="margin-bottom: 20px; text-align: center;">Please send <strong>₱${price}</strong> to any of the accounts below:</p>
      
      <div style="background: var(--light-gray); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
        <div style="margin-bottom: 10px;"><strong>GCash:</strong> ${pm.gcash?.number || 'N/A'} (${pm.gcash?.accountName || 'N/A'})</div>
        <div style="margin-bottom: 10px;"><strong>Maya:</strong> ${pm.maya?.number || 'N/A'} (${pm.maya?.accountName || 'N/A'})</div>
        <div><strong>GoTyme:</strong> ${pm.gotyme?.number || 'N/A'} (${pm.gotyme?.accountName || 'N/A'})</div>
      </div>

      <div class="form-group">
        <label>Payment Method Used</label>
        <select id="payment-method">
          <option value="GCash">GCash</option>
          <option value="Maya">Maya</option>
          <option value="GoTyme">GoTyme</option>
        </select>
      </div>

      <div class="form-group">
        <label>Reference Number</label>
        <input type="text" id="payment-ref" placeholder="Enter reference number" />
      </div>

      <button class="btn btn-primary" onclick="submitSubscriptionRequest('${plan}', ${price})">Submit Request</button>
      <p style="font-size: 12px; color: var(--gray); margin-top: 15px; text-align: center;">Your subscription will be activated once an admin verifies the reference number.</p>
    </div>
  `
  document.body.appendChild(modal)
}

window.submitSubscriptionRequest = async function (plan, price) {
  const method = document.getElementById('payment-method').value
  const refNumber = document.getElementById('payment-ref').value.trim()

  if (!refNumber) {
    alert('Please enter your payment reference number')
    return
  }

  try {
    const resp = await fetch('/api/subscription-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userData.id,
        plan,
        price,
        method,
        refNumber
      })
    })

    if (!resp.ok) {
      const err = await resp.json()
      throw new Error(err.error || 'Failed to submit request')
    }

    alert('Request submitted! Please wait for admin approval.')
    document.getElementById('payment-modal').remove()
    showDashboard(userData) // Refresh UI
  } catch (error) {
    alert('Error: ' + error.message)
  }
}

async function loadCashoutHistory() {
  const historyList = document.getElementById('cashout-history-list')
  const user = getCurrentUser()

  try {
    const resp = await fetch(`/api/cashouts/user/${user.id}`)
    if (!resp.ok) throw new Error('Failed to load history')
    const { items } = await resp.json()

    if (!items || items.length === 0) {
      historyList.innerHTML = '<p style="color: var(--gray);">No cashout history yet.</p>'
      return
    }

    historyList.innerHTML = items.map(data => {
      // Data from server uses `status`, `amount`, `created_at` or `requested_at`
      const dateStr = data.requested_at ? new Date(data.requested_at).toLocaleString() : 'N/A'
      return `
        <div class="history-item">
          <div>
            <div class="amount">₱${data.amount}</div>
            <div style="font-size: 12px; color: var(--gray);">${dateStr}</div>
          </div>
          <div class="status ${data.status}">${data.status}</div>
        </div>
      `
    }).join('')
  } catch (error) {
    historyList.innerHTML = '<p style="color: var(--red);">Error loading history</p>'
  }
}

window.requestCashout = async function () {
  const amountInput = document.getElementById('cashout-amount')
  const amount = parseFloat(amountInput.value)
  const messageDiv = document.getElementById('cashout-message')

  if (!amount || amount <= 0) {
    messageDiv.innerHTML = '<div class="alert alert-error">Please enter a valid amount</div>'
    return
  }

  if (amount > (userData.balance || 0)) {
    messageDiv.innerHTML = '<div class="alert alert-error">Insufficient balance</div>'
    return
  }

  // Open Details Modal
  const modal = document.createElement('div')
  modal.id = 'cashout-details-modal'
  modal.className = 'modal-overlay active'
  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h2>Cashout Details</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <p style="margin-bottom:15px; color:#666;">Provide your account details for withdrawal of <strong>₱${amount}</strong></p>
        <div class="form-group">
          <label>Payment Method</label>
          <select id="co-method">
            <option value="GCash">GCash</option>
            <option value="Maya">Maya</option>
            <option value="GoTyme">GoTyme</option>
          </select>
        </div>
        <div class="form-group">
          <label>Account Name</label>
          <input type="text" id="co-name" placeholder="Full Registered Name" required>
        </div>
        <div class="form-group">
          <label>Account Number</label>
          <input type="text" id="co-number" placeholder="09XX-XXX-XXXX" required>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" id="confirm-co-btn" style="width:100%">CONFIRM WITHDRAWAL</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)

  document.getElementById('confirm-co-btn').onclick = async () => {
    const method = document.getElementById('co-method').value
    const name = document.getElementById('co-name').value.trim()
    const number = document.getElementById('co-number').value.trim()

    if (!name || !number) {
      alert('Please fill in all details')
      return
    }

    try {
      modal.innerHTML = '<div class="modal-card" style="text-align:center; padding:50px;"><h3>Processing...</h3></div>'
      const resp = await fetch('/api/cashouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          amount,
          method,
          details: `${name} (${number})`
        })
      })

      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.error || 'Cashout failed')
      }

      userData.balance = (userData.balance || 0) - amount
      document.getElementById('balance-count').textContent = `₱${userData.balance}`
      amountInput.value = ''
      modal.remove()

      messageDiv.innerHTML = '<div class="alert alert-success">Cashout request submitted!</div>'
      loadCashoutHistory()
    } catch (error) {
      alert(error.message)
      modal.remove()
    }
  }
}

async function checkDailyBananas() {
  if (!userData.subscription || userData.subscription === 'basic') return

  // Check locally first to avoid unnecessary calls (optimization)
  const lastDaily = userData.last_daily_banana ? new Date(userData.last_daily_banana) : null
  const now = new Date()
  if (lastDaily && lastDaily.getDate() === now.getDate() && lastDaily.getFullYear() === now.getFullYear()) {
    return // already claimed today
  }

  try {
    const resp = await fetch('/api/bonuses/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userData.id })
    })

    if (resp.ok) {
      const { user, added } = await resp.json()
      userData = user
      updateBananaDisplay()
      document.getElementById('banana-count').textContent = userData.bananas
      alert(`Daily bonus: ${added} bananas added! 🍌`)
    }
  } catch (e) {
    // silently fail if already claimed or error
    console.log('Daily check:', e.message)
  }
}

window.copyUserReferralLink = function () {
  const linkInput = document.getElementById('referral-link')
  const btnText = document.getElementById('copy-text')

  linkInput.select()
  linkInput.setSelectionRange(0, 99999) // For mobile devices

  try {
    navigator.clipboard.writeText(linkInput.value)
    const originalText = btnText.textContent
    btnText.textContent = 'Copied! ✅'
    setTimeout(() => {
      btnText.textContent = originalText
    }, 2000)
  } catch (err) {
    console.error('Failed to copy link', err)
  }
}

window.handleLogout = async function () {
  await logout()
}

