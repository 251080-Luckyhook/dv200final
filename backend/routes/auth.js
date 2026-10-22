const express = require('express');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const wrap = require('../lib/wrap');
const { signToken, requireAuth } = require('../middleware/auth');
const mongoStore = require('../mongoStore');

const router = express.Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Volunteers can create accounts with email and password; staff accounts are provisioned by an administrator.
router.post(
  '/register',
  wrap(async (req, res) => {
    const { fullName, email, phone, password } = req.body;
    const name = typeof fullName === 'string' ? fullName.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';

    if (!name || !normalizedEmail || typeof password !== 'string') {
      return res.status(400).json({ error: 'Enter your full name, email address, and password.' });
    }

    if (name.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Enter a valid name and email address.' });
    }

    if (normalizedPhone.length > 40) {
      return res.status(400).json({ error: 'Your phone number must be 40 characters or fewer.' });
    }

    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ error: 'Your password must be at least 8 characters and no more than 72 bytes.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const user = await mongoStore.createAccount({
        fullName: name,
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash,
      });

      return res.status(201).json({ token: signToken(user), user });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: 'An account with that email address already exists.' });
      }

      throw error;
    }
  })
);

// Email or phone and password sign in volunteers and staff from the same form.
router.post(
  '/login',
  wrap(async (req, res) => {
    const { identifier, email, password } = req.body;
    const rawIdentifier = typeof identifier === 'string' ? identifier : email;
    const normalizedIdentifier = typeof rawIdentifier === 'string' ? rawIdentifier.trim() : '';

    if (!normalizedIdentifier || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Enter your email or phone number and password.' });
    }

    const normalizedEmail = normalizedIdentifier.toLowerCase();
    const accounts = await mongoStore
      .getCollection('users')
      .find({ $or: [{ email: normalizedEmail }, { phone: normalizedIdentifier }] })
      .toArray();
    const matchingAccounts = [];

    for (const account of accounts) {
      if (account.passwordHash && await bcrypt.compare(password, account.passwordHash)) {
        matchingAccounts.push(account);
      }
    }

    if (matchingAccounts.length !== 1) {
      if (matchingAccounts.length > 1) {
        return res.status(409).json({ error: 'More than one account matches those details. Please contact staff.' });
      }

      return res.status(401).json({ error: 'Those details do not match an account.' });
    }

    const user = mongoStore.mapUser(matchingAccounts[0]);

    return res.json({ token: signToken(user), user });
  })
);

// Volunteers sign up and log in with Google
router.post(
  '/google',
  wrap(async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google sign-in did not return a credential.' });
    }

    let payload;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      payload = ticket.getPayload();
    } catch (error) {
      return res.status(401).json({ error: 'We could not verify your Google account.' });
    }

    if (!payload || !payload.email || !payload.sub) {
      return res.status(401).json({ error: 'We could not verify your Google account.' });
    }

    const email = String(payload.email).toLowerCase();
    let account = await mongoStore.getUserByEmail(email);

    if (!account) {
      try {
        await mongoStore.createAccount({
          fullName: payload.name || email,
          email,
          googleId: payload.sub,
          avatarUrl: payload.picture || null,
        });
      } catch (error) {
        if (error.code !== 11000) {
          throw error;
        }
      }

      account = await mongoStore.getUserByEmail(email);
    }

    if (!account) {
      return res.status(409).json({ error: 'This email is already associated with another account.' });
    }

    if (!account.googleId) {
      await mongoStore.getCollection('users').updateOne(
        { _id: account._id, googleId: { $exists: false } },
        { $set: { googleId: payload.sub } }
      );
      account.googleId = payload.sub;
    }

    const user = mongoStore.mapUser(account);

    return res.json({ token: signToken(user), user });
  })
);

// Staff log in with full name, phone or email, and password
router.post(
  '/admin-login',
  wrap(async (req, res) => {
    const { fullName, identifier, password } = req.body;

    if (!fullName || !identifier || !password) {
      return res.status(400).json({ error: 'Enter your full name, phone or email, and password.' });
    }

    const escapedName = fullName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const identifierValue = identifier.trim();
    const account = await mongoStore.getCollection('users').findOne({
      role: { $ne: 'volunteer' },
      fullName: { $regex: `^${escapedName}$`, $options: 'i' },
      $or: [{ email: identifierValue.toLowerCase() }, { phone: identifierValue }],
    });

    const passwordMatches =
      account && account.role !== 'volunteer' && account.passwordHash &&
      (await bcrypt.compare(password, account.passwordHash));

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Those details do not match a staff account.' });
    }

    const user = mongoStore.mapUser(account);

    return res.json({ token: signToken(user), user });
  })
);

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
