import { useState, useEffect } from 'react';
import { getLaws, addLaw, updateLaw } from '../api';

const CONDITIONS = [
  { value: 'age_lt',            label: 'age < threshold' },
  { value: 'age_gte',           label: 'age ≥ threshold' },
  { value: 'high_risk_age_gte', label: 'high-risk service & age ≥ threshold' },
];

const EMPTY = { id: '', name: '', cond: 'age_lt', threshold: 13, action: 'BLOCK', version: 'v1.0', ref: '' };

function LawForm({ initial, onSave, onCancel }) {
  // v1 API returns `condition`/`reference`; mutations still use `cond`/`ref`
  const [form, setForm] = useState(
    initial
      ? { ...initial, cond: initial.condition ?? initial.cond, ref: initial.reference ?? initial.ref }
      : EMPTY
  );
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="card-title">{initial ? `Edit ${initial.id}` : 'New Law'}</div>
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
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Under X — Description" />
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

export default function LawRegistry() {
  const [laws,    setLaws]    = useState([]);
  const [editing, setEditing] = useState(null);
  const [adding,  setAdding]  = useState(false);

  async function load() {
    const { data } = await getLaws();
    setLaws(data);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(form) {
    await addLaw(form);
    setAdding(false);
    load();
  }

  async function handleEdit(form) {
    await updateLaw(form.id, { ...form, active: 1 });
    setEditing(null);
    load();
  }

  async function handleDisable(law) {
    await updateLaw(law.id, {
      name:      law.name,
      cond:      law.condition,
      threshold: law.threshold,
      action:    law.action,
      active:    0,
      version:   law.version,
      ref:       law.reference,
    });
    load();
  }

  const active   = laws.filter(l => l.active);
  const inactive = laws.filter(l => !l.active);

  return (
    <div>
      <div className="row-between mb-md">
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Law Registry</div>
          <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
            {active.length} active · {inactive.length} inactive · {laws.length} total
          </div>
        </div>
        <button className="btn" onClick={() => { setAdding(v => !v); setEditing(null); }}>
          + Add Law
        </button>
      </div>

      {adding  && <LawForm onSave={handleAdd}  onCancel={() => setAdding(false)} />}
      {editing && <LawForm initial={editing} onSave={handleEdit} onCancel={() => setEditing(null)} />}

      <div className="card">
        {laws.length === 0 && <p className="text-muted">No laws found.</p>}
        {laws.map(law => (
          <div key={law.id} className={`law-row ${!law.active ? 'law-row--disabled' : ''}`}>
            {/* Active indicator */}
            <span
              style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: law.active ? 'var(--green)' : 'var(--tx3)',
              }}
            />
            <span className="mono text-muted" style={{ minWidth: 76, fontSize: 12 }}>{law.id}</span>
            <span style={{ flex: 1 }}>{law.name}</span>
            {/* Condition chip */}
            <span className="badge" style={{ background: 'var(--sf3)', color: 'var(--tx2)', fontFamily: 'var(--mono)', fontSize: 10 }}>
              {law.condition} &lt; {law.threshold}
            </span>
            {/* Reference */}
            <span className="mono text-muted" style={{ fontSize: 10, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {law.reference}
            </span>
            {/* Action badge */}
            <span className={`badge badge--${law.action === 'BLOCK' ? 'red' : law.action === 'REQUIRE_CONSENT' ? 'amber' : 'green'}`}>
              {law.action}
            </span>
            {/* Controls */}
            {law.active ? (
              <div className="row gap-sm">
                <button className="chip chip--sm" onClick={() => { setEditing(law); setAdding(false); }}>Edit</button>
                <button className="chip chip--sm" onClick={() => handleDisable(law)}>Disable</button>
              </div>
            ) : (
              <span className="text-muted" style={{ fontSize: 11 }}>inactive</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
