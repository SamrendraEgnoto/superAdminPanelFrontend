'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {LayoutDashboard,Users,UserCog,Building2,User,Settings,BarChart3,LogOut,ChevronLeft,ChevronRight} from 'lucide-react';
import styles from './Sidebar.module.scss';

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const role = user?.role;

  const isRoot = user?.role === 'root' || user?.isRoot;
  const isDsa = !isRoot && (user?.role === 'superadmin' || user?.isDsa);

  const navigation = [
    {
      to: '/',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      roles: ['root', 'superadmin', 'admin', 'user']
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: <User size={20} />,
      roles: ['root', 'superadmin', 'admin', 'user']
    },
    {
      to: '/admins',
      label: 'Admin Management',
      icon: <UserCog size={20} />,
      roles: ['root', 'superadmin']
    },
    {
      to: '/users',
      label: 'User Management',
      icon: <Users size={20} />,
      roles: ['superadmin', 'admin', 'user'],
      condition: !isRoot && (isDsa || user?.role === 'admin' || user?.canCreateSubUsers)
    },
    {
      to: '/leads',
      label: 'Leads Management',
      icon: <Building2 size={20} />,
      roles: ['superadmin', 'admin', 'user'],
      condition: !isRoot
    },
    {
      to: '/reports',
      label: 'Reports',
      icon: <BarChart3 size={20} />,
      roles: ['root', 'superadmin', 'admin', 'user']
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: <Settings size={20} />,
      roles: ['root', 'superadmin', 'admin', 'user']
    }
  ];

  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles.includes(role)) return false;
    if (item.condition !== undefined && !item.condition) return false;
    return true;
  });

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="50"
              height="50"
              viewBox="0 0 50 50"
              fill="none"
            >
              <path
                d="M42.3077 50H7.69231C3.44231 50 0 46.5577 0 42.3077V7.69231C0 3.44231 3.44231 0 7.69231 0H42.3077C46.5577 0 50 3.44231 50 7.69231V42.3077C50 46.5577 46.5577 50 42.3077 50Z"
                fill="#12131A"
              />
              <path
                d="M43.7386 17.1114V5.76904H6.26172V44.2306H25.1309L38.8079 30.5383V44.2306H43.7386V22.0421H38.8079H22.5348V26.9729H35.4386L23.1117 39.2998H11.1925V10.6998H38.8079V17.1114H43.7386Z"
                fill="white"
              />
            </svg>
          </div>
          {!collapsed && (
            <div className={styles.brandText}>
              <h2>3D Estimator</h2>
            </div>
          )}
        </div>

        <button
          className={styles.toggleBtn}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to));
            return (
              <li key={item.to} className={styles.navItem}>
                <Link
                  href={item.to}
                  className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {!collapsed && (
                    <span className={styles.navText}>{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className={styles.navBadge}>{item.badge}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {user?.firstName?.charAt(0) || '?'}
          </div>
          {!collapsed && (
            <div className={styles.userDetails}>
              <span className={styles.userName}>
                {user?.firstName} {user?.lastName}
              </span>
              <span className={styles.userRole}>{user?.role}</span>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className={styles.logoutBtn}
          title={collapsed ? 'Logout' : ''}
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
