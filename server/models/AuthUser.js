// models/AuthUser.js
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const AuthUserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,     
      unique: true,       
      index: true
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'public', 'responder'],
      required: true
    }
  },
  { timestamps: true }
);

export default model('AuthUser', AuthUserSchema/*, 'authusers'*/);
