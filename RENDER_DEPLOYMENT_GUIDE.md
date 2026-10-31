# Render Deployment Guide: NexaChain AI Backend API (Staging)

**Target Service:** NexaChain AI Express.js Backend API  
**Hosting Provider:** [Render](https://render.com/)  
**Database:** MongoDB Atlas 3-Node Replica Set (`Cluster0`, GCP Mumbai `asia-south1`)  
**Deployment Blueprint:** [render.yaml](file:///c:/Users/kamil/Desktop/CMA/render.yaml)  
**Status:** **READY FOR DEPLOYMENT**  

---

## 1. Overview & Architecture

This guide details the procedure for deploying the NexaChain AI Express.js Backend to Render as a dedicated cloud Web Service for staging.

```
 [Client / Frontend] 
        | (HTTPS)
        v
 [Render Ingress: https://<service-name>.onrender.com]
        |
        +---> GET /api/health (Readiness Probe)
        +---> POST /api/auth/register
        +---> POST /api/investments (Multi-Doc ACID Transaction)
        +---> POST /api/admin/roi/process (Protected by x-admin-secret)
        |
        v (TLS / Encrypted)
 [MongoDB Atlas Cloud: Cluster0 (ReplicaSetWithPrimary)]
```

---

## 2. Render Web Service Specifications

| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Name** | `nexachain-backend-staging` | Service identifier on Render |
| **Environment** | `Node` | Native Node.js runtime (v20+ LTS) |
| **Region** | `Singapore` | Closest Render region to GCP Mumbai (`asia-south1`) |
| **Branch** | `master` (or `main`) | Deploys latest committed code |
| **Root Directory** | `backend` | **Crucial:** Instructs Render to build inside the backend folder |
| **Build Command** | `npm install --production=false` | Installs dependencies |
| **Start Command** | `npm start` | Executes `node src/server.js` |
| **Health Check Path** | `/api/health` | Deep readiness check reporting database connectivity & topology |
| **Instance Type** | `Free` (or Starter) | Free tier spins down after 15 minutes of inactivity |

---

## 3. Mandatory MongoDB Atlas Pre-Requisite (Network Access)

> [!IMPORTANT]
> Render free-tier instances use dynamic outbound IP addresses. Before deploying, you must ensure MongoDB Atlas allows connections from Render:

1. Open your [MongoDB Atlas Dashboard](https://cloud.mongodb.com/).
2. In the left navigation, click **Network Access** (under **SECURITY**).
3. Click **Add IP Address**.
4. Click **ALLOW ACCESS FROM ANYWHERE** (`0.0.0.0/0`) or enter `0.0.0.0/0`.
5. Click **Confirm**. *(Status will switch from "Pending" to "Active" within 1 minute).*

---

## 4. Required Environment Variables in Render Dashboard

Configure these variables under the **Environment** tab in your Render Web Service dashboard.  
**DO NOT commit real values to source control or `render.yaml`.**

| Environment Variable | Required Staging Value | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `staging` | Suppresses verbose error stacks; enables staging mode |
| `PORT` | `10000` | Port assigned by Render (automatically injected if omitted) |
| `MONGODB_URI` | `mongodb+srv://kamil0012:<PASSWORD>@cluster0.vkqmpeu.mongodb.net/cma?retryWrites=true&w=majority` | Your verified MongoDB Atlas connection string |
| `JWT_SECRET` | *(64-char random hex string)* | Signs & verifies user session JWTs |
| `JWT_EXPIRES_IN` | `24h` | Token expiration period |
| `ADMIN_SECRET_KEY` | *(48-char random hex string)* | Authenticates `x-admin-secret` for batch triggers |
| `CRON_SCHEDULE` | `0 0 * * *` | Daily midnight ROI payout trigger |
| `CRON_TIMEZONE` | `Asia/Kolkata` | Standard calendar boundary timezone |
| `CLIENT_URL` | `http://localhost:5173,http://localhost:5174` | Allowed origins for CORS (update with frontend URL once deployed) |

*Tip: You can generate high-entropy secrets locally in PowerShell:*
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 5. Step-by-Step Manual Deployment Procedure

### Method A: Connect Existing GitHub Repository (Recommended)

1. **Commit and Push your latest local repository to GitHub:**
   ```bash
   git push origin master
   ```
2. **Log into [Render Dashboard](https://dashboard.render.com/):**
   - Click the **New +** button in the top navigation.
   - Select **Web Service**.
3. **Connect Repository:**
   - Choose your GitHub repository (`CMA` or `nexachain`).
   - If prompted, grant Render access to your repository.
4. **Configure the Service:**
   - **Name:** `nexachain-backend-staging`
   - **Region:** `Singapore`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install --production=false`
   - **Start Command:** `npm start`
5. **Add Environment Variables:**
   - Scroll down to the **Environment Variables** section.
   - Add the 9 keys listed in Section 4 above with your actual values.
6. **Set Health Check Path:**
   - Click **Advanced**.
   - Under **Health Check Path**, enter: `/api/health`
7. **Deploy:**
   - Click **Create Web Service**.
   - Render will pull your repository, execute `npm install`, start `node src/server.js`, probe `/api/health`, and publish your service.

---

### Method B: Using Render Blueprint (`render.yaml`)

1. Ensure [render.yaml](file:///c:/Users/kamil/Desktop/CMA/render.yaml) is committed to the root of your repository.
2. In the Render Dashboard, click **New +** $\to$ **Blueprint**.
3. Select your repository.
4. Render will parse `render.yaml` and prompt you to input the secret `MONGODB_URI`.
5. Click **Apply** to deploy.

---

## 6. Post-Deployment Verification Protocol

Once Render completes the build, your service will receive a public URL (e.g., `https://nexachain-backend-staging.onrender.com`).

### 1. Test Public Health & Readiness
Execute in your terminal or browser:
```bash
curl -s https://<your-service-name>.onrender.com/api/health
```
**Expected Response (HTTP 200 OK):**
```json
{
  "status": "ok",
  "service": "nexachain-backend",
  "database": "connected",
  "databaseTopology": "ReplicaSetWithPrimary",
  "transactionsSupported": true,
  "uptime": 12,
  "environment": "staging"
}
```

### 2. Run Automated 12-Check Smoke Test Suite Against Render
Execute the platform smoke test against the live public URL:
```bash
cd backend
$env:STAGING_URL="https://<your-service-name>.onrender.com"
$env:ADMIN_SECRET_KEY="<your_admin_secret_key>"
npm run test:staging
```
**Success Criteria:**
- All 12 checks pass (Health, Auth, Investment, Debit, Ledger, Referral Tree, Commission, IDOR, ROI Idempotency).

---

## 7. Operational Notes for Render Free Tier

- **Cold Starts:** On Render's Free tier, the service spins down after 15 minutes of inactivity. When a new request arrives, it may take 30 to 50 seconds to boot up. The deep `/api/health` check keeps connections warm if pinged periodically (e.g., via UptimeRobot or Cron monitoring).
- **Scheduler Continuity:** For production 24/7 background cron execution without spin-down, upgrade to a Render "Starter" instance ($7/month) or use an external cron webhook pinger to trigger `POST /api/admin/roi/process`.
