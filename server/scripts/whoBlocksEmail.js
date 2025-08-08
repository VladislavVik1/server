import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

async function run() {
  const email = (process.argv[2] || '').trim();
  if (!email) {
    console.error('Usage: node server/scripts/whoBlocksEmail.js test@example.com');
    process.exit(1);
  }
  const emailLC = email.toLowerCase();

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const pwd = await db.collection('pwd').find(
    { $or: [ { email: email }, { email_lc: emailLC } ] },
    { projection: { _id:1, email:1, email_lc:1, role:1 } }
  ).toArray();

  const peoples = await db.collection('peoples').find(
    { email: emailLC },
    { projection: { _id:1, email:1, user:1 } }
  ).toArray();

  const spec = await db.collection('spec').find(
    { email: emailLC },
    { projection: { _id:1, email:1, user:1 } }
  ).toArray();

  console.log('\n=== pwd ==='); console.log(pwd);
  console.log('\n=== peoples ==='); console.log(peoples);
  console.log('\n=== spec ==='); console.log(spec);

  await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
