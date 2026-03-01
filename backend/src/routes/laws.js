import { Router } from 'express';
import { all, run, get } from '../db.js';

const router = Router();

// GET all laws
router.get('/', async (req, res) => {
  try {
    res.json(await all(`SELECT * FROM laws ORDER BY id`));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST add a new law
router.post('/', async (req, res) => {
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
      [`Added law ${id}: ${name}`, new Date().toISOString()]
    );

    res.status(201).json(await get(`SELECT * FROM laws WHERE id = ?`, [id]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT update a law
router.put('/:id', async (req, res) => {
  try {
    const { name, cond, threshold, action, active, version, ref } = req.body;

    await run(
      `UPDATE laws SET name=?, cond=?, threshold=?, action=?, active=?, version=?, ref=? WHERE id=?`,
      [name, cond, threshold, action, active ?? 1, version, ref, req.params.id]
    );
    await run(
      `INSERT INTO audit_logs (type, detail, timestamp) VALUES ('CHANGE', ?, ?)`,
      [`Updated law ${req.params.id}: ${name}`, new Date().toISOString()]
    );

    res.json(await get(`SELECT * FROM laws WHERE id = ?`, [req.params.id]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
