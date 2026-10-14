const TIMEZONE = process.env.APP_TIMEZONE || 'Africa/Johannesburg';

// Returns today's date as YYYY-MM-DD in the app's timezone
function todayISO() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

function isValidISODate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

module.exports = { todayISO, isValidISODate };
