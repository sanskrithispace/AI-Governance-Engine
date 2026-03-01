# Law as Code — Compliance API

A machine-readable implementation of **UAE Federal Decree-Law No. 26 of 2025**
(Child Digital Safety & Age Verification).

Laws are stored as structured data in a live registry, evaluated in real-time,
and every decision is logged to a SHA-256 hash chain for tamper-evident auditing.

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
