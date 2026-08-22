import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('globetrotter_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('globetrotter_admin_token') || null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.login(email, password);
      const { user, access_token } = res.data;

      if (user.role !== 'ADMIN') {
        throw new Error('Access denied: Administrative privileges required.');
      }

      localStorage.setItem('globetrotter_admin_token', access_token);
      localStorage.setItem('globetrotter_admin_user', JSON.stringify(user));

      setToken(access_token);
      setAdminUser(user);
      return user;
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('globetrotter_admin_token');
    localStorage.removeItem('globetrotter_admin_user');
    setToken(null);
    setAdminUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        adminUser,
        token,
        isAuthenticated: !!token && adminUser?.role === 'ADMIN',
        isLoading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
