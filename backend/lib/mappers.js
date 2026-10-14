const { ACTIVITIES } = require('./constants');

function shortName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/);

  if (parts.length < 2) {
    return parts[0] || '';
  }

  return parts[0] + ' ' + parts[parts.length - 1].charAt(0).toUpperCase() + '.';
}

function mapBooking(row, user) {
  const activity = ACTIVITIES[row.activity] || { label: row.activity, type: 'Other' };

  return {
    id: row._id.toString(),
    date: row.date,
    startHour: row.startHour,
    activity: row.activity,
    activityLabel: activity.label,
    activityType: activity.type,
    childName: row.childName,
    donations: row.donations || [],
    status: row.status,
    checkedInAt: row.checkedInAt,
    checkedOutAt: row.checkedOutAt,
    hoursLogged: Number(row.hoursLogged || 0),
    volunteer: user
      ? {
          id: user._id.toString(),
          fullName: user.fullName,
          shortName: shortName(user.fullName),
          phone: user.phone,
          email: user.email,
        }
      : undefined,
  };
}

function mapCareRequest(row) {
  return {
    id: row._id.toString(),
    category: row.category,
    title: row.title,
    details: row.details,
    quantity: row.quantity,
    unit: row.unit,
    urgency: row.urgency,
    status: row.status,
    createdAt: row.createdAt,
  };
}

module.exports = { shortName, mapBooking, mapCareRequest };
