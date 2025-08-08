import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

const SpecSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'AuthUser', unique: true, index: true },
    email: { type: String, required: true, trim: true },
    email_lc: { type: String, required: true, index: true },
    password: { type: String, required: true },
    role: { type: String, default: 'responder' },

    // … остальные поля профиля …
  },
  { timestamps: true }
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
