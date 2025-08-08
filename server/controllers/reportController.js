// server/controllers/reportController.js
import CrimeReport from '../models/CrimeReport.js';
import { calculateHeatmap } from './heatmapUtils.js';
import fetch from 'node-fetch'; // для геокодинга

// Функция геокодинга через Nominatim OSM
async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'crime-app/1.0' } });
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  }
  return { lat: null, lng: null };
}

// ✅ Создание отчета
export async function createReport(req) {
  const { type, description, location, date, comments } = req.body;

  const parsedLocation =
    typeof location === 'string' ? { address: location } : (location || {});

  // Геокодим адрес
  let coords = { lat: null, lng: null };
  if (parsedLocation.address) {
    coords = await geocodeAddress(parsedLocation.address);
  }

  const newReport = await CrimeReport.create({
    user: req.user.id,
    type,
    description,
    comments,
    location: {
      address: parsedLocation.address || '',
      coordinates: coords,
    },
    date: date || new Date(),
    imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
  });

  return newReport;
}

// ✅ Обновление статуса
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

  const updated = await CrimeReport.findByIdAndUpdate(
    id,
    { status: normalized },
    { new: true }
  );

  return updated;
}

export async function listForModeration(req, res) {
  try {
    const raw = String(req.query.status || 'pending').toLowerCase();
    const allowed = new Set(['pending','approved','rejected','closed','all']);
    const status = allowed.has(raw) ? raw : 'pending';
    const match = status === 'all' ? {} : { status };

    const docs = await CrimeReport.find(match).sort({ createdAt: -1 }).lean();
    return res.json(docs);
  } catch (e) {
    console.error('listForModeration error:', e);
    return res.status(500).json({ message: 'Server error', error: e.message });
  }
}

// ✅ Все отчёты (для responder/admin)
export async function getAllReports() {
  return await CrimeReport.find().populate('user', 'email role');
}

// ✅ Мои отчёты (для public)
export async function getMyReports(userId) {
  return await CrimeReport.find({ user: userId });
}

// ✅ Данные для карты (видят все: только approved и только с координатами)
export async function getMapPoints() {
  const reports = await CrimeReport.find({ status: 'approved' })
    .select('type description location date imageUrl createdAt');

  return reports.filter(
    (r) =>
      r.location?.coordinates?.lat != null &&
      r.location?.coordinates?.lng != null
  );
}

// ✅ Один отчёт по id (для модалки на дашборде)
export async function getReportById(req, res) {
  try {
    const { id } = req.params;
    const report = await CrimeReport.findById(id).populate('user', 'email role');

    if (!report) {
      return res.status(404).json({ message: 'Not found' });
    }

    // public может видеть только свои отчёты
    if (
      req.user?.role === 'public' &&
      String(report.user?._id) !== String(req.user.id)
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(report);
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
}
