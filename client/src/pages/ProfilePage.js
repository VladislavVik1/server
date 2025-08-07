// client/src/pages/ProfilePage.js
import React, { useEffect, useState } from 'react';
import api from '../api';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/api/auth/profile')
      .then((res) => setProfile(res.data))
      .catch((err) => {
        console.error(err);
        setError('Не удалось загрузить профиль');
      });
  }, []);

  if (error) return <div>{error}</div>;
  if (!profile) return <div>Загрузка...</div>;

  return (
    <div className="profile-page">
      <h2>Профиль</h2>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Роль:</strong> {profile.role}</p>
      <p><strong>ID:</strong> {profile._id}</p>
    </div>
  );
};

export default ProfilePage;
