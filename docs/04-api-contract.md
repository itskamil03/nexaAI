# NexaChain AI — API Contract & Endpoint Specification

## 1. Global Conventions

### Base URL
All application endpoints are served under:
```
http://localhost:5000/api
```

### Standard Response Envelope

#### Success (200, 201)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### Error (400, 401, 403, 404, 409, 422, 500)
```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": [
    {
      "field": "email",
      "message": "Valid email address is required"
    }
  ]
}
```

### Authentication Header
Protected endpoints require an `Authorization` header containing the JWT Bearer token:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 2. Authentication Endpoints

### 2.1 Register User
- **Method / Path**: `POST /api/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "mobileNumber": "+919876543210",
  "password": "Password@123",
  "referralCode": "NEXA8192" // Optional: parent's code
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "67234a...",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "mobileNumber": "+919876543210",
      "referralCode": "NEXAJANE",
      "referredBy": "672340...",
      "walletBalance": 0.00,
      "totalRoiEarned": 0.00,
      "totalLevelIncomeEarned": 0.00,
      "accountStatus": "Active"
    },
    "token": "eyJhbGciOiJIUzI1Ni..."
  }
}
```

### 2.2 Login User
- **Method / Path**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "Password@123"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1Ni..."
  }
}
```

### 2.3 Get Current User Profile
- **Method / Path**: `GET /api/auth/me`
- **Access**: Private (Bearer JWT)
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "67234a...",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "referralCode": "NEXAJANE",
      "walletBalance": 250.00,
      "totalRoiEarned": 150.00,
      "totalLevelIncomeEarned": 100.00
    }
  }
}
```

---

## 3. Investment Endpoints

### 3.1 Get Available Investment Plans
- **Method / Path**: `GET /api/investments/plans`
- **Access**: Public / Authenticated
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "planId": "starter",
        "name": "Starter AI Yield",
        "minAmount": 100,
        "maxAmount": 1000,
        "dailyRoiPercentage": 1.0,
        "durationDays": 30,
        "description": "Stable AI algorithmic arbitrage trading."
      },
      {
        "planId": "growth",
        "name": "Growth Neural Vault",
        "minAmount": 1001,
        "maxAmount": 5000,
        "dailyRoiPercentage": 1.5,
        "durationDays": 60,
        "description": "Automated liquidity and neural flash farming."
      },
      {
        "planId": "enterprise",
        "name": "Enterprise Quantum",
        "minAmount": 5001,
        "maxAmount": 50000,
        "dailyRoiPercentage": 2.0,
        "durationDays": 90,
        "description": "High-frequency cross-chain algorithmic yield."
      }
    ]
  }
}
```

### 3.2 Create New Investment
- **Method / Path**: `POST /api/investments`
- **Access**: Private
- **Request Body**:
```json
{
  "planId": "growth",
  "amount": 2000
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Investment created and activated successfully",
  "data": {
    "investment": {
      "id": "67239f...",
      "userId": "67234a...",
      "amount": 2000,
      "planDetails": {
        "planId": "growth",
        "planName": "Growth Neural Vault",
        "durationDays": 60,
        "minAmount": 1001,
        "maxAmount": 5000
      },
      "dailyRoiPercentage": 1.5,
      "startDate": "2026-10-31T11:00:00.000Z",
      "endDate": "2026-12-30T11:00:00.000Z",
      "status": "Active"
    },
    "walletBalance": 500.00
  }
}
```

### 3.3 List User Investments
- **Method / Path**: `GET /api/investments`
- **Access**: Private
- **Query Params**: `status` (optional: Active, Completed, Cancelled), `page`, `limit`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "investments": [ ... ],
    "totalCount": 3,
    "activeAmount": 3500.00
  }
}
```

---

## 4. Dashboard Summary Endpoint

### 4.1 Get Dashboard Metrics
- **Method / Path**: `GET /api/dashboard/summary`
- **Access**: Private
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalInvestments": 5000.00,
      "dailyExpectedRoi": 75.00,
      "todayRoiEarned": 75.00,
      "totalRoiEarned": 450.00,
      "totalLevelIncomeEarned": 250.00,
      "walletBalance": 1200.00,
      "activeInvestmentsCount": 2,
      "directReferralsCount": 4
    },
    "recentRoiHistory": [ ... ],
    "recentReferralIncome": [ ... ],
    "earningsChartData": [
      { "date": "2026-10-25", "roi": 50, "referral": 25, "total": 75 },
      { "date": "2026-10-26", "roi": 75, "referral": 50, "total": 125 }
    ]
  }
}
```

---

## 5. Referral Endpoints

### 5.1 Fetch Direct Referrals (Level 1)
- **Method / Path**: `GET /api/referrals/direct`
- **Access**: Private
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "directReferrals": [
      {
        "id": "672381...",
        "fullName": "Alice Smith",
        "email": "alice@example.com",
        "joinedAt": "2026-10-28T14:22:00.000Z",
        "accountStatus": "Active",
        "totalInvested": 1500.00,
        "commissionGenerated": 75.00
      }
    ],
    "count": 1
  }
}
```

### 5.2 Fetch Complete Referral Tree
- **Method / Path**: `GET /api/referrals/tree`
- **Access**: Private
- **Query Params**: `maxDepth` (default: 3)
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "tree": {
      "id": "67234a...",
      "fullName": "Jane Doe",
      "referralCode": "NEXAJANE",
      "level": 0,
      "children": [
        {
          "id": "672381...",
          "fullName": "Alice Smith",
          "referralCode": "NEXAALICE",
          "level": 1,
          "joinedAt": "2026-10-28T14:22:00.000Z",
          "totalInvested": 1500.00,
          "children": [
            {
              "id": "672399...",
              "fullName": "Bob Martin",
              "referralCode": "NEXABOBM",
              "level": 2,
              "joinedAt": "2026-10-29T10:00:00.000Z",
              "totalInvested": 1000.00,
              "children": []
            }
          ]
        }
      ]
    }
  }
}
```

### 5.3 Fetch Referral Income History
- **Method / Path**: `GET /api/referrals/income`
- **Access**: Private
- **Query Params**: `page`, `limit`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "6723a1...",
        "sourceUser": {
          "id": "672381...",
          "fullName": "Alice Smith"
        },
        "level": 1,
        "commissionPercentage": 5.0,
        "incomeAmount": 75.00,
        "date": "2026-10-28T14:22:10.000Z",
        "status": "Credited"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1 }
  }
}
```

---

## 6. ROI History & Wallet Endpoints

### 6.1 Get ROI History
- **Method / Path**: `GET /api/roi/history`
- **Access**: Private
- **Query Params**: `page`, `limit`, `startDate`, `endDate`
- **Response (200 OK)**: Returns paginated `RoiHistory` records.

### 6.2 Get Wallet Transaction Ledger
- **Method / Path**: `GET /api/wallet/transactions`
- **Access**: Private
- **Query Params**: `page`, `limit`, `type`
- **Response (200 OK)**: Returns full audit trail of credits and debits.

### 6.3 Simulate Wallet Deposit (Testing / Demo Funding)
- **Method / Path**: `POST /api/wallet/deposit`
- **Access**: Private
- **Request Body**:
```json
{
  "amount": 5000,
  "note": "Initial test capital funding"
}
```
- **Response (200 OK)**: Credits user wallet and logs `WALLET_DEPOSIT` ledger entry.

---

## 7. Administrative & Scheduler Operations

### 7.1 Manual ROI Processing Trigger (Admin / Cron Test)
- **Method / Path**: `POST /api/admin/roi/process`
- **Access**: Private (Protected via Secret Header or Admin Role)
- **Request Body**:
```json
{
  "processingDate": "2026-10-31" // Optional, defaults to current normalized date
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Daily ROI processed successfully",
  "data": {
    "date": "2026-10-31",
    "totalActiveInvestments": 12,
    "processedCount": 12,
    "skippedCount": 0,
    "totalRoiAmount": 284.50,
    "durationMs": 142
  }
}
```

### 7.2 System Health Check
- **Method / Path**: `GET /api/health`
- **Access**: Public
- **Response (200 OK)**:
```json
{
  "status": "ok",
  "uptime": 12345,
  "database": "connected",
  "timestamp": "2026-10-31T11:00:00.000Z"
}
```
