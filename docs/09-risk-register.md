# NexaChain AI — Risk Register & Mitigation Matrix

## 1. Risk Register

| Risk ID | Risk Description | Likelihood | Impact | Severity | Mitigation Strategy | Contingency Plan |
|---|---|---|---|---|---|---|
| **R-01** | **Duplicate ROI Payout on Repeated Cron Execution** | High | Critical | High | Unique compound database index on `RoiHistory (investmentId, date)` + `idempotencyKey` on `WalletTransaction`. | Database code 11000 caught; duplicate write silently skipped and audited. |
| **R-02** | **Floating-Point Rounding Drift** | High | High | High | Internal `roundTo2Decimals` arithmetic with epsilon compensation. | Balances checked at boundary; automated decimal unit tests enforce 2-decimal consistency. |
| **R-03** | **Circular Referral Loops** | Low | High | Medium | Prevent self-referral at registration. Uplink traversal depth capped at max 3 levels. | Cycle detection set tracked during traversal; terminates immediately if repeated node seen. |
| **R-04** | **Cron Job Overlapping or Multiple Server Clashing** | Medium | High | High | Distributed `JobLock` document acquisition with atomic upsert before running batch. | Process aborts if lock is already held for the current date. |
| **R-05** | **Partial Failure During Multi-Document Financial Transaction** | Medium | Critical | High | MongoDB transactional session (`withTransaction`) or robust manual rollback compensation. | Wallet, ROI record, and ledger update either all commit or none commit. |
| **R-06** | **Referral Tree Memory Exhaustion on Deep Networks** | Medium | Medium | Medium | Traversal limit capped at 3 tiers (`maxDepth = 3`). Aggregation and projection limiting payload size. | Paginated downline views for direct referrals; lazy loading for deep branches. |
| **R-07** | **Unauthorized Private Financial Record Access** | Low | Critical | High | Scoped query filtering: all queries explicitly inject `userId: req.user._id`. | Unit tests verify HTTP 403 / 404 when querying foreign entity IDs. |
