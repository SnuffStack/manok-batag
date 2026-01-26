// Initialize app
import { checkAuthState } from './js/auth.js'
import { showHomepage } from './js/homepage.js'

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in
  checkAuthState()
  
  // Show homepage if not logged in
  const app = document.getElementById('app')
  if (!app.innerHTML.trim()) {
    showHomepage()
  }
})

