// models/AuthUser.js
import mongoose from 'mongoose';

const AuthUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['public', 'responder', 'admin'], required: true },
  },
  { timestamps: true, collection: 'pwd' }
);

export default mongoose.model('AuthUser', AuthUserSchema);
