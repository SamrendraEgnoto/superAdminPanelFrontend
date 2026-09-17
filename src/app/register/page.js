// 'use client';

// import React, { useState, useEffect } from 'react'
// import api from '@/src/lib/api'
// import { UserPlus, Mail, Lock, Building2, User } from 'lucide-react'
// import { useRouter } from 'next/navigation'
// import Link from 'next/link'
// import styles from '@/src/app/login/Login.module.scss'

// export default function RegisterPage() {
//   const [form, setForm] = useState({
//     firstName: '',
//     lastName: '',
//     email: '',
//     password: '',
//     companyName: '',
//     role: 'admin',
//   })
//   const [error, setError] = useState(null)
//   const [loading, setLoading] = useState(false)
//   const router = useRouter()

//   // Ensure theme is applied even on auth pages
//   useEffect(() => {
//     const saved = localStorage.getItem('theme')
//     if (saved) {
//       document.documentElement.setAttribute('data-theme', saved)
//     } else {
//       document.documentElement.setAttribute('data-theme', 'dark')
//     }
//   }, [])

//   const submit = async (e) => {
//     e.preventDefault();
//     setError(null);
//     setLoading(true);
//     console.log('FORM DATA:', form);
//     try {
//       await api.post('/auth/register', form);
//       alert('Account created successfully! Please login.');
//       // router.push('/login');
//       router.push(`/verify-otp?email=${form.email}`)
//     } catch (err) {
//       console.error(err);
//       console.error('REGISTER ERROR:', err.response?.data)
//       setError(err.response?.data?.message || 'Registration failed');
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className={styles.page}>
//       <div className={styles.loginCard}>
//         <div className={styles.header}>
//           <div className={styles.logoIcon}>
//             <UserPlus size={28} />
//           </div>
//           <h1>Create Admin Account</h1>
//           <p>Sign up for 3D Estimator Admin access</p>
//         </div>

//         <form onSubmit={submit} className={styles.form}>
//           {error && (
//             <div className={styles.errorAlert}>
//               <UserPlus size={18} />
//               {error}
//             </div>
//           )}

//           <div className={styles.row}>
//             <div className={styles.fieldGroup}>
//               <label className={styles.inputLabel}>
//                 <User size={14} /> First Name
//               </label>
//               <input
//                 type="text"
//                 value={form.firstName}
//                 onChange={(e) => setForm({ ...form, firstName: e.target.value })}
//                 required
//                 placeholder="John"
//               />
//             </div>

//             <div className={styles.fieldGroup}>
//               <label className={styles.inputLabel}>
//                 <User size={14} /> Last Name
//               </label>
//               <input
//                 type="text"
//                 value={form.lastName}
//                 onChange={(e) => setForm({ ...form, lastName: e.target.value })}
//                 required
//                 placeholder="Doe"
//               />
//             </div>
//           </div>

//           <div className={styles.fieldGroup}>
//             <label className={styles.inputLabel}>
//               <Mail size={14} /> Email Address
//             </label>
//             <input
//               type="email"
//               value={form.email}
//               onChange={(e) => setForm({ ...form, email: e.target.value })}
//               required
//               placeholder="admin@company.com"
//             />
//           </div>

//           <div className={styles.fieldGroup}>
//             <label className={styles.inputLabel}>
//               <Lock size={14} /> Password
//             </label>
//             <input
//               type="password"
//               value={form.password}
//               onChange={(e) => setForm({ ...form, password: e.target.value })}
//               required
//               minLength={6}
//               placeholder="••••••••"
//             />
//           </div>

//           <div className={styles.fieldGroup}>
//             <label className={styles.inputLabel}>
//               <Building2 size={14} /> Company Name
//             </label>
//             <input
//               type="text"
//               value={form.companyName}
//               onChange={(e) => setForm({ ...form, companyName: e.target.value })}
//               required
//               placeholder="ABC Construction"
//             />
//           </div>

//           <div className={styles.fieldGroup}>
//             <label className={styles.inputLabel}>Role</label>
//             <select
//               className={styles.select}
//               value={form.role}
//               onChange={(e) => setForm({ ...form, role: e.target.value })}
//             >
//               <option value="superadmin">Super Admin</option>
//               <option value="admin">Admin</option>
//               <option value="user">User</option>
//             </select>
//           </div>

//           <button className={styles.submitBtn} type="submit" disabled={loading}>
//             {loading ? (
//               'Creating Account...'
//             ) : (
//               <>
//                 <UserPlus size={18} /> Create Account
//               </>
//             )}
//           </button>
//         </form>

//         <div className={styles.divider} />
//         <div className={styles.footerText}>
//           Already have an account?{' '}
//           <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
//             Sign in
//           </Link>
//         </div>
//       </div>
//     </div>
//   )
// }



// 'use client';

// import React, { useState, useEffect } from 'react'
// import api from '@/src/lib/api'
// import { UserPlus, Mail, Lock, Building2, User, CheckCircle2, ShieldCheck, Zap, Box, Layers } from 'lucide-react'
// import { useRouter } from 'next/navigation'
// import Link from 'next/link'
// import styles from '@/src/app/login/Login.module.scss'

// export default function RegisterPage() {
//   const [form, setForm] = useState({
//     firstName: '',
//     lastName: '',
//     email: '',
//     password: '',
//     companyName: '',
//     role: 'admin',
//   })
//   const [error, setError] = useState(null)
//   const [loading, setLoading] = useState(false)
//   const router = useRouter()

//   useEffect(() => {
//     const saved = localStorage.getItem('theme')
//     if (saved) {
//       document.documentElement.setAttribute('data-theme', saved)
//     } else {
//       document.documentElement.setAttribute('data-theme', 'dark')
//     }

//     // Create floating elements
//     createFloatingElements();
//   }, [])

//   const createFloatingElements = () => {
//     const container = document.querySelector(`.${styles.floatingElements}`);
//     if (!container) return;

//     container.innerHTML = '';

//     for (let i = 0; i < 15; i++) {
//       const shape = document.createElement('div');
//       shape.className = styles.floatingShape;

//       const size = Math.random() * 40 + 20;
//       const left = Math.random() * 100;
//       const delay = Math.random() * 10;
//       const duration = Math.random() * 10 + 10;

//       shape.style.width = `${size}px`;
//       shape.style.height = `${size}px`;
//       shape.style.left = `${left}%`;
//       shape.style.animationDelay = `${delay}s`;
//       shape.style.animationDuration = `${duration}s`;
//       shape.style.opacity = Math.random() * 0.3 + 0.1;

//       if (Math.random() > 0.5) {
//         shape.style.borderRadius = '50%';
//       }

//       container.appendChild(shape);
//     }
//   }

//   const submit = async (e) => {
//     e.preventDefault();
//     setError(null);
//     setLoading(true);
//     try {
//       await api.post('/auth/register', form);
//       alert('Account created successfully! Please verify your email.');
//       router.push(`/verify-otp?email=${form.email}`)
//     } catch (err) {
//       console.error('REGISTER ERROR:', err.response?.data)
//       setError(err.response?.data?.message || 'Registration failed');
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className={styles.page}>
//       <div className={styles.authContainer}>
//         <div className={styles.leftPanel}>
//           <div className={styles.threeDContainer}>
//             <div className={styles.floatingElements}></div>
//             <svg className={styles.threeDModel} viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
//               <defs>
//                 <linearGradient id="buildingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
//                   <stop offset="0%" style={{stopColor: '#2563eb', stopOpacity: 0.2}} />
//                   <stop offset="100%" style={{stopColor: '#0d9488', stopOpacity: 0.2}} />
//                 </linearGradient>
//               </defs>
//               {/* 3D Building Structure */}
//               <g transform="translate(200, 200)">
//                 <rect x="-50" y="-100" width="100" height="200" fill="url(#buildingGrad)" stroke="#2563eb" strokeWidth="1" transform="rotate(15)"/>
//                 <rect x="-50" y="-100" width="100" height="200" fill="url(#buildingGrad)" stroke="#0d9488" strokeWidth="1" transform="rotate(-15)"/>
//                 <rect x="-50" y="-100" width="100" height="200" fill="none" stroke="rgba(37, 99, 235, 0.3)" strokeWidth="1"/>
//                 {/* Windows */}
//                 {Array.from({length: 5}).map((_, i) => (
//                   <React.Fragment key={i}>
//                     <rect x="-40" y={-80 + i * 30} width="15" height="20" fill="rgba(37, 99, 235, 0.3)"/>
//                     <rect x="25" y={-80 + i * 30} width="15" height="20" fill="rgba(37, 99, 235, 0.3)"/>
//                   </React.Fragment>
//                 ))}
//               </g>
//             </svg>
//           </div>

//           <div className={styles.logoContainer}>
//             <div className={styles.logoIcon}>
//               <Building2 size={40} />
//             </div>
//           </div>

//           <h2 className={styles.authTitle}>Join 3D Estimator Pro</h2>
//           <p className={styles.authDescription}>
//             Create your admin account to access advanced 3D estimation tools
//           </p>

//           <div className={styles.featureList}>
//             <div className={styles.featureItem}>
//               <Box size={16} />
//               <span>3D Model Integration</span>
//             </div>
//             <div className={styles.featureItem}>
//               <Layers size={16} />
//               <span>Multi-layer Estimation</span>
//             </div>
//             <div className={styles.featureItem}>
//               <ShieldCheck size={16} />
//               <span>Enterprise-grade Security</span>
//             </div>
//             <div className={styles.featureItem}>
//               <Zap size={16} />
//               <span>Seamless Integrations</span>
//             </div>
//           </div>
//         </div>

//         <div className={styles.rightPanel}>
//           <div className={styles.header}>
//             <h1>Create Admin Account</h1>
//             <p>Sign up for 3D Estimator Admin access</p>
//           </div>

//           <form onSubmit={submit} className={styles.form}>
//             {error && (
//               <div className={styles.errorAlert}>
//                 <UserPlus size={18} />
//                 {error}
//               </div>
//             )}

//             <div className={styles.row}>
//               <div className={styles.fieldGroup}>
//                 <label className={styles.inputLabel}>
//                   <User size={14} /> First Name
//                 </label>
//                 <input
//                   type="text"
//                   value={form.firstName}
//                   onChange={(e) => setForm({ ...form, firstName: e.target.value })}
//                   required
//                   placeholder="John"
//                 />
//               </div>

//               <div className={styles.fieldGroup}>
//                 <label className={styles.inputLabel}>
//                   <User size={14} /> Last Name
//                 </label>
//                 <input
//                   type="text"
//                   value={form.lastName}
//                   onChange={(e) => setForm({ ...form, lastName: e.target.value })}
//                   required
//                   placeholder="Doe"
//                 />
//               </div>
//             </div>

//             <div className={styles.fieldGroup}>
//               <label className={styles.inputLabel}>
//                 <Mail size={14} /> Email Address
//               </label>
//               <input
//                 type="email"
//                 value={form.email}
//                 onChange={(e) => setForm({ ...form, email: e.target.value })}
//                 required
//                 placeholder="admin@company.com"
//               />
//             </div>

//             <div className={styles.fieldGroup}>
//               <label className={styles.inputLabel}>
//                 <Lock size={14} /> Password
//               </label>
//               <input
//                 type="password"
//                 value={form.password}
//                 onChange={(e) => setForm({ ...form, password: e.target.value })}
//                 required
//                 minLength={6}
//                 placeholder="••••••••"
//               />
//             </div>

//             <div className={styles.fieldGroup}>
//               <label className={styles.inputLabel}>
//                 <Building2 size={14} /> Company Name
//               </label>
//               <input
//                 type="text"
//                 value={form.companyName}
//                 onChange={(e) => setForm({ ...form, companyName: e.target.value })}
//                 required
//                 placeholder="ABC Construction"
//               />
//             </div>

//             <div className={styles.fieldGroup}>
//               <label className={styles.inputLabel}>Role</label>
//               <select
//                 value={form.role}
//                 onChange={(e) => setForm({ ...form, role: e.target.value })}
//               >
//                 <option value="superadmin">Super Admin</option>
//                 <option value="admin">Admin</option>
//                 <option value="user">User</option>
//               </select>
//             </div>

//             <button className={styles.submitBtn} type="submit" disabled={loading}>
//               {loading ? (
//                 'Creating Account...'
//               ) : (
//                 <>
//                   <UserPlus size={18} /> Create Account
//                 </>
//               )}
//             </button>
//           </form>

//           <div className={styles.divider} />
//           <div className={styles.footerText}>
//             Already have an account?{' '}
//             <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
//               Sign in
//             </Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }




'use client';

import React, { useState, useEffect } from 'react';
import api from '@/src/lib/api';
import { UserPlus, Mail, Lock, Building2, User, CheckCircle2, ShieldCheck, Zap, Box, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '@/src/app/login/Login.module.scss';
import {validateEmail,validatePassword,validateName,validateRequired} from '@/src/lib/validation'; 

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    companyName: '',
    role: 'admin',
  })

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved)
    } else {
      document.documentElement.setAttribute('data-theme', 'dark')
    }

    createFloatingElements();
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

  //VALIDATION (ADDED ONLY)
  const validateForm = () => {
    const errors = {};

    errors.firstName = validateName(form.firstName, 'First Name');
    errors.lastName = validateName(form.lastName, 'Last Name');
    errors.email = validateEmail(form.email);
    errors.password = validatePassword(form.password);
    errors.companyName = validateRequired(form.companyName, 'Company Name');

    Object.keys(errors).forEach(key => {
      if (!errors[key]) delete errors[key];
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();

    //VALIDATION CHECK ADDED
    if (!validateForm()) return;

    setError(null);
    setLoading(true);

    try {
      await api.post('/auth/register', form);
      alert('Account created successfully! Please verify your email.');
      router.push(`/verify-otp?email=${form.email}`)
    } catch (err) {
      console.error('REGISTER ERROR:', err.response?.data)
      setError(err.response?.data?.message || 'Registration failed');
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

            <svg className={styles.threeDModel} viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="buildingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#2563eb', stopOpacity: 0.2}} />
                  <stop offset="100%" style={{stopColor: '#0d9488', stopOpacity: 0.2}} />
                </linearGradient>
              </defs>

              <g transform="translate(200, 200)">
                <rect x="-50" y="-100" width="100" height="200" fill="url(#buildingGrad)" stroke="#2563eb" strokeWidth="1" transform="rotate(15)"/>
                <rect x="-50" y="-100" width="100" height="200" fill="url(#buildingGrad)" stroke="#0d9488" strokeWidth="1" transform="rotate(-15)"/>
                <rect x="-50" y="-100" width="100" height="200" fill="none" stroke="rgba(37, 99, 235, 0.3)" strokeWidth="1"/>

                {Array.from({length: 5}).map((_, i) => (
                  <React.Fragment key={i}>
                    <rect x="-40" y={-80 + i * 30} width="15" height="20" fill="rgba(37, 99, 235, 0.3)"/>
                    <rect x="25" y={-80 + i * 30} width="15" height="20" fill="rgba(37, 99, 235, 0.3)"/>
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

          <h2 className={styles.authTitle}>Join 3D Estimator Pro</h2>
          <p className={styles.authDescription}>
            Create your admin account to access advanced 3D estimation tools
          </p>

          <div className={styles.featureList}>
            <div className={styles.featureItem}><Box size={16} /><span>3D Model Integration</span></div>
            <div className={styles.featureItem}><Layers size={16} /><span>Multi-layer Estimation</span></div>
            <div className={styles.featureItem}><ShieldCheck size={16} /><span>Enterprise-grade Security</span></div>
            <div className={styles.featureItem}><Zap size={16} /><span>Seamless Integrations</span></div>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.header}>
            <h1>Create Admin Account</h1>
            <p>Sign up for 3D Estimator Admin access</p>
          </div>

          <form onSubmit={submit} className={styles.form}>
            {error && (
              <div className={styles.errorAlert}>
                <UserPlus size={18} />
                {error}
              </div>
            )}

            <div className={styles.row}>
              <div className={styles.fieldGroup}>
                <label className={styles.inputLabel}><User size={14} /> First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="John"
                />
                {fieldErrors.firstName && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{fieldErrors.firstName}</span>}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.inputLabel}><User size={14} /> Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Doe"
                />
                {fieldErrors.lastName && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{fieldErrors.lastName}</span>}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.inputLabel}><Mail size={14} /> Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@company.com"
              />
              {fieldErrors.email && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{fieldErrors.email}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.inputLabel}><Lock size={14} /> Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
              {fieldErrors.password && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{fieldErrors.password}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.inputLabel}><Building2 size={14} /> Company Name</label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="ABC Construction"
              />
              {fieldErrors.companyName && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{fieldErrors.companyName}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.inputLabel}>Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="root">Root</option>
                <option value="superadmin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>

            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? (
                'Creating Account...'
              ) : (
                <>
                  <UserPlus size={18} /> Create Account
                </>
              )}
            </button>
          </form>

          <div className={styles.divider} />
          <div className={styles.footerText}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}