import CrimeReport from '../models/CrimeReport.js';
import { calculateHeatmap } from './heatmapUtils.js';

// ✅ Створення звіту
export async function createReport(req) {
  const { type, description, location } = req.body;

  const parsedLocation = typeof location === 'string'
  ? { address: location }
  : location;

  const newReport = await CrimeReport.create({
    user: req.user.id,
    type,
    description,
    location: parsedLocation,
    imageUrl: req.file?.path || null
  });

  return newReport;
}

// ✅ Оновлення статусу
export async function updateStatus(req) {
  const { id } = req.params;
  const { status } = req.body;

  const updated = await CrimeReport.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  return updated;
}

// ✅ Всі звіти (тільки для responder/admin)
export async function getAllReports() {
  return await CrimeReport.find().populate('user', 'email role');
}

// ✅ Мої звіти (тільки для public)
export async function getMyReports(userId) {
  return await CrimeReport.find({ user: userId });
}

// ✅ Карта
export async function getMapData(req, res) {
  try {
    let reports;

    if (req.user.role === 'admin') {
      reports = await CrimeReport.find({}, 'type location.createdAt');
    } else {
      reports = await CrimeReport.find({ user: req.user.id }, 'type location.createdAt');
    }

    const heatmapData = req.user.role === 'admin' ? await calculateHeatmap() : [];

    res.json({ reports, heatmapData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
