import mongoose from 'mongoose';

const specSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'responder' },
}, { collection: 'spec' });

export default mongoose.model('Spec', specSchema);
