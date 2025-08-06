import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const mongoUri = 'mongodb+srv://CrimeWatchAdm:SafeAndSafety@cluster0.nvmvkey.mongodb.net/CrimeWatch?retryWrites=true&w=majority';

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  await mongoose.connect(mongoUri);
  const adminEmail = 'admin@example.com';
  const existing = await User.findOne({ email: adminEmail });

  if (existing) {
    console.log('ℹ️ Адміністратор уже існує.');
    return mongoose.disconnect();
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const newAdmin = new User({
    email: adminEmail,
    password: hashedPassword,
    role: 'admin'
  });

  await newAdmin.save();
  console.log('✅ Адміністратор створений: admin@example.com / пароль: admin123');
  mongoose.disconnect();
}

createAdmin().catch(console.error);