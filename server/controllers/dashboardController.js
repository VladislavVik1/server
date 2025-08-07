import CrimeReport from '../models/CrimeReport.js';

export async function getDashboardData(user) {
  if (!['responder', 'admin'].includes(user.role)) {
    throw new Error('Нет доступа');
  }

  // 📊 Подсчёт по статусу
  const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
    CrimeReport.countDocuments({ status: 'pending' }),
    CrimeReport.countDocuments({ status: 'approved' }),
    CrimeReport.countDocuments({ status: 'rejected' }),
  ]);

  // 🕵️ Последние 5 отчётов
  const recentReports = await CrimeReport.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('type description status');

  return {
    stats: {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
    },
    recent: recentReports,
  };
}
