# Staging Deployment Guide: NexaChain AI Platform

**System:** NexaChain AI MERN Stack Investment and Referral Platform  
**Target Environment:** Staging (Pre-Production VPC / Isolated Staging Host)  
**Local Timestamp:** 2026-10-31T12:30:00+05:30  
**Status:** **READY FOR STAGING DEPLOYMENT**  

---

## 1. Staging Architecture Overview

The staging deployment provides an exact mirror of the production environment, allowing engineering and QA teams to validate multi-document ACID transactions, scheduler reliability, CORS policies, and user workflows under production-like conditions without risking customer funds.

```
       +-------------------------------------------------------------+
       |               Staging Ingress / Reverse Proxy (Nginx)       |
       |               HTTPS (TLS 1.3) Termination                   |
       +------------------------------+------------------------------+
                                      |
                     +----------------+----------------+
                     |                                 |
           [Frontend Static]                    [Backend API]
        Nginx serving /dist/               Node.js Express (Port 5000)
    https://staging.nexachain.internal   https://staging-api.nexachain.internal
                     |                                 |
                     +----------------+----------------+
                                      |
                       +--------------+--------------+
                       |   MongoDB 3-Node Replica    |
                       |   Set (rs0) - WiredTiger    |
                       |  Multi-Doc ACID Support     |
                       +-----------------------------+
```

---

## 2. Infrastructure Prerequisites

- **Host Machine / VMs:** Linux Ubuntu 22.04 LTS (or Docker Engine 24+ / Kubernetes cluster).
- **Compute Specs:** Minimum 4 vCPU, 8 GB RAM, 50 GB SSD storage.
- **Node.js:** v20.x or v22.x LTS.
- **MongoDB:** v7.0 or v8.0 configured as a 3-node Replica Set (`rs0`).
- **Domain Names / DNS:**
  - `staging.nexachain.internal` $\to$ Points to staging frontend.
  - `staging-api.nexachain.internal` $\to$ Points to staging API backend.

---

## 3. Step 1: MongoDB Replica Set Provisioning

> [!IMPORTANT]
> A MongoDB Replica Set is mandatory to support multi-document ACID transactions. Do not attempt staging certification on a standalone database node.

### Option A: Local Docker Compose Replica Set (Recommended for Staging)
Deploy a 3-node cluster using Docker Compose on the staging server:

```yaml
version: '3.8'

services:
  mongo1:
    image: mongo:8.0
    container_name: staging-mongo1
    command: ["mongod", "--replSet", "rs0", "--bind_ip_all", "--port", "27017"]
    volumes:
      - mongo1_data:/data/db
    ports:
      - "27017:27017"

  mongo2:
    image: mongo:8.0
    container_name: staging-mongo2
    command: ["mongod", "--replSet", "rs0", "--bind_ip_all", "--port", "27018"]
    volumes:
      - mongo2_data:/data/db
    ports:
      - "27018:27018"

  mongo3:
    image: mongo:8.0
    container_name: staging-mongo3
    command: ["mongod", "--replSet", "rs0", "--bind_ip_all", "--port", "27019"]
    volumes:
      - mongo3_data:/data/db
    ports:
      - "27019:27019"

volumes:
  mongo1_data:
  mongo2_data:
  mongo3_data:
```

### Option B: Initiate Replica Set
Once containers or daemon processes are running, execute in `mongosh`:

```javascript
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 2 },
    { _id: 1, host: "mongo2:27018", priority: 1 },
    { _id: 2, host: "mongo3:27019", priority: 1 }
  ]
});
```

Verify replica set status:
```bash
mongosh --eval "rs.status().ok"
# Expected output: 1
```

---

## 4. Step 2: Backend Deployment

1. **Clone repository and navigate to backend:**
   ```bash
   cd /opt/nexachain/backend
   ```
2. **Install production dependencies:**
   ```bash
   npm ci --omit=dev
   ```
3. **Configure staging `.env`:**
   Generate secrets using `openssl rand -hex 32` and populate `/opt/nexachain/backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=staging
   MONGODB_URI=mongodb://mongo1:27017,mongo2:27018,mongo3:27019/nexachain_staging?replicaSet=rs0
   JWT_SECRET=GENERATED_64_CHAR_HEX_SECRET
   JWT_EXPIRES_IN=24h
   CRON_SCHEDULE=0 0 * * *
   CRON_TIMEZONE=Asia/Kolkata
   CLIENT_URL=https://staging.nexachain.internal
   ADMIN_SECRET_KEY=GENERATED_48_CHAR_HEX_SECRET
   ```
4. **Verify Database Topology & ACID Transactions:**
   ```bash
   npm run verify:transactions
   ```
   *Expected Result:* `RESULT: FULL MULTI-DOCUMENT ACID TRANSACTIONS VERIFIED!`
5. **Start backend using PM2 process supervisor:**
   ```bash
   pm2 start src/server.js --name "nexachain-staging-api" --instances 2 --max-memory-restart 1G
   pm2 save
   ```

---

## 5. Step 3: Frontend Deployment

1. **Navigate to frontend directory:**
   ```bash
   cd /opt/nexachain/frontend
   ```
2. **Install build dependencies:**
   ```bash
   npm ci
   ```
3. **Configure staging `.env`:**
   ```env
   VITE_API_BASE_URL=https://staging-api.nexachain.internal/api
   ```
4. **Build production bundle:**
   ```bash
   npm run build
   ```
   *Artifacts are written to `/opt/nexachain/frontend/dist` with code-split chunks (`vendor`, `charts`, `icons`).*

---

## 6. Step 4: Reverse Proxy & Ingress Configuration (Nginx)

Install and configure Nginx `/etc/nginx/sites-available/nexachain-staging`:

```nginx
# Staging Frontend
server {
    listen 443 ssl http2;
    server_name staging.nexachain.internal;

    ssl_certificate /etc/ssl/certs/staging_cert.crt;
    ssl_certificate_key /etc/ssl/private/staging_key.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    root /opt/nexachain/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Staging API Gateway
server {
    listen 443 ssl http2;
    server_name staging-api.nexachain.internal;

    ssl_certificate /etc/ssl/certs/staging_cert.crt;
    ssl_certificate_key /etc/ssl/private/staging_key.key;

    # Rate limiting & security
    client_max_body_size 2M;

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 7. Step 5: Post-Deployment Verification

Execute the automated smoke test suite directly against the live staging ingress:

```bash
cd /opt/nexachain/backend
STAGING_URL=https://staging-api.nexachain.internal ADMIN_SECRET_KEY=<staging_secret> npm run test:staging
```

**Verification Success Criteria:**
1. Health check returns HTTP 200 with `database: "connected"` and `transactionsSupported: true`.
2. Sponsor registration and login succeed.
3. Insufficient balance returns HTTP 400.
4. Investment creation debits balance atomically.
5. Downline referral registration establishes Level 1 tree link.
6. Downline investment distributes 5% commission to sponsor.
7. Multi-tenant IDOR test denies access to foreign investments (HTTP 404).
8. Admin daily ROI batch succeeds on run 1, and credits 0 duplicate dollars on run 2.
9. All 12 smoke checks exit with code 0.

---

## 8. Backup and Recovery Runbook

1. **Staging Database Backup (`mongodump`):**
   ```bash
   mongodump --uri="mongodb://mongo1:27017,mongo2:27018,mongo3:27019/nexachain_staging?replicaSet=rs0" --oplog --gzip --out=/backups/$(date +%F)
   ```
2. **Point-In-Time Restoration (`mongorestore`):**
   ```bash
   mongorestore --uri="mongodb://mongo1:27017,mongo2:27018,mongo3:27019/nexachain_staging?replicaSet=rs0" --oplogReplay --gzip /backups/<backup_date>/nexachain_staging
   ```
3. **Emergency Service Freeze:**
   If a state anomaly is detected during QA testing:
   ```bash
   pm2 stop nexachain-staging-api
   ```
