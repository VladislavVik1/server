import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * FIX: в контроллере createReport сохраняется объект:
 * location: { address: String, coordinates: { lat: Number, lng: Number } }
 * imageUrl: String
 *
 * Ранее в схеме было: location: String (и image/attachments в другом виде),
 * из-за чего валидатор падал: "Cast to string failed at path 'location'".
 *
 * Приводим схему в соответствие с контроллером.
 */

const CoordinatesSchema = new Schema(
  {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  { _id: false }
);

const LocationSchema = new Schema(
  {
    address: { type: String, default: '' },
    coordinates: { type: CoordinatesSchema, default: () => ({}) },
  },
  { _id: false }
);

const CrimeReportSchema = new Schema(
  {
    type: { type: String, required: true },
    description: { type: String, default: '' },

    // ✅ теперь объект, как пишет контроллер
    location: { type: LocationSchema, default: () => ({}) },

    date: { type: Date },

    // ✅ как в контроллере
    imageUrl: { type: String, default: null },
    attachments: [{ type: String }],

    // Автор отчёта (динамический ref по роли)
    user: { type: Schema.Types.ObjectId, refPath: 'userModel' },
    userModel: {
      type: String,
      enum: ['People', 'Spec', 'AuthUser'],
      default: 'People',
    },

    // ⚠️ контроллер может писать 'rejected', добавляем в enum
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied', 'rejected', 'closed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Чтобы не падать при хот-релоаде в dev
export default mongoose.models.CrimeReport ||
  model('CrimeReport', CrimeReportSchema);
