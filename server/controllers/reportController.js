// server/controllers/reportController.js
import path from 'path';
import CrimeReport from '../models/CrimeReport.js';
import fetch from 'node-fetch';

async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'crime-app/1.0' } });
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  return { lat: null, lng: null };
}

export async function createReport(req) {
  const { type, description, location, date, comments } = req.body;

  const parsedLocation =
    typeof location === 'string' ? { address: location } : (location || {});

  let coords = { lat: null, lng: null };
  if (parsedLocation.address) coords = await geocodeAddress(parsedLocation.address);

  // multer.diskStorage положил файлы в req.files
  const files = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);
  const attachments = files.map(f => `/uploads/${path.basename(f.filename)}`);
  const imageUrl = attachments[0] || null;

  const doc = await CrimeReport.create({
    user: req.user.id,
    type,
    description,
    comments,
    location: { address: parsedLocation.address || '', coordinates: coords },
    date: date || new Date(),
    // больше НЕ кладём в Mongo бинарь; используем дисковый путь
    photos: [],            // оставляем пустым
    attachments,           // список ссылок на /uploads
    imageUrl,              // первая как превью/легаси
  });

  const previewUrl = imageUrl;
  return { ...doc.toObject(), previewUrl };
}

export async function updateStatus(req) {
  const { id } = req.params;
  let { status } = req.body;

  const map = { denied: 'rejected', reject: 'rejected' };
  const normalized = map[String(status || '').toLowerCase()] || String(status || '').toLowerCase();

  const allowed = ['pending', 'approved', 'rejected', 'closed'];
  if (!allowed.includes(normalized)) {
    const err = new Error('Invalid status');
    err.status = 400;
    throw err;
  }

  return await CrimeReport.findByIdAndUpdate(id, { status: normalized }, { new: true });
}

export async function listForModeration(req, res) {
  try {
    const raw = String(req.query.status || 'pending').toLowerCase();
    const allowed = new Set(['pending', 'approved', 'rejected', 'closed', 'all']);
    const status = allowed.has(raw) ? raw : 'pending';
    const match = status === 'all' ? {} : { status };

    const docs = await CrimeReport.find(match)
      .sort({ createdAt: -1 })
      .lean();

    const mapped = docs.map(d => ({
      ...d,
      previewUrl: d.attachments?.[0] || d.imageUrl || null,
    }));

    return res.json(mapped);
  } catch (e) {
    console.error('listForModeration error:', e);
    return res.status(500).json({ message: 'Server error', error: e.message });
  }
}

export async function getAllReports() {
  const docs = await CrimeReport.find({})
    .populate('user', 'email role')
    .lean();

  return docs.map(d => ({
    ...d,
    previewUrl: d.attachments?.[0] || d.imageUrl || null,
  }));
}

export async function getMyReports(userId) {
  const docs = await CrimeReport.find({ user: userId }).lean();
  return docs.map(d => ({
    ...d,
    previewUrl: d.attachments?.[0] || d.imageUrl || null,
  }));
}

export async function getMapPoints() {
  const reports = await CrimeReport.find({ status: 'approved' })
    .select('type description location date createdAt attachments imageUrl')
    .lean();

  return reports
    .filter(r => r.location?.coordinates?.lat != null && r.location?.coordinates?.lng != null)
    .map(r => ({
      ...r,
      previewUrl: r.attachments?.[0] || r.imageUrl || null,
    }));
}

export async function getReportById(req, res) {
  try {
    const { id } = req.params;
    const report = await CrimeReport.findById(id).populate('user', 'email role');
    if (!report) return res.status(404).json({ message: 'Not found' });

    if (req.user?.role === 'public' && String(report.user?._id) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const obj = report.toObject();
    obj.previewUrl = obj.attachments?.[0] || obj.imageUrl || null;
    return res.json(obj);
  } catch (e) {
    return res.status(500).json({ message: 'Server error', error: e.message });
  }
}
