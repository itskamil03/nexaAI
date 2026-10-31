import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, getMe } from '../api/auth';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('nexachain_token'));
  const [loading, setLoading] = useState(true);
  const { toastSuccess, toastError } = useToast();

  // Load user on mount if token exists
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('nexachain_token');
      if (storedToken) {
        try {
          const res = await getMe();
          if (isMounted && res.success) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.warn('Initial session check failed:', err.message);
          localStorage.removeItem('nexachain_token');
          setToken(null);
          setUser(null);
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const res = await loginUser({ email, password });
      if (res.success) {
        const { user: userData, token: tokenData } = res.data;
        localStorage.setItem('nexachain_token', tokenData);
        setToken(tokenData);
        setUser(userData);
        toastSuccess(`Welcome back, ${userData.fullName}!`);
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      toastError(err.message || 'Login failed');
      return { success: false, message: err.message };
    }
  };

  const register = async (userData) => {
    try {
      const res = await registerUser(userData);
      if (res.success) {
        const { user: newUser, token: newToken } = res.data;
        localStorage.setItem('nexachain_token', newToken);
        setToken(newToken);
        setUser(newUser);
        toastSuccess('Account registered successfully! Welcome to NexaChain.');
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      toastError(err.message || 'Registration failed');
      return { success: false, message: err.message };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('nexachain_token');
    setToken(null);
    setUser(null);
    toastSuccess('You have been logged out.');
  }, [toastSuccess]);

  const refreshUser = async () => {
    try {
      const res = await getMe();
      if (res.success) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err.message);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
