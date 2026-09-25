// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { Mail, ShieldCheck } from 'lucide-react';
// import styles from '@/src/app/login/Login.module.scss';
// import { authApi } from '@/src/lib/api';
// import { useAuth } from '@/src/context/AuthContext';

// export default function VerifyOtpPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const email = searchParams.get('email');
//   const [otp, setOtp] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const { checkAuthStatus } = useAuth();

//   useEffect(() => {
//     const saved = localStorage.getItem('theme')
//     document.documentElement.setAttribute('data-theme', saved || 'dark')
//   }, [])

//   const submit = async (e) => {
//     e.preventDefault();
//     setError(null);
//     if (otp.length !== 6) {
//       return setError('OTP must be 6 digits');
//     }
//     setLoading(true);
//     try {
//       const res = await authApi.verifyOtp({ email, otp });
//       localStorage.setItem('token', res.data.token);
//       localStorage.setItem('role', res.data.role);
//       await checkAuthStatus();
//       router.push('/');
//     } catch (err) {
//       setError(err.response?.data?.message || 'Invalid OTP');
//     } finally {
//       setLoading(false);
//     }
//   };

//  const resendOtp = async () => {
//   console.log('RESEND EMAIL:', email); 

//   try {
//     await authApi.resendOtp(email);
//     alert('OTP resent successfully!');
//   } catch (err) {
//     console.error('RESEND ERROR:', err.response?.data);
//     setError(err.response?.data?.message || 'Failed to resend OTP');
//   }
// };

//   return (
//     <div className={styles.page}>
//       <div className={styles.loginCard}>
//         <div className={styles.header}>
//           <div className={styles.logoIcon}>
//             <ShieldCheck size={28} />
//           </div>
//           <h1>Verify Email</h1>
//           <p>Enter the 6-digit OTP sent to your email</p>
//         </div>

//         <form onSubmit={submit} className={styles.form}>
//           {error && (
//             <div className={styles.errorAlert}>
//               {error}
//             </div>
//           )}

//           <div className={styles.fieldGroup}>
//             <label className={styles.inputLabel}>
//               <Mail size={14} /> OTP Code
//             </label>
//             <input
//               type="text"
//               value={otp}
//               maxLength={6}
//               onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
//               placeholder="Enter 6-digit OTP"
//               required
//             />
//           </div>

//           <button className={styles.submitBtn} type="submit" disabled={loading}>
//             {loading ? 'Verifying...' : 'Verify OTP'}
//           </button>
//         </form>

//         <div className={styles.divider} />

//         <div className={styles.footerText}>
//           Didn’t receive OTP?{' '}
//           <span
//             onClick={resendOtp}
//             style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }}
//           >
//             Resend
//           </span>
//         </div>
//       </div>
//     </div>
//   )
// }


'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, ShieldCheck, ShieldAlert, RefreshCw, Building2, CheckCircle2, Box, Layers } from 'lucide-react';
import styles from '@/src/app/login/Login.module.scss';
import { authApi } from '@/src/lib/api';
import { useAuth } from '@/src/context/AuthContext';

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);

  const { checkAuthStatus } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    document.documentElement.setAttribute('data-theme', saved || 'dark');

    // Create floating elements
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

      if (Math.random() > 0.5) {
        shape.style.borderRadius = '50%';
      }

      container.appendChild(shape);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (otp.length !== 6) {
      return setError('OTP must be 6 digits');
    }
    setLoading(true);
    try {
      const res = await authApi.verifyOtp({ email, otp });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      await checkAuthStatus();
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!email) {
      setError('Email not found');
      return;
    }

    setResendLoading(true);
    setError(null);
    try {
      await authApi.resendOtp(email);
      alert('OTP resent successfully!');
    } catch (err) {
      console.error('RESEND ERROR:', err.response?.data);
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
                <linearGradient id="buildingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#2563eb', stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: '#0d9488', stopOpacity: 0.2 }} />
                </linearGradient>
              </defs>
              {/* 3D Building Structure */}
              <g transform="translate(200, 200)">
                <rect x="-50" y="-100" width="100" height="200" fill="url(#buildingGrad)" stroke="#2563eb" strokeWidth="1" transform="rotate(15)" />
                <rect x="-50" y="-100" width="100" height="200" fill="url(#buildingGrad)" stroke="#0d9488" strokeWidth="1" transform="rotate(-15)" />
                <rect x="-50" y="-100" width="100" height="200" fill="none" stroke="rgba(37, 99, 235, 0.3)" strokeWidth="1" />
                {/* Windows */}
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
          <p className={styles.authDescription}>
            Secure email verification for your 3D estimation platform
          </p>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <Box size={16} />
              <span>3D Model Verification</span>
            </div>
            <div className={styles.featureItem}>
              <Layers size={16} />
              <span>Secure Access Control</span>
            </div>
            <div className={styles.featureItem}>
              <ShieldCheck size={16} />
              <span>Two-Factor Authentication</span>
            </div>
            <div className={styles.featureItem}>
              <CheckCircle2 size={16} />
              <span>Instant Account Activation</span>
            </div>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.header}>
            <h1>Verify Your Email</h1>
            <p>Enter the 6-digit OTP sent to <strong>{email || 'your email'}</strong></p>
          </div>

          <form onSubmit={submit} className={styles.form}>
            {error && (
              <div className={styles.errorAlert}>
                <ShieldAlert size={18} />
                {error}
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.inputLabel}>
                <Mail size={14} /> OTP Code <span className="requiredStar">*</span>
              </label>
              <input
                type="text"
                value={otp}
                maxLength={6}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit OTP"
                required
              />
            </div>

            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? (
                'Verifying...'
              ) : (
                <>
                  <ShieldCheck size={18} /> Verify OTP
                </>
              )}
            </button>
          </form>

          <div className={styles.divider} />

          <div className={styles.footerText}>
            Didn&apos;t receive OTP?{' '}
            <span
              onClick={resendOtp}
              style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }}
            >
              {resendLoading ? (
                <>
                  <RefreshCw size={14} className={styles.spin} /> Resending...
                </>
              ) : (
                'Resend OTP'
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}