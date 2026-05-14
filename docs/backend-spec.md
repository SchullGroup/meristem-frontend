# MRPSL CPA — Backend Specification

**Meristem Registrars & Probate Services Limited**
**Core Processing Application**

> **Version:** 1.0 — May 2026
> **Scope:** Authentication · Setup Module · Offers Administration
> *Additional modules (Certificates, Dividends, KYC, etc.) will be appended as the project progresses.*

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema](#2-database-schema)
3. [Authentication & Session Management](#3-authentication--session-management)
4. [Setup Module](#4-setup-module)
   - 4.1 Principals
   - 4.2 Registers
   - 4.3 Roles & Permissions
   - 4.4 Users
   - 4.5 Agents
   - 4.6 System Parameters
5. [Offers Administration Module](#5-offers-administration-module)
   - 5.1 IPO / Public Offer
   - 5.2 Rights Issue
   - 5.3 Bonus Issue
6. [Approval Engine](#6-approval-engine)
7. [Audit Log](#7-audit-log)
8. [API Conventions](#8-api-conventions)
9. [Error Codes](#9-error-codes)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              Next.js Frontend (App Router)       │
│              mrpsl-cpa.meristemregistrars.com    │
└────────────────────┬────────────────────────────┘
                     │ HTTPS / REST + JSON
                     │
┌────────────────────▼────────────────────────────┐
│              API Gateway / Load Balancer         │
│              (Nginx or AWS ALB)                  │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│              Backend API (Node.js / NestJS       │
│              or Django REST Framework)           │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Auth    │ │  Setup   │ │  Offers          │ │
│  │  Service │ │  Service │ │  Service         │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Approval │ │  Audit   │ │  Notification    │ │
│  │  Engine  │ │  Logger  │ │  Service (Email) │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──┐  ┌──────▼───┐  ┌───▼──────────────┐
│PostgreSQL│  │  Redis   │  │  File Storage    │
│(Primary) │  │(Sessions │  │  (S3 / Azure     │
│          │  │ + Cache) │  │   Blob)          │
└──────────┘  └──────────┘  └──────────────────┘
```

### Technology Recommendations

| Layer | Recommendation |
|---|---|
| API Framework | NestJS (TypeScript) or Django REST Framework |
| Database | PostgreSQL 15+ |
| Session / Cache | Redis 7+ |
| ORM | Prisma (NestJS) or Django ORM |
| Auth | JWT (access + refresh tokens) + TOTP 2FA |
| File uploads | Multer → AWS S3 / Azure Blob |
| Email | SendGrid or AWS SES |
| Background jobs | BullMQ (Redis-backed) |

---

## 2. Database Schema

> All tables use `UUID` primary keys. Timestamps are stored in `UTC`. Soft-delete is preferred over hard-delete for all financial records.

---

### 2.1 `users`

```sql
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name        VARCHAR(100)  NOT NULL,
  last_name         VARCHAR(100)  NOT NULL,
  email             VARCHAR(255)  NOT NULL UNIQUE,
  phone             VARCHAR(20),
  password_hash     TEXT          NOT NULL,
  role              user_role_enum NOT NULL,
  secondary_role    user_role_enum,
  department        VARCHAR(100),
  cert_limit        NUMERIC(18,2) NOT NULL DEFAULT 0,
  div_limit         NUMERIC(18,2) NOT NULL DEFAULT 0,
  status            VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE'
                      CHECK (status IN ('ACTIVE','INACTIVE')),
  two_fa_enabled    BOOLEAN       NOT NULL DEFAULT FALSE,
  two_fa_secret     TEXT,                          -- encrypted TOTP secret
  last_login        TIMESTAMPTZ,
  password_reset_token       TEXT,
  password_reset_token_expiry TIMESTAMPTZ,
  failed_login_attempts      SMALLINT NOT NULL DEFAULT 0,
  locked_until               TIMESTAMPTZ,
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TYPE user_role_enum AS ENUM (
  'SYSTEM_ADMIN',
  'OPS_MANAGER',
  'DIV_INITIATOR',
  'DIV_AUTHORIZER',
  'CERT_INITIATOR',
  'CERT_AUTHORIZER',
  'ICU',
  'HEAD_OPS',
  'ACCOUNTS',
  'IT',
  'MANAGEMENT',
  'AUDIT_REVIEWER',
  'ENQUIRY_ONLY'
);
```

---

### 2.2 `principals`

```sql
CREATE TABLE principals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                VARCHAR(255) NOT NULL,
  billing_category    CHAR(1)      NOT NULL CHECK (billing_category IN ('A','B','C')),
  address             TEXT         NOT NULL,
  email               VARCHAR(255) NOT NULL,
  phone               VARCHAR(20)  NOT NULL,
  tin                 VARCHAR(50),                 -- Tax Identification Number
  rc_number           VARCHAR(50),                 -- CAC Registration Number
  sector              VARCHAR(100) NOT NULL,
  company_secretary   VARCHAR(255),
  company_secretary_phone VARCHAR(20),
  shareholders_at_setup   INTEGER  NOT NULL DEFAULT 0,
  date_listed         DATE,
  status              VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE','INACTIVE')),
  created_by          UUID         REFERENCES users(id),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

**Business rules:**
- A principal cannot be deactivated if it has at least one register with status `ACTIVE`.
- `billing_category` determines the fee tier charged to the principal.

---

### 2.3 `registers`

```sql
CREATE TABLE registers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_id          UUID         NOT NULL REFERENCES principals(id),
  name                  VARCHAR(255) NOT NULL,
  register_type         VARCHAR(20)  NOT NULL
                          CHECK (register_type IN ('ORDINARY','PREFERENCE','BOND','FUND')),
  symbol                VARCHAR(20)  NOT NULL UNIQUE,
  nominal_value         NUMERIC(10,4) NOT NULL,
  stock_at_setup        BIGINT       NOT NULL DEFAULT 0,
  stock_today           BIGINT       NOT NULL DEFAULT 0,
  shareholders_at_setup INTEGER      NOT NULL DEFAULT 0,
  shareholders_today    INTEGER      NOT NULL DEFAULT 0,
  allow_fraction        BOOLEAN      NOT NULL DEFAULT FALSE,
  decimal_places        SMALLINT     NOT NULL DEFAULT 0
                          CHECK (decimal_places IN (0,2,4)),
  closed_ended          BOOLEAN      NOT NULL DEFAULT FALSE,
  status                VARCHAR(30)  NOT NULL DEFAULT 'ACTIVE'
                          CHECK (status IN ('ACTIVE','INACTIVE','TRANSACTION_DISABLED')),
  created_by            UUID         REFERENCES users(id),
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_registers_principal ON registers(principal_id);
CREATE INDEX idx_registers_symbol    ON registers(symbol);
```

**Business rules:**
- `TRANSACTION_DISABLED` blocks all operations: dividend declarations, certificate operations, KYC updates.
- `stock_today` is a denormalised counter updated by triggers or background jobs whenever share transactions are processed.
- A register cannot be attached to an `INACTIVE` principal.

---

### 2.4 `roles`

```sql
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_built_in BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permissions (
  role_id    UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission VARCHAR(100) NOT NULL,
  PRIMARY KEY (role_id, permission)
);
```

**Built-in roles (seeded, non-deletable):**

| Role | Key Permissions |
|---|---|
| `SYSTEM_ADMIN` | All operations |
| `OPS_MANAGER` | Approve tier-2 transactions, manage users |
| `DIV_INITIATOR` | Create dividend declarations |
| `DIV_AUTHORIZER` | Approve dividend declarations |
| `CERT_INITIATOR` | Initiate certificate operations |
| `CERT_AUTHORIZER` | Approve certificate operations |
| `ICU` | Final approval on all tier-3+ transactions |
| `HEAD_OPS` | Full operational access, no system config |
| `ACCOUNTS` | View financial reports, payment processing |
| `IT` | System config, user management |
| `MANAGEMENT` | Read-only reports and dashboards |
| `AUDIT_REVIEWER` | Read-only access to audit logs |
| `ENQUIRY_ONLY` | Search shareholders and view certificates only |

---

### 2.5 `agents` and `agent_types`

```sql
CREATE TABLE agent_types (
  id        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  code      VARCHAR(50)  NOT NULL UNIQUE,   -- e.g. 'BANK', 'STOCKBROKER'
  label     VARCHAR(100) NOT NULL,
  built_in  BOOLEAN      NOT NULL DEFAULT FALSE,
  active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE agents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(255) NOT NULL,
  address          TEXT,
  agent_type_id    UUID         NOT NULL REFERENCES agent_types(id),
  agent_code       VARCHAR(50)  NOT NULL UNIQUE,
  cscs_member_code VARCHAR(50),
  status           VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                     CHECK (status IN ('ACTIVE','INACTIVE')),
  created_by       UUID         REFERENCES users(id),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE agent_signatories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  designation VARCHAR(100),
  specimen_url TEXT,              -- S3 URL to signature image
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE agent_mandates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  register_id  UUID NOT NULL REFERENCES registers(id),
  mandate_type VARCHAR(50),
  issued_date  DATE,
  expiry_date  DATE,
  status       VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 2.6 `system_parameters`

```sql
CREATE TABLE system_parameters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  param_key   VARCHAR(100) NOT NULL UNIQUE,
  param_value TEXT         NOT NULL,
  description TEXT,
  data_type   VARCHAR(20)  NOT NULL DEFAULT 'STRING'
                CHECK (data_type IN ('STRING','NUMBER','BOOLEAN','JSON')),
  updated_by  UUID         REFERENCES users(id),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

**Seeded parameters include:**

| Key | Default | Description |
|---|---|---|
| `WHT_RATE` | `0.10` | Withholding tax rate on dividends |
| `TIER2_LIMIT` | `500000` | Max gross liability for auto-approval |
| `TIER3_LIMIT` | `5000000` | Max gross for manager approval |
| `TIER4_LIMIT` | `50000000` | Max gross for ICU approval; above = Board |
| `SESSION_TIMEOUT_MINS` | `30` | Inactivity timeout for web sessions |
| `OTP_EXPIRY_SECS` | `300` | 2FA code validity |
| `MAX_LOGIN_ATTEMPTS` | `5` | Before account lockout |
| `LOCKOUT_DURATION_MINS` | `30` | Duration of login lockout |
| `CERT_NUMBERING_PREFIX` | `CERT` | Prefix for generated certificate numbers |

---

### 2.7 `offers` (Shared — IPO, Rights Issue, Bonus Issue)

```sql
CREATE TABLE offers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  register_id     UUID        NOT NULL REFERENCES registers(id),
  offer_type      VARCHAR(20) NOT NULL
                    CHECK (offer_type IN ('IPO','RIGHTS_ISSUE','BONUS_ISSUE')),
  offer_ref       VARCHAR(50) NOT NULL UNIQUE,   -- e.g. 'IPO-DANGCEM-2026-001'
  offer_name      VARCHAR(255) NOT NULL,
  issue_price     NUMERIC(10,4),                  -- NULL for bonus
  ratio_new       INTEGER,                        -- for rights/bonus: new units
  ratio_existing  INTEGER,                        -- for rights/bonus: per existing
  open_date       DATE        NOT NULL,
  close_date      DATE        NOT NULL,
  payment_deadline DATE,
  total_units_offered  BIGINT NOT NULL DEFAULT 0,
  total_units_allotted BIGINT NOT NULL DEFAULT 0,
  status          VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN (
                      'DRAFT','OPEN','SUBSCRIPTION_CLOSED',
                      'PENDING_APPROVAL','ICU_APPROVED',
                      'ALLOTMENT_PROCESSED','CLOSED','CANCELLED'
                    )),
  narrative       TEXT,
  created_by      UUID        REFERENCES users(id),
  approved_by     UUID        REFERENCES users(id),
  icu_approved_by UUID        REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_offers_register   ON offers(register_id);
CREATE INDEX idx_offers_type       ON offers(offer_type);
CREATE INDEX idx_offers_status     ON offers(status);
```

---

### 2.8 `offer_applications`

```sql
CREATE TABLE offer_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id        UUID         NOT NULL REFERENCES offers(id),
  batch_id        UUID         REFERENCES offer_batches(id),
  applicant_name  VARCHAR(255) NOT NULL,
  chn             VARCHAR(30),                    -- CSCS Holder Number
  broker_id       UUID         REFERENCES agents(id),
  bank_name       VARCHAR(100),
  bank_account    VARCHAR(20),
  units_applied   BIGINT       NOT NULL DEFAULT 0,
  amount_paid     NUMERIC(18,2) NOT NULL DEFAULT 0,
  units_allotted  BIGINT       NOT NULL DEFAULT 0,
  refund_amount   NUMERIC(18,2) NOT NULL DEFAULT 0,
  validation_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                    CHECK (validation_status IN (
                      'PENDING','APPROVED','DISAPPROVED','INVALID'
                    )),
  rejection_reason  TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_applications_offer ON offer_applications(offer_id);
CREATE INDEX idx_applications_batch ON offer_applications(batch_id);
```

---

### 2.9 `offer_batches`

```sql
CREATE TABLE offer_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id        UUID         NOT NULL REFERENCES offers(id),
  batch_ref       VARCHAR(50)  NOT NULL UNIQUE,
  batch_date      DATE         NOT NULL,
  total_records   INTEGER      NOT NULL DEFAULT 0,
  approved_count  INTEGER      NOT NULL DEFAULT 0,
  disapproved_count INTEGER    NOT NULL DEFAULT 0,
  invalid_count   INTEGER      NOT NULL DEFAULT 0,
  total_amount    NUMERIC(18,2) NOT NULL DEFAULT 0,
  file_url        TEXT,                           -- S3 URL of uploaded file
  status          VARCHAR(30)  NOT NULL DEFAULT 'UPLOADED'
                    CHECK (status IN (
                      'UPLOADED','PROCESSING','PROCESSED',
                      'PENDING_APPROVAL','APPROVED','ICU_APPROVED','REJECTED'
                    )),
  submitted_by    UUID         REFERENCES users(id),
  approved_by     UUID         REFERENCES users(id),
  icu_approved_by UUID         REFERENCES users(id),
  rejection_reason TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

---

### 2.10 `allotments`

```sql
CREATE TABLE allotments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id          UUID         NOT NULL REFERENCES offers(id),
  shareholder_id    UUID         REFERENCES shareholders(id),
  application_id    UUID         REFERENCES offer_applications(id),
  account_number    VARCHAR(50)  NOT NULL,
  units_allotted    BIGINT       NOT NULL DEFAULT 0,
  amount_paid       NUMERIC(18,2) NOT NULL DEFAULT 0,
  refund_due        NUMERIC(18,2) NOT NULL DEFAULT 0,
  certificate_id    UUID         REFERENCES certificates(id),
  allotment_status  VARCHAR(30)  NOT NULL DEFAULT 'PENDING'
                      CHECK (allotment_status IN (
                        'PENDING','PROCESSED','CERT_ISSUED','REFUND_PROCESSED'
                      )),
  processed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

---

### 2.11 `approval_items` (Shared Approval Engine)

```sql
CREATE TABLE approval_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module            VARCHAR(50)  NOT NULL,   -- 'OFFERS','DIVIDENDS','CERTIFICATES' etc.
  transaction_type  VARCHAR(50)  NOT NULL,   -- 'IPO_BATCH','RIGHTS_ALLOTMENT' etc.
  description       TEXT,
  amount            NUMERIC(18,2),
  tier              SMALLINT     CHECK (tier IN (1,2,3,4)),
  entity_id         UUID         NOT NULL,   -- ID of the target record
  entity_table      VARCHAR(100) NOT NULL,   -- Table name for the entity
  initiator_id      UUID         NOT NULL REFERENCES users(id),
  submitted_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN ('PENDING','APPROVED','REJECTED'))
);

CREATE TABLE approval_steps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_item_id UUID NOT NULL REFERENCES approval_items(id) ON DELETE CASCADE,
  step_order      SMALLINT     NOT NULL,
  required_role   user_role_enum NOT NULL,
  approver_id     UUID         REFERENCES users(id),
  decision        VARCHAR(20)  CHECK (decision IN ('APPROVED','REJECTED')),
  comment         TEXT,
  decided_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approval_items_entity   ON approval_items(entity_id);
CREATE INDEX idx_approval_items_status   ON approval_items(status);
CREATE INDEX idx_approval_steps_item     ON approval_steps(approval_item_id);
```

---

### 2.12 `audit_log`

```sql
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID         NOT NULL REFERENCES users(id),
  actor_name  VARCHAR(255) NOT NULL,
  role        user_role_enum NOT NULL,
  action      VARCHAR(100) NOT NULL,    -- e.g. 'PRINCIPAL_CREATED'
  entity_type VARCHAR(100) NOT NULL,    -- e.g. 'Principal'
  entity_id   UUID,
  before_state JSONB,
  after_state  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  timestamp   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor     ON audit_log(actor_id);
CREATE INDEX idx_audit_entity    ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp DESC);
```

---

## 3. Authentication & Session Management

### 3.1 Login Flow

```
Client                          API Server                      Redis / DB
  │                                  │                               │
  ├─── POST /auth/login ─────────────►│                               │
  │    { email, password }            │                               │
  │                                  ├── Lookup user by email ───────►│
  │                                  │◄── user record ───────────────┤
  │                                  │                               │
  │                                  ├── Verify bcrypt hash           │
  │                                  │                               │
  │                                  ├── Check: status = ACTIVE?      │
  │                                  ├── Check: locked_until passed?  │
  │                                  │                               │
  │                                  │   [Fail] increment failed_login_attempts
  │                                  │   [≥ MAX_ATTEMPTS] set locked_until
  │                                  │                               │
  │                                  │   [Pass] generate 6-digit OTP  │
  │                                  ├── Store OTP in Redis ──────────►│
  │                                  │   key: otp:{userId}            │
  │                                  │   TTL: OTP_EXPIRY_SECS         │
  │                                  │                               │
  │                                  ├── Send OTP via email/SMS       │
  │◄── 200 { requiresOtp: true, ─────┤                               │
  │         maskedEmail }            │                               │
  │                                  │                               │
  ├─── POST /auth/verify-otp ────────►│                               │
  │    { userId, otp }               │                               │
  │                                  ├── GET otp:{userId} ───────────►│
  │                                  │◄── stored OTP ────────────────┤
  │                                  │                               │
  │                                  ├── Compare OTPs (constant-time) │
  │                                  │                               │
  │                                  │   [Match] DELETE otp:{userId}  │
  │                                  ├── Generate JWT access token    │
  │                                  │   payload: { sub, role, dept } │
  │                                  │   expiry: 15 minutes           │
  │                                  │                               │
  │                                  ├── Generate refresh token       │
  │                                  │   Store in Redis + httpOnly    │
  │                                  │   cookie (7 days)              │
  │                                  │                               │
  │                                  ├── Update last_login, reset     │
  │                                  │   failed_login_attempts = 0    │
  │                                  │                               │
  │                                  ├── Write audit log entry        │
  │◄── 200 { accessToken, user } ────┤                               │
```

### 3.2 Token Refresh

```
POST /auth/refresh
Cookie: refreshToken=<token>

→ Validate refresh token in Redis
→ Issue new access token (15 min)
→ Rotate refresh token (7 days)
→ 200 { accessToken }
```

### 3.3 Forgot Password Flow

```
POST /auth/forgot-password
Body: { email }

→ Look up user by email
→ Generate secure random token (crypto.randomBytes(32))
→ Hash token, store in users.password_reset_token
→ Set users.password_reset_token_expiry = NOW() + 30 minutes
→ Email link: https://app/reset-password?token=<raw_token>
→ 200 (always — do not leak whether email exists)

POST /auth/reset-password
Body: { token, newPassword }

→ Hash the incoming token, look up matching user
→ Check token not expired
→ Validate password strength (min 8 chars, upper + lower + number + special)
→ bcrypt hash new password (rounds: 12)
→ Clear reset token fields
→ Invalidate all existing refresh tokens for this user
→ Write audit log
→ 200
```

### 3.4 API Endpoints — Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Submit email + password |
| POST | `/auth/verify-otp` | Public | Submit 2FA OTP code |
| POST | `/auth/refresh` | Cookie | Refresh access token |
| POST | `/auth/logout` | Bearer | Invalidate session |
| POST | `/auth/forgot-password` | Public | Initiate password reset |
| POST | `/auth/reset-password` | Public | Complete password reset |
| GET | `/auth/me` | Bearer | Get current user profile |

### 3.5 Security Rules

- Passwords hashed with **bcrypt** (minimum 12 rounds).
- OTP is a **6-digit numeric code**, valid for `OTP_EXPIRY_SECS` seconds (default 300).
- After `MAX_LOGIN_ATTEMPTS` consecutive failures the account is locked for `LOCKOUT_DURATION_MINS`.
- Access token expiry: **15 minutes**. Refresh token: **7 days** (stored server-side, rotated on use).
- All tokens are invalidated on password change.
- `Authorization: Bearer <accessToken>` header required on all protected routes.
- Role is embedded in the JWT; the server re-validates against the DB for sensitive operations.

---

## 4. Setup Module

### 4.1 Principals

#### API Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/setup/principals` | Any authenticated | List principals (filterable) |
| POST | `/setup/principals` | `SYSTEM_ADMIN`, `OPS_MANAGER` | Create principal |
| GET | `/setup/principals/:id` | Any authenticated | Get single principal |
| PATCH | `/setup/principals/:id` | `SYSTEM_ADMIN`, `OPS_MANAGER` | Update principal fields |
| PATCH | `/setup/principals/:id/status` | `SYSTEM_ADMIN` | Activate / deactivate |

#### `POST /setup/principals` — Request Body

```json
{
  "name": "Dangote Cement Plc",
  "billingCategory": "A",
  "address": "Union Marble House, 1 Alfred Rewane Road, Ikoyi, Lagos",
  "email": "registrars@dangcem.com",
  "phone": "+2348012345678",
  "tin": "12345678-0001",
  "rcNumber": "RC-167663",
  "sector": "Industrial Goods",
  "companySecretary": "Olakunle Alake",
  "companySecretaryPhone": "+2348087654321",
  "shareholdersAtSetup": 450000,
  "dateListed": "2010-10-26"
}
```

#### Business Rules

1. `name` must be unique.
2. A principal cannot be deactivated if **any** of its registers have `status = 'ACTIVE'`. Return `HTTP 409` with error `PRINCIPAL_HAS_ACTIVE_REGISTERS`.
3. All mutations write an audit entry.

---

### 4.2 Registers

#### API Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/setup/registers` | Any authenticated | List registers (filterable by principal, type, status) |
| POST | `/setup/registers` | `SYSTEM_ADMIN`, `OPS_MANAGER` | Create register |
| GET | `/setup/registers/:id` | Any authenticated | Get single register |
| PATCH | `/setup/registers/:id` | `SYSTEM_ADMIN`, `OPS_MANAGER` | Update register |
| PATCH | `/setup/registers/:id/lock` | `SYSTEM_ADMIN` | Toggle `TRANSACTION_DISABLED` |

#### `POST /setup/registers` — Request Body

```json
{
  "principalId": "uuid-of-principal",
  "name": "Dangote Cement Ordinary Share Register",
  "registerType": "ORDINARY",
  "symbol": "DANGCEM",
  "nominalValue": 0.50,
  "stockAtSetup": 17040507405,
  "shareholdersAtSetup": 452119,
  "allowFraction": false,
  "decimalPlaces": 0,
  "closedEnded": false
}
```

#### Business Rules

1. `symbol` must be unique across all registers.
2. `principal_id` must reference an `ACTIVE` principal.
3. Locking a register (`TRANSACTION_DISABLED`) blocks:
   - Dividend declarations
   - All certificate operations (split, transfer, consolidation, demat)
   - KYC changes
4. `stock_today` and `shareholders_today` are maintained by the system — not client-settable after initial creation.

---

### 4.3 Roles & Permissions

#### API Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/setup/roles` | `SYSTEM_ADMIN` | List all roles |
| POST | `/setup/roles` | `SYSTEM_ADMIN` | Create custom role |
| PATCH | `/setup/roles/:id` | `SYSTEM_ADMIN` | Update role (non-built-in only) |
| DELETE | `/setup/roles/:id` | `SYSTEM_ADMIN` | Delete role (non-built-in, no assigned users) |

#### Built-in Roles
Built-in roles (`is_built_in = TRUE`) cannot be deleted or renamed. Their permission sets are managed by code, not the UI.

---

### 4.4 Users

#### API Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/setup/users` | `SYSTEM_ADMIN`, `OPS_MANAGER` | List users |
| POST | `/setup/users` | `SYSTEM_ADMIN` | Create user |
| GET | `/setup/users/:id` | `SYSTEM_ADMIN`, `OPS_MANAGER` | Get user |
| PATCH | `/setup/users/:id` | `SYSTEM_ADMIN` | Update user |
| PATCH | `/setup/users/:id/status` | `SYSTEM_ADMIN` | Activate / deactivate |
| POST | `/setup/users/:id/reset-password` | `SYSTEM_ADMIN` | Trigger password reset email |
| PATCH | `/setup/users/:id/2fa` | `SYSTEM_ADMIN` | Enable / disable 2FA requirement |

#### `POST /setup/users` — Request Body

```json
{
  "firstName": "Chidinma",
  "lastName": "Nwosu",
  "email": "c.nwosu@meristemregistrars.com",
  "phone": "+2348098765432",
  "role": "DIV_INITIATOR",
  "secondaryRole": null,
  "department": "Operations",
  "certLimit": 5000000,
  "divLimit": 10000000,
  "twoFAEnabled": true
}
```

#### Business Rules

1. A new user is created with a **temporary random password**; a password-reset email is sent automatically.
2. A user cannot deactivate their own account.
3. `cert_limit` and `div_limit` define the maximum transaction value that user can initiate without triggering a higher approval tier.
4. Users assigned `ENQUIRY_ONLY` or `AUDIT_REVIEWER` cannot initiate any transactions.

---

### 4.5 Agents

#### API Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/setup/agents` | Any authenticated | List agents |
| POST | `/setup/agents` | `SYSTEM_ADMIN`, `OPS_MANAGER` | Create agent |
| PATCH | `/setup/agents/:id` | `SYSTEM_ADMIN`, `OPS_MANAGER` | Update agent |
| PATCH | `/setup/agents/:id/status` | `SYSTEM_ADMIN` | Toggle status |
| GET | `/setup/agent-types` | Any authenticated | List agent types |
| POST | `/setup/agent-types` | `SYSTEM_ADMIN` | Create custom agent type |
| PATCH | `/setup/agent-types/:id` | `SYSTEM_ADMIN` | Update agent type |
| DELETE | `/setup/agent-types/:id` | `SYSTEM_ADMIN` | Delete (non-built-in, no agents assigned) |

**Built-in agent types** (seeded, non-deletable): `BANK`, `STOCKBROKER`, `COLLECTING_AGENT`.

---

### 4.6 System Parameters

#### API Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/setup/parameters` | `SYSTEM_ADMIN` | List all parameters |
| PATCH | `/setup/parameters/:key` | `SYSTEM_ADMIN` | Update a parameter value |

All parameter changes are written to the audit log with before/after values.

---

## 5. Offers Administration Module

### 5.1 IPO / Public Offer

#### Overview

An IPO involves receiving and processing subscription applications from the public, validating them, seeking approval, computing allotments, issuing certificates, and refunding oversubscriptions.

#### Workflow

```
[1] Create Offer Record
         │
         ▼
[2] Upload Application Batch (CSV/Excel file)
    ├── File validated: headers, data types
    ├── Each row checked:
    │   ├── APPROVED  → valid CHN, name match, min. subscription met
    │   ├── DISAPPROVED → name mismatch, duplicate application
    │   └── INVALID  → below minimum, CHN not found in CSCS
    └── Batch summary generated (approved / disapproved / invalid counts)
         │
         ▼
[3] Pending Approval (Ops Manager Review)
    ├── Reviewer sees approved / disapproved / invalid lists
    ├── Can approve or reject the batch
    └── On approval → status = 'PENDING_ICU'
         │
         ▼
[4] ICU Approval
    ├── ICU officer reviews batch summary and lists
    └── On ICU approval → status = 'ICU_APPROVED'
         │
         ▼
[5] Allotment Processing
    ├── System computes allotments (proportional or full)
    ├── Refund amounts calculated for over-subscribed applicants
    └── Allotment records created
         │
         ▼
[6] Certificate / CSCS Upload
    ├── Certificates generated for allotted applicants
    ├── CSCS lodgment file generated
    └── register.stock_today updated
         │
         ▼
[7] Reports
    ├── Application Offer Report
    ├── Full Subscription List
    ├── State Summary
    ├── Range Analysis
    └── Summary Batch Report
```

#### API Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/offers/ipo` | Any authenticated | List IPO offers |
| POST | `/offers/ipo` | `OPS_MANAGER`, `SYSTEM_ADMIN` | Create new IPO offer |
| GET | `/offers/ipo/:id` | Any authenticated | Get IPO detail |
| POST | `/offers/ipo/:id/batches` | `CERT_INITIATOR`, `OPS_MANAGER` | Upload application batch |
| GET | `/offers/ipo/:id/batches` | Any authenticated | List batches for an offer |
| GET | `/offers/ipo/batches/:batchId` | Any authenticated | Get batch detail + application lists |
| POST | `/offers/ipo/batches/:batchId/approve` | `OPS_MANAGER` | Approve batch → ICU |
| POST | `/offers/ipo/batches/:batchId/reject` | `OPS_MANAGER` | Reject batch |
| POST | `/offers/ipo/batches/:batchId/icu-approve` | `ICU` | ICU final approval |
| POST | `/offers/ipo/batches/:batchId/icu-reject` | `ICU` | ICU rejection |
| POST | `/offers/ipo/:id/process-allotment` | `OPS_MANAGER` | Trigger allotment computation |
| GET | `/offers/ipo/:id/reports/:type` | Any authenticated | Download report |

#### Batch Upload File Format (CSV)

```
APPLICANT_NAME, CHN, BROKER_CODE, BANK_NAME, BANK_ACCOUNT, UNITS_APPLIED, AMOUNT_PAID
ADEBISI FUNMILAYO, C00001001EL, MRIST, GTBank, 0012345678, 50000, 2500000
```

#### Validation Rules

| Check | Pass | Fail Category |
|---|---|---|
| CHN format | 12-char alphanumeric | INVALID |
| Min subscription | amount_paid ≥ system minimum | INVALID |
| Duplicate CHN in same offer | unique | DISAPPROVED |
| Name match against CSCS | ≥ 80% match | DISAPPROVED |
| KYC complete | BVN + bank account present | DISAPPROVED |

---

### 5.2 Rights Issue

#### Overview

A rights issue gives existing shareholders the right to subscribe for additional shares in proportion to their current holdings. Processing follows a 4-stage workflow: Capture → Pending Approval → ICU Approval → Allotment.

#### Workflow

```
[1] Create Rights Issue Offer
    ├── Register, ratio (e.g. 1 new : 7 existing)
    ├── Issue price, open date, close date
    └── Status = 'DRAFT'
         │
         ▼
[2] Capture / Upload Applications
    ├── Individual entry or batch CSV upload
    ├── Each application links to a shareholder account
    ├── Entitlement = floor(holdings / ratio_existing) * ratio_new
    └── Application cannot exceed entitlement
         │
         ▼
[3] Pending Approval (Ops Manager)
    ├── Reviews application list with entitlements
    ├── Approves or rejects
    └── On approval → ICU notified
         │
         ▼
[4] ICU Approval
    └── ICU approves → status = 'ICU_APPROVED'
         │
         ▼
[5] Allotment
    ├── Units allotted = units accepted
    ├── New certificates generated
    ├── register.stock_today += total units allotted
    ├── Shareholder holdings updated
    ├── Sticky label file generated (PDF)
    ├── Shareholder notification emails sent
    └── Status = 'ALLOTMENT_PROCESSED'
```

#### API Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/offers/rights-issue` | Any authenticated | List rights issue offers |
| POST | `/offers/rights-issue` | `OPS_MANAGER`, `SYSTEM_ADMIN` | Create offer |
| GET | `/offers/rights-issue/:id` | Any authenticated | Get offer detail |
| POST | `/offers/rights-issue/:id/applications` | `CERT_INITIATOR` | Add / upload applications |
| GET | `/offers/rights-issue/:id/applications` | Any authenticated | List applications |
| PATCH | `/offers/rights-issue/:id/applications/:appId` | `CERT_INITIATOR` | Update single application |
| POST | `/offers/rights-issue/:id/submit-approval` | `OPS_MANAGER` | Submit for approval |
| POST | `/offers/rights-issue/:id/approve` | `OPS_MANAGER` | Approve → ICU |
| POST | `/offers/rights-issue/:id/reject` | `OPS_MANAGER` | Reject batch |
| POST | `/offers/rights-issue/:id/icu-approve` | `ICU` | ICU approval |
| POST | `/offers/rights-issue/:id/icu-reject` | `ICU` | ICU rejection |
| POST | `/offers/rights-issue/:id/process-allotment` | `OPS_MANAGER`, `ICU` | Run allotment |
| GET | `/offers/rights-issue/:id/sticky-labels` | `OPS_MANAGER` | Generate sticky labels PDF |
| POST | `/offers/rights-issue/:id/notify-shareholders` | `OPS_MANAGER` | Send email notifications |

#### Entitlement Calculation

```
entitlement_units = FLOOR(shareholder.holdings / ratio_existing) * ratio_new
entitlement_amount = entitlement_units * issue_price
```

If `register.allow_fraction = TRUE`, omit the `FLOOR()`.

---

### 5.3 Bonus Issue

#### Overview

A bonus issue (scrip issue / capitalisation issue) allocates free additional shares to existing shareholders in proportion to their holdings. No payment is required.

#### Workflow

```
[1] Create Bonus Issue Offer
    ├── Register, ratio (e.g. 1 new : 5 existing)
    ├── Qualification date (holdings snapshot date)
    └── Status = 'DRAFT'
         │
         ▼
[2] Compute Entitlements (automatic on qualification date)
    ├── Snapshot shareholder holdings as at qualification date
    ├── bonus_units = FLOOR(holdings / ratio_existing) * ratio_new
    ├── Fractional entitlements rounded down (unless allow_fraction = TRUE)
    └── Total bonus units validated against authorised share capital
         │
         ▼
[3] Pending Approval (Ops Manager)
    ├── Reviews entitlement list + total units to be issued
    └── Approves → ICU
         │
         ▼
[4] ICU Approval
    └── ICU approves → status = 'ICU_APPROVED'
         │
         ▼
[5] Allotment Processing
    ├── Holdings updated for each shareholder
    ├── New certificates generated
    ├── register.stock_today += total bonus units
    ├── Sticky labels generated (PDF)
    ├── Shareholder notification emails sent
    └── Status = 'ALLOTMENT_PROCESSED'
```

#### API Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/offers/bonus-issue` | Any authenticated | List bonus offers |
| POST | `/offers/bonus-issue` | `OPS_MANAGER`, `SYSTEM_ADMIN` | Create offer |
| GET | `/offers/bonus-issue/:id` | Any authenticated | Get offer detail |
| POST | `/offers/bonus-issue/:id/compute-entitlements` | `OPS_MANAGER` | Compute from snapshot |
| GET | `/offers/bonus-issue/:id/entitlements` | Any authenticated | List entitlements |
| POST | `/offers/bonus-issue/:id/submit-approval` | `OPS_MANAGER` | Submit for Ops Manager review |
| POST | `/offers/bonus-issue/:id/approve` | `OPS_MANAGER` | Approve → ICU |
| POST | `/offers/bonus-issue/:id/reject` | `OPS_MANAGER` | Reject |
| POST | `/offers/bonus-issue/:id/icu-approve` | `ICU` | ICU approval |
| POST | `/offers/bonus-issue/:id/icu-reject` | `ICU` | ICU rejection |
| POST | `/offers/bonus-issue/:id/process-allotment` | `OPS_MANAGER`, `ICU` | Run allotment |
| GET | `/offers/bonus-issue/:id/sticky-labels` | `OPS_MANAGER` | Download sticky labels PDF |
| POST | `/offers/bonus-issue/:id/notify-shareholders` | `OPS_MANAGER` | Send email notifications |

#### Bonus Entitlement Calculation

```
bonus_units = FLOOR(holdings_at_qualification / ratio_existing) * ratio_new

-- Total units check
SELECT SUM(bonus_units) FROM bonus_entitlements WHERE offer_id = :id;
-- Must not exceed available authorised share capital headroom
```

---

## 6. Approval Engine

The approval engine is shared across all modules. It supports up to 4 tiers.

### 6.1 Tier Definitions

| Tier | Trigger | Required Approvers |
|---|---|---|
| 1 | amount ≤ `TIER2_LIMIT` | None (auto-approved) |
| 2 | amount ≤ `TIER3_LIMIT` | `OPS_MANAGER` |
| 3 | amount ≤ `TIER4_LIMIT` | `OPS_MANAGER` → `ICU` |
| 4 | amount > `TIER4_LIMIT` | `OPS_MANAGER` → `ICU` → `MANAGEMENT` |

For offers, the tier is determined by total subscription/allotment value. For dividend declarations, it is determined by gross liability.

### 6.2 Approval Flow

```
POST /approvals/:itemId/decide
Body: { decision: "APPROVED" | "REJECTED", comment: "..." }

→ Verify requesting user's role matches next pending approval_step
→ If APPROVED:
    → Mark step as APPROVED, set decided_at
    → Check if all steps are approved
        → Yes: update entity status to 'AUTHORIZED' / 'ICU_APPROVED'
        → No: leave entity in pending state; notify next approver
→ If REJECTED:
    → Mark step as REJECTED
    → Set approval_item.status = 'REJECTED'
    → Update entity status to 'REJECTED'
    → Notify initiator
→ Write audit log
```

### 6.3 Initiator Restriction

An initiator **cannot approve their own submission** at any tier. This is enforced at the API level:

```sql
-- On decide request:
IF approval_items.initiator_id = requesting_user.id THEN
  RAISE EXCEPTION 'Initiator cannot approve own submission';
END IF;
```

---

## 7. Audit Log

Every state-changing API call writes to `audit_log`. The backend middleware handles this automatically for all `POST`, `PATCH`, `DELETE` operations.

### Minimum Fields Per Entry

| Field | Source |
|---|---|
| `actor_id` | JWT `sub` |
| `actor_name` | JWT `name` |
| `role` | JWT `role` |
| `action` | Constant defined per handler, e.g. `PRINCIPAL_CREATED` |
| `entity_type` | Resource name |
| `entity_id` | Resource UUID |
| `before_state` | Fetched from DB before mutation |
| `after_state` | Computed after mutation |
| `ip_address` | `req.ip` |
| `timestamp` | `NOW()` |

### Standard Action Codes

| Module | Actions |
|---|---|
| Auth | `USER_LOGIN`, `USER_LOGOUT`, `PASSWORD_RESET_REQUESTED`, `PASSWORD_CHANGED` |
| Setup | `PRINCIPAL_CREATED`, `PRINCIPAL_UPDATED`, `PRINCIPAL_STATUS_CHANGED` |
| Setup | `REGISTER_CREATED`, `REGISTER_UPDATED`, `REGISTER_LOCK_CHANGED` |
| Setup | `USER_CREATED`, `USER_UPDATED`, `USER_STATUS_CHANGED`, `USER_2FA_TOGGLED` |
| Setup | `AGENT_CREATED`, `AGENT_UPDATED`, `PARAMETER_UPDATED` |
| Offers | `OFFER_CREATED`, `BATCH_UPLOADED`, `BATCH_APPROVED`, `BATCH_ICU_APPROVED` |
| Offers | `ALLOTMENT_PROCESSED`, `NOTIFICATIONS_SENT` |

---

## 8. API Conventions

### Base URL

```
https://api.mrpsl-cpa.meristemregistrars.com/v1
```

### Standard Request Headers

```
Authorization: Bearer <accessToken>
Content-Type: application/json
X-Request-ID: <uuid>          (optional, echoed in response)
```

### Standard Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-05-05T10:00:00Z"
  }
}
```

### Paginated List Response

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 143,
    "totalPages": 8
  }
}
```

**Query parameters for lists:** `page`, `pageSize`, `search`, `status`, `sortBy`, `sortDir`

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "PRINCIPAL_HAS_ACTIVE_REGISTERS",
    "message": "Cannot deactivate a principal with active registers.",
    "field": null
  }
}
```

### Validation Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "fields": [
      { "field": "email", "message": "Must be a valid email address." },
      { "field": "nominalValue", "message": "Must be greater than 0." }
    ]
  }
}
```

---

## 9. Error Codes

| HTTP Status | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | One or more request fields failed validation |
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 401 | `TOKEN_EXPIRED` | Access token has expired — use refresh |
| 401 | `INVALID_OTP` | 2FA code incorrect |
| 401 | `ACCOUNT_LOCKED` | Too many failed login attempts |
| 403 | `FORBIDDEN` | Authenticated but insufficient role |
| 403 | `SELF_APPROVAL_NOT_ALLOWED` | Initiator cannot approve own submission |
| 403 | `INITIATOR_ROLE_RESTRICTED` | User role cannot initiate this transaction |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `PRINCIPAL_HAS_ACTIVE_REGISTERS` | Cannot deactivate principal |
| 409 | `REGISTER_TRANSACTION_DISABLED` | Register is locked for all transactions |
| 409 | `DUPLICATE_SYMBOL` | Register symbol already in use |
| 409 | `DUPLICATE_EMAIL` | User email already registered |
| 409 | `DUPLICATE_APPLICATION` | Same CHN applied twice in same offer |
| 422 | `ENTITLEMENT_EXCEEDED` | Application units exceed calculated entitlement |
| 422 | `BELOW_MINIMUM_SUBSCRIPTION` | Application below the minimum threshold |
| 422 | `SHARE_CAPITAL_HEADROOM_EXCEEDED` | Bonus/rights units exceed authorised capital |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server error |

---

*Document maintained by the MRPSL CPA development team. Next section to be added: **Certificate Management Module** (CSCS Updates, Reconciliation, Dematerialisation, Split, Consolidation, Transfer).*
