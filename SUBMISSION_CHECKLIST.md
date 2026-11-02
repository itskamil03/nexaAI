# NexaChain AI — Final Assessment Submission Checklist

**Project Name:** NexaChain AI — MERN Stack Investment and Referral Platform  
**Local Directory:** `C:\Users\kamil\Desktop\CMA`  
**Evaluation Standard:** *MERN Stack Developer Technical Assessment.pdf*  
**Repository Remote:** `https://github.com/itskamil03/nexaAI`  
**Branch:** `master`  
**Audit Completion Date:** 2026-11-02  

---

## 1. Primary Submission Deliverables (Page 7 Matrix)

| # | Submission Item | Verified Repository Path | Status | Verification Method |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **GitHub Repository Link** | `https://github.com/itskamil03/nexaAI` | **`COMPLETE`** | Git remote verified; all commits pushed to `origin/master`. |
| **2** | **Database Schema Files** | `backend/src/models/` | **`COMPLETE`** | 6 Mongoose schemas with compound indexes and relationships. |
| **3** | **API Source Code** | `backend/src/controllers/`, `backend/src/routes/` | **`COMPLETE`** | REST APIs for Auth, Investments, Dashboard, Referrals, ROI, and Admin. |
| **4** | **Business Logic Implementation** | `backend/src/services/` | **`COMPLETE`** | ROI calculation, 3-tier MLM traversal, and atomic wallet operations. |
| **5** | **React Dashboard** | `frontend/src/` | **`COMPLETE`** | Responsive React 18/Vite 5 SPA with cards, tables, tree, and charts. |
| **6** | **Cron Job Implementation** | `backend/src/jobs/roiScheduler.js` | **`COMPLETE`** | Daily 12:00 AM `Asia/Kolkata` scheduler with distributed `JobLock`. |
| **7** | **README & Documentation** | `README.md`, `ASSUMPTIONS.md` | **`COMPLETE`** | Setup guide, environment variables, API docs, and architecture assumptions. |

---

## 2. Assessment Tasks File-by-File Mapping

### Task 1: Database Schema Design
* [x] **User Entity:** [`backend/src/models/User.js`](file:///c:/Users/kamil/Desktop/CMA/backend/src/models/User.js)
  * Full name, unique email, mobile number, bcrypt hashed password, unique referral code, `referredBy` sponsor reference, `walletBalance`, `totalRoiEarned`, `totalLevelIncomeEarned`, `accountStatus` enum (`Active`/`Inactive`/`Suspended`).
* [x] **Investment Entity:** [`backend/src/models/Investment.js`](file:///c:/Users/kamil/Desktop/CMA/backend/src/models/Investment.js)
  * User reference (`userId`), principal amount, plan details snapshot, `startDate`, `endDate`, `dailyRoiPercentage`, status enum (`Active`/`Completed`/`Cancelled`).
* [x] **Referral / Level Income Entity:** [`backend/src/models/ReferralIncome.js`](file:///c:/Users/kamil/Desktop/CMA/backend/src/models/ReferralIncome.js)
  * Recipient user (`userId`), source generator (`sourceUserId`), triggering event (`sourceEventId`), `level` (1, 2, 3), `incomeAmount`, `commissionPercentage`, `date`. Compound unique index on `{ sourceEventId: 1, level: 1, userId: 1 }`.
* [x] **ROI History Entity:** [`backend/src/models/RoiHistory.js`](file:///c:/Users/kamil/Desktop/CMA/backend/src/models/RoiHistory.js)
  * User reference (`userId`), investment reference (`investmentId`), `roiAmount`, calendar date (`date`), `status`. Compound unique index on `{ investmentId: 1, date: 1 }`.
* [x] **Audit Ledger:** [`backend/src/models/WalletTransaction.js`](file:///c:/Users/kamil/Desktop/CMA/backend/src/models/WalletTransaction.js)
* [x] **Distributed Lock:** [`backend/src/models/JobLock.js`](file:///c:/Users/kamil/Desktop/CMA/backend/src/models/JobLock.js)

---

### Task 2: REST API Development
* [x] **User Registration:** `POST /api/auth/register` ([`authController.js`](file:///c:/Users/kamil/Desktop/CMA/backend/src/controllers/authController.js))
* [x] **User Login:** `POST /api/auth/login` ([`authController.js`](file:///c:/Users/kamil/Desktop/CMA/backend/src/controllers/authController.js))
* [x] **JWT Authentication:** `GET /api/auth/me` ([`authController.js`](file:///c:/Users/kamil/Desktop/CMA/backend/src/controllers/authController.js), [`auth.js`](file:///c:/Users/kamil/Desktop/CMA/backend/src/middleware/auth.js))
* [x] **Create Investment:** `POST /api/investments` ([`investmentController.js`](file:///c:/Users/kamil/Desktop/CMA/backend/src/controllers/investmentController.js))
* [x] **View User Investments:** `GET /api/investments` ([`investmentController.js`](file:///c:/Users/kamil/Desktop/CMA/backend/src/controllers/investmentController.js))
* [x] **Dashboard Summary:** `GET /api/dashboard/summary` ([`dashboardController.js`](file:///c:/Users/kamil/Desktop/CMA/backend/src/controllers/dashboardController.js))
  * Returns: Total Investments, Total ROI Earned, Total Level Income Earned, Wallet Balance.
* [x] **Fetch Direct Referrals:** `GET /api/referrals/direct` ([`referralController.js`](file:///c:/Users/kamil/Desktop/CMA/backend/src/controllers/referralController.js))
* [x] **Fetch Complete Referral Tree:** `GET /api/referrals/tree` ([`referralController.js`](file:///c:/Users/kamil/Desktop/CMA/backend/src/controllers/referralController.js))
* [x] **Postman Collection:** [`NexaChain_AI_MERN_Collection.postman_collection.json`](file:///c:/Users/kamil/Desktop/CMA/NexaChain_AI_MERN_Collection.postman_collection.json)

---

### Task 3: Business Logic Implementation
* [x] **Daily ROI Calculation Service:** [`backend/src/services/roiService.js`](file:///c:/Users/kamil/Desktop/CMA/backend/src/services/roiService.js)
  * Formula: `amount * (dailyRoiPercentage / 100)`.
  * Epsilon-compensated banker's rounding (`mathPrecision.js`).
  * Automatic maturity transition to `Completed`.
* [x] **Multi-Tier Referral Distribution Service:** [`backend/src/services/referralService.js`](file:///c:/Users/kamil/Desktop/CMA/backend/src/services/referralService.js)
  * Level 1 (5%), Level 2 (3%), Level 3 (2%).
  * Traverses upline sponsor chain with loop/cycle prevention.
  * Credits wallet balance, updates totals, and inserts immutable ledger transactions.

---

### Task 4: React Dashboard
* [x] **4 KPI Stat Cards:** [`frontend/src/components/StatCard.jsx`](file:///c:/Users/kamil/Desktop/CMA/frontend/src/components/StatCard.jsx) in [`Dashboard.jsx`](file:///c:/Users/kamil/Desktop/CMA/frontend/src/pages/Dashboard.jsx)
  1. Total Investments
  2. Daily ROI
  3. Total Level Income
  4. Wallet Balance
* [x] **3 Historical Ledger Tables:**
  1. Investment History ([`InvestmentTable.jsx`](file:///c:/Users/kamil/Desktop/CMA/frontend/src/components/InvestmentTable.jsx))
  2. ROI History ([`RoiTable.jsx`](file:///c:/Users/kamil/Desktop/CMA/frontend/src/components/RoiTable.jsx))
  3. Referral Income History ([`ReferralTable.jsx`](file:///c:/Users/kamil/Desktop/CMA/frontend/src/components/ReferralTable.jsx))
* [x] **Hierarchical Nested Referral Tree:** [`frontend/src/components/ReferralTree.jsx`](file:///c:/Users/kamil/Desktop/CMA/frontend/src/components/ReferralTree.jsx)
* [x] **Visual Earnings Trajectory:** [`frontend/src/components/EarningsChart.jsx`](file:///c:/Users/kamil/Desktop/CMA/frontend/src/components/EarningsChart.jsx) (Recharts)

---

### Task 5: Cron Job / Scheduler
* [x] **Automated Scheduler:** [`backend/src/jobs/roiScheduler.js`](file:///c:/Users/kamil/Desktop/CMA/backend/src/jobs/roiScheduler.js)
  * Scheduled for 12:00 AM daily (`0 0 * * *`) in `Asia/Kolkata`.
  * Distributed mutex locking via `JobLock` collection.
  * 30-minute stale lock auto-recovery.
* [x] **Idempotency Guarantee:**
  * Second batch execution on the same calendar date yields 0 duplicate balances and 0 duplicate records.
* [x] **Operator Testing Console:** [`frontend/src/pages/CronTestPage.jsx`](file:///c:/Users/kamil/Desktop/CMA/frontend/src/pages/CronTestPage.jsx)
  * Allows manual triggering and validation for any target date.

---

## 3. Verified Deployment Infrastructure

* **Backend Web Service:** [https://nexachain-api.onrender.com](https://nexachain-api.onrender.com)
  * Health Endpoint: [https://nexachain-api.onrender.com/api/health](https://nexachain-api.onrender.com/api/health) (**HTTP 200 OK**)
  * Topology: MongoDB Atlas ReplicaSet with Primary.
* **Frontend Web Application:** [https://nexa-ai-guuc.vercel.app](https://nexa-ai-guuc.vercel.app) (**HTTP 200 OK**)
  * Environment Variable: `VITE_API_BASE_URL=https://nexachain-api.onrender.com/api`
* **Automated CI/CD:** Connected to branch `master` of `https://github.com/itskamil03/nexaAI`.

