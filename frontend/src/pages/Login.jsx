import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { useAuth } from '../context/AuthContext.jsx';
import BlobBackground from '../components/BlobBackground.jsx';
import Notice from '../components/Notice.jsx';
import GoogleButton from './GoogleButton.jsx';

export default function Login() {
  const { loginAsStaff, loginAsVolunteer } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [volunteerEmail, setVolunteerEmail] = useState('');
  const [volunteerPassword, setVolunteerPassword] = useState('');
  const [error, setError] = useState('');
  const [volunteerError, setVolunteerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [volunteerBusy, setVolunteerBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setBusy(true);

    try {
      await loginAsStaff({ fullName, identifier, password });

      navigate('/staff', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleVolunteerSubmit(event) {
    event.preventDefault();

    setVolunteerError('');
    setVolunteerBusy(true);

    try {
      await loginAsVolunteer({ email: volunteerEmail, password: volunteerPassword });
      navigate('/home', { replace: true });
    } catch (err) {
      setVolunteerError(err.message);
    } finally {
      setVolunteerBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <BlobBackground />

      <div className="auth-card login">
        <Link to="/signup" className="back-link">
          <ArrowLeft size={16} />

          <span>Back to sign up</span>
        </Link>

        <h1>Welcome back!</h1>

        <h2>Volunteer log in</h2>

        <form onSubmit={handleVolunteerSubmit}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={volunteerEmail}
              onChange={(event) => setVolunteerEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={volunteerPassword}
              onChange={(event) => setVolunteerPassword(event.target.value)}
              required
            />
          </label>

          <Notice error={volunteerError} />

          <button type="submit" className="btn primary block" disabled={volunteerBusy}>
            {volunteerBusy ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="small centered">Or log in with Google</p>

        <GoogleButton text="signin_with" />

        <h2>Admin log in</h2>

        <form onSubmit={handleSubmit}>
          <label>
            Full Name
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </label>

          <label>
            Phone or Email
            <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} required />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <Notice error={error} />

          <button type="submit" className="btn primary block" disabled={busy}>
            {busy ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="small">
          Don't have an account? <Link to="/signup">SIGN UP</Link>
        </p>
      </div>
    </div>
  );
}
