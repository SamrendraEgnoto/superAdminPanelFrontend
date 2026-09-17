'use client';

import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Lock, Mail, ShieldAlert, LogIn, Building2, CheckCircle2, ShieldCheck, Zap, Box, Layers } from 'lucide-react';
import styles from './Login.module.scss';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

import { validateEmail, validateRequired } from '@/src/lib/validation'; 

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passkey, setPasskey] = useState('');
  const [role, setRole] = useState('root');
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});

  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme')
      const theme = saved || 'dark'
      document.documentElement.setAttribute('data-theme', theme)
      createFloatingElements();
    }
  }, [])

  const createFloatingElements = () => {
    const container = document.querySelector(`.${styles.floatingElements}`);
    if (!container) return;

    container.innerHTML = '';

    for (let i = 0; i < 15; i++) {
      const shape = document.createElement('div');
      shape.className = styles.floatingShape;

      const size = Math.random() * 40 + 20;
      const left = Math.random() * 100;
      const delay = Math.random() * 10;
      const duration = Math.random() * 10 + 10;

      shape.style.width = `${size}px`;
      shape.style.height = `${size}px`;
      shape.style.left = `${left}%`;
      shape.style.animationDelay = `${delay}s`;
      shape.style.animationDuration = `${duration}s`;
      shape.style.opacity = Math.random() * 0.3 + 0.1;

      if (Math.random() > 0.5) {
        shape.style.borderRadius = '50%';
      }

      container.appendChild(shape);
    }
  }

  //ADDED VALIDATION FUNCTION
  const validateForm = () => {
    const errors = {};

    errors.email = validateEmail(email);
    errors.password = validateRequired(password, 'Password');

    Object.keys(errors).forEach(key => {
      if (!errors[key]) delete errors[key];
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();

    // VALIDATION CHECK ADDED
    if (!validateForm()) return;

    setErr(null);
    setLoading(true);

    try {
      const res = await login(email.trim().toLowerCase(), password.trim(), role);

      if (res.success) {
        // Store the passkey so it is sent with every subsequent API request
        // via the x-tenant-passkey header — this enables PII decryption.
        // Only admin/superadmin roles have tenant encryption.
        if (passkey && ['admin', 'superadmin', 'root'].includes(role)) {
          localStorage.setItem('passkey', passkey.trim());
        } else {
          localStorage.removeItem('passkey');
        }
        router.push('/');
      }
   
      else if (res.redirectToOtp) {
        router.push(`/verify-otp?email=${res.email}`);
      }
      else {
        setErr(res.message || 'Invalid credentials. Please try again.');
      }
    } catch (e) {
      console.error('Login error', e);
      setErr('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.authContainer}>
        <div className={styles.leftPanel}>
          <div className={styles.threeDContainer}>
            <div className={styles.floatingElements}></div>
            {/* NO CHANGE */}
          </div>

          <div className={styles.logoContainer}>
            <div className={styles.logoIcon}>
              <Building2 size={40} />
            </div>
          </div>

          <h2 className={styles.authTitle}>3D Estimator Pro</h2>
          <p className={styles.authDescription}>
            Advanced 3D estimation platform for construction professionals
          </p>

          <div className={styles.featureList}>
            <div className={styles.featureItem}><Box size={16} /><span>3D Model Integration</span></div>
            <div className={styles.featureItem}><Layers size={16} /><span>Multi-layer Estimation</span></div>
            <div className={styles.featureItem}><ShieldCheck size={16} /><span>Secure Data Management</span></div>
            <div className={styles.featureItem}><Zap size={16} /><span>Real-time Collaboration</span></div>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.header}>
            <h1>Welcome Back</h1>
            <p>Login to manage your 3D Estimator projects</p>
          </div>

          <form onSubmit={submit} className={styles.form}>
            {err && (
              <div className={styles.errorAlert}>
                <ShieldAlert size={18} />
                {err}
              </div>
            )}

            {/* EMAIL */}
            <div className={styles.fieldGroup}>
              <label className={styles.inputLabel}>
                <Mail size={14} /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
              {fieldErrors.email && (
                <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
                  {fieldErrors.email}
                </span>
              )}
            </div>

            {/* PASSWORD */}
            <div className={styles.fieldGroup}>
              <label className={styles.inputLabel}>
                <Lock size={14} /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              {fieldErrors.password && (
                <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {/* ROLE (UNCHANGED) */}
            <div className={styles.fieldGroup}>
              <label className={styles.inputLabel}>Select Workspace Role</label>
<select value={role} onChange={(e) => setRole(e.target.value)}>
  <option value="root">Root</option>
  <option value="superadmin">Super Admin</option>
  <option value="admin">Admin</option>
  <option value="user">User</option>
</select>
            </div>

            {/* PASSKEY — Only required for admin/superadmin/root (tenant encryption) */}
            {['admin', 'superadmin', 'root'].includes(role) && (
              <div className={styles.fieldGroup}>
                <label className={styles.inputLabel}>
                  <ShieldCheck size={14} /> Encryption Passkey
                </label>
                <input
                  type="password"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="Your tenant encryption passkey"
                />
                <span style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '4px', display: 'block' }}>
                  Set during onboarding. Required to decrypt lead data.
                </span>
              </div>
            )}

            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Authenticating...' : (<><LogIn size={18} /> Sign In</>)}
            </button>
          </form>

          <div className={styles.divider} />
          <div className={styles.footerText}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}