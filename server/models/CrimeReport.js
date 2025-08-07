// ./models/CrimeReport.js
import mongoose from 'mongoose';

const crimeReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  description: String,
  location: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number,
    }
  },
  imageUrl: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  }
}, {
  timestamps: true
});

export default mongoose.model('CrimeReport', crimeReportSchema);
