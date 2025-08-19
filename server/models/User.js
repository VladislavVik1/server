import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['public', 'responder', 'admin'],
    default: 'public'
  }
});

const User = mongoose.model('User', userSchema);
export default User;
