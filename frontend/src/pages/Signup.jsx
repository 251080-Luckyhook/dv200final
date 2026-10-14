import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import BlobBackground from '../components/BlobBackground.jsx';
import GoogleButton from './GoogleButton.jsx';
import Notice from '../components/Notice.jsx';

export default function Signup() {
  const { registerVolunteer } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setBusy(true);

    try {
      await registerVolunteer({ fullName, email, phone, password });
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <BlobBackground />

      <div className="auth-card login">
        <h1>Join Ngwana Huis</h1>

        <p className="small">Create your volunteer account</p>

        <form onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Phone (optional)
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>

          <Notice error={error} />

          <button type="submit" className="btn primary block" disabled={busy}>
            {busy ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="small centered">Or create your account with Google</p>

        <GoogleButton text="signup_with" />

        <p className="small">
          I already have an account. <Link to="/login">LOG IN</Link>
        </p>
      </div>
    </div>
  );
}
