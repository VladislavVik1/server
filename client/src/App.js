import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import ReportPage from './pages/ReportPage';
import ProfilePage from './pages/ProfilePage';
import ModerationPage from './pages/ModerationPage';
import { setAuthToken } from './api';
import api from './api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      setAuthToken(token);

      // Загружаем роль пользователя
      api.get('/api/auth/profile')
        .then(res => setRole(res.data.role))
        .catch(() => setRole(''));

      navigate('/dashboard');
    }
  }, [token]);

  const handleLogin = (tok) => {
    localStorage.setItem('token', tok);
    setToken(tok);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setRole('');
    navigate('/login');
  };

  return (
    <div className="app">
      {token && <Sidebar onLogout={handleLogout} role={role} />}
      <main className="content">
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage onLogin={handleLogin} />} />

          {/* Приватные маршруты */}
          {token ? (
            <>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              {role === 'admin' || role === 'responder' ? (
                <Route path="/moderation" element={<ModerationPage />} />
              ) : null}
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/login" />} />
          )}
        </Routes>
      </main>
    </div>
  );
}
