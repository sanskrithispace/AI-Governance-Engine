import { useState, useEffect } from 'react';
import { getAuditLog } from '../api';

const DECISION_COLOR = {
  ALLOW:           'green',
  BLOCK:           'red',
  REQUIRE_CONSENT: 'amber',
  RESTRICT:        'yellow',
};

function fmt(ts) {
  return ts ? new Date(ts).toLocaleString() : '—';
}

export default function AuditLog() {
  const [rows,    setRows]    = useState([]);
  const [limit,   setLimit]   = useState(10);
  const [loading, setLoading] = useState(false);

  async function load(n) {
    setLoading(true);
    try {
      const { data } = await getAuditLog(n);
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(limit); }, [limit]);

  return (
    <div>
      <div className="row-between mb-md">
        <div style={{ fontSize: 16, fontWeight: 600 }}>Recent Compliance Decisions</div>
        <div className="row gap-sm">
          {[10, 25, 50].map(n => (
            <button
              key={n}
              className={`chip ${limit === n ? 'chip--active' : ''}`}
              onClick={() => setLimit(n)}
            >
              Last {n}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading && <p className="text-muted">Loading…</p>}
        {!loading && rows.length === 0 && (
          <p className="text-muted">No decisions recorded yet. Run a compliance check first.</p>
        )}
        {!loading && rows.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Decision</th>
                <th>User (masked)</th>
                <th>Service</th>
                <th>Audit ID</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td>
                    <span className={`badge badge--${DECISION_COLOR[row.decision] ?? 'red'}`}>
                      {row.decision}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>{row.user}</td>
                  <td>{row.service_type}</td>
                  <td className="hash" style={{ fontSize: 10, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.audit_id?.slice(0, 16)}…
                  </td>
                  <td className="text-muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {fmt(row.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-muted" style={{ fontSize: 12, textAlign: 'center' }}>
        Each row is a SHA-256-linked entry in the tamper-evident audit chain.{' '}
        Full hash available via <code>GET /api/v1/audit-log</code>.
      </p>
    </div>
  );
}
