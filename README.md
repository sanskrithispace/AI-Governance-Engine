# Compliance-as-a-Service for Child Digital Safety

## The Problem Every Platform Faces

Your app needs to comply with child safety laws. Today this means:

- **Weeks of work**: Legal team reads law → memo to engineers → code implementation → testing → deployment
- **Inconsistency**: Each platform (education, gaming, fintech) implements differently
- **Risk**: Gaps in protection while implementation happens
- **Maintenance nightmare**: When law changes, entire cycle repeats

**Result**: Children unprotected during the gap. No enforceable standard across platforms.

## The Solution: Stop Building Compliance. Start Using Ours.

One API call. You're compliant.

```
Your App              Law-as-Code API         Compliance ✅
↓                      ↓                        ↓
POST /api/v1/verify   →  Engine evaluates   →  Decision logged
{age, service,           all active laws        + audit proof
 action}                                        + rate limited
```

**In hours, not weeks.** Automatically updated when laws change. Auditable proof for regulators.

## The Business Model: Compliance-as-a-Service

We manage the laws. You focus on your product.

### How It Works

1. **You integrate once** (one API endpoint)
2. **We manage laws** (add/update without your code changes)
3. **You get compliance** (every decision auditable)
4. **Regulators are happy** (tamper-evident proof)

### Subscription Tiers

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| API Calls/Day | 10 | 1,000 | Unlimited |
| Laws Supported | 7 (UAE) | 7 + Regional | Custom |
| Audit Retention | 30 days | 1 year | Forever |
| SLA | Community | 99.5% | 99.99% |
| Support | Public | 24h Email | Dedicated |
| Price | Free | $99/mo | Custom |

### Real Use Cases

**Education Platform**
- User age 10 tries adult course
- You call: `POST /verify { age: 10, service: "education" }`
- We return: `{ decision: "BLOCK", reason: "Law#3: <13 blocked", audit_id: "..." }`
- You show error. Compliance: ✅ Logged & auditable.

**Gaming Platform**
- User age 14 tries chat feature
- You call: `POST /verify { age: 14, service: "gaming", action: "chat" }`
- We return: `{ decision: "REQUIRE_CONSENT", reason: "Needs parent approval", audit_id: "..." }`
- You show "Get parent approval" flow. Compliance: ✅

**Fintech App**
- User age 16 tries invest account
- You call: `POST /verify { age: 16, service: "finance", action: "open_account" }`
- We return: `{ decision: "RESTRICT", reason: "Age 16: limited trading only", audit_id: "..." }`
- You show restricted features. Compliance: ✅

## What This POC Demonstrates

This is a working proof-of-concept of law-as-code compliance. It shows:

1. **Laws as data, not code** — Edit law thresholds in admin dashboard, changes take effect immediately (no code redeploy)
2. **Real-time multi-law evaluation** — All 7 UAE laws evaluated simultaneously, strictest result wins
3. **Immutable audit trail** — SHA-256 hash chain proves every decision, tamper-evident
4. **Auto-expiry logic** — When user ages past restriction, system automatically lifts it (logged as EXPIRY event)
5. **SaaS API with gating** — API key authentication, subscription tiers with rate limiting

---

## Structure

```
law-as-code/
├── backend/          # Express API + SQLite + Swagger UI
│   └── src/
│       ├── server.js         # Entry point
│       ├── engine.js         # Rule evaluation + verifyCompliance()
│       ├── db.js             # SQLite schema + seed
│       ├── swagger.js        # OpenAPI 3.0 spec
│       └── routes/
│           ├── compliance.js # POST /api/v1/verify, GET /api/v1/laws, GET /api/v1/audit-log
│           ├── laws.js       # Registry CRUD (legacy)
│           ├── verify.js     # Original verify endpoint (legacy)
│           └── audit.js      # Audit queries (legacy)
└── frontend/         # React + Vite demo UI
    └── src/
        ├── App.jsx
        ├── api.js            # Axios calls to v1 API
        └── pages/
            ├── Verify.jsx    # Compliance check form + result display
            ├── LawRegistry.jsx
            └── AuditLog.jsx
```

## Getting Started

```bash
# Install all dependencies (root, backend, frontend)
npm install

# Terminal 1 — backend on :5000
npm run dev:backend

# Terminal 2 — frontend on :5173
npm run dev:frontend
```

---

## API Documentation

Open **http://localhost:5000/api-docs** to explore and test all endpoints interactively.

Raw OpenAPI spec: **http://localhost:5000/api-docs.json**

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/verify` | Run a compliance check |
| `GET`  | `/api/v1/laws` | List all laws in the registry |
| `GET`  | `/api/v1/audit-log?limit=10` | Get recent compliance decisions |

### Example: Verify Compliance

```bash
curl -X POST http://localhost:5000/api/v1/verify \
  -H "Content-Type: application/json" \
  -d '{
    "user_eid": "784-1990-1234567-1",
    "age": 10,
    "service_type": "Education",
    "action": "access"
  }'
```

**Response:**
```json
{
  "decision": "BLOCK",
  "reason": "LAW-001: Under 13 — Full Block applies. LAW-002: Under 13 — Generative AI Banned applies. LAW-003: Under 13 — Gambling & Betting Blocked applies.",
  "laws_evaluated": 7,
  "triggered_rules": ["LAW-001", "LAW-002", "LAW-003"],
  "audit_id": "a3f2b1c4d5e67890abcdef1234567890abcdef1234567890abcdef1234567890ab",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Example: List Laws

```bash
curl http://localhost:5000/api/v1/laws
```

### Example: Get Audit Log

```bash
curl "http://localhost:5000/api/v1/audit-log?limit=5"
```

### Decision Types

| Decision | Meaning |
|---|---|
| `ALLOW` | All laws satisfied — access granted |
| `BLOCK` | Hard restriction triggered — access denied |
| `REQUIRE_CONSENT` | Guardian or parental consent required |
| `RESTRICT` | Conditional access with limitations |

### Rule Evaluation Logic

```
Priority: BLOCK > REQUIRE_CONSENT > ALLOW

Condition types:
  age_lt            → triggers if age < threshold
  age_gte           → passes if age ≥ threshold
  high_risk_age_gte → triggers on Financial/Adult Content if age < threshold
```

---

## Production Roadmap

This is a working demo with a production-ready architecture. The following additions
would be required before real-world deployment:

### Authentication & Authorization
- **OAuth 2.0 / OpenID Connect** for platform API consumers
- API key management with per-key rate limits and audit trails
- Role-based access: regulators (read/write laws), platforms (verify only), auditors (read-only)

### Rate Limiting & Reliability
- Per-client rate limiting (e.g., 1,000 verifications/min per API key)
- Request queuing for burst traffic
- Circuit breaker pattern for downstream identity services
- Horizontal scaling with shared PostgreSQL (replace SQLite)

### Identity Verification
- Integration with national identity providers (UAE PASS / ICA)
- Liveness detection + biometric face matching (Azure Face API / AWS Rekognition)
- Document verification for Emirates ID authenticity

### Service Tiers
- **Standard**: Social Media, Gaming, E-Commerce, Education
- **High-Risk**: Financial services, Adult Content (stricter age thresholds, 21+)
- **Critical**: Healthcare, Legal services (additional verification required)
- Configurable per-jurisdiction thresholds

### Regional Compliance
- Multi-jurisdiction law registries (UAE, KSA, EU GDPR, UK Online Safety Act)
- Automatic law version management with effective dates
- Cross-border service classification
- Jurisdiction routing based on user location

### Audit & Reporting
- Real-time compliance dashboard for regulators
- Automated anomaly detection (unusual block rates, threshold crossings)
- Scheduled compliance reports (daily/weekly/monthly)
- Export to regulatory reporting formats

### Data & Privacy
- PII tokenisation at rest (replace EID with internal token)
- Configurable data retention policies
- Right-to-erasure workflow (GDPR Article 17)
- Encrypted audit log storage
