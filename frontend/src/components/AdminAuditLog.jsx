import { useState, useEffect } from 'react';
import { adminGetAuditLog } from '../api';

const TYPE_COLOR = {
  DECISION: 'blue',
  ALERT:    'red',
  EXPIRY:   'green',
  CHANGE:   'purple',
};

const ALL_TYPES = ['', 'DECISION', 'ALERT', 'EXPIRY', 'CHANGE'];

function fmt(ts) {
  return ts ? new Date(ts).toLocaleString() : '—';
}

export default function AdminAuditLog() {
  const [rows,    setRows]    = useState([]);
  const [type,    setType]    = useState('');
  const [limit,   setLimit]   = useState(50);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await adminGetAuditLog({ type: type || undefined, limit });
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [type, limit]);

  return (
    <div>
      <div className="row-between mb-md">
        <div style={{ fontSize: 16, fontWeight: 600 }}>Audit Log</div>
        <div className="row gap-sm">
          {ALL_TYPES.map(t => (
            <button key={t || 'all'} className={`chip ${type === t ? 'chip--active' : ''}`} onClick={() => setType(t)}>
              {t || 'All'}
            </button>
          ))}
          <select
            value={limit}
            onChange={e => setLimit(+e.target.value)}
            style={{ padding: '4px 8px', fontSize: 12, background: 'var(--sf2)', border: '1px solid var(--bd)', color: 'var(--tx)', borderRadius: 4 }}
          >
            {[25, 50, 100, 200].map(n => <option key={n} value={n}>Last {n}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        {loading && <p className="text-muted">Loading…</p>}
        {!loading && rows.length === 0 && <p className="text-muted">No records found.</p>}
        {!loading && rows.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Decision</th>
                <th>User</th>
                <th>Service</th>
                <th>Detail</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td>
                    <span className={`badge badge--${TYPE_COLOR[row.type] ?? 'purple'}`}>{row.type}</span>
                  </td>
                  <td>
                    {row.decision && (
                      <span className={`badge badge--${row.decision === 'ALLOW' ? 'green' : row.decision === 'REQUIRE_CONSENT' ? 'amber' : 'red'}`}>
                        {row.decision}
                      </span>
                    )}
                  </td>
                  <td className="mono" style={{ fontSize: 11 }}>{row.eid ?? '—'}</td>
                  <td style={{ fontSize: 12 }}>{row.svc ?? '—'}</td>
                  <td className="text-muted" style={{ fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.detail ?? '—'}
                  </td>
                  <td className="text-muted" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmt(row.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
