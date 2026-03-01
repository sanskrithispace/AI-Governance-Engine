import { Router } from 'express';
import { all, run, get } from '../db.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { getUsageStats } from '../middleware/apiAuth.js';

const router = Router();
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin_token_123';

// POST /api/admin/login — public, no adminAuth
router.post('/login', (req, res) => {
  const { username, password } = req.body ?? {};
  if (username === 'admin' && password === 'admin123') {
    return res.json({ token: ADMIN_TOKEN, username: 'admin' });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// ── All routes below require admin token ──────────────────
router.use(adminAuth);

// GET /api/admin/laws
router.get('/laws', async (req, res) => {
  try {
    res.json(await all(`SELECT * FROM laws ORDER BY id`));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/laws
router.post('/laws', async (req, res) => {
  try {
    const { id, name, cond, threshold, action, version = 'v1.0', ref = '' } = req.body;
    const added = new Date().toISOString().split('T')[0];

    await run(
      `INSERT INTO laws (id, name, cond, threshold, action, active, version, added, ref)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [id, name, cond, threshold, action, version, added, ref]
    );
    await run(
      `INSERT INTO audit_logs (type, detail, timestamp) VALUES ('CHANGE', ?, ?)`,
      [`[admin] Added law ${id}: ${name}`, new Date().toISOString()]
    );

    res.status(201).json(await get(`SELECT * FROM laws WHERE id = ?`, [id]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/admin/laws/:id
router.put('/laws/:id', async (req, res) => {
  try {
    const { name, cond, threshold, action, active, version, ref } = req.body;

    await run(
      `UPDATE laws SET name=?, cond=?, threshold=?, action=?, active=?, version=?, ref=? WHERE id=?`,
      [name, cond, threshold, action, active ?? 1, version, ref, req.params.id]
    );
    await run(
      `INSERT INTO audit_logs (type, detail, timestamp) VALUES ('CHANGE', ?, ?)`,
      [`[admin] Updated law ${req.params.id}`, new Date().toISOString()]
    );

    res.json(await get(`SELECT * FROM laws WHERE id = ?`, [req.params.id]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/admin/laws/:id — deactivates, does not hard-delete
router.delete('/laws/:id', async (req, res) => {
  try {
    await run(`UPDATE laws SET active = 0 WHERE id = ?`, [req.params.id]);
    await run(
      `INSERT INTO audit_logs (type, detail, timestamp) VALUES ('CHANGE', ?, ?)`,
      [`[admin] Deactivated law ${req.params.id}`, new Date().toISOString()]
    );
    res.json({ ok: true, id: req.params.id, active: false });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/audit-log?type=DECISION&limit=50
router.get('/audit-log', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const { type } = req.query;

    const rows = await all(
      type
        ? `SELECT * FROM audit_logs WHERE type = ? ORDER BY id DESC LIMIT ?`
        : `SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?`,
      type ? [type, limit] : [limit]
    );

    res.json(rows.map(r => ({ ...r, triggered: r.triggered ? JSON.parse(r.triggered) : [] })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/usage
router.get('/usage', (_req, res) => {
  res.json(getUsageStats());
});

export default router;
