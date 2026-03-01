import { useState } from 'react';
import { verifyCompliance, setApiKey, getApiKey } from '../api';

const API_KEYS = [
  { key: 'key_free_demo',       label: 'Free',       sub: '10/day'      },
  { key: 'key_pro_demo',        label: 'Pro',        sub: '1,000/day'   },
  { key: 'key_enterprise_demo', label: 'Enterprise', sub: 'unlimited'   },
];

const SERVICES   = ['Social Media', 'Gaming', 'Financial', 'Adult Content', 'E-Commerce', 'Education'];
const HIGH_RISK  = ['Financial', 'Adult Content'];
const AGE_PRESETS = [10, 15, 16, 19, 22];

const DECISION_CFG = {
  ALLOW:           { label: '✅ ACCESS ALLOWED',               color: 'var(--green)',  cls: 'result--allow'   },
  BLOCK:           { label: '🚫 ACCESS BLOCKED',               color: 'var(--red)',    cls: 'result--block'   },
  REQUIRE_CONSENT: { label: '⚠ GUARDIAN CONSENT REQUIRED',    color: 'var(--amber)',  cls: 'result--consent' },
  RESTRICT:        { label: '⚠ RESTRICTED ACCESS',            color: 'var(--yellow)', cls: 'result--restrict'},
};

function dobFromAge(age) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  return d.toISOString().split('T')[0];
}

function ageFromDob(dob) {
  const birth = new Date(dob);
  const now   = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button className="chip chip--sm" onClick={copy} style={{ fontFamily: 'var(--mono)' }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

export default function Verify() {
  const [eid,     setEid]     = useState('784-1990-1234567-1');
  const [dob,     setDob]     = useState(dobFromAge(19));
  const [service, setService] = useState('Social Media');
  const [action,  setAction]  = useState('access');
  const [selectedKey, setSelectedKey] = useState(getApiKey());
  const [result,  setResult]  = useState(null);
  const [rateLimit, setRateLimit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    setApiKey(selectedKey);
    try {
      const age = ageFromDob(dob);
      const res = await verifyCompliance({
        user_eid:     eid,
        age,
        service_type: service,
        action,
      });
      setResult(res.data);
      setRateLimit({
        tier:      res.headers['x-ratelimit-tier'],
        used:      res.headers['x-ratelimit-used'],
        remaining: res.headers['x-ratelimit-remaining'],
        limit:     res.headers['x-ratelimit-limit'],
      });
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  const cfg = result ? (DECISION_CFG[result.decision] ?? DECISION_CFG.BLOCK) : null;

  return (
    <div>
      {/* Demo controls */}
      <div className="card">
        <div className="card-title">Demo Controls</div>
        <div className="row gap-sm">
          <span className="label">AGE</span>
          {AGE_PRESETS.map(age => (
            <button key={age} className="chip" onClick={() => setDob(dobFromAge(age))}>
              Age {age}
            </button>
          ))}
        </div>
        <div className="row gap-sm" style={{ marginTop: 8, borderTop: '1px solid var(--bd)', paddingTop: 8 }}>
          <span className="label">API KEY</span>
          {API_KEYS.map(k => (
            <button
              key={k.key}
              className={`chip ${selectedKey === k.key ? 'chip--active' : ''}`}
              onClick={() => setSelectedKey(k.key)}
            >
              {k.label} <span style={{ color: 'var(--tx3)', marginLeft: 4 }}>{k.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input form */}
      <div className="card">
        <div className="card-title">Compliance Check</div>
        <div className="field">
          <label>Emirates ID</label>
          <input value={eid} onChange={e => setEid(e.target.value)} placeholder="784-XXXX-XXXXXXX-X" />
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Date of Birth</label>
            <input type="date" value={dob} onChange={e => setDob(e.target.value)} />
          </div>
          <div className="field">
            <label>Calculated Age</label>
            <input value={`${ageFromDob(dob)} years`} readOnly style={{ opacity: .6 }} />
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>
              Service Type{' '}
              {HIGH_RISK.includes(service) && <span className="badge badge--warn">⚠ High-Risk</span>}
            </label>
            <select value={service} onChange={e => setService(e.target.value)}>
              {SERVICES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Action</label>
            <input value={action} onChange={e => setAction(e.target.value)} placeholder="access, register, apply…" />
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn btn--primary btn--full" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Verifying…' : '▶ Run Compliance Check'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <>
          {/* Decision */}
          <div className={`card result-card ${cfg.cls}`}>
            <div className="result-badge" style={{ color: cfg.color }}>{cfg.label}</div>
            <p className="result-reason">{result.reason}</p>
          </div>

          {/* Details grid */}
          <div className="grid-2">
            <div className="card">
              <div className="card-title">Laws Evaluated</div>
              <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--tx)' }}>
                {result.laws_evaluated}
              </div>
            </div>
            <div className="card">
              <div className="card-title">Triggered Rules</div>
              {result.triggered_rules.length === 0 ? (
                <span className="badge badge--green">None — all passed</span>
              ) : (
                <div className="row gap-sm" style={{ flexWrap: 'wrap' }}>
                  {result.triggered_rules.map(id => (
                    <span key={id} className="badge badge--red">{id}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Audit ID */}
          <div className="card">
            <div className="card-title">Audit ID (SHA-256)</div>
            <div className="row gap-sm" style={{ alignItems: 'flex-start' }}>
              <code className="hash" style={{ flex: 1, wordBreak: 'break-all' }}>
                {result.audit_id}
              </code>
              <CopyButton text={result.audit_id} />
            </div>
            <div className="text-muted" style={{ fontSize: 12, marginTop: 8 }}>
              {new Date(result.timestamp).toLocaleString()}
            </div>
          </div>

          {/* Rate limit */}
          {rateLimit?.tier && (
            <div className="card">
              <div className="card-title">Rate Limit</div>
              <div className="row gap-sm">
                <span className="badge badge--purple">{rateLimit.tier.toUpperCase()}</span>
                <span className="text-muted" style={{ fontSize: 12 }}>
                  {rateLimit.limit === 'Infinity' || rateLimit.limit === 'unlimited'
                    ? '∞ unlimited calls'
                    : `${rateLimit.remaining} / ${rateLimit.limit} remaining today`}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
