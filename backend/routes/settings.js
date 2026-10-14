const express = require('express');
const bcrypt = require('bcryptjs');

const mongoStore = require('../mongoStore');
const wrap = require('../lib/wrap');
const { requireAuth, requireStaff } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

const DEFAULT_NOTIFICATIONS = {
  urgent_care_requests: true,
  new_volunteer_signups: true,
  shift_reminders: true,
  visitor_check_in: true,
};

router.get(
  '/me',
  wrap(async (req, res) => {
    const user = await mongoStore.getUserById(req.user.id);
    const appSetting = await mongoStore.getCollection('settings').findOne({ _id: 'reduced_capacity' });

    return res.json({
      notifications: user.notifications || DEFAULT_NOTIFICATIONS,
      calendarSync: user.calendarSync || false,
      reducedCapacity: appSetting?.value === true,
    });
  })
);

router.put(
  '/me',
  wrap(async (req, res) => {
    const notifications = { ...DEFAULT_NOTIFICATIONS };

    Object.keys(DEFAULT_NOTIFICATIONS).forEach((key) => {
      if (req.body.notifications && typeof req.body.notifications[key] === 'boolean') {
        notifications[key] = req.body.notifications[key];
      }
    });

    const updated = await mongoStore.updateUser(req.user.id, {
      notifications,
      calendarSync: Boolean(req.body.calendarSync),
    });

    if (!updated) {
      return res.status(404).json({ error: 'This account no longer exists.' });
    }

    return res.json({ ok: true });
  })
);

// Reduced capacity takes one spot off every slot
router.put(
  '/app',
  requireStaff,
  wrap(async (req, res) => {
    const reducedCapacity = Boolean(req.body.reducedCapacity);

    await mongoStore.getCollection('settings').updateOne(
      { _id: 'reduced_capacity' },
      { $set: { value: reducedCapacity } },
      { upsert: true }
    );

    return res.json({ reducedCapacity });
  })
);

router.put(
  '/profile',
  wrap(async (req, res) => {
    const { fullName, email, phone, avatarUrl } = req.body;
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;

    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ error: 'Your name cannot be empty.' });
    }

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }

    if (avatarUrl && String(avatarUrl).length > 400000) {
      return res.status(400).json({ error: 'That picture is too large. Choose one under 300 KB.' });
    }

    try {
      if (normalizedEmail) {
        const existing = await mongoStore.getCollection('users').findOne({
          email: normalizedEmail,
          _id: { $ne: mongoStore.toObjectId(req.user.id) },
        });

        if (existing) {
          return res.status(409).json({ error: 'That email address is already used by another account.' });
        }
      }

      const user = await mongoStore.updateUser(req.user.id, {
        fullName: String(fullName).trim(),
        email: normalizedEmail,
        phone: phone ? String(phone).trim() : null,
        ...(avatarUrl ? { avatarUrl } : {}),
      });

      if (!user) {
        return res.status(404).json({ error: 'This account no longer exists.' });
      }

      return res.json({ user });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: 'That email address is already used by another account.' });
      }

      throw error;
    }
  })
);

router.put(
  '/password',
  wrap(async (req, res) => {
    const { password, confirm } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Your new password must be at least 8 characters.' });
    }

    if (password !== confirm) {
      return res.status(400).json({ error: 'The two passwords do not match.' });
    }

    const hash = await bcrypt.hash(password, 10);

    const updated = await mongoStore.updateUser(req.user.id, { passwordHash: hash });

    if (!updated) {
      return res.status(404).json({ error: 'This account no longer exists.' });
    }

    return res.json({ ok: true });
  })
);

module.exports = router;
