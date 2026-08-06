import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(null); // null = cargando
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/auth/session')
      .then((data) => setAuthenticated(!!data.authenticated))
      .catch(() => setAuthenticated(false));
  }, []);

  const login = useCallback(async (password) => {
    setError('');
    try {
      await api.post('/auth/login', { password });
      setAuthenticated(true);
      return true;
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión');
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout', {});
    setAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
