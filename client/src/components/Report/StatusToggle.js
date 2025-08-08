import React, { useState } from 'react';
import api from '../../api';

export default function StatusToggle({ report, onChanged }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const setStatus = async (status) => {
    setErr('');
    setLoading(true);
    try {
      await api.put(`/api/reports/${report._id}/status`, { status });
      onChanged?.(report._id, status); // <-- передаём и id, и статус
    } catch (e) {
      setErr(e?.response?.data?.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="status-toggle">
      <button disabled={loading} onClick={() => setStatus('approved')} className="btn ok">Approve</button>
      <button disabled={loading} onClick={() => setStatus('denied')} className="btn warn">Deny</button>
      <button disabled={loading} onClick={() => setStatus('pending')} className="btn">Reset</button>
      <button disabled={loading} onClick={() => setStatus('closed')} className="btn danger">Close</button>
      {err && <div className="err">{err}</div>}
    </div>
  );
}
