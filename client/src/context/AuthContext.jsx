import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAuthToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const data = await api.get('/auth/me');
      if (data && data.user) {
        setUser(data.user);
        setProfile(data.profile || data.user.profile || null);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      if (err?.status === 401) setAuthToken(null);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (credentials) => {
    const data = await api.post('/auth/login', credentials);
    if (data && data.user) {
      setAuthToken(data.token);
      setUser(data.user);
      await fetchCurrentUser();
    }
    return data;
  };

  const register = async (userData) => {
    const data = await api.post('/auth/register', userData);
    if (data && data.user) {
      setAuthToken(data.token);
      setUser(data.user);
      await fetchCurrentUser();
    }
    return data;
  };

  // Sends Google's ID token to the server, which verifies it and starts the same session as password login.
  const loginWithGoogle = async (credential) => {
    const data = await api.post('/auth/google', { credential });
    if (data && data.user) {
      setAuthToken(data.token);
      setUser(data.user);
      await fetchCurrentUser();
    }
    return data;
  };

  // "Try the demo": the server signs this browser into the shared demo account.
  const loginAsDemo = async () => {
    const data = await api.post('/auth/demo');
    if (data && data.user) {
      setAuthToken(data.token);
      setUser(data.user);
      await fetchCurrentUser();
    }
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setAuthToken(null);
      setUser(null);
      setProfile(null);
    }
  };

  const updateLocalProfile = (newProfile) => {
    setProfile(newProfile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        loginWithGoogle,
        loginAsDemo,
        logout,
        refreshUser: fetchCurrentUser,
        updateLocalProfile,
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
