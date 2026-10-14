const express = require('express');

const mongoStore = require('../mongoStore');
const wrap = require('../lib/wrap');
const { ACTIVITIES } = require('../lib/constants');
const { mapBooking } = require('../lib/mappers');
const { todayISO } = require('../lib/dates');
const { requireAuth, requireStaff } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireStaff);

async function attachVolunteer(booking) {
  const volunteer = await mongoStore.getUserById(booking.userId);

  return mapBooking(booking, volunteer);
}

router.get(
  '/summary',
  wrap(async (req, res) => {
    const month = todayISO().slice(0, 7);
    const [recent, hours, materials] = await Promise.all([
      mongoStore.getCollection('bookings')
        .find({ status: { $in: ['arrived', 'checked_out', 'late'] } })
        .sort({ date: -1, startHour: -1 })
        .limit(5)
        .toArray(),
      mongoStore.getCollection('bookings')
        .aggregate([
          { $match: { status: 'checked_out' } },
          { $group: { _id: '$activity', hours: { $sum: '$hoursLogged' } } },
        ])
        .toArray(),
      mongoStore.getCollection('careRequests')
        .aggregate([
          { $match: { status: 'fulfilled', updatedAt: { $gte: new Date(`${month}-01T00:00:00`) } } },
          { $group: { _id: '$category', total: { $sum: '$quantity' } } },
          { $sort: { total: -1 } },
        ])
        .toArray(),
    ]);

    const hoursByType = {};

    hours.forEach((row) => {
      const type = (ACTIVITIES[row._id] || { type: 'Other' }).type;

      hoursByType[type] = (hoursByType[type] || 0) + row.hours;
    });

    const totalHours = Object.values(hoursByType).reduce((sum, value) => sum + value, 0);
    const materialsByCategory = materials.map((row) => ({ category: row._id, total: row.total }));
    const itemsSourced = materialsByCategory.reduce((sum, row) => sum + row.total, 0);

    return res.json({
      recentActivity: await Promise.all(recent.map(attachVolunteer)),
      totalHours,
      hoursByType,
      materials: { total: itemsSourced, byCategory: materialsByCategory },
    });
  })
);

router.get(
  '/monthly.csv',
  wrap(async (req, res) => {
    const month = todayISO().slice(0, 7);
    const result = await mongoStore.getCollection('bookings')
      .find({ date: { $regex: `^${month}-` } })
      .sort({ date: 1, startHour: 1 })
      .toArray();
    const rows = await Promise.all(result.map(async (booking) => {
      const volunteer = await mongoStore.getUserById(booking.userId);

      return {
        date: booking.date,
        startHour: booking.startHour,
        fullName: volunteer ? volunteer.fullName : '',
        activity: booking.activity,
        status: booking.status,
        hoursLogged: booking.hoursLogged || 0,
      };
    }));

    const escape = (value) => `"${String(value).replace(/"/g, '""')}"`;
    const lines = ['Date,Start hour,Volunteer,Activity,Status,Hours logged'];

    rows.forEach((row) => {
      lines.push(
        [
          row.date,
          row.startHour,
          escape(row.fullName),
          escape((ACTIVITIES[row.activity] || { label: row.activity }).label),
          row.status,
          row.hoursLogged,
        ].join(',')
      );
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ngwana-huis-monthly-report.csv"');

    return res.send(lines.join('\n'));
  })
);

module.exports = router;
