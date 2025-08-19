import React, { useState } from 'react';
import api from '../../services/api';

const ReportForm = () => {
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reports', { type, description, location });
      alert('Report submitted successfully!');
      setType('');
      setDescription('');
      setLocation('');
    } catch {
      alert('Failed to submit report.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={type}
        onChange={(e) => setType(e.target.value)}
        placeholder="Type of Crime"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        required
      />
      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location"
      />
      <button type="submit">Submit Report</button>
    </form>
  );
};

export default ReportForm;
