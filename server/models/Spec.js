import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

const SpecSchema = new Schema(
  {
    
    user: { type: Types.ObjectId, ref: 'AuthUser', unique: true, index: true },
    email: { type: String, required: true, trim: true },
    email_lc: { type: String, required: true, index: true },
    password: { type: String, required: true },
    role: { type: String, default: 'responder' },

    // ПОЛЯ ПРОФИЛЯ
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
    status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
    // Настройки
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    language: { type: String, default: 'en' },
    notifications: { type: Boolean, default: true },
  },
  { timestamps: true, strict: true }
);


SpecSchema.pre('validate', function (next) {
  if (this.email) {
    const lc = String(this.email).trim().toLowerCase();
    this.email = lc;
    this.email_lc = lc;
  } else if (this.email_lc) {
    const lc = String(this.email_lc).trim().toLowerCase();
    this.email = lc;
    this.email_lc = lc;
  }
  next();
});

export default model('Spec', SpecSchema, 'spec');
