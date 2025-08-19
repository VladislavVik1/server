import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  description: String,
  location: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  userEmail: String
});

const Report = mongoose.model('Report', reportSchema);
export default Report;
