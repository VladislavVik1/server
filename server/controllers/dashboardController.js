
import CrimeReport from '../models/CrimeReport.js';
import mongoose from 'mongoose';

export async function getDashboardSummary(req, res) {
  try {
    const user = req.user;
    const match = (user.role === 'admin' || user.role === 'responder')
      ? {}
      : { user: new mongoose.Types.ObjectId(user.id) };

    const statusAgg = await CrimeReport.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const counters = { total: 0, pending: 0, approved: 0, rejected: 0 };
    counters.total = statusAgg.reduce((a, s) => a + s.count, 0);
    statusAgg.forEach(s => { counters[s._id] = s.count; });


    const recent = await CrimeReport
      .find(match)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type description status createdAt location.address');

 
    const typeAgg = await CrimeReport.aggregate([
      { $match: match },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const since = new Date();
    since.setDate(since.getDate() - 6);
    const last7Agg = await CrimeReport.aggregate([
      { $match: { ...match, createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            y: { $year: '$createdAt' },
            m: { $month: '$createdAt' },
            d: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } }
    ]);

    const byDay = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date();
      dt.setDate(dt.getDate() - (6 - i));
      const y = dt.getFullYear(), m = dt.getMonth() + 1, d = dt.getDate();
      const hit = last7Agg.find(x => x._id.y === y && x._id.m === m && x._id.d === d);
      byDay.push({
        date: dt.toISOString().slice(0, 10),
        count: hit ? hit.count : 0
      });
    }

    res.json({
      counters,
      recent,
      byType: typeAgg.map(t => ({ type: t._id, count: t.count })),
      last7days: byDay
    });
  } catch (err) {
    console.error('dashboard error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
