import { CrimeReport, User } from '../models/index.js'
import { getCrimeStats } from './heatmapUtils.js'

export const getDashboardData = async (req, res) => {
  try {
    let reports;

    if (req.user.role === 'admin') {
      reports = await CrimeReport.findAll({
        include: [{ model: User, attributes: ['email'] }],
      });
    } else {

      reports = await CrimeReport.findAll({
        where: { userId: req.user.id },
        include: [{ model: User, attributes: ['email'] }],
      });
    }


    let stats = {};
    if (req.user.role === 'admin') {
      const types = await CrimeReport.findAll({
        attributes: ['type'],
      });

      stats.typeDistribution = types.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        return acc;
      }, {});
    }

    res.json({ reports, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};