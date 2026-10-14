import { useEffect, useState } from 'react';
import { Clock, Eye, Minus, Plus, XCircle } from 'lucide-react';

import { api } from '../api.js';
import MonthCalendar from '../components/MonthCalendar.jsx';
import Modal from '../components/Modal.jsx';
import Notice from '../components/Notice.jsx';
import useSlots from '../hooks/useSlots.js';
import { formatLong, slotRange, todayISO } from '../utils/dates.js';

const STATUS_LABELS = { open: 'Open', full: 'Full', limited: 'Limited', lockout: 'Lockout', blocked: 'Blocked' };

export default function VisualCalendar() {
  const [date, setDate] = useState(todayISO());
  const [selectedHour, setSelectedHour] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [error, setError] = useState('');

  const { slots, capacity, setData, loading, error: loadError } = useSlots(date);

  useEffect(() => {
    setSelectedHour(null);
  }, [date]);

  const selected = slots.find((slot) => slot.startHour === selectedHour);

  async function changeCapacity(next) {
    if (!selected || next < 0 || next > 50) {
      return;
    }

    setError('');

    try {
      setData(await api.put('/slots/capacity', { date, startHour: selected.startHour, capacity: next }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleBlock() {
    setError('');

    try {
      setData(await api.put('/slots/block', { date, startHour: selected.startHour, blocked: selected.status !== 'blocked' }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function viewBookings(hour) {
    setError('');

    try {
      const data = await api.get(`/slots/bookings?date=${date}&startHour=${hour}`);

      setViewing({ hour, bookings: data.bookings });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Visual Calendar</h1>

      <Notice error={error || loadError} />

      <div className="calendar-layout">
        <MonthCalendar value={date} onChange={setDate} />

        <section className="card day-card">
          <div className="day-card-head">
            <h2>{formatLong(date)}</h2>

            <div className="capacity-meter">
              <span>
                Daily capacity: {capacity.booked}/{capacity.total}
              </span>

              <div className="meter">
                <i style={{ width: `${capacity.percent}%` }} />
              </div>

              <strong>{capacity.percent}%</strong>
            </div>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Status</th>
                <th>Booked/Limit</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4}>Loading slots...</td>
                </tr>
              )}

              {!loading &&
                slots.map((slot) => (
                  <tr key={slot.startHour} className={slot.startHour === selectedHour ? 'row-selected' : ''}>
                    <td>{slotRange(slot.startHour)}</td>

                    <td>{STATUS_LABELS[slot.status]}</td>

                    <td>{slot.note ? slot.note : `${slot.booked} / ${slot.limit}`}</td>

                    <td>
                      {slot.status === 'lockout' ? (
                        <button type="button" className="btn pill-outline grey" disabled>
                          Locked
                        </button>
                      ) : (
                        <button type="button" className="btn pill-outline" onClick={() => setSelectedHour(slot.startHour)}>
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="card controls">
        <h2>Schedule Controls</h2>

        <p className="muted-text">Manage bookings and capacity for the selected time block</p>

        {selected ? (
          <div className="controls-row">
            <div className="selected-slot">
              <Clock size={26} />

              <div>
                <strong>{formatLong(date)}</strong>

                <span>
                  {slotRange(selected.startHour)} - {STATUS_LABELS[selected.status]}
                </span>
              </div>
            </div>

            <div className="capacity-control">
              <small>Capacity limit</small>

              <div className="stepper">
                <button type="button" onClick={() => changeCapacity(selected.limit - 1)} aria-label="Lower capacity">
                  <Minus size={16} />
                </button>

                <span>{selected.limit}</span>

                <button type="button" onClick={() => changeCapacity(selected.limit + 1)} aria-label="Raise capacity">
                  <Plus size={16} />
                </button>
              </div>

              <small>Maximum visitors</small>
            </div>

            <button type="button" className="control-button outline" onClick={() => viewBookings(selected.startHour)}>
              <Eye size={26} />

              <span>
                <strong>View Bookings</strong>

                <small>See who is booked</small>
              </span>
            </button>

            <button type="button" className="control-button filled" onClick={toggleBlock}>
              <XCircle size={26} />

              <span>
                <strong>{selected.status === 'blocked' ? 'Unblock Slot' : 'Block Slot'}</strong>

                <small>{selected.status === 'blocked' ? 'Allow bookings again' : 'Prevent further bookings'}</small>
              </span>
            </button>
          </div>
        ) : (
          <p className="muted-text">Choose a time slot above to manage it.</p>
        )}
      </section>

      {viewing && (
        <Modal onClose={() => setViewing(null)}>
          <h2 className="serif">Bookings for {slotRange(viewing.hour)}</h2>

          <ul className="plain-list">
            {viewing.bookings.length === 0 && <li className="muted-text">Nobody has booked this slot yet.</li>}

            {viewing.bookings.map((booking) => (
              <li key={booking.id}>
                <strong>{booking.volunteer.fullName}</strong>

                <span>{booking.activityLabel}</span>
              </li>
            ))}
          </ul>

          <button type="button" className="btn primary block" onClick={() => setViewing(null)}>
            Close
          </button>
        </Modal>
      )}
    </div>
  );
}
