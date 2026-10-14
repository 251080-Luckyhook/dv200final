require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoStore = require('./mongoStore');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin seed.');
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await mongoStore.getUserByEmail(normalizedEmail);

  if (existing) {
    console.log('Admin account already exists, skipping seed.');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await mongoStore.createAccount({
    fullName: process.env.ADMIN_FULL_NAME || 'Administrator',
    email: normalizedEmail,
    role: 'administrator',
    passwordHash,
  });

  console.log('Admin account created for ' + normalizedEmail);
}

async function run() {
  try {
    await mongoStore.connectMongo();
    await seedAdmin();
    console.log('MongoDB collections and indexes are ready.');
  } finally {
    await mongoStore.closeMongo();
  }
}

run().catch((error) => {
  console.error('MongoDB setup failed:', error);
  process.exitCode = 1;
});
