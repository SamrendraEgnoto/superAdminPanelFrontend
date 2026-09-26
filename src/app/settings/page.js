'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useSettings } from '@/src/context/SettingsContext'; // Use Global Context
import { superAdminApi, adminApi, default as api } from '@/src/lib/api';
import toast from 'react-hot-toast';
import {
  Bell, Palette, Mail, Database, Save, Loader2, Check, RefreshCw,
  Eye, EyeOff, Code, Copy, Key, ShieldCheck, CheckCircle2, Sparkles
} from 'lucide-react';
import styles from './Settings.module.scss';

export default function SettingsPage() {
  const { user } = useAuth();
  const { settings, loading: fetching, saving: loading, updateSetting, saveSettings } = useSettings();

  const [activeTab, setActiveTab] = useState('notifications');
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 3D Estimator Embed Keys State
  const [embedKeys, setEmbedKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedIframe, setCopiedIframe] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [rawGeneratedKey, setRawGeneratedKey] = useState(null);

  const handleUpdateSetting = (category, key, value) => {
    setHasChanges(true);
    updateSetting(category, key, value);
  };

  const handleSaveSettings = async () => {
    const success = await saveSettings();
    if (success) {
      setSaved(true);
      setHasChanges(false);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const resetToDefaults = () => {
    const defaults = {
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
    };

    // Update each category
    Object.keys(defaults).forEach(category => {
      Object.keys(defaults[category]).forEach(key => {
        updateSetting(category, key, defaults[category][key]);
      });
    });

    setHasChanges(true);
    toast.success('Settings reset to defaults (click save to persist)');
  };

  // Role & Permission checks for 3D Embed Key:
  // Allowed ONLY for:
  //  1. Root Super Admin (RSA)
  //  2. Delegated Super Admin (DSA)
  //  3. Tenant Admin created by RSA (adminType === 'tenant' or not 'data-viewer')
  // Blocked for:
  //  - Data-viewer Admin created by DSA
  //  - Regular Users
  const isRoot = user?.role === 'root' || user?.isRoot || user?.dbRole === 'root';
  const isDsa = !isRoot && (user?.role === 'superadmin' || user?.isDsa || user?.dbRole === 'delegated');
  const isTenantAdmin = user?.role === 'admin' && user?.adminType !== 'data-viewer';
  const isParentOrRoot = isRoot || isDsa || isTenantAdmin;
  // Root Super Admin cannot see or generate embed keys. Only DSA or Tenant Admins (created by root) can.
  const canAccessEmbedKey = Boolean(!isRoot && (isDsa || isTenantAdmin));

  const getEmbedUrl = (key) => {
    const k = key || 'YOUR_EMBED_KEY';
    const base = (process.env.NEXT_PUBLIC_ESTIMATOR_URL || 'https://gripestimator.com/estimator-ai').replace(/\/+$/, '');
    return `${base}/?tenant=${encodeURIComponent(k)}`;
  };

  const getIframeCode = (key) => {
    return `<iframe \n  src="${getEmbedUrl(key)}" \n  width="100%" \n  height="820px" \n  frameborder="0" \n  allow="fullscreen" \n  title="3D Building Estimator">\n</iframe>`;
  };

  const fetchEmbedKeys = async () => {
    if (!canAccessEmbedKey) return;
    setLoadingKeys(true);
    try {
      if (user?.role === 'superadmin' || user?.role === 'delegated' || user?.role === 'root') {
        const res = await superAdminApi.listMyEmbedKeys();
        setEmbedKeys(res.data?.data || []);
      } else if (user?.role === 'admin') {
        const res = await adminApi.listMyEmbedKeys();
        setEmbedKeys(res.data?.data || []);
      }
    } catch (e) {
      console.error('Error fetching embed keys:', e);
    } finally {
      setLoadingKeys(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'embedKey') {
      if (!canAccessEmbedKey) {
        setActiveTab('notifications');
      } else {
        fetchEmbedKeys();
      }
    } else if (!isParentOrRoot && (activeTab === 'integrations' || activeTab === 'system')) {
      setActiveTab('notifications');
    }
  }, [activeTab, canAccessEmbedKey, isParentOrRoot]);

  const handleGenerateKey = async () => {
    if (!canAccessEmbedKey) return;
    setGeneratingKey(true);
    try {
      let res;
      if (user?.role === 'admin') {
        res = await adminApi.generateMyEmbedKey();
      } else {
        res = await superAdminApi.generateMyEmbedKey();
      }
      const newKey = res.data?.data?.key;
      setRawGeneratedKey(newKey);
      toast.success('3D Estimator Embed Key generated successfully!');
      fetchEmbedKeys();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to generate key');
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      toast.success('Embed Key copied to clipboard!');
    } else if (type === 'iframe') {
      setCopiedIframe(true);
      setTimeout(() => setCopiedIframe(false), 2000);
      toast.success('iFrame Embed Code copied!');
    } else if (type === 'script') {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
      toast.success('JavaScript Embed Code copied!');
    }
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    ...(isParentOrRoot ? [{ id: 'integrations', label: 'Integrations', icon: <Mail size={18} /> }] : []),
    ...(canAccessEmbedKey ? [{ id: 'embedKey', label: '3D Embed Key', icon: <Code size={18} /> }] : []),
    ...(isParentOrRoot ? [{ id: 'system', label: 'System', icon: <Database size={18} /> }] : []),
  ];

  if (fetching) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={48} />
        <p>Loading your preferences...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Settings</h1>
          <p>Manage your application preferences and configurations</p>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.resetBtn}
            onClick={resetToDefaults}
            title="Reset to defaults"
          >
            <RefreshCw size={18} />
            Reset
          </button>

          <button
            className={`${styles.saveBtn} ${saved ? styles.saved : ''}`}
            onClick={handleSaveSettings}
            disabled={loading || !hasChanges}
          >
            {loading ? (
              <>
                <Loader2 size={18} className={styles.spinner} />
                Saving…
              </>
            ) : saved ? (
              <>
                <Check size={18} />
                Saved!
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {hasChanges && (
        <div className={styles.unsavedBanner}>
          You have unsaved changes. Click "Save Changes" to apply them.
        </div>
      )}

      <div className={styles.layout}>
        <nav className={styles.nav}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {activeTab === 'notifications' && (
            <div className={styles.section}>
              <h3>Notification Preferences</h3>
              <p>Choose how you want to be notified about important events</p>

              <div className={styles.group}>
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                  { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications' },
                  { key: 'inAppToasts', label: 'In-App Popups & Toasts', desc: 'Display realtime popup banners on screen' },
                  { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Get a weekly summary report' },
                  { key: 'newLeadAlerts', label: 'New Lead Alerts', desc: 'Alert when new leads arrive' },
                  { key: 'assignmentAlerts', label: 'Assignment Alerts', desc: 'Alert when leads are assigned or shared' },
                ].map((item) => (
                  <label key={item.key} className={styles.toggleGroup}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>{item.label}</span>
                      <span className={styles.toggleDesc}>{item.desc}</span>
                    </div>
                    <div
                      className={`${styles.toggle} ${settings.notifications[item.key] ? styles.on : ''}`}
                      onClick={() =>
                        handleUpdateSetting('notifications', item.key, !settings.notifications[item.key])
                      }
                    >
                      <div className={styles.toggleKnob} />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className={styles.section}>
              <h3>Appearance Settings</h3>
              <p>Customize the look and feel of your application</p>

              <div className={styles.group}>
                <div className={styles.themeSelector}>
                  <span className={styles.fieldLabel}>Theme</span>
                  <div className={styles.themeOptions}>
                    {['dark', 'light',].map((theme) => (
                      <button
                        key={theme}
                        className={`${styles.themeOption} ${settings.appearance.theme === theme ? styles.selected : ''}`}
                        onClick={() => handleUpdateSetting('appearance', 'theme', theme)}
                      >
                        <div className={`${styles.themePreview} ${styles[theme]}`} />
                        <span>{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {[
                  { key: 'compactMode', label: 'Compact Mode', desc: 'Reduce spacing and padding' },
                  { key: 'sidebarCollapsed', label: 'Collapsed Sidebar', desc: 'Sidebar collapsed by default' },
                ].map((item) => (
                  <label key={item.key} className={styles.toggleGroup}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>{item.label}</span>
                      <span className={styles.toggleDesc}>{item.desc}</span>
                    </div>
                    <div
                      className={`${styles.toggle} ${settings.appearance[item.key] ? styles.on : ''}`}
                      onClick={() =>
                        handleUpdateSetting('appearance', item.key, !settings.appearance[item.key])
                      }
                    >
                      <div className={styles.toggleKnob} />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className={styles.section}>
              <h3>Email Integration</h3>
              <p>Configure email settings for notifications and reports</p>

              <div className={styles.group}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Email Provider</label>
                  <select
                    className={styles.fieldSelect}
                    value={settings.integration.emailProvider}
                    onChange={(e) => handleUpdateSetting('integration', 'emailProvider', e.target.value)}
                  >
                    <option value="smtp">SMTP (Recommended)</option>
                    <option value="sendgrid">SendGrid API</option>
                    <option value="mailgun">Mailgun API</option>
                  </select>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>SMTP Host</label>
                    <input
                      className={styles.fieldInput}
                      type="text"
                      value={settings.integration.smtpHost}
                      onChange={(e) => handleUpdateSetting('integration', 'smtpHost', e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>SMTP Port</label>
                    <input
                      className={styles.fieldInput}
                      type="text"
                      value={settings.integration.smtpPort}
                      onChange={(e) => handleUpdateSetting('integration', 'smtpPort', e.target.value)}
                      placeholder="587"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Username</label>
                    <input
                      className={styles.fieldInput}
                      type="text"
                      value={settings.integration.smtpUser}
                      onChange={(e) => handleUpdateSetting('integration', 'smtpUser', e.target.value)}
                      placeholder="username@example.com"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Password</label>
                    <div className={styles.passwordField}>
                      <input
                        className={styles.fieldInput}
                        type={showPassword ? 'text' : 'password'}
                        value={settings.integration.smtpPassword}
                        onChange={(e) => handleUpdateSetting('integration', 'smtpPassword', e.target.value)}
                        placeholder="••••••••"
                      />
                      <button
                        className={styles.passwordToggle}
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'embedKey' && (
            <div className={styles.section}>
              <h3>3D Estimator Website Integration & Embed Key</h3>
              <p>Embed the 3D Estimator directly on your website. Any quote submitted by your visitors will automatically land in your Leads dashboard.</p>

              {loadingKeys ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 30, color: 'var(--text-secondary)' }}>
                  <Loader2 className={styles.spinner} size={24} />
                  <span>Loading your active embed keys...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Current Key Card */}
                  <div style={{
                    background: 'var(--bg-surface-hover, #1e2235)',
                    border: '1px solid var(--border, #2e354f)',
                    borderRadius: '16px',
                    padding: '24px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Key size={20} color="var(--primary, #4f46e5)" />
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Active Embed Key</span>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: (rawGeneratedKey || embedKeys.length > 0) ? '#064e3b' : '#374151',
                        color: (rawGeneratedKey || embedKeys.length > 0) ? '#34d399' : '#9ca3af'
                      }}>
                        {(rawGeneratedKey || embedKeys.length > 0) ? 'Active' : 'No Key Generated'}
                      </span>
                    </div>

                    {rawGeneratedKey ? (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: '0.85rem', color: '#38bdf8', marginBottom: 6, fontWeight: 600 }}>
                          ✨ Newly Generated Key (Save this now!):
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          background: 'rgba(0,0,0,0.3)',
                          padding: '12px 16px',
                          borderRadius: 8,
                          border: '1px solid #0284c7'
                        }}>
                          <code style={{ fontSize: '0.95rem', color: '#f8fafc', wordBreak: 'break-all', flex: 1 }}>
                            {rawGeneratedKey}
                          </code>
                          <button
                            onClick={() => handleCopy(rawGeneratedKey, 'key')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '8px 14px',
                              borderRadius: 6,
                              background: copiedKey ? '#059669' : 'var(--primary, #4f46e5)',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.85rem'
                            }}
                          >
                            {copiedKey ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                            {copiedKey ? 'Copied!' : 'Copy Key'}
                          </button>
                        </div>
                      </div>
                    ) : embedKeys.length > 0 ? (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                          Active Key Prefix (Scope: {embedKeys[0].scope || 'create-lead-only'}):
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          background: 'rgba(0,0,0,0.25)',
                          padding: '12px 16px',
                          borderRadius: 8,
                          border: '1px solid var(--border)'
                        }}>
                          <code style={{ fontSize: '0.95rem', color: '#94a3b8', wordBreak: 'break-all', flex: 1 }}>
                            {embedKeys[0].key || embedKeys[0].keyPrefix || 'Active Key Configured'}
                          </code>
                          <button
                            onClick={() => handleCopy(embedKeys[0].key || embedKeys[0].keyPrefix, 'key')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '8px 14px',
                              borderRadius: 6,
                              background: copiedKey ? '#059669' : 'var(--primary, #4f46e5)',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.85rem'
                            }}
                          >
                            {copiedKey ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                            {copiedKey ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        You do not have an active 3D embed key yet. Generate one below to start receiving quotes from your website.
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                      <button
                        onClick={handleGenerateKey}
                        disabled={generatingKey}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 18px',
                          borderRadius: 8,
                          background: 'var(--primary, #4f46e5)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.9rem'
                        }}
                      >
                        {generatingKey ? <Loader2 className={styles.spinner} size={16} /> : <Sparkles size={16} />}
                        {embedKeys.length > 0 ? 'Generate New / Rotate Key' : 'Generate 3D Embed Key'}
                      </button>
                    </div>
                  </div>

                  {/* Ready-to-use Embed Snippets */}
                  <div style={{
                    background: 'var(--bg-surface-hover, #1e2235)',
                    border: '1px solid var(--border, #2e354f)',
                    borderRadius: '16px',
                    padding: '24px'
                  }}>
                    <h4 style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700 }}>
                      Method 1: Responsive iFrame Drop-In (Recommended)
                    </h4>
                    <p style={{ margin: '0 0 14px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      Copy and paste this HTML snippet into your WordPress, Webflow, Shopify, or custom website page:
                    </p>

                    <div style={{ position: 'relative' }}>
                      <pre style={{
                        background: '#0f172a',
                        color: '#38bdf8',
                        padding: '16px',
                        borderRadius: 8,
                        fontSize: '0.85rem',
                        overflowX: 'auto',
                        border: '1px solid #1e293b'
                      }}>
                        {getIframeCode(rawGeneratedKey || embedKeys[0]?.key || embedKeys[0]?.keyPrefix || 'YOUR_EMBED_KEY')}
                      </pre>
                      <button
                        onClick={() => handleCopy(getIframeCode(rawGeneratedKey || embedKeys[0]?.key || embedKeys[0]?.keyPrefix || 'YOUR_EMBED_KEY'), 'iframe')}
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 6,
                          background: copiedIframe ? '#059669' : '#334155',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        {copiedIframe ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                        {copiedIframe ? 'Copied iFrame Code!' : 'Copy Code'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'system' && (
            <div className={styles.section}>
              <h3>System Configuration</h3>
              <p>Manage system-wide settings and maintenance</p>

              <div className={styles.group}>
                <label className={styles.toggleGroup}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleLabel}>Automatic Backups</span>
                    <span className={styles.toggleDesc}>Automatically back up your data</span>
                  </div>
                  <div
                    className={`${styles.toggle} ${settings.system.autoBackup ? styles.on : ''}`}
                    onClick={() =>
                      handleUpdateSetting('system', 'autoBackup', !settings.system.autoBackup)
                    }
                  >
                    <div className={styles.toggleKnob} />
                  </div>
                </label>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Backup Frequency</label>
                  <select
                    className={styles.fieldSelect}
                    value={settings.system.backupFrequency}
                    onChange={(e) => handleUpdateSetting('system', 'backupFrequency', e.target.value)}
                    disabled={!settings.system.autoBackup}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Data Retention (Days)</label>
                  <input
                    className={styles.fieldInput}
                    type="number"
                    value={settings.system.retentionPeriod}
                    onChange={(e) => handleUpdateSetting('system', 'retentionPeriod', e.target.value)}
                    placeholder="90"
                    min="1"
                    max="365"
                  />
                  <span className={styles.fieldHint}>
                    Data older than {settings.system.retentionPeriod} days will be archived
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
