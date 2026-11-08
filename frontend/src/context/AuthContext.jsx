import { createContext, useContext, useEffect, useState } from 'react';
import { api, errorMessage } from '../lib/api.js';
const Context = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setSessionError('');
    const logout = () => {
      sessionStorage.removeItem('smartjob-token');
      setUser(null);
      setSessionError('');
    };
    window.addEventListener('smartjob:unauthorized', logout);
    if (sessionStorage.getItem('smartjob-token')) {
      api
        .get('/users/me', { signal: controller.signal })
        .then((r) => {
          if (active) setUser(r.data.data);
        })
        .catch((error) => {
          if (!active) return;
          if (error.response?.status === 401) logout();
          else {
            // A timeout/network/503 failure does not mean that the JWT is invalid.
            setUser(null);
            setSessionError(errorMessage(error));
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else setLoading(false);
    return () => {
      active = false;
      controller.abort();
      window.removeEventListener('smartjob:unauthorized', logout);
    };
  }, [attempt]);
  function login(data) {
    sessionStorage.setItem('smartjob-token', data.token);
    setUser(data.user);
    setSessionError('');
  }
  function logout() {
    sessionStorage.removeItem('smartjob-token');
    setUser(null);
    setSessionError('');
  }
  return (
    <Context.Provider
      value={{
        user,
        loading,
        login,
        logout,
        setUser,
        sessionError,
        retrySession: () => setAttempt((value) => value + 1),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
