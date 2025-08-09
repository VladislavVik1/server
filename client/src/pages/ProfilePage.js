import React, { useEffect, useState } from 'react';
import api from '../api';
import { API_BASE } from '../utils/config';
import '../styles/ProfileNew.css';

const toAbs = (url) => (!url ? '' : (url.startsWith('http') ? url : `${API_BASE}${url}`));

export default function ProfilePage() {
  const [me, setMe] = useState(null);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  // 'none' | 'profile' | 'settings'
  const [openPanel, setOpenPanel] = useState('none');

  const [draft, setDraft] = useState({
    name: '', email: '', phone: '', location: '',
    theme: 'light', language: 'en', notifications: true,
  });

  const authHeader = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/auth/profile', { headers: authHeader });
        setMe(data);
        setDraft((d) => ({
          ...d,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          theme: data.theme || 'light',
          language: data.language || 'en',
          notifications: typeof data.notifications === 'boolean' ? data.notifications : true,
        }));
      } catch (e) {
        console.error(e?.response?.data || e.message);
      }
    })();
  }, []);

  // применяем тему после загрузки профиля
  useEffect(() => {
    if (me?.theme) document.body.classList.toggle('theme-dark', me.theme === 'dark');
  }, [me?.theme]);
  // применяем тему мгновенно при переключении
  useEffect(() => {
    document.body.classList.toggle('theme-dark', draft.theme === 'dark');
  }, [draft.theme]);

  const avatarSrc = toAbs(me?.avatarUrl);

  const uploadAvatar = async () => {
    if (!avatarFile) return;
    const fd = new FormData();
    fd.append('avatar', avatarFile);
    try {
      const { data } = await api.post('/api/auth/avatar', fd, {
        headers: { ...authHeader, 'Content-Type': 'multipart/form-data' },
      });
      setMe((p) => ({ ...p, avatarUrl: data.avatarUrl }));
      setAvatarFile(null);
    } catch (e) {
      alert(e?.response?.data?.message || 'Upload failed');
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put(
        '/api/auth/profile',
        {
          name: draft.name,
          phone: draft.phone,
          location: draft.location,
          theme: draft.theme,
          language: draft.language,
          notifications: draft.notifications,
        },
        { headers: authHeader }
      );
      setMe((p) => ({ ...p, ...draft }));
      setOpenPanel('none');
    } catch (e) {
      alert(e?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (!me) {
    return (
      <div className="pf2-wrap">
        <div className="pf2-card">Loading…</div>
      </div>
    );
  }

  return (
    <div className="pf2-wrap">
      {/* Левая колонка — всегда видна */}
      <div className="pf2-left">
        <div className="pf2-user">
          <img className="pf2-avatar" src={avatarSrc || '/default-avatar.png'} alt="" />
          <div>
            <div className="pf2-name">{me.name || 'Your name'}</div>
            <div className="pf2-sub">{me.email}</div>
          </div>
        </div>

        <div className="pf2-menu">
          <button className="pf2-item" onClick={() => setOpenPanel('profile')}>
            <span>My Profile</span>
            <span className="pf2-caret">›</span>
          </button>

          <button className="pf2-item" onClick={() => setOpenPanel('settings')}>
            <span>Settings</span>
            <span className="pf2-caret">›</span>
          </button>

          <div className="pf2-item-row">
            <span>Notification</span>
            <div className="pf2-pop">
              <button
                className={draft.notifications ? 'active' : ''}
                onClick={() => setDraft((d) => ({ ...d, notifications: true }))}
              >
                Allow
              </button>
              <button
                className={!draft.notifications ? 'active' : ''}
                onClick={() => setDraft((d) => ({ ...d, notifications: false }))}
              >
                Mute
              </button>
            </div>
          </div>

          <button className="pf2-item danger" onClick={logout}>
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Центр — профиль: место всегда занято, видимость через классы */}
      <div className="pf2-center">
        <div className={`pf2-modal ${openPanel === 'profile' ? 'is-open' : 'is-hidden'}`}>
          <div className="pf2-modal-head">
            <div className="pf2-user sm">
              <img className="pf2-avatar" src={avatarSrc || '/default-avatar.png'} alt="" />
              <div>
                <div className="pf2-name">{me.name || 'Your name'}</div>
                <div className="pf2-sub">{me.email}</div>
              </div>
            </div>
            <button className="pf2-x" onClick={() => setOpenPanel('none')} aria-label="Close">
              ✕
            </button>
          </div>

          <div className="pf2-field">
            <label>Name</label>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="your name"
            />
          </div>
          <div className="pf2-field">
            <label>Email account</label>
            <input disabled value={draft.email} />
          </div>
          <div className="pf2-field">
            <label>Mobile number</label>
            <input
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              placeholder="Add number"
            />
          </div>
          <div className="pf2-field">
            <label>Location</label>
            <input
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              placeholder="USA"
            />
          </div>

          <div className="pf2-actions">
            <button className="btn" disabled={saving} onClick={saveProfile}>
              {saving ? 'Saving…' : 'Save Change'}
            </button>
            <label className="btn outline">
              Upload avatar
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                hidden
              />
            </label>
            <button className="btn ghost" disabled={!avatarFile} onClick={uploadAvatar}>
              Apply avatar
            </button>
          </div>
        </div>
      </div>

      {/* Правая колонка — настройки */}
      <div className="pf2-right">
        <div className={`pf2-settings ${openPanel === 'settings' ? 'is-open' : 'is-hidden'}`}>
          <div className="pf2-modal-head">
            <div className="pf2-title" style={{ margin: 0 }}>
              Settings
            </div>
            <button className="pf2-x" onClick={() => setOpenPanel('none')} aria-label="Close">
              ✕
            </button>
          </div>

          <div className="pf2-setting">
            <span>Theme</span>
            <select value={draft.theme} onChange={(e) => setDraft({ ...draft, theme: e.target.value })}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="pf2-setting" style={{ marginTop: 8 }}>
            <span>Language</span>
            <select
              value={draft.language}
              onChange={(e) => setDraft({ ...draft, language: e.target.value })}
            >
              <option value="en">Eng</option>
              <option value="uk">Ukr</option>
              <option value="ru">Ru</option>
            </select>
          </div>

          <div className="pf2-actions">
            <button className="btn" disabled={saving} onClick={saveProfile}>
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
