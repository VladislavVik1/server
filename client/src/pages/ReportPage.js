import React, { useState, useRef } from 'react';
import api from '../api';
import '../styles/ReportForm.css';

export default function ReportPage() {
  const [alert, setAlert] = useState('');

  // Report (когда подают)
  const [reportDate, setReportDate] = useState('');
  const [reportTime, setReportTime] = useState('');
  const [reportMeridiem, setReportMeridiem] = useState('AM');

  // Incident (когда случилось)
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [incidentMeridiem, setIncidentMeridiem] = useState('AM');

  // Кем подан
  const [issuerFirst, setIssuerFirst] = useState('');
  const [issuerLast, setIssuerLast] = useState('');

  // Локация
  const [locationText, setLocationText] = useState('');

  // Инцидент
  const [incidentName, setIncidentName] = useState('');
  const [incidentDetails, setIncidentDetails] = useState('');

  // 🔹 Crime type dropdown
  const [crimeType, setCrimeType] = useState('');
  const crimeTypes = [
    'Assault','Burglary','Robbery','Vandalism','Theft','Homicide',
    'Arson','Fraud','Drug Offense','Domestic Violence','Cybercrime','Kidnapping'
  ];

  // Вопросы
  const [suspectAware, setSuspectAware] = useState('');
  const [arrestsSoFar, setArrestsSoFar] = useState('');

  // Подозреваемый
  const [suspectFirst, setSuspectFirst] = useState('');
  const [suspectLast, setSuspectLast] = useState('');

  // Комментарии
  const [comments, setComments] = useState('');

  // Файлы
  const [files, setFiles] = useState([]);
  const dropRef = useRef(null);

  // Подтверждение
  const [certify, setCertify] = useState(false);

  const onFiles = (fileList) => {
    const arr = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...arr]);
  };
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
    dropRef.current?.classList.remove('rf-drop--drag');
  };
  const onDragOver = (e) => {
    e.preventDefault(); e.stopPropagation();
    dropRef.current?.classList.add('rf-drop--drag');
  };
  const onDragLeave = () => dropRef.current?.classList.remove('rf-drop--drag');

  const handleSaveLocal = () => {
    const draft = {
      reportDate, reportTime, reportMeridiem,
      incidentDate, incidentTime, incidentMeridiem,
      issuerFirst, issuerLast, locationText,
      crimeType, incidentName, incidentDetails,
      suspectAware, arrestsSoFar,
      suspectFirst, suspectLast, comments,
    };
    localStorage.setItem('reportDraft', JSON.stringify(draft));
    setAlert('Draft saved locally.');
    setTimeout(() => setAlert(''), 1500);
  };

  const toISODateTime = (date, time, mer) => {
    if (!date) return '';
    if (!time) return new Date(date).toISOString();
    let [h, m] = time.split(':').map(x => parseInt(x || '0', 10));
    if (mer === 'PM' && h < 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    return new Date(`${date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00Z`).toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!certify) { setAlert('Please certify the information is true and correct.'); return; }

    const form = new FormData();
    form.append('type', crimeType || incidentName || 'Incident'); // 🔹 отправляем crimeType
    form.append('description', incidentDetails || comments || '');
    form.append('location', locationText);
    form.append('date', toISODateTime(incidentDate, incidentTime, incidentMeridiem));

    form.append('reportIssuedAt', toISODateTime(reportDate, reportTime, reportMeridiem));
    form.append('issuerFirst', issuerFirst);
    form.append('issuerLast', issuerLast);
    form.append('suspectAware', suspectAware);
    form.append('arrestsSoFar', arrestsSoFar);
    form.append('suspectFirst', suspectFirst);
    form.append('suspectLast', suspectLast);
    form.append('comments', comments);

    files.forEach((f, idx) => form.append(idx === 0 ? 'image' : 'attachments', f));

    try {
      await api.post('/api/reports', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAlert('Report submitted ✔');

      // reset
      setReportDate(''); setReportTime(''); setReportMeridiem('AM');
      setIncidentDate(''); setIncidentTime(''); setIncidentMeridiem('AM');
      setIssuerFirst(''); setIssuerLast('');
      setLocationText(''); setIncidentName(''); setIncidentDetails('');
      setCrimeType('');
      setSuspectAware(''); setArrestsSoFar('');
      setSuspectFirst(''); setSuspectLast('');
      setComments(''); setFiles([]); setCertify(false);

    } catch (err) {
      console.error(err?.response?.data || err.message);
      setAlert('Submit failed, try again.');
    }
  };

  return (
    <div className="rf-wrap">
      <div className="rf-header">
        <div className="rf-logo" aria-hidden />
        <div className="rf-title">Crime Reporting App</div>
      </div>

      <div className="rf-banner">Emergency Call</div>

      <form className="rf-card" onSubmit={handleSubmit}>
        {alert && <div className="rf-alert">{alert}</div>}

        <div className="rf-grid">
          {/* Report date/time */}
          <div className="rf-field">
            <label>Report date</label>
            <input type="date" value={reportDate} onChange={e=>setReportDate(e.target.value)} />
          </div>
          <div className="rf-field">
            <label>Time</label>
            <div className="rf-row-2">
              <input type="time" value={reportTime} onChange={e=>setReportTime(e.target.value)} />
              <select value={reportMeridiem} onChange={e=>setReportMeridiem(e.target.value)}>
                <option>AM</option><option>PM</option>
              </select>
            </div>
          </div>

          {/* Incident date/time */}
          <div className="rf-field">
            <label>Date when incident occurred</label>
            <input type="date" value={incidentDate} onChange={e=>setIncidentDate(e.target.value)} />
          </div>
          <div className="rf-field">
            <label>Time</label>
            <div className="rf-row-2">
              <input type="time" value={incidentTime} onChange={e=>setIncidentTime(e.target.value)} />
              <select value={incidentMeridiem} onChange={e=>setIncidentMeridiem(e.target.value)}>
                <option>AM</option><option>PM</option>
              </select>
            </div>
          </div>

          {/* Incident report issued by */}
          <div className="rf-group">
            <label>Incident report issued by</label>
            <div className="rf-row-2">
              <div className="rf-col">
                <input placeholder="First Name" value={issuerFirst} onChange={e=>setIssuerFirst(e.target.value)} />
                <small className="rf-sublabel">First Name</small>
              </div>
              <div className="rf-col">
                <input placeholder="Last Name" value={issuerLast} onChange={e=>setIssuerLast(e.target.value)} />
                <small className="rf-sublabel">Last Name</small>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="rf-field">
            <label>Incident Location (provide specific details)</label>
            <textarea
              placeholder="Address or Google Maps link"
              value={locationText}
              onChange={e=>setLocationText(e.target.value)}
            />
          </div>

          <div className="rf-field">
            <label>Location link (if any)</label>
            <input
              placeholder="Paste a Google Maps link"
              value={locationText}
              onChange={e=>setLocationText(e.target.value)}
            />
          </div>

          {/* Crime type dropdown */}
          <div className="rf-field">
            <label>Crime Type</label>
            <select
              id="crime-dropdown"
              value={crimeType}
              onChange={(e)=>setCrimeType(e.target.value)}
            >
              <option value="">-- Please choose an option --</option>
              {crimeTypes.map((crime, i) => (
                <option key={i} value={crime}>{crime}</option>
              ))}
            </select>
          </div>

          {/* Name & details */}
          <div className="rf-field">
            <label>Name of Incident</label>
            <textarea value={incidentName} onChange={e=>setIncidentName(e.target.value)} />
          </div>

          <div className="rf-field">
            <label>Incident details</label>
            <textarea value={incidentDetails} onChange={e=>setIncidentDetails(e.target.value)} />
          </div>

          {/* Questions */}
          <div className="rf-field">
            <label>Was the suspect aware or have any charges been set?</label>
            <textarea value={suspectAware} onChange={e=>setSuspectAware(e.target.value)} />
          </div>

          <div className="rf-field">
            <label>Has anyone been arrested so far in relation to the incident?</label>
            <textarea value={arrestsSoFar} onChange={e=>setArrestsSoFar(e.target.value)} />
          </div>

          {/* Files */}
          <div className="rf-field">
            <label>Upload related files</label>
            <div
              ref={dropRef}
              className="rf-drop"
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <div className="rf-drop-ico" />
              <div className="rf-drop-title">Browse Files</div>
              <div className="rf-drop-sub">Drag and drop files here</div>
              <input type="file" accept="image/*" multiple onChange={(e)=>onFiles(e.target.files)} />
            </div>
            {files.length > 0 && (
              <div className="rf-files">{files.map((f, i) => <span key={i}>{f.name}</span>)}</div>
            )}
          </div>

          {/* Suspect name */}
          <div className="rf-group">
            <label>Suspect’s Full Name (If Known)</label>
            <div className="rf-row-2">
              <div className="rf-col">
                <input placeholder="First Name" value={suspectFirst} onChange={e=>setSuspectFirst(e.target.value)} />
                <small className="rf-sublabel">First Name</small>
              </div>
              <div className="rf-col">
                <input placeholder="Last Name" value={suspectLast} onChange={e=>setSuspectLast(e.target.value)} />
                <small className="rf-sublabel">Last Name</small>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="rf-field">
            <label>Further Comments</label>
            <textarea value={comments} onChange={e=>setComments(e.target.value)} />
          </div>

          {/* Confirm */}
          <div className="rf-confirm">
            <label className="rf-check">
              <input type="checkbox" checked={certify} onChange={e=>setCertify(e.target.checked)} />
              <span>I certify that the above information is true and correct.</span>
            </label>
          </div>

          {/* Actions */}
          <div className="rf-actions">
            <button type="button" className="btn ghost" onClick={handleSaveLocal}>Save</button>
            <button type="submit" className="btn primary">Submit</button>
          </div>
        </div>
      </form>
    </div>
  );
}
