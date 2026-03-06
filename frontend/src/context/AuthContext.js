import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user from localStorage');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // UPDATED register function with invite code
  const register = async (email, password, workspaceName, inviteCode) => {
    try {
      setError(null);
      
      const requestBody = {
        email,
        password
      };
      
      // Add optional fields if they exist
      if (workspaceName) {
        requestBody.workspaceName = workspaceName;
      }
      
      if (inviteCode) {
        requestBody.inviteCode = inviteCode;
      }
      
      console.log('Register request:', { email, hasInviteCode: !!inviteCode });
      
      const response = await API.post('/auth/register', requestBody);

      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await API.post('/auth/login', { email, password });

      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};