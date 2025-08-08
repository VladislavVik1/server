import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const CoordinatesSchema = new Schema(
  { lat: { type: Number, default: null }, lng: { type: Number, default: null } },
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
    // Основное
    type: { type: String, required: true },
    description: { type: String, default: '' },
    comments: { type: String, default: '' }, // 👈 добавили

    // Локация и дата инцидента
    location: { type: LocationSchema, default: () => ({}) },
    date: { type: Date }, // когда случилось

    // Дата подачи отчёта (из формы)
    reportIssuedAt: { type: Date, default: null }, // 👈 добавили

    // Кем подан
    issuerFirst: { type: String, default: '' },   // 👈 добавили
    issuerLast:  { type: String, default: '' },   // 👈 добавили

    // Вопросы
    suspectAware:  { type: String, default: '' }, // 👈 добавили
    arrestsSoFar:  { type: String, default: '' }, // 👈 добавили

    // Подозреваемый
    suspectFirst: { type: String, default: '' },  // 👈 добавили
    suspectLast:  { type: String, default: '' },  // 👈 добавили

    // Медиа
    imageUrl: { type: String, default: null },
    attachments: [{ type: String }],

    // Автор отчёта (динамический ref по роли)
    user: { type: Schema.Types.ObjectId, refPath: 'userModel' },
    userModel: {
      type: String,
      enum: ['People', 'Spec', 'AuthUser'],
      default: 'People',
    },

    // Статус
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied', 'rejected', 'closed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default mongoose.models.CrimeReport ||
  model('CrimeReport', CrimeReportSchema);
