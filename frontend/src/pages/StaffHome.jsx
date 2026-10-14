import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { api } from '../api.js';
import Notice from '../components/Notice.jsx';
import SuppliesManager from './SuppliesManager.jsx';
import { supplyEmoji } from '../utils/constants.js';
import { formatShort, hourLabel, todayISO } from '../utils/dates.js';

const STATUS_LABELS = { expected: 'Expected', arrived: 'Arrived', late: 'Late', checked_out: 'Checked out' };

export default function StaffHome() {
  const navigate = useNavigate();

  const [tab, setTab] = useState('tasks');
  const [today, setToday] = useState([]);
  const [requests, setRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [writing, setWriting] = useState(false);
  const [feedback, setFeedback] = useState({ volunteerId: '', body: '' });
  const [notice, setNotice] = useState({ error: '', message: '' });

  const load = useCallback(async () => {
    try {
      const [schedule, supplies] = await Promise.all([
        api.get(`/bookings/today?date=${todayISO()}`),
        api.get('/supplies/requests'),
      ]);

      setToday(schedule.bookings);
      setRequests(supplies.requests.filter((request) => request.status !== 'fulfilled'));
    } catch (err) {
      setNotice({ error: err.message, message: '' });
    }
  }, []);

  useEffect(() => {
    if (tab === 'tasks') {
      load();
    }
  }, [tab, load]);

  async function openFeedback() {
    setWriting(true);

    if (volunteers.length === 0) {
      try {
        const data = await api.get('/users/volunteers');

        setVolunteers(data.volunteers);
      } catch (err) {
        setNotice({ error: err.message, message: '' });
      }
    }
  }

  async function sendFeedback(event) {
    event.preventDefault();

    try {
      await api.post('/feedback', { volunteerId: feedback.volunteerId, body: feedback.body });

      setFeedback({ volunteerId: '', body: '' });
      setWriting(false);
      setNotice({ error: '', message: 'Feedback sent to the volunteer.' });
    } catch (err) {
      setNotice({ error: err.message, message: '' });
    }
  }

  const nextVisit = today.find((booking) => booking.status === 'arrived') || today.find((booking) => booking.status === 'expected');

  return (
    <div className="page">
      <div className="tabs plain">
        <button type="button" className={tab === 'tasks' ? 'active' : ''} onClick={() => setTab('tasks')}>
          Tasks
        </button>

        <button type="button" className={tab === 'supplies' ? 'active' : ''} onClick={() => setTab('supplies')}>
          Supplies
        </button>
      </div>

      {tab === 'supplies' && <SuppliesManager />}

      {tab === 'tasks' && (
        <>
          <section className="banner peach">
            <h1 className="display">Welcome back!</h1>

            <p>The little things you plan today become big moments in a child's tomorrow.</p>
          </section>

          <Notice error={notice.error} message={notice.message} />

          <div className="home-grid">
            <div className="home-left">
              <section className="banner blue compact">
                <h2 className="serif">Visit Feedback</h2>

                <p>Write feedback from the Ngwana family to a volunteer</p>

                {!writing ? (
                  <button type="button" className="btn white block" onClick={openFeedback}>
                    Write feedback
                  </button>
                ) : (
                  <form className="feedback-form" onSubmit={sendFeedback}>
                    <select
                      required
                      value={feedback.volunteerId}
                      onChange={(event) => setFeedback({ ...feedback, volunteerId: event.target.value })}
                      aria-label="Volunteer"
                    >
                      <option value="">Choose a volunteer</option>

                      {volunteers.map((volunteer) => (
                        <option key={volunteer.id} value={volunteer.id}>
                          {volunteer.fullName}
                        </option>
                      ))}
                    </select>

                    <textarea
                      required
                      rows={3}
                      value={feedback.body}
                      onChange={(event) => setFeedback({ ...feedback, body: event.target.value })}
                      placeholder="Write your feedback..."
                    />

                    <div className="summary-actions">
                      <button type="button" className="btn white" onClick={() => setWriting(false)}>
                        Cancel
                      </button>

                      <button type="submit" className="btn primary">
                        Send feedback
                      </button>
                    </div>
                  </form>
                )}
              </section>

              <section className="card">
                <div className="card-head">
                  <h2>Active care requests</h2>

                  <button type="button" className="btn sky" onClick={() => setTab('supplies')}>
                    Create a request <ArrowRight size={18} />
                  </button>
                </div>

                <ul className="request-list simple">
                  {requests.length === 0 && <li className="muted-text">No open requests right now.</li>}

                  {requests.slice(0, 4).map((request) => (
                    <li key={request.id}>
                      <span className="emoji">{supplyEmoji(request.category)}</span>

                      <span>{request.title}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="home-right">
              <h3 className="section-title">Today</h3>

              <section className="card visit-highlight">
                {nextVisit ? (
                  <>
                    <h2>{nextVisit.volunteer.fullName}</h2>

                    <span className={`status-pill ${nextVisit.status}`}>{STATUS_LABELS[nextVisit.status]}</span>

                    <p>
                      {formatShort(nextVisit.date)}, {hourLabel(nextVisit.startHour)}-{hourLabel(nextVisit.startHour + 1)}
                    </p>

                    <button type="button" className="btn gold" onClick={() => navigate('/staff/volunteers')}>
                      View visit details
                    </button>
                  </>
                ) : (
                  <p className="muted-text">No volunteers are expected today.</p>
                )}
              </section>

              <h3 className="section-title">Quick Actions</h3>

              <section className="card quick-actions">
                <Link to="/staff/bookings">Block time slot</Link>

                <Link to="/staff/reports">View reports</Link>

                <Link to="/staff/volunteers">Check in volunteer</Link>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
