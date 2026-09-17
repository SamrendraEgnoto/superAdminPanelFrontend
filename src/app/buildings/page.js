'use client';

import React, { useEffect, useState } from 'react'
import api from '@/src/lib/api'
import Modal from '@/src/components/Modal'
import { useAuth } from '@/src/context/AuthContext'
import { Building2, Plus, Search, RefreshCw, Edit2, Trash2, Mail, Phone, User as UserIcon } from 'lucide-react';
import styles from './Buildings.module.scss'

export default function BuildingsPage() {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [filtered, setFiltered] = useState([])
  const [form, setForm] = useState({
    buildingType: '',
    status: 'new',
    userInfo: { firstName: '', lastName: '', email: '', phoneNumber: '' },
    attributes: {}
  })
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const endpoint = ['admin', 'superadmin'].includes(user?.role?.toLowerCase()) ? '/buildings' : '/users/buildings';
      const r = await api.get(endpoint)
      const data = r.data?.data || r.data || []
      setList(data)
      setFiltered(data)
    } catch (err) {
      console.error(err)
      setList([])
      setFiltered([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) load();
  }, [user])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(list.filter(i =>
      ((i.buildingType || '') + (i.userInfo?.email || '')).toLowerCase().includes(q)
    ))
  }, [search, list])

  const submit = async e => {
    e && e.preventDefault()
    setBusy(true)
    try {
      const payload = {
        buildingType: form.buildingType,
        status: form.status,
        userInfo: form.userInfo,
        attributes: form.attributes
      }
      if (editing) {
        await api.put('/users/buildings/' + editing._id, payload)
      } else {
        await api.post('/users/buildings', payload)
      }
      setForm({ buildingType: '', status: 'new', userInfo: { firstName: '', lastName: '', email: '', phoneNumber: '' }, attributes: {} })
      setEditing(null)
      setShowModal(false)
      load()
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put('/users/buildings/' + id, { status: newStatus })
      load()
    } catch (err) {
      console.error(err)
    }
  }

  const canCreate = ['admin', 'superadmin'].includes(user?.role?.toLowerCase()) || user?.canCreateLead;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Building Leads</h1>
          <p>Track and manage your 3D building estimations.</p>
        </div>
        <div className={styles.headerActions}>
          {canCreate && (
            <button className={styles.btnPrimary} onClick={() => { setShowModal(true); setEditing(null); setForm({ buildingType: '', status: 'new', userInfo: { firstName: '', lastName: '', email: '', phoneNumber: '' }, attributes: {} }) }}>
              <Plus size={18} /> New Lead
            </button>
          )}
          <button className={styles.btnSecondary} onClick={load}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className={styles.searchCard}>
        <Search size={20} />
        <input placeholder="Search leads by building type or email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Update Building Lead' : 'Create New Lead'}>
        <form onSubmit={submit} className={styles.modalForm}>
          <div className="form-group">
            <label>Building Type</label>
            <input value={form.buildingType} onChange={e => setForm({ ...form, buildingType: e.target.value })} required placeholder="e.g. Garage, Carport, Warehouse" />
          </div>
          <div className="form-group">
            <label>Lead Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="quoted">Quoted</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className={styles.formRow}>
            <div className="form-group">
              <label>Client First Name</label>
              <input value={form.userInfo.firstName} onChange={e => setForm({ ...form, userInfo: { ...form.userInfo, firstName: e.target.value } })} required placeholder="John" />
            </div>
            <div className="form-group">
              <label>Client Last Name</label>
              <input value={form.userInfo.lastName} onChange={e => setForm({ ...form, userInfo: { ...form.userInfo, lastName: e.target.value } })} placeholder="Doe" />
            </div>
          </div>
          <div className="form-group">
            <label>Client Email</label>
            <input value={form.userInfo.email} onChange={e => setForm({ ...form, userInfo: { ...form.userInfo, email: e.target.value } })} type="email" required placeholder="john@example.com" />
          </div>
          <div className="form-group">
            <label>Client Phone</label>
            <input value={form.userInfo.phoneNumber} onChange={e => setForm({ ...form, userInfo: { ...form.userInfo, phoneNumber: e.target.value } })} required placeholder="+1 (555) 000-0000" />
          </div>
          <div className={styles.formActions}>
            <button className={styles.btnPrimary} type="submit" disabled={busy} style={{ flex: 1 }}>
              {busy ? 'Processing...' : editing ? 'Update Lead' : 'Create Lead'}
            </button>
            <button className={styles.btnSecondary} type="button" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading leads...</p>
      ) : (
        <div className={styles.grid}>
          {filtered.length === 0 ? (
            <div className={styles.emptyState}>No leads found.</div>
          ) : filtered.map(b => (
            <div className={styles.card} key={b._id}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleArea}>
                  <div className={styles.iconWrapper}><Building2 size={22} /></div>
                  <div className={styles.titleAreaText}>
                    <h3>{b.buildingType}</h3>
                    <span className={`${styles.statusBadge} ${styles[b.status?.toLowerCase().replace(' ', '')] || styles.new}`}>{b.status}</span>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <button className={styles.iconBtn} onClick={() => { setEditing(b); setForm({ buildingType: b.buildingType || '', status: b.status || 'new', userInfo: { firstName: b.userInfo?.firstName || '', lastName: b.userInfo?.lastName || '', email: b.userInfo?.email || '', phoneNumber: b.userInfo?.phoneNumber || '' }, attributes: b.attributes || {} }); setShowModal(true) }}>
                    <Edit2 size={15} />
                  </button>
                  <button className={`${styles.iconBtn} ${styles.danger}`} onClick={async () => { if (!window.confirm('Are you sure you want to delete this lead?')) return; await api.delete('/users/buildings/' + b._id); load() }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className={styles.detailsBox}>
                <div className={styles.detailRow}><UserIcon size={15} /><span>{b.userInfo?.firstName} {b.userInfo?.lastName}</span></div>
                <div className={styles.detailRow}><Mail size={15} /><a href={`mailto:${b.userInfo?.email}`}>{b.userInfo?.email}</a></div>
                <div className={styles.detailRow}><Phone size={15} /><span>{b.userInfo?.phoneNumber}</span></div>
              </div>

              <div className={styles.quickActions}>
                <label>Quick Status Change</label>
                <div className={styles.statusBtns}>
                  {['new', 'contacted', 'quoted', 'closed'].map(s => (
                    <button key={s} onClick={() => updateStatus(b._id, s)} className={`${styles.statusBtn} ${b.status === s ? styles.active : ''}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
