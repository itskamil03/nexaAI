# Financial Integrity & Transactional Audit Report: NexaChain AI

**System:** NexaChain AI MERN Stack Investment and Referral Platform  
**Audit Local Timestamp:** 2026-10-31T12:15:00+05:30  
**Audit Target:** Core Financial Ledger, Investment Engine, ROI Distribution, Referral Payouts, Decimal Precision, and Concurrency Protections  
**Final Status:** **CONDITIONALLY READY FOR STAGING**  

---

## 1. Executive Summary

This rigorous financial audit evaluated the state transition consistency, idempotency, concurrent request safety, numerical precision, and ledger integrity of the NexaChain AI platform. The audit identified and resolved **1 Critical defect (Concurrent Overdraft Race Condition)**, **1 High defect (Scheduler Stale Lock Deadlock)**, **1 Medium defect (Timezone Boundary Skew)**, and **1 Medium defect (IEEE 754 Non-Finite Propagation)**.

All financial state-mutating operations were tested against concurrent burst requests, partial database failures, duplicate scheduler executions, zero/negative inputs, and ledger discrepancy invariants. Automated scenario suites confirm mathematical consistency across all accounts:

$$\sum (\text{Credits}) - \sum (\text{Debits}) \equiv \text{User Wallet Balance}$$

---

## 2. Methodology & Verification Test Suite

The financial integrity suite was evaluated using Jest (`--runInBand --detectOpenHandles --forceExit`) against a live local MongoDB instance. All test executions were inspected directly:

```bash
cd backend && npm test -- tests/scenarios/financialScenarios.test.js
```

### Verified Test Scenarios

| Scenario | Objective | Status | Retest Result |
| :--- | :--- | :--- | :--- |
| **Scenario A** | Insufficient balance investment rejection | Verified | HTTP 400 rejected, balance unmodified |
| **Scenario B** | Normal investment creation with debit & ledger creation | Verified | Atomic debit, active investment, pending referral ledger created |
| **Scenario C** | 3-Tier referral tree calculation (5%, 3%, 2%) | Verified | Direct payouts + pending tier-2/3 records accurately logged |
| **Scenario D** | Daily ROI distribution & compound unique payout enforcement | Verified | Exact interest credited, duplicate runs safely skipped (0 duplicates) |
| **Scenario E** | Double-claim idempotency via duplicate daily ROI run | Verified | 0 duplicate records created, idempotent batch completion |
| **Scenario F** | Investment maturity transition & principal handling | Verified | `status: 'Completed'`, daily ROI halted upon maturity |
| **Scenario G** | Precision arithmetic & rounding across 10,000 cents | Verified | Exact cents representation, zero floating-point drift |
| **Scenario H** | Concurrent investment race condition (Overdraft prevention) | **FIXED & VERIFIED** | 1 succeeds, 1 rejects with 400; balance remains exactly 0 (no overdraft) |
| **Scenario I** | Stale lock recovery on worker crash / process termination | **FIXED & VERIFIED** | Stale lock (>30m) successfully reclaimed by secondary worker |

---

## 3. Financial Defect Tracking & Findings

### Finding FI-01: Concurrent Investment Request Wallet Overdraft (Double-Spend)
- **Severity:** **Critical**
- **Affected File:** [backend/src/services/investmentService.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/services/investmentService.js#L26-L58)
- **Evidence & Reproduction Steps:**
  1. A user holds a wallet balance of exactly $1,000.00 (`walletBalance: 1000`).
  2. The client fires two simultaneous `POST /api/investments` requests for $1,000.00 within the same millisecond window.
  3. *Root Cause:* The original code checked user balance in memory:
     ```javascript
     const user = await User.findById(userId);
     if (user.walletBalance < numAmount) throw new Error('Insufficient wallet balance');
     // ...
     user.walletBalance -= numAmount;
     await user.save();
     ```
  4. Both parallel requests read `walletBalance === 1000`, passed the guard, decremented by 1000, and sequentially saved, resulting in `walletBalance === -1000` (unauthorized overdraft).
- **Recommended Fix:**
  Execute an atomic conditional update directly at the MongoDB layer using `{ $inc: { walletBalance: -numAmount } }` with the query filter `{ _id: userId, walletBalance: { $gte: numAmount }, accountStatus: 'Active' }`. If MongoDB returns `null`, reject the request immediately before any investment document is created.
- **Fix Applied:** **Yes.** Implemented in [investmentService.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/services/investmentService.js#L29-L55). Also added compensating rollback if subsequent document creation encounters an unhandled failure on non-replica set deployments.
- **Actual Retest Result:** Tested in `Scenario H` of [financialScenarios.test.js](file:///c:/Users/kamil/Desktop/CMA/backend/tests/scenarios/financialScenarios.test.js#L274-L315). When 2 concurrent requests of $1,000 were launched on a $1,000 balance:
  ```text
  Successful investments: 1, Failed investments: 1
  Final wallet balance: 0 (Expected: 0)
  ```
  Overdraft completely eliminated.

---

### Finding FI-02: Scheduler Deadlock After Unexpected Worker Crash (Stale Lock)
- **Severity:** **High**
- **Affected File:** [backend/src/jobs/roiScheduler.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/jobs/roiScheduler.js#L25-L60)
- **Evidence & Reproduction Steps:**
  1. The daily ROI cron job triggers at 00:00 UTC and inserts a lock into `SchedulerLock` with `status: 'PROCESSING'`.
  2. The container or Node.js process crashes, receives `SIGKILL`, or encounters an unhandled out-of-memory error before completing.
  3. *Root Cause:* The unique index on `jobName` prevented any subsequent retry:
     ```javascript
     { jobName: lockKey, status: 'FAILED' } // Only looked for FAILED
     ```
  4. The job remained indefinitely locked in `PROCESSING` status, causing all future daily ROI distributions to be permanently skipped.
- **Recommended Fix:**
  Add a stale-lock expiration window (e.g., 30 minutes). If a lock is in `PROCESSING` status but its `lockedAt` timestamp is older than 30 minutes, treat it as an abandoned worker lock and allow reclamation via atomic `findOneAndUpdate`.
- **Fix Applied:** **Yes.** Implemented in [roiScheduler.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/jobs/roiScheduler.js#L29-L65).
- **Actual Retest Result:** Tested in `Scenario I` of [financialScenarios.test.js](file:///c:/Users/kamil/Desktop/CMA/backend/tests/scenarios/financialScenarios.test.js#L317-L342). Simulated a 45-minute-old lock in `PROCESSING` state; the scheduler reclaimed the lock and executed the batch without duplicate key errors.

---

### Finding FI-03: Midnight Date Boundary Timezone Skew
- **Severity:** **Medium**
- **Affected File:** [backend/src/utils/dateUtils.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/utils/dateUtils.js#L1-L35)
- **Evidence & Reproduction Steps:**
  1. Scheduler executes at 00:05 local time in IST (`Asia/Kolkata`, UTC+05:30).
  2. *Root Cause:* The standard `toISOString().split('T')[0]` converted the date back to UTC (which is 18:35 of the *previous* day).
  3. Consequently, ROI distributions were stamped with yesterday's date, risking off-by-one payout disputes and duplicate scheduler runs across UTC boundaries.
- **Recommended Fix:**
  Implement timezone-aware date normalization using `Intl.DateTimeFormat` with an explicit configurable timezone fallback (e.g., `Asia/Kolkata` or `UTC`).
- **Fix Applied:** **Yes.** Updated [dateUtils.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/utils/dateUtils.js#L1-L35) to format dates using `Intl.DateTimeFormat('en-CA', { timeZone })`.
- **Actual Retest Result:** Formatted midnight boundaries across UTC and IST. Normalized `YYYY-MM-DD` strings match the platform reference timezone accurately.

---

### Finding FI-04: Floating-Point Non-Finite Number Propagation
- **Severity:** **Medium**
- **Affected File:** [backend/src/utils/mathPrecision.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/utils/mathPrecision.js#L1-L30)
- **Evidence & Reproduction Steps:**
  1. In mathematical operations where values could be divided by zero or passed invalid types, `Number.isFinite` was not strictly checked.
  2. `toCents(Infinity)` resulted in `NaN` or unhandled runtime errors in transaction balance calculations.
- **Recommended Fix:**
  Add strict `Number.isFinite(val)` validation to all mathematical helper functions (`toCents`, `fromCents`, `round2`, `multiplyRate`).
- **Fix Applied:** **Yes.** Hardened [mathPrecision.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/utils/mathPrecision.js#L7-L29).
- **Actual Retest Result:** Unit tests verify that non-finite numbers return safe default `0` cents without polluting MongoDB documents.

---

### Finding FI-05: Simulation of Payment Gateway Deposits (Real-Money Barrier)
- **Severity:** **High (Operational / Financial Risk)**
- **Affected File:** [backend/src/controllers/walletController.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/controllers/walletController.js#L10-L40)
- **Evidence & Reproduction Steps:**
  1. The endpoint `POST /api/wallet/deposit` directly accepts `{ "amount": 5000 }` and increments the authenticated user's `walletBalance`.
  2. No third-party payment gateway webhook (e.g., Stripe, Razorpay, Coinbase Commerce) verifies that real funds were debited from a bank or blockchain wallet.
- **Recommended Fix:**
  This simulated deposit endpoint must remain strictly disabled or restricted in production environments. For production staging, integrate a verified webhook handler with cryptographic signature verification (e.g., HMAC-SHA256) before crediting user balances.
- **Fix Applied:** Documented as an operational prerequisite in [DEPLOYMENT_CHECKLIST.md](file:///c:/Users/kamil/Desktop/CMA/DEPLOYMENT_CHECKLIST.md). The endpoint is documented as a development simulation.
- **Actual Retest Result:** Confirmed in development and test environments. Production configuration requires webhooks.

---

### Finding FI-06: Referral Payout Idempotency & Unique Multi-Tier Keys
- **Severity:** **Low (Architecture Verification)**
- **Affected File:** [backend/src/services/referralService.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/services/referralService.js#L45-L95)
- **Analysis:**
  - Evaluated whether a referee triggering multiple investments or retrying an investment creation could generate duplicate referral commissions for their sponsor tree.
  - The platform implements a compound unique index on `ReferralPayout`:
    ```javascript
    referralPayoutSchema.index(
      { referrerId: 1, refereeId: 1, level: 1, investmentId: 1 },
      { unique: true }
    );
    ```
  - Furthermore, all referral payouts generate an immutable `Transaction` ledger record tagged with reference to the specific investment ID.
- **Retest Result:** Verified in `Scenario C` of the integration suite. Duplicate commission events are rejected by the unique database constraint.

---

### Finding FI-07: Daily ROI Distribution Idempotency
- **Severity:** **Low (Architecture Verification)**
- **Affected File:** [backend/src/services/roiService.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/services/roiService.js#L70-L125)
- **Analysis:**
  - Evaluated whether running the daily ROI batch twice on the same day could double-credit investors.
  - The `RoiPayout` collection enforces a unique compound index:
    ```javascript
    roiPayoutSchema.index({ investmentId: 1, payoutDate: 1 }, { unique: true });
    ```
  - Before crediting any wallet, the service checks for existing records on that date, and catches MongoDB duplicate key error code `11000` to prevent double-crediting.
- **Retest Result:** Tested in `Scenario E`. Rerunning `processDailyRoi` on the same date resulted in `0 credited ($0), 1 skipped`. User wallet balances remained unchanged.

---

## 4. Wallet Balance vs. Transaction Ledger Reconciliation

### Mathematical Invariant
At any point in time, a user's `walletBalance` must equal their initial balance plus all ledger credits minus all ledger debits:

$$\text{User.walletBalance} = \sum_{t \in \text{Credits}} t.\text{amount} - \sum_{t \in \text{Debits}} t.\text{amount}$$

### Standalone Reconciliation Audit Script
A verification query was executed against the database across all accounts:

```javascript
const transactions = await Transaction.find({ userId, status: 'Success' });
const calculated = transactions.reduce((acc, t) => {
  return t.type === 'Debit' ? acc - t.amount : acc + t.amount;
}, 0);
assert(Math.abs(user.walletBalance - calculated) < 0.001);
```

**Audit Result:** Zero discrepancy detected across all test runs and E2E verifications.

---

## 5. ACID Transaction Strategy: Standalone vs. Replica Set

| Environment | MongoDB Topology | Transaction Mechanism | Rollback Strategy |
| :--- | :--- | :--- | :--- |
| **Development / CI** | Standalone Node | Atomic conditional updates (`$inc`, `$gte`) | Compensating reverse writes on catch |
| **Production / Staging** | 3-Node Replica Set | Multi-document ACID session (`session.startTransaction()`) | Native MongoDB driver abort (`session.abortTransaction()`) |

The codebase in [investmentService.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/services/investmentService.js) has been designed with an environmental check: if a replica set is active, it utilizes `startSession()`; otherwise, it safely defaults to atomic conditional updates with compensating transactions.

---

## 6. Financial Sign-Off & Status

| Area | Status | Remarks |
| :--- | :--- | :--- |
| Concurrency & Overdraft Protection | **PASSED** | Atomic conditional updates verified |
| Precision Arithmetic | **PASSED** | Fixed cents integer math verified |
| Scheduler Distributed Lock | **PASSED** | Stale lock recovery (30m) active |
| Referral Tier Calculations | **PASSED** | 5%, 3%, 2% idempotency verified |
| Investment Maturity Lifecycle | **PASSED** | Auto-completion upon tenure reached |
| Real-Money Payment Gateways | **NOT CONFIGURED** | Simulated deposits only; requires payment provider |

**Financial Integrity Verdict:** **CONDITIONALLY READY FOR STAGING** (Technical mechanisms verified; awaiting payment gateway integration and corporate business rules confirmation).
