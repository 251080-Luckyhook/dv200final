import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import Notice from '../components/Notice.jsx';

export default function GoogleButton({ text }) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  async function handleSuccess(response) {
    setError('');

    try {
      const user = await loginWithGoogle(response.credential);

      navigate(user.isStaff ? '/staff' : '/home', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="google-wrap">
      {clientId ? (
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => setError('Google sign-in was cancelled or failed. Please try again.')}
          text={text}
          shape="pill"
          width="320"
        />
      ) : (
        <p className="small">Google sign-in is unavailable until VITE_GOOGLE_CLIENT_ID is configured.</p>
      )}

      <Notice error={error} />
    </div>
  );
}
