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
    const roleEl = document.getElementById('login-role'); // селект роли (может не быть)
    const errorEl = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit');
    const regLink = document.getElementById('login-to-register');

    // 🔐 Логин
    submitBtn.addEventListener('click', async () => {
      try {
        const { data } = await api.post('/api/auth/login', {
          email: (emailEl?.value || '').trim(),
          password: passEl?.value || '',
          role: roleEl?.value // если нет select — не страшно
        });

        // ✅ сохраняем токен и роль
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);

        onLogin?.(data.token);

        // 👉 только при успехе: переход на дашборд и жёсткая перезагрузка
        navigate('/dashboard', { replace: true });
        setTimeout(() => window.location.reload(), 0);
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = err?.response?.data?.message || 'Ошибка сервера';
        }
        console.error('[LOGIN]', err);
      }
    });

    // 🔁 Переход к регистрации (без релоада — как просил)
    regLink.addEventListener('click', (e) => {
      e.preventDefault();
      navigate('/register');
    });
  }

  return null;
}
