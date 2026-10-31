# NexaChain AI — Requirements Analysis & Scope Document

## 1. Executive Summary
This document specifies the requirements for the **NexaChain AI Investment and Referral Platform** based on the technical assessment specification provided by NexaChain AI (Eco Space, Business Tower, Newtown, Kolkata, West Bengal, India).

The system is a production-grade, full-stack financial application built on the **MERN Stack** (MongoDB, Express.js, React.js, Node.js). It provides transparent investment management, daily automated return on investment (ROI) accrual, hierarchical multi-tier referral/level income distribution, an interactive analytics dashboard, and automated scheduled processing.

---

## 2. Core Assessment Tasks & Requirements Breakdown

### Task 1: Database Schema Design
Design robust MongoDB (Mongoose) models with explicit relationships, compound indexes, strict schema validation, and monetary precision controls:
- **User Entity**:
  - Full Name, unique Email, Mobile Number, bcrypt-hashed Password.
  - Unique Referral Code (auto-generated alphanumeric).
  - Parent Reference (`referredBy` pointing to another User document).
  - Financial balances: `walletBalance`, `totalRoiEarned`, `totalLevelIncomeEarned`.
  - Account status (`Active`, `Inactive`, `Suspended`), Timestamps.
- **Investment Entity**:
  - User reference (`userId`).
  - Investment amount (numeric, 2 decimal places precision).
  - Plan details (Plan name, tenure in days, minimum/maximum limits).
  - Start date, calculated End date.
  - Daily ROI percentage (e.g., 1.0% to 2.5% fixed per plan).
  - Investment status (`Active`, `Completed`, `Cancelled`), Timestamps.
- **Referral / Level Income Entity**:
  - Beneficiary user (`userId` receiving commission).
  - Source user (`sourceUserId` who made the qualifying action/investment).
  - Referral tier level (Level 1, Level 2, Level 3).
  - Commission income amount.
  - Qualifying event date, status (`Credited`, `Reversed`).
- **ROI History Entity**:
  - User reference (`userId`), Investment reference (`investmentId`).
  - Accrued ROI amount.
  - Normalized processing date (`YYYY-MM-DD`).
  - Status (`Credited`, `Failed`, `Skipped`).
  - **Idempotency Constraint**: Unique compound index on `{ investmentId: 1, date: 1 }` to guarantee no duplicate ROI payout for any single investment on any day.
- **WalletTransaction (Financial Ledger) Entity**:
  - Double-entry/ledger style audit log for every balance movement.
  - Fields: `userId`, `transactionType` (`ROI_CREDIT`, `REFERRAL_CREDIT`, `INVESTMENT_DEBIT`, `WALLET_DEPOSIT`), `direction` (`CREDIT`, `DEBIT`), `amount`, `sourceRecord` (Polymorphic ref to Investment/ROI/Referral), `idempotencyKey` (unique), `status` (`SUCCESS`, `PENDING`, `FAILED`), and timestamp.

---

### Task 2: API Development
Secure, standardized, RESTful endpoints following standard HTTP status codes, structured error handling, and JWT-based authentication:
- **Authentication**:
  - `POST /api/auth/register` — User signup with parent referral code verification, auto-code generation, and bcrypt hashing.
  - `POST /api/auth/login` — Email/password validation, credential checking, account status validation, and JWT token issuance.
  - `GET /api/auth/me` — Authenticated user profile retrieval.
- **Investment Management**:
  - `POST /api/investments` — Plan selection and investment creation; validates wallet balance or funding eligibility, records ledger transaction, initializes investment schedule.
  - `GET /api/investments` — List authenticated user's investments with status filters and pagination.
  - `GET /api/investments/:id` — Detailed breakdown of a specific investment and its accrued ROI.
- **Dashboard & Analytics**:
  - `GET /api/dashboard/summary` — Authoritative backend metrics: Total Investments, Total ROI Earned, Total Level Income Earned, Wallet Balance, Expected Daily ROI, and time-series earnings summary.
- **Referral System**:
  - `GET /api/referrals/direct` — Direct (Level 1) referrals with aggregate investment and earning metrics.
  - `GET /api/referrals/tree` — Complete hierarchical nested tree structure (up to maximum configured depth) with active status indicators.
  - `GET /api/referrals/income` — Detailed referral commission ledger with pagination.
- **ROI History & Ledger**:
  - `GET /api/roi/history` — Paginated history of daily ROI credits.
  - `GET /api/wallet/transactions` — Full audit trail of wallet deposits, debits, and earnings.
- **Administrative / Scheduler Maintenance**:
  - `POST /api/admin/roi/process` — Protected manual execution endpoint enabling date-specific backfills and validation.
  - `GET /api/health` — System health check, database ping, and uptime monitoring.

---

### Task 3: Business Logic Implementation
Reusable, modular, service-layer business logic:
- **Daily ROI Calculation Service**:
  - Identify all active investments where current date falls within `[startDate, endDate]`.
  - Calculate Daily ROI: $\text{ROI} = \text{Amount} \times \frac{\text{Daily ROI \%}}{100}$.
  - Apply banker's rounding to 2 decimal places.
  - Execute within MongoDB transactions or atomic document operations:
    1. Check for existing `RoiHistory` with the same `(investmentId, date)` key.
    2. Insert `RoiHistory` record.
    3. Insert `WalletTransaction` with unique idempotency key.
    4. Atomically increment User `walletBalance` and `totalRoiEarned`.
- **Referral / Level Income Distribution Service**:
  - Traverse upstream hierarchy starting from the investor's parent (`referredBy`).
  - Calculate tiered commission up to $N$ levels (Default: Level 1 = 5%, Level 2 = 3%, Level 3 = 2%).
  - Validate parent account active status.
  - Record `ReferralIncome` record and corresponding `WalletTransaction`.
  - Atomically credit parent's `walletBalance` and `totalLevelIncomeEarned`.
  - Ensure idempotency per investment event (`referral:<investmentId>:L<level>`).

---

### Task 4: React Dashboard
A modern, responsive, high-performance web dashboard built with React, Vite, and Tailwind CSS:
- **Fintech Theme**: Glassmorphism aesthetic, sapphire/emerald tones, dark/light contrast, accessible typographic hierarchy.
- **Four Core KPI Cards**:
  1. *Total Investments* ($/₹).
  2. *Daily ROI* (Daily expected and actual return).
  3. *Total Level Income* (Cumulative referral earnings).
  4. *Wallet Balance* (Spendable balance).
- **Interactive Tables**:
  - Investment History (Amount, Plan, Dates, Daily ROI %, Status pill).
  - Daily ROI History (Date, Investment Ref, Amount, Status).
  - Referral Income History (Source User, Level, Amount, Date).
- **Referral Tree Visualizer**:
  - Interactive, collapsible tree nodes showing direct and indirect referral downlines, member joining dates, and volume.
- **Charts & Data Visualizations**:
  - Earnings trajectory using Recharts (Area/Line chart of daily ROI vs Referral rewards).
  - Distribution breakdown (Donut/Pie chart).
- **Core User Flows**:
  - Registration & Login with validation and error toast notifications.
  - Referral link sharing widget with one-click copy.
  - "New Investment" modal with plan details and wallet balance verification.
  - "Simulate Wallet Deposit" action to facilitate seamless local testing.

---

### Task 5: Cron Job / Scheduler
Automated scheduling using `node-cron`:
- Daily trigger at midnight (`0 0 * * *`) in `Asia/Kolkata` (or system-configured timezone).
- Distributed execution lock using database state to prevent race conditions across server instances.
- Comprehensive batch error catching and logging.
- Guarantees strict idempotency even if run repeatedly.

---

## 3. Evaluation Criteria Alignment
| Criterion | Technical Implementation |
|---|---|
| **Database Design** | Normalized Mongoose models, compound unique indexes, balance constraints, timestamps. |
| **API Architecture** | Separation of concerns (Routes $\to$ Controllers $\to$ Services $\to$ Models), standardized error responses. |
| **Code Quality** | Modular ES6+ JavaScript, ESLint-compliant, cleanly commented service methods. |
| **Security Practices** | bcryptjs hashing (10 rounds), signed JWTs, helmet security headers, rate limiting, parameterized queries. |
| **Business Logic Accuracy** | Deterministic monetary rounding, atomic transactions, multi-layer idempotency keys. |
| **Frontend UI/UX** | Tailwind CSS with sleek glassmorphism, Recharts visualization, loading skeletons, error toasts. |
| **Performance Optimization** | Lean Mongoose queries, index utilization, React memoization, optimized assets. |
| **Documentation Quality** | Complete API specifications, Postman collection, architectural diagrams, reproducible setup. |
