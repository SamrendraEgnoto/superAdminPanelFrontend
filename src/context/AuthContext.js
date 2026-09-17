'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { queryKeys } from '../lib/api';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    checkAuthStatus()
  }, [])

const normalizeRole = (roleFromBackend) => {
    if (!roleFromBackend) return 'user';
    const r = String(roleFromBackend).toLowerCase();
    if (['manager', 'employee', 'editor', 'standard'].includes(r)) return 'user';
    if (r === 'root') return 'root';
    if (['superadmin', 'delegated'].includes(r)) return 'superadmin';
    if (r === 'admin') return 'admin';
    return r;
}

  const checkAuthStatus = async () => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')

    if (token && role) {
      try {
        const normalizedRole = normalizeRole(role);

        let endpoint = ''
        switch (normalizedRole) {
          case 'root':
          case 'superadmin':
            endpoint = '/superadmin/profile'
            break
          case 'admin':
            endpoint = '/admin/profile'
            break
          case 'user':
            endpoint = '/users/me'
            break
          default:
            endpoint = '/superadmin/profile'
        }

        const response = await api.get(endpoint)
        const data = response?.data?.data
        if (data) {
          const isRoot = data?.role === 'root' || normalizedRole === 'root';
          const isDsa = !isRoot && (data?.role === 'delegated' || normalizedRole === 'superadmin');
          const finalRole = isRoot ? 'root' : normalizedRole;

          localStorage.setItem('role', finalRole);

          const userData = {
            ...data,
            token,
            role: finalRole,
            dbRole: data?.role || (isRoot ? 'root' : 'delegated'),
            isRoot,
            isDsa
          };
          setUser(userData)
          // Cache profile data
          queryClient.setQueryData(queryKeys.profile(finalRole), data)
        } else {
           throw new Error('No user data received')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        logout()
      }
    }
    setLoading(false);
    setAuthChecked(true); 
  }

 
  const login = async (email, password, role) => {
    try {
      const response = await api.post('/auth/login', { email, password, role });
      const { token, role: returnedRole } = response.data;
      const normalizedRole = normalizeRole(returnedRole || role);
      localStorage.setItem('token', token);
      localStorage.setItem('role', normalizedRole);
      await checkAuthStatus();
      toast.success('Login successful!');
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      if (message.toLowerCase().includes('not verified')) {
        return {
          success: false,
          redirectToOtp: true,
          email
        }
      }
      toast.error(message);
      return {
        success: false,
        message
      }
    }
  }

  const updateProfile = async (updates) => {
    try {
      const response = await api.put('/auth/profile', updates)
      const updatedData = response.data.data
      
      setUser({ ...user, ...updatedData })
      
      // Update cached profile data
      queryClient.setQueryData(queryKeys.profile(user?.role), updatedData)
      
      toast.success('Profile updated successfully!')
      return { success: true, data: updatedData }
    } catch (error) {
      toast.error('Failed to update profile')
      return { success: false, error: error.response?.data?.message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('passkey')  // clear tenant passkey — session ended
    setUser(null)
    
    // Clear all cached data
    queryClient.clear()
    
    toast.success('Logged out successfully!')
    window.location.href = '/login'
  }

  // Get cached profile data
  const profile = queryClient.getQueryData(queryKeys.profile(user?.role)) || user;
  const value = {user,profile,login,logout,updateProfile,loading,checkAuthStatus,authChecked}
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}