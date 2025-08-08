import React, { useEffect, useState } from 'react';
import axios from '../../services/api';
import './Profile.css';

const Profile = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get('/auth/profile');
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };
    fetchProfile();
  }, []);

  if (!profile) return <p>Loading...</p>;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="avatar-section">
          <img
            src={profile.avatar || '/default-avatar.png'}
            alt="avatar"
            className="avatar"
          />
        </div>
        <div className="profile-info">
          <h2>{profile.name || 'No name set'}</h2>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Role:</strong> {profile.role}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
