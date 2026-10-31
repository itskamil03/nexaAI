# NexaChain AI — Security Checklist & Hardening Measures

## 1. Security Architecture Matrix

| Security Domain | Vulnerability / Threat | Implementation & Countermeasure | Status |
|---|---|---|---|
| **Password Storage** | Credential dumping, rainbow tables | `bcryptjs` with salt work factor of 10 rounds. Cleartext passwords never persisted or logged. | Enforced |
| **Authentication** | Session hijacking, impersonation | Stateless JWTs signed with `JWT_SECRET`, expiring in 24 hours. Validated on every protected route via `authMiddleware`. | Enforced |
| **Data Leakage** | Exposing password hashes in responses | Mongoose schema projection (`select: false`) and serializer deleting `password` before JSON serialization. | Enforced |
| **Balance Tampering** | Parameter tampering via profile updates | Strict separation of profile modification from financial balance mutations. Balance only modified via transactional service methods. | Enforced |
| **Self-Referral Fraud** | Users referring themselves for commissions | Explicit check during registration: `user.referralCode !== req.body.referralCode`, preventing recursive uplinks. | Enforced |
| **Replay & Double Payout** | Repeated financial requests / duplicate cron runs | Multi-layer idempotency keys (`roi:<invId>:<date>`) backed by compound unique indexes in MongoDB. | Enforced |
| **NoSQL Injection** | Malicious query operators (`$gt`, `$ne`) | Strict schema typing via Mongoose, parameterized inputs, and express-validator validation. | Enforced |
| **Denial of Service (DoS)** | Brute-force login & endpoint flooding | `express-rate-limit` restricting auth routes (e.g., 20 requests per 15 minutes per IP). | Enforced |
| **CORS Exploitation** | Cross-origin request forgery | `cors` configured with explicit origin allowlist (Frontend Vite port). | Enforced |
| **HTTP Vulnerabilities** | Clickjacking, MIME sniffing, XSS | `helmet` middleware configuring HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `HSTS`). | Enforced |
| **Unauthorized Access** | Tenant crossover, unauthorized object viewing | Scoped database queries ensuring users can only read their own investments, transactions, and downline. | Enforced |

---

## 2. Hardening Verification Checklist
- [x] Passwords hashed with bcrypt before storing in database.
- [x] JWT expiration enforced and handled gracefully on client.
- [x] All private API routes protected by Bearer JWT middleware.
- [x] Unique compound index `{ investmentId: 1, date: 1 }` active on `RoiHistory`.
- [x] Unique compound index `{ sourceEventId: 1, level: 1, userId: 1 }` active on `ReferralIncome`.
- [x] Unique index `{ idempotencyKey: 1 }` active on `WalletTransaction`.
- [x] No sensitive credentials or secrets stored in Git repository.
- [x] Helmet security headers applied to Express app.
- [x] CORS restricted to authorized frontend origins.
- [x] Centralized error handler masks stack traces in production mode.
