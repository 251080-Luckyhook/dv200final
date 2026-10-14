const jwt = require('jsonwebtoken');

const mongoStore = require('../mongoStore');

function signToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Please log in to continue.' });
  }

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }

  try {
    const userDocument = await mongoStore.getUserById(payload.id);

    if (!userDocument) {
      return res.status(401).json({ error: 'This account no longer exists.' });
    }

    req.user = mongoStore.mapUser(userDocument);
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireStaff(req, res, next) {
  if (!req.user || !req.user.isStaff) {
    return res.status(403).json({ error: 'Staff access is required.' });
  }

  return next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Administrator access is required.' });
  }

  return next();
}

module.exports = { signToken, requireAuth, requireStaff, requireAdmin };
