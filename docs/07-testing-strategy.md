# NexaChain AI — Comprehensive Testing Strategy

## 1. Testing Framework & Philosophy

The financial integrity of the NexaChain AI platform requires zero tolerance for floating-point inaccuracies, race conditions, or duplicate credits. The testing suite is built using **Jest**, **Supertest**, and specialized financial invariant assertions.

```
Tests Distribution:
├── Unit Tests           (Models, Math utilities, Date helpers, Plan rules)
├── Integration Tests    (Auth APIs, Investment APIs, Dashboard APIs, Referral APIs)
├── Business Logic Tests (ROI Service, Referral Hierarchy Distribution Service)
├── Scenario Tests       (Scenarios A through G — Financial Invariant Enforcement)
└── E2E Flow Tests       (Full user journey: Signup -> Fund -> Invest -> ROI -> Cron)
```

---

## 2. Mandatory Financial Integrity Test Scenarios

### Scenario A: Repeated ROI Processing (Idempotency)
- **Objective**: Execute ROI calculation for the same investment and the same date twice.
- **Assertion**:
  - Exactly one `RoiHistory` record exists.
  - Exactly one `WalletTransaction` record is created.
  - User's `walletBalance` and `totalRoiEarned` reflect exactly one daily credit.
  - The second run returns status `SKIPPED` with 0 duplicate credits.

### Scenario B: Concurrent Processing (Race Condition Prevention)
- **Objective**: Trigger two parallel asynchronous processing calls for the same investment on the same date.
- **Assertion**:
  - MongoDB unique index or database lock handles the race condition.
  - Exactly one operation succeeds; the other safely catches code 11000 or lock rejection.
  - No duplicate balance increment occurs.

### Scenario C: Database Transaction Failure & Rollback
- **Objective**: Simulate a mid-transaction failure (e.g. invalid document write or network interrupt after ROI history creation).
- **Assertion**:
  - The entire operation rolls back.
  - No partial state exists (i.e. wallet is not credited without a corresponding ledger entry).

### Scenario D: Cancelled Investment Handling
- **Objective**: Attempt to run daily ROI on an investment marked `status: 'Cancelled'`.
- **Assertion**:
  - The investment is excluded from processing.
  - 0 ROI is credited.

### Scenario E: Matured Investment (End Date Enforcement)
- **Objective**: Process an investment where `currentDate > endDate`.
- **Assertion**:
  - The investment status transitions to `Completed` or is skipped.
  - No post-maturity ROI is accrued.

### Scenario F: Repeated Referral Commission Distribution
- **Objective**: Trigger referral income distribution twice for the same qualifying investment event.
- **Assertion**:
  - Commission is distributed exactly once.
  - The second execution detects the compound unique key `{ sourceEventId, level, userId }` and safely exits.

### Scenario G: Unauthorized Access & Data Isolation
- **Objective**: User A attempts to view or modify User B's investments, wallet ledger, or private referral details.
- **Assertion**:
  - Access is denied with HTTP 403 Forbidden or scoped query returning an empty set / 404.

---

## 3. Test Execution Commands & Structure

Tests are organized under `backend/tests/`:
```
backend/tests/
├── setup.js                      # Global database connection and teardown hooks
├── unit/
│   ├── mathUtils.test.js         # Decimal rounding and precision checks
│   └── models.test.js            # Schema validation and index enforcement
├── integration/
│   ├── auth.test.js              # Register, login, duplicate accounts, password hashing
│   ├── investments.test.js       # Plan validation, creation, retrieval
│   └── dashboard.test.js         # Metrics calculation verification
├── services/
│   ├── roiService.test.js        # Single & batch ROI calculation
│   └── referralService.test.js   # Multi-tier tree traversal and commission distribution
└── scenarios/
    └── financialScenarios.test.js# Mandatory Scenarios A through G
```

### Running Tests
```bash
# Run all automated tests
npm test --prefix backend

# Run financial integrity scenarios specifically
npm test --prefix backend -- tests/scenarios/financialScenarios.test.js
```
