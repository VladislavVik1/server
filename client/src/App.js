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
      api.get('/api/auth/profile')
        .then(res => setRole(res.data.role))
        .catch(() => setRole(''));
      navigate('/dashboard');
    } else {
      // Если пользователь не авторизован и зашёл на "/", отправляем на лендинг
      if (window.location.pathname === '/') {
        window.location.href = '/landing.html';
      }
    }
  }, [token, navigate]);

  const handleLogin = (tok) => {
    localStorage.setItem('token', tok);
    setToken(tok);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setRole('');
    window.location.href = '/landing.html';
  };

  return (
    <div className="app">
      {token && <Sidebar onLogout={handleLogout} role={role} />}
      <main className="content">
        <Routes>
          {/* публичные роуты */}
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage onLogin={handleLogin} />} />

          {/* приватные роуты */}
          {token ? (
            <>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              {(role === 'admin' || role === 'responder') && (
                <Route path="/moderation" element={<ModerationPage />} />
              )}
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/landing.html" />} />  
          )}
        </Routes>
      </main>
    </div>
  );
}
