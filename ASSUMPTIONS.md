# NexaChain AI — Business Rules, Assumptions & Configurable Architecture

**Project:** NexaChain AI — MERN Stack Investment and Referral Platform  
**Local Directory:** `C:\Users\kamil\Desktop\CMA`  
**Specification:** MERN Stack Developer Technical Assessment  
**Author:** Senior MERN Stack Architect & QA Lead  
**Document Status:** Formal Architecture & Design Assumptions  

---

## 1. Executive Notice & Regulatory Disclaimer

The **MERN Stack Developer Technical Assessment** specification provides the database schemas, REST API requirements, business logic requirements, React dashboard requirements, and scheduler goals. However, the specification does not specify real-world financial parameters (such as interest rates, principal refund policies, referral commission caps, or regulatory licenses).

> [!IMPORTANT]
> All interest rates, durations, affiliate percentages, deposit limits, and financial policies detailed herein are implemented as **configurable architectural defaults and test fixtures**. They are designed to demonstrate mathematical correctness, database concurrency safety, idempotency, and full technical assessment compliance. They **must not** be interpreted as legally binding commercial or financial commitments.

---

## 2. Investment Plans & Financial Yield Assumptions

### 2.1 Configurable Investment Plans (`backend/src/config/plans.js`)
Rather than hardcoding arbitrary plan thresholds in business logic, investment configurations are isolated in a declarative configuration dictionary:

| Plan ID | Plan Name | Min Principal | Max Principal | Daily ROI % | Tenure | Total ROI Cap |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `starter` | **Starter AI Yield** | \$100.00 | \$1,000.00 | **1.00%** | 30 Days | 30.0% |
| `growth` | **Growth Neural Vault** | \$1,001.00 | \$5,000.00 | **1.50%** | 60 Days | 90.0% |
| `enterprise` | **Enterprise Quantum** | \$5,001.00 | \$50,000.00 | **2.00%** | 90 Days | 180.0% |

### 2.2 Investment Boundaries & Validation
- **Minimum Investment:** \$10.00 (enforced at model validation level).
- **Plan Enforcement:** If a user submits an amount outside the selected plan's `[minAmount, maxAmount]` range, the request is rejected with HTTP 422 Unprocessable Entity.
- **Tenure Calculation:** Start date defaults to current UTC time. `endDate` is computed deterministically as `startDate + durationDays`.

### 2.3 Principal Return Upon Maturity
- **Assumption:** When `currentDate > endDate`, an investment automatically transitions from `Active` to `Completed`. Daily ROI accrual immediately ceases.
- **Principal Disposition:** In this assessment version, the initial principal remains recorded under the completed investment ledger. Any automatic principal return to the spendable wallet balance requires commercial executive policy determination prior to real-money launch.

---

## 3. Wallet Funding & Capital Deployment Model

### 3.1 Closed-Loop Internal Wallet
- The assessment requires "Create Investment" and "View User Investments" without requiring third-party payment gateway credentials (e.g., Stripe, Razorpay, or blockchain node RPCs).
- **Architectural Solution:** All investments are funded strictly by debiting the user's internal `walletBalance`.
- **Double-Entry Ledger:** Every debit produces a corresponding immutable `WalletTransaction` document (`INVESTMENT_DEBIT`) with atomic conditional guards (`$gte: amount`) to eliminate race conditions and overdrafts.

### 3.2 Simulated Top-Up Mechanics (`POST /api/wallet/deposit`)
- To facilitate frictionless end-to-end evaluation, QA testing, and manual user demonstration, an internal deposit endpoint and frontend modal are provided.
- Deposits credit the user's `walletBalance` and record an immutable `WALLET_DEPOSIT` ledger entry.
- In production with real money, this endpoint must be replaced with verified payment webhook handlers.

---

## 4. Multi-Tier Referral & Affiliate Commission Rules

### 4.1 Uplink Hierarchy Structure
- When User B registers with User A's referral code:
  - User B's `referredBy` points to User A (`_id`).
  - User A is **Level 1** (Direct Sponsor) to User B.
  - User A's sponsor (User X) is **Level 2** (Grandparent) to User B.
  - User X's sponsor (User Y) is **Level 3** (Great-Grandparent) to User B.

### 4.2 Commission Distribution Model (`backend/src/config/referral.js`)
- **Trigger Event:** Referral commissions are awarded immediately upon successful creation and funding of an investment by a downline user.
- **Tier Rates:**
  - **Level 1 (Direct Sponsor):** 5.0% of investment principal.
  - **Level 2 (Grandparent):** 3.0% of investment principal.
  - **Level 3 (Great-Grandparent):** 2.0% of investment principal.
  - **Max Traversal Depth:** 3 levels.
- **Eligibility:** Uplink users must have `accountStatus === 'Active'` to receive commissions. Suspended or inactive accounts are skipped without breaking the chain.
- **Cycle Prevention:** An in-memory visited `Set` detects and terminates circular sponsor chains to prevent infinite loops.
- **Idempotency:** Unique compound index `{ sourceEventId: 1, level: 1, userId: 1 }` in `ReferralIncome` prevents any possibility of double-paying a referral commission for the same investment event.

---

## 5. Daily ROI Accrual & Automated Scheduler

### 5.1 Daily ROI Calculation Formula
For each active investment on calendar date $D$:
$$\text{dailyRoiAmount} = \text{roundTo2Decimals}\left(\text{investment.amount} \times \frac{\text{investment.dailyRoiPercentage}}{100}\right)$$

### 5.2 Floating-Point Arithmetic Policy
All financial calculations employ epsilon-compensated rounding via `roundTo2Decimals()`:
$$\text{Math.round}((v + \text{Number.EPSILON}) \times 100) / 100$$
Non-finite inputs (`NaN`, `Infinity`, `null`) are strictly sanitized to `0.00`.

### 5.3 Schedule & Timezone
- **Cron Expression:** `0 0 * * *` (Daily at 12:00:00 AM midnight).
- **Timezone:** `Asia/Kolkata` (enforced via `node-cron` options and `Intl.DateTimeFormat` normalization).
- **Distributed Mutex:** Before batch processing, the scheduler acquires a lock in the `JobLock` collection keyed by `daily_roi_YYYY-MM-DD`. If another worker holds the lock, execution is skipped cleanly.
- **Stale Lock Recovery:** Locks held in `PROCESSING` status for longer than 30 minutes are considered crashed and safely reclaimed.

---

## 6. Cloud Hosting & Runtime Separation

1. **Backend Daemon (Render Web Service):**
   - The Express application and `node-cron` daemon must run on a persistent, stateful container (Render) to guarantee that background scheduled cron triggers fire continuously without entering serverless sleep cycles.
2. **Frontend SPA (Vercel):**
   - The React 18 / Vite 5 dashboard is deployed to Vercel's global CDN edge network.
   - Client-side routing is handled by HTML5 pushState rewrites (`frontend/vercel.json`).
3. **Database (MongoDB Atlas):**
   - Hosted on a 3-node replica set cluster (`Cluster0` in `asia-south1`), providing multi-document ACID transactions.
