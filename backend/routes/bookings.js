const express = require('express');

const mongoStore = require('../mongoStore');
const wrap = require('../lib/wrap');
const { ACTIVITIES, DONATION_ITEMS } = require('../lib/constants');
const { mapBooking } = require('../lib/mappers');
const { isSlotAvailable } = require('../lib/slots');
const { isValidISODate, todayISO } = require('../lib/dates');
const { requireAuth, requireStaff } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

const bookings = () => mongoStore.getCollection('bookings');

async function findOwnBooking(id, userId) {
  const _id = mongoStore.toObjectId(id);

  return _id ? bookings().findOne({ _id, userId }) : null;
}

async function mapBookingWithUser(booking) {
  const user = await mongoStore.getUserById(booking.userId);

  return mapBooking(booking, user);
}

// Create a booking
router.post(
  '/',
  wrap(async (req, res) => {
    const { date, startHour, activity } = req.body;
    const donations = Array.isArray(req.body.donations) ? req.body.donations : [];

    if (!isValidISODate(date) || !Number.isInteger(startHour)) {
      return res.status(400).json({ error: 'Pick a date and a time for your visit.' });
    }

    if (date < todayISO()) {
      return res.status(400).json({ error: 'You cannot book a visit in the past.' });
    }

    if (!ACTIVITIES[activity]) {
      return res.status(400).json({ error: 'Choose how you would like to help.' });
    }

    if (!donations.every((item) => DONATION_ITEMS.includes(item))) {
      return res.status(400).json({ error: 'One of the selected items is not recognised.' });
    }

    if (!(await isSlotAvailable(date, startHour))) {
      return res.status(409).json({ error: 'That time is no longer available. Please pick another.' });
    }

    const duplicate = await bookings().findOne({
      userId: req.user.id,
      date,
      startHour,
      status: { $ne: 'cancelled' },
    });

    if (duplicate) {
      return res.status(409).json({ error: 'You already have a visit booked at that time.' });
    }

    const booking = {
      userId: req.user.id,
      date,
      startHour,
      activity,
      childName: null,
      donations,
      status: 'expected',
      checkedInAt: null,
      checkedOutAt: null,
      hoursLogged: 0,
      createdAt: new Date(),
    };
    const result = await bookings().insertOne(booking);

    return res.status(201).json({
      booking: await mapBookingWithUser({ ...booking, _id: result.insertedId }),
    });
  })
);

// The signed-in volunteer's own bookings
router.get(
  '/mine',
  wrap(async (req, res) => {
    const result = await bookings()
      .find({ userId: req.user.id, status: { $ne: 'cancelled' } })
      .sort({ date: 1, startHour: 1 })
      .toArray();

    return res.json({ bookings: await Promise.all(result.map(mapBookingWithUser)) });
  })
);

// Total hours and hours per activity for the signed-in volunteer
router.get(
  '/history',
  wrap(async (req, res) => {
    const result = await bookings()
      .aggregate([
        { $match: { userId: req.user.id, status: 'checked_out' } },
        { $group: { _id: '$activity', hours: { $sum: '$hoursLogged' } } },
        { $sort: { hours: -1 } },
      ])
      .toArray();

    const byActivity = result.map((row) => ({
      activity: row._id,
      label: (ACTIVITIES[row._id] || { label: row._id }).label,
      hours: row.hours,
    }));
    const totalHours = byActivity.reduce((sum, item) => sum + item.hours, 0);

    return res.json({ totalHours, byActivity });
  })
);

// Today's schedule for staff
router.get(
  '/today',
  requireStaff,
  wrap(async (req, res) => {
    const date = req.query.date && isValidISODate(req.query.date) ? req.query.date : todayISO();
    const result = await bookings()
      .find({ date, status: { $ne: 'cancelled' } })
      .sort({ startHour: 1, createdAt: 1 })
      .toArray();

    return res.json({ date, bookings: await Promise.all(result.map(mapBookingWithUser)) });
  })
);

// Reschedule one of your own bookings
router.patch(
  '/:id/reschedule',
  wrap(async (req, res) => {
    const { date, startHour } = req.body;

    if (!isValidISODate(date) || !Number.isInteger(startHour)) {
      return res.status(400).json({ error: 'Pick a new date and time.' });
    }

    if (date < todayISO()) {
      return res.status(400).json({ error: 'You cannot move a visit into the past.' });
    }

    const booking = await findOwnBooking(req.params.id, req.user.id);

    if (!booking || booking.status === 'cancelled') {
      return res.status(404).json({ error: 'We could not find that visit.' });
    }

    if (!(await isSlotAvailable(date, startHour))) {
      return res.status(409).json({ error: 'That time is no longer available. Please pick another.' });
    }

    const duplicate = await bookings().findOne({
      _id: { $ne: booking._id },
      userId: req.user.id,
      date,
      startHour,
      status: { $ne: 'cancelled' },
    });

    if (duplicate) {
      return res.status(409).json({ error: 'You already have a visit booked at that time.' });
    }

    const result = await bookings().findOneAndUpdate(
      { _id: booking._id },
      { $set: { date, startHour, status: 'expected' } },
      { returnDocument: 'after' }
    );

    return res.json({ booking: await mapBookingWithUser(result) });
  })
);

// Cancel one of your own bookings
router.delete(
  '/:id',
  wrap(async (req, res) => {
    const booking = await findOwnBooking(req.params.id, req.user.id);

    if (!booking) {
      return res.status(404).json({ error: 'We could not find that visit.' });
    }

    await bookings().updateOne({ _id: booking._id }, { $set: { status: 'cancelled' } });

    return res.json({ ok: true });
  })
);

// Tell staff you are running late
router.post(
  '/:id/late',
  wrap(async (req, res) => {
    const booking = await findOwnBooking(req.params.id, req.user.id);

    if (!booking || booking.status !== 'expected') {
      return res.status(404).json({ error: 'We could not find an upcoming visit to update.' });
    }

    const result = await bookings().findOneAndUpdate(
      { _id: booking._id },
      { $set: { status: 'late' } },
      { returnDocument: 'after' }
    );

    return res.json({ booking: await mapBookingWithUser(result) });
  })
);

// Volunteer checks themselves in (only on the day of the visit)
router.post(
  '/:id/check-in',
  wrap(async (req, res) => {
    const booking = await findOwnBooking(req.params.id, req.user.id);

    if (!booking || booking.status === 'cancelled') {
      return res.status(404).json({ error: 'We could not find that visit.' });
    }

    if (booking.date !== todayISO()) {
      return res.status(400).json({ error: 'You can only check in on the day of your visit.' });
    }

    const result = await bookings().findOneAndUpdate(
      { _id: booking._id },
      { $set: { status: 'arrived', checkedInAt: booking.checkedInAt || new Date() } },
      { returnDocument: 'after' }
    );

    return res.json({ booking: await mapBookingWithUser(result) });
  })
);

// Staff update a volunteer's status (expected, arrived, late, checked_out)
router.patch(
  '/:id/status',
  requireStaff,
  wrap(async (req, res) => {
    const { status } = req.body;

    if (!['expected', 'arrived', 'late', 'checked_out'].includes(status)) {
      return res.status(400).json({ error: 'That status is not recognised.' });
    }

    const _id = mongoStore.toObjectId(req.params.id);
    const booking = _id ? await bookings().findOne({ _id }) : null;

    if (!booking) {
      return res.status(404).json({ error: 'We could not find that visit.' });
    }

    const updates = { status };

    if (status === 'arrived') {
      updates.checkedInAt = booking.checkedInAt || new Date();
    } else if (status === 'checked_out') {
      const startedAt = booking.checkedInAt ? new Date(booking.checkedInAt) : null;
      const elapsedHours = startedAt ? (Date.now() - startedAt.getTime()) / 3600000 : 1;
      updates.checkedOutAt = new Date();
      updates.hoursLogged = Math.min(Math.max(Math.round(elapsedHours * 2) / 2, 0.5), 9);
    }

    const result = await bookings().findOneAndUpdate(
      { _id: booking._id },
      { $set: updates },
      { returnDocument: 'after' }
    );

    return res.json({ booking: await mapBookingWithUser(result) });
  })
);

module.exports = router;
