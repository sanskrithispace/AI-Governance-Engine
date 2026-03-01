import { Router } from 'express';
import { all, run, get } from '../db.js';
import { evaluateLaws, sha256, calcAge } from '../engine.js';

const router = Router();
const EID_RE = /^784-\d{4}-\d{7}-\d$/;

router.post('/', async (req, res) => {
  try {
    const { eid, dob, serviceType, faceScore } = req.body;
    const timestamp = new Date().toISOString();
    const maskedEid = eid.slice(0, 7) + '***-***' + eid.slice(-2);

    // Step 1 — Validate Emirates ID format
    if (!EID_RE.test(eid)) {
      return res.status(400).json({ error: 'Invalid Emirates ID format (784-XXXX-XXXXXXX-X)' });
    }

    // Step 2 — Identity gate: face score must be ≥ 80%
    if (faceScore < 80) {
      const prevRow = await get(`SELECT hash FROM audit_logs WHERE type = 'DECISION' ORDER BY id DESC LIMIT 1`);
      const prevHash = prevRow?.hash ?? '0'.repeat(64);
      const hash = sha256({ maskedEid, decision: 'IDENTITY_FAIL', faceScore, prevHash, timestamp });

      await run(
        `INSERT INTO audit_logs (type, eid, decision, face_score, hash, prev_hash, detail, timestamp)
         VALUES ('DECISION', ?, 'IDENTITY_FAIL', ?, ?, ?, ?, ?)`,
        [maskedEid, faceScore, hash, prevHash, `Face score ${faceScore}% below minimum 80%`, timestamp]
      );

      return res.json({ decision: 'IDENTITY_FAIL', faceScore, traces: [], triggered: [], hash, timestamp });
    }

    // Step 3 — Calculate age and evaluate all active laws
    const age = calcAge(dob);
    const laws = await all(`SELECT * FROM laws WHERE active = 1 ORDER BY id`);
    const { decision, traces, triggered } = evaluateLaws(laws, age, serviceType);

    // Step 4 — Check auto-expiry (did age cross a threshold since last decision for this EID?)
    let expiry = null;
    const prev = await get(
      `SELECT decision, age FROM audit_logs WHERE eid = ? AND type = 'DECISION' ORDER BY id DESC LIMIT 1`,
      [maskedEid]
    );
    if (prev) {
      const wasRestricted = ['BLOCK', 'REQUIRE_CONSENT'].includes(prev.decision);
      const nowBetter = decision === 'ALLOW' || (prev.decision === 'BLOCK' && decision === 'REQUIRE_CONSENT');
      if (wasRestricted && nowBetter) {
        expiry = { transition: `${prev.decision} → ${decision}`, oldAge: prev.age, newAge: age };
        await run(
          `INSERT INTO audit_logs (type, eid, decision, age, detail, timestamp)
           VALUES ('EXPIRY', ?, ?, ?, ?, ?)`,
          [maskedEid, decision, age, `${prev.decision} → ${decision} (age ${prev.age}→${age})`, timestamp]
        );
      }
    }

    // Step 5 — SHA-256 hash chain
    const prevRow = await get(`SELECT hash FROM audit_logs WHERE type = 'DECISION' ORDER BY id DESC LIMIT 1`);
    const prevHash = prevRow?.hash ?? '0'.repeat(64);
    const hash = sha256({ maskedEid, age, serviceType, faceScore, decision, triggered, prevHash, timestamp });

    // Step 6 — Persist decision
    await run(
      `INSERT INTO audit_logs (type, eid, decision, age, svc, face_score, triggered, hash, prev_hash, timestamp)
       VALUES ('DECISION', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [maskedEid, decision, age, serviceType, faceScore, JSON.stringify(triggered), hash, prevHash, timestamp]
    );

    // Log alert for blocks and consent requirements
    if (decision !== 'ALLOW') {
      await run(
        `INSERT INTO audit_logs (type, eid, decision, age, svc, detail, timestamp)
         VALUES ('ALERT', ?, ?, ?, ?, ?, ?)`,
        [maskedEid, decision, age, serviceType, `${decision} — laws: ${triggered.join(', ')}`, timestamp]
      );
    }

    res.json({ decision, age, faceScore, traces, triggered, hash, prevHash, timestamp, expiry });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
