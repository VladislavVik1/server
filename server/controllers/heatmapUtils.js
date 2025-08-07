import { CrimeReport } from '../models/index.js'
import { Op, Sequelize } from 'sequelize'

export const calculateHeatmap = async () => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const crimes = await CrimeReport.findAll({
    where: { createdAt: { [Op.gte]: thirtyDaysAgo } },
    attributes: ['latitude', 'longitude'],
  })

  const heatmap = {}
  const GRID_SIZE = 0.01

  crimes.forEach(({ latitude, longitude }) => {
    const gridLat = Math.floor(latitude / GRID_SIZE) * GRID_SIZE
    const gridLng = Math.floor(longitude / GRID_SIZE) * GRID_SIZE
    const key = `${gridLat},${gridLng}`
    heatmap[key] = (heatmap[key] || 0) + 1
  })

  return Object.entries(heatmap).map(([key, count]) => {
    const [lat, lng] = key.split(',').map(parseFloat)
    return { lat, lng, intensity: Math.min(count / 10, 1) }
  })
}

export const getCrimeStats = async () => {
  const results = await CrimeReport.findAll({
    attributes: [
      'type',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
    ],
    group: ['type'],
  })

  return {
    typeDistribution: results.map(r => ({
      type: r.type,
      count: r.get('count'),
    })),
  }
}
