const { MongoClient, ObjectId } = require('mongodb');

let client;
let database;

function getCollection(name) {
  if (!database) {
    throw new Error('MongoDB has not been connected.');
  }

  return database.collection(name);
}

function toObjectId(value) {
  if (!ObjectId.isValid(String(value))) {
    return null;
  }

  return new ObjectId(String(value));
}

async function connectMongo() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Add your MongoDB Atlas connection string to the environment.');
  }

  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  database = client.db(process.env.MONGODB_DB || 'ngwana_huis');

  await Promise.all([
    getCollection('users').createIndexes([
      { key: { email: 1 }, unique: true, sparse: true },
      { key: { googleId: 1 }, unique: true, sparse: true },
    ]),
    getCollection('bookings').createIndexes([
      { key: { userId: 1, date: 1, startHour: 1 } },
      { key: { date: 1, startHour: 1, status: 1 } },
    ]),
    getCollection('slotOverrides').createIndex({ date: 1, startHour: 1 }, { unique: true }),
    getCollection('careRequests').createIndex({ status: 1, createdAt: -1 }),
    getCollection('feedback').createIndex({ volunteerId: 1, createdAt: -1 }),
    getCollection('messages').createIndex({ volunteerId: 1, createdAt: -1 }),
  ]);
}

async function closeMongo() {
  if (client) {
    await client.close();
    client = null;
    database = null;
  }
}

function mapUser(document) {
  return {
    id: document._id.toString(),
    fullName: document.fullName,
    email: document.email || null,
    phone: document.phone || null,
    role: document.role,
    avatarUrl: document.avatarUrl || null,
    isStaff: document.role !== 'volunteer',
  };
}

async function createAccount({ fullName, email, phone, role = 'volunteer', passwordHash, googleId, avatarUrl }) {
  const document = {
    fullName,
    email: email || null,
    phone: phone || null,
    role,
    avatarUrl: avatarUrl || null,
    createdAt: new Date(),
  };

  if (passwordHash) {
    document.passwordHash = passwordHash;
  }

  if (googleId) {
    document.googleId = googleId;
  }

  const result = await getCollection('users').insertOne(document);

  return mapUser({ ...document, _id: result.insertedId });
}

async function getUserByEmail(email) {
  return getCollection('users').findOne({ email: email.toLowerCase() });
}

async function getUserById(id) {
  const _id = toObjectId(id);

  return _id ? getCollection('users').findOne({ _id }) : null;
}

async function updateUser(id, values) {
  const _id = toObjectId(id);

  if (!_id) {
    return null;
  }

  const result = await getCollection('users').findOneAndUpdate(
    { _id },
    { $set: values },
    { returnDocument: 'after' }
  );

  return result ? mapUser(result) : null;
}

module.exports = {
  getCollection,
  toObjectId,
  connectMongo,
  closeMongo,
  mapUser,
  createAccount,
  getUserByEmail,
  getUserById,
  updateUser,
};
