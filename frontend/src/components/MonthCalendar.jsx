import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';

import { formatHeading, fromISO, toISO } from '../utils/dates.js';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function MonthCalendar({ value, onChange, minDate }) {
  const selected = fromISO(value);

  const [cursor, setCursor] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1));

  // Keep the visible month in step when the selected date moves to another month
  useEffect(() => {
    setCursor(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [value]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const leadingBlanks = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];

  for (let index = 0; index < leadingBlanks; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toISO(new Date(year, month, day)));
  }

  function shiftMonth(amount) {
    setCursor(new Date(year, month + amount, 1));
  }

  return (
    <section className="calendar-card">
      <p className="calendar-label">Select Date</p>

      <div className="calendar-head">
        <h3>{formatHeading(value)}</h3>

        <Pencil size={20} strokeWidth={1.6} />
      </div>

      <div className="calendar-month">
        <span>{cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>

        <div>
          <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>

          <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((letter, index) => (
          <span key={index} className="calendar-weekday">
            {letter}
          </span>
        ))}

        {cells.map((iso, index) =>
          iso ? (
            <button
              key={iso}
              type="button"
              disabled={minDate && iso < minDate}
              className={`calendar-day${iso === value ? ' selected' : ''}`}
              onClick={() => onChange(iso)}
            >
              {Number(iso.slice(8))}
            </button>
          ) : (
            <span key={`blank-${index}`} />
          )
        )}
      </div>
    </section>
  );
}
