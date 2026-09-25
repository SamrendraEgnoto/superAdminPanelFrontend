'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext'; // Added hook
import { Menu, Moon, Sun, User, LogOut, ChevronDown } from 'lucide-react';
import NotificationBell from './NotificationBell';
import styles from './Navbar.module.scss';

export default function Navbar({ collapsed, setCollapsed }) {
  const { logout, user } = useAuth();
  const { settings, updateSetting, saveSettings } = useSettings(); // Use context
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isDark = settings.appearance.theme === 'dark';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    const updated = updateSetting('appearance', 'theme', next);
    // Auto-save silently — no toast on theme toggle as requested
    saveSettings(updated, { silent: true }); 
  };

  const handleBurgerClick = () => {
    const nextCollapsed = !collapsed;
    setCollapsed(nextCollapsed);
    const updated = updateSetting('appearance', 'sidebarCollapsed', nextCollapsed);
    // Auto-save silently — no toast
    saveSettings(updated, { silent: true });
  };

  return (
    <header className={`${styles.navbar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.left}>
        <button className={styles.burger} onClick={handleBurgerClick}>
          <Menu size={20} />
        </button>
        <span className={styles.brandTitle}>
          {user?.role === 'root'
            ? 'Root Super Admin Panel'
            : user?.role === 'superadmin'
            ? 'Delegated Super Admin Panel'
            : user?.role === 'admin'
            ? 'Admin Panel'
            : 'Lead Management'}
        </span>
      </div>

      <div className={styles.right}>
        <NotificationBell />
        <button onClick={toggleTheme} className={styles.iconBtn} title="Toggle theme">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className={styles.profileWrapper} ref={dropdownRef}>
          <div
            className={styles.userProfile}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className={styles.avatar}>
              {user?.firstName?.charAt(0) || <User size={16} />}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.role}>
                {user?.role === 'root' ? 'Root Super Admin' : user?.role === 'superadmin' ? 'Delegated SA' : user?.role}
              </span>
              <span className={styles.status}>Online</span>
            </div>
            <ChevronDown
              size={14}
              className={`${styles.chevron} ${dropdownOpen ? styles.open : ''}`}
            />
          </div>

          {dropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownAvatar}>
                  {user?.firstName?.charAt(0) || '?'}
                </div>
                <div>
                  <p className={styles.dropdownName}>
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className={styles.dropdownEmail}>{user?.email}</p>
                </div>
              </div>
              <div className={styles.dropdownDivider} />
              <button className={styles.dropdownItem} onClick={logout}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


