import React, { useEffect } from 'react';
import api from '../../api';
import '../../styles/Register.css';
import { useNavigate } from 'react-router-dom';

export default function Register({ onLogin }) {
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/templates/Register.html')
      .then(res => {
        if (!res.ok) throw new Error('Register.html not found: ' + res.status);
        return res.text();
      })
      .then(html => {
        const root = document.getElementById('root');
        if (!root) throw new Error('#root not found');
        root.innerHTML = html;
        attachLogic();
      })
      .catch(err => {
        console.error('[REGISTER] template load error', err);
        alert('Failed to load registration template');
      });
  }, []);

  function attachLogic() {
    const emailEl = document.getElementById('register-email');
    const passEl  = document.getElementById('register-password');
    const roleEl  = document.getElementById('register-role');
    const errorEl = document.getElementById('register-error');
    const btn     = document.getElementById('register-submit');

    if (!emailEl || !passEl || !btn) {
      console.warn('[REGISTER] elements not found');
      return;
    }

    const submit = async (e) => {
      e?.preventDefault?.();
      if (errorEl) errorEl.textContent = '';

      const email = (emailEl.value || '').trim();
      const password = passEl.value || '';
      const role = roleEl?.value || 'public';

      if (!email || !password) {
        if (errorEl) errorEl.textContent = 'please fill in all fields';
        return;
      }

      btn.disabled = true;
      try {
        const res = await api.post('/api/auth/register', { email, password, role });
        const data = res.data;
        if (!data?.token) throw new Error(data?.message || 'Registration failed');

        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        onLogin?.(data.token);

        navigate('/dashboard', { replace: true });
        setTimeout(() => window.location.reload(), 0);
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'Email is already used'; 
        if (errorEl) errorEl.textContent = msg;
        console.error('[REGISTER] submit error', err);
      } finally {
        btn.disabled = false;
      }
    };


    btn.addEventListener('click', submit);


    emailEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(e); });
    passEl.addEventListener('keydown',  (e) => { if (e.key === 'Enter') submit(e); });
  }

  return null;
}
