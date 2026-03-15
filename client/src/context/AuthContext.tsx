import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import type { User, LoginCredentials, RegisterCredentials } from '../types';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  completeProfile: (data: Partial<User>) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Setup axios default
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setIsLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/profile`);
      setUser(res.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching profile:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
        const res = await axios.post(`${API_URL}/auth/login`, credentials);
        setUser(res.data);
        setToken(res.data.token);
        localStorage.setItem('token', res.data.token);
        setIsAuthenticated(true);
    } catch(err: unknown) {
        if (axios.isAxiosError(err)) {
             throw new Error(err.response?.data?.message || 'Login failed');
        }
        throw new Error('Login failed');
    }
  };

  const register = async (credentials: RegisterCredentials) => {
      try {
        const res = await axios.post(`${API_URL}/auth/register`, credentials);
        setUser(res.data);
        setToken(res.data.token);
        localStorage.setItem('token', res.data.token);
        setIsAuthenticated(true);
      } catch(err: unknown) {
        if (axios.isAxiosError(err)) {
             throw new Error(err.response?.data?.message || 'Registration failed');
        }
        throw new Error('Registration failed');
      }
  };

  const googleLogin = async (googleToken: string) => {
      try {
        const res = await axios.post(`${API_URL}/auth/google`, { token: googleToken });
        setUser(res.data);
        setToken(res.data.token);
        localStorage.setItem('token', res.data.token);
        setIsAuthenticated(true);
      } catch(err: unknown) {
          if (axios.isAxiosError(err)) {
              throw new Error(err.response?.data?.message || 'Google Auth failed');
          }
          throw new Error('Google Auth failed');
      }
  };

  const completeProfile = async (data: Partial<User>) => {
      try {
          const res = await axios.put(`${API_URL}/auth/complete-profile`, data);
          setUser({ ...user, ...res.data });
      } catch(err: unknown) {
         if (axios.isAxiosError(err)) {
             throw new Error(err.response?.data?.message || 'Profile completion failed');
         }
         throw new Error('Profile completion failed');
      }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, register, googleLogin, completeProfile, logout, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
