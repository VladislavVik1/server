// ./controllers/heatmapUtils.js
import CrimeReport from '../models/CrimeReport.js';
import mongoose from 'mongoose';

/**
 * Вычислить точки для тепловой карты за последние 30 дней.
 * Возвращает массив объектов { lat, lng, intensity }.
 */
export const calculateHeatmap = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Находим все отчёты за последние 30 дней с координатами
  const crimes = await CrimeReport.find({
    createdAt: { $gte: thirtyDaysAgo },
    'location.coordinates.lat': { $exists: true },
    'location.coordinates.lng': { $exists: true }
  }).select('location.coordinates');

  // Группируем по сетке
  const GRID_SIZE = 0.01;
  const heatmap = {};

  crimes.forEach(({ location: { coordinates } }) => {
    const { lat, lng } = coordinates;
    const gridLat = Math.floor(lat / GRID_SIZE) * GRID_SIZE;
    const gridLng = Math.floor(lng / GRID_SIZE) * GRID_SIZE;
    const key = `${gridLat},${gridLng}`;
    heatmap[key] = (heatmap[key] || 0) + 1;
  });

  // Преобразуем в массив { lat, lng, intensity }
  return Object.entries(heatmap).map(([key, count]) => {
    const [lat, lng] = key.split(',').map(parseFloat);
    // нормируем интенсивность до [0,1], пример:  max 10 отчётов в клетке
    return { lat, lng, intensity: Math.min(count / 10, 1) };
  });
};

/**
 * Получить статистику распределения по типам преступлений.
 * Возвращает объект { typeDistribution: [{ type, count }, ...] }.
 */
export const getCrimeStats = async () => {
  // Используем aggregation pipeline для группировки
  const results = await CrimeReport.aggregate([
    { 
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        type: '$_id',
        count: 1
      }
    }
  ]);

  return { typeDistribution: results };
};
