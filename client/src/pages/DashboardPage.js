import React, { useEffect, useState } from 'react';
import api from '../api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/api/dashboard')
      .then(res => setStats(res.data))
      .catch(console.error);
  }, []);

  if (!stats) return <p>Loading...</p>;

  return (
    <>
      <div className="card" style={{ display:'flex', gap:'16px' }}>
        <div>New Reports: {stats.newReports}</div>
        <div>Under Investigation: {stats.underInvestigation}</div>
        <div>Resolved: {stats.resolved}</div>
      </div>

      <h4>Recent Reports</h4>
      <table>
        <thead>
          <tr><th>Category</th><th>Description</th><th>Status</th></tr>
        </thead>
        <tbody>
          {stats.recentReports.map(r => (
            <tr key={r._id}>
              <td>{r.type}</td>
              <td>{r.description}</td>
              <td>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
