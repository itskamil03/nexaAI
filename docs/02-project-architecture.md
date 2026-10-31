# NexaChain AI — Project Architecture & System Design

## 1. System Architecture Overview

The NexaChain AI platform implements a multi-tiered architecture adhering to separation of concerns, defensive programming, and strict transactional isolation.

```mermaid
graph TD
    subgraph Client Tier ["Client Tier (React 18 + Vite + Tailwind CSS)"]
        UI[Tailwind UI / Dashboard]
        Router[React Router v6]
        AuthCtx[Auth & Session Context]
        ApiClient[Axios Client with Bearer Interceptor]
        Charts[Recharts Visualization]
        TreeUI[Nested Referral Hierarchy Viewer]
    end

    subgraph Gateway ["Express 4 API Gateway & Security"]
        MW_Cors[CORS & Helmet Security Headers]
        MW_RateLimit[Express Rate Limiter]
        MW_Auth[JWT Verification Middleware]
        MW_Validator[Express Validator Middleware]
        ErrorHandler[Centralized Global Error Handler]
    end

    subgraph Logic Tier ["Service & Business Logic Tier"]
        AuthSvc[Authentication Service]
        InvSvc[Investment Service]
        RoiSvc[ROI Processing Service]
        RefSvc[Referral Distribution Service]
        DashSvc[Dashboard Metrics Aggregator]
        CronJob[Node-Cron Scheduler (12:00 AM)]
    end

    subgraph Data Tier ["Data Tier (MongoDB v8.0 + Mongoose)"]
        M_User[(Users Collection)]
        M_Inv[(Investments Collection)]
        M_Roi[(RoiHistory Collection)]
        M_Ref[(ReferralIncome Collection)]
        M_Ledger[(WalletTransactions Collection)]
        M_Lock[(JobLocks Collection)]
    end

    UI --> Router
    Router --> AuthCtx
    AuthCtx --> ApiClient
    ApiClient --> MW_Cors
    MW_Cors --> MW_RateLimit
    MW_RateLimit --> MW_Validator
    MW_Validator --> MW_Auth
    MW_Auth --> AuthSvc & InvSvc & RoiSvc & RefSvc & DashSvc
    CronJob --> RoiSvc
    AuthSvc --> M_User
    InvSvc --> M_Inv & M_Ledger & M_User & RefSvc
    RoiSvc --> M_Roi & M_Ledger & M_User & M_Lock
    RefSvc --> M_Ref & M_Ledger & M_User
    DashSvc --> M_User & M_Inv & M_Roi & M_Ref
```

---

## 2. Backend Architecture Layers

The backend follows an enterprise layered architecture:
```
backend/
├── src/
│   ├── config/          # Environment validation, MongoDB connection, system constants
│   ├── controllers/     # HTTP request/response handlers, status code mapping
│   ├── jobs/            # Node-cron scheduler & distributed lock management
│   ├── middleware/      # JWT auth, error handlers, rate limiting, request loggers
│   ├── models/          # Mongoose schemas with compound indexes & validations
│   ├── routes/          # Express route definitions grouped by domain
│   ├── services/        # Authoritative business logic, financial calculations, transactions
│   ├── utils/           # Math precision helpers, date normalizers, response wrappers
│   ├── validators/      # Express-validator schemas
│   ├── app.js           # Express application configuration & middleware assembly
│   └── server.js        # Server listener, database connection lifecycle
├── tests/               # Unit, integration, and scenario tests
├── .env.example         # Environment template
└── package.json         # Scripts and dependencies
```

### Layer Responsibilities
1. **Routes (`/routes`)**: Pure URL routing and middleware chaining. No business logic.
2. **Controllers (`/controllers`)**: Parse parameters, invoke service methods, format standardized JSON envelopes using `sendSuccess` or `sendError`.
3. **Services (`/services`)**: Business rules, database operations, idempotency validations, balance computations, and transaction boundaries.
4. **Models (`/models`)**: Database schema constraints, index definitions, and schema hooks.
5. **Jobs (`/jobs`)**: Scheduled automation isolated from HTTP request lifecycles.

---

## 3. Frontend Architecture

The client is a single-page application (SPA) created with Vite and React:
```
frontend/
├── src/
│   ├── api/             # Axios instances and endpoint-specific API client functions
│   ├── components/      # Reusable UI widgets (Cards, Tables, Modals, Badges, Skeletons)
│   ├── context/         # AuthContext (JWT storage, login, logout, current user state)
│   ├── hooks/           # Custom React hooks (useDashboard, useInvestments, etc.)
│   ├── layouts/         # DashboardLayout (Sidebar, TopBar, Mobile Nav)
│   ├── pages/           # Page views: Dashboard, Investments, Referrals, ROI History, Auth
│   ├── utils/           # Formatters (currency, date, percentage), error handlers
│   ├── App.jsx          # Route definitions and protected route wrappers
│   ├── index.css        # Tailwind directives and custom animation styles
│   └── main.jsx         # React DOM root mounting
├── index.html           # Document head with typography and SEO meta tags
├── tailwind.config.js   # Tailwind custom theme (palette, shadows, animations)
├── vite.config.js       # Vite development and build settings
└── package.json
```

---

## 4. Financial Consistency & Idempotency Design

### Deterministic Monetary Precision
JavaScript IEEE 754 floating-point operations can introduce rounding errors (e.g., `0.1 + 0.2 = 0.30000000000000004`). All calculations use fixed-precision decimal arithmetic via an internal utility:
$$\text{roundTo2Decimals}(v) = \frac{\text{Math.round}((v + \epsilon) \times 100)}{100}$$

### Idempotency Keys
1. **ROI Credit**:
   $$\text{Key} = \text{roi}:\langle\text{investmentId}\rangle:\langle\text{YYYY-MM-DD}\rangle$$
   Guaranteed unique in `RoiHistory` via compound index `{ investmentId: 1, date: 1 }` and in `WalletTransaction` via `idempotencyKey: 1`.
2. **Referral Credit**:
   $$\text{Key} = \text{ref}:\langle\text{investmentId}\rangle:\text{L}\langle\text{level}\rangle:\langle\text{beneficiaryId}\rangle$$
   Guaranteed unique in `ReferralIncome` via compound index `{ sourceEventId: 1, level: 1, userId: 1 }` and in `WalletTransaction`.

### Distributed Cron Locking
A dedicated MongoDB collection `JobLocks` enforces that only one scheduler worker can execute a specific day's batch. A document `{ _id: "daily_roi_YYYY-MM-DD", status: "PROCESSING", acquiredAt: Date }` is inserted atomically with upsert constraints to prevent concurrent or overlapping executions.
