import { CrimeReport } from '../models/index.js'
import { calculateHeatmap } from './heatmapUtils.js'

export const createReport = async (req, res) => {
  try {
    const report = await CrimeReport.create({
      type: req.body.type,
      description: req.body.description,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      imagePath: req.file ? req.file.path : null,
      UserId: req.user.id,
    })
    res.status(201).json(report)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const updateStatus = async (req, res) => {
  try {
    const report = await CrimeReport.findByPk(req.params.id)
    if (!report) return res.status(404).send('Report not found')
    report.status = req.body.status
    await report.save()
    res.json(report)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}
export const getMapData = async (req, res) => {
  try {
    let reports;

    if (req.user.role === 'admin') {
      reports = await CrimeReport.findAll({
        attributes: ['id', 'type', 'latitude', 'longitude', 'createdAt'],
      });
    } else {
      reports = await CrimeReport.findAll({
        where: { userId: req.user.id },
        attributes: ['id', 'type', 'latitude', 'longitude', 'createdAt'],
      });
    }

    const heatmapData = await calculateHeatmap(); // це, ймовірно, лише для адміна
    const response = { reports };

    if (req.user.role === 'admin') {
      response.heatmapData = heatmapData;
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
