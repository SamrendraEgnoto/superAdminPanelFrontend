'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  X, 
  CheckCheck, 
  Trash2, 
  BellOff, 
  ExternalLink,
  ChevronRight,
  UserCheck,
  Building,
  Users
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import styles from './NotificationBell.module.scss';

function formatRelativeTime(dateString) {
  if (!dateString) return 'Just now';
  try {
    const diff = (Date.now() - new Date(dateString).getTime()) / 1000;
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 172800) return 'Yesterday';
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Recently';
  }
}

export default function NotificationBell() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  /**
   * Clicking a notification marks it as read, closes the dropdown,
   * and opens the relevant entity (e.g. the specific lead details).
   */
  const handleItemClick = (item) => {
    if (!item.read) {
      markAsRead(item.id);
    }
    setIsOpen(false);

    let targetLink = item.link;
    if (!targetLink && item.entityType === 'lead' && item.entityId) {
      targetLink = `/leads/${item.entityId}`;
    } else if (!targetLink && item.entityType === 'user') {
      targetLink = '/users';
    } else if (!targetLink && item.entityType === 'admin') {
      targetLink = '/admins';
    } else if (!targetLink && item.entityType === 'settings') {
      targetLink = '/settings';
    }

    if (targetLink) {
      router.push(targetLink);
    }
  };

  const getItemIcon = (item) => {
    if (item.entityType === 'lead') {
      return <Building size={16} />;
    }
    if (item.entityType === 'user') {
      return <UserCheck size={16} />;
    }
    if (item.entityType === 'admin') {
      return <Users size={16} />;
    }
    if (item.type === 'success') {
      return <CheckCircle2 size={16} />;
    }
    if (item.type === 'error') {
      return <AlertCircle size={16} />;
    }
    return <Info size={16} />;
  };

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <button
        type="button"
        className={`${styles.bellBtn} ${isOpen ? styles.active : ''}`}
        onClick={handleToggle}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className={styles.headerBadge}>{unreadCount} new</span>
              )}
            </div>
            <div className={styles.headerActions}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                  <span>Read all</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.clearBtn}`}
                  onClick={clearAll}
                  title="Clear all notifications"
                >
                  <Trash2 size={14} />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <BellOff size={32} />
                <h4>No notifications yet</h4>
                <p>New leads, assignments, and alerts will appear here.</p>
              </div>
            ) : (
              notifications.map((item) => {
                const isNavigable = !!(item.link || (item.entityType === 'lead' && item.entityId) || item.entityType === 'user' || item.entityType === 'admin');

                return (
                  <div
                    key={item.id}
                    className={`${styles.item} ${!item.read ? styles.unread : ''} ${isNavigable ? styles.clickable : ''}`}
                    onClick={() => handleItemClick(item)}
                    title={isNavigable ? 'Click to open details' : undefined}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleItemClick(item);
                      }
                    }}
                  >
                    <div className={`${styles.itemIcon} ${styles[item.type] || styles.info}`}>
                      {getItemIcon(item)}
                    </div>
                    <div className={styles.itemContent}>
                      {item.title && (
                        <div className={styles.itemTitleRow}>
                          <span className={styles.itemTitle}>{item.title}</span>
                          {isNavigable && (
                            <span className={styles.openHint}>
                              <span>Open</span>
                              <ChevronRight size={12} />
                            </span>
                          )}
                        </div>
                      )}
                      <span className={styles.itemMessage}>{item.message}</span>
                      <div className={styles.itemMeta}>
                        <span className={styles.itemTime}>
                          {formatRelativeTime(item.createdAt)}
                        </span>
                        {item.entityType === 'lead' && (
                          <span className={styles.entityTag}>Lead</span>
                        )}
                        {item.entityType === 'user' && (
                          <span className={styles.entityTag}>Team</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.itemActions}>
                      {!item.read && <span className={styles.unreadDot} title="Unread" />}
                      <button
                        type="button"
                        className={styles.removeBtn}
                        title="Remove notification"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(item.id);
                        }}
                        aria-label="Remove notification"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className={styles.footer}>
              {unreadCount === 0
                ? 'All caught up!'
                : `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
