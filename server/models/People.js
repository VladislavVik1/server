import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const PeopleSchema = new Schema(
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
      enum: ['public'],
      default: 'public',
      required: true,
    },
  },
  { timestamps: true, collection: 'peoples' } // 👈 коллекция как у тебя
);

// защита от повторной компиляции в dev
export default mongoose.models.People || model('People', PeopleSchema);
