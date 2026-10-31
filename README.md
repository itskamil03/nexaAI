# NexaChain AI — Investment & Referral Platform (MERN Stack)

[![Node.js Version](https://img.shields.io/badge/Node.js-v24.18.0-green.svg)](https://nodejs.org/)
[![MongoDB Version](https://img.shields.io/badge/MongoDB-v8.0.8-emerald.svg)](https://www.mongodb.com/)
[![React Version](https://img.shields.io/badge/React-v18.3.1-blue.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4.17-cyan.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-34%2F34%20Passing-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-ISC-purple.svg)]()

> Production-grade implementation of the **NexaChain AI MERN Stack Developer Technical Assessment**.
>
> NexaChain AI — Eco Space, Business Tower, Newtown, Kolkata, West Bengal, India.

---

## 1. Project Overview

NexaChain AI is an end-to-end decentralized-style algorithmic investment and multi-tier affiliate referral platform. The application provides cryptographic balance management, automated daily Return on Investment (ROI) accrual, 3-tier hierarchical referral commission distribution, and an interactive analytics dashboard.

### Core Architecture Highlights
- **Layered Architecture**: Strict separation of concerns (Routes $\to$ Controllers $\to$ Services $\to$ Models $\to$ Utilities).
- **Zero Floating-Point Drift**: Fixed 2-decimal rounded precision math utilities with epsilon compensation.
- **Strict Idempotency**: Zero duplicate ROI or referral payouts, enforced via compound database unique indexes (`[investmentId, date]`), distributed locks (`JobLock`), and deterministic wallet transaction idempotency keys.
- **Enterprise Security**: Password encryption via bcryptjs (10 rounds), signed stateless JWTs, Helmet HTTP protection, and express-validator sanitization.
- **Automated Scheduling**: Cron service triggered at 12:00 AM (Asia/Kolkata) using `node-cron` with distributed database coordination.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS, React Router v6, Axios, Recharts, Lucide React |
| **Backend** | Node.js (v24), Express.js (v4), REST APIs, Morgan, Helmet, CORS, Express-Rate-Limit |
| **Database** | MongoDB v8.0, Mongoose v8 (Schemas, Compound Unique Indexes, Population) |
| **Authentication & Security** | JSON Web Tokens (JWT), bcryptjs, express-validator schemas |
| **Automation & Jobs** | node-cron (Daily 12:00 AM execution with database locking) |
| **Testing** | Jest, Supertest (Unit tests, Integration tests, Financial invariant scenario suites) |

---

## 3. Five Core Assessment Tasks Mapping

### Task 1: Database Schema Design (`backend/src/models/`)
1. **User Model (`User.js`)**: Full name, unique email, mobile number, bcrypt hashed password, unique referral code (`NX...`), parent sponsor reference (`referredBy`), `walletBalance`, `totalRoiEarned`, `totalLevelIncomeEarned`, account status enum.
2. **Investment Model (`Investment.js`)**: User reference, principal amount, plan details snapshot, start date, end date, immutable daily ROI percentage, status enum (`Active`, `Completed`, `Cancelled`).
3. **ReferralIncome Model (`ReferralIncome.js`)**: Recipient user, source user, triggering investment ID, referral level (1, 2, 3), commission percentage, amount, compound unique index on `{ sourceEventId: 1, level: 1, userId: 1 }`.
4. **RoiHistory Model (`RoiHistory.js`)**: Recipient user, investment reference, daily ROI amount, normalized calendar date (`YYYY-MM-DD`), status, compound unique index on `{ investmentId: 1, date: 1 }`.
5. **WalletTransaction Model (`WalletTransaction.js`)**: Double-entry ledger tracking all credits and debits (`ROI_CREDIT`, `REFERRAL_CREDIT`, `INVESTMENT_DEBIT`, `WALLET_DEPOSIT`), unique `idempotencyKey`, and running `balanceAfter`.
6. **JobLock Model (`JobLock.js`)**: Distributed mutex coordination for multi-instance cron execution.

### Task 2: API Development (`backend/src/controllers/`)
- **Authentication**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
- **Investments**: `GET /api/investments/plans`, `POST /api/investments`, `GET /api/investments`, `GET /api/investments/:id`.
- **Dashboard**: `GET /api/dashboard/summary` (Authoritative backend totals and Recharts time-series data).
- **Referrals**: `GET /api/referrals/direct` (Level 1 sponsors with aggregate volume), `GET /api/referrals/tree` (Full nested multi-level tree), `GET /api/referrals/income` (Paginated commission ledger).
- **ROI & Wallet**: `GET /api/roi/history`, `GET /api/wallet/transactions`, `POST /api/wallet/deposit` (Simulated funding).
- **Admin & Maintenance**: `POST /api/admin/roi/process` (Manual batch trigger), `GET /api/health` (Health check).

### Task 3: Business Logic Implementation (`backend/src/services/`)
- **Daily ROI Service (`roiService.js`)**:
  $$\text{Daily ROI} = \text{roundTo2Decimals}\left(\text{Investment Amount} \times \frac{\text{Daily ROI \%}}{100}\right)$$
  - Evaluates active investments within `[startDate, endDate]`.
  - Enforces maturity (transitions status to `Completed` when `date > endDate`).
  - Atomically credits `walletBalance` and `totalRoiEarned`, records `RoiHistory`, and creates `WalletTransaction`.
  - Idempotent against accidental double-execution.
- **Referral Distribution Service (`referralService.js`)**:
  - Traverses upline hierarchy from `sourceUser.referredBy` up to 3 tiers.
  - Cycle detection prevents circular referral exploitation.
  - Credits active parents: Level 1 = 5.0%, Level 2 = 3.0%, Level 3 = 2.0%.
  - Idempotent per investment event (`ref:<invId>:L<level>:<userId>`).

### Task 4: React Dashboard (`frontend/src/`)
- **KPI Summary Cards**: Total Investments, Daily ROI, Total Level Income, Wallet Balance.
- **Data Visualizations**: Recharts AreaChart & BarChart displaying 7-day earnings trajectory (Daily ROI vs Referral Rewards).
- **Interactive Tables**: Investment History, Daily ROI Ledger, Referral Commission Ledger with pagination and status pills.
- **Nested Referral Tree Component**: Collapsible tree visualizer mapping full multi-tier hierarchy with node volumes and joining dates.
- **Modals**: Plan Selection & Investment Activation modal; Wallet Top-Up simulation modal.
- **Aesthetic**: Modern dark mode with glassmorphism panels, sapphire and emerald accents, and responsive layout.

### Task 5: Cron Job / Scheduler (`backend/src/jobs/roiScheduler.js`)
- Automated daily schedule at 12:00 AM (`0 0 * * *`) in `Asia/Kolkata` timezone using `node-cron`.
- Distributed database locking via `JobLock` collection prevents race conditions across cluster instances.
- Fully idempotent: Safely skips investments already credited for the target date.
- Manual trigger API (`POST /api/admin/roi/process`) and interactive frontend console (`/cron-test`) for testing and evaluation.

---

## 4. Installation & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v24.18.0 tested)
- **MongoDB**: v6.0 or higher (v8.0.8 local server running on port 27017)
- **Git**

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd CMA
```

### Step 2: Configure Environment Variables
Backend configuration (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/nexachain
JWT_SECRET=nexachain_super_secure_jwt_secret_key_2026_dev_env
JWT_EXPIRES_IN=24h
CRON_SCHEDULE=0 0 * * *
CRON_TIMEZONE=Asia/Kolkata
CLIENT_URL=http://localhost:5173
ADMIN_SECRET_KEY=nexachain_admin_secret_cron_override_key
```

Frontend configuration (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Step 3: Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 4: Run Development Servers
In two separate terminal windows:

```bash
# Terminal 1: Backend Server (Port 5000)
cd backend
npm run dev

# Terminal 2: Frontend Vite Dashboard (Port 5173)
cd frontend
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 5. Automated Testing & Verification

The test suite contains **34 comprehensive automated tests** across 6 test suites covering models, authentication, investments, multi-tier referrals, scheduler locking, and financial integrity invariants.

### Run All Tests
```bash
cd backend
npm test
```

### Run Financial Integrity Scenarios (Mandatory Scenarios A through G)
```bash
npm test -- tests/scenarios/financialScenarios.test.js
```

| Scenario | Objective | Verified Result |
|---|---|---|
| **Scenario A** | Repeated ROI processing for same date | Exactly 1 credit; second run reports `SKIPPED` (0 duplicate dollars) |
| **Scenario B** | Concurrent asynchronous execution | Race condition caught by compound index; zero duplicate balance credits |
| **Scenario C** | Database failure / invalid entity ID | Operation aborted; zero phantom ledger entries created |
| **Scenario D** | Cancelled investment processing | Skipped; zero unauthorized ROI credited |
| **Scenario E** | Matured investment tenure | Investment status transitions to `Completed`; no post-maturity ROI |
| **Scenario F** | Repeated referral distribution | Second distribution call yields 0 duplicate commissions |
| **Scenario G** | Unauthorized tenant data access | Access denied (HTTP 404 / Scoped user isolation) |

### Run Live End-to-End Verification Script
```bash
node scripts/verify_e2e.js
```
Executes a complete simulated workflow: User Signup $\to$ Downline Sponsor Linkage $\to$ Wallet Deposit $\to$ Investment Activation $\to$ Referral Commission Distribution $\to$ ROI Processing $\to$ Idempotency Verification $\to$ Dashboard Metrics Validation.

---

## 6. Configurable Business Rules & Assumptions

Per Rule E of the assessment specification, all financial parameters are configurable defaults and test fixtures documented in `docs/05-business-rules-and-assumptions.md`:

1. **Investment Plans (`backend/src/config/plans.js`)**:
   - *Starter AI Yield*: $100 – $1,000 (1.0% Daily ROI, 30 days)
   - *Growth Neural Vault*: $1,001 – $5,000 (1.5% Daily ROI, 60 days)
   - *Enterprise Quantum*: $5,001 – $50,000 (2.0% Daily ROI, 90 days)
2. **Referral Commission Tiers (`backend/src/config/referral.js`)**:
   - Level 1 (Direct Sponsor): 5.0% of investment principal
   - Level 2 (Grandparent): 3.0% of investment principal
   - Level 3 (Great-Grandparent): 2.0% of investment principal
3. **Funding Mechanism**:
   - Internal wallet balance debited upon investment creation. A simulated top-up endpoint (`POST /api/wallet/deposit`) and frontend modal enable seamless testing without requiring real funds.
4. **Maturity Rule**:
   - When `currentDate > endDate`, an investment is marked `Completed` and stops accruing daily ROI.

---

## 7. Postman Collection
The root directory contains `NexaChain_AI_MERN_Collection.postman_collection.json` with sample request bodies, query parameters, and Bearer token variables for all endpoints.

Import the file into Postman:
1. Open Postman $\to$ Import $\to$ Select `NexaChain_AI_MERN_Collection.postman_collection.json`.
2. Set collection variable `baseUrl` to `http://localhost:5000/api`.
3. Run `POST /api/auth/login` to obtain the token and set the `token` collection variable.

---

## 8. Security & Architectural Compliance
- [x] Passwords encrypted using bcrypt (10 rounds).
- [x] Private routes protected via Bearer JWT tokens.
- [x] Helmet security headers applied.
- [x] CORS restricted to authorized frontend origins.
- [x] Rate limiting active on authentication endpoints.
- [x] Compound unique database indexes preventing duplicate payouts.
- [x] Zero floating-point drift (banker's decimal rounding).
- [x] Scoped queries preventing unauthorized cross-user data access.

---

## 9. License & Author
- **Assessment**: NexaChain AI MERN Stack Developer Technical Assessment
- **License**: ISC
