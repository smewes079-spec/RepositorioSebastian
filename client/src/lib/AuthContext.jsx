import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(null); // null = cargando
  const [usuario, setUsuario] = useState(null);
  const [necesitaBootstrap, setNecesitaBootstrap] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/auth/session')
      .then((data) => {
        setAuthenticated(!!data.authenticated);
        setUsuario(data.usuario || null);
        setNecesitaBootstrap(!!data.necesitaBootstrap);
      })
      .catch(() => setAuthenticated(false));
  }, []);

  const login = useCallback(async (email, password) => {
    setError('');
    try {
      const data = await api.post('/auth/login', { email, password });
      setAuthenticated(true);
      setUsuario(data.usuario);
      return true;
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión');
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout', {});
    setAuthenticated(false);
    setUsuario(null);
  }, []);

  const bootstrap = useCallback(async (email, nombre, password) => {
    setError('');
    try {
      const data = await api.post('/auth/bootstrap', { email, nombre, password });
      setAuthenticated(true);
      setUsuario(data.usuario);
      return true;
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta');
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ authenticated, usuario, necesitaBootstrap, login, logout, bootstrap, error }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
