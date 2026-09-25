'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsApi } from '../lib/api';
import toast from 'react-hot-toast';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      weeklyReports: true,
      newLeadAlerts: true,
    },
    appearance: {
      theme: 'dark',
      compactMode: false,
      sidebarCollapsed: false,
    },
    system: {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionPeriod: '90',
    },
    integration: {
      emailProvider: 'smtp',
      smtpHost: '',
      smtpPort: '587',
      smtpUser: '',
      smtpPassword: '',
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Helper: resolve effective theme from a preference string
  const resolveTheme = (preference) => {
    if (preference === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'dark';
    }
    return preference;
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await settingsApi.getSettings();
      if (response.data.success && response.data.data) {
        setSettings(response.data.data);
        
        // Apply theme immediately
        const theme = resolveTheme(response.data.data.appearance.theme);
        document.documentElement.setAttribute('data-theme', theme);
        
        // Apply compact mode class to body
        if (response.data.data.appearance.compactMode) {
          document.body.classList.add('compact-mode');
        } else {
          document.body.classList.remove('compact-mode');
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Fallback to local storage if available
      const saved = localStorage.getItem('appSettings');
      if (saved) setSettings(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings = settings, opts = {}) => {
    const silent = opts.silent === true;
    try {
      setSaving(true);
      await settingsApi.updateSettings(newSettings);
      localStorage.setItem('appSettings', JSON.stringify(newSettings));
      if (!silent) toast.success('Settings saved successfully');
      return true;
    } catch (error) {
      if (!silent) toast.error('Failed to save settings');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category, key, value) => {
    const updated = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    };
    setSettings(updated);

    // Immediate UI side effects
    if (category === 'appearance') {
      if (key === 'theme') {
        const resolved = resolveTheme(value);
        document.documentElement.setAttribute('data-theme', resolved);
        localStorage.setItem('themePreference', value);
      }
      if (key === 'compactMode') {
        if (value) document.body.classList.add('compact-mode');
        else document.body.classList.remove('compact-mode');
      }
    }
    
    return updated; // Return latest state
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      loading, 
      saving, 
      updateSetting, 
      saveSettings, 
      refreshSettings: loadSettings 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
