import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from './models/User.js';

dotenv.config();
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  const adminEmail = 'CrimeWatch@adm';
  if (!await User.findOne({ email: adminEmail })) {
    const pwHash = await bcrypt.hash('SafeAndSafety', 10);
    await User.create({ email: adminEmail, password: pwHash, role: 'admin' });
    console.log('✅ Admin user created');
  } else {
    console.log('ℹ️  Admin already exists');
  }
  process.exit(0);
})
.catch(err => {
  console.error('❌ Seed admin error:', err);
  process.exit(1);
});
