import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, clearToken, getToken, setToken } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);

      return;
    }

    api
      .get('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    async function refreshRole() {
      if (document.visibilityState !== 'visible' || !getToken()) {
        return;
      }

      try {
        const data = await api.get('/auth/me');
        setUser(data.user);
      } catch (error) {
        console.error('Could not refresh the signed-in account role:', error);
      }
    }

    window.addEventListener('focus', refreshRole);
    document.addEventListener('visibilitychange', refreshRole);
    const interval = window.setInterval(refreshRole, 30000);

    return () => {
      window.removeEventListener('focus', refreshRole);
      document.removeEventListener('visibilitychange', refreshRole);
      window.clearInterval(interval);
    };
  }, []);

  const finishLogin = useCallback((data) => {
    setToken(data.token);
    setUser(data.user);

    return data.user;
  }, []);

  const loginWithGoogle = useCallback(
    async (credential) => finishLogin(await api.post('/auth/google', { credential })),
    [finishLogin]
  );

  const registerVolunteer = useCallback(
    async (details) => finishLogin(await api.post('/auth/register', details)),
    [finishLogin]
  );

  const login = useCallback(
    async (details) => finishLogin(await api.post('/auth/login', details)),
    [finishLogin]
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, setUser, loading, loginWithGoogle, registerVolunteer, login, logout }),
    [user, loading, loginWithGoogle, registerVolunteer, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
