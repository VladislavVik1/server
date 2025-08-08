import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

async function ensureUniqueIndex(db, coll, key, opts={}) {
  const name = Object.keys(key).map(k => `${k}_${key[k]}`).join('_');
  const existing = await db.collection(coll).indexes();
  const has = existing.find(i => JSON.stringify(i.key) === JSON.stringify(key) && i.unique);
  if (has) {
    console.log(`[${coll}] unique index already exists on ${JSON.stringify(key)} (${has.name})`);
    return;
  }
  // drop same-key non-unique index (rare case)
  const nonUnique = existing.find(i => JSON.stringify(i.key) === JSON.stringify(key) && !i.unique);
  if (nonUnique) {
    console.log(`[${coll}] dropping non-unique index ${nonUnique.name}`);
    await db.collection(coll).dropIndex(nonUnique.name);
  }
  console.log(`[${coll}] creating unique index on ${JSON.stringify(key)}`);
  await db.collection(coll).createIndex(key, { unique: true, name, ...opts });
}

async function dropIndexIfExists(db, coll, keyOrName) {
  const indexes = await db.collection(coll).indexes();
  let target = null;
  if (typeof keyOrName === 'string') {
    target = indexes.find(i => i.name === keyOrName);
  } else {
    target = indexes.find(i => JSON.stringify(i.key) === JSON.stringify(keyOrName));
  }
  if (target) {
    console.log(`[${coll}] dropping index ${target.name}`);
    await db.collection(coll).dropIndex(target.name);
  }
}

async function findDuplicatesAgg(db, coll, field) {
  // агрегация по нижнему регистру значения поля
  const pipeline = [
    { $match: { [field]: { $exists: true, $ne: null } } },
    { $group: { _id: { $toLower: `$${field}` }, count: { $sum: 1 }, ids: { $push: '$_id' }, emails: { $push: `$${field}` } } },
    { $match: { count: { $gt: 1 } } }
  ];
  return await db.collection(coll).aggregate(pipeline).toArray();
}

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // ===== pwd (AuthUser) =====
  {
    const coll = 'pwd';
    console.log(`\n=== Fixing ${coll} ===`);

    // 1) Проставим/обновим email_lc
    const upd1 = await db.collection(coll).updateMany(
      { email: { $exists: true } },
      [{ $set: { email_lc: { $toLower: '$email' } } }]
    );
    console.log(`[${coll}] set email_lc ->`, upd1.modifiedCount, 'updated');

    // 2) Проверим дубли по email_lc
    const dups = await findDuplicatesAgg(db, coll, 'email');
    if (dups.length) {
      console.warn(`[${coll}] DUPLICATES by case-insensitive email:`);
      for (const d of dups) console.warn('  value:', d._id, 'emails:', d.emails, 'ids:', d.ids);
      console.warn('⚠️  Удалите или объедините эти записи вручную перед созданием уникального индекса на email_lc.');
    } else {
      // 3) Снимаем уникальный индекс на email (если есть)
      await dropIndexIfExists(db, coll, { email: 1 });

      // 4) Ставим уникальный индекс на email_lc
      await ensureUniqueIndex(db, coll, { email_lc: 1 });
    }
  }

  // ===== peoples =====
  {
    const coll = 'peoples';
    console.log(`\n=== Fixing ${coll} ===`);

    // 1) Нормализуем email в lower-case
    const upd = await db.collection(coll).updateMany(
      { email: { $exists: true } },
      [{ $set: { email: { $toLower: '$email' } } }]
    );
    console.log(`[${coll}] normalize email ->`, upd.modifiedCount, 'updated');

    // 2) Проверим дубли (теперь по полю email)
    const dups = await findDuplicatesAgg(db, coll, 'email');
    if (dups.length) {
      console.warn(`[${coll}] DUPLICATES by email:`);
      for (const d of dups) console.warn('  value:', d._id, 'emails:', d.emails, 'ids:', d.ids);
      console.warn('⚠️  Разрулите дубликаты вручную, иначе уникальный индекс не создастся.');
    } else {
      // 3) Снимаем любые индексы на email_lc, если вдруг есть
      await dropIndexIfExists(db, coll, { email_lc: 1 });

      // 4) Пересоздаём уникальный индекс на email
      await dropIndexIfExists(db, coll, { email: 1 });
      await ensureUniqueIndex(db, coll, { email: 1 });
    }
  }

  // ===== spec =====
  {
    const coll = 'spec';
    console.log(`\n=== Fixing ${coll} ===`);

    // 1) Нормализуем email в lower-case
    const upd = await db.collection(coll).updateMany(
      { email: { $exists: true } },
      [{ $set: { email: { $toLower: '$email' } } }]
    );
    console.log(`[${coll}] normalize email ->`, upd.modifiedCount, 'updated');

    // 2) Проверим дубли
    const dups = await findDuplicatesAgg(db, coll, 'email');
    if (dups.length) {
      console.warn(`[${coll}] DUPLICATES by email:`);
      for (const d of dups) console.warn('  value:', d._id, 'emails:', d.emails, 'ids:', d.ids);
      console.warn('⚠️  Разрулите дубликаты вручную, иначе уникальный индекс не создастся.');
    } else {
      // 3) Снимаем любые индексы на email_lc, если вдруг есть
      await dropIndexIfExists(db, coll, { email_lc: 1 });

      // 4) Пересоздаём уникальный индекс на email
      await dropIndexIfExists(db, coll, { email: 1 });
      await ensureUniqueIndex(db, coll, { email: 1 });
    }
  }

  await mongoose.disconnect();
  console.log('\n✅ Done.');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
