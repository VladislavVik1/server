import React, { useEffect } from 'react';
import api from '../api';
import '../styles/Login.css';

export default function LoginPage({ onLogin }) {
  useEffect(() => {
    // Загружаем HTML-шаблон
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

    // Логика кнопки логина
    submitBtn.addEventListener('click', async () => {
      try {
        const { data } = await api.post('/api/auth/login', {
          email: emailEl.value,
          password: passEl.value
        });
        onLogin(data.token);
      } catch (err) {
        errorEl.textContent = err.response?.data?.message || 'Ошибка сервера';
      }
    });

    // Переход на страницу регистрации
    regLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/register';
    });
  }

  return null; // React-рендеринг отдаётся через шаблон
}
