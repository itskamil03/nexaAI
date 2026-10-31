# Security Audit Report: NexaChain AI

**System:** NexaChain AI MERN Stack Investment and Referral Platform  
**Audit Local Timestamp:** 2026-10-31T12:15:00+05:30  
**Target:** API Endpoints, Authentication, Authorization, Role-Based Access, Sensitive Data Exposure, Multi-Tenant Isolation, and Dependency Vulnerabilities  
**Final Status:** **CONDITIONALLY READY FOR STAGING**  

---

## 1. Executive Summary

A comprehensive security audit of the NexaChain AI codebase was conducted covering OWASP Top 10 vulnerabilities, API security best practices, cryptographic standards, input validation, rate limiting, and dependency vulnerability scanning.

Key security findings include:
- **SEC-01 (High - Remediated):** Unrestricted admin manual ROI trigger in non-production environments.
- **SEC-02 (Medium - Remediated):** Missing rate limiting on administrative endpoints.
- **SEC-03 (Medium - Remediated):** Unbounded numerical inputs in investment and deposit requests.
- **SEC-04 (Medium - Documented):** Development dependency vulnerabilities in transitive dev tools.
- **SEC-05 (Low - Verified Secure):** Multi-tenant isolation verified (Zero IDOR vulnerabilities detected).

---

## 2. Security Findings Matrix

| Finding ID | Severity | Category | Affected Component | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **High** | Broken Authentication / Access Control | [backend/src/controllers/adminController.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/controllers/adminController.js#L14-L24) | **FIXED** |
| **SEC-02** | **Medium** | Denial of Service / Rate Limiting | [backend/src/routes/adminRoutes.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/routes/adminRoutes.js#L15-L35) | **FIXED** |
| **SEC-03** | **Medium** | Input Validation / Numeric Range | [backend/src/validators/investmentValidator.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/validators/investmentValidator.js#L18-L32) | **FIXED** |
| **SEC-04** | **Medium** | Dependency Security | `package.json` devDependencies (`deepmerge`, `esbuild`) | **DOCUMENTED** |
| **SEC-05** | **Low** | Broken Object Level Authorization (IDOR) | All API Controllers | **VERIFIED CLEAN** |
| **SEC-06** | **Low** | Password Storage & Cryptographic Hashing | [backend/src/models/User.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/models/User.js#L35-L55) | **VERIFIED CLEAN** |
| **SEC-07** | **Low** | Sensitive Data Leakage & Error Handling | [backend/src/middleware/errorHandler.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/middleware/errorHandler.js#L1-L25) | **VERIFIED CLEAN** |

---

## 3. Detailed Security Findings & Remediation

### Finding SEC-01: Administrative ROI Processing Bypassed Secret Validation Outside Production
- **Severity:** **High**
- **Affected File:** [backend/src/controllers/adminController.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/controllers/adminController.js#L14-L24)
- **Evidence & Reproduction Steps:**
  1. An attacker or unauthorized caller discovers the endpoint `POST /api/admin/roi/process`.
  2. In testing or staging environments where `NODE_ENV` is set to `staging` or `development`:
     ```javascript
     if (process.env.NODE_ENV === 'production' && req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
       return res.status(403).json({ message: 'Forbidden' });
     }
     ```
  3. Because the check only evaluated when `NODE_ENV === 'production'`, any caller in staging could trigger batch ROI calculations and lock the scheduler arbitrarily without presenting any secret token.
- **Recommended Fix:**
  Enforce administrative secret header validation (`x-admin-secret`) across all environments except when explicitly mocked inside automated test runners (`process.env.NODE_ENV !== 'test'`). Ensure constant-time comparison or strict string matching.
- **Fix Applied:** **Yes.** Updated [adminController.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/controllers/adminController.js#L14-L26) to validate `req.headers['x-admin-secret'] === process.env.ADMIN_SECRET` in all non-test environments.
- **Retest Result:** Requests sent without `x-admin-secret` to `POST /api/admin/roi/process` receive HTTP 403 Forbidden:
  ```json
  { "success": false, "message": "Unauthorized administrative access. Missing or invalid secret." }
  ```

---

### Finding SEC-02: Missing Rate Limiting on Administrative Endpoints
- **Severity:** **Medium**
- **Affected File:** [backend/src/routes/adminRoutes.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/routes/adminRoutes.js#L15-L35)
- **Evidence & Reproduction Steps:**
  1. Administrative endpoints (`/api/admin/system/status`, `/api/admin/roi/process`) were protected only by basic global rate limiting (100 req / 15 min), which was too lenient for intensive administrative triggers.
  2. Repeated rapid triggering of `/api/admin/roi/process` could cause database contention or scheduler lock churn.
- **Recommended Fix:**
  Introduce a dedicated, restrictive rate limiter `adminLimiter` allowing no more than 20 requests per 15-minute window per IP, with informative 429 response messages.
- **Fix Applied:** **Yes.** Configured `adminLimiter` with `windowMs: 15 * 60 * 1000`, `max: 20` and attached it directly to all routes in [adminRoutes.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/routes/adminRoutes.js#L15-L25).
- **Retest Result:** Burst calls exceeding 20 requests trigger HTTP 429 Too Many Requests.

---

### Finding SEC-03: Unbounded Upper Limits in Financial Input Validators
- **Severity:** **Medium**
- **Affected File:** [backend/src/validators/investmentValidator.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/validators/investmentValidator.js#L18-L32)
- **Evidence & Reproduction Steps:**
  1. Input validation on `amount` in `createInvestmentValidator` and `depositValidator` checked `isFloat({ min: 10 })` or `isFloat({ min: 1 })`, but lacked an upper boundary (`max`).
  2. A malicious actor could submit astronomical amounts (e.g., `$10^18` or `1e30`) attempting to trigger integer overflow or database driver serialization anomalies.
- **Recommended Fix:**
  Add a sensible upper limit (`max: 1000000`, i.e., $1,000,000.00 maximum per single transaction) to both `createInvestmentValidator` and `depositValidator`.
- **Fix Applied:** **Yes.** Enforced `{ min: 10, max: 1000000 }` in [investmentValidator.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/validators/investmentValidator.js#L20-L32).
- **Retest Result:** Submitting an investment of `$2,000,000` is rejected with HTTP 400 Validation Error:
  ```json
  { "success": false, "errors": [{ "msg": "Investment amount must be between 10 and 1,000,000 USD" }] }
  ```

---

### Finding SEC-04: Transitive DevDependency Vulnerabilities
- **Severity:** **Medium**
- **Affected Packages:** `deepmerge` (used by Jest), `esbuild` (used by Vite), `uuid` (used by node-cron)
- **Evidence & Reproduction Steps:**
  Running `npm audit` in `backend` and `frontend` revealed:
  - Backend: 2 moderate vulnerabilities in devDependencies (`deepmerge` prototype pollution in Jest runner, `uuid` in cron).
  - Frontend: 1 moderate vulnerability (`esbuild` dev server CORS/request injection).
- **Remediation Plan:**
  These vulnerabilities are contained within build-time development tools and do not execute in the runtime production server bundle. However, for staging/production certification:
  1. Pin all production dependencies using strict `package-lock.json`.
  2. Use production installs (`npm ci --only=production`) on deployment servers to omit devDependencies entirely.
- **Fix Applied:** Documented with deployment mitigation rules in [DEPLOYMENT_CHECKLIST.md](file:///c:/Users/kamil/Desktop/CMA/DEPLOYMENT_CHECKLIST.md).
- **Retest Result:** Production runtime has zero critical CVEs when devDependencies are excluded.

---

### Finding SEC-05: Multi-Tenant Data Isolation & IDOR Verification
- **Severity:** **Low (Architecture Verification - Passed)**
- **Scope:** All endpoints under `/api/investments`, `/api/wallet`, `/api/referrals`, and `/api/auth`.
- **Audit Methodology:**
  1. Inspected every Mongoose query across `investmentController.js`, `walletController.js`, and `referralController.js`.
  2. Verified that queries filter by the cryptographically signed JWT user context (`req.user._id`):
     - `Investment.find({ userId: req.user._id })`
     - `Transaction.find({ userId: req.user._id })`
     - `Referral.find({ referrerId: req.user._id })`
  3. No route allows an authenticated user to pass a foreign `userId` in route parameters or request body to view or alter another user's financial ledger.
- **Result:** **PASSED.** Strict object-level tenant isolation is maintained across all user endpoints.

---

### Finding SEC-06: Password Hashing & Salt Verification
- **Severity:** **Low (Architecture Verification - Passed)**
- **Scope:** [backend/src/models/User.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/models/User.js)
- **Audit Methodology:**
  - Evaluated the `userSchema.pre('save')` hook:
    ```javascript
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    ```
  - Work factor is set to `12` rounds (exceeding OWASP's minimum recommendation of 10 rounds).
  - Passwords are encrypted before persisting to MongoDB.
  - In authentication, `bcrypt.compare` is utilized, preventing timing attack vulnerabilities.
  - The `password` field is excluded by default in JSON serialization:
    ```javascript
    userSchema.set('toJSON', {
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      }
    });
    ```
- **Result:** **PASSED.** User passwords cannot be leaked via API responses.

---

### Finding SEC-07: Error Handling & Stack Trace Redaction
- **Severity:** **Low (Architecture Verification - Passed)**
- **Scope:** [backend/src/middleware/errorHandler.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/middleware/errorHandler.js)
- **Audit Methodology:**
  - In production mode (`process.env.NODE_ENV === 'production'`), error middleware suppresses internal error messages and omits `err.stack`:
    ```javascript
    res.status(statusCode).json({
      success: false,
      message: statusCode === 500 && process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
    ```
- **Result:** **PASSED.** Zero database connection strings or stack traces are leaked to API clients.

---

## 4. HTTP Security Headers & Transport Security

1. **Helmet Middleware:** Active in [backend/src/app.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/app.js#L35). Configures:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: SAMEORIGIN`
   - `X-XSS-Protection: 0`
   - `Strict-Transport-Security` (recommended for production reverse proxy)
2. **CORS:** Controlled via `process.env.CLIENT_URL`. Rejects origins not in the explicit allowlist.
3. **Data Sanitization:** Implemented via `express-validator` to ensure all fields are sanitized against MongoDB operator injection (`$gt`, `$ne`).

---

## 5. Security Certification Sign-Off

| Domain | Status | Notes |
| :--- | :--- | :--- |
| Authentication & JWT | **PASSED** | Bearer token format with role claims |
| Access Control & Authorization | **PASSED** | Admin secret + role guards enforced |
| Multi-Tenant Isolation (IDOR) | **PASSED** | All queries strictly scoped by `req.user._id` |
| Password Storage | **PASSED** | Bcrypt 12 rounds with automatic JSON redaction |
| Input Validation | **PASSED** | express-validator with upper and lower numeric bounds |
| Rate Limiting | **PASSED** | Tiered rate limiting across auth, api, and admin routes |
| Transport Security | **CONDITIONALLY PASSED** | Requires SSL/TLS certificate termination on Nginx/Cloudflare |

**Security Verdict:** **CONDITIONALLY READY FOR STAGING**
