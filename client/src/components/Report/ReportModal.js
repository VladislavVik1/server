import React from 'react';
import { API_BASE } from '../../utils/config';
import './ReportModal.css';

export default function ReportModal({ report, onClose }) {
  if (!report) return null;
  return (
    <div className="rm-backdrop" onClick={onClose}>
      <div className="rm-card" onClick={(e)=>e.stopPropagation()}>
        <div className="rm-head">
          <div className="rm-title">{report.type || 'Incident'}</div>
          <button className="rm-close" onClick={onClose}>×</button>
        </div>

        {report.imageUrl && (
          <img className="rm-img" src={`${API_BASE}${report.imageUrl}`} alt="evidence" />
        )}

        <div className="rm-grid">
          <div><span>Submitted:</span> {report.createdAt ? new Date(report.createdAt).toLocaleString() : '—'}</div>
          <div><span>Incident date:</span> {report.date ? new Date(report.date).toLocaleString() : '—'}</div>
          <div><span>Status:</span> {report.status}</div>
          <div><span>Address:</span> {report.location?.address || '—'}</div>
        </div>

        {report.description && (
          <div className="rm-section">
            <div className="rm-label">Details</div>
            <div className="rm-text">{report.description}</div>
          </div>
        )}
      </div>
    </div>
  );
}
