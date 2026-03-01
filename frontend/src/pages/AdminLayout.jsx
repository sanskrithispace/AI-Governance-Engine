const NAV_ITEMS = [
  { id: 'usage',    label: '📊 Usage Stats' },
  { id: 'laws',     label: '⚖ Law Manager'  },
  { id: 'audit',    label: '🔍 Audit Log'    },
  { id: 'api-keys', label: '🔑 API Keys'     },
];

export default function AdminLayout({ children, subPage, setSubPage, onLogout }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top bar */}
      <div className="admin-topbar">
        <span className="admin-brand">
          law-as-code &nbsp;<span style={{ color: 'var(--red)', fontWeight: 400 }}>/ admin</span>
        </span>
        <button className="btn" onClick={onLogout} style={{ fontSize: 12 }}>
          Sign out
        </button>
      </div>

      {/* Body */}
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`admin-nav-item ${subPage === item.id ? 'admin-nav-item--active' : ''}`}
              onClick={() => setSubPage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}
