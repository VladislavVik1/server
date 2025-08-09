import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const AuthUserSchema = new Schema(
  {
    email: { type: String, required: true, trim: true },         
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'public', 'responder'], required: true }
  },
  { timestamps: true }
);


AuthUserSchema.pre('validate', function (next) {
  if (this.email) {
    this.email_lc = String(this.email).trim().toLowerCase();
  }
  next();
});

export default model('AuthUser', AuthUserSchema, 'pwd');
