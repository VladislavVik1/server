import React, { useState } from 'react';
import api from '../api';
import '../styles/ReportPage.css';

export default function ReportPage() {
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');   
  const [image, setImage] = useState(null);
  const [msg, setMsg] = useState('');

  const submit = async e => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('type', type);
    formData.append('description', description);
    formData.append('location', location); 
    formData.append('date', date);   
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
    <form className="report-form" onSubmit={submit}>
      <h3>Report Crime</h3>
      {msg && <p>{msg}</p>}
      <input placeholder="Type of Crime" value={type} onChange={e => setType(e.target.value)} />
      <input placeholder="Date" value={date} onChange={e => setDate(e.target.value)} />
      <input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
      <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
      <button type="submit">Submit</button>
    </form>
  );
}
