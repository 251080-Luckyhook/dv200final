export function toISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function fromISO(iso) {
  const [year, month, day] = iso.split('-').map(Number);

  return new Date(year, month - 1, day);
}

export function todayISO() {
  return toISO(new Date());
}

export function addDays(iso, amount) {
  const date = fromISO(iso);

  date.setDate(date.getDate() + amount);

  return toISO(date);
}

// "Tuesday, April 8"
export function formatLong(iso) {
  return fromISO(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// "8 April 2025"
export function formatWithYear(iso) {
  return fromISO(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// "10 April"
export function formatShort(iso) {
  return fromISO(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

// "MON, FEB 16"
export function formatHeading(iso) {
  return fromISO(iso)
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .toUpperCase();
}

// 9 -> "9:00am"
export function hourLabel(hour) {
  const twelve = hour % 12 || 12;

  return `${twelve}:00${hour < 12 ? 'am' : 'pm'}`;
}

// 9 -> "9 AM"
export function hourChip(hour) {
  const twelve = hour % 12 || 12;

  return `${twelve} ${hour < 12 ? 'AM' : 'PM'}`;
}

// 9 -> "9:00am-10:00am"
export function slotRange(hour) {
  return `${hourLabel(hour)}-${hourLabel(hour + 1)}`;
}

// Monday-to-Saturday strip for the week that contains the given date
export function weekStrip(iso) {
  const date = fromISO(iso);
  const offset = (date.getDay() + 6) % 7;

  const monday = new Date(date);

  monday.setDate(date.getDate() - offset);

  return Array.from({ length: 6 }, (_, index) => {
    const day = new Date(monday);

    day.setDate(monday.getDate() + index);

    return {
      iso: toISO(day),
      label: day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      number: day.getDate(),
    };
  });
}
