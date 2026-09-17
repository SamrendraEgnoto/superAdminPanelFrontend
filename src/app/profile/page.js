'use client';

import React, { useState, useRef } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { uploadFile, BASE_URL } from '@/src/lib/api'
import toast from 'react-hot-toast'
import {
  User, Mail, Phone, Building, Camera, Save, Lock,
  Eye, EyeOff, Shield, Calendar, MapPin
} from 'lucide-react'
import styles from './Profiles.module.scss'

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const fileInputRef = useRef(null)

  const [profileForm, setProfileForm] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    department: profile?.department || '',
    avatar: profile?.avatar || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    website: profile?.website || ''
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB')
      return
    }
    try {
      setLoading(true)
      const uploadResult = await uploadFile(file, 'avatars')
      setProfileForm(prev => ({ ...prev, avatar: uploadResult.url }))
      toast.success('Avatar uploaded successfully!')
    } catch (error) {
      toast.error('Failed to upload avatar')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile(profileForm)
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const result = await updateProfile({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      if (result.success) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        toast.success('Password updated successfully!')
      } else {
        toast.error(result.message || 'Failed to update password')
      }
    } catch (err) {
      toast.error('An error occurred while updating password')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: <User size={18} /> },
    { id: 'security', label: 'Security Settings', icon: <Shield size={18} /> }
  ]

  const getAvatarUrl = () => {
    if (!profileForm.avatar) {
        return `https://ui-avatars.com/api/?name=${profileForm.firstName}+${profileForm.lastName}&background=2563eb&color=fff`;
    }
    if (profileForm.avatar.startsWith('http')) return profileForm.avatar;
    return `${BASE_URL.replace(/\/$/, '')}${profileForm.avatar}`;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>My Profile</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <div className={styles.card}>
            <div className={styles.avatarSection}>
              <img
                src={getAvatarUrl()}
                alt="Profile"
                className={styles.avatar}
              />
              <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()} disabled={loading} type="button">
                <Camera size={16} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
            </div>
            <div className={styles.profileInfo}>
              <h3>{profileForm.firstName} {profileForm.lastName}</h3>
              <p className={styles.role}>{user?.role || 'User'}</p>
              <div className={styles.metaList}>
                <div className={styles.metaItem}>
                  <Calendar size={14} />
                  <span>Joined {new Date(profile?.createdAt || Date.now()).getFullYear()}</span>
                </div>
                {profileForm.location && (
                  <div className={styles.metaItem}>
                    <MapPin size={14} />
                    <span>{profileForm.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <nav className={styles.nav}>
            {tabs.map(tab => (
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
        </div>

        <div className={styles.content}>
          {activeTab === 'profile' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Profile Information</h2>
                <p>Update your personal information and preferences</p>
              </div>

              <form onSubmit={handleProfileSubmit} className={styles.profileForm}>
                <div className={styles.formGrid}>
                  <div className="form-group">
                    <label>First Name</label>
                    <input type="text" value={profileForm.firstName} onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))} required placeholder="Enter first name" />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input type="text" value={profileForm.lastName} onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))} placeholder="Enter last name" />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" value={profileForm.email} onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))} required placeholder="user@example.com" />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <input type="text" value={profileForm.department} onChange={(e) => setProfileForm(prev => ({ ...prev, department: e.target.value }))} placeholder="e.g. Sales, Engineering" />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input type="text" value={profileForm.location} onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))} placeholder="City, Country" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea rows="4" value={profileForm.bio} onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))} placeholder="Tell us about yourself..." />
                </div>

                <button type="submit" className={styles.btn} disabled={loading}>
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Security Settings</h2>
                <p>Manage your password and security preferences</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className={styles.securityForm}>
                <div className="form-group">
                  <label>Current Password</label>
                  <div className={styles.passwordWrapper}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                      placeholder="••••••••"
                    />
                    <button type="button" className={styles.toggleBtn} onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))} required minLength="6" placeholder="••••••••" />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))} required minLength="6" placeholder="••••••••" />
                </div>
                <button type="submit" className={styles.btn} disabled={loading}>
                  <Save size={18} />
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
