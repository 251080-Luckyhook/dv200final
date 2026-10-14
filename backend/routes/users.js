const express = require('express');

const mongoStore = require('../mongoStore');
const wrap = require('../lib/wrap');
const { STAFF_ROLES } = require('../lib/constants');
const { requireAuth, requireStaff, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get(
  '/accounts',
  requireAdmin,
  wrap(async (req, res) => {
    const search = String(req.query.search || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = {};

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await mongoStore.getCollection('users')
      .find(filter, { projection: { fullName: 1, email: 1, role: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return res.json({
      users: users.map((user) => ({
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })),
    });
  })
);

router.get(
  '/volunteers',
  requireStaff,
  wrap(async (req, res) => {
    const users = await mongoStore.getCollection('users')
      .find({ role: 'volunteer' }, { projection: { fullName: 1 } })
      .sort({ fullName: 1 })
      .limit(200)
      .toArray();

    return res.json({
      volunteers: users.map((user) => ({ id: user._id.toString(), fullName: user.fullName })),
    });
  })
);

router.patch(
  '/:id/role',
  requireAdmin,
  wrap(async (req, res) => {
    const { role } = req.body;

    if (role !== 'volunteer' && !STAFF_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Choose a valid account role.' });
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot change your own role.' });
    }

    const _id = mongoStore.toObjectId(req.params.id);
    const result = _id
      ? await mongoStore.getCollection('users').findOneAndUpdate(
          { _id },
          { $set: { role } },
          { returnDocument: 'after' }
        )
      : null;

    if (!result) {
      return res.status(404).json({ error: 'We could not find that person.' });
    }

    return res.json({
      user: { id: result._id.toString(), fullName: result.fullName, email: result.email, role: result.role },
    });
  })
);

module.exports = router;
