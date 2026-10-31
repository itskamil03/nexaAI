# NexaChain AI — Comprehensive Project Master Plan

## 1. Project Identification
- **Project**: NexaChain AI Investment & Referral Platform
- **Assessment**: MERN Stack Developer Technical Assessment
- **Company**: NexaChain AI (Eco Space, Business Tower, Newtown, Kolkata, West Bengal, India)
- **Tech Stack**: MongoDB (Mongoose), Express.js, React.js (Vite + Tailwind CSS), Node.js, node-cron

---

## 2. Core Assessment Tasks Mapping

| Assessment Task | Description | Implementation Module | Deliverable |
|---|---|---|---|
| **Task 1: Database Schema Design** | User, Investment, ReferralIncome, RoiHistory schemas with relationships and compound indexes. | `backend/src/models/` | Mongoose models with validation, compound unique indexes, and audit ledger. |
| **Task 2: API Development** | Auth (Register/Login/JWT), Investments (Create/View), Dashboard Summary, Referral (Direct/Tree). | `backend/src/routes/` & `controllers/` | Secure REST endpoints with validation, JWT protection, and error envelopes. |
| **Task 3: Business Logic** | Daily ROI calculation & balance updates; multi-tier referral traversal and commission distribution. | `backend/src/services/` | Reusable, transactional, idempotent service functions (`roiService.js`, `referralService.js`). |
| **Task 4: React Dashboard** | KPI Cards, Tables (Investment, ROI, Referral), Nested Referral Tree, Recharts analytics, loading/error states. | `frontend/src/` | Responsive React + Tailwind dashboard communicating with live backend. |
| **Task 5: Cron Job / Scheduler** | Automated daily scheduler at 12:00 AM (Asia/Kolkata) using node-cron with strict idempotency safeguards. | `backend/src/jobs/` | Resilient cron service with distributed database locking. |

---

## 3. Implementation Phases Summary
- **Phase 1: Project Foundation** — Configuration, directory standardization, Express server, database connectivity, health route, frontend scaffolding.
- **Phase 2: Database Models** — 5 core Mongoose schemas with compound unique indexes and validation.
- **Phase 3: Authentication & Security** — JWT auth, bcryptjs password encryption, rate limiting, helmet, input validation.
- **Phase 4: Investment & Dashboard APIs** — All RESTful endpoints, summary metrics, direct referrals, and hierarchical tree.
- **Phase 5: Daily ROI Business Logic** — Modular ROI calculation service, date normalization, atomic updates, duplicate prevention.
- **Phase 6: Referral Income Distribution** — Multi-tier upline traversal (Levels 1-3), commission computation, atomic ledger writes.
- **Phase 7: Cron Scheduler** — `node-cron` scheduled at 12:00 AM with database-backed execution lock and manual trigger endpoint.
- **Phase 8: React Dashboard** — High-aesthetic Tailwind UI, KPI cards, Recharts visualizations, interactive tables, and nested tree view.
- **Phase 9: Quality Assurance & Integration** — Automated test suite covering mandatory financial scenarios (Scenarios A through G).
- **Phase 10: Documentation & Final Submission** — Postman collection, README, and final compliance report.

---

## 4. Architectural Rules & Financial Principles
1. **Separation of Concerns**: Controllers only handle HTTP; business logic is encapsulated in reusable service layers.
2. **Idempotency**: All financial credits are backed by deterministic compound unique keys in MongoDB. Repeated runs never result in duplicate payouts.
3. **Monetary Precision**: All currency math uses fixed 2-decimal rounded precision to prevent IEEE 754 floating-point drift.
4. **Zero Client-Side Financial Calculation**: The backend is the single source of truth for all wallet balances, earnings, and summaries.
