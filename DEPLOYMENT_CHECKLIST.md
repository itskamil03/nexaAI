# Production Deployment & Operational Readiness Checklist: NexaChain AI

**Target Platform:** NexaChain AI MERN Stack Investment and Referral Platform  
**Audit Local Timestamp:** 2026-10-31T12:15:00+05:30  
**Target Environment:** Staging and Production Cloud Deployments (Docker, Kubernetes, or Linux VM Cluster)  
**Status:** **CONDITIONALLY READY FOR STAGING**  

---

## 1. Prerequisites for Real-Money Production Deployment

Before transitioning the NexaChain AI platform from staging to real-money production review, every item in this checklist must be satisfied and verified by the DevOps, Security, and Financial Engineering leads.

---

## 2. Infrastructure & Hosting Architecture

- [ ] **MongoDB Replica Set (Mandatory for ACID Transactions):**
  - Minimum 3-node MongoDB Replica Set (Primary, Secondary, Arbiter or Secondary).
  - Oplog sized to accommodate peak transaction throughput for at least 72 hours.
  - WiredTiger cache allocated to 50% of available RAM.
  - Encryption at rest enabled on database storage volumes.
- [ ] **Application Runtime & Process Supervision:**
  - Node.js LTS (v20.x or v22.x) running inside hardened Alpine/Debian Docker containers.
  - Process supervisor (PM2 cluster mode or Kubernetes deployment) configured with auto-restart on unhandled exceptions.
  - Resource limits: CPU requests/limits (1 core min, 2 core max per replica), Memory (1GB min, 2GB max per pod).
- [ ] **Reverse Proxy & TLS Termination:**
  - Nginx or Cloudflare ingress proxy handling edge SSL/TLS 1.3 termination.
  - HTTP Strict Transport Security (`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`) enforced.
  - Request size limits (`client_max_body_size 2M`) enforced to prevent buffer overflow attacks.
  - WebSocket/SSE buffers configured appropriately if real-time tickers are introduced.

---

## 3. Environment Variables & Secret Management

All secrets must be injected via secure secret stores (AWS Secrets Manager, HashiCorp Vault, or Kubernetes Secrets). **Never commit `.env` files to source control.**

| Variable Name | Required Production Setting | Purpose / Risk Mitigated |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Suppresses verbose error stacks, activates production optimizations |
| `PORT` | `5000` (or dynamic `$PORT`) | API listening port |
| `CLIENT_URL` | `https://app.nexachain.ai` | Restricts CORS to the official production frontend domain |
| `MONGO_URI` | `mongodb://user:pass@host1,host2/nexachain?replicaSet=rs0&ssl=true` | Authenticated, encrypted MongoDB replica set connection |
| `JWT_SECRET` | 64+ char high-entropy cryptographically random string | Prevents token forgery and authentication bypass |
| `JWT_EXPIRES_IN` | `1d` or `15m` (with refresh tokens) | Bounds window of vulnerability for compromised user tokens |
| `ADMIN_SECRET` | 64+ char secret stored in vault | Authorizes privileged administrative commands and manual ROI runs |
| `TIMEZONE` | `Asia/Kolkata` or `UTC` | Platform standard timezone for ROI date boundaries |
| `ENABLE_AUTO_ROI_CRON` | `true` | Activates daily 00:00 midnight ROI cron scheduler on worker node |

---

## 4. Payment Gateway & Real-Money Integration

> [!CAUTION]
> The current development build simulates wallet deposits directly via `POST /api/wallet/deposit`. Deploying this simulated endpoint into a production environment with real capital will permit arbitrary unbacked wallet crediting.

- [ ] **Decommission Simulated Deposit Endpoint:**
  - Restrict `POST /api/wallet/deposit` behind `NODE_ENV !== 'production'` or administrative authorization.
- [ ] **Integrate Certified Payment Gateway:**
  - Implement Stripe, Razorpay, or Crypto payment webhook endpoints.
  - Verify cryptographically signed webhook signatures (e.g., Stripe `stripe-signature` HMAC verification).
  - Credit user wallets only after confirmed payment gateway settlement events (`charge.succeeded` or `payment_intent.succeeded`).
- [ ] **Automated Withdrawal Verification:**
  - Implement maker-checker authorization workflows for withdrawal requests exceeding predefined financial limits (e.g., >$1,000).

---

## 5. Security & Network Hardening

- [ ] **IP Allowlisting for Administration:**
  - Restrict `/api/admin/*` routes at the Nginx or Cloudflare firewall layer to internal corporate VPN IP ranges.
- [ ] **DDoS & Ingress Rate Limiting:**
  - Cloudflare Web Application Firewall (WAF) enabled in front of the platform.
  - Layer-7 rate limiting rules applied at reverse proxy:
    - Auth routes (`/api/auth/*`): 10 requests / minute per IP.
    - Financial routes (`/api/investments/*`, `/api/wallet/*`): 30 requests / minute per IP.
- [ ] **Production Dependency Hygiene:**
  - Deploy using `npm ci --omit=dev` to prevent transitive devDependencies from entering production images.
  - Automated weekly dependency audit scans via Snyk or GitHub Dependabot.

---

## 6. Daily ROI Scheduler & High Availability (HA)

- [ ] **Single Active Scheduler Instance:**
  - If deploying across multiple Kubernetes pods or PM2 instances, configure `ENABLE_AUTO_ROI_CRON=true` on exactly **one** designated background worker container, or rely on the distributed `SchedulerLock` collection.
- [ ] **Distributed Lock Verification:**
  - Verify that `SchedulerLock` TTL / stale lock recovery window is set to 30 minutes.
  - Monitor `SchedulerLock` for abandoned `PROCESSING` states.
- [ ] **Scheduler Failure Notification Webhook:**
  - Configure Slack, PagerDuty, or Discord alerting in `roiScheduler.js` when a batch fails:
    ```javascript
    await sendAlertToPagerDuty({ jobName, error: err.message });
    ```

---

## 7. Financial Ledger Reconciliation & Auditing

- [ ] **Automated Nightly Reconciliation Cron:**
  - Deploy an automated nightly reconciliation script that queries every active account:
    $$\Delta = \text{User.walletBalance} - \left(\sum \text{Credits} - \sum \text{Debits}\right)$$
  - Any user account where $\Delta \neq 0$ must immediately flag an alert and temporarily lock wallet withdrawals for that account.
- [ ] **Cold Storage Backup Verification:**
  - Automated continuous backups with Point-In-Time-Recovery (PITR) enabled.
  - Daily snapshots copied to an offsite S3 bucket with Object Lock (immutability) enabled.
  - Monthly test-restore procedure to verify recovery time objective (RTO < 1 hour) and recovery point objective (RPO < 5 minutes).

---

## 8. Health Checks, Logging & Observability

- [ ] **Health Check Endpoints:**
  - Liveness probe: `GET /api/health` (returns HTTP 200 `{ status: "ok" }`).
  - Readiness probe: `GET /api/admin/system/status` with `x-admin-secret` verifying database connectivity.
- [ ] **Centralized Structured Logging:**
  - Replace `console.log` with structured JSON logging (Winston or Pino) transmitting logs to Datadog, ELK, or CloudWatch.
  - Ensure all sensitive data (passwords, JWTs, card numbers, personal emails) are sanitized from log payloads.
- [ ] **Metrics & Monitoring Alerts:**
  - Alert on HTTP 5xx error rate > 1% over 5 minutes.
  - Alert on API response latency (p95 > 500ms, p99 > 1500ms).
  - Alert on MongoDB connection pool exhaustion (>80% utilization).
  - Alert on any unhandled promise rejection or uncaught exception.

---

## 9. Rollback & Disaster Recovery Runbook

1. **Blue/Green or Canary Deployment:**
   - Deploy new backend versions alongside the running version.
   - Run smoke test suite against staging canary before shifting production traffic.
2. **Database Migration Strategy:**
   - Ensure all schema changes are backwards-compatible (expand before contract).
   - If a rollback is triggered, the previous application version must operate correctly on the existing database schema.
3. **Emergency Wallet Freeze:**
   - Administrative capability to set `User.accountStatus = 'Frozen'` globally or per account to halt all financial transactions during an incident.

---

## 10. Operational Sign-Off Form

| Milestone | Target Date | Responsible Lead | Sign-off Status |
| :--- | :--- | :--- | :--- |
| Staging Environment Deployment | Week 1 | DevOps / Platform Lead | **READY** |
| Replica Set Cluster Setup | Week 1 | Database Architect | **PENDING CONFIG** |
| Payment Gateway Integration | Week 2 | Financial Systems Engineer | **PENDING PROVIDER** |
| Business Rules Ratification | Week 2 | Corporate Product & Compliance | **PENDING LEGAL** |
| Penetration Testing Sign-off | Week 3 | Third-Party Security Auditor | **PENDING STAGING** |
| Real-Money Production Go-Live | Week 4 | Executive Committee | **PENDING PRE-REQS** |
