import { Router } from 'express';
import { all, run, get } from '../db.js';
import { verifyCompliance, sha256 } from '../engine.js';

const router = Router();
const EID_RE = /^784-\d{4}-\d{7}-\d$/;

// POST /api/v1/verify
router.post('/verify', async (req, res) => {
  try {
    const { user_eid, age, service_type, action = 'access' } = req.body;

    // Input validation
    if (!user_eid || !EID_RE.test(user_eid)) {
      return res.status(400).json({ error: 'Invalid Emirates ID format. Expected: 784-XXXX-XXXXXXX-X' });
    }
    if (typeof age !== 'number' || age < 0 || age > 120) {
      return res.status(400).json({ error: 'age must be a number between 0 and 120' });
    }
    if (!service_type) {
      return res.status(400).json({ error: 'service_type is required' });
    }

    const timestamp = new Date().toISOString();
    const maskedEid = user_eid.slice(0, 7) + '***-***' + user_eid.slice(-2);

    // Load active laws and run compliance engine
    const laws = await all(`SELECT * FROM laws WHERE active = 1 ORDER BY id`);
    const result = verifyCompliance(age, service_type, action, laws);

    // Build SHA-256 hash chain
    const prevRow = await get(
      `SELECT hash FROM audit_logs WHERE type = 'DECISION' ORDER BY id DESC LIMIT 1`
    );
    const prevHash = prevRow?.hash ?? '0'.repeat(64);
    const audit_id = sha256({
      maskedEid, age, service_type, action,
      decision: result.decision,
      triggered: result.triggered_rules,
      prevHash, timestamp,
    });

    // Persist decision to audit log
    await run(
      `INSERT INTO audit_logs (type, eid, decision, age, svc, triggered, hash, prev_hash, detail, timestamp)
       VALUES ('DECISION', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        maskedEid, result.decision, age, service_type,
        JSON.stringify(result.triggered_rules),
        audit_id, prevHash, result.reason, timestamp,
      ]
    );

    // Log an alert for non-ALLOW decisions
    if (result.decision !== 'ALLOW') {
      await run(
        `INSERT INTO audit_logs (type, eid, decision, age, svc, detail, timestamp)
         VALUES ('ALERT', ?, ?, ?, ?, ?, ?)`,
        [maskedEid, result.decision, age, service_type, result.reason, timestamp]
      );
    }

    res.json({
      decision:       result.decision,
      reason:         result.reason,
      laws_evaluated: result.laws_evaluated,
      triggered_rules: result.triggered_rules,
      audit_id,
      timestamp,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/v1/laws
router.get('/laws', async (req, res) => {
  try {
    const laws = await all(`SELECT * FROM laws ORDER BY id`);
    res.json(laws.map(l => ({
      id:        l.id,
      name:      l.name,
      condition: l.cond,
      threshold: l.threshold,
      action:    l.action,
      active:    Boolean(l.active),
      reference: l.ref,
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/v1/audit-log?limit=10
router.get('/audit-log', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const rows = await all(
      `SELECT * FROM audit_logs WHERE type = 'DECISION' ORDER BY id DESC LIMIT ?`,
      [limit]
    );
    res.json(rows.map(r => ({
      audit_id:     r.hash,
      decision:     r.decision,
      user:         r.eid,
      service_type: r.svc,
      timestamp:    r.timestamp,
      hash:         r.hash,
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
