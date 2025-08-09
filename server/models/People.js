import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

const PeopleSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'AuthUser', unique: true, index: true },
    email: { type: String, required: true, trim: true },            // можем хранить LC, но всё равно нормализуем
    email_lc: { type: String, required: true, index: true },        // под индекс email_lc_1
    password: { type: String, required: true },
    role: { type: String, default: 'public' },

    // ПОЛЯ ПРОФИЛЯ
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
    // Настройки
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    language: { type: String, default: 'en' },
    notifications: { type: Boolean, default: true },
  },
  { timestamps: true, strict: true }
);

// Нормализация email/email_lc
PeopleSchema.pre('validate', function (next) {
  if (this.email) {
    const lc = String(this.email).trim().toLowerCase();
    this.email = lc;      // храним в LC
    this.email_lc = lc;   // под индекс
  } else if (this.email_lc) {
    const lc = String(this.email_lc).trim().toLowerCase();
    this.email = lc;
    this.email_lc = lc;
  }
  next();
});

export default model('People', PeopleSchema, 'peoples');
