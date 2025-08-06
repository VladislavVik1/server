import mongoose from 'mongoose';

const peopleSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'public' },
}, { collection: 'peoples' });

export default mongoose.model('People', peopleSchema);