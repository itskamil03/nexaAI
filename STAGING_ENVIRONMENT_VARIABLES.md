# Staging Environment Variables Specification: NexaChain AI

**System:** NexaChain AI MERN Stack Investment and Referral Platform  
**Document Type:** Environment & Secret Configuration Guide  
**Local Timestamp:** 2026-10-31T12:30:00+05:30  
**Target Environment:** Staging Deployment (Isolated Cluster / Test VPC)  

---

## 1. Security Principles for Staging Secrets

> [!CAUTION]
> **Strict Isolation Rule:** Never copy local development secrets or development `.env` files into the staging environment. Never commit `.env` files to Git. Staging must use independently generated, high-entropy cryptographic keys and isolated database credentials.

1. **Secret Generation:** All cryptographic secrets (`JWT_SECRET`, `ADMIN_SECRET_KEY`) must be generated using cryptographically secure random bytes:
   ```bash
   # Generate 64-character hex secret (32 bytes)
   openssl rand -hex 32
   ```
2. **Access Control:** Environment variables must be injected into the runtime container via secure secret managers (e.g., Kubernetes Secrets, AWS Secrets Manager, or HashiCorp Vault) rather than hardcoded in files.
3. **Database Segregation:** Staging must connect to a dedicated staging database instance (`nexachain_staging`), completely partitioned from any production or development storage.

---

## 2. Backend Environment Variables Reference

The backend runtime reads environment variables in [backend/src/config/env.js](file:///c:/Users/kamil/Desktop/CMA/backend/src/config/env.js).

| Variable Name | Type | Required? | Development Default | Staging Recommended Value | Security & Operational Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PORT` | Integer | Optional | `5000` | `5000` | HTTP listening port for Express backend. |
| `NODE_ENV` | String | **Mandatory** | `development` | `staging` | Dictates error verbosity, rate-limiting behavior, and security headers. In `staging` or `production`, internal stack traces are redacted. |
| `MONGODB_URI` | URI | **Mandatory** | `mongodb://127.0.0.1:27017/nexachain` | `mongodb://user:pass@host1:27017,host2:27017,host3:27017/nexachain_staging?replicaSet=rs0&authSource=admin` | Replica Set connection string required to enable multi-document ACID transactions. Must point to staging cluster. |
| `JWT_SECRET` | String | **Mandatory** | *(insecure dev string)* | 64+ char random hex string | HMAC-SHA256 secret key used to sign and verify user authentication tokens. |
| `JWT_EXPIRES_IN` | String | Optional | `24h` | `12h` or `24h` | Bounds the validity period of user JWTs. |
| `CRON_SCHEDULE` | String | Optional | `0 0 * * *` | `0 0 * * *` | Cron expression for automated daily ROI accrual (Midnight). |
| `CRON_TIMEZONE` | String | Optional | `Asia/Kolkata` | `Asia/Kolkata` | Reference timezone for calculating daily payout calendar boundaries. |
| `CLIENT_URL` | URL | **Mandatory** | `http://localhost:5173` | `https://staging.nexachain.internal` | Strict CORS origin allowlist. Rejects requests from unauthorized frontend domains. |
| `ADMIN_SECRET_KEY` | String | **Mandatory** | *(insecure dev string)* | 48+ char random hex string | Validates `x-admin-secret` header for privileged manual batch triggers (`POST /api/admin/roi/process`). |

---

## 3. Frontend Environment Variables Reference

The React/Vite frontend reads environment variables via Vite's `import.meta.env` system in [frontend/src/api/client.js](file:///c:/Users/kamil/Desktop/CMA/frontend/src/api/client.js).

| Variable Name | Type | Required? | Development Default | Staging Recommended Value | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | URL | **Mandatory** | `http://localhost:5000/api` | `https://staging-api.nexachain.internal/api` | Full base URL of the staging backend API gateway. Must include `/api` suffix. |

---

## 4. Template Configuration Files

Template files are maintained in the repository:
- Backend Staging Template: [backend/.env.staging.example](file:///c:/Users/kamil/Desktop/CMA/backend/.env.staging.example)
- Frontend Staging Template: [frontend/.env.staging.example](file:///c:/Users/kamil/Desktop/CMA/frontend/.env.staging.example)

### Backend Staging File Example (`backend/.env` on Staging Server)
```env
PORT=5000
NODE_ENV=staging
MONGODB_URI=mongodb://staging_app:SecureReplPass2026!@mongo1.internal:27017,mongo2.internal:27017,mongo3.internal:27017/nexachain_staging?replicaSet=rs0&authSource=admin&ssl=false
JWT_SECRET=e7b4c91a3f6289d045c71b3e82a5f01948d7c2b5e6a103f9c8d7e6a5b4c3d2e1
JWT_EXPIRES_IN=24h
CRON_SCHEDULE=0 0 * * *
CRON_TIMEZONE=Asia/Kolkata
CLIENT_URL=https://staging.nexachain.internal
ADMIN_SECRET_KEY=94c8b21f7d0e3a65c8e19b4a72d0f3c6e9a1b8d5e2c7f0a3
```

### Frontend Staging File Example (`frontend/.env` on Staging Build Server)
```env
VITE_API_BASE_URL=https://staging-api.nexachain.internal/api
```

---

## 5. Verification Checklist

Before booting staging containers:
- [ ] Ensure `NODE_ENV` is explicitly set to `staging`.
- [ ] Confirm `MONGODB_URI` contains `replicaSet=` parameter and points to `nexachain_staging`.
- [ ] Confirm `JWT_SECRET` does not match development secret (`nexachain_super_secure_jwt_secret_key_...`).
- [ ] Confirm `ADMIN_SECRET_KEY` does not match development key (`nexachain_admin_secret_cron_...`).
- [ ] Confirm `CLIENT_URL` matches the staging frontend domain with HTTPS.
- [ ] Execute `node scripts/verify_transactions.js` on staging backend to confirm Replica Set connection and ACID transaction support.
