import { useCallback, useEffect, useState } from 'react';

import { api } from '../api.js';
import Notice from '../components/Notice.jsx';
import { supplyEmoji } from '../utils/constants.js';
import { formatShort, hourLabel, todayISO } from '../utils/dates.js';

const STATUS_LABELS = { expected: 'Expected', arrived: 'Arrived', late: 'Late', checked_out: 'Checked out' };

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function ShiftBoard() {
  const [bookings, setBookings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState({ error: '', message: '' });

  const load = useCallback(async () => {
    try {
      const data = await api.get(`/bookings/today?date=${todayISO()}`);

      setBookings(data.bookings);
      setSelectedId((current) => current || (data.bookings[0] && data.bookings[0].id) || null);
    } catch (err) {
      setNotice({ error: err.message, message: '' });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = bookings.find((booking) => booking.id === selectedId);

  async function updateStatus(status) {
    setNotice({ error: '', message: '' });

    try {
      await api.patch(`/bookings/${selected.id}/status`, { status });

      await load();
    } catch (err) {
      setNotice({ error: err.message, message: '' });
    }
  }

  async function sendMessage(event) {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    try {
      await api.post('/feedback/messages', { volunteerId: selected.volunteer.id, body: message });

      setMessage('');
      setNotice({ error: '', message: 'Message sent.' });
    } catch (err) {
      setNotice({ error: err.message, message: '' });
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Today's volunteer schedule</h1>

      <Notice error={notice.error} message={notice.message} />

      {bookings.length === 0 ? (
        <section className="banner grey">
          <h2 className="serif">No volunteers today</h2>

          <p>Volunteers will appear here once they have booked a visit.</p>
        </section>
      ) : (
        <>
          <div className="shift-layout">
            <ul className="shift-list">
              {bookings.map((booking) => (
                <li key={booking.id}>
                  <button
                    type="button"
                    className={`shift-item${booking.id === selectedId ? ' selected' : ''}`}
                    onClick={() => setSelectedId(booking.id)}
                  >
                    <span>
                      <strong>{booking.volunteer.fullName.toUpperCase()}</strong>

                      <small>
                        {formatShort(booking.date)}, {hourLabel(booking.startHour)}-{hourLabel(booking.startHour + 1)}
                      </small>
                    </span>

                    <span className={`status-pill ${booking.status}`}>{STATUS_LABELS[booking.status]}</span>
                  </button>
                </li>
              ))}
            </ul>

            {selected && (
              <section className="shift-detail">
                <h2>{selected.volunteer.fullName.toUpperCase()}</h2>

                <p>
                  {formatShort(selected.date)}, {hourLabel(selected.startHour)}-{hourLabel(selected.startHour + 1)}
                </p>

                <dl>
                  <dt>Selected Child:</dt>
                  <dd>{selected.childName || 'To be assigned'}</dd>

                  <dt>Donations:</dt>
                  <dd>
                    {selected.donations.length === 0
                      ? 'None'
                      : selected.donations.map((item) => `${supplyEmoji(item)} ${item.replace('_', ' ')}`).join(', ')}
                  </dd>

                  <dt>Selected Cares:</dt>
                  <dd>
                    <span className="tag gold">{selected.activityLabel}</span>
                  </dd>

                  <dt>Contact:</dt>
                  <dd>{selected.volunteer.phone || selected.volunteer.email || 'Not provided'}</dd>
                </dl>

                <form className="message-form" onSubmit={sendMessage}>
                  <input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Write a message to volunteer..."
                    aria-label="Message to volunteer"
                  />

                  <button type="submit" className="btn primary">
                    Send
                  </button>
                </form>
              </section>
            )}
          </div>

          {selected && (
            <section className="card status-card">
              <h2 className="serif">Volunteer Status</h2>

              <p className="muted-text">Update status of volunteer</p>

              <p className="strong">{selected.volunteer.fullName.toUpperCase()}</p>

              <div className="summary-actions left">
                <button
                  type="button"
                  className="btn gold"
                  disabled={selected.status === 'arrived' || selected.status === 'checked_out'}
                  onClick={() => updateStatus('arrived')}
                >
                  Check in
                </button>

                <button
                  type="button"
                  className="btn outline gold"
                  disabled={selected.status !== 'arrived'}
                  onClick={() => updateStatus('checked_out')}
                >
                  Check out
                </button>

                <button
                  type="button"
                  className="btn outline"
                  disabled={selected.status !== 'expected'}
                  onClick={() => updateStatus('late')}
                >
                  Mark as late
                </button>
              </div>

              <div className="visit-log">
                <strong>Time-stamped visit log</strong>

                {!selected.checkedInAt && <span>Not checked in yet</span>}

                {selected.checkedInAt && <span>{formatTime(selected.checkedInAt)} - checked in</span>}

                {selected.checkedOutAt && (
                  <span>
                    {formatTime(selected.checkedOutAt)} - checked out ({selected.hoursLogged} hrs logged)
                  </span>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
