import { useState, useEffect } from 'react';
import { adminGetUsage } from '../api';

const KEY_META = {
  key_free_demo:       { company: 'Demo Platform',  description: 'Free tier — 10 calls/day' },
  key_pro_demo:        { company: 'Social App Inc.', description: 'Pro tier — 1,000 calls/day' },
  key_enterprise_demo: { company: 'MegaCorp Ltd.',   description: 'Enterprise — unlimited' },
};

const TIER_COLOR = { free: 'tx2', pro: 'blue', enterprise: 'purple' };

function UsageBar({ used, limit }) {
  if (limit === 'unlimited') {
    return <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 4 }}>∞ unlimited</div>;
  }
  const pct = Math.min((used / limit) * 100, 100);
  const fillClass = pct >= 90 ? 'usage-bar-fill--danger' : pct >= 70 ? 'usage-bar-fill--warn' : '';
  return (
    <>
      <div className="usage-bar">
        <div className={`usage-bar-fill ${fillClass}`} style={{ width: `${pct}%` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--tx3)', marginTop: 3 }}>
        <span>{used} used</span>
        <span>{limit - used} remaining</span>
      </div>
    </>
  );
}

export default function AdminAPIKeys() {
  const [keys, setKeys] = useState([]);

  useEffect(() => {
    adminGetUsage().then(r => setKeys(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>API Keys</div>

      {keys.map(k => {
        const meta  = KEY_META[k.key] ?? { company: k.key, description: '' };
        const color = TIER_COLOR[k.tier] ?? 'tx2';
        return (
          <div key={k.key} className="card" style={{ marginBottom: 12 }}>
            <div className="row-between" style={{ marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{meta.company}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>{meta.description}</div>
              </div>
              <span className={`badge badge--${color === 'tx2' ? 'green' : color}`} style={{ textTransform: 'uppercase' }}>
                {k.tier}
              </span>
            </div>

            <code style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--tx3)', display: 'block', marginBottom: 8 }}>
              {k.key}
            </code>

            <UsageBar used={k.used} limit={k.limit} />

            {k.reset_at && (
              <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 4 }}>
                Resets: {new Date(k.reset_at).toLocaleTimeString()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
