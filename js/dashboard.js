import { getCurrentUser, logout, showKYCPage } from './auth.js'

let userData = null

const planNames = {
  'basic': 'HATCHLING',
  'premium': 'HEN HOUSE',
  'vip': 'GOLDEN FARM',
  'hatchling': 'HATCHLING',
  'henhouse': 'HEN HOUSE',
  'goldenfarm': 'GOLDEN FARM'
}

export function initDashboard() {
  // Dashboard will be loaded when auth is confirmed
}

function getSubBgClass(subscription) {
  if (!subscription) return ''
  const s = subscription.toLowerCase()
  if (s === 'hatchling' || s === 'basic') return 'sub-bg-hatchling'
  if (s === 'henhouse' || s === 'premium') return 'sub-bg-henhouse'
  if (s === 'goldenfarm' || s === 'vip') return 'sub-bg-goldenfarm'
  return ''
}

function getSubBadge(subscription) {
  if (!subscription) return ''
  const s = subscription.toLowerCase()
  if (s === 'hatchling' || s === 'basic')
    return `<div class="farm-tier-badge hatchling-badge">🐣 HATCHLING</div>`
  if (s === 'henhouse' || s === 'premium')
    return `<div class="farm-tier-badge henhouse-badge">🏠 HEN HOUSE</div>`
  if (s === 'goldenfarm' || s === 'vip')
    return `<div class="farm-tier-badge goldenfarm-badge">🏆 GOLDEN FARM</div>`
  return ''
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
          <div class="stat-card bananas" onclick="loadBananaHistory()" style="cursor:pointer;">
            <div class="stat-icon">🍌</div>
            <div class="stat-info">
              <span class="stat-label">Bananas</span>
              <span class="stat-value" id="banana-count">${data.bananas || 0}</span>
            </div>
            <button class="btn-sm" style="margin-left:auto;">History</button>
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
        
        <div class="farm-section card ${getSubBgClass(data.subscription)}">
          <div class="card-header">
            <span class="card-title">🐔 Your Farm</span>
            <span class="card-subtitle">Feed your chicken to earn eggs!</span>
          </div>
          ${data.subscription && data.subscription !== 'None' && data.subscription_purchased_at ? `
          <div class="sub-countdown-wrap">
            <div class="sub-countdown-label">⏳ Expires In</div>
            <div class="sub-countdown-tiles" id="sub-countdown">
              <div class="countdown-tile"><span id="cd-days">--</span><small>Days</small></div>
              <div class="countdown-sep">:</div>
              <div class="countdown-tile"><span id="cd-hours">--</span><small>Hrs</small></div>
              <div class="countdown-sep">:</div>
              <div class="countdown-tile"><span id="cd-mins">--</span><small>Min</small></div>
              <div class="countdown-sep">:</div>
              <div class="countdown-tile"><span id="cd-secs">--</span><small>Sec</small></div>
            </div>
            <div class="sub-expiry-date" id="sub-expiry-date"></div>
          </div>` : ''}
          <div class="farm-display">
            <div class="grassy-field">
              <div class="chicken-shadow"></div>
              <div class="chicken-main" id="chicken">
                <img src="chicken.png" alt="Chicken" />
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
            <div class="subscription-card ${data.subscription === 'basic' || data.subscription === 'hatchling' ? 'active' : ''}">
              <div class="sub-header" onclick="toggleSub(this)">
                <div class="sub-header-top">
                    <div class="subscription-tag">HATCHLING</div>
                    <div class="toggle-icon">▼</div>
                </div>
                <div class="subscription-price">₱199</div>
              </div>
              <div class="sub-details">
                <ul class="subscription-features">
                    <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> 16 daily bananas</li>
                    <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> No minimum cashout</li>
                    <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> 40 bananas referral bonus</li>
                    <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> 60 days validity</li>
                </ul>
                ${data.subscription === 'basic' || data.subscription === 'hatchling' ? '<button class="btn-subscription active" disabled>Current Subscription</button>' : `<button class="btn-subscription" data-plan="hatchling" onclick="purchaseSubscription('hatchling', 199)">Activate Subscription</button>`}
              </div>
            </div>
            
            <div class="subscription-card featured ${data.subscription === 'premium' || data.subscription === 'henhouse' ? 'active' : ''}">
              <div class="sub-header" onclick="toggleSub(this)">
                <div class="sub-header-top">
                    <div class="subscription-tag">HEN HOUSE</div>
                     <div class="toggle-icon">▼</div>
                </div>
                <div class="subscription-price">₱599</div>
              </div>
              <div class="sub-details">
                  <ul class="subscription-features">
                    <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> 50 daily bananas</li>
                    <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> No minimum cashout</li>
                    <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> 180 bananas referral bonus</li>
                    <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> 60 days validity</li>
                  </ul>
                  ${data.subscription === 'premium' || data.subscription === 'henhouse' ? '<button class="btn-subscription active" disabled>Current Subscription</button>' : `<button class="btn-subscription" data-plan="henhouse" onclick="purchaseSubscription('henhouse', 599)">Activate Subscription</button>`}
              </div>
            </div>
            
            <div class="subscription-card vip ${data.subscription === 'vip' || data.subscription === 'goldenfarm' ? 'active' : ''}">
              <div class="sub-header" onclick="toggleSub(this)">
                <div class="sub-header-top">
                    <div class="subscription-tag">GOLDEN FARM</div>
                     <div class="toggle-icon">▼</div>
                </div>
                <div class="subscription-price">₱1,499</div>
              </div>
              <div class="sub-details">
                  <ul class="subscription-features">
                    <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> 140 daily bananas</li>
                    <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> No minimum cashout</li>
                    <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> 600 bananas referral bonus</li>
                    <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> 60 days validity</li>
                  </ul>
                  ${data.subscription === 'vip' || data.subscription === 'goldenfarm' ? '<button class="btn-subscription active" disabled>Current Subscription</button>' : `<button class="btn-subscription" data-plan="goldenfarm" onclick="purchaseSubscription('goldenfarm', 1499)">Activate Subscription</button>`}
              </div>
            </div>
          </div>
        </div>

        <div id="subscription-status-banner"></div>

        <div class="referral-section card">
          <div class="card-header">
            <span class="card-title">📢 Invite Friends</span>
            <span class="card-subtitle">Get 1 🍌 on friend KYC + up to 600 🍌 on their upgrade!</span>
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
            <a href="#" onclick="showPrivacyPolicy(event)">Privacy Policy</a>
            <a href="#" onclick="showTermsOfService(event)">Terms of Service</a>
            <a href="#" onclick="showSupport(event)">Support</a>
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
  startSubscriptionCountdown(data.subscription_purchased_at)
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
        const planDisplay = planNames[myRequest.plan.toLowerCase()] || myRequest.plan.toUpperCase()
        banner.innerHTML = `
          <div class="alert alert-info">
            <strong>Subcription Pending:</strong> Your request for ${planDisplay} plan is currently being verified by an admin.
          </div>
        `
        // Disable "Activate Subscription" buttons but only show Pending on the target one
        document.querySelectorAll('.btn-subscription').forEach(btn => {
          if (!btn.classList.contains('active')) {
            btn.disabled = true
            if (btn.getAttribute('data-plan') === myRequest.plan) {
              btn.textContent = 'Pending...'
            }
          }
        })
      }
    }
  } catch (e) { console.log('Req check fail', e) }
}

window.triggerKYCVerify = function (e) {
  if (e) e.stopPropagation();
  showKYCPage(userData)
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
  playSound('feed') // Play pecking sound
  setTimeout(() => {
    playSound('lay') // Play lay sound
    chicken.classList.remove('eating')
    chicken.classList.add('laying')
    setTimeout(() => chicken.classList.remove('laying'), 1000)
  }, 500)

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

    // Update UI almost immediately
    setTimeout(() => {
      document.getElementById('banana-count').textContent = userData.bananas
      document.getElementById('egg-count').textContent = userData.eggs
      document.getElementById('balance-count').textContent = `₱${userData.balance}`

      const eggValue = document.getElementById('egg-count')
      eggValue.classList.add('pulse-highlight')
      setTimeout(() => eggValue.classList.remove('pulse-highlight'), 500)

      // chicken.classList.remove('laying') // Cleanup
      statusDiv.textContent = 'Chicken laid an egg! Sell eggs to increase balance.'
      updateBananaDisplay()
    }, 200)

    setTimeout(() => {
      statusDiv.textContent = 'Ready to feed! Feed 2 bananas to get 1 egg.'
      feedBtn.disabled = false
    }, 800)

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
  feed: new Audio('/assets/sounds/chicken-sound.mp3'),
  lay: new Audio('/assets/sounds/lay-eggs-sound.mp3')
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
  const displayName = planNames[plan.toLowerCase()] || plan.toUpperCase()

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
      <h2 style="color: var(--primary-green);">Activate ${displayName}</h2>
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
  if (lastDaily && lastDaily.getDate() === now.getDate() && lastDaily.getMonth() === now.getMonth() && lastDaily.getFullYear() === now.getFullYear()) {
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

// (Removing duplicate copyUserReferralLink here, using the more complete one at line 624)

window.handleLogout = async function () {
  await logout()
}

window.loadBananaHistory = async function () {
  const modal = document.createElement('div')
  modal.className = 'modal-overlay active'
  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h2>🍌 Banana History</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body" id="banana-history-content">
        <div class="loading">Loading history...</div>
      </div>
    </div>
  `
  document.body.appendChild(modal)

  const histContent = document.getElementById('banana-history-content')

  try {
    if (!userData || !userData.id) throw new Error('User data not found. Please refresh.')

    const resp = await fetch(`/api/bananas/history/${userData.id}`)
    if (!resp.ok) throw new Error('Failed to load history')

    const data = await resp.json()
    const items = data.items || []

    const positiveItems = items.filter(i => i && i.amount > 0)

    if (positiveItems.length === 0) {
      if (histContent) histContent.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No rewards history yet.</p>'
      return
    }

    if (histContent) {
      histContent.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${positiveItems.map(i => `
            <div style="background:#f1fcf4; padding:12px; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-weight:700; color:#333;">${i.reason || 'Reward'}</div>
                <div style="font-size:11px; color:#999;">${i.created_at ? new Date(i.created_at).toLocaleString() : 'N/A'}</div>
              </div>
              <div style="font-weight:800; color:#2e7d32; font-size:1.1rem;">
                +${i.amount} 🍌
              </div>
            </div>
          `).join('')}
        </div>
      `
    }
  } catch (e) {
    console.error('Banana history error:', e)
    if (histContent) {
      histContent.innerHTML = `<div class="alert alert-error">${e.message || 'Error loading history'}</div>`
    }
  }
}

window.toggleMute = function () {
  isMuted = !isMuted
  localStorage.setItem('chicken_muted', isMuted)
  updateMuteIcon()
}

window.showTermsOfService = function (e) {
  if (e) e.preventDefault()
  const existing = document.getElementById('tos-modal')
  if (existing) existing.remove()

  const modal = document.createElement('div')
  modal.id = 'tos-modal'
  modal.className = 'modal-overlay active'
  modal.style.cssText = 'z-index: 2000;'
  modal.innerHTML = `
    <div class="modal-card" style="max-width: 700px; max-height: 85vh; display: flex; flex-direction: column; padding: 0; overflow: hidden;">
      <div class="modal-header" style="padding: 20px 24px; border-bottom: 1px solid #eee; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <h2 style="margin: 0; font-size: 1.3rem;">📜 Terms of Service</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #888;">Last Updated: February 28, 2026</p>
        </div>
        <button class="modal-close" onclick="document.getElementById('tos-modal').remove()">&times;</button>
      </div>
      <div style="overflow-y: auto; padding: 24px; flex: 1; font-size: 14px; line-height: 1.7; color: #333;">

        <p>Welcome to <strong>Chicken Banana!</strong></p>
        <p>These Terms of Service ("Terms") govern your use of the Chicken Banana mobile application and website (the "Platform"). By creating an account, accessing the Platform, or clicking "I Agree," you enter into a legally binding agreement with Chicken Banana Corp. ("Company," "we," "our," "us").</p>

        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
          <strong>⚠️ IMPORTANT: ARBITRATION NOTICE AND CLASS ACTION WAIVER</strong><br>
          PLEASE READ THESE TERMS CAREFULLY. THEY CONTAIN A MANDATORY ARBITRATION AGREEMENT AND CLASS ACTION WAIVER THAT AFFECTS YOUR RIGHTS. YOU AGREE THAT DISPUTES BETWEEN US WILL BE RESOLVED BY BINDING, INDIVIDUAL ARBITRATION, AND YOU WAIVE YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION.
        </div>

        <p>If you do not agree to these Terms, you must not access or use the Platform.</p>

        <h3 style="color: var(--primary-green); margin-top: 24px; border-bottom: 1px solid #eee; padding-bottom: 6px;">1. Eligibility and Account Registration</h3>

        <h4 style="margin: 12px 0 6px;">1.1 Age Requirement</h4>
        <p>You must be at least <strong>18 years old</strong> to register for or use the Platform. By registering, you represent and warrant that you are 18 years or older.</p>

        <h4 style="margin: 12px 0 6px;">1.2 Account Registration</h4>
        <p>To access features such as earning, withdrawing, or referring friends, you must create an account. You agree to:</p>
        <ul style="margin: 6px 0 6px 20px;">
          <li>Provide accurate, current, and complete information.</li>
          <li>Maintain the security of your password and login credentials.</li>
          <li>Notify us immediately of any unauthorized use of your account.</li>
        </ul>
        <p>You are responsible for all activities that occur under your account.</p>

        <h4 style="margin: 12px 0 6px;">1.3 One Account Per User</h4>
        <p>Users may not maintain more than one account. Duplicate accounts may result in the suspension of all associated accounts and forfeiture of balances.</p>

        <h3 style="color: var(--primary-green); margin-top: 24px; border-bottom: 1px solid #eee; padding-bottom: 6px;">2. The Farm-to-Earn Service</h3>
        <p>Chicken Banana is a gamified platform that allows users to interact with a virtual farm.</p>

        <h4 style="margin: 12px 0 6px;">2.1 Virtual Currency</h4>
        <p>The Platform utilizes two forms of virtual currency: <strong>Bananas</strong> (used for feeding) and <strong>Eggs</strong> (earned by feeding).</p>
        <ul style="margin: 6px 0 6px 20px;">
          <li>Bananas and Eggs have no monetary value outside the Platform.</li>
          <li>They cannot be sold, traded, or transferred to other users.</li>
          <li>They are a limited license to access the gameplay mechanics, not a store of value.</li>
        </ul>

        <h4 style="margin: 12px 0 6px;">2.2 User Balance and Withdrawals</h4>
        <ul style="margin: 6px 0 6px 20px;">
          <li>Your "Balance" (displayed in ₱) represents the real-world value associated with the Eggs you have earned, based on the current in-game exchange rate.</li>
          <li><strong>Withdrawals:</strong> You may request a withdrawal of your Balance to a verified GCash or Maya account, subject to a minimum withdrawal amount (if any) as displayed in the app.</li>
          <li><strong>Processing:</strong> Withdrawals are processed within a reasonable timeframe. The Company reserves the right to delay withdrawals for security reviews or to investigate suspicious activity.</li>
        </ul>

        <h4 style="margin: 12px 0 6px;">2.3 Subscriptions</h4>
        <p>To enhance earnings, users may purchase recurring subscriptions (Hatchling, Hen House, Golden Farm).</p>
        <ul style="margin: 6px 0 6px 20px;">
          <li><strong>Billing:</strong> Subscriptions are billed monthly (₱199, ₱599, ₱1,499) and auto-renew unless canceled at least 24 hours before the end of the current period.</li>
          <li><strong>Cancellation:</strong> You can manage and cancel your subscriptions via your account settings or the app store (if applicable). No refunds are provided for partial billing periods.</li>
        </ul>

        <h3 style="color: var(--primary-green); margin-top: 24px; border-bottom: 1px solid #eee; padding-bottom: 6px;">3. Referral Program</h3>

        <h4 style="margin: 12px 0 6px;">3.1 Referral Links</h4>
        <p>Users who have completed KYC verification may receive a unique referral link to invite friends.</p>

        <h4 style="margin: 12px 0 6px;">3.2 Rewards</h4>
        <p>You will earn <strong>1 Banana</strong> for each friend who signs up using your link and completes the account registration process.</p>

        <h4 style="margin: 12px 0 6px;">3.3 Prohibited Conduct</h4>
        <p>We strictly prohibit spam, the use of bots, fake accounts, or any fraudulent activity to generate referrals. Violation of this rule will result in the forfeiture of referral rewards and possible account termination.</p>

        <h3 style="color: var(--primary-green); margin-top: 24px; border-bottom: 1px solid #eee; padding-bottom: 6px;">4. KYC (Know Your Customer) Verification</h3>
        <p>To unlock the referral feature and comply with financial regulations, users must complete KYC verification.</p>

        <h4 style="margin: 12px 0 6px;">4.1 Information Required</h4>
        <p>You agree to provide accurate government-issued identification and other information requested by us or our third-party verification providers.</p>

        <h4 style="margin: 12px 0 6px;">4.2 Verification Failure</h4>
        <p>If you fail KYC verification, you will not be able to refer friends, and your withdrawal limits may be restricted. Providing false information is a breach of these Terms.</p>

        <h3 style="color: var(--primary-green); margin-top: 24px; border-bottom: 1px solid #eee; padding-bottom: 6px;">5. User Conduct and Prohibited Activities</h3>
        <p>You agree not to engage in any of the following prohibited activities:</p>
        <ul style="margin: 6px 0 6px 20px;">
          <li><strong>Cheating:</strong> Using bots, scripts, or automated software to interact with the game (e.g., auto-feeding chickens).</li>
          <li><strong>Fraud:</strong> Creating multiple accounts to abuse the referral program or sign-up bonuses.</li>
          <li><strong>Manipulation:</strong> Exploiting any bug, glitch, or error in the Platform to earn unauthorized currency or balances. If a glitch is discovered, you must report it immediately. Exploitation may result in balance forfeiture and account suspension.</li>
          <li><strong>Illegal Activity:</strong> Using the Platform for money laundering or any unlawful purpose.</li>
        </ul>

        <h3 style="color: var(--primary-green); margin-top: 24px; border-bottom: 1px solid #eee; padding-bottom: 6px;">6. No Refund Policy</h3>
        <p>All purchases of virtual currency (Bananas) and subscriptions are <strong>final and non-refundable</strong>. Because digital content is consumed upon use, we do not offer refunds for any in-app purchases, except where required by applicable law.</p>

        <h3 style="color: var(--primary-green); margin-top: 24px; border-bottom: 1px solid #eee; padding-bottom: 6px;">7. Intellectual Property Rights</h3>

        <h4 style="margin: 12px 0 6px;">7.1 Our IP</h4>
        <p>The Platform, including all content, graphics, UI design, code, and branding, is the exclusive property of Chicken Banana Corp. and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.</p>

        <p style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center;">
          © 2026 Chicken Banana Corp. All rights reserved.
        </p>
      </div>
      <div style="padding: 16px 24px; border-top: 1px solid #eee; flex-shrink: 0; text-align: right;">
        <button onclick="document.getElementById('tos-modal').remove()" style="padding: 10px 28px; background: var(--primary-green, #4CAF50); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
          Close
        </button>
      </div>
    </div>
  `
  // Close when clicking the backdrop
  modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.remove()
  })
  document.body.appendChild(modal)
}

window.showPrivacyPolicy = function (e) {
  if (e) e.preventDefault()
  const existing = document.getElementById('privacy-modal')
  if (existing) existing.remove()

  const modal = document.createElement('div')
  modal.id = 'privacy-modal'
  modal.className = 'modal-overlay active'
  modal.style.cssText = 'z-index: 2000;'
  modal.innerHTML = `
    <div class="modal-card" style="max-width: 700px; max-height: 85vh; display: flex; flex-direction: column; padding: 0; overflow: hidden;">
      <div class="modal-header" style="padding: 20px 24px; border-bottom: 1px solid #eee; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <h2 style="margin: 0; font-size: 1.3rem;">🔒 Privacy Policy</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #888;">Last Updated: February 28, 2026</p>
        </div>
        <button class="modal-close" onclick="document.getElementById('privacy-modal').remove()">&times;</button>
      </div>
      <div style="overflow-y: auto; padding: 24px; flex: 1; font-size: 14px; line-height: 1.7; color: #333;">

        <p>Chicken Banana Corp. ("Company," "we," "our," "us") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform.</p>

        <h3 style="color: var(--primary-green); margin-top: 24px; border-bottom: 1px solid #eee; padding-bottom: 6px;">1. Information We Collect</h3>

        <h4 style="margin: 12px 0 6px;">1.1 Information You Provide</h4>
        <ul style="margin: 6px 0 6px 20px;">
          <li><strong>Account Information:</strong> Name, mobile number, email address, and password when you register.</li>
          <li><strong>KYC Information:</strong> Government-issued ID, selfie photo, and personal details for identity verification.</li>
          <li><strong>Payment Information:</strong> GCash, Maya, or GoTyme account name and number for processing withdrawals.</li>
          <li><strong>Transaction Data:</strong> Records of your feeding activity, egg sales, cashouts, and subscription purchases.</li>
        </ul>

        <h4 style="margin: 12px 0 6px;">1.2 Information Collected Automatically</h4>
        <ul style="margin: 6px 0 6px 20px;">
          <li>Device information (device type, operating system, browser).</li>
          <li>IP address and approximate location.</li>
          <li>Usage data (pages visited, features used, timestamps).</li>
        </ul>

        <h3 style="color: var(--primary-green); margin-top: 24px; border-bottom: 1px solid #eee; padding-bottom: 6px;">2. How We Use Your Information</h3>
        <ul style="margin: 6px 0 6px 20px;">
          <li>To operate, maintain, and improve the Platform.</li>
          <li>To process wallet withdrawals and subscription payments.</li>
          <li>To verify your identity through KYC and comply with financial regulations.</li>
          <li>To detect, investigate, and prevent fraud, cheating, or abuse.</li>
          <li>To send you important account notifications and updates.</li>
          <li>To respond to your support requests and inquiries.</li>
        </ul>

        <h3 style="color: var(--primary-green); margin-top: 24px; border-bottom: 1px solid #eee; padding-bottom: 6px;">3. Sharing of Information</h3>
        <p>We do <strong>not</strong> sell your personal information. We may share your data only in these circumstances:</p>
        <ul style="margin: 6px 0 6px 20px;">
          <li><strong>Service Providers:</strong> Third-party KYC verification providers and payment processors who assist us in operating the Platform.</li>
          <li><strong>Legal Compliance:</strong> Government or regulatory authorities when required by law or court order.</li>
          <li><strong>Fraud Prevention:</strong> To protect the rights, property, or safety of the Company, our users, or the public.</li>
        </ul>

        <h3 style="color: var(--primary-green); margin-top: 24px; border-bottom: 1px solid #eee; padding-bottom: 6px;">4. Data Retention</h3>
        <p>We retain your personal information for as long as your account is active or as needed to provide services. KYC data and transaction records may be retained for up to <strong>5 years</strong> to comply with legal and regulatory obligations. You may request deletion of your account and associated data by contacting our support team.</p>

        <h3 style="color: var(--primary-green); margin-top: 24px; border-bottom: 1px solid #eee; padding-bottom: 6px;">5. Data Security</h3>
        <p>We implement industry-standard security measures, including encrypted data storage and secure HTTPS connections, to protect your information. However, no method of electronic transmission or storage is 100% secure. We encourage you to use a strong, unique password and to keep your login credentials private.</p>

        <h3 style="color: var(--primary-green); margin-top: 24px; border-bottom: 1px solid #eee; padding-bottom: 6px;">6. Your Rights</h3>
        <p>You have the right to:</p>
        <ul style="margin: 6px 0 6px 20px;">
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
          <li><strong>Correction:</strong> Ask us to correct inaccurate or incomplete data.</li>
          <li><strong>Deletion:</strong> Request the deletion of your account and personal data, subject to legal retention requirements.</li>
          <li><strong>Objection:</strong> Object to certain types of data processing.</li>
        </ul>
        <p>To exercise any of these rights, please contact us at our support channels listed in the Support section.</p>

        <h3 style="color: var(--primary-green); margin-top: 24px; border-bottom: 1px solid #eee; padding-bottom: 6px;">7. Cookies</h3>
        <p>The Platform uses session cookies and local storage to keep you logged in and remember your preferences. These are essential for the Platform to function properly. By using the Platform, you consent to our use of cookies.</p>

        <h3 style="color: var(--primary-green); margin-top: 24px; border-bottom: 1px solid #eee; padding-bottom: 6px;">8. Changes to This Policy</h3>
        <p>We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on the Platform with an updated "Last Updated" date. Continued use of the Platform after changes constitutes your acceptance of the updated policy.</p>

        <p style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center;">
          © 2026 Chicken Banana Corp. All rights reserved.
        </p>
      </div>
      <div style="padding: 16px 24px; border-top: 1px solid #eee; flex-shrink: 0; text-align: right;">
        <button onclick="document.getElementById('privacy-modal').remove()" style="padding: 10px 28px; background: var(--primary-green, #4CAF50); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
          Close
        </button>
      </div>
    </div>
  `
  modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.remove()
  })
  document.body.appendChild(modal)
}

window.showSupport = function (e) {
  if (e) e.preventDefault()
  const existing = document.getElementById('support-modal')
  if (existing) existing.remove()

  const modal = document.createElement('div')
  modal.id = 'support-modal'
  modal.className = 'modal-overlay active'
  modal.style.cssText = 'z-index: 2000;'
  modal.innerHTML = `
    <div class="modal-card" style="max-width: 480px; display: flex; flex-direction: column; padding: 0; overflow: hidden;">
      <div class="modal-header" style="padding: 20px 24px; border-bottom: 1px solid #eee; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <h2 style="margin: 0; font-size: 1.3rem;">💬 Support</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #888;">We're here to help!</p>
        </div>
        <button class="modal-close" onclick="document.getElementById('support-modal').remove()">&times;</button>
      </div>
      <div style="padding: 28px 24px; font-size: 14px; line-height: 1.7; color: #333;">

        <p style="margin: 0 0 24px; color: #555;">Have questions, issues, or concerns? Reach out to us through any of the channels below and our team will get back to you as soon as possible.</p>

        <div style="display: flex; flex-direction: column; gap: 16px;">

          <a href="mailto:support@chickenbananacorp.com" style="display: flex; align-items: center; gap: 16px; background: #f0faf0; border: 1.5px solid #c8e6c9; border-radius: 12px; padding: 16px 20px; text-decoration: none; color: inherit; transition: box-shadow 0.2s;"
             onmouseover="this.style.boxShadow='0 4px 12px rgba(76,175,80,0.15)'" onmouseout="this.style.boxShadow='none'">
            <div style="width: 44px; height: 44px; background: #4CAF50; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">✉️</div>
            <div>
              <div style="font-weight: 700; color: #2e7d32; font-size: 15px;">Email Support</div>
              <div style="font-size: 13px; color: #555;">support@chickenbananacorp.com</div>
              <div style="font-size: 11px; color: #999; margin-top: 2px;">Response within 24–48 hours</div>
            </div>
          </a>

          <a href="https://www.facebook.com/ChickenBananaCorp" target="_blank" rel="noopener noreferrer"
             style="display: flex; align-items: center; gap: 16px; background: #f0f4ff; border: 1.5px solid #c5cae9; border-radius: 12px; padding: 16px 20px; text-decoration: none; color: inherit; transition: box-shadow 0.2s;"
             onmouseover="this.style.boxShadow='0 4px 12px rgba(63,81,181,0.15)'" onmouseout="this.style.boxShadow='none'">
            <div style="width: 44px; height: 44px; background: #1877F2; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">📘</div>
            <div>
              <div style="font-weight: 700; color: #1877F2; font-size: 15px;">Facebook Page</div>
              <div style="font-size: 13px; color: #555;">@ChickenBananaCorp</div>
              <div style="font-size: 11px; color: #999; margin-top: 2px;">Message us on Facebook</div>
            </div>
          </a>

        </div>

        <p style="margin: 24px 0 0; font-size: 12px; color: #aaa; text-align: center;">
          🕐 Support hours: Monday – Saturday, 9:00 AM – 6:00 PM (PHT)
        </p>
      </div>
      <div style="padding: 16px 24px; border-top: 1px solid #eee; flex-shrink: 0; text-align: right;">
        <button onclick="document.getElementById('support-modal').remove()" style="padding: 10px 28px; background: var(--primary-green, #4CAF50); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
          Close
        </button>
      </div>
    </div>
  `
  modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.remove()
  })
  document.body.appendChild(modal)
}

let _countdownInterval = null

function startSubscriptionCountdown(purchasedAt) {
  if (_countdownInterval) {
    clearInterval(_countdownInterval)
    _countdownInterval = null
  }

  if (!purchasedAt) return

  const DURATION_MS = 60 * 24 * 60 * 60 * 1000 // 60 days
  const expiryDate = new Date(new Date(purchasedAt).getTime() + DURATION_MS)

  const expiryEl = document.getElementById('sub-expiry-date')
  if (expiryEl) {
    const opts = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    expiryEl.textContent = `Expires on ${expiryDate.toLocaleDateString('en-PH', opts)}`
  }

  function tick() {
    const diff = expiryDate - new Date()
    const dEl = document.getElementById('cd-days')
    const hEl = document.getElementById('cd-hours')
    const mEl = document.getElementById('cd-mins')
    const sEl = document.getElementById('cd-secs')

    if (!dEl) { clearInterval(_countdownInterval); _countdownInterval = null; return }

    if (diff <= 0) {
      dEl.textContent = hEl.textContent = mEl.textContent = sEl.textContent = '00'
      clearInterval(_countdownInterval); _countdownInterval = null
      const lbl = document.querySelector('.sub-countdown-label')
      if (lbl) lbl.textContent = '⚠️ Subscription Expired!'
      return
    }

    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)

    dEl.textContent = String(days).padStart(2, '0')
    hEl.textContent = String(hours).padStart(2, '0')
    mEl.textContent = String(minutes).padStart(2, '0')
    sEl.textContent = String(seconds).padStart(2, '0')

    const wrap = document.querySelector('.sub-countdown-wrap')
    if (wrap) wrap.classList.toggle('expiring-soon', days < 3)
  }

  tick()
  _countdownInterval = setInterval(tick, 1000)
}
