'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ShieldAlert, Building2, ShieldCheck, Box, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';
import styles from '@/src/app/login/Login.module.scss';
import { authApi } from '@/src/lib/api';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    document.documentElement.setAttribute('data-theme', saved || 'dark');
    createFloatingElements();
  }, []);

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
      if (Math.random() > 0.5) shape.style.borderRadius = '50%';
      container.appendChild(shape);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return setError('Please enter a valid email address');
    }
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(trimmed);
      setSuccess(res.data?.message || 'If an account exists, an OTP has been sent to your email.');
      // Redirect to reset page after short delay
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(trimmed)}`);
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.authContainer}>
        <div className={styles.leftPanel}>
          <div className={styles.threeDContainer}>
            <div className={styles.floatingElements}></div>
            <svg className={styles.threeDModel} viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="buildingGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#2563eb', stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: '#0d9488', stopOpacity: 0.2 }} />
                </linearGradient>
              </defs>
              <g transform="translate(200, 200)">
                <rect x="-50" y="-100" width="100" height="200" fill="url(#buildingGrad2)" stroke="#2563eb" strokeWidth="1" transform="rotate(15)" />
                <rect x="-50" y="-100" width="100" height="200" fill="url(#buildingGrad2)" stroke="#0d9488" strokeWidth="1" transform="rotate(-15)" />
                <rect x="-50" y="-100" width="100" height="200" fill="none" stroke="rgba(37, 99, 235, 0.3)" strokeWidth="1" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <React.Fragment key={i}>
                    <rect x="-40" y={-80 + i * 30} width="15" height="20" fill="rgba(37, 99, 235, 0.3)" />
                    <rect x="25" y={-80 + i * 30} width="15" height="20" fill="rgba(37, 99, 235, 0.3)" />
                  </React.Fragment>
                ))}
              </g>
            </svg>
          </div>

          <div className={styles.logoContainer}>
            <div className={styles.logoIcon}>
              <Building2 size={40} />
            </div>
          </div>

          <h2 className={styles.authTitle}>Grip Estimator</h2>
          <p className={styles.authDescription}>Reset your password securely - OTP based recovery</p>

          <div className={styles.featureList}>
            <div className={styles.featureItem}><Box size={16} /><span>Secure OTP Verification</span></div>
            <div className={styles.featureItem}><Layers size={16} /><span>Encrypted Recovery</span></div>
            <div className={styles.featureItem}><ShieldCheck size={16} /><span>10-Minute Expiry</span></div>
            <div className={styles.featureItem}><CheckCircle2 size={16} /><span>Works for all roles</span></div>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.header}>
            <h1>Forgot Password</h1>
            <p>Enter your email to receive a password reset OTP</p>
          </div>

          <form onSubmit={submit} className={styles.form}>
            {error && (
              <div className={styles.errorAlert}>
                <ShieldAlert size={18} /> {error}
              </div>
            )}
            {success && (
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(34,197,94,0.12)', color: '#15803d', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={18} /> {success}
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.inputLabel}>
                <Mail size={14} /> Email Address <span className="requiredStar">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
              <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>We will send a 6-digit OTP valid for 10 minutes.</span>
            </div>

            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Sending OTP...' : (<><ArrowRight size={18} /> Send Reset OTP</>)}
            </button>
          </form>

          <div className={styles.divider} />
          <div className={styles.footerText}>
            Remember your password?{' '}
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
