import { useState, useEffect } from 'react';
import { adminGetLaws, adminCreateLaw, adminUpdateLaw, adminDeleteLaw } from '../api';

const EMPTY = { id: '', name: '', cond: 'age_lt', threshold: 13, action: 'BLOCK', version: 'v1.0', ref: '' };

const CONDITIONS = [
  { value: 'age_lt',            label: 'age < threshold' },
  { value: 'age_gte',           label: 'age ≥ threshold' },
  { value: 'high_risk_age_gte', label: 'high-risk & age ≥ threshold' },
];

function LawForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? { ...initial } : EMPTY);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="card" style={{ marginBottom: 12, borderColor: 'var(--blue)' }}>
      <div className="card-title">{initial ? `Editing ${initial.id}` : 'Add New Law'}</div>
      <div className="grid-2">
        <div className="field">
          <label>ID</label>
          <input value={form.id} onChange={e => set('id', e.target.value)} disabled={!!initial} placeholder="LAW-008" />
        </div>
        <div className="field">
          <label>Version</label>
          <input value={form.version} onChange={e => set('version', e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Name</label>
        <input value={form.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Condition</label>
          <select value={form.cond} onChange={e => set('cond', e.target.value)}>
            {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Threshold (age)</label>
          <input type="number" value={form.threshold} min={0} max={99}
            onChange={e => set('threshold', +e.target.value)} />
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Action</label>
          <select value={form.action} onChange={e => set('action', e.target.value)}>
            <option value="BLOCK">BLOCK</option>
            <option value="REQUIRE_CONSENT">REQUIRE_CONSENT</option>
            <option value="ALLOW">ALLOW</option>
          </select>
        </div>
        <div className="field">
          <label>Legal Reference</label>
          <input value={form.ref} onChange={e => set('ref', e.target.value)} placeholder="UAE Decree-Law …" />
        </div>
      </div>
      <div className="row gap-sm">
        <button className="btn btn--primary" onClick={() => onSave(form)}>💾 Save</button>
        <button className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default function AdminLawManager() {
  const [laws,    setLaws]    = useState([]);
  const [editing, setEditing] = useState(null);
  const [adding,  setAdding]  = useState(false);
  const [msg,     setMsg]     = useState(null);

  async function load() {
    const { data } = await adminGetLaws();
    setLaws(data);
  }

  useEffect(() => { load(); }, []);

  function flash(text) { setMsg(text); setTimeout(() => setMsg(null), 3000); }

  async function handleCreate(form) {
    await adminCreateLaw(form);
    setAdding(false);
    flash(`Law ${form.id} added.`);
    load();
  }

  async function handleEdit(form) {
    await adminUpdateLaw(form.id, { ...form, active: 1 });
    setEditing(null);
    flash(`Law ${form.id} updated.`);
    load();
  }

  async function handleDeactivate(law) {
    await adminDeleteLaw(law.id);
    flash(`Law ${law.id} deactivated.`);
    load();
  }

  const active   = laws.filter(l => l.active);
  const inactive = laws.filter(l => !l.active);

  return (
    <div>
      <div className="row-between mb-md">
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Law Manager</div>
          <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
            {active.length} active · {inactive.length} inactive
          </div>
        </div>
        <button className="btn" onClick={() => { setAdding(v => !v); setEditing(null); }}>
          + Add Law
        </button>
      </div>

      {msg && (
        <div className="banner banner--green" style={{ marginBottom: 12 }}>{msg}</div>
      )}

      {adding  && <LawForm onSave={handleCreate} onCancel={() => setAdding(false)} />}
      {editing && <LawForm initial={editing} onSave={handleEdit} onCancel={() => setEditing(null)} />}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Status</th>
              <th>ID</th>
              <th>Name</th>
              <th>Condition</th>
              <th>Action</th>
              <th>Reference</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {laws.map(law => (
              <tr key={law.id} style={{ opacity: law.active ? 1 : 0.4 }}>
                <td>
                  <span style={{ fontSize: 8, color: law.active ? 'var(--green)' : 'var(--tx3)' }}>⬤</span>
                </td>
                <td className="mono" style={{ fontSize: 12 }}>{law.id}</td>
                <td>{law.name}</td>
                <td className="mono" style={{ fontSize: 11 }}>{law.cond} {law.threshold}</td>
                <td>
                  <span className={`badge badge--${law.action === 'BLOCK' ? 'red' : law.action === 'REQUIRE_CONSENT' ? 'amber' : 'green'}`}>
                    {law.action}
                  </span>
                </td>
                <td className="text-muted" style={{ fontSize: 11 }}>{law.ref}</td>
                <td>
                  {law.active ? (
                    <div className="row gap-sm">
                      <button className="chip chip--sm" onClick={() => { setEditing(law); setAdding(false); }}>Edit</button>
                      <button className="chip chip--sm" onClick={() => handleDeactivate(law)}>Deactivate</button>
                    </div>
                  ) : (
                    <span className="text-muted" style={{ fontSize: 11 }}>inactive</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
