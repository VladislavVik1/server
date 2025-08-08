import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';

export default function RequireRole({ allow = [], children }) {
  const [role, setRole] = useState(null);   // null = загрузка, '' = ошибка/гость

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/api/auth/profile');
        if (mounted) setRole(data.role || '');
      } catch {
        if (mounted) setRole('');
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (role === null) return <div className="panel"><div className="panel-title">Loading…</div><div className="p-pad">Checking permissions…</div></div>;
  if (!allow.includes(role)) return <Navigate to="/dashboard" replace />;

  return children;
}
