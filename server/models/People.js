// models/People.js
import mongoose from 'mongoose';

const PeopleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'AuthUser', required: true, unique: true },
    email: { type: String, required: true }, // дублируем для удобства выборок (необязательно)
    name: { type: String, default: '' },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    // любые поля профиля "гражданина"
  },
  { timestamps: true, collection: 'peoples' }
);

export default mongoose.model('People', PeopleSchema);
