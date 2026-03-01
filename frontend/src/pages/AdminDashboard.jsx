import { useState } from 'react';
import AdminLayout from './AdminLayout';
import AdminUsageStats from '../components/AdminUsageStats';
import AdminLawManager from '../components/AdminLawManager';
import AdminAuditLog from '../components/AdminAuditLog';
import AdminAPIKeys from '../components/AdminAPIKeys';
import { clearAdminToken } from '../api';

export default function AdminDashboard({ onLogout }) {
  const [subPage, setSubPage] = useState('usage');

  function handleLogout() {
    clearAdminToken();
    onLogout();
  }

  return (
    <AdminLayout subPage={subPage} setSubPage={setSubPage} onLogout={handleLogout}>
      {subPage === 'usage'    && <AdminUsageStats />}
      {subPage === 'laws'     && <AdminLawManager />}
      {subPage === 'audit'    && <AdminAuditLog />}
      {subPage === 'api-keys' && <AdminAPIKeys />}
    </AdminLayout>
  );
}
