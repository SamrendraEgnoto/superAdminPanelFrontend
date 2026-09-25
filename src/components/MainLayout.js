

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext'; // Added hook
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import LoadingSpinner from './LoadingSpinner';
import styles from '../styles/App.module.scss';
import { usePathname, useRouter } from 'next/navigation';

export default function MainLayout({ children }) {
  const { settings, loading: settingsLoading } = useSettings(); // Get settings
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading, authChecked } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Sync initial and persistent collapsed state
  useEffect(() => {
    if (settings?.appearance?.sidebarCollapsed !== undefined) {
      setCollapsed(settings.appearance.sidebarCollapsed);
    }
  }, [settings?.appearance?.sidebarCollapsed]);
  
  // const isAuthPage = useMemo(() => ['/login', '/register'].includes(pathname), [pathname]);

  // const isAuthPage = useMemo(
  //   () => ['/login', '/register', '/verify-otp'].includes(pathname),
  //   [pathname]
  // );

  const isAuthPage = useMemo(() => {
    const p = pathname || '';
    // basePath-aware: Next may return /login or /leadManager/login depending on router
    return (
      p === '/login' ||
      p === '/leadManager/login' ||
      p.endsWith('/login') ||
      p === '/register' ||
      p === '/leadManager/register' ||
      p.endsWith('/register') ||
      p === '/verify-otp' ||
      p === '/leadManager/verify-otp' ||
      p.endsWith('/verify-otp') ||
      p === '/forgot-password' ||
      p === '/leadManager/forgot-password' ||
      p.endsWith('/forgot-password') ||
      p === '/reset-password' ||
      p === '/leadManager/reset-password' ||
      p.endsWith('/reset-password')
    );
  }, [pathname]);

  useEffect(() => {
    if (!authChecked) return; 

    if (!user && !isAuthPage) {
      router.replace('/login');
    }
  }, [authChecked, user, isAuthPage, router]);

  // useEffect(() => {
  //   if (!loading && !user && !isAuthPage) {
  //     // router.push('/login');
  //     const path = pathname;

  //     if (path.startsWith('/salesview')) {
  //       router.push('/salesview/login');
  //     } else {
  //       router.push('/login');
  //     }
  //   }
  // }, [loading, user, isAuthPage, router, pathname]);

  const showNavigation = !isAuthPage && user;

  // if (loading || (!user && !isAuthPage)) {
  //   return <LoadingSpinner fullScreen text="Loading application..." />;
  // }
  if (!authChecked) {
    return <LoadingSpinner fullScreen text="Loading application..." />;
  }

  return (
    <div className={styles.appRoot}>
      {showNavigation && (
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      )}

      <div className={`${styles.main} ${isAuthPage ? styles.authMain : collapsed ? styles.collapsed : ''}`}>
        {showNavigation && (
          <Navbar collapsed={collapsed} setCollapsed={setCollapsed} />
        )}

        <div className={isAuthPage ? '' : styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
