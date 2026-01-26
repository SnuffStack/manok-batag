# 🐔🍌 Chicken Banana - Gamified Earning Website

A fun farm-style gamified earning platform where users earn bananas, feed chickens, and convert eggs to pesos!

## Features

- 🎮 **Gamified Earning**: Feed bananas to chickens and earn eggs
- 💰 **Balance System**: Each egg = ₱1 balance
- 📧 **Email Verification**: Secure signup with email verification
- 📋 **KYC System**: ID verification (limited to 2 approvals per day)
- 🔗 **Referral System**: Earn 1 banana for each successful referral signup
- 💎 **Subscription Plans**: 
  - Basic (₱50): No minimum cashout
  - Premium (₱100): 20 free bananas daily, no minimum cashout
  - VIP (₱200): 50 free bananas daily, no minimum cashout
- 💸 **Cashout System**: Escalating minimums (₱5, ₱15, ₱50, ₱100, ₱200)
- ✨ **Smooth Animations**: Feeding, egg-laying, and balance update animations

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Copy your Firebase config to `js/firebase.js`

3. **Update Firebase Config**
   Edit `js/firebase.js` and replace the placeholder values with your Firebase config:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   }
   ```

4. **Set up Firestore Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /cashouts/{cashoutId} {
         allow read: if request.auth != null && request.auth.uid == resource.data.userId;
         allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
       }
     }
   }
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

6. **Build for Production**
   ```bash
   npm run build
   ```

## User Flow

1. **Sign Up**: User creates account with email/password
2. **Email Verification**: User verifies email address
3. **KYC Submission**: User uploads valid ID (limited to 2 approvals/day)
4. **Dashboard**: User sees bananas, eggs, balance, and farm
5. **Feed Chicken**: Use 2 bananas to feed chicken → get 1 egg (₱1)
6. **Subscribe**: Optional subscription for daily bananas and no minimum cashout
7. **Cashout**: Request cashout based on subscription tier and cashout count

## Game Mechanics

- **Feeding**: 2 bananas = 1 egg = ₱1 balance
- **Referrals**: Each successful signup gives upline 1 banana
- **Daily Bonuses**: Premium/VIP subscriptions get free bananas daily
- **Cashout Minimums**: 
  - 1st: ₱5 (or ₱0 with subscription)
  - 2nd: ₱15 (or ₱0 with subscription)
  - 3rd: ₱50 (or ₱0 with subscription)
  - 4th: ₱100 (or ₱0 with subscription)
  - 5th+: ₱200 (or ₱0 with subscription)

## Technologies Used

- Vite (Vanilla JavaScript)
- Firebase Authentication
- Firebase Firestore
- HTML5/CSS3
- Modern JavaScript (ES6+)

## Notes

- KYC file upload currently stores metadata only (integrate Firebase Storage for actual file storage)
- Payment integration needed for subscription purchases
- Cashout approval requires admin panel (not included)

