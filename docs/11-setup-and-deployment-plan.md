# NexaChain AI — Setup, Execution & Deployment Plan

## 1. System Requirements & Prerequisites
- **Node.js**: v18.0.0 or higher (v24.18.0 verified on current host)
- **npm**: v9.0.0 or higher (v9.9.4 verified on current host)
- **MongoDB**: v6.0 or higher (v8.0.8 verified on local host at `mongodb://127.0.0.1:27017/nexachain`)
- **Git**: Installed and initialized

---

## 2. Environment Configuration

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/nexachain
JWT_SECRET=nexachain_super_secret_jwt_key_2026_finance_secure
JWT_EXPIRES_IN=24h
CRON_SCHEDULE=0 0 * * *
CRON_TIMEZONE=Asia/Kolkata
CLIENT_URL=http://localhost:5173
ADMIN_SECRET_KEY=nexachain_admin_secret_cron_override_key
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 3. Step-by-Step Local Setup & Execution

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2: Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### Step 3: Run the Development Servers
In two separate terminal windows:
```bash
# Terminal 1: Backend API & Scheduler
cd backend
npm run dev

# Terminal 2: Frontend Vite Dashboard
cd frontend
npm run dev
```

The Backend server will listen on `http://localhost:5000`.
The Frontend dashboard will be accessible at `http://localhost:5173`.

---

## 4. Automated Testing Commands
```bash
# Run backend test suite
cd backend
npm test

# Run financial scenarios specifically
npm test -- tests/scenarios/financialScenarios.test.js
```
