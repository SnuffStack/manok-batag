# Chicken Banana - Local API (SQLite + Express)

This is a minimal local API used for development when Supabase is unavailable.

Run locally:

- Install dependencies: `cd server && npm install`
- Start dev server: `npm run dev` (uses nodemon)
- Server listens on port 4000 by default (`PORT` env var overrides)

Endpoints:
- GET /api/ping - health
- GET /api/users - list users
- GET /api/users/:id - get a single user
- PATCH /api/users/:id - partial update of a user (body: { bananas?: number, kyc_status?: string, ... })
- POST /api/signup - create a new user (body: { email, password, referral })
- POST /api/kyc - upload KYC (multipart/form-data: file + userId)
- GET /api/kyc - list all KYC records
- GET /api/kyc/pending - list pending KYC submissions (admin)
- PATCH /api/kyc/:id - approve/reject KYC (body: { action: 'approve' | 'reject', reason? })
- GET /api/cashouts - list cashout requests (admin)
- GET /api/cashouts/pending - list pending cashouts (admin)
- PATCH /api/cashouts/:id - update cashout status (body: { status: 'approved'|'rejected', reason? })

Notes:
- SQLite database is at `server/data.db` (created automatically)
- A seeded admin user will be created on first run (email: `parrokitty@gmail.com`).
