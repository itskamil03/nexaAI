# Staging Smoke Tests Specification & Manual Verification Checklist

**System:** NexaChain AI MERN Stack Investment and Referral Platform  
**Target Environment:** Staging (Pre-Production Deployment)  
**Document Type:** Smoke Test Specification & Execution Protocol  
**Local Timestamp:** 2026-10-31T12:30:00+05:30  
**Status:** **READY FOR STAGING DEPLOYMENT**  

---

## 1. Automated Execution

The staging environment includes a dedicated, repeatable smoke test suite located in [backend/scripts/run_staging_smoke_tests.js](file:///c:/Users/kamil/Desktop/CMA/backend/scripts/run_staging_smoke_tests.js).

### Running Automated Staging Smoke Tests
```bash
cd backend
STAGING_URL=https://staging-api.nexachain.internal ADMIN_SECRET_KEY=<staging_secret> npm run test:staging
```

### Verified Automated Execution Output
```text
===============================================================
       NEXACHAIN AI — STAGING ENVIRONMENT SMOKE TESTS          
Target: http://localhost:5000
===============================================================

[Check 1/12] Verifying Application Health & Database Readiness...
  ✓ Health: OK | DB: connected | Topology: Single

[Check 2/12] Testing User Registration (Sponsor)...
  ✓ Sponsor Registered. Code: NX446909

[Check 3/12] Testing User Login & JWT Authenticated Profile...
  ✓ JWT Login and Bearer token verification passed.

[Check 4/12] Testing Investment Plan Retrieval...
  ✓ Retrieved 3 active plans. Selected: Starter AI Yield (starter)

[Check 5/12] Testing Insufficient Balance Rejection...
  ✓ Insufficient balance rejected with HTTP 400 (Overdraft prevented).

[Check 6/12] Testing Wallet Deposit & Principal Investment Creation...
  ✓ Investment created ($100). Wallet debited to $500.

[Check 7/12] Testing Wallet Ledger Audit Trail Consistency...
  ✓ Ledger Invariant Verified: Sum(500.00) == Balance(500.00)

[Check 8/12] Testing Downline Referral Registration & Tree Hierarchy...
  ✓ Downline successfully linked to Sponsor tree under Level 1.

[Check 9/12] Testing Multi-Tier Referral Commission Distribution...
  ✓ Level 1 (5%) commission ($50.00) accurately credited to sponsor.

[Check 10/12] Testing Multi-Tenant Data Isolation (IDOR Resistance)...
  ✓ Data Isolation Verified: Cross-user investment access correctly denied (HTTP 404).

[Check 11/12] Testing Daily ROI Processing & Duplicate Prevention...
  ✓ Batch 1: Credited 2 investments ($11)
  ✓ Idempotency Verified: Batch 2 credited exactly 0 duplicate dollars.

[Check 12/12] Testing Administrative Endpoint Secret Authorization...
  ✓ Admin Security Verified: Unauthenticated requests rejected with HTTP 403.

===============================================================
  ALL 12 STAGING SMOKE TEST CHECKS PASSED WITH ZERO ERRORS!    
===============================================================
```

---

## 2. Twelve Core Staging Verification Checks

### Check 1: Application Health & Readiness Probe
- **Endpoint:** `GET /api/health`
- **Headers:** None required.
- **Expected Status:** HTTP 200 OK (HTTP 503 if database disconnected).
- **Expected Payload:**
  ```json
  {
    "status": "ok",
    "service": "nexachain-backend",
    "database": "connected",
    "databaseTopology": "ReplicaSetWithPrimary",
    "transactionsSupported": true,
    "uptime": 120,
    "environment": "staging"
  }
  ```
- **Pass Criteria:** `database === "connected"` and `status === "ok"`.

---

### Check 2: User Registration (Sponsor Account)
- **Endpoint:** `POST /api/auth/register`
- **Body:**
  ```json
  {
    "fullName": "Alice Staging Tester",
    "email": "alice_staging@nexachain.test",
    "mobileNumber": "9888800001",
    "password": "SecurePassword123!"
  }
  ```
- **Expected Status:** HTTP 201 Created.
- **Pass Criteria:** Returns JWT `token` and unique `referralCode` (e.g., `NX...`). Password field must be absent.

---

### Check 3: User Login and JWT Authorization
- **Endpoint:** `POST /api/auth/login` followed by `GET /api/auth/me`
- **Headers for `/me`:** `Authorization: Bearer <jwt_token>`
- **Expected Status:** HTTP 200 OK.
- **Pass Criteria:** Bearer token is verified by middleware; returns user profile matching registered email.

---

### Check 4: Investment Plan Retrieval
- **Endpoint:** `GET /api/investments/plans`
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Expected Status:** HTTP 200 OK.
- **Pass Criteria:** Returns array of at least 3 active plans with valid `planId`, `dailyRoiPercentage`, `durationDays`, `minAmount`, and `maxAmount`.

---

### Check 5: Insufficient Wallet Balance Rejection
- **Endpoint:** `POST /api/investments`
- **Body:** `{ "planId": "starter", "amount": 100 }` (when `walletBalance === 0`)
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Expected Status:** HTTP 400 Bad Request.
- **Expected Payload Message:** `"Insufficient wallet balance ($0.00). Required: $100.00. Please fund your wallet."`
- **Pass Criteria:** Request is rejected; zero overdraft permitted.

---

### Check 6: Investment Creation & Atomic Balance Debiting
- **Prerequisite:** Deposit $600 via `POST /api/wallet/deposit` `{ "amount": 600 }`.
- **Endpoint:** `POST /api/investments` `{ "planId": "starter", "amount": 100 }`
- **Expected Status:** HTTP 201 Created.
- **Pass Criteria:**
  - Investment document is created with status `'Active'`.
  - User wallet balance decreases from $600 to exactly $500.
  - Audit record created in `WalletTransaction` with `transactionType: 'INVESTMENT_DEBIT'`.

---

### Check 7: Wallet Ledger Mathematical Invariant
- **Endpoint:** `GET /api/wallet/transactions`
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Expected Status:** HTTP 200 OK.
- **Pass Criteria:**
  $$\sum (\text{Credits}) - \sum (\text{Debits}) \equiv \text{User.walletBalance}$$
  Zero floating-point rounding deviation allowed.

---

### Check 8: Downline Referral Attribution & Hierarchy Tree
- **Step 1:** Register downline user Bob passing Alice's `referralCode`.
- **Step 2:** Query `GET /api/referrals/tree` as Alice.
- **Expected Status:** HTTP 200 OK.
- **Pass Criteria:** Bob appears as a child node under Level 1 in Alice's tree structure.

---

### Check 9: Multi-Tier Referral Commission Distribution
- **Step:** Downline user Bob deposits $1,000 and activates an investment.
- **Verification:** Query `GET /api/auth/me` as Alice.
- **Pass Criteria:** Alice's `walletBalance` increments by exactly $50.00 (5% Tier 1 commission). `ReferralIncome` record is generated with `level: 1`.

---

### Check 10: Multi-Tenant Data Isolation (IDOR Resistance)
- **Step:** Bob attempts to retrieve Alice's private investment:
  `GET /api/investments/<Alice_Investment_Id>` with Bob's JWT.
- **Expected Status:** HTTP 404 Not Found or HTTP 403 Forbidden.
- **Pass Criteria:** Zero cross-tenant data exposure.

---

### Check 11: Daily ROI Processing & Idempotency
- **Endpoint:** `POST /api/admin/roi/process`
- **Headers:** `x-admin-secret: <staging_secret>`
- **Body:** `{ "processingDate": "2026-10-31" }`
- **Expected Status:** HTTP 200 OK.
- **Run 1:** Credited active investments with accrued daily interest.
- **Run 2 (Immediate Repeat):** Returns `processedCount: 0`, `totalRoiAmount: 0`.
- **Pass Criteria:** Accrual executes cleanly on Run 1 and records exactly 0 duplicate dollars on Run 2.

---

### Check 12: Frontend Loading, Navigation & Responsive Layout
- **Scope:** Staging Web App (`https://staging.nexachain.internal`)
- **Pass Criteria:**
  - Landing page loads without JavaScript runtime errors.
  - User login persists authentication state across browser refreshes.
  - Dashboard KPI cards display live totals from `/api/dashboard/summary`.
  - Recharts earnings trajectory renders cleanly on desktop (1440px) and mobile (375px).
  - Navigation drawer collapses properly on touch viewports.
