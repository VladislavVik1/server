import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../styles/Profile.css'; // если нужны стили

const Profile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/auth/profile');
        setUser(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      }
    };

    fetchProfile();
  }, []);

  if (error) {
    return <div className="profile-error">{error}</div>;
  }

  if (!user) {
    return <div className="profile-loading">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <h2>Your Profile</h2>
      <div className="profile-info">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>ID:</strong> {user._id}</p>
      </div>
    </div>
  );
};

export default Profile;
