'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ShieldAlert, ShieldCheck, Building2, Box, Layers, CheckCircle2, KeyRound, Eye, EyeOff } from 'lucide-react';
import styles from '@/src/app/login/Login.module.scss';
import { authApi } from '@/src/lib/api';
import Link from 'next/link';

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    setEmail(emailFromQuery);
  }, [emailFromQuery]);

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

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return setError('Please enter a valid email address');
    }
    if (otp.length !== 6) return setError('OTP must be 6 digits');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    try {
      const res = await authApi.resetPassword({ email: trimmedEmail, otp: otp.trim(), newPassword });
      setSuccess(res.data?.message || 'Password reset successfully.');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Check OTP and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) return setError('Enter email to resend OTP');
    setResendLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSuccess('OTP resent successfully. Check your inbox.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
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
                <linearGradient id="buildingGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#2563eb', stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: '#0d9488', stopOpacity: 0.2 }} />
                </linearGradient>
              </defs>
              <g transform="translate(200, 200)">
                <rect x="-50" y="-100" width="100" height="200" fill="url(#buildingGrad3)" stroke="#2563eb" strokeWidth="1" transform="rotate(15)" />
                <rect x="-50" y="-100" width="100" height="200" fill="url(#buildingGrad3)" stroke="#0d9488" strokeWidth="1" transform="rotate(-15)" />
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
          <p className={styles.authDescription}>Enter OTP and set your new password</p>

          <div className={styles.featureList}>
            <div className={styles.featureItem}><Box size={16} /><span>OTP Verified Reset</span></div>
            <div className={styles.featureItem}><Layers size={16} /><span>Secure & Encrypted</span></div>
            <div className={styles.featureItem}><ShieldCheck size={16} /><span>All Roles Supported</span></div>
            <div className={styles.featureItem}><CheckCircle2 size={16} /><span>Instant Login After Reset</span></div>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.header}>
            <h1>Reset Password</h1>
            <p>OTP sent to <strong>{email || 'your email'}</strong></p>
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
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.inputLabel}>
                <KeyRound size={14} /> 6-Digit OTP <span className="requiredStar">*</span>
              </label>
              <input
                type="text"
                value={otp}
                maxLength={6}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit OTP"
                required
              />
              <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                Didn&apos;t receive it?{' '}
                <span onClick={handleResend} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }}>
                  {resendLoading ? 'Resending...' : 'Resend OTP'}
                </span>
              </span>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.inputLabel}>
                <Lock size={14} /> New Password <span className="requiredStar">*</span>
              </label>
              <div className="passwordInputWrapper">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="•••••••• (min 6 chars)"
                  required
                />
                <button
                  type="button"
                  className="passwordToggleBtn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.inputLabel}>
                <Lock size={14} /> Confirm Password <span className="requiredStar">*</span>
              </label>
              <div className="passwordInputWrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  className="passwordToggleBtn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Resetting...' : (<><ShieldCheck size={18} /> Reset Password</>)}
            </button>
          </form>

          <div className={styles.divider} />
          <div className={styles.footerText}>
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Back to Login</Link>
            {' · '}
            <Link href="/forgot-password" style={{ color: 'var(--primary)', fontWeight: 700 }}>Change Email</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
