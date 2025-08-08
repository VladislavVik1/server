import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const SpecSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['responder'],
      default: 'responder',
      required: true,
    },
  },
  { timestamps: true, collection: 'spec' } // 👈 коллекция как у тебя
);

export default mongoose.models.Spec || model('Spec', SpecSchema);
