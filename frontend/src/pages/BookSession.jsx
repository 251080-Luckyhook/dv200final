import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import useSlots from '../hooks/useSlots.js';
import MonthCalendar from '../components/MonthCalendar.jsx';
import Notice from '../components/Notice.jsx';
import { ACTIVITIES, SUPPLY_CATEGORIES } from '../utils/constants.js';
import { addDays, formatWithYear, fromISO, hourChip, hourLabel, todayISO, weekStrip } from '../utils/dates.js';

export default function BookSession() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [date, setDate] = useState(todayISO());
  const [hour, setHour] = useState(null);
  const [activity, setActivity] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const { slots, loading } = useSlots(date);

  const chosenActivity = ACTIVITIES.find((item) => item.key === activity);

  function changeDate(next) {
    setDate(next);
    setHour(null);
  }

  function toggleItem(key) {
    setItems((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  function reset() {
    setHour(null);
    setActivity(null);
    setItems([]);
    setError('');
  }

  async function schedule() {
    setError('');
    setBusy(true);

    try {
      await api.post('/bookings', { date, startHour: hour, activity, donations: items });

      navigate('/my-visits');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const dateLabel = fromISO(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="page">
      <h1 className="page-title">Book a session</h1>

      <p className="page-sub">Select your visitation slot</p>

      <div className="book-grid">
        <div className="book-left">
          <MonthCalendar value={date} onChange={changeDate} minDate={todayISO()} />

          <section className="card care-board">
            <h2 className="serif">Care Board</h2>

            <p className="eyebrow">I'd love to help with...</p>

            <div className="care-options">
              {ACTIVITIES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`care-option ${item.tone}${activity === item.key ? ' selected' : ''}`}
                  onClick={() => setActivity(item.key)}
                  aria-pressed={activity === item.key}
                >
                  <span className="emoji">{item.emoji}</span>

                  <span>{item.label}</span>

                  <span className="radio" />
                </button>
              ))}
            </div>

            <div className="selection-box">
              <small>Your selection</small>

              <p>{chosenActivity ? chosenActivity.short : 'Nothing selected yet'}</p>

              <small>You can always change your selection for future visits.</small>
            </div>
          </section>
        </div>

        <div className="book-right">
          <section className="card day-header">
            <button type="button" onClick={() => changeDate(addDays(date, -1))} aria-label="Previous day">
              <ChevronLeft size={18} />
            </button>

            <h2 className="serif">{formatWithYear(date)}</h2>

            <button type="button" onClick={() => changeDate(addDays(date, 1))} aria-label="Next day">
              <ChevronRight size={18} />
            </button>
          </section>

          <div className="week-strip">
            {weekStrip(date).map((day) => (
              <button
                key={day.iso}
                type="button"
                disabled={day.iso < todayISO()}
                className={day.iso === date ? 'active' : ''}
                onClick={() => changeDate(day.iso)}
              >
                <span>{day.label}</span>

                <strong>{day.number}</strong>
              </button>
            ))}
          </div>

          <h3 className="section-title">Select specific time</h3>

          <section className="card slot-grid">
            {loading && <p className="muted-text">Loading times...</p>}

            {!loading &&
              slots.map((slot) => {
                const unavailable = slot.status !== 'open' && slot.status !== 'limited';

                return (
                  <button
                    key={slot.startHour}
                    type="button"
                    disabled={unavailable}
                    className={`slot-chip${hour === slot.startHour ? ' selected' : ''}`}
                    onClick={() => setHour(slot.startHour)}
                    title={unavailable ? slot.note || 'Fully booked' : ''}
                  >
                    {hourChip(slot.startHour)}
                  </button>
                );
              })}
          </section>

          <div className="book-bottom">
            <section className="card items-card">
              <p className="eyebrow">Bringing something along?</p>

              <div className="item-grid">
                {SUPPLY_CATEGORIES.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`item-tile${items.includes(item.key) ? ' selected' : ''}`}
                    onClick={() => toggleItem(item.key)}
                    aria-pressed={items.includes(item.key)}
                  >
                    <span className="emoji">{item.emoji}</span>

                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="card summary">
              <h2 className="serif">Almost there!</h2>

              <p className="summary-banner">Check everything looks right before confirming your visit.</p>

              <p>Personal details: {user.fullName}</p>

              <p>Activity added: {chosenActivity ? chosenActivity.short : 'Choose one on the Care Board'}</p>

              <p>Date &amp; time: {hour !== null ? `${dateLabel}, ${hourLabel(hour)}` : 'Pick a time'}</p>

              <small>Please arrive 5-10 minutes early and follow the house hygiene and visitor guidelines.</small>

              <Notice error={error} />

              <div className="summary-actions">
                <button type="button" className="btn outline" onClick={reset}>
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn primary"
                  disabled={busy || hour === null || !activity}
                  onClick={schedule}
                >
                  {busy ? 'Scheduling...' : 'Schedule visit'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
