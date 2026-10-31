# NexaChain AI — Implementation Roadmap

## 1. Roadmap Overview & Milestones

The implementation is structured across 10 distinct phases following disciplined software engineering practices. Each phase has concrete deliverables and explicit exit criteria.

```mermaid
gantt
    title NexaChain AI Implementation Roadmap
    dateFormat  YYYY-MM-DD
    section Phases
    Phase 1: Project Foundation           :done,    p1, 2026-10-31, 1d
    Phase 2: Database Models              :active,  p2, 2026-10-31, 1d
    Phase 3: Auth & Security              :         p3, 2026-10-31, 1d
    Phase 4: Investment & Dashboard APIs  :         p4, 2026-10-31, 1d
    Phase 5: Daily ROI Business Logic     :         p5, 2026-10-31, 1d
    Phase 6: Referral Distribution Logic  :         p6, 2026-10-31, 1d
    Phase 7: Cron Scheduler               :         p7, 2026-10-31, 1d
    Phase 8: React Dashboard & UI         :         p8, 2026-10-31, 1d
    Phase 9: Quality Assurance & E2E      :         p9, 2026-10-31, 1d
    Phase 10: Docs & Final Submission     :         p10, 2026-10-31, 1d
```

---

## 2. Phase-by-Phase Deliverables & Exit Criteria

### Phase 1 — Project Foundation
- **Tasks**:
  1. Initialize Node.js backend workspace and package.json with dependencies.
  2. Initialize Vite + React frontend workspace with Tailwind CSS.
  3. Configure MongoDB connection (`config/db.js`) with reconnection logic and pooling.
  4. Build Express server structure (`app.js`, `server.js`) with CORS, Helmet, and JSON parsers.
  5. Add health-check endpoint `GET /api/health`.
  6. Create `.env.example` templates for both frontend and backend.
- **Exit Criteria**: Both servers launch cleanly; backend responds to `/api/health`; frontend compiles.

### Phase 2 — Database Models
- **Tasks**:
  1. Build `User` model with password hashing hook, referral code generator, and balances.
  2. Build `Investment` model with plan snapshot, dates, and status enum.
  3. Build `ReferralIncome` model with tier levels and compound unique index.
  4. Build `RoiHistory` model with compound unique index on `(investmentId, date)`.
  5. Build `WalletTransaction` model with `idempotencyKey` unique index.
  6. Build `JobLock` model for scheduler coordination.
- **Exit Criteria**: All schemas compile, indexes are verified, and model unit tests pass.

### Phase 3 — Authentication & Security
- **Tasks**:
  1. Implement `POST /api/auth/register` with duplicate detection and referral uplink validation.
  2. Implement `POST /api/auth/login` with bcrypt verification and JWT generation.
  3. Implement `GET /api/auth/me` with sanitization (password excluded).
  4. Implement `authMiddleware` to protect private routes.
  5. Implement rate limiting and input validation schemas.
- **Exit Criteria**: Registration, login, and auth token verification succeed; unauthorized requests return 401.

### Phase 4 — Investment and Dashboard APIs
- **Tasks**:
  1. Implement `GET /api/investments/plans` returning configurable plans.
  2. Implement `POST /api/investments` with balance validation, ledger recording, and referral trigger.
  3. Implement `GET /api/investments` with pagination and status filters.
  4. Implement `GET /api/dashboard/summary` returning calculated totals and chart series.
  5. Implement `GET /api/referrals/direct` and `GET /api/referrals/tree`.
- **Exit Criteria**: APIs adhere to the contract in `docs/04-api-contract.md`; tests pass.

### Phase 5 — Daily ROI Business Logic
- **Tasks**:
  1. Implement `roiService.js` with `calculateInvestmentRoi` and `processInvestmentRoi`.
  2. Implement batch processor `processAllActiveInvestments(processingDate)`.
  3. Implement deterministic date normalizer and monetary rounding.
  4. Implement transaction boundaries and error recovery.
- **Exit Criteria**: Duplicate processing of same date yields 0 duplicate credits; financial totals match exactly.

### Phase 6 — Referral Income Distribution
- **Tasks**:
  1. Implement `referralService.js` with upstream recursive/iterative hierarchy traversal.
  2. Implement multi-level commission calculation and account eligibility verification.
  3. Record `ReferralIncome` and `WalletTransaction` entries.
  4. Test edge cases: 0 referrals, 1 level, 3 levels, inactive parent.
- **Exit Criteria**: Beneficiaries receive exact commission; duplicate calls are safely skipped.

### Phase 7 — Cron Scheduler
- **Tasks**:
  1. Implement `node-cron` job running daily at 12:00 AM (`0 0 * * *`) in Asia/Kolkata.
  2. Implement distributed database locking with `JobLock`.
  3. Implement manual admin execution endpoint `POST /api/admin/roi/process`.
- **Exit Criteria**: Scheduler executes ROI service idempotently; logs execution metrics.

### Phase 8 — React Dashboard
- **Tasks**:
  1. Build responsive layout (Sidebar, Navbar, Theme, Profile).
  2. Implement 4 KPI cards with live backend data and trend indicators.
  3. Implement Investment, ROI History, and Referral Income tables with pagination.
  4. Implement nested referral tree visualizer.
  5. Implement Recharts visualizations for earnings trajectory.
  6. Implement Investment creation modal and wallet simulation top-up modal.
- **Exit Criteria**: Dashboard fully communicates with backend; responsive on mobile and desktop; no mock data.

### Phase 9 — Integration & Quality Assurance
- **Tasks**:
  1. Execute unit and integration tests.
  2. Verify Scenarios A through G (repeated ROI, concurrency, failures, maturity, unauthorized access).
  3. Run end-to-end user journeys (Register -> Fund -> Invest -> Process ROI -> Verify Ledger & Dashboard).
- **Exit Criteria**: All automated test suites pass; verified zero financial inconsistency.

### Phase 10 — Documentation & Final Submission
- **Tasks**:
  1. Complete comprehensive `README.md`.
  2. Generate Postman Collection export (`NexaChain_AI_MERN_Collection.postman_collection.json`).
  3. Finalize all tracking logs and verification artifacts.
- **Exit Criteria**: Repository is clean, reproducible, and ready for evaluation.
