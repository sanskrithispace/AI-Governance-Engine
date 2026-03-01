import { Router } from 'express';
import { all } from '../db.js';

const router = Router();

// GET /api/audit?type=DECISION|ALERT|EXPIRY|CHANGE
router.get('/', async (req, res) => {
  try {
    const type = req.query.type || 'DECISION';
    const rows = await all(
      `SELECT * FROM audit_logs WHERE type = ? ORDER BY id DESC LIMIT 100`,
      [type]
    );
    res.json(rows.map(r => ({
      ...r,
      triggered: r.triggered ? JSON.parse(r.triggered) : [],
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
