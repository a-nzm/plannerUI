import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, registerUser, type UserDto } from '../services/userApi';
import { clearCredentials, getStoredUser, setCredentials, storeUser } from '../services/api';

type AuthContextValue = {
  user: UserDto | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserDto | null>(() => getStoredUser());
  const [loading, setLoading] = useState(false);

  const loadCurrentUser = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getCurrentUser();
      setUser(response);
      storeUser(response);
    } catch {
      clearCredentials();
      setUser(null);
      storeUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

useEffect(() => {
  const hasStoredAuth = Boolean(localStorage.getItem('auth_basic'));

  if (hasStoredAuth) {
    loadCurrentUser();
  }
}, [loadCurrentUser]);

  const login = useCallback(async (email: string, password: string) => {
  setLoading(true);
  try {
    setCredentials(email, password);
    const response = await getCurrentUser();
    setUser(response);
    storeUser(response);
  } catch (err) {
    clearCredentials();
    setUser(null);
    storeUser(null);
    throw err;
  } finally {
    setLoading(false);
  }
}, []);

  const register = useCallback(async (email: string, password: string, name?: string, surname?: string) => {
    setLoading(true);
    try {
      const response = await registerUser({ email, password, name, surname });
      setCredentials(email, password);
      setUser(response);
      storeUser(response);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
  clearCredentials();
  localStorage.removeItem('auth_basic');
  localStorage.removeItem('auth_user');
  setUser(null);
  storeUser(null);
}, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      isAdmin: Boolean(
        user?.admin ||
        ((user as any)?.role ?? '').toString().toUpperCase() === 'ADMIN' ||
        ((user as any)?.roles ?? []).some((r: string) => r.toUpperCase() === 'ADMIN')
      ),
    }),
    [user, loading, login, logout, register]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
