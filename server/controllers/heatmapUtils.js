
import CrimeReport from '../models/CrimeReport.js';
import mongoose from 'mongoose';


export const calculateHeatmap = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);


  const crimes = await CrimeReport.find({
    createdAt: { $gte: thirtyDaysAgo },
    'location.coordinates.lat': { $exists: true },
    'location.coordinates.lng': { $exists: true }
  }).select('location.coordinates');


  const GRID_SIZE = 0.01;
  const heatmap = {};

  crimes.forEach(({ location: { coordinates } }) => {
    const { lat, lng } = coordinates;
    const gridLat = Math.floor(lat / GRID_SIZE) * GRID_SIZE;
    const gridLng = Math.floor(lng / GRID_SIZE) * GRID_SIZE;
    const key = `${gridLat},${gridLng}`;
    heatmap[key] = (heatmap[key] || 0) + 1;
  });


  return Object.entries(heatmap).map(([key, count]) => {
    const [lat, lng] = key.split(',').map(parseFloat);

    return { lat, lng, intensity: Math.min(count / 10, 1) };
  });
};


export const getCrimeStats = async () => {

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
