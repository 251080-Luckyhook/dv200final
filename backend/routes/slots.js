const express = require('express');

const mongoStore = require('../mongoStore');
const wrap = require('../lib/wrap');
const { mapBooking } = require('../lib/mappers');
const { getSlotsForDate } = require('../lib/slots');
const { isValidISODate, todayISO } = require('../lib/dates');
const { requireAuth, requireStaff } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get(
  '/',
  wrap(async (req, res) => {
    const date = req.query.date || todayISO();

    if (!isValidISODate(date)) {
      return res.status(400).json({ error: 'Date must look like 2026-04-08.' });
    }

    return res.json(await getSlotsForDate(date));
  })
);

router.put(
  '/capacity',
  requireStaff,
  wrap(async (req, res) => {
    const { date, startHour, capacity } = req.body;

    if (!isValidISODate(date) || !Number.isInteger(startHour) || !Number.isInteger(capacity) || capacity < 0 || capacity > 50) {
      return res.status(400).json({ error: 'Choose a valid slot and a capacity between 0 and 50.' });
    }

    await mongoStore.getCollection('slotOverrides').updateOne(
      { date, startHour },
      { $set: { capacity } },
      { upsert: true }
    );

    return res.json(await getSlotsForDate(date));
  })
);

router.put(
  '/block',
  requireStaff,
  wrap(async (req, res) => {
    const { date, startHour, blocked } = req.body;

    if (!isValidISODate(date) || !Number.isInteger(startHour) || typeof blocked !== 'boolean') {
      return res.status(400).json({ error: 'Choose a valid slot to block or unblock.' });
    }

    await mongoStore.getCollection('slotOverrides').updateOne(
      { date, startHour },
      { $set: { blocked } },
      { upsert: true }
    );

    return res.json(await getSlotsForDate(date));
  })
);

router.get(
  '/bookings',
  requireStaff,
  wrap(async (req, res) => {
    const { date } = req.query;
    const startHour = Number(req.query.startHour);

    if (!isValidISODate(date) || !Number.isInteger(startHour)) {
      return res.status(400).json({ error: 'Date and start hour are required.' });
    }

    const result = await mongoStore.getCollection('bookings')
      .find({ date, startHour, status: { $ne: 'cancelled' } })
      .sort({ createdAt: 1 })
      .toArray();

    const bookings = await Promise.all(result.map(async (booking) => {
      const volunteer = await mongoStore.getUserById(booking.userId);

      return mapBooking(booking, volunteer);
    }));

    return res.json({ bookings });
  })
);

module.exports = router;
