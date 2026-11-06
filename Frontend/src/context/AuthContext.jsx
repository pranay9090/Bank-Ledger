import React, { useState } from 'react';
import { AuthContext } from './AuthContext.js';
import authService from '../services/authService';

const STORAGE_KEY = 'bank_ledger_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      if (data?.user) {
        setUser(data.user);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        } catch {
          // Ignore localStorage write failures
        }
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const data = await authService.register(name, email, password);
      if (data?.user) {
        setUser(data.user);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        } catch {
          // Ignore localStorage write failures
        }
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore localStorage cleanup failures
      }
      setLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
export default AuthProvider;
