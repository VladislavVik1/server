import React, { useEffect } from 'react';
import api from '../api';
import '../styles/Login.css';
import { useNavigate } from 'react-router-dom';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/templates/Login.html')
      .then(res => res.text())
      .then(html => {
        const root = document.getElementById('root');
        root.innerHTML = html;
        attachLogic();
      });
  }, []);

  function attachLogic() {
    const emailEl = document.getElementById('login-username');
    const passEl = document.getElementById('login-password');
    const errorEl = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit');
    const regLink = document.getElementById('login-to-register');

    // 🔐 Логін
    submitBtn.addEventListener('click', async () => {
      try {
        const { data } = await api.post('/api/auth/login', {
          email: emailEl.value,
          password: passEl.value,
        });

        onLogin(data.token);        // збереження токена
        navigate('/dashboard');     // ✅ редирект після логіна
      } catch (err) {
        errorEl.textContent = err.response?.data?.message || 'Ошибка сервера';
      }
    });

    // 🔁 Перехід до реєстрації
    regLink.addEventListener('click', (e) => {
      e.preventDefault();
      navigate('/register'); // 🧼 краще через navigate, ніж через window.location
    });
  }

  return null;
}
