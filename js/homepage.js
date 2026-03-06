import { showAuthPage } from './auth.js'

export function showHomepage() {
  const app = document.getElementById('app')

  app.innerHTML = `
    <div class="homepage">
      <div class="homepage-hero">
        <div id="particles" class="particle-container"></div>

        <div class="hero-content">
          <img src="/assets/images/logo.png" class="hero-logo" alt="Chicken Banana Logo">
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
  showAuthPage('login')
}

window.showHowItWorks = function () {
  const modalId = 'how-it-works-modal';
  if (document.getElementById(modalId)) return;

  const modal = document.createElement('div');
  modal.id = modalId;
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-card premium-modal v2">
      <button class="modal-close-v2" onclick="closeHowModal()">&times;</button>
      
      <div class="modal-premium-header v2">
        <div class="header-pattern"></div>
        <img src="/assets/images/logo.png" class="modal-logo pulse-on-load" alt="Chicken Banana Logo">
      </div>

      <div class="modal-scroll-area">
        <div class="modal-body v2">
          <div class="info-section-premium v2">
            <h3 class="info-title">
              <span class="info-emoji-v2">🚀</span> The Mission
            </h3>
            <p class="info-text v2">
              Feed your flock, collect bananas, and harvest golden rewards. This is the ultimate <span class="highlight-green-v2">farm-to-earn</span> adventure designed for fun and value.
            </p>
          </div>

          <div class="earning-flow-container v2">
             <div class="flow-steps v2">
                <div class="flow-step-premium v2" data-hint="Feed">
                   <div class="step-emoji-v2">🍌</div>
                   <div class="step-label-v2">2 Bananas</div>
                </div>
                <div class="flow-arrow-v2">➔</div>
                <div class="flow-step-premium v2" data-hint="Hatch">
                   <div class="step-emoji-v2">🥚</div>
                   <div class="step-label-v2">1 Egg</div>
                </div>
                <div class="flow-arrow-v2">➔</div>
                <div class="flow-step-premium v2" data-hint="Earn">
                   <div class="step-emoji-v2">₱</div>
                   <div class="step-label-v2">1 Peso</div>
                </div>
             </div>
             <p class="flow-footer-text v2">
               Consistent feeding leads to consistent harvesting!
             </p>
          </div>

          <div class="perks-grid-premium v2">
            <div class="perk-card-premium v2 perk-signup">
              <div class="perk-emoji-v2">🎉</div>
              <h4 class="perk-title-v2">Sign Up</h4>
              <p class="perk-text-v2">Get <strong>1 Banana</strong> instantly upon joining.</p>
            </div>
            <div class="perk-card-premium v2 perk-verify">
              <div class="perk-emoji-v2">🛡️</div>
              <h4 class="perk-title-v2">Verify</h4>
              <p class="perk-text-v2">Get <strong>1 Banana</strong> after KYC approval.</p>
            </div>
            <div class="perk-card-premium v2 perk-referral">
              <div class="perk-emoji-v2">🤝</div>
              <div class="perk-content-v2">
                <h4 class="perk-title-v2">Referral Power</h4>
                <p class="perk-text-v2">Earn <strong>1 Banana</strong> per successful referral and massive bonuses upon upgrades!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer v2">
        <button class="btn btn-premium-action v2" onclick="closeHowModal()">
          LET'S GO!
        </button>
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

  p.style.setProperty('--size', `${size} px`)
  p.style.setProperty('--duration', `${duration} s`)
  p.style.setProperty('--move-x', `${moveX} px`)
  p.style.setProperty('--move-y', `${moveY} px`)

  p.style.left = `${startX}% `
  p.style.top = `${startY}% `

  container.appendChild(p)

  // Respawn after animation
  setTimeout(() => {
    if (p.parentElement) p.remove()
    if (document.getElementById('particles')) {
      createParticle(container, items)
    }
  }, duration * 1000)
}


