import React, { useState } from 'react';
import api from '../api';

export default function ReportPage() {
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState(null); // 👈 нове поле
  const [msg, setMsg] = useState('');

  const submit = async e => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('type', type);
    formData.append('description', description);
    formData.append('location', location); // можна лишити як string
    if (image) {
      formData.append('image', image);
    }

    try {
      await api.post('/api/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setMsg('Report submitted!');
    } catch (err) {
      console.error(err.response?.data || err.message);
      setMsg('Error submitting');
    }
  };

  return (
    <form className="card" onSubmit={submit} style={{ maxWidth: 600 }}>
      <h3>Report Crime</h3>
      {msg && <p>{msg}</p>}

      <input
        placeholder="Category"
        value={type}
        onChange={e => setType(e.target.value)}
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />

      <input
        placeholder="Location"
        value={location}
        onChange={e => setLocation(e.target.value)}
      />

      <input
        type="file"
        accept="image/*"
        onChange={e => setImage(e.target.files[0])}
      />

      <button type="submit">Submit</button>
    </form>
  );
}
