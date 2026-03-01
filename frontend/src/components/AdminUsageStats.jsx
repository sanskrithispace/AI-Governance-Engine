import { useState, useEffect } from 'react';
import { adminGetUsage, adminGetAuditLog } from '../api';

function StatCard({ label, value, color }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 140, textAlign: 'center' }}>
      <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--mono)', color: color ?? 'var(--tx)' }}>
        {value}
      </div>
      <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function AdminUsageStats() {
  const [usage,     setUsage]     = useState([]);
  const [decisions, setDecisions] = useState([]);

  useEffect(() => {
    adminGetUsage().then(r => setUsage(r.data)).catch(() => {});
    adminGetAuditLog({ type: 'DECISION', limit: 200 }).then(r => setDecisions(r.data)).catch(() => {});
  }, []);

  const totalCalls      = usage.reduce((s, k) => s + k.used, 0);
  const activeCompanies = usage.filter(k => k.used > 0).length;

  const decisionCounts = decisions.reduce((acc, row) => {
    acc[row.decision] = (acc[row.decision] ?? 0) + 1;
    return acc;
  }, {});
  const topDecision = Object.entries(decisionCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Usage Overview</div>

      {/* Stat cards */}
      <div className="row gap-sm mb-md" style={{ flexWrap: 'wrap', alignItems: 'stretch' }}>
        <StatCard label="Total API Calls Today" value={totalCalls} color="var(--blue)" />
        <StatCard label="Total Verifications" value={decisions.length} color="var(--tx)" />
        <StatCard label="Active API Consumers" value={activeCompanies} color="var(--green)" />
        <StatCard
          label="Top Decision"
          value={topDecision ? topDecision[0] : '—'}
          color={topDecision?.[0] === 'ALLOW' ? 'var(--green)' : topDecision?.[0] === 'BLOCK' ? 'var(--red)' : 'var(--amber)'}
        />
      </div>

      {/* Decision breakdown */}
      {Object.keys(decisionCounts).length > 0 && (
        <div className="card mb-md">
          <div className="card-title">Decision Breakdown</div>
          {Object.entries(decisionCounts).map(([decision, count]) => {
            const pct = Math.round((count / decisions.length) * 100);
            const color = decision === 'ALLOW' ? 'var(--green)' : decision === 'BLOCK' ? 'var(--red)' : 'var(--amber)';
            return (
              <div key={decision} style={{ marginBottom: 10 }}>
                <div className="row-between" style={{ marginBottom: 4 }}>
                  <span className={`badge badge--${decision === 'ALLOW' ? 'green' : decision === 'BLOCK' ? 'red' : 'amber'}`}>{decision}</span>
                  <span className="text-muted" style={{ fontSize: 12 }}>{count} ({pct}%)</span>
                </div>
                <div className="usage-bar">
                  <div className="usage-bar-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Per-key usage */}
      <div className="card">
        <div className="card-title">Per-Key API Usage (Today)</div>
        {usage.map(k => (
          <div key={k.key} className="row-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--bd)' }}>
            <code style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{k.key}</code>
            <span className="text-muted" style={{ fontSize: 12 }}>
              {k.used} / {k.limit === 'unlimited' ? '∞' : k.limit} calls
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
