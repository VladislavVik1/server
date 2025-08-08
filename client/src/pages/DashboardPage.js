import React, { useEffect, useState } from 'react';
import ReportModal from '../components/Report/ReportModal';
import api from '../api';
import '../styles/Dashboard.css';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    counters: { total: 0, pending: 0, approved: 0, rejected: 0 },
    recent: [],
    byType: [],
    last7days: []
  });

  // 👇 состояние модалки
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/api/dashboard/summary', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (mounted) setData(data);
      } catch (e) {
        console.error(e?.response?.data || e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // 👇 загрузка полного отчёта по клику
  const openDetails = async (id) => {
    try {
      setFetching(true);
      const { data } = await api.get(`/api/reports/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSelectedReport(data);
      setModalOpen(true);
    } catch (e) {
      console.error(e?.response?.data || e.message);
    } finally {
      setFetching(false);
    }
  };

  if (loading) return <div className="db-wrap"><div className="db-card">Loading…</div></div>;

  return (
    <div className="db-wrap">
      <div className="db-grid4">
        <div className="db-card stat">
          <div className="stat-title">Total Reports</div>
          <div className="stat-num">{data.counters.total}</div>
        </div>
        <div className="db-card stat">
          <div className="stat-title">Pending</div>
          <div className="stat-num">{data.counters.pending}</div>
        </div>
        <div className="db-card stat">
          <div className="stat-title">Approved</div>
          <div className="stat-num">{data.counters.approved}</div>
        </div>
        <div className="db-card stat">
          <div className="stat-title">Rejected</div>
          <div className="stat-num">{data.counters.rejected}</div>
        </div>
      </div>

      <div className="db-grid2">
        <div className="db-card">
          <div className="db-card-title">Crime by Type</div>
          {data.byType.length === 0 ? (
            <div className="db-empty">No data</div>
          ) : (
            <ul className="db-list">
              {data.byType.map((t, i) => (
                <li key={i}>
                  <span>{t.type || '—'}</span>
                  <b>{t.count}</b>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="db-card">
          <div className="db-card-title">Reports (Last 7 days)</div>
          {data.last7days.length === 0 ? (
            <div className="db-empty">No data</div>
          ) : (
            <ul className="db-list">
              {data.last7days.map((d, i) => (
                <li key={i}>
                  <span>{d.date}</span>
                  <b>{d.count}</b>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="db-card">
        <div className="db-card-title">Recent Reports</div>
        {data.recent.length === 0 ? (
          <div className="db-empty">No recent reports</div>
        ) : (
          <table className="db-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Status</th>
                <th>Address</th>
                <th></th> {/* кнопка View */}
              </tr>
            </thead>
            <tbody>
              {data.recent.map(r => (
                <tr key={r._id}>
                  <td>{new Date(r.createdAt).toLocaleString()}</td>
                  <td>{r.type}</td>
                  <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                  <td>{r.location?.address || '—'}</td>
                  <td>
                    <button
                      className="linkbtn"
                      onClick={() => openDetails(r._id)}
                      disabled={fetching}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* модалка */}
      {modalOpen && (
        <ReportModal report={selectedReport} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
