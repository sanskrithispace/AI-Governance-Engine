import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { initDb } from './db.js';
import { swaggerSpec } from './swagger.js';
import { apiAuth } from './middleware/apiAuth.js';
import adminRouter from './routes/admin.js';
import lawsRouter from './routes/laws.js';
import verifyRouter from './routes/verify.js';
import auditRouter from './routes/audit.js';
import complianceRouter from './routes/compliance.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  exposedHeaders: ['X-RateLimit-Tier', 'X-RateLimit-Limit', 'X-RateLimit-Used', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
}));
app.use(bodyParser.json());

// ── Swagger UI ────────────────────────────────────────
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Law-as-Code API',
    swaggerOptions: { defaultModelsExpandDepth: -1 },
  })
);
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

// ── v1 Compliance API (POST /verify requires API key) ─
app.use('/api/v1/verify', apiAuth);
app.use('/api/v1', complianceRouter);

// ── Admin API ─────────────────────────────────────────
app.use('/api/admin', adminRouter);

// ── Legacy routes (used by frontend registry UI) ──────
app.use('/api/laws',   lawsRouter);
app.use('/api/verify', verifyRouter);
app.use('/api/audit',  auditRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
      console.log(`Swagger UI:   http://localhost:${PORT}/api-docs`);
      console.log(`Swagger JSON: http://localhost:${PORT}/api-docs.json`);
    });
  })
  .catch(err => { console.error('DB init failed:', err); process.exit(1); });
