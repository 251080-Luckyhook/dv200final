import { useCallback, useEffect, useState } from 'react';

import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Notice from '../components/Notice.jsx';
import { ROLE_LABELS } from '../utils/constants.js';

export default function VolunteerMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [notice, setNotice] = useState({ error: '', message: '' });

  const loadMessages = useCallback(async () => {
    try {
      const data = await api.get('/feedback/messages');

      setMessages(data.messages);
    } catch (err) {
      setNotice({ error: err.message, message: '' });
    }
  }, []);

  useEffect(() => {
    loadMessages();

    const timer = window.setInterval(loadMessages, 15000);

    return () => window.clearInterval(timer);
  }, [loadMessages]);

  async function sendMessage(event) {
    event.preventDefault();

    if (!body.trim()) {
      return;
    }

    setNotice({ error: '', message: '' });

    try {
      await api.post('/feedback/messages', { body });
      setBody('');
      setNotice({ error: '', message: 'Message sent to staff.' });
      await loadMessages();
    } catch (err) {
      setNotice({ error: err.message, message: '' });
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Messages</h1>
      <p>Send a message to staff and see their replies here.</p>
      <Notice error={notice.error} message={notice.message} />

      <section className="card volunteer-message-card">
        <div className="staff-message-history" aria-live="polite">
          {messages.length === 0 && (
            <p className="muted-text">No messages yet. Send a message to start a conversation with staff.</p>
          )}
          {[...messages].reverse().map((message) => (
            <article key={message.id} className={`staff-message${message.fromMe ? ' from-me' : ''}`}>
              <strong>
                {message.fromMe ? 'You' : message.sender || 'Ngwana Huis staff'}
                {' '}
                <span className="message-role">
                  ({ROLE_LABELS[message.senderRole] || message.senderRole || (message.fromMe ? ROLE_LABELS[user.role] : 'Staff')})
                </span>
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
            placeholder="Write a message to staff..."
            aria-label="Message to staff"
            required
          />
          <button type="submit" className="btn primary" disabled={!body.trim()}>
            Send message
          </button>
        </form>
      </section>
    </div>
  );
}
