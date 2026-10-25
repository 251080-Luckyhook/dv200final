import { useCallback, useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';

import { api } from '../api.js';
import MonthCalendar from '../components/MonthCalendar.jsx';
import Modal from '../components/Modal.jsx';
import Notice from '../components/Notice.jsx';
import useSlots from '../hooks/useSlots.js';
import { ACTIVITIES } from '../utils/constants.js';
import { formatLong, formatShort, hourChip, slotRange, todayISO } from '../utils/dates.js';

function RescheduleModal({ booking, onClose, onDone }) {
  const [date, setDate] = useState(booking.date);
  const [hour, setHour] = useState(null);
  const [error, setError] = useState('');

  const { slots, loading } = useSlots(date);

  async function confirm() {
    setError('');

    try {
      await api.patch(`/bookings/${booking.id}/reschedule`, { date, startHour: hour });

      onDone();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal onClose={onClose} wide>
      <h2 className="serif">Reschedule your visit</h2>

      <div className="reschedule-grid">
        <MonthCalendar
          value={date}
          minDate={todayISO()}
          onChange={(next) => {
            setDate(next);
            setHour(null);
          }}
        />

        <div>
          <h3 className="section-title">{formatLong(date)}</h3>

          <div className="slot-grid plain">
            {loading && <p className="muted-text">Loading times...</p>}

            {!loading &&
              slots.map((slot) => (
                <button
                  key={slot.startHour}
                  type="button"
                  disabled={slot.status !== 'open' && slot.status !== 'limited'}
                  className={`slot-chip${hour === slot.startHour ? ' selected' : ''}`}
                  onClick={() => setHour(slot.startHour)}
                >
                  {hourChip(slot.startHour)}
                </button>
              ))}
          </div>

          <Notice error={error} />

          <div className="summary-actions">
            <button type="button" className="btn outline" onClick={onClose}>
              Keep current time
            </button>

            <button type="button" className="btn primary" disabled={hour === null} onClick={confirm}>
              Confirm new time
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function MyVisits() {
  const [bookings, setBookings] = useState([]);
  const [history, setHistory] = useState({ totalHours: 0, byActivity: [] });
  const [feedback, setFeedback] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState({ error: '', message: '' });
  const [showCancel, setShowCancel] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const loadCommunication = useCallback(async () => {
    try {
      const [fb, messageData] = await Promise.all([
        api.get('/feedback/mine'),
        api.get('/feedback/messages'),
      ]);

      setFeedback(fb.feedback);
      setMessages(messageData.messages);
    } catch (err) {
      setNotice({ error: err.message, message: '' });
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const [mine, hist] = await Promise.all([
        api.get('/bookings/mine'),
        api.get('/bookings/history'),
      ]);

      setBookings(mine.bookings);
      setHistory(hist);
      await loadCommunication();
    } catch (err) {
      setNotice({ error: err.message, message: '' });
    }
  }, [loadCommunication]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(loadCommunication, 15000);

    return () => window.clearInterval(timer);
  }, [loadCommunication]);

  const today = todayISO();

  const upcoming = bookings.find(
    (booking) => booking.date >= today && ['expected', 'late', 'arrived'].includes(booking.status)
  );

  async function run(action, successMessage) {
    setNotice({ error: '', message: '' });

    try {
      await action();

      setNotice({ error: '', message: successMessage });
      setShowCancel(false);

      await load();
      return true;
    } catch (err) {
      setNotice({ error: err.message, message: '' });
      return false;
    }
  }

  async function sendMessage(event) {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    const sent = await run(() => api.post('/feedback/messages', { body: message }), 'Message sent to the staff.');

    if (sent) {
      setMessage('');
    }
  }

  function activityEmoji(key) {
    const match = ACTIVITIES.find((item) => item.key === key);

    return match ? match.emoji : '💛';
  }

  return (
    <div className="page">
      <Notice error={notice.error} message={notice.message} />

      <section className="card visit-card">
        <h1 className="serif">Your scheduled visits</h1>

        {upcoming ? (
          <>
            <div className="visit-row">
              <Calendar size={54} strokeWidth={1.4} />

              <div>
                <h2>{formatLong(upcoming.date)}</h2>

                <p className="strong">{slotRange(upcoming.startHour)}</p>

                <p className="accent">{upcoming.activityLabel}</p>

                {upcoming.status === 'late' && <p className="muted-text">Staff know you are running late.</p>}
              </div>

              <div className="visit-actions">
                <button type="button" className="btn outline gold" onClick={() => setRescheduling(true)}>
                  Reschedule
                </button>

                <button
                  type="button"
                  className="btn gold"
                  disabled={upcoming.date !== today || upcoming.status === 'arrived'}
                  onClick={() => run(() => api.post(`/bookings/${upcoming.id}/check-in`), 'You are checked in. Thank you!')}
                >
                  {upcoming.status === 'arrived' ? 'Checked in' : 'Check in'}
                </button>
              </div>
            </div>

            <button type="button" className="pill-tag" onClick={() => setShowCancel((current) => !current)}>
              CANCEL/LATE
            </button>

            {showCancel && (
              <div className="inline-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => run(() => api.post(`/bookings/${upcoming.id}/late`), 'Staff have been told you are running late.')}
                  disabled={upcoming.status !== 'expected'}
                >
                  I'm running late
                </button>

                <button
                  type="button"
                  className="btn outline danger"
                  onClick={() => run(() => api.del(`/bookings/${upcoming.id}`), 'Your visit has been cancelled.')}
                >
                  Cancel this visit
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="muted-text">You have no upcoming visits. Head to Bookings to schedule one.</p>
        )}
      </section>

      <div className="visits-grid">
        <section className="card feedback-card">
          <h2 className="serif">Visit Feedback</h2>

          <p className="lead">Feedback from your Ngwana family</p>

          <div className="feedback-list">
            {feedback.length === 0 && <p className="muted-text">No feedback yet. It will appear here after your visits.</p>}

            {feedback.map((item) => (
              <article key={item.id} className="feedback-item">
                <h3>{item.author}</h3>

                <small>{formatShort(item.createdAt.slice(0, 10))}</small>

                <p>{item.body}</p>
              </article>
            ))}
          </div>

          <h3 className="message-history-title">Messages with staff</h3>
          <div className="feedback-list message-history" aria-live="polite">
            {messages.length === 0 && <p className="muted-text">Your messages to staff and their replies will appear here.</p>}
            {[...messages].reverse().map((item) => (
              <article key={item.id} className={`feedback-item message-item${item.fromMe ? ' from-me' : ''}`}>
                <h3>{item.fromMe ? 'You' : item.sender || 'Ngwana Huis staff'}</h3>
                <small>{formatShort(item.createdAt.slice(0, 10))}</small>
                <p>{item.body}</p>
              </article>
            ))}
          </div>

          <form className="message-form" onSubmit={sendMessage}>
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write a message to the staff..."
              aria-label="Message to the staff"
            />

            <button type="submit" className="btn primary">
              Send
            </button>
          </form>
        </section>

        <section className="card history-card">
          <h2 className="serif">Your care history</h2>

          <div className="hours-box">
            <strong>{history.totalHours}</strong>

            <span>hrs total</span>

            <p>Thank you for your time and care!</p>
          </div>

          <ul className="history-list">
            {history.byActivity.length === 0 && <li className="muted-text">Your hours will appear after your first visit.</li>}

            {history.byActivity.map((item) => (
              <li key={item.activity}>
                <span className="emoji">{activityEmoji(item.activity)}</span>

                <span>{item.label}</span>

                <strong>{item.hours} hrs</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {rescheduling && upcoming && (
        <RescheduleModal
          booking={upcoming}
          onClose={() => setRescheduling(false)}
          onDone={() => {
            setRescheduling(false);
            setNotice({ error: '', message: 'Your visit has been moved.' });
            load();
          }}
        />
      )}
    </div>
  );
}
