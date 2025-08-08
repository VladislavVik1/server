import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import api from '../api';
import { API_BASE } from '../utils/config';
import 'leaflet/dist/leaflet.css';
import '../styles/Map.css';

export default function MapPage() {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    api.get('/api/map/points')
      .then(res => setPoints(res.data))
      .catch(console.error);
  }, []);

  const valid = p => p?.location?.coordinates?.lat && p?.location?.coordinates?.lng;

  return (
    <MapContainer center={[20, 0]} zoom={2} style={{ height: '80vh', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {points.filter(valid).map((p, i) => (
        <CircleMarker
          key={p._id || i}
          center={[p.location.coordinates.lat, p.location.coordinates.lng]}
          radius={7}
          fillOpacity={0.8}
          stroke={false}
        >
          <Popup>
            <div style={{ maxWidth: 260 }}>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>{p.type || 'Incident'}</div>
              {p.imageUrl && (
                <img
                  src={`${API_BASE}${p.imageUrl}`}
                  alt="evidence"
                  style={{ width: '100%', borderRadius: 8, marginBottom: 6, display: 'block' }}
                />
              )}
              <div style={{ fontSize: 13, marginBottom: 4 }}>{p.description || '—'}</div>
              <div style={{ fontSize: 12, color: '#6B7A90' }}>
                {p.location?.address || '—'}
              </div>
              <div style={{ fontSize: 12, color: '#6B7A90' }}>
                {p.date ? new Date(p.date).toLocaleString() : ''}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
