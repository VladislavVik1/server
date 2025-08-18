import React, { useEffect, useRef } from 'react';
import api from '../api';
import '../styles/Login.css';
import { useNavigate } from 'react-router-dom';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const cleanupRef = useRef(() => {});

  useEffect(() => {
    let isMounted = true;

    fetch('/templates/Login.html')
      .then(res => res.text())
      .then(html => {
        if (!isMounted) return;
        const root = document.getElementById('root');
        if (!root) return;
        root.innerHTML = html;
        attachLogic();
      })
      .catch((e) => {
        console.error('[LOGIN][TEMPLATE]', e);
      });

    return () => {
      isMounted = false;
      try { cleanupRef.current?.(); } catch {}
    };
  }, []);

  function attachLogic() {
    const emailEl   = document.getElementById('login-username');
    const passEl    = document.getElementById('login-password');
    const roleEl    = document.getElementById('login-role'); 
    const errorEl   = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit');
    const regLink   = document.getElementById('login-to-register');

    if (!emailEl || !passEl || !submitBtn) {
      console.warn('[LOGIN] Inputs not found in template');
      return;
    }

    const onSubmit = async () => {
      const email = String(emailEl.value || '').trim().toLowerCase();
      const password = String(passEl.value || '');
      const role = String(roleEl?.value ?? ''); 

      if (!email || !password) {
        if (errorEl) errorEl.textContent = 'Введите email и пароль';
        return;
      }

      try {
        const { data } = await api.post(
          '/api/auth/login',
          { email, password, role },
          { headers: { 'Content-Type': 'application/json' } }
        );

        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);

        onLogin?.(data.token);
        navigate('/dashboard', { replace: true });
        setTimeout(() => window.location.reload(), 0);
      } catch (err) {
        const status = err?.response?.status;
        const serverMsg =
          err?.response?.data?.message ??
          err?.response?.data ??
          err?.message ??
          'Server Error';

        if (errorEl) {
          errorEl.textContent =
            status === 401
              ? (typeof serverMsg === 'string' ? serverMsg : 'Неверный e-mail или пароль')
              : String(serverMsg);
        }
        console.error('[LOGIN]', status, serverMsg, err);
      }
    };

    const onGoRegister = (e) => {
      e.preventDefault();
      navigate('/register');
    };

    submitBtn.addEventListener('click', onSubmit);
    regLink?.addEventListener('click', onGoRegister);

    cleanupRef.current = () => {
      try { submitBtn.removeEventListener('click', onSubmit); } catch {}
      try { regLink?.removeEventListener('click', onGoRegister); } catch {}
    };
  }

  return null;
}
