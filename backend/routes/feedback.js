const express = require('express');

const mongoStore = require('../mongoStore');
const wrap = require('../lib/wrap');
const { requireAuth, requireStaff } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// Feedback a volunteer has received from staff
router.get(
  '/mine',
  wrap(async (req, res) => {
    const feedback = await mongoStore.getCollection('feedback')
      .find({ volunteerId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    const results = await Promise.all(feedback.map(async (item) => {
      const author = item.authorId ? await mongoStore.getUserById(item.authorId) : null;

      return {
        id: item._id.toString(),
        body: item.body,
        author: author ? author.fullName : 'Ngwana Huis staff',
        createdAt: item.createdAt,
      };
    }));

    return res.json({ feedback: results });
  })
);

// Staff write feedback for a volunteer
router.post(
  '/',
  requireStaff,
  wrap(async (req, res) => {
    const { volunteerId, body } = req.body;

    if (typeof volunteerId !== 'string' || !mongoStore.toObjectId(volunteerId) || !body || !String(body).trim()) {
      return res.status(400).json({ error: 'Choose a volunteer and write your feedback.' });
    }

    const volunteer = await mongoStore.getUserById(volunteerId);

    if (!volunteer || volunteer.role !== 'volunteer') {
      return res.status(404).json({ error: 'We could not find that volunteer.' });
    }

    await mongoStore.getCollection('feedback').insertOne({
      volunteerId,
      authorId: req.user.id,
      body: String(body).trim(),
      createdAt: new Date(),
    });

    return res.status(201).json({ ok: true });
  })
);

// Messages: volunteers write to staff, staff write to a volunteer
router.post(
  '/messages',
  wrap(async (req, res) => {
    const { body } = req.body;

    if (!body || !String(body).trim()) {
      return res.status(400).json({ error: 'Write a message first.' });
    }

    const volunteerId = req.user.isStaff ? req.body.volunteerId : req.user.id;

    if (typeof volunteerId !== 'string' || !mongoStore.toObjectId(volunteerId)) {
      return res.status(400).json({ error: 'Choose who this message is for.' });
    }

    if (req.user.isStaff) {
      const volunteer = await mongoStore.getUserById(volunteerId);

      if (!volunteer || volunteer.role !== 'volunteer') {
        return res.status(404).json({ error: 'We could not find that volunteer.' });
      }
    }

    await mongoStore.getCollection('messages').insertOne({
      volunteerId,
      senderId: req.user.id,
      body: String(body).trim(),
      createdAt: new Date(),
    });

    return res.status(201).json({ ok: true });
  })
);

router.get(
  '/messages/inbox',
  requireStaff,
  wrap(async (req, res) => {
    const messages = await mongoStore.getCollection('messages')
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const volunteerIds = [...new Set(messages.map((message) => message.volunteerId))];
    const senderIds = [...new Set(messages.map((message) => message.senderId).filter(Boolean))];
    const [volunteers, senders] = await Promise.all([
      Promise.all(volunteerIds.map((id) => mongoStore.getUserById(id))),
      Promise.all(senderIds.map((id) => mongoStore.getUserById(id))),
    ]);
    const volunteerById = new Map(volunteers.filter(Boolean).map((user) => [user._id.toString(), user]));
    const senderById = new Map(senders.filter(Boolean).map((user) => [user._id.toString(), user]));

    return res.json({
      messages: messages.map((message) => {
        const volunteer = volunteerById.get(message.volunteerId);
        const sender = senderById.get(message.senderId);

        return {
          id: message._id.toString(),
          volunteerId: message.volunteerId,
          volunteerName: volunteer ? volunteer.fullName : 'Unknown volunteer',
          sender: sender ? sender.fullName : 'Former account',
          senderRole: sender ? sender.role : null,
          body: message.body,
          createdAt: message.createdAt,
        };
      }),
    });
  })
);

router.get(
  '/messages',
  wrap(async (req, res) => {
    const volunteerId = req.user.isStaff ? req.query.volunteerId : req.user.id;

    if (typeof volunteerId !== 'string' || !mongoStore.toObjectId(volunteerId)) {
      return res.status(400).json({ error: 'Choose a volunteer.' });
    }

    if (req.user.isStaff) {
      const volunteer = await mongoStore.getUserById(volunteerId);

      if (!volunteer || volunteer.role !== 'volunteer') {
        return res.status(404).json({ error: 'We could not find that volunteer.' });
      }
    }

    const messages = await mongoStore.getCollection('messages')
      .find({ volunteerId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    const results = await Promise.all(messages.map(async (message) => {
      const sender = message.senderId ? await mongoStore.getUserById(message.senderId) : null;

      return {
        id: message._id.toString(),
        body: message.body,
        sender: sender ? sender.fullName : null,
        senderRole: sender ? sender.role : null,
        fromMe: message.senderId === req.user.id,
        createdAt: message.createdAt,
      };
    }));

    return res.json({ messages: results });
  })
);

module.exports = router;
