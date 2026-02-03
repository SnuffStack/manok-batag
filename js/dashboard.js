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
          <div style="display:flex; gap:10px; align-items:center;">
             <button class="logout-pill" onclick="toggleMute()" id="mute-btn" style="padding: 8px 12px;">
                <span id="mute-icon">🔊</span>
             </button>
             <button class="logout-pill" onclick="handleLogout()">
               <span>Logout</span>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
             </button>
          </div>
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
            <button class="btn-sm" onclick="sellEggsUI()" style="margin-left:auto;">Sell</button>
          </div>
          
          <div class="stat-card balance" onclick="openProfileModal()">
             <!-- Profile / Balance Card -->
            <div class="stat-icon">💰</div>
            <div class="stat-info">
              <span class="stat-label">Balance</span>
              <span class="stat-value" id="balance-count">₱${data.balance || 0}</span>
            </div>
            <button class="btn-sm" style="margin-left:auto;">Profile</button>
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
              <div class="sub-header" onclick="toggleSub(this)">
                <div class="sub-header-top">
                    <div class="subscription-tag">BASIC</div>
                    <div class="toggle-icon">▼</div>
                </div>
                <div class="subscription-price">₱50</div>
              </div>
              <div class="sub-details">
                <ul class="subscription-features">
                    <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> 4 daily bananas</li>
                    <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> No minimum cashout</li>
                </ul>
                ${data.subscription === 'basic' ? '<button class="btn-subscription active" disabled>Current Subscription</button>' : `<button class="btn-subscription" onclick="purchaseSubscription('basic', 50)">Activate Subscription</button>`}
              </div>
            </div>
            
            <div class="subscription-card featured ${data.subscription === 'premium' ? 'active' : ''}">
              <div class="sub-header" onclick="toggleSub(this)">
                <div class="sub-header-top">
                    <div class="subscription-tag">PREMIUM</div>
                     <div class="toggle-icon">▼</div>
                </div>
                <div class="subscription-price">₱100</div>
              </div>
              <div class="sub-details">
                  <ul class="subscription-features">
                    <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> 20 daily bananas</li>
                    <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> No minimum cashout</li>
                  </ul>
                  ${data.subscription === 'premium' ? '<button class="btn-subscription active" disabled>Current Subscription</button>' : `<button class="btn-subscription" onclick="purchaseSubscription('premium', 100)">Activate Subscription</button>`}
              </div>
            </div>
            
            <div class="subscription-card ${data.subscription === 'vip' ? 'active' : ''}">
              <div class="sub-header" onclick="toggleSub(this)">
                <div class="sub-header-top">
                    <div class="subscription-tag">VIP</div>
                     <div class="toggle-icon">▼</div>
                </div>
                <div class="subscription-price">₱200</div>
              </div>
              <div class="sub-details">
                  <ul class="subscription-features">
                    <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> 50 daily bananas</li>
                    <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> No minimum cashout</li>
                  </ul>
                  ${data.subscription === 'vip' ? '<button class="btn-subscription active" disabled>Current Subscription</button>' : `<button class="btn-subscription" onclick="purchaseSubscription('vip', 200)">Activate Subscription</button>`}
              </div>
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
              ${data.kyc_status === 'approved'
      ? `<input type="text" id="referral-link" readonly value="${window.location.origin}/?ref=${data.referral_code}">
                   <button class="btn-copy" onclick="copyUserReferralLink()">
                     <span id="copy-text">Copy Link</span>
                   </button>`
      : `<div class="alert alert-warning" style="width:100%; font-size:13px;">⚠️ Complete KYC Verification to unlock referrals! <a onclick="window.triggerKYCVerify(event)" style="cursor:pointer; text-decoration:underline;">Verify Now</a></div>`
    }
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
              <button class="btn-cashout" onclick="requestCashout()">Withdraw</button>
            </div>
            <p style="font-size:12px; color:var(--gray); margin-top:8px;">
              Will be sent to: <strong>${data.payment_method || 'Not Set'} (${data.payment_number || '---'})</strong>
              <a onclick="openProfileModal()" style="color:var(--primary); cursor:pointer;">Edit</a>
            </p>
            <div id="cashout-message"></div>
          </div>
        </div>
        
        <div class="card history-section" style="margin-top: 20px; padding: 16px;">
          <div class="card-header clickable" onclick="toggleHistory(this)" style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; margin-bottom: 0;">
             <span class="card-title" style="font-size: 1.1rem; margin:0;">📜 Withdrawal History</span>
             <span class="toggle-icon" style="transition: transform 0.3s;">▼</span>
          </div>
          <div id="cashout-history-container" style="display:none; margin-top:16px; border-top: 1px solid #eee; padding-top: 16px;">
              <div id="cashout-history-list" class="history-list">
                <div class="skeleton-loader"></div>
              </div>
          </div>
        </div>
      </main>

      <footer class="dashboard-footer">
        <div class="footer-content">
          <div class="footer-brand">
            <span class="footer-logo">Chicken Banana</span>
            <p>The funniest way to earn</p>
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

window.showKYCPage = async function (user) {
  const { showKYCPage } = await import('./auth.js')
  showKYCPage(user)
}

window.triggerKYCVerify = function (e) {
  if (e) e.stopPropagation();
  window.showKYCPage(userData)
}

window.toggleSub = function (el) {
  // Only toggle on mobile checks (screen width < 768 or simplistic check)
  // Actually, user wants "on mobile", so we simply toggle class 'expanded' on the card
  const card = el.closest('.subscription-card')
  card.classList.toggle('expanded')
}

// PROFILE MODAL
window.openProfileModal = function () {
  const u = userData
  const modal = document.createElement('div')
  modal.className = 'modal-overlay active'
  modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
           <h2>User Profile</h2>
           <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
        </div>
        <div class="modal-body">
            <h3>Payment Details</h3>
            <p style="font-size:12px; color:#666; margin-bottom:10px;">Used for receiving withdrawals.</p>
            <form id="profile-form" onsubmit="updateProfile(event)">
                <div class="form-group">
                   <label>Mode of Payment</label>
                   <select id="p-method" required>
                      <option value="">Select Method</option>
                      <option value="GCash" ${u.payment_method === 'GCash' ? 'selected' : ''}>GCash</option>
                      <option value="Maya" ${u.payment_method === 'Maya' ? 'selected' : ''}>Maya</option>
                      <option value="GoTyme" ${u.payment_method === 'GoTyme' ? 'selected' : ''}>GoTyme</option>
                   </select>
                </div>
                <div class="form-group">
                   <label>Account Name</label>
                   <input type="text" id="p-name" value="${u.payment_name || ''}" placeholder="Full Name" required>
                </div>
                <div class="form-group">
                   <label>Account Number</label>
                   <input type="text" id="p-number" value="${u.payment_number || ''}" placeholder="09XX..." required>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%">Save Changes</button>
            </form>
        </div>
      </div>
    `
  document.body.appendChild(modal)
}

window.updateProfile = async function (e) {
  e.preventDefault()
  const method = document.getElementById('p-method').value
  const name = document.getElementById('p-name').value
  const number = document.getElementById('p-number').value
  const btn = e.target.querySelector('button[type="submit"]')

  // Validate
  if (!method || !name || !number) {
    alert('Please fill in all fields')
    return
  }

  try {
    if (btn) btn.disabled = true;
    if (btn) btn.textContent = 'Saving...';

    const resp = await fetch(`/api/users/${userData.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_method: method,
        payment_name: name,
        payment_number: number
      })
    })
    if (resp.ok) {
      const { user } = await resp.json()
      userData = user // update local
      // Update local storage too just in case
      try {
        const stored = JSON.parse(localStorage.getItem('local_current_user') || '{}')
        if (stored.id === user.id) {
          localStorage.setItem('local_current_user', JSON.stringify({ ...stored, ...user })) // This might be overkill but safe
        }
      } catch (e) { }

      alert('Profile updated successfully! ✅')
      document.querySelector('.modal-overlay').remove()
      showDashboard(userData) // refresh UI
    } else {
      const err = await resp.json()
      alert('Failed to update: ' + (err.error || 'Unknown error'))
      if (btn) btn.disabled = false;
      if (btn) btn.textContent = 'Save Changes';
    }
  } catch (err) {
    console.error(err)
    alert('Error: ' + err.message)
    if (btn) btn.disabled = false;
    if (btn) btn.textContent = 'Save Changes';
  }
}

// SELL EGGS UI
window.sellEggsUI = function () {
  const eggs = userData.eggs || 0
  if (eggs < 1) {
    alert('You have no eggs to sell!')
    return
  }

  // Create modal
  const modal = document.createElement('div')
  modal.className = 'modal-overlay active'
  modal.innerHTML = `
    <div class="modal-card" style="max-width: 400px;">
      <div class="modal-header">
        <h2 style="color: var(--primary-green); margin: 0;">🥚 Sell Eggs</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <p style="margin-bottom: 16px; color: var(--gray);">You have <strong>${eggs} eggs</strong>. Each egg sells for <strong>₱1</strong>.</p>
        <div class="form-group">
          <label>How many eggs do you want to sell?</label>
          <input type="number" id="sell-egg-amount" min="1" max="${eggs}" value="${eggs}" 
                 style="width: 100%; padding: 12px; border: 2px solid var(--light-gray); border-radius: 8px; font-size: 1rem;">
        </div>
        <div style="background: var(--light-green); padding: 12px; border-radius: 8px; margin-top: 12px;">
          <p style="margin: 0; font-size: 0.9rem; color: var(--dark-green);">
            💰 You will receive: <strong id="sell-preview">₱${eggs}</strong>
          </p>
        </div>
      </div>
      <div class="modal-footer" style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()" 
                style="padding: 10px 20px; background: var(--light-gray); border: none; border-radius: 8px; cursor: pointer;">
          Cancel
        </button>
        <button class="btn-primary" onclick="confirmSellEggs()" 
                style="padding: 10px 20px; background: var(--primary-green); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
          Sell Eggs
        </button>
      </div>
    </div>
  `
  document.body.appendChild(modal)

  // Update preview on input change
  const input = document.getElementById('sell-egg-amount')
  const preview = document.getElementById('sell-preview')
  input.addEventListener('input', () => {
    const val = parseInt(input.value) || 0
    preview.textContent = `₱${val}`
  })
}

window.confirmSellEggs = async function () {
  const amount = parseInt(document.getElementById('sell-egg-amount').value)
  if (!amount || amount < 1) {
    alert('Please enter a valid amount')
    return
  }

  const btn = document.querySelector('.modal-card .btn-primary')
  if (btn) {
    btn.disabled = true
    btn.textContent = 'Selling...'
  }

  try {
    const resp = await fetch('/api/sell-eggs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userData.id, amount: amount })
    })

    const data = await resp.json()
    if (data.error) throw new Error(data.error)

    userData = data.user
    document.querySelector('.modal-overlay').remove()

    // Show success message with animation
    alert(`✅ Successfully sold ${amount} eggs for ₱${amount}!`)
    showDashboard(userData)
    // Floating feedback for selling eggs
    const balanceCard = document.querySelector('.stat-card.balance')
    if (balanceCard) showFloatingNumber(balanceCard, `+₱${amount}`, 'positive')
    const eggCard = document.querySelector('.stat-card.eggs')
    if (eggCard) showFloatingNumber(eggCard, `-${amount} 🥚`, 'negative')

  } catch (error) {
    alert('Error: ' + error.message)
    if (btn) {
      btn.disabled = false
      btn.textContent = 'Sell Eggs'
    }
  }
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

  chicken.classList.add('eating')
  playSound('feed') // Play eating/chicken sound

  // Wait for animation
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Egg laying animation
  chicken.classList.remove('eating')
  chicken.classList.add('laying')
  playSound('lay') // Play lay sound

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

    // Egg update animation - fly to EGG card, not balance
    const eggCard = document.querySelector('#egg-count').closest('.stat-card')
    const eggCardRect = eggCard.getBoundingClientRect()
    const chickenRect = chicken.getBoundingClientRect()

    const eggIcon = document.createElement('div')
    eggIcon.className = 'balance-update'
    eggIcon.textContent = '🥚'
    eggIcon.style.left = chickenRect.left + 'px'
    eggIcon.style.top = chickenRect.top + 'px'
    eggIcon.style.setProperty('--balance-x', `${eggCardRect.left - chickenRect.left}px`)
    eggIcon.style.setProperty('--balance-y', `${eggCardRect.top - chickenRect.top}px`)
    document.body.appendChild(eggIcon)

    setTimeout(() => {
      eggIcon.remove()
    }, 1500)

    // Update UI with a small delay for animation sync
    setTimeout(() => {
      document.getElementById('banana-count').textContent = userData.bananas
      document.getElementById('egg-count').textContent = userData.eggs
      document.getElementById('balance-count').textContent = `₱${userData.balance}`

      const eggValue = document.getElementById('egg-count')
      eggValue.classList.add('pulse-highlight')
      setTimeout(() => eggValue.classList.remove('pulse-highlight'), 500)

      chicken.classList.remove('laying')
      statusDiv.textContent = 'Chicken laid an egg! Sell eggs to increase balance.'
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

// Interactive Helpers
let isMuted = JSON.parse(localStorage.getItem('chicken_muted') || 'false')
const sounds = {
  feed: new Audio('/assets/sounds/chicken sound .mp3'),
  lay: new Audio('/assets/sounds/lay eggs sound.mp3')
}

// Preload
for (const key in sounds) {
  sounds[key].load()
  sounds[key].volume = 0.5
}

function playSound(type) {
  if (isMuted) return
  const sound = sounds[type]
  if (sound) {
    sound.currentTime = 0
    sound.play().catch(e => console.log('Audio play failed', e))
  }
}

window.toggleMute = function () {
  isMuted = !isMuted
  localStorage.setItem('chicken_muted', isMuted)
  updateMuteIcon()
}

function updateMuteIcon() {
  const btn = document.getElementById('mute-icon')
  if (btn) btn.textContent = isMuted ? '🔇' : '🔊'
}

// Ensure icon is correct on load
setTimeout(updateMuteIcon, 100)

function showFloatingNumber(parentEl, text, type = 'positive') {
  const floater = document.createElement('div')
  floater.className = `floating-number ${type}`
  floater.textContent = text

  // Center relative to parent
  const rect = parentEl.getBoundingClientRect()
  floater.style.left = `${rect.left + rect.width / 2}px`
  floater.style.top = `${rect.top}px`

  document.body.appendChild(floater)

  setTimeout(() => floater.remove(), 1000)
}

window.copyUserReferralLink = function () {
  const link = document.getElementById('referral-link')
  if (!link) return

  link.select()
  document.execCommand('copy')

  const btn = document.querySelector('.btn-copy')
  const originalHtml = btn.innerHTML
  btn.innerHTML = '<span>Copied! ✅</span>'
  btn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)'

  // Show floating feedback too
  showFloatingNumber(btn, 'Copied!', 'positive')

  setTimeout(() => {
    btn.innerHTML = originalHtml
    btn.style.background = ''
  }, 2000)
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

      <div class="form-group">
        <label>Upload Receipt</label>
        <div class="file-upload" onclick="document.getElementById('receipt-upload').click()" style="padding: 10px;">
           <span id="receipt-label">Click to upload receipt image</span>
           <input type="file" id="receipt-upload" accept="image/*" onchange="document.getElementById('receipt-label').textContent = this.files[0].name">
        </div>
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
  const fileInput = document.getElementById('receipt-upload')

  if (!refNumber) {
    alert('Please enter your payment reference number')
    return
  }

  const btn = document.querySelector('.btn-primary') // crude selector but works in modal context

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Submitting...';
    }

    const formData = new FormData()
    formData.append('userId', userData.id)
    formData.append('plan', plan)
    formData.append('price', price)
    formData.append('method', method)
    formData.append('refNumber', refNumber)

    if (fileInput.files.length > 0) {
      formData.append('receipt', fileInput.files[0])
    }

    const resp = await fetch('/api/subscription-requests', {
      method: 'POST',
      body: formData // No Content-Type header needed for FormData
    })

    if (!resp.ok) {
      const err = await resp.json()
      throw new Error(err.error || 'Failed to submit request')
    }

    alert('Request submitted with receipt! Please wait for admin approval.')
    document.getElementById('payment-modal').remove()
    showDashboard(userData) // Refresh UI
  } catch (error) {
    console.error(error)
    alert('Error: ' + error.message)
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Submit Request';
    }
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

window.toggleHistory = function (el) {
  const container = document.getElementById('cashout-history-container');
  const icon = el.querySelector('.toggle-icon');

  const isExpanded = container.classList.contains('expanded');

  if (isExpanded) {
    // Collapse
    container.classList.remove('expanded');
    if (icon) icon.style.transform = 'rotate(0deg)';
    setTimeout(() => {
      container.style.display = 'none';
    }, 400); // Match CSS transition duration
  } else {
    // Expand
    container.style.display = 'block';
    // Force reflow for animation
    container.offsetHeight;
    container.classList.add('expanded');
    if (icon) icon.style.transform = 'rotate(180deg)';
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

  // Check if payment details exist
  if (!userData.payment_method || !userData.payment_number) {
    alert('Please set your Payment Details in your Profile first!')
    openProfileModal()
    return
  }

  // Open Confirmation Modal - Simplified
  const modal = document.createElement('div')
  modal.id = 'cashout-confirm-modal'
  modal.className = 'modal-overlay active'
  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h2>Confirm Cashout</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <p>You are about to withdraw <strong>₱${amount}</strong>.</p>
        <p style="margin-top:10px;">Funds will be sent to:</p>
        <div style="background:#f5f5f5; padding:10px; border-radius:8px; margin:10px 0;">
            <strong>${userData.payment_method}</strong><br>
            ${userData.payment_name}<br>
            ${userData.payment_number}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" id="confirm-co-btn" style="width:100%">CONFIRM</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)

  document.getElementById('confirm-co-btn').onclick = async () => {
    try {
      modal.innerHTML = '<div class="modal-card" style="text-align:center; padding:50px;"><h3>Processing...</h3></div>'
      const resp = await fetch('/api/cashouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          amount,
          method: userData.payment_method,
          details: `${userData.payment_name} (${userData.payment_number})`
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
  if (!userData.subscription || userData.subscription === 'None') return

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

