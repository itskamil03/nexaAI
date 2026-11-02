# NexaChain AI — Investment & Referral Platform (MERN Stack)

[![Node.js Version](https://img.shields.io/badge/Node.js-v24.18.0-green.svg)](https://nodejs.org/)
[![MongoDB Version](https://img.shields.io/badge/MongoDB-Atlas%20ReplicaSet-emerald.svg)](https://www.mongodb.com/)
[![React Version](https://img.shields.io/badge/React-v18.3.1-blue.svg)](https://react.dev/)
[![Vite Version](https://img.shields.io/badge/Vite-v5.4.21-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4.17-cyan.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-25%2F25%20Passing-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-ISC-gray.svg)]()

> Official institutional-grade implementation of the **MERN Stack Developer Technical Assessment**.
> 
> **Live Backend API Gateway:** [https://nexachain-api.onrender.com](https://nexachain-api.onrender.com)  
> **Live Frontend Web Portal:** [https://nexa-ai-guuc.vercel.app](https://nexa-ai-guuc.vercel.app)  
> **GitHub Repository:** [https://github.com/itskamil03/nexaAI](https://github.com/itskamil03/nexaAI)  

---

## 1. Project Overview

**NexaChain AI** is an institutional investment management and multi-tier affiliate referral platform developed with the MERN stack (MongoDB, Express.js, React 18, Node.js). 

The platform allows users to register with sponsor attribution, deposit capital into an internal balance ledger, deploy capital into tiered algorithmic yield plans, accrue automated daily Return on Investment (ROI) via a distributed `node-cron` daemon, earn multi-tier hierarchical referral commissions across 3 upline levels, and visualize financial growth through an interactive dark-mode analytics dashboard.

---

## 2. Technology Stack

| Layer | Technologies & Libraries |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, Tailwind CSS, React Router v6, Axios, Recharts, Lucide React |
| **Backend** | Node.js (v20+ / v24), Express.js (v4), Morgan, Helmet, CORS, Express-Rate-Limit, Express-Validator |
| **Database** | MongoDB Atlas 3-node ReplicaSet (`asia-south1`), Mongoose v8 (Compound Indexes, Sessions) |
| **Authentication** | JSON Web Tokens (JWT via HMAC-SHA256), bcryptjs (10 salt rounds) |
| **Job Scheduling** | node-cron v3 (Daily 12:00 AM `Asia/Kolkata` trigger with distributed `JobLock` mutex) |
| **Automated Testing**| Jest v29, Supertest (Unit tests, Business logic invariants, Precision checks) |
| **Deployment** | Render (Express & Cron Worker), Vercel (Edge SPA CDN) |

---

## 3. Project Folder Structure

```text
CMA/
├── backend/                             # Express REST API & Cron Daemon
│   ├── src/
│   │   ├── config/                      # Environment, plans, and referral tier settings
│   │   │   ├── env.js                   # Fail-safe production env validator & URI masker
│   │   │   ├── plans.js                 # Investment plan configurations
│   │   │   └── referral.js              # 3-tier commission percentages (5%, 3%, 2%)
│   │   ├── controllers/                 # HTTP request handlers & response formatting
│   │   ├── jobs/                        # node-cron scheduler & distributed locking
│   │   │   └── roiScheduler.js          # Daily 12:00 AM automated batch processor
│   │   ├── middleware/                  # JWT auth, rate limiters, security & error handlers
│   │   ├── models/                      # Mongoose schemas (User, Investment, Referral, ROI, Ledger, Lock)
│   │   ├── routes/                      # Express route definitions
│   │   ├── services/                    # Core business logic (ROI, referrals, investments, dashboard)
│   │   ├── utils/                       # Epsilon precision rounding, date normalization, JWT
│   │   ├── validators/                  # express-validator schemas
│   │   ├── app.js                       # Express app configuration & middleware pipeline
│   │   └── server.js                    # Server bootstrap & DB connection lifecycle
│   ├── tests/                           # Automated unit and integration test suites
│   ├── .env.example                     # Backend environment template
│   └── package.json
├── frontend/                            # React 18 / Vite 5 Single Page Application
│   ├── src/
│   │   ├── api/                         # Axios client & scoped API service methods
│   │   ├── components/                  # UI components (KPI cards, Recharts, tables, tree)
│   │   ├── context/                     # AuthContext & ToastContext providers
│   │   ├── layouts/                     # DashboardLayout with sidebar and top navbar
│   │   ├── pages/                       # Dashboard, Investments, Referrals, ROI, Wallet, Cron Simulator
│   │   ├── utils/                       # Currency and date formatters
│   │   ├── App.jsx                      # Client router & protected routes
│   │   └── main.jsx                     # Vite entry point
│   ├── .env.example                     # Frontend environment template
│   ├── vercel.json                      # Vercel SPA rewrite configuration
│   ├── vite.config.js                   # Chunk code-splitting & build settings
│   └── package.json
├── docs/                                # Technical specifications and architectural analyses
├── NexaChain_AI_MERN_Collection.postman_collection.json  # Postman test collection
├── ASSESSMENT_COMPLIANCE_REPORT.md       # 7-deliverable assessment audit
├── PRODUCTION_READINESS_REPORT.md       # Security, DB, and infrastructure audit
├── SUBMISSION_CHECKLIST.md              # Requirement-by-requirement verification checklist
├── ASSUMPTIONS.md                       # Comprehensive business assumptions and defaults
├── render.yaml                          # Render infrastructure as code blueprint
└── README.md                            # Primary documentation
```

---

## 4. Prerequisites

To run this application locally, ensure you have:
* **Node.js**: v18.0.0 or higher (v24.18.0 recommended)
* **npm**: v9.0.0 or higher
* **MongoDB**: A running local MongoDB instance on port 27017 or a MongoDB Atlas connection URI
* **Git**

---

## 5. Local Setup Steps

Clone the repository and enter the project root:
```bash
git clone https://github.com/itskamil03/nexaAI.git
cd nexaAI
```

---

## 6. Backend Setup

1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Create your `.env` configuration from the provided template:
   ```bash
   cp .env.example .env
   ```
3. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend will start at `http://localhost:5000` with the health endpoint accessible at `http://localhost:5000/api/health`.

---

## 7. Frontend Setup

1. Open a new terminal, navigate to the frontend directory, and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Create your `.env` configuration from the provided template:
   ```bash
   cp .env.example .env
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

## 8. MongoDB Configuration

* **Local Development:** The backend defaults to `mongodb://127.0.0.1:27017/nexachain` when `NODE_ENV=development`.
* **Production / Atlas ReplicaSet:**
  Provide a standard SRV connection string:
  ```text
  mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/nexachain?retryWrites=true&w=majority
  ```
* **Network Access:** In MongoDB Atlas, ensure your server IP or cloud provider outbound IP range is whitelisted under **Network Access**.
* **Indexes:** Mongoose automatically registers all compound unique indexes on application bootstrap.

---

## 9. Environment Variable Reference

### Backend (`backend/.env`)

| Variable Name | Required | Default / Placeholder Value | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `5000` | Port on which Express listens. Injected automatically by Render. |
| `NODE_ENV` | Yes | `development` / `production` | Runtime mode. Enforces strict secret validation in production. |
| `MONGODB_URI` | Yes | `mongodb://127.0.0.1:27017/nexachain` | MongoDB connection URI. Localhost is blocked in production. |
| `JWT_SECRET` | Yes | `REPLACE_WITH_MIN_32_CHAR_SECRET` | HMAC-SHA256 private key for signing user sessions. |
| `JWT_EXPIRES_IN` | No | `24h` | Token expiration duration string. |
| `CRON_SCHEDULE` | No | `0 0 * * *` | Standard 5-part cron syntax (Midnight daily). |
| `CRON_TIMEZONE` | No | `Asia/Kolkata` | IANA timezone for cron execution. |
| `CLIENT_URL` | Yes | `http://localhost:5173` | Allowed frontend origins (comma-separated if multiple). |
| `ADMIN_SECRET_KEY` | Yes | `REPLACE_WITH_MIN_16_CHAR_SECRET` | Secret key for administrative manual ROI batch trigger. |

### Frontend (`frontend/.env`)

| Variable Name | Required | Default / Placeholder Value | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | Yes | `http://localhost:5000/api` | Base URL pointing to the backend API gateway. |

---

## 10. API Documentation & Endpoints

All endpoints are prefixed with `/api`. Authenticated endpoints require an `Authorization: Bearer <token>` header.

### Authentication
* `POST /api/auth/register` — Register a new account with optional sponsor `referralCode`.
* `POST /api/auth/login` — Authenticate using email and password; returns JWT token.
* `GET /api/auth/me` — Retrieve the authenticated user's profile and sponsor hierarchy.

### Investments
* `GET /api/investments/plans` — Fetch active algorithmic yield plans (`starter`, `growth`, `enterprise`).
* `POST /api/investments` — Deploy capital into a plan (debits internal wallet balance atomically).
* `GET /api/investments` — List user investments with pagination and status filters.
* `GET /api/investments/:id` — Inspect a specific investment (protected by IDOR ownership check).

### Dashboard
* `GET /api/dashboard/summary` — Returns authoritative KPI metrics (Total Investments, Daily Expected ROI, Total Level Income, Spendable Balance) and 7-day earnings trajectory.

### Referrals
* `GET /api/referrals/direct` — Fetch direct Level 1 downline members with aggregate volume.
* `GET /api/referrals/tree` — Fetch recursive nested downline sponsor hierarchy (up to depth 3).
* `GET /api/referrals/income` — Paginated history of received affiliate commissions.

### ROI & Wallet
* `GET /api/roi/history` — Daily ROI ledger records.
* `GET /api/wallet/transactions` — Full double-entry transaction audit trail.
* `POST /api/wallet/deposit` — Simulated internal wallet top-up for testing and demonstration.

### Administration & Health
* `POST /api/admin/roi/process` — Manually trigger the daily ROI batch for any date. Requires `x-admin-secret` header or `adminSecret` body property.
* `GET /api/health` — Returns system uptime, database connection status, and transaction capability.

---

## 11. Database Schemas & Model Documentation

1. **`User` (`backend/src/models/User.js`):**
   * Stores user credentials, unique referral code (`NX######`), upline parent reference (`referredBy`), and cached financial totals (`walletBalance`, `totalRoiEarned`, `totalLevelIncomeEarned`).
2. **`Investment` (`backend/src/models/Investment.js`):**
   * Tracks capital deployment, plan metadata, daily yield percentage, and tenure (`startDate`, `endDate`). Status transitions: `Active` $\to$ `Completed` (or `Cancelled`).
3. **`ReferralIncome` (`backend/src/models/ReferralIncome.js`):**
   * Records affiliate commissions. Unique compound index `{ sourceEventId: 1, level: 1, userId: 1 }` prevents duplicate payouts for any investment event.
4. **`RoiHistory` (`backend/src/models/RoiHistory.js`):**
   * Daily yield ledger. Unique compound index `{ investmentId: 1, date: 1 }` guarantees zero duplicate daily credits per investment per calendar date.
5. **`WalletTransaction` (`backend/src/models/WalletTransaction.js`):**
   * Double-entry ledger tracking all credits and debits (`ROI_CREDIT`, `REFERRAL_CREDIT`, `INVESTMENT_DEBIT`, `WALLET_DEPOSIT`) with a unique `idempotencyKey` and running `balanceAfter`.
6. **`JobLock` (`backend/src/models/JobLock.js`):**
   * Distributed locking document preventing parallel cron execution across multiple backend worker processes.

---

## 12. Business Logic & Precision Engineering

### Zero Floating-Point Drift
JavaScript floating-point arithmetic can introduce fractional drift (e.g. `0.1 + 0.2 = 0.30000000000000004`). NexaChain AI implements an epsilon-compensated rounding utility in `backend/src/utils/mathPrecision.js`:
$$\text{roundTo2Decimals}(v) = \frac{\text{Math.round}((v + \text{Number.EPSILON}) \times 100)}{100}$$

### Daily ROI Formula
For each active investment within its `[startDate, endDate]` tenure:
$$\text{Daily Yield} = \text{roundTo2Decimals}\left(\text{Investment Principal} \times \frac{\text{Daily ROI \%}}{100}\right)$$

### 3-Tier Referral Distribution
When a user activates an investment, commissions are distributed to uplink sponsors:
* **Level 1 (Direct Referrer):** 5.0% of investment principal
* **Level 2 (Grandparent):** 3.0% of investment principal
* **Level 3 (Great-Grandparent):** 2.0% of investment principal
* **Cycle Protection:** Traversal maintains an in-memory `visitedUserIds` set to eliminate circular loop exploits.

---

## 13. Cron Job Configuration, Scheduling & Testing

* **Daemon:** Powered by `node-cron` v3 in `backend/src/jobs/roiScheduler.js`.
* **Execution:** Configured to trigger daily at **12:00:00 AM** in **`Asia/Kolkata`** (`CRON_SCHEDULE=0 0 * * *`).
* **Distributed Mutex:** Before processing, the worker attempts to acquire `JobLock` keyed by `daily_roi_YYYY-MM-DD`. If locked, the batch skips cleanly.
* **Testing without Waiting for Midnight:**
  1. Navigate to `/cron-test` on the frontend dashboard.
  2. Select any calendar date (e.g., `2026-11-02`).
  3. Enter your configured `ADMIN_SECRET_KEY`.
  4. Click **"Execute ROI Batch Now"** to execute the batch and view the ledger summary.

---

## 14. Authentication, Security & Authorization

* **Password Hashing:** Passwords are salted and hashed using `bcryptjs` with 10 rounds prior to database persistence.
* **JWT Security:** Stateless tokens signed using HMAC-SHA256 (`HS256`) with a 24-hour expiration window.
* **IDOR Protection:** User-isolated endpoints enforce `userId === req.user.id`.
* **Administrative Guard:** Admin routes require validation against `ADMIN_SECRET_KEY` and are protected by a strict rate limiter (20 requests / 15 minutes).
* **HTTP Protection:** Helmet enforces strict headers, disabling sniffing and iframe embedding.

---

## 15. Automated Test Commands & Verification

### Run Pure Unit Tests (Offline / Sandbox Safe)
```bash
cd backend
$env:SKIP_DB_CONNECT="true"  # On Windows PowerShell
npm test -- tests/unit/businessLogic.test.js tests/unit/deploymentConfig.test.js --forceExit
```
**Result:** **25 passed, 25 total (100% success)**.

### Run Integration & Financial Invariant Tests (Requires local MongoDB)
```bash
cd backend
npm test -- tests/scenarios/financialScenarios.test.js
```

---

## 16. Production Build Instructions

To verify that the frontend bundles cleanly without missing dependencies:
```bash
cd frontend
npm run build
```
Vite compiles the application in ~4.5 seconds into chunked assets in `frontend/dist/`.

---

## 17. Render Deployment Steps (Backend Daemon)

1. Connect your GitHub repository to [Render](https://render.com).
2. Create a new **Web Service** with the following settings:
   * **Root Directory:** `backend`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
3. Under **Environment Variables**, provide the following keys:
   * `NODE_ENV`: `production`
   * `MONGODB_URI`: `<Your MongoDB Atlas SRV URI>`
   * `JWT_SECRET`: `<32+ character random secret>`
   * `JWT_EXPIRES_IN`: `24h`
   * `ADMIN_SECRET_KEY`: `<16+ character administrative secret>`
   * `CRON_SCHEDULE`: `0 0 * * *`
   * `CRON_TIMEZONE`: `Asia/Kolkata`
   * `CLIENT_URL`: `https://<your-vercel-domain>.vercel.app`
4. Click **Create Web Service**. Verify that `https://<your-render-url>/api/health` returns HTTP 200.

---

## 18. Vercel Deployment Steps (Frontend SPA)

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Configure project settings:
   * **Framework Preset:** `Vite`
   * **Root Directory:** `frontend`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
3. Under **Environment Variables**, add:
   * `VITE_API_BASE_URL`: `https://<your-render-url>/api`
4. Deploy the project. Direct route refreshes (e.g. `/investments`, `/referrals`) are handled automatically by `frontend/vercel.json`.

---

## 19. Development Assumptions & Business Rules

All business rules and plan defaults are documented comprehensively in [`ASSUMPTIONS.md`](file:///c:/Users/kamil/Desktop/CMA/ASSUMPTIONS.md):
* **Internal Wallet Funding:** Investments debit internal wallet balances; simulated deposits allow friction-free testing.
* **Referral Basis:** Commissions are awarded upon investment creation based on principal amount (5% L1, 3% L2, 2% L3).
* **Maturity Lifecycle:** When `currentDate > endDate`, investments transition to `Completed` and stop yielding daily ROI.
* **Disclaimer:** Rates and tenures are configurable fixtures designed to demonstrate mathematical and technical correctness.

---

## 20. Known Limitations & Production Prerequisites

Before launching for commercial, real-money operations:
1. **Payment Gateway:** Replace `/api/wallet/deposit` with verified payment provider webhooks (e.g., Stripe, Razorpay).
2. **Corporate Sizing:** Upgrade Render to a persistent paid instance tier to ensure the background scheduler does not sleep after 15 minutes of inactivity.
3. **Legal Review:** Obtain regulatory approval and formal ratification of yield rates from corporate leadership.

---

## 21. Assessment Submission Checklist

* [x] **1. GitHub Repository Link:** [https://github.com/itskamil03/nexaAI](https://github.com/itskamil03/nexaAI)
* [x] **2. Database Schema Files:** [`backend/src/models/`](file:///c:/Users/kamil/Desktop/CMA/backend/src/models/)
* [x] **3. API Source Code:** [`backend/src/controllers/`](file:///c:/Users/kamil/Desktop/CMA/backend/src/controllers/), [`backend/src/routes/`](file:///c:/Users/kamil/Desktop/CMA/backend/src/routes/)
* [x] **4. Business Logic Implementation:** [`backend/src/services/`](file:///c:/Users/kamil/Desktop/CMA/backend/src/services/)
* [x] **5. React Dashboard:** [`frontend/src/`](file:///c:/Users/kamil/Desktop/CMA/frontend/src/)
* [x] **6. Cron Job Implementation:** [`backend/src/jobs/roiScheduler.js`](file:///c:/Users/kamil/Desktop/CMA/backend/src/jobs/roiScheduler.js)
* [x] **7. README & API Documentation:** [`README.md`](file:///c:/Users/kamil/Desktop/CMA/README.md), [`ASSUMPTIONS.md`](file:///c:/Users/kamil/Desktop/CMA/ASSUMPTIONS.md), [`NexaChain_AI_MERN_Collection.postman_collection.json`](file:///c:/Users/kamil/Desktop/CMA/NexaChain_AI_MERN_Collection.postman_collection.json)

---
*NexaChain AI Architecture Team — Certified for Submission.*
