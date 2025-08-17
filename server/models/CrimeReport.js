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

// фото храним прямо в документе (Buffer)
const PhotoSchema = new Schema(
  {
    data: Buffer,
    contentType: String,
    size: Number,
    filename: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CrimeReportSchema = new Schema(
  {
    type: { type: String, required: true },
    description: { type: String, default: '' },
    comments: { type: String, default: '' },

    location: { type: LocationSchema, default: () => ({}) },
    date: { type: Date },

    reportIssuedAt: { type: Date, default: null },

    issuerFirst: { type: String, default: '' },
    issuerLast:  { type: String, default: '' },

    suspectAware:  { type: String, default: '' },
    arrestsSoFar:  { type: String, default: '' },

    suspectFirst: { type: String, default: '' },
    suspectLast:  { type: String, default: '' },

    // legacy-поля
    imageUrl: { type: String, default: null },
    attachments: [{ type: String }],

    // новое хранилище картинок
    photos: { type: [PhotoSchema], default: [] },

    user: { type: Schema.Types.ObjectId, refPath: 'userModel' },
    userModel: {
      type: String,
      enum: ['People', 'Spec', 'AuthUser'],
      default: 'People',
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'denied', 'rejected', 'closed'],
      default: 'pending',
    },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.models.CrimeReport ||
  model('CrimeReport', CrimeReportSchema);
