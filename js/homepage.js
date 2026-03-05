import { showAuthPage } from './auth.js'

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
    <div class="modal-card premium-modal" style="max-width: 580px; padding: 0; border: none; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid rgba(255, 255, 255, 0.3);">
      <div class="modal-premium-header" style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); padding: 32px; border-radius: 32px 32px 0 0; position: relative; overflow: hidden;">
        <div style="position: absolute; top: -10px; right: -10px; font-size: 8rem; opacity: 0.1; transform: rotate(15deg);">🐔</div>
        <h2 style="margin: 0; color: white; font-size: 2rem; font-weight: 800; letter-spacing: -0.5px; position: relative; z-index: 1;">Farm Mastery</h2>
        <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-weight: 500; position: relative; z-index: 1;">Unlock the secrets of the flock</p>
        <button class="modal-close" onclick="closeHowModal()" style="color: white; opacity: 0.8; top: 24px; right: 24px; transition: all 0.2s;">&times;</button>
      </div>

      <div class="modal-body" style="padding: 32px; text-align: left;">
        
        <div class="info-section-premium" style="margin-bottom: 32px;">
          <h3 style="color: #2c3e50; font-size: 1.1rem; font-weight: 800; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 8px;">
            <span style="background: #FFF3E0; padding: 6px; border-radius: 10px;">🚀</span> The Mission
          </h3>
          <p style="line-height: 1.7; color: #546e7a; font-size: 1.05rem; margin: 0;">
            Feed your flock, collect bananas, and harvest golden rewards. This is the ultimate <span style="color: #2E7D32; font-weight: 700;">farm-to-earn</span> adventure designed for fun and value.
          </p>
        </div>

        <div class="earning-flow-container" style="background: #F1F8E9; border-radius: 24px; padding: 24px; margin-bottom: 32px; border: 1px solid #DCEDC8;">
           <div style="display: flex; align-items: center; justify-content: space-between; position: relative;">
              <div class="flow-step-premium" style="text-align: center; flex: 1;">
                 <div style="font-size: 2.5rem; margin-bottom: 8px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));">🍌</div>
                 <div style="font-weight: 800; font-size: 0.75rem; color: #558B2F; text-transform: uppercase;">2 Bananas</div>
              </div>
              <div style="font-size: 1.2rem; color: #AED581;">➔</div>
              <div class="flow-step-premium" style="text-align: center; flex: 1;">
                 <div style="font-size: 2.5rem; margin-bottom: 8px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));">🥚</div>
                 <div style="font-weight: 800; font-size: 0.75rem; color: #558B2F; text-transform: uppercase;">1 Egg</div>
              </div>
              <div style="font-size: 1.2rem; color: #AED581;">➔</div>
              <div class="flow-step-premium" style="text-align: center; flex: 1;">
                 <div style="font-size: 2.5rem; margin-bottom: 8px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));">₱</div>
                 <div style="font-weight: 800; font-size: 0.75rem; color: #558B2F; text-transform: uppercase;">1 Peso</div>
              </div>
           </div>
           <p style="text-align: center; margin-top: 16px; font-size: 0.9rem; color: #33691E; font-weight: 600; opacity: 0.8;">
             Consistent feeding leads to consistent harvesting!
           </p>
        </div>

        <div class="perks-grid-premium" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="perk-card-premium" style="background: #E3F2FD; padding: 20px; border-radius: 20px; border: 1px solid #BBDEFB; transition: transform 0.2s;">
            <div style="font-size: 1.5rem; margin-bottom: 12px;">🎉</div>
            <h4 style="margin: 0 0 4px; font-weight: 800; color: #0D47A1;">Sign Up</h4>
            <p style="margin: 0; font-size: 0.85rem; color: #1565C0;">Get <strong>1 Banana</strong> instantly upon joining.</p>
          </div>
          <div class="perk-card-premium" style="background: #F3E5F5; padding: 20px; border-radius: 20px; border: 1px solid #E1BEEF; transition: transform 0.2s;">
            <div style="font-size: 1.5rem; margin-bottom: 12px;">🛡️</div>
            <h4 style="margin: 0 0 4px; font-weight: 800; color: #4A148C;">Verify</h4>
            <p style="margin: 0; font-size: 0.85rem; color: #6A1B9A;">Get <strong>1 Banana</strong> after KYC approval.</p>
          </div>
          <div class="perk-card-premium" style="background: #FFFDE7; padding: 20px; border-radius: 20px; border: 1px solid #FFF9C4; grid-column: span 2; display: flex; align-items: center; gap: 16px;">
            <div style="font-size: 2rem;">🤝</div>
            <div>
              <h4 style="margin: 0 0 4px; font-weight: 800; color: #F57F17;">Referral Power</h4>
              <p style="margin: 0; font-size: 0.85rem; color: #F9A825;">Earn <strong>1 Banana</strong> per successful referral and massive bonuses upon upgrades!</p>
            </div>
          </div>
        </div>

      </div>

      <div class="modal-footer" style="padding: 0 32px 32px;">
        <button class="btn btn-premium-action" onclick="closeHowModal()" style="width: 100%; background: #2c3e50; color: white; border: none; padding: 18px; border-radius: 18px; font-weight: 800; font-size: 1.1rem; cursor: pointer; transition: all 0.3s; box-shadow: 0 10px 20px -5px rgba(44, 62, 80, 0.3);">
          LET'S GO!
        </button>
      </div>
    </div>

    <style>
      .premium-modal {
        animation: premiumEntrance 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @keyframes premiumEntrance {
        from { transform: translateY(40px) scale(0.95); opacity: 0; }
        to { transform: translateY(0) scale(1); opacity: 1; }
      }
      .perk-card-premium:hover {
        transform: translateY(-5px);
      }
      .btn-premium-action:hover {
        background: #1c2833;
        transform: translateY(-2px);
        box-shadow: 0 15px 25px -5px rgba(44, 62, 80, 0.4);
      }
      .modal-close:hover {
        transform: rotate(90deg);
        opacity: 1;
      }
    </style>
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


