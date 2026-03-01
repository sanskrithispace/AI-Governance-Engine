import swaggerJsdoc from 'swagger-jsdoc';

const definition = {
  openapi: '3.0.0',

  info: {
    title: 'Law-as-Code Compliance API',
    version: '1.0.0',
    description: `
A machine-readable implementation of **UAE Federal Decree-Law No. 26 of 2025**
(Child Digital Safety & Age Verification).

Laws are stored as structured data in a live registry, evaluated in real-time
against every request, and every decision is logged to a SHA-256 hash chain
for tamper-evident auditing — no hardcoded rules, no manual enforcement gaps.

## How It Works
1. Submit a user's verified EID, age, service type, and intended action
2. All **active laws** are loaded from the registry and evaluated simultaneously
3. The strictest result wins: \`BLOCK\` > \`REQUIRE_CONSENT\` > \`ALLOW\`
4. The decision is written to an immutable audit chain with a cryptographic hash

## Decision Types
| Decision | Meaning |
|---|---|
| \`ALLOW\` | All laws satisfied — access granted |
| \`BLOCK\` | One or more hard restrictions triggered — access denied |
| \`REQUIRE_CONSENT\` | Guardian or parental consent required before access |
| \`RESTRICT\` | Conditional access — limited functionality permitted |

## Legal Basis
UAE Federal Decree-Law No. 26 of 2025 — Articles 4–10
    `,
    contact: {
      name: 'Compliance API Support',
      email: 'compliance@law-as-code.io',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },

  servers: [
    { url: 'http://localhost:5000', description: 'Development server' },
  ],

  tags: [
    {
      name: 'Compliance',
      description: 'Core age verification and access decision endpoint',
    },
    {
      name: 'Laws',
      description: 'Live law registry — structured rules that drive the engine',
    },
    {
      name: 'Audit',
      description: 'Tamper-evident SHA-256 hash chain of all compliance decisions',
    },
    {
      name: 'Admin',
      description: 'Admin-only endpoints — require `x-admin-token` header',
    },
  ],

  paths: {
    '/api/v1/verify': {
      post: {
        tags: ['Compliance'],
        summary: 'Verify user compliance with active laws',
        description: `
Evaluates **all active laws** against the user's verified age and requested service.
Returns a binding compliance decision with the triggering rule IDs and a full reason string.

Every call is persisted to an immutable audit log with a SHA-256 hash linking to the
previous record — creating a tamper-evident chain.

**Rule evaluation order:**
1. Load all active laws from the registry
2. Evaluate each law against (age + service_type) simultaneously
3. Combine: \`BLOCK\` overrides \`REQUIRE_CONSENT\` which overrides \`ALLOW\`
4. Write to audit chain and return decision
        `,
        operationId: 'verifyCompliance',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VerifyRequest' },
              examples: {
                child_education: {
                  summary: 'Age 10 on Education — blocked (under 13)',
                  value: {
                    user_eid: '784-1990-1234567-1',
                    age: 10,
                    service_type: 'Education',
                    action: 'access',
                  },
                },
                minor_social_media: {
                  summary: 'Age 15 on Social Media — guardian consent required',
                  value: {
                    user_eid: '784-2008-7654321-2',
                    age: 15,
                    service_type: 'Social Media',
                    action: 'register',
                  },
                },
                adult_allowed: {
                  summary: 'Age 24 on Social Media — allowed',
                  value: {
                    user_eid: '784-2000-1122334-3',
                    age: 24,
                    service_type: 'Social Media',
                    action: 'access',
                  },
                },
                under21_financial: {
                  summary: 'Age 19 on Financial — blocked (must be 21+)',
                  value: {
                    user_eid: '784-2004-9988776-4',
                    age: 19,
                    service_type: 'Financial',
                    action: 'apply',
                  },
                },
                adult_financial: {
                  summary: 'Age 22 on Financial — allowed',
                  value: {
                    user_eid: '784-2001-5544332-5',
                    age: 22,
                    service_type: 'Financial',
                    action: 'apply',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Compliance decision returned successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VerifyResponse' },
                examples: {
                  block: {
                    summary: 'Under-13 blocked (LAW-001, LAW-002, LAW-003)',
                    value: {
                      decision: 'BLOCK',
                      reason: 'LAW-001: Under 13 — Full Block applies. LAW-002: Under 13 — Generative AI Banned applies. LAW-003: Under 13 — Gambling & Betting Blocked applies.',
                      laws_evaluated: 7,
                      triggered_rules: ['LAW-001', 'LAW-002', 'LAW-003'],
                      audit_id: 'a3f2b1c4d5e67890abcdef1234567890abcdef1234567890abcdef1234567890ab',
                      timestamp: '2025-01-15T10:30:00.000Z',
                    },
                  },
                  require_consent: {
                    summary: 'Minor (15) requires guardian consent',
                    value: {
                      decision: 'REQUIRE_CONSENT',
                      reason: 'LAW-004: Under 16 — Guardian Consent for Social & Gaming applies. LAW-005: Under 18 — Guardian Consent for All Restricted Services applies.',
                      laws_evaluated: 7,
                      triggered_rules: ['LAW-004', 'LAW-005'],
                      audit_id: 'b4c5d6e7f8a9012345678901234567890abcdef1234567890abcdef1234567890cd',
                      timestamp: '2025-01-15T10:31:00.000Z',
                    },
                  },
                  allow: {
                    summary: 'Adult (24) granted access',
                    value: {
                      decision: 'ALLOW',
                      reason: 'All 7 active laws satisfied. Age 24 is compliant for "access" on Social Media.',
                      laws_evaluated: 7,
                      triggered_rules: [],
                      audit_id: 'c5d6e7f8a9b0123456789012345678901234567890abcdef1234567890abcdef12',
                      timestamp: '2025-01-15T10:32:00.000Z',
                    },
                  },
                  block_financial: {
                    summary: 'Under-21 blocked on high-risk financial service',
                    value: {
                      decision: 'BLOCK',
                      reason: 'LAW-007: High-Risk Services — Must be 21+ applies.',
                      laws_evaluated: 7,
                      triggered_rules: ['LAW-007'],
                      audit_id: 'd6e7f8a9b0c1234567890123456789012345678901234567890abcdef12345678',
                      timestamp: '2025-01-15T10:33:00.000Z',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid request — missing or malformed parameters',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                examples: {
                  invalid_eid: {
                    summary: 'Malformed Emirates ID',
                    value: { error: 'Invalid Emirates ID format. Expected: 784-XXXX-XXXXXXX-X' },
                  },
                  invalid_age: {
                    summary: 'Age out of range',
                    value: { error: 'age must be a number between 0 and 120' },
                  },
                  missing_service: {
                    summary: 'Missing service_type',
                    value: { error: 'service_type is required' },
                  },
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    '/api/v1/laws': {
      get: {
        tags: ['Laws'],
        summary: 'List all laws in the compliance registry',
        description: `
Returns all laws in the registry — both active and inactive.
Only **active** laws (\`active: true\`) are evaluated during verification calls.

Laws can be added, updated, or deactivated via the registry management endpoints,
and changes take effect on the very next verification — no deployment required.
        `,
        operationId: 'getLaws',
        responses: {
          200: {
            description: 'Array of law objects',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Law' },
                },
                example: [
                  {
                    id: 'LAW-001',
                    name: 'Under 13 — Full Block',
                    condition: 'age_lt',
                    threshold: 13,
                    action: 'BLOCK',
                    active: true,
                    reference: 'UAE Decree-Law 26/2025 · Art. 4',
                  },
                  {
                    id: 'LAW-006',
                    name: '18 and Above — Standard Access Permitted',
                    condition: 'age_gte',
                    threshold: 18,
                    action: 'ALLOW',
                    active: true,
                    reference: 'UAE Decree-Law 26/2025 · Art. 8',
                  },
                ],
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Error' } },
            },
          },
        },
      },
    },

    '/api/v1/audit-log': {
      get: {
        tags: ['Audit'],
        summary: 'Get recent compliance decisions',
        description: `
Returns the most recent compliance decisions from the audit chain,
ordered newest-first.

Each record includes a **SHA-256 hash** that links to the previous record's hash,
forming a tamper-evident chain. Modifying any past record breaks all subsequent hashes,
making manipulation detectable.
        `,
        operationId: 'getAuditLog',
        parameters: [
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 10, minimum: 1, maximum: 100 },
            description: 'Number of records to return (max 100)',
            example: 10,
          },
        ],
        responses: {
          200: {
            description: 'Array of audit records, newest first',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/AuditRecord' },
                },
                example: [
                  {
                    audit_id: 'a3f2b1c4d5e67890abcdef1234567890abcdef1234567890abcdef1234567890ab',
                    decision: 'BLOCK',
                    user: '784-199***-***-1',
                    service_type: 'Education',
                    timestamp: '2025-01-15T10:30:00.000Z',
                    hash: 'a3f2b1c4d5e67890abcdef1234567890abcdef1234567890abcdef1234567890ab',
                  },
                ],
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Error' } },
            },
          },
        },
      },
    },

    '/api/admin/login': {
      post: {
        tags: ['Admin'],
        summary: 'Admin login',
        description: 'Authenticate as admin and receive an admin token. Default credentials: `admin` / `admin123`.',
        operationId: 'adminLogin',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'admin' },
                  password: { type: 'string', example: 'admin123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string', example: 'admin_token_123' },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/admin/laws': {
      get: {
        tags: ['Admin'],
        summary: 'List all laws (admin)',
        operationId: 'adminGetLaws',
        security: [{ AdminTokenAuth: [] }],
        responses: {
          200: { description: 'Array of all laws', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Law' } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create a new law',
        operationId: 'adminCreateLaw',
        security: [{ AdminTokenAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Law' } } },
        },
        responses: {
          201: { description: 'Law created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Law' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/admin/laws/{id}': {
      put: {
        tags: ['Admin'],
        summary: 'Update a law',
        operationId: 'adminUpdateLaw',
        security: [{ AdminTokenAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, example: 'LAW-001' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Law' } } },
        },
        responses: {
          200: { description: 'Law updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Law' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete a law',
        operationId: 'adminDeleteLaw',
        security: [{ AdminTokenAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, example: 'LAW-001' }],
        responses: {
          200: { description: 'Law deleted' },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/admin/audit-log': {
      get: {
        tags: ['Admin'],
        summary: 'Get full audit log (admin)',
        operationId: 'adminGetAuditLog',
        security: [{ AdminTokenAuth: [] }],
        parameters: [
          { in: 'query', name: 'type', schema: { type: 'string', enum: ['DECISION', 'CHANGE', 'EXPIRY', 'ALERT'] }, description: 'Filter by event type' },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 50, minimum: 1, maximum: 500 }, description: 'Max records to return' },
        ],
        responses: {
          200: { description: 'Audit records', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AuditRecord' } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/admin/usage': {
      get: {
        tags: ['Admin'],
        summary: 'Get per-key API usage stats',
        operationId: 'adminGetUsage',
        security: [{ AdminTokenAuth: [] }],
        responses: {
          200: {
            description: 'Usage data per API key',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      key:      { type: 'string', example: 'key_pro_demo' },
                      tier:     { type: 'string', example: 'pro' },
                      used:     { type: 'integer', example: 42 },
                      limit:    { oneOf: [{ type: 'integer' }, { type: 'string', enum: ['unlimited'] }], example: 1000 },
                      reset_at: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },

  components: {
    schemas: {
      VerifyRequest: {
        type: 'object',
        required: ['user_eid', 'age', 'service_type'],
        properties: {
          user_eid: {
            type: 'string',
            pattern: '^784-\\d{4}-\\d{7}-\\d$',
            description: 'Emirates National ID — must be pre-verified before calling this endpoint',
            example: '784-1990-1234567-1',
          },
          age: {
            type: 'integer',
            minimum: 0,
            maximum: 120,
            description: 'Verified age of the user in years',
            example: 15,
          },
          service_type: {
            type: 'string',
            enum: ['Social Media', 'Gaming', 'Financial', 'Adult Content', 'E-Commerce', 'Education', 'Other'],
            description: 'The platform or service category being accessed. Financial and Adult Content are classified as high-risk.',
            example: 'Social Media',
          },
          action: {
            type: 'string',
            description: 'The specific action the user is attempting on the service',
            example: 'access',
            default: 'access',
          },
        },
        example: {
          user_eid: '784-2008-7654321-2',
          age: 15,
          service_type: 'Social Media',
          action: 'register',
        },
      },

      VerifyResponse: {
        type: 'object',
        required: ['decision', 'reason', 'laws_evaluated', 'triggered_rules', 'audit_id', 'timestamp'],
        properties: {
          decision: {
            type: 'string',
            enum: ['ALLOW', 'BLOCK', 'REQUIRE_CONSENT', 'RESTRICT'],
            description: `Compliance outcome:
- **ALLOW** — No restrictions triggered
- **BLOCK** — One or more hard-block laws triggered
- **REQUIRE_CONSENT** — Guardian approval required
- **RESTRICT** — Conditional access permitted`,
            example: 'BLOCK',
          },
          reason: {
            type: 'string',
            description: 'Human-readable explanation citing specific law IDs',
            example: 'LAW-001: Under 13 — Full Block applies.',
          },
          laws_evaluated: {
            type: 'integer',
            description: 'Total number of active laws that were evaluated',
            example: 7,
          },
          triggered_rules: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs of laws whose conditions were triggered and contributed to the decision',
            example: ['LAW-001', 'LAW-002', 'LAW-003'],
          },
          audit_id: {
            type: 'string',
            description: 'SHA-256 hash of this decision — unique, immutable audit record ID',
            example: 'a3f2b1c4d5e67890abcdef1234567890abcdef1234567890abcdef1234567890ab',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 timestamp of when the decision was made',
            example: '2025-01-15T10:30:00.000Z',
          },
        },
      },

      Law: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique law identifier',
            example: 'LAW-001',
          },
          name: {
            type: 'string',
            description: 'Human-readable law name',
            example: 'Under 13 — Full Block',
          },
          condition: {
            type: 'string',
            enum: ['age_lt', 'age_gte', 'high_risk_age_gte'],
            description: `Condition type:
- **age_lt** — Triggers when age < threshold
- **age_gte** — Passes when age ≥ threshold
- **high_risk_age_gte** — Triggers on high-risk services when age < threshold`,
            example: 'age_lt',
          },
          threshold: {
            type: 'integer',
            description: 'Age value that the condition evaluates against',
            example: 13,
          },
          action: {
            type: 'string',
            enum: ['BLOCK', 'REQUIRE_CONSENT', 'ALLOW'],
            description: 'Outcome when this law\'s condition is triggered',
            example: 'BLOCK',
          },
          active: {
            type: 'boolean',
            description: 'Whether this law is currently enforced. Only active laws are evaluated.',
            example: true,
          },
          reference: {
            type: 'string',
            description: 'Legal citation for this rule',
            example: 'UAE Decree-Law 26/2025 · Art. 4',
          },
        },
      },

      AuditRecord: {
        type: 'object',
        properties: {
          audit_id: {
            type: 'string',
            description: 'SHA-256 hash — unique audit record identifier',
            example: 'a3f2b1c4d5e67890abcdef...',
          },
          decision: {
            type: 'string',
            enum: ['ALLOW', 'BLOCK', 'REQUIRE_CONSENT', 'RESTRICT'],
            example: 'BLOCK',
          },
          user: {
            type: 'string',
            description: 'Masked Emirates ID — PII protected',
            example: '784-199***-***-1',
          },
          service_type: {
            type: 'string',
            example: 'Education',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-15T10:30:00.000Z',
          },
          hash: {
            type: 'string',
            description: 'Full SHA-256 hash — links to prev_hash for chain integrity verification',
          },
        },
      },

      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
            example: 'Invalid Emirates ID format. Expected: 784-XXXX-XXXXXXX-X',
          },
        },
      },
    },
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'API key for rate-limited access. Demo keys: `key_free_demo` (10/day), `key_pro_demo` (1,000/day), `key_enterprise_demo` (unlimited).',
      },
      AdminTokenAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-admin-token',
        description: 'Admin token for admin-only endpoints. Obtain via POST /api/admin/login. Default: `admin_token_123`.',
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({ definition, apis: [] });
