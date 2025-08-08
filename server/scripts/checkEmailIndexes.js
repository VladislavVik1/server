import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const collections = ['pwd', 'peoples', 'spec'];

  for (const collName of collections) {
    console.log(`\n=== ${collName} ===`);

    // Индексы
    const indexes = await db.collection(collName).indexes();
    console.log('Indexes:');
    console.table(indexes.map(i => ({
      name: i.name,
      key: JSON.stringify(i.key),
      unique: !!i.unique
    })));

    // Примеры email'ов
    const docs = await db.collection(collName)
      .find({}, { projection: { email: 1, email_lc: 1 } })
      .limit(10)
      .toArray();
    console.log('Sample emails:', docs.map(d => ({ email: d.email, email_lc: d.email_lc })));
  }

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
