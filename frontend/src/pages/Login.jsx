import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { useAuth } from '../context/AuthContext.jsx';
import BlobBackground from '../components/BlobBackground.jsx';
import Notice from '../components/Notice.jsx';
import GoogleButton from './GoogleButton.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setBusy(true);

    try {
      const user = await login({ identifier, password });
      navigate(user.isStaff ? '/staff' : '/home', { replace: true });
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
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />

          <span>Back to welcome page</span>
        </Link>

        <h1>Welcome back!</h1>

        <p className="small">Sign in to your volunteer or staff account.</p>

        <form onSubmit={handleSubmit}>
          <label>
            Email or phone
            <input
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <Notice error={error} />

          <button type="submit" className="btn primary block" disabled={busy}>
            {busy ? 'Signing in...' : 'Log in'}
          </button>
        </form>

        <p className="small centered">Or log in with Google</p>

        <GoogleButton text="signin_with" />

        <p className="small">
          Don't have an account? <Link to="/signup">SIGN UP</Link>
        </p>
      </div>
    </div>
  );
}
