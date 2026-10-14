const mongoStore = require('../mongoStore');

const FIRST_HOUR = 9;
const LAST_HOUR = 17;
const NAP_HOUR = 12;
const DEFAULT_CAPACITY = 8;

async function isReducedCapacity() {
  const result = await mongoStore.getCollection('settings').findOne({ _id: 'reduced_capacity' });

  return result?.value === true;
}

// Builds the list of hourly slots for a date, with booked counts and a status for each one
async function getSlotsForDate(date) {
  const [overrideResult, countResult, reduced] = await Promise.all([
    mongoStore.getCollection('slotOverrides').find({ date }).toArray(),
    mongoStore.getCollection('bookings')
      .aggregate([
        { $match: { date, status: { $ne: 'cancelled' } } },
        { $group: { _id: '$startHour', booked: { $sum: 1 } } },
      ])
      .toArray(),
    isReducedCapacity(),
  ]);

  const overrides = {};
  const counts = {};

  overrideResult.forEach((row) => {
    overrides[row.startHour] = row;
  });

  countResult.forEach((row) => {
    counts[row._id] = row.booked;
  });

  const baseCapacity = DEFAULT_CAPACITY - (reduced ? 1 : 0);
  const slots = [];

  for (let hour = FIRST_HOUR; hour <= LAST_HOUR; hour += 1) {
    const override = overrides[hour];
    const booked = counts[hour] || 0;
    const limit = override && override.capacity !== null ? override.capacity : baseCapacity;

    let status = 'open';
    let note = null;

    const explicitlyBlocked = override && override.blocked === true;
    const explicitlyUnblocked = override && override.blocked === false;

    if (explicitlyBlocked) {
      status = 'blocked';
      note = 'Blocked';
    } else if (hour === NAP_HOUR && !explicitlyUnblocked) {
      status = 'lockout';
      note = 'Nap time';
    } else if (booked >= limit) {
      status = 'full';
    } else if (booked >= limit * 0.7) {
      status = 'limited';
    }

    slots.push({ startHour: hour, status, booked, limit, note });
  }

  const bookable = slots.filter((slot) => slot.status !== 'lockout' && slot.status !== 'blocked');
  const totalBooked = bookable.reduce((sum, slot) => sum + slot.booked, 0);
  const totalLimit = bookable.reduce((sum, slot) => sum + slot.limit, 0);

  return {
    date,
    slots,
    capacity: {
      booked: totalBooked,
      total: totalLimit,
      percent: totalLimit > 0 ? Math.round((totalBooked / totalLimit) * 100) : 0,
    },
  };
}

async function isSlotAvailable(date, startHour) {
  const { slots } = await getSlotsForDate(date);
  const slot = slots.find((item) => item.startHour === startHour);

  return Boolean(slot) && (slot.status === 'open' || slot.status === 'limited');
}

module.exports = { getSlotsForDate, isSlotAvailable, FIRST_HOUR, LAST_HOUR };
