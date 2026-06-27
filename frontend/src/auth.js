import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      axios.get(`${BASE_URL}/auth/me/`).then((resp) => setUser(resp.data)).catch(() => logout());
    }
  }, [token]);

  const login = async (username, password) => {
    const response = await axios.post(`${BASE_URL}/auth/login/`, { username, password });
    localStorage.setItem('access', response.data.access);
    localStorage.setItem('refresh', response.data.refresh);
    setToken(response.data.access);
    const me = await axios.get(`${BASE_URL}/auth/me/`).then((r) => r.data);
    setUser(me);
    return me;
  };

  const logout = async () => {
    const refresh = localStorage.getItem('refresh');
    try {
      await axios.post(`${BASE_URL}/auth/logout/`, { refresh });
    } catch {
      // ignore
    }
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common.Authorization;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
