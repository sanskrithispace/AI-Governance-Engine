import { useState } from 'react';
import Verify from './pages/Verify';
import LawRegistry from './pages/LawRegistry';
import AuditLog from './pages/AuditLog';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

const PAGES = [
  { id: 'verify', label: '① Verify' },
  { id: 'laws',   label: '② Law Registry' },
  { id: 'audit',  label: '③ Audit Log' },
];

export default function App() {
  const [page, setPage] = useState('verify');

  const isAdmin = page === 'admin' || page === 'admin-dashboard';

  return (
    <>
      {!isAdmin && (
        <nav className="nav">
          <div className="nav-inner">
            <span className="nav-brand">law-as-code</span>
            {PAGES.map(p => (
              <button
                key={p.id}
                className={`nav-tab nav-tab--${p.id} ${page === p.id ? 'nav-tab--active' : ''}`}
                onClick={() => setPage(p.id)}
              >
                {p.label}
              </button>
            ))}
            <button
              className="nav-tab nav-tab--admin"
              style={{ marginLeft: 'auto' }}
              onClick={() => setPage('admin')}
            >
              ⚙ Admin
            </button>
          </div>
        </nav>
      )}

      {!isAdmin && (
        <main className="page">
          {page === 'verify' && <Verify />}
          {page === 'laws'   && <LawRegistry />}
          {page === 'audit'  && <AuditLog />}
        </main>
      )}

      {page === 'admin'           && <AdminLogin onSuccess={() => setPage('admin-dashboard')} />}
      {page === 'admin-dashboard' && <AdminDashboard onLogout={() => setPage('verify')} />}
    </>
  );
}
