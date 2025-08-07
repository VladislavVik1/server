import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import api from '../api';
import 'leaflet/dist/leaflet.css';

export default function MapPage() {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    api.get('/api/map-data')
      .then(res => setPoints(res.data))
      .catch(console.error);
  }, []);

  return (
    <MapContainer center={[0,0]} zoom={2} style={{ height:'80vh', width:'100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {points.map((p,i) => (
        <CircleMarker
          key={i}
          center={[p.lat, p.lng]}
          radius={5}
          fillOpacity={p.intensity}
          stroke={false}
        />
      ))}
    </MapContainer>
  );
}
