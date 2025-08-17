// client/src/pages/MapPage.js
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import api from '../api';
import { API_BASE } from '../utils/config';
import 'leaflet/dist/leaflet.css';
import '../styles/Map.css';

const toSrc = (x) => {
  const p = typeof x === 'string' ? x : x?.url || '';
  return p ? (p.startsWith('http') ? p : `${API_BASE}${p}`) : '';
};

const deriveUrls = (p) => {
  if (Array.isArray(p?.photoUrls) && p.photoUrls.length) return p.photoUrls;      // /api/reports/:id/photo/:i
  if (Array.isArray(p?.attachments) && p.attachments.length) return p.attachments; // /uploads/...
  if (p?.previewUrl) return [p.previewUrl];
  if (p?.imageUrl) return [p.imageUrl];
  return [];
};

export default function MapPage() {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    api.get('/api/map/points')
      .then(res => setPoints(Array.isArray(res.data) ? res.data : []))
      .catch(console.error);
  }, []);

  const valid = (p) =>
    p?.location?.coordinates &&
    p.location.coordinates.lat != null &&
    p.location.coordinates.lng != null;

  return (
    <MapContainer center={[20, 0]} zoom={2} style={{ height: '80vh', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {points.filter(valid).map((p, i) => (
        <CircleMarker
          key={p._id || `${p.location.coordinates.lat},${p.location.coordinates.lng},${i}`}
          center={[p.location.coordinates.lat, p.location.coordinates.lng]}
          radius={7}
          fillOpacity={0.8}
          stroke={false}
        >
          <Popup maxWidth={380}>
            <PopupContent point={p} />
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

function PopupContent({ point }) {
  const [idx, setIdx] = useState(0);
  const urls = deriveUrls(point);
  const hasPhotos = urls.length > 0;

  const next = () => setIdx((idx + 1) % urls.length);
  const prev = () => setIdx((idx - 1 + urls.length) % urls.length);

  return (
    <div style={{ maxWidth: 380 }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{point.type || 'Incident'}</div>

      {hasPhotos && (
        <div style={{ marginBottom: 8, textAlign: 'center' }}>
          <img
            src={toSrc(urls[idx])}
            alt="evidence"
            style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }}
            onError={(e) => e.currentTarget.remove()}
          />
          {urls.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <button onClick={prev}>⟨ Prev</button>
              <span style={{ fontSize: 12 }}>{idx + 1}/{urls.length}</span>
              <button onClick={next}>Next ⟩</button>
            </div>
          )}
        </div>
      )}

      {point.description && <div style={{ fontSize: 13, marginBottom: 4 }}>{point.description}</div>}
      <div style={{ fontSize: 12, color: '#6B7A90' }}>
        {point.location?.address || '—'}
      </div>
      <div style={{ fontSize: 12, color: '#6B7A90' }}>
        {point.date ? new Date(point.date).toLocaleString() : ''}
      </div>
    </div>
  );
}
