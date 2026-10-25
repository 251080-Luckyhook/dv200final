import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Mail, Search, User } from 'lucide-react';

import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Notice from '../components/Notice.jsx';
import Toggle from '../components/Toggle.jsx';
import { ROLE_LABELS, STAFF_ROLES } from '../utils/constants.js';

const NOTIFICATION_LABELS = {
  urgent_care_requests: 'Urgent care requests',
  new_volunteer_signups: 'New volunteer sign-ups',
  shift_reminders: 'Shift reminders',
  visitor_check_in: 'Visitor check-in',
};

function GeneralTab({ staff }) {
  const [settings, setSettings] = useState(null);
  const [notice, setNotice] = useState({ error: '', message: '' });

  useEffect(() => {
    api
      .get('/settings/me')
      .then(setSettings)
      .catch((err) => setNotice({ error: err.message, message: '' }));
  }, []);

  async function save() {
    setNotice({ error: '', message: '' });

    try {
      await api.put('/settings/me', { notifications: settings.notifications, calendarSync: settings.calendarSync });

      if (staff) {
        await api.put('/settings/app', { reducedCapacity: settings.reducedCapacity });
      }

      setNotice({ error: '', message: 'Your settings have been saved.' });
    } catch (err) {
      setNotice({ error: err.message, message: '' });
    }
  }

  if (!settings) {
    return <Notice error={notice.error} message="" />;
  }

  return (
    <div className="settings-grid">
      <div>
        <section className="panel">
          <h3 className="panel-title">Notification</h3>

          {Object.entries(NOTIFICATION_LABELS).map(([key, label]) => (
            <div key={key} className="setting-row">
              <span>{label}</span>

              <Toggle
                label={label}
                checked={settings.notifications[key]}
                onChange={(value) =>
                  setSettings({ ...settings, notifications: { ...settings.notifications, [key]: value } })
                }
              />
            </div>
          ))}
        </section>

        <section className="panel">
          <h3 className="panel-title">Calendar sync</h3>

          <div className="setting-row">
            <span>
              <strong>Google Calendar</strong>

              <small>Auto-add shifts</small>
            </span>

            <Toggle
              label="Google Calendar auto-add shifts"
              checked={settings.calendarSync}
              onChange={(value) => setSettings({ ...settings, calendarSync: value })}
            />
          </div>
        </section>

        <Notice error={notice.error} message={notice.message} />

        <button type="button" className="btn primary block" onClick={save}>
          Save Changes
        </button>
      </div>

      {staff && (
        <section className="panel">
          <h3 className="panel-title">Volunteer Settings</h3>

          <h2 className="serif">Capacity settings</h2>

          <div className="setting-row">
            <span>Reduced capacity</span>

            <Toggle
              label="Reduced capacity"
              checked={settings.reducedCapacity}
              onChange={(value) => setSettings({ ...settings, reducedCapacity: value })}
            />
          </div>

          <p className="strong">Reduce all available slots by 1</p>
        </section>
      )}
    </div>
  );
}

function AccessTab() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [chosen, setChosen] = useState(null);
  const [role, setRole] = useState('');
  const [notice, setNotice] = useState({ error: '', message: '' });

  const load = useCallback(async () => {
    try {
      const data = await api.get(`/users/accounts?search=${encodeURIComponent(search)}`);

      setUsers(data.users);
    } catch (err) {
      setNotice({ error: err.message, message: '' });
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(load, 250);

    return () => clearTimeout(timer);
  }, [load]);

  async function grant() {
    setNotice({ error: '', message: '' });

    try {
      await api.patch(`/users/${chosen.id}/role`, { role });

      setNotice({ error: '', message: `${chosen.fullName}'s role is now ${ROLE_LABELS[role]}.` });
      setChosen(null);
      setRole('');

      await load();
    } catch (err) {
      setNotice({ error: err.message, message: '' });
    }
  }

  return (
    <div className="access-grid">
      <div>
        <h2 className="serif">Staff &amp; Access</h2>

        <p>Manage account roles and access to the volunteer or staff dashboards.</p>

        <label className="search-box">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email..." />

          <Search size={22} />
        </label>

        <h3 className="eyebrow">Accounts</h3>

        <table className="table striped">
          <thead>
            <tr>
              <th>Account</th>
              <th>Email</th>
              <th>Current role</th>
              <th>Permissions</th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={4}>No accounts match your search.</td>
              </tr>
            )}

            {users.map((person) => (
              <tr key={person.id}>
                <td>{person.fullName}</td>
                <td>{person.email}</td>
                <td>{ROLE_LABELS[person.role]}</td>
                <td>
                  <button
                    type="button"
                    className="btn pill-outline orange"
                    disabled={person.id === currentUser.id}
                    onClick={() => {
                      setChosen(person);
                      setRole(person.role);
                    }}
                  >
                    Change role
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="serif">Change account role</h2>

        <Notice error={notice.error} message={notice.message} />

        {chosen ? (
          <>
            <div className="person-card">
              <span className="avatar-circle">
                <User size={26} />
              </span>

              <div>
                <strong>{chosen.fullName}</strong>

                <span>{chosen.email}</span>

                <small>Current role: {ROLE_LABELS[chosen.role] || chosen.role}</small>
              </div>
            </div>

            <h3>Choose a role</h3>

            <p className="muted-text">
              Choose volunteer or staff access for this account. Only administrators can assign administrator access.
            </p>

            <div className="role-list">
              <button
                type="button"
                role="radio"
                aria-checked={role === 'volunteer'}
                className={`role-option${role === 'volunteer' ? ' selected' : ''}`}
                onClick={() => setRole('volunteer')}
              >
                <span>Volunteer</span>
              </button>

              {STAFF_ROLES.filter((item) => currentUser.role === 'administrator' || item.key !== 'administrator').map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="radio"
                  aria-checked={role === item.key}
                  className={`role-option${role === item.key ? ' selected' : ''}`}
                  onClick={() => setRole(item.key)}
                >
                  <span>{item.label}</span>

                  <i className="radio" />
                </button>
              ))}
            </div>

            <div className="summary-actions">
              <button type="button" className="btn outline" onClick={() => setChosen(null)}>
                Cancel
              </button>

              <button type="button" className="btn primary" disabled={!role || role === chosen.role} onClick={grant}>
                Save role
              </button>
            </div>
          </>
        ) : (
          <p className="muted-text">Choose Change role next to an account to update its permissions.</p>
        )}
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange }) {
  const [visible, setVisible] = useState(false);

  return (
    <label>
      {label}

      <span className="input-icon">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="New Password"
          autoComplete="new-password"
        />

        <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Hide password' : 'Show password'}>
          {visible ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>
      </span>
    </label>
  );
}

function SecurityTab() {
  const { user, setUser } = useAuth();
  const fileInput = useRef(null);

  const [form, setForm] = useState({
    fullName: user.fullName,
    email: user.email || '',
    phone: user.phone || '',
  });
  const [avatar, setAvatar] = useState(user.avatarUrl);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [notice, setNotice] = useState({ error: '', message: '' });

  function pickPicture(event) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (file.size > 300 * 1024) {
      setNotice({ error: 'Choose a picture smaller than 300 KB.', message: '' });

      return;
    }

    const reader = new FileReader();

    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  }

  async function save(event) {
    event.preventDefault();

    setNotice({ error: '', message: '' });

    try {
      const data = await api.put('/settings/profile', { ...form, avatarUrl: avatar });

      setUser(data.user);

      if (password || confirm) {
        await api.put('/settings/password', { password, confirm });

        setPassword('');
        setConfirm('');
      }

      setNotice({ error: '', message: 'Your changes have been saved.' });
    } catch (err) {
      setNotice({ error: err.message, message: '' });
    }
  }

  return (
    <>
      <form onSubmit={save} className="security-form">
        <section className="panel">
          <h3 className="panel-title">Account information</h3>

          <div className="avatar-row">
            {avatar ? (
              <img src={avatar} alt="Your profile" className="avatar" />
            ) : (
              <span className="avatar placeholder">
                <User size={32} />
              </span>
            )}

            <button type="button" className="btn outline gold" onClick={() => fileInput.current.click()}>
              Change profile picture
            </button>

            <input ref={fileInput} type="file" accept="image/*" hidden onChange={pickPicture} />
          </div>

          <div className="form-grid">
            <label>
              Full Name
              <span className="input-icon left">
                <User size={18} />

                <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
              </span>
            </label>

            <label>
              Email Address
              <span className="input-icon left">
                <Mail size={18} />

                <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </span>
            </label>

            <label>
              Phone Number
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+27 12 345 6789" />
            </label>

            <label>
              Role
              <input value={ROLE_LABELS[user.role]} readOnly />
            </label>
          </div>
        </section>

        <section className="panel">
          <h3 className="panel-title">Password</h3>

          <PasswordField label="Change Password" value={password} onChange={setPassword} />

          <PasswordField label="Confirm Password" value={confirm} onChange={setConfirm} />
        </section>

        <Notice error={notice.error} message={notice.message} />

        <button type="submit" className="btn primary wide-button">
          Save Changes
        </button>
      </form>

      {user.isStaff && <AccessTab />}
    </>
  );
}

export default function SettingsPage({ staff, initialTab }) {
  const { user } = useAuth();

  const [tab, setTab] = useState(initialTab);

  const tabs = [{ key: 'general', label: 'General Settings' }];

  tabs.push({ key: 'security', label: 'Security' });

  return (
    <div className="page">
      <div className="tabs">
        {tabs.map((item) => (
          <button key={item.key} type="button" className={tab === item.key ? 'active' : ''} onClick={() => setTab(item.key)}>
            {item.label}
          </button>
        ))}
      </div>

      <section className="settings-card">
        <h2 className="settings-heading">
          {tab === 'general' && 'General settings'}
          {tab === 'security' && 'Security'}
        </h2>

        {tab === 'general' && <GeneralTab staff={staff} />}

        {tab === 'security' && <SecurityTab />}
      </section>
    </div>
  );
}
