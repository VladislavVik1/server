import React, { useEffect, useRef, useState } from 'react';
import api from '../api';
import StatusToggle from '../components/Report/StatusToggle';
import { API_BASE } from '../utils/config';
import '../styles/moderation.css';

const FILTERS = [
  { v: 'pending', label: 'Pending' },
  { v: 'approved', label: 'Approved' },
  { v: 'rejected', label: 'Denied' },
  { v: 'closed', label: 'Closed' },
  { v: 'all', label: 'All' },
];

export default function ModerationPage() {
  const [items, setItems] = useState([]);
  const [role, setRole] = useState('');
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState('pending');
  const prevIdsRef = useRef(new Set());

  const imgSrc = (url) => (!url ? '' : (url.startsWith('http') ? url : `${API_BASE}${url}`));

  const loadList = async (curFilter = filter) => {
    const res = await api.get(`/api/reports/moderation?status=${curFilter}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    const list = Array.isArray(res.data) ? res.data : [];


    const newIds = new Set(list.map(x => x._id));
    let added = 0;
    for (const id of newIds) if (!prevIdsRef.current.has(id)) added++;
    if (added > 0 && (filter === 'pending' || filter === 'all')) {
      setToast(`New ${filter} reports: +${added}`);
      setTimeout(() => setToast(''), 2500);
    }
    prevIdsRef.current = newIds;

    setItems(list);
  };

  useEffect(() => {
    api.get('/api/auth/profile', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => setRole(r.data.role))
      .catch(() => setRole(''));

    loadList().catch(console.error);
    const t = setInterval(() => loadList().catch(console.error), 12000);
    return () => clearInterval(t);

  }, []);

  useEffect(() => {
    loadList(filter).catch(console.error);

  }, [filter]);

  const handleChanged = (id, status) => {
    if (filter === 'pending' && status !== 'pending') {
      setItems(prev => prev.filter(x => x._id !== id));
      prevIdsRef.current.delete(id);
    } else {
      setItems(prev => prev.map(x => x._id === id ? { ...x, status } : x));
    }
  };

  if (role !== 'admin' && role !== 'responder') {
    return (
      <div className="panel">
        <div className="panel-title">Moderation</div>
        <div className="p-pad">Access denied</div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-title">
        Reports Moderation
        <span className="muted" style={{ marginLeft: 8 }}>(filter: {filter})</span>
      </div>

      <div className="mod-toolbar">
        <div className="mod-filters">
          {FILTERS.map(f => (
            <button
              key={f.v}
              className={`mf-btn ${filter === f.v ? 'active' : ''}`}
              onClick={() => setFilter(f.v)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {toast && <div className="mod-toast">{toast}</div>}

      <div className="mod-list">
        {items.length === 0 && <div className="p-pad">Нет отчётов</div>}
        {items.map(r => (
          <div className="mod-item" key={r._id}>
            <div className="mod-head">
              <b>{r.type || 'Incident'}</b>
              <span className={`badge ${r.status}`}>{r.status}</span>
            </div>

            <div className="mod-meta">
              <div className="mono">ID: {r._id}</div>
            </div>

            <div className="mod-body">
              <div className="mod-col">
                <div className="line"><span>Submitted:</span> {r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</div>
                <div className="line"><span>Incident date:</span> {r.date ? new Date(r.date).toLocaleString() : '-'}</div>
                <div className="line"><span>Address:</span> {r.location?.address || '-'}</div>
                <div className="line"><span>Description:</span> {r.description || '-'}</div>

                {(r.issuerFirst || r.issuerLast) && (
                  <div className="line"><span>Issued by:</span> {[r.issuerFirst, r.issuerLast].filter(Boolean).join(' ')}</div>
                )}
                {(r.suspectFirst || r.suspectLast) && (
                  <div className="line"><span>Suspect:</span> {[r.suspectFirst, r.suspectLast].filter(Boolean).join(' ')}</div>
                )}
                {r.suspectAware && (
                  <div className="line"><span>Suspect aware / charges:</span> {r.suspectAware}</div>
                )}
                {r.arrestsSoFar && (
                  <div className="line"><span>Arrests so far:</span> {r.arrestsSoFar}</div>
                )}
                {r.comments && (
                  <div className="line"><span>Comments:</span> {r.comments}</div>
                )}
              </div>

              <div className="mod-col">
                {r.imageUrl && (
                  <img src={imgSrc(r.imageUrl)} alt="evidence" className="mod-img" />
                )}
              </div>
            </div>

            <StatusToggle report={r} onChanged={handleChanged} />
          </div>
        ))}
      </div>
    </div>
  );
}
