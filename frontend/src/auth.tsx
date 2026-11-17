import axios from 'axios';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type UserRole = 'patient' | 'doctor' | 'lab' | 'lab_staff' | 'admin';

interface AuthState {
  isLoading: boolean;
  role: UserRole | null;
  token: string | null;
  signIn: (accessToken: string, refreshToken: string, role: UserRole) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const clearStoredSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh');
  localStorage.removeItem('role');
  delete axios.defaults.headers.common.Authorization;
};

export const dashboardPathForRole = (role: UserRole) => {
  if (role === 'patient') return '/patient/dashboard';
  if (role === 'doctor') return '/doctor/dashboard';
  if (role === 'lab' || role === 'lab_staff') return '/lab/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      axios.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
      try {
        const response = await axios.get('/api/users/me/');
        const storedRole = response.data.role as UserRole;
        localStorage.setItem('role', storedRole);
        setRole(storedRole);
      } catch {
        clearStoredSession();
        setToken(null);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const value = useMemo<AuthState>(() => ({
    isLoading,
    role,
    token,
    signIn: (accessToken, refreshToken, userRole) => {
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refresh', refreshToken);
      localStorage.setItem('role', userRole);
      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      setToken(accessToken);
      setRole(userRole);
      setIsLoading(false);
    },
    signOut: () => {
      clearStoredSession();
      setToken(null);
      setRole(null);
      setIsLoading(false);
    },
  }), [isLoading, role, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthProvider');
  return auth;
};
