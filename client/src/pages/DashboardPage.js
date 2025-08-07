// client/src/pages/DashboardPage.js
import React, { useEffect, useState } from 'react';
import '../styles/Dashboard.css'; 
import api from '../api';

export default function DashboardPage() {
  const [stats, setStats] = useState({ new: 0, investigating: 0, resolved: 0 });
  const [reports, setReports] = useState([]);
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get('/api/dashboard');
        setStats(res.data.stats);
        setReports(res.data.recent);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      }
    }
    fetchData();
  }, []);
  

  return (
    <div className="dashboard-page">
      <h2>Dashboard</h2>

      <div className="dashboard-stats">
        <div className="stat-box blue">📝 <strong>{stats.new}</strong><br />New Reports</div>
        <div className="stat-box orange">🔍 <strong>{stats.investigating}</strong><br />Under Investigation</div>
        <div className="stat-box green">✅ <strong>{stats.resolved}</strong><br />Resolved</div>
      </div>

      <h3>Recent Reports</h3>
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Description</th>
            <th>Opposed</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r, i) => (
            <tr key={i}>
<td>{r.type}</td>
<td>{r.description}</td>
<td>{r.status}</td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
