import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('eduflow_user') || localStorage.getItem('joineazy_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('eduflow_token') || localStorage.getItem('joineazy_token'));
  const [activeGroup, setActiveGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync token and load user profile on mount
  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await client.get('/auth/me');
          setUser(res.data.user);
          setActiveGroup(res.data.activeGroup);
          localStorage.setItem('eduflow_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error('Failed to restore session:', err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (identifier, password) => {
    const res = await client.post('/auth/login', { identifier, password });
    const { token: receivedToken, user: receivedUser } = res.data;

    localStorage.setItem('eduflow_token', receivedToken);
    localStorage.setItem('eduflow_user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);

    // Fetch active group
    try {
      const meRes = await client.get('/auth/me', {
        headers: { Authorization: `Bearer ${receivedToken}` }
      });
      setActiveGroup(meRes.data.activeGroup);
    } catch {
      // Non-blocking
    }

    return receivedUser;
  };

  const register = async ({ name, email, studentId, password }) => {
    const res = await client.post('/auth/register', { name, email, studentId, password });
    const { token: receivedToken, user: receivedUser } = res.data;

    localStorage.setItem('eduflow_token', receivedToken);
    localStorage.setItem('eduflow_user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);
    setActiveGroup(null);

    return receivedUser;
  };

  const logout = () => {
    localStorage.removeItem('eduflow_token');
    localStorage.removeItem('eduflow_user');
    localStorage.removeItem('joineazy_token');
    localStorage.removeItem('joineazy_user');
    setToken(null);
    setUser(null);
    setActiveGroup(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await client.get('/auth/me');
      setUser(res.data.user);
      setActiveGroup(res.data.activeGroup);
      localStorage.setItem('eduflow_user', JSON.stringify(res.data.user));
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeGroup,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshUser
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
