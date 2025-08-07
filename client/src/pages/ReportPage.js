import React, { useState } from 'react';
import api from '../api';

export default function ReportPage() {
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async e => {
    e.preventDefault();
    try {
      await api.post('/api/reports', { type, description, location });
      setMsg('Report submitted!');
    } catch (err) {
      setMsg('Error submitting');
    }
  };

  return (
    <form className="card" onSubmit={submit} style={{ maxWidth: 600 }}>
      <h3>Report Crime</h3>
      {msg && <p>{msg}</p>}
      <input placeholder="Category" value={type} onChange={e=>setType(e.target.value)} />
      <textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
      <input placeholder="Location" value={location} onChange={e=>setLocation(e.target.value)} />
      <button type="submit">Submit</button>
    </form>
  );
}
