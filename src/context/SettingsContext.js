'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsApi } from '../lib/api';
import toast from 'react-hot-toast';

const SettingsContext = createContext();

const DEFAULT_SETTINGS = {
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    newLeadAlerts: true,
    assignmentAlerts: true,
    inAppToasts: true,
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
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('appSettings');
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...DEFAULT_SETTINGS, ...parsed };
        }
      } catch (e) {}
    }
    return DEFAULT_SETTINGS;
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
    return preference || 'dark';
  };

  const applyTheme = (themePref) => {
    const resolved = resolveTheme(themePref);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', resolved);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', resolved);
      localStorage.setItem('themePreference', themePref);
    }
    return resolved;
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        // Apply whatever is stored locally
        const localTheme = localStorage.getItem('theme') || localStorage.getItem('themePreference') || 'dark';
        applyTheme(localTheme);
        setLoading(false);
        return;
      }

      const response = await settingsApi.getSettings();
      if (response.data?.success && response.data.data) {
        const serverData = response.data.data;
        const merged = {
          ...DEFAULT_SETTINGS,
          ...serverData,
          appearance: { ...DEFAULT_SETTINGS.appearance, ...(serverData.appearance || {}) },
          notifications: { ...DEFAULT_SETTINGS.notifications, ...(serverData.notifications || {}) },
          system: { ...DEFAULT_SETTINGS.system, ...(serverData.system || {}) },
          integration: { ...DEFAULT_SETTINGS.integration, ...(serverData.integration || {}) },
        };
        setSettings(merged);
        localStorage.setItem('appSettings', JSON.stringify(merged));
        
        // Apply theme immediately
        const theme = merged.appearance.theme || 'dark';
        applyTheme(theme);
        
        // Apply compact mode class to body
        if (typeof document !== 'undefined') {
          if (merged.appearance.compactMode) {
            document.body.classList.add('compact-mode');
          } else {
            document.body.classList.remove('compact-mode');
          }
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Fallback to local storage if available
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('appSettings');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setSettings(parsed);
            if (parsed.appearance?.theme) applyTheme(parsed.appearance.theme);
          } catch (e) {}
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings = settings, opts = {}) => {
    const silent = opts.silent === true;
    try {
      setSaving(true);
      await settingsApi.updateSettings(newSettings);
      if (typeof window !== 'undefined') {
        localStorage.setItem('appSettings', JSON.stringify(newSettings));
        if (newSettings.appearance?.theme) {
          applyTheme(newSettings.appearance.theme);
        }
      }
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
    let latestSettings;
    setSettings(prev => {
      latestSettings = {
        ...prev,
        [category]: {
          ...(prev[category] || {}),
          [key]: value
        }
      };
      return latestSettings;
    });

    // Immediate UI side effects
    if (category === 'appearance') {
      if (key === 'theme') {
        applyTheme(value);
        // Persist theme choice immediately to user account in the background
        settingsApi.updateSettings({
          appearance: {
            ...settings.appearance,
            theme: value
          }
        }).catch(e => console.debug('Auto-sync theme to account failed:', e.message));
      }
      if (key === 'compactMode') {
        if (typeof document !== 'undefined') {
          if (value) document.body.classList.add('compact-mode');
          else document.body.classList.remove('compact-mode');
        }
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('appSettings');
        const current = saved ? JSON.parse(saved) : { ...settings };
        current[category] = { ...(current[category] || {}), [key]: value };
        localStorage.setItem('appSettings', JSON.stringify(current));
      } catch (e) {}
    }
    
    return latestSettings;
  };

  const resetSettings = async () => {
    try {
      setSaving(true);
      setSettings(DEFAULT_SETTINGS);
      applyTheme('dark');
      if (typeof document !== 'undefined') {
        document.body.classList.remove('compact-mode');
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('appSettings', JSON.stringify(DEFAULT_SETTINGS));
      }
      await settingsApi.updateSettings(DEFAULT_SETTINGS);
      toast.success('Settings reset to defaults');
      return true;
    } catch (error) {
      console.error('Failed to reset settings on server:', error);
      toast.error('Settings reset locally, failed to sync with server');
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    // Initial local theme application right on mount
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme') || localStorage.getItem('themePreference');
      if (storedTheme) applyTheme(storedTheme);
    }
    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      loading, 
      saving, 
      updateSetting, 
      saveSettings, 
      resetSettings,
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
