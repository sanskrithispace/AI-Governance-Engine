import crypto from 'crypto';

const HIGH_RISK_SERVICES = ['Financial', 'Adult Content'];

/**
 * Calculate age from a date-of-birth string (YYYY-MM-DD).
 */
export function calcAge(dob) {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

/**
 * Evaluate all active laws against verified age + service type.
 *
 * Rule logic:
 *   age_lt            → FAIL if age < threshold  (triggers BLOCK or REQUIRE_CONSENT)
 *   age_gte           → PASS if age >= threshold, N/A otherwise
 *   high_risk_age_gte → N/A for non-high-risk; FAIL if high-risk AND age < threshold → BLOCK
 *
 * Priority: BLOCK > REQUIRE_CONSENT > ALLOW
 */
export function evaluateLaws(laws, age, serviceType) {
  const isHighRisk = HIGH_RISK_SERVICES.includes(serviceType);

  const traces = laws.map(law => {
    let result;
    switch (law.cond) {
      case 'age_lt':
        result = age < law.threshold ? 'FAIL' : 'PASS';
        break;
      case 'age_gte':
        result = age >= law.threshold ? 'PASS' : 'N/A';
        break;
      case 'high_risk_age_gte':
        if (!isHighRisk) result = 'N/A';
        else result = age >= law.threshold ? 'PASS' : 'FAIL';
        break;
      default:
        result = 'N/A';
    }
    return { ...law, result };
  });

  const blocking = traces.filter(
    t => t.result === 'FAIL' && (t.action === 'BLOCK' || t.cond === 'high_risk_age_gte')
  );
  const consenting = traces.filter(
    t => t.result === 'FAIL' && t.action === 'REQUIRE_CONSENT'
  );

  let decision = 'ALLOW';
  if (blocking.length > 0) decision = 'BLOCK';
  else if (consenting.length > 0) decision = 'REQUIRE_CONSENT';

  const triggered = [...blocking, ...consenting].map(t => t.id);
  return { decision, traces, triggered };
}

/**
 * SHA-256 hash of a payload object (used for the audit chain).
 */
export function sha256(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

/**
 * Build a human-readable reason string from the engine result.
 */
function buildReason(decision, traces, serviceType, action, age) {
  if (decision === 'ALLOW') {
    return `All ${traces.length} active laws satisfied. Age ${age} is compliant for "${action}" on ${serviceType}.`;
  }
  const failed = traces.filter(t => t.result === 'FAIL');
  if (decision === 'BLOCK') {
    const blocking = failed.filter(t => t.action === 'BLOCK' || t.cond === 'high_risk_age_gte');
    return blocking.map(t => `${t.id}: ${t.name} applies.`).join(' ');
  }
  if (decision === 'REQUIRE_CONSENT') {
    const consent = failed.filter(t => t.action === 'REQUIRE_CONSENT');
    return consent.map(t => `${t.id}: ${t.name} applies.`).join(' ');
  }
  return 'Compliance decision applied.';
}

/**
 * High-level compliance check — takes age, service type, action, and the
 * pre-loaded active laws array. Returns the v1 API response shape (minus audit_id).
 */
export function verifyCompliance(age, serviceType, action, laws) {
  const { decision, traces, triggered } = evaluateLaws(laws, age, serviceType);
  const reason = buildReason(decision, traces, serviceType, action, age);
  return {
    decision,
    reason,
    laws_evaluated: laws.length,
    triggered_rules: triggered,
    traces,
  };
}
