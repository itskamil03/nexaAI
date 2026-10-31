# NexaChain AI — Business Rules, Assumptions & Configurable Settings

## 1. Important Regulatory & Architectural Disclaimer
The NexaChain AI Technical Assessment specification provides the functional scope, schema requirements, and core flows, but does not provide exhaustive corporate business rules regarding investment plans, referral percentage caps, cancellation penalties, or return of principal upon maturity.

Per architectural best practices and assessment rules:
> **Notice**: All percentage rates, tier levels, plan durations, and deposit mechanics documented herein are implemented as **configurable defaults / test fixtures**. They are designed to demonstrate complete architectural soundness, mathematical correctness, and system integrity. They **must not** be construed as official or guaranteed commercial policies of NexaChain AI.

---

## 2. Investment & Plan Configuration

### 2.1 Configurable Investment Plans
Instead of hardcoding arbitrary plans, the system utilizes a centralized configuration object (`src/config/plans.js`) that can be customized or loaded from the database:

| Plan ID | Plan Name | Min Amount | Max Amount | Daily ROI % | Duration | Default Yield Cap |
|---|---|---|---|---|---|---|
| `starter` | Starter AI Yield | $100.00 | $1,000.00 | 1.00% | 30 Days | 30.0% Total |
| `growth` | Growth Neural Vault | $1,001.00 | $5,000.00 | 1.50% | 60 Days | 90.0% Total |
| `enterprise` | Enterprise Quantum | $5,001.00 | $50,000.00 | 2.00% | 90 Days | 180.0% Total |

*Assumption*: If a user submits an amount outside the plan's `[minAmount, maxAmount]` range, the request is rejected with HTTP 422.

### 2.2 Investment Funding Model
- The assessment states "Create Investment" and "View User Investments". It does not specify an external payment gateway (e.g. Stripe, Razorpay) integration.
- **Architectural Solution**: Investment creation debits the user's internal `walletBalance`.
- To allow realistic end-to-end testing, a `/api/wallet/deposit` simulated funding endpoint and UI modal are provided.

### 2.3 Status Lifecycle
- `Active`: Investment is currently within its `[startDate, endDate]` window and accumulates daily ROI.
- `Completed`: An investment whose `endDate` has passed (`currentDate > endDate`). Once completed, daily ROI stops accruing.
- `Cancelled`: An investment administratively terminated. Yields no further ROI.

---

## 3. Daily ROI Accrual & Monetary Precision

### 3.1 Daily ROI Calculation Formula
$$\text{dailyRoiAmount} = \text{round}\left(\text{investment.amount} \times \frac{\text{investment.dailyRoiPercentage}}{100}\right)$$

Example: An investment of $1,000.00 at 1.5% yields:
$$1000.00 \times 0.015 = \$15.00$$

### 3.2 Rounding & Arithmetic Precision Policy
- All monetary operations maintain 2 decimal places.
- Calculation utility `roundTo2Decimals(num)` uses epsilon addition to prevent floating-point drift:
  $$\text{Math.round}((v + \text{Number.EPSILON}) \times 100) / 100$$
- Balances are stored as standard double-precision numbers formatted to 2 decimals at the boundary.

### 3.3 Eligibility & Normalization
- An investment is eligible for ROI on date $D$ (`YYYY-MM-DD`) if:
  1. `status === 'Active'`
  2. `startDate <= D`
  3. `endDate >= D`
  4. No existing record in `RoiHistory` exists with matching `(investmentId, D)`.

---

## 4. Referral / Multi-Tier Level Income

### 4.1 Referral Hierarchy Structure
- When User B registers with User A's referral code:
  - User B's `referredBy` points to User A (`_id`).
  - User A is Level 1 parent to User B.
  - User A's parent (User X) is Level 2 to User B.
  - User X's parent (User Y) is Level 3 to User B.

### 4.2 Commission Trigger & Tiers
- **Triggering Event**: In this implementation, referral income is distributed upon successful activation of a new investment by a downline user.
- **Configurable Tier Structure** (`src/config/referral.js`):
  - **Level 1 (Direct Referrer)**: 5.0% of investment amount.
  - **Level 2 (Grandparent)**: 3.0% of investment amount.
  - **Level 3 (Great-Grandparent)**: 2.0% of investment amount.
  - Maximum Depth: 3 levels (configurable).
- **Eligibility Check**: An uplink user is eligible to receive referral income only if their `accountStatus === 'Active'`.
- **Idempotency**: An investment can only distribute commission to a specific upline user for a specific level once. Unique key: `ref:<investmentId>:L<level>:<userId>`.

---

## 5. Scheduler (Cron) & Idempotency Rules

### 5.1 Schedule Timing
- Configured to run at **12:00 AM (midnight)** daily (`0 0 * * *`).
- Default Timezone: `Asia/Kolkata` (can be overridden via `TZ` or `CRON_TIMEZONE` env variable).

### 5.2 Idempotency Safeguards
1. **Database Lock**: `JobLock` document keyed on `daily_roi_YYYY-MM-DD` guarantees single execution across distributed clusters.
2. **Collection Unique Index**: `RoiHistory` compound index on `{ investmentId: 1, date: 1 }`. If a job runs twice, subsequent insert attempts fail safely with code 11000 (duplicate key) without duplicate wallet credits.
3. **Wallet Ledger Idempotency**: Each ledger entry contains a deterministic `idempotencyKey` (`roi:<invId>:<date>`).

---

## 6. Unresolved Questions & Decision Log

| # | Unresolved Question | Temporary Architectural Assumption | Official Policy Impact |
|---|---|---|---|
| 1 | Does principal return upon maturity? | Principal remains in investments ledger; status transitions to `Completed`. | Confirmation needed for production release. |
| 2 | Are referral commissions based on Investment principal or daily ROI? | Implemented as percentage of Investment principal (standard MLM/affiliate practice). Service is modular to support ROI-based distribution. | Confirmation needed from NexaChain management. |
| 3 | What are official commission rates per level? | Configured as default 5% (L1), 3% (L2), 2% (L3) with complete isolation in config file. | Requires client confirmation. |
| 4 | Can users invest from external crypto wallets directly? | Handled via internal wallet balance with simulated top-up endpoint for testing. | External Web3/gateway integration required in future phase. |
