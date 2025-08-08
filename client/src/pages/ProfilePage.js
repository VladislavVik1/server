import React, { useEffect, useState } from 'react';
import api from '../api';
import { API_BASE } from '../utils/config';
import '../styles/Profile.css';

export default function ProfilePage() {
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [draft, setDraft] = useState({ name:'', phone:'', locale:'', timezone:'' });
  const [pwd, setPwd] = useState({ current:'', next:'', next2:'' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const [msg, setMsg] = useState('');

  const say = (t) => { setMsg(t); setTimeout(()=>setMsg(''), 2500); };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setMe(data);
        setDraft({
          name: data.name || '',
          phone: data.phone || '',
          locale: data.locale || '',
          timezone: data.timezone || ''
        });
      } catch(e) {
        console.error(e?.response?.data || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (tab === 'my') {
      api.get('/api/reports/mine', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      .then(r => setMyReports(r.data || []))
      .catch(console.error);
    }
  }, [tab]);

  const saveProfile = async () => {
    try {
      await api.put('/api/auth/profile', draft, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      say('Profile saved');
      setMe(p => ({ ...p, ...draft }));
    } catch(e) {
      console.error(e?.response?.data || e.message);
      say('Save failed');
    }
  };

  const changePassword = async () => {
    if (!pwd.current || !pwd.next || !pwd.next2) return say('Fill all fields');
    if (pwd.next !== pwd.next2) return say('Passwords do not match');
    try {
      await api.put('/api/auth/password', { current: pwd.current, next: pwd.next }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      say('Password changed');
      setPwd({ current:'', next:'', next2:'' });
    } catch(e) {
      say(e?.response?.data?.message || 'Change failed');
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return;
    const fd = new FormData();
    fd.append('avatar', avatarFile);
    try {
      const { data } = await api.post('/api/auth/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      say('Avatar updated');
      setMe(p => ({ ...p, avatarUrl: data.avatarUrl }));
      setAvatarFile(null);
    } catch(e) {
      say(e?.response?.data?.message || 'Upload failed');
    }
  };

  if (loading) return <div className="pf-wrap"><div className="pf-card">Loading…</div></div>;
  if (!me) return <div className="pf-wrap"><div className="pf-card">Profile not found</div></div>;

  const avatarSrc = me.avatarUrl ? (me.avatarUrl.startsWith('http') ? me.avatarUrl : `${API_BASE}${me.avatarUrl}`) : '';

  return (
    <div className="pf-wrap">
      <div className="pf-head">
        <div className="pf-user">
          <div className="pf-avatar" style={{backgroundImage: avatarSrc ? `url(${avatarSrc})` : 'none'}} />
          <div>
            <div className="pf-name">{me.name || me.email}</div>
            <div className="pf-sub">{me.email} · {me.role}</div>
          </div>
        </div>
        <div className="pf-tabs">
          <button className={tab==='overview'?'active':''} onClick={()=>setTab('overview')}>Overview</button>
          <button className={tab==='edit'?'active':''} onClick={()=>setTab('edit')}>Edit</button>
          <button className={tab==='security'?'active':''} onClick={()=>setTab('security')}>Security</button>
          <button className={tab==='my'?'active':''} onClick={()=>setTab('my')}>My Reports</button>
        </div>
      </div>

      {msg && <div className="pf-msg">{msg}</div>}

      {tab === 'overview' && (
        <div className="pf-grid">
          <div className="pf-card">
            <div className="pf-title">Profile</div>
            <div className="pf-list">
              <div><span>Name</span><b>{me.name || '—'}</b></div>
              <div><span>Email</span><b>{me.email}</b></div>
              <div><span>Phone</span><b>{me.phone || '—'}</b></div>
              <div><span>Locale</span><b>{me.locale || '—'}</b></div>
              <div><span>Timezone</span><b>{me.timezone || '—'}</b></div>
            </div>
          </div>
          <div className="pf-card">
            <div className="pf-title">Avatar</div>
            <div className="pf-row">
              <input type="file" accept="image/*" onChange={e=>setAvatarFile(e.target.files?.[0] || null)} />
              <button className="btn primary" onClick={uploadAvatar} disabled={!avatarFile}>Upload</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'edit' && (
        <div className="pf-card">
          <div className="pf-title">Edit Profile</div>
          <div className="pf-form">
            <label>Name<input value={draft.name} onChange={e=>setDraft({...draft, name:e.target.value})} /></label>
            <label>Phone<input value={draft.phone} onChange={e=>setDraft({...draft, phone:e.target.value})} /></label>
            <label>Locale<input value={draft.locale} onChange={e=>setDraft({...draft, locale:e.target.value})} placeholder="en-US, uk-UA…" /></label>
            <label>Timezone<input value={draft.timezone} onChange={e=>setDraft({...draft, timezone:e.target.value})} placeholder="Europe/Kyiv…" /></label>
          </div>
          <div className="pf-actions">
            <button className="btn primary" onClick={saveProfile}>Save</button>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="pf-card">
          <div className="pf-title">Change Password</div>
          <div className="pf-form">
            <label>Current password<input type="password" value={pwd.current} onChange={e=>setPwd({...pwd, current:e.target.value})} /></label>
            <label>New password<input type="password" value={pwd.next} onChange={e=>setPwd({...pwd, next:e.target.value})} /></label>
            <label>Repeat new password<input type="password" value={pwd.next2} onChange={e=>setPwd({...pwd, next2:e.target.value})} /></label>
          </div>
          <div className="pf-actions">
            <button className="btn primary" onClick={changePassword}>Update</button>
          </div>
        </div>
      )}

      {tab === 'my' && (
        <div className="pf-card">
          <div className="pf-title">My Reports</div>
          {myReports.length === 0 ? <div className="db-empty">No reports yet</div> : (
            <table className="db-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Address</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {myReports.map(r => (
                  <tr key={r._id}>
                    <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</td>
                    <td>{r.type}</td>
                    <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                    <td>{r.location?.address || '—'}</td>
                    <td>
                      <a className="linkbtn" href={`/map?focus=${r._id}`}>View on map</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
