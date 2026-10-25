import { useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '../api.js';
import Notice from '../components/Notice.jsx';
import { ROLE_LABELS } from '../utils/constants.js';

export default function StaffMessages() {
  const [volunteers, setVolunteers] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [notice, setNotice] = useState({ error: '', message: '' });

  const loadInbox = useCallback(async () => {
    try {
      const [volunteerData, inboxData] = await Promise.all([
        api.get('/users/volunteers'),
        api.get('/feedback/messages/inbox'),
      ]);

      setVolunteers(volunteerData.volunteers);
      setInbox(inboxData.messages);
      setSelectedId((current) => current || inboxData.messages[0]?.volunteerId || volunteerData.volunteers[0]?.id || '');
    } catch (err) {
      setNotice({ error: err.message, message: '' });
    }
  }, []);

  const loadMessages = useCallback(async () => {
    if (!selectedId) {
      setMessages([]);

      return;
    }

    try {
      const data = await api.get(`/feedback/messages?volunteerId=${encodeURIComponent(selectedId)}`);

      setMessages(data.messages);
    } catch (err) {
      setNotice({ error: err.message, message: '' });
    }
  }, [selectedId]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    loadMessages();

    const timer = window.setInterval(() => {
      loadInbox();
      loadMessages();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [loadInbox, loadMessages]);

  const latestByVolunteer = useMemo(() => {
    const latest = new Map();

    inbox.forEach((message) => {
      if (!latest.has(message.volunteerId)) {
        latest.set(message.volunteerId, message);
      }
    });

    return latest;
  }, [inbox]);

  const volunteerList = useMemo(
    () =>
      [...volunteers].sort((first, second) => {
        const firstMessage = latestByVolunteer.get(first.id);
        const secondMessage = latestByVolunteer.get(second.id);

        if (firstMessage && secondMessage) {
          return new Date(secondMessage.createdAt) - new Date(firstMessage.createdAt);
        }

        if (firstMessage) return -1;
        if (secondMessage) return 1;

        return first.fullName.localeCompare(second.fullName);
      }),
    [volunteers, latestByVolunteer]
  );

  const selectedVolunteer = volunteers.find((volunteer) => volunteer.id === selectedId);

  async function sendMessage(event) {
    event.preventDefault();

    if (!selectedId || !body.trim()) {
      return;
    }

    setNotice({ error: '', message: '' });

    try {
      await api.post('/feedback/messages', { volunteerId: selectedId, body });
      setBody('');
      setNotice({ error: '', message: 'Message sent to the volunteer.' });
      await Promise.all([loadInbox(), loadMessages()]);
    } catch (err) {
      setNotice({ error: err.message, message: '' });
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Volunteer messages</h1>
      <p>Messages are shared with all staff and administrators.</p>
      <Notice error={notice.error} message={notice.message} />

      <section className="card staff-messages">
        <aside className="staff-message-list" aria-label="Volunteer conversations">
          <h2 className="serif">Conversations</h2>
          {volunteerList.length === 0 && <p className="muted-text">No volunteers found.</p>}
          {volunteerList.map((volunteer) => {
            const latest = latestByVolunteer.get(volunteer.id);

            return (
              <button
                key={volunteer.id}
                type="button"
                className={`staff-message-person${selectedId === volunteer.id ? ' selected' : ''}`}
                onClick={() => setSelectedId(volunteer.id)}
              >
                <strong>{volunteer.fullName} <span className="message-role">({ROLE_LABELS[volunteer.role] || volunteer.role})</span></strong>
                <small>
                  {latest
                    ? `${latest.sender} (${ROLE_LABELS[latest.senderRole] || latest.senderRole || 'Unknown role'}): ${latest.body}`
                    : 'No messages yet'}
                </small>
              </button>
            );
          })}
        </aside>

        <div className="staff-message-thread">
          <h2 className="serif">{selectedVolunteer?.fullName || 'Select a volunteer'}</h2>
          <div className="staff-message-history" aria-live="polite">
            {messages.length === 0 && (
              <p className="muted-text">No messages in this conversation yet. Send a message to get started.</p>
            )}
            {[...messages].reverse().map((message) => (
              <article key={message.id} className={`staff-message${message.fromMe ? ' from-me' : ''}`}>
                <strong>
                  {message.fromMe ? 'You' : message.sender || 'Volunteer'}
                  {' '}
                  <span className="message-role">({ROLE_LABELS[message.senderRole] || message.senderRole || 'Unknown role'})</span>
                </strong>
                <p>{message.body}</p>
                <small>{new Date(message.createdAt).toLocaleString()}</small>
              </article>
            ))}
          </div>

          <form className="staff-message-form" onSubmit={sendMessage}>
            <textarea
              rows={3}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write a message to this volunteer..."
              aria-label="Message to volunteer"
              disabled={!selectedId}
              required
            />
            <button type="submit" className="btn primary" disabled={!selectedId || !body.trim()}>
              Send message
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
