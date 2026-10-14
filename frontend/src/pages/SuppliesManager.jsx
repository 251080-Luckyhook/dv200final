import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Minus, Plus } from 'lucide-react';

import { api } from '../api.js';
import Modal from '../components/Modal.jsx';
import Notice from '../components/Notice.jsx';
import { REQUEST_STATUS, SUPPLY_CATEGORIES, URGENCY, supplyEmoji } from '../utils/constants.js';

function RequestForm({ category, onClose, onCreated }) {
  const [choices, setChoices] = useState({});
  const [quantity, setQuantity] = useState(2);
  const [unit, setUnit] = useState(category.units[0] || '');
  const [urgency, setUrgency] = useState('today');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const complete = category.groups.every((group) => choices[group.key]);

  async function submit() {
    setError('');
    setBusy(true);

    try {
      await api.post('/supplies/requests', {
        category: category.key,
        details: choices,
        quantity,
        unit: unit || null,
        urgency,
      });

      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <button type="button" className="icon-button" onClick={onClose} aria-label="Back">
        <ArrowLeft size={22} />
      </button>

      <div className="modal-head">
        <span className="emoji big">{category.emoji}</span>

        <div>
          <h2>{category.label}</h2>

          <p className="muted-text">Choose the details and quantity</p>
        </div>
      </div>

      {category.groups.map((group) => (
        <fieldset key={group.key}>
          <legend>{group.label}</legend>

          <div className="choice-row">
            {group.choices.map((choice) => (
              <button
                key={choice}
                type="button"
                className={`choice${group.compact ? ' compact' : ''}${choices[group.key] === choice ? ' selected' : ''}`}
                onClick={() => setChoices((current) => ({ ...current, [group.key]: choice }))}
              >
                {choice}
              </button>
            ))}
          </div>
        </fieldset>
      ))}

      <fieldset>
        <legend>Quantity</legend>

        <div className="stepper-row">
          <div className="stepper">
            <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} aria-label="Fewer">
              <Minus size={16} />
            </button>

            <span>{quantity}</span>

            <button type="button" onClick={() => setQuantity((current) => current + 1)} aria-label="More">
              <Plus size={16} />
            </button>
          </div>

          {category.units.length > 0 && (
            <select value={unit} onChange={(event) => setUnit(event.target.value)} aria-label="Unit">
              {category.units.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend>Urgency</legend>

        <div className="choice-row">
          {URGENCY.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`choice${urgency === item.key ? ' selected' : ''}`}
              onClick={() => setUrgency(item.key)}
            >
              <i className="dot" style={{ background: item.color }} />

              {item.label}
            </button>
          ))}
        </div>
      </fieldset>

      <Notice error={error} />

      <button type="button" className="btn primary block round" disabled={!complete || busy} onClick={submit}>
        {busy ? 'Creating...' : 'Create Request'}
      </button>
    </Modal>
  );
}

export default function SuppliesManager() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState({ error: '', message: '' });

  const load = useCallback(async () => {
    try {
      const data = await api.get('/supplies/requests');

      setRequests(data.requests);
    } catch (err) {
      setNotice({ error: err.message, message: '' });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id, status) {
    try {
      await api.patch(`/supplies/requests/${id}`, { status });

      await load();
    } catch (err) {
      setNotice({ error: err.message, message: '' });
    }
  }

  return (
    <div>
      <section className="banner blue">
        <h1 className="serif">Create care request to inform volunteers</h1>

        <p>Select a category to start</p>
      </section>

      <Notice error={notice.error} message={notice.message} />

      <div className="supplies-grid">
        <section className="card">
          <div className="category-grid">
            {SUPPLY_CATEGORIES.map((category) => (
              <button key={category.key} type="button" className="category-tile" onClick={() => setSelected(category)}>
                <span className="emoji big">{category.emoji}</span>

                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Active care requests</h2>

          <ul className="request-list">
            {requests.length === 0 && <li className="muted-text">No care requests yet. Pick a category to create one.</li>}

            {requests.map((request) => {
              const urgency = URGENCY.find((item) => item.key === request.urgency);

              return (
                <li key={request.id}>
                  <span className="emoji">{supplyEmoji(request.category)}</span>

                  <span className="request-title">
                    {request.title}

                    <small>
                      {request.quantity} {request.unit || ''} <i className="dot" style={{ background: urgency.color }} /> {urgency.label}
                    </small>
                  </span>

                  <select
                    value={request.status}
                    onChange={(event) => updateStatus(request.id, event.target.value)}
                    aria-label={`Status for ${request.title}`}
                  >
                    {REQUEST_STATUS.map((status) => (
                      <option key={status.key} value={status.key}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {selected && (
        <RequestForm
          category={selected}
          onClose={() => setSelected(null)}
          onCreated={() => {
            setSelected(null);
            setNotice({ error: '', message: 'Care request created. Volunteers can now see it.' });
            load();
          }}
        />
      )}
    </div>
  );
}
