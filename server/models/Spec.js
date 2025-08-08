// models/Spec.js
import mongoose from 'mongoose';

const SpecSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'AuthUser', required: true, unique: true },
    email: { type: String, required: true },
    name: { type: String, default: '' },
    avatar: { type: String, default: '' },
    department: { type: String, default: '' },
    // поля профиля "respondерa"
  },
  { timestamps: true, collection: 'spec' }
);

export default mongoose.model('Spec', SpecSchema);
