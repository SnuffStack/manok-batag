export function showHomepage() {
  const app = document.getElementById('app')

  app.innerHTML = `
    <div class="homepage">
      <div class="homepage-hero">
        <div id="particles" class="particle-container"></div>
        <div class="chicken-hero-wrapper">
          <img src="/chicken.png" class="chicken-hero-img" alt="Chicken">
        </div>
        <div class="hero-content">
          <h1 class="hero-title">CHICKEN BANANA</h1>
          <p class="hero-description">Feed your flock, harvest golden rewards, and unlock real value in the ultimate farm-to-earn adventure. Join the revolution today!</p>
          <div class="hero-buttons">
            <button class="btn btn-cta-start" onclick="goToLogin()">START FARMING <span class="btn-cta-arrow">→</span></button>
            <button class="btn btn-cta-ghost" onclick="showHowItWorks()">HOW IT WORKS</button>
          </div>
        </div>
      </div>
    </div>
  `
  initParticles()

  // If there's a referral code in the URL, automatically open the signup form with the code applied
  try {
    const params = new URLSearchParams(location.search)
    const r = params.get('ref')
    if (r) {
      // Delay briefly so DOM is ready, then go to signup with the referral code
      setTimeout(() => { window.goToSignup(r.toUpperCase()) }, 200)
    }
  } catch (e) { }
}

window.goToSignup = async function (ref) {
  const { showAuthPage } = await import('./auth.js')
  showAuthPage('signup')
  if (ref) {
    setTimeout(() => {
      const el = document.getElementById('referral-code')
      const msg = document.getElementById('signup-message')
      if (el) el.value = ref.toUpperCase()
      if (msg) msg.innerHTML = `<div class="alert alert-info">Referral code <strong>${ref.toUpperCase()}</strong> applied</div>`
    }, 50)
  }
}

window.goToLogin = async function () {
  const { showAuthPage } = await import('./auth.js')
  showAuthPage('login')
}

window.showHowItWorks = function () {
  const modalId = 'how-it-works-modal';
  if (document.getElementById(modalId)) return;

  const modal = document.createElement('div');
  modal.id = modalId;
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h2>How it Works</h2>
        <button class="modal-close" onclick="closeHowModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="how-step">
          <span class="step-num">1</span>
          <p><strong>Start Farming:</strong> Sign up and get your first chicken to begin your journey.</p>
        </div>
        <div class="how-step">
          <span class="step-num">2</span>
          <p><strong>Feed & Earn:</strong> Feed your chickens bananas to help them grow and lay golden eggs.</p>
        </div>
        <div class="how-step">
          <span class="step-num">3</span>
          <p><strong>Collect Rewards:</strong> Harvest your golden eggs and exchange them for real value!</p>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="closeHowModal()">GOT IT!</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

window.closeHowModal = function () {
  const modal = document.getElementById('how-it-works-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }
};

export function initParticles() {
  const container = document.getElementById('particles')
  if (!container) return

  const items = ['🐔', '🍌', '⭐', '🥚', '🌽']
  const count = 20

  for (let i = 0; i < count; i++) {
    createParticle(container, items)
  }
}

function createParticle(container, items) {
  const p = document.createElement('div')
  p.className = 'particle'
  p.innerText = items[Math.floor(Math.random() * items.length)]

  const size = Math.random() * (40 - 20) + 20
  const duration = Math.random() * (15 - 8) + 8
  const startX = Math.random() * 100
  const startY = Math.random() * 100
  const moveX = (Math.random() - 0.5) * 300
  const moveY = (Math.random() - 0.5) * 300

  p.style.setProperty('--size', `${size}px`)
  p.style.setProperty('--duration', `${duration}s`)
  p.style.setProperty('--move-x', `${moveX}px`)
  p.style.setProperty('--move-y', `${moveY}px`)

  p.style.left = `${startX}%`
  p.style.top = `${startY}%`

  container.appendChild(p)

  // Respawn after animation
  setTimeout(() => {
    if (p.parentElement) p.remove()
    if (document.getElementById('particles')) {
      createParticle(container, items)
    }
  }, duration * 1000)
}


