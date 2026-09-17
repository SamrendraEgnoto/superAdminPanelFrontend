'use client';

import React, { useEffect, useState } from 'react';
import { superAdminApi } from '@/src/lib/api';
import { useAuth } from '@/src/context/AuthContext';
import Modal from '@/src/components/Modal';
import { Plus, Search, RefreshCw, Edit2, Trash2, UserCog, ShieldCheck, ShieldOff, Zap, ShieldAlert } from 'lucide-react';
import styles from './Admins.module.scss';

export default function AdminsPage() {
  const { user } = useAuth();
  // Root Super Admin: can manage delegated SAs + full tenant Admins
  // Delegated SA: can only create data-viewer Admins (data sharing)
  const isRoot = user?.dbRole === 'root';
  const isDsa = user?.dbRole === 'delegated';

  const [tab, setTab] = useState('admins'); // 'admins' | 'superadmins'

  // ----- Admins (businesses) -----
  const [list, setList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    companyName: '',
    plan: 'Basic'
  })
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [targetAdmin, setTargetAdmin] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('Basic');

  // ----- Super Admins (delegated) -----
  const [saList, setSaList] = useState([]);
  const [saLoading, setSaLoading] = useState(false);
  const [showSaModal, setShowSaModal] = useState(false);
  const [saForm, setSaForm] = useState({ firstName: '', lastName: '', email: '', password: '', department: '' });

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', email: '', password: '', companyName: '', plan: 'Basic' })
  };
  const resetSaForm = () => {
    setSaForm({ firstName: '', lastName: '', email: '', password: '', department: '' })
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = search ? { companyName: search } : {}
      const r = await superAdminApi.getAdmins(params);
      setList(r.data);
      setFiltered(r.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSAs = async () => {
    setSaLoading(true);
    try {
      const r = await superAdminApi.getSuperAdmins();
      setSaList(r.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSaLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'admins') load();
    else loadSAs();
  }, [tab]);

  useEffect(() => {
    if (!search) {
      setFiltered(list)
    } else {
      const s = search.toLowerCase()
      setFiltered(
        list.filter(a =>
          a.email?.toLowerCase().includes(s) ||
          a.firstName?.toLowerCase().includes(s) ||
          a.lastName?.toLowerCase().includes(s) ||
          a.companyName?.toLowerCase().includes(s)
        )
      )
    }
  }, [search, list])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (editing) {
        const payload = { ...form }
        if (!payload.password) delete payload.password

        const res = await superAdminApi.updateAdmin(editing._id, payload);

        setList(prev =>
          prev.map(a =>
            a._id === editing._id ? { ...a, ...res.data } : a
          )
        )
      } else {
        // Root creates full tenant Admins (with plan selection)
        // DSA creates data-viewer Admins (no plan, no embed key)
        const payload = isDsa
          ? { firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password, companyName: form.companyName }
          : { ...form, plan: form.plan || 'Basic' };

        const res = await superAdminApi.createAdmin(payload);
        // Response shape: { success, data, adminType }
        const newAdmin = res.data?.data || res.data;
        setList(prev => [newAdmin, ...prev]);

        if (isDsa) {
          alert(`Data Viewer "${newAdmin.companyName || newAdmin.firstName}" created. You can now share leads with them from the Leads page.`);
        }
      }

      resetForm();
      setEditing(null);
      setShowModal(false);

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Operation failed');
    } finally {
      setBusy(false)
    }
  }

  const submitSa = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await superAdminApi.createSuperAdmin({ ...saForm });
      setSaList(prev => [res.data.data, ...prev]);
      resetSaForm();
      setShowSaModal(false);
      alert('Delegated Super Admin created. They can now log in, generate their own embed key, and manage data viewers.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create Super Admin');
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (id, current) => {
    try {
      await superAdminApi.toggleStatus(id, !current)

      setList(prev =>
        prev.map(a =>
          a._id === id ? { ...a, isActive: !current } : a
        )
      )

    } catch (err) {
      console.error(err)
    }
  }

  const deleteSa = async (id) => {
    if (!window.confirm('Delete this Super Admin? Their Admins remain but become unmanaged.')) return;
    try {
      await superAdminApi.deleteSuperAdmin(id);
      setSaList(prev => prev.filter(x => x._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const upgradePlan = (admin) => {
    setTargetAdmin(admin)
    setSelectedPlan(admin.plan || 'Basic')
    setShowPlanModal(true)
  }

  const confirmPlanUpdate = async () => {
    setBusy(true)
    try {
      await superAdminApi.updatePlan(targetAdmin._id, selectedPlan)

      const getLimit = (plan) => {
        if (plan === 'Basic') return 5
        if (plan === 'Pro') return 20
        if (plan === 'Enterprise') return 100
        return 5
      }

      setList(prev =>
        prev.map(a =>
          a._id === targetAdmin._id
            ? {
                ...a,
                plan: selectedPlan,
                userLimit: getLimit(selectedPlan)
              }
            : a
        )
      )

      setShowPlanModal(false)

    } catch (err) {
      alert(err.response?.data?.message || 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const tabBar = isRoot ? (
    <div style={{ display: 'flex', gap: '8px', margin: '0 0 18px' }}>
      {[
        { key: 'admins', label: 'Admins (Businesses)' },
        { key: 'superadmins', label: 'Super Admins' }
      ].map(t => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          style={{
            padding: '9px 18px',
            borderRadius: '9px',
            border: '1px solid var(--border, #2a2d3a)',
            background: tab === t.key ? 'var(--primary, #4f46e5)' : 'transparent',
            color: tab === t.key ? '#fff' : 'var(--text-primary, #e6e7ee)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>{isDsa ? 'Data Viewers' : 'Admin Management'}</h1>
          <p>
            {isDsa
              ? 'Create data viewers to share specific leads with them. They cannot embed the 3D Estimator — use your own embed key for that.'
              : 'Manage your customer admin accounts and their access.'}
          </p>
        </div>
        <div className={styles.headerActions}>
          {tab === 'admins' ? (
            <button className={styles.btnPrimary} onClick={() => { resetForm(); setEditing(null); setShowModal(true) }}>
              <Plus size={18} /> {isDsa ? 'Add Data Viewer' : 'Create Admin'}
            </button>
          ) : (
            <button className={styles.btnPrimary} onClick={() => { resetSaForm(); setShowSaModal(true) }}>
              <Plus size={18} /> Create Super Admin
            </button>
          )}
          <button className={styles.btnSecondary} onClick={tab === 'admins' ? load : loadSAs}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {tabBar}

      {tab === 'admins' && (
        <>
          <div className={styles.searchCard}>
            <Search size={20} />
            <input
              placeholder="Search admins by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Modal
            isOpen={showPlanModal}
            onClose={() => setShowPlanModal(false)}
            title="Update Admin Plan"
          >
            <div className={styles.planSelector}>
              {['Basic', 'Pro', 'Enterprise'].map(p => (
                <div
                  key={p}
                  className={`${styles.planOption} ${selectedPlan === p ? styles.selected : ''}`}
                  onClick={() => setSelectedPlan(p)}
                >
                  <span className={styles.planName}>{p}</span>
                  <span className={styles.planLimit}>
                    {p === 'Basic' ? '5 Users' : p === 'Pro' ? '20 Users' : '100 Users'}
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnPrimary} onClick={confirmPlanUpdate} disabled={busy} style={{ flex: 1 }}>
                {busy ? 'Updating...' : 'Confirm Upgrade'}
              </button>
              <button className={styles.btnSecondary} onClick={() => setShowPlanModal(false)}>Cancel</button>
            </div>
          </Modal>

          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title={editing ? 'Edit Admin Account' : 'New Admin Account'}
          >
            <form onSubmit={submit} className={styles.modalForm}>
              <div className="form-group">
                <label>First Name</label>
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required placeholder="Enter first name" />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Enter last name" />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="admin@example.com" />
              </div>
              <div className="form-group">
                <label>{editing ? 'New Password (Optional)' : 'Password'}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label>Company / Organisation Name</label>
                <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required placeholder="Enter company name" />
              </div>
              {/* Plan selector: only shown for Root-created full tenant Admins */}
              {!editing && !isDsa && (
                <div className="form-group">
                  <label>Initial Plan</label>
                  <div className={styles.planSelector}>
                    {['Basic', 'Pro', 'Enterprise'].map(p => (
                      <div
                        key={p}
                        className={`${styles.planOption} ${form.plan === p ? styles.selected : ''}`}
                        onClick={() => setForm({ ...form, plan: p })}
                      >
                        <span className={styles.planName}>{p}</span>
                        <span className={styles.planLimit}>
                          {p === 'Basic' ? '5 Users' : p === 'Pro' ? '20 Users' : '100 Users'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {isDsa && !editing && (
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 4 }}>
                  ℹ️ This will create a <strong>Data Viewer</strong> — they can only see leads you share with them. No embed key or plan needed.
                </p>
              )}
              <div className={styles.modalActions}>
                <button className={styles.btnPrimary} type="submit" disabled={busy} style={{ flex: 1 }}>
                  {busy ? 'Saving...' : editing ? 'Save Changes' : isDsa ? 'Create Data Viewer' : 'Create Account'}
                </button>
                <button className={styles.btnSecondary} type="button" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </Modal>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Details</th>
                  {!isDsa && <th>Plan &amp; Limits</th>}
                  {isDsa && <th>Type</th>}
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className={styles.emptyCell}>Loading accounts...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="4" className={styles.emptyCell}>
                    {isDsa ? 'No data viewers yet. Create one to share leads with them.' : 'No admins found matching your search.'}
                  </td></tr>
                ) : (
                  filtered.map(a => (
                    <tr key={a._id}>
                      <td>
                        <div className={styles.adminInfo}>
                          <div className={styles.avatar}><UserCog size={18} /></div>
                          <div className={styles.details}>
                            <div className={styles.name}>{a.firstName} {a.lastName}</div>
                            <div className={styles.email}>{a.email}</div>
                            {a.companyName && <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{a.companyName}</div>}
                          </div>
                        </div>
                      </td>
                      {!isDsa && (
                        <td>
                          <div className={styles.planInfo}>
                            <span className={`${styles.planBadge} ${styles[(a.plan || 'basic').toLowerCase()]}`}>
                              {a.plan || 'Basic'}
                            </span>
                            <div className={styles.userLimit}>
                              <span>{a.totalUsers || 0}</span> / {a.userLimit || 5} Users
                            </div>
                          </div>
                        </td>
                      )}
                      {isDsa && (
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: a.adminType === 'data-viewer' ? '#1e293b' : '#0f172a',
                            color: a.adminType === 'data-viewer' ? '#94a3b8' : '#38bdf8'
                          }}>
                            {a.adminType === 'data-viewer' ? 'Data Viewer' : 'Tenant'}
                          </span>
                        </td>
                      )}
                      <td>
                        <span className={a.isActive ? styles.statusActive : styles.statusInactive}>
                          {a.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button className={styles.iconBtn} title="Toggle Status" onClick={() => toggleStatus(a._id, a.isActive)}>
                            {a.isActive ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                          </button>
                          {/* Plan change only for Root-managed full tenant Admins */}
                          {!isDsa && a.adminType !== 'data-viewer' && (
                            <button className={styles.iconBtn} title="Change Plan" onClick={() => upgradePlan(a)}>
                              <Zap size={15} />
                            </button>
                          )}
                          <button className={styles.iconBtn} onClick={() => { setEditing(a); setForm({ firstName: a.firstName || '', lastName: a.lastName || '', email: a.email || '', password: '', companyName: a.companyName || '', plan: a.plan || 'Basic' }); setShowModal(true) }}>
                            <Edit2 size={15} />
                          </button>
                          <button className={`${styles.iconBtn} ${styles.danger}`} onClick={async () => { if (!window.confirm('Are you sure you want to delete this admin account?')) return; await superAdminApi.deleteAdmin(a._id); setList(prev => prev.filter(x => x._id !== a._id)) }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'superadmins' && isRoot && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Super Admin</th>
                <th>Department</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {saLoading ? (
                <tr><td colSpan="4" className={styles.emptyCell}>Loading super admins...</td></tr>
              ) : saList.length === 0 ? (
                <tr><td colSpan="4" className={styles.emptyCell}>No delegated Super Admins yet. Create one to let a partner manage their own businesses.</td></tr>
              ) : (
                saList.map(sa => (
                  <tr key={sa._id}>
                    <td>
                      <div className={styles.adminInfo}>
                        <div className={styles.avatar}><ShieldAlert size={18} /></div>
                        <div className={styles.details}>
                          <div className={styles.name}>{sa.firstName} {sa.lastName}</div>
                          <div className={styles.email}>{sa.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{sa.department || '—'}</td>
                    <td>{sa.createdAt ? new Date(sa.createdAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className={styles.actions}>
                        <button className={`${styles.iconBtn} ${styles.danger}`} title="Delete Super Admin" onClick={() => deleteSa(sa._id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showSaModal}
        onClose={() => setShowSaModal(false)}
        title="New Delegated Super Admin"
      >
        <form onSubmit={submitSa} className={styles.modalForm}>
          <div className="form-group">
            <label>First Name</label>
            <input value={saForm.firstName} onChange={(e) => setSaForm({ ...saForm, firstName: e.target.value })} required placeholder="Enter first name" />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input value={saForm.lastName} onChange={(e) => setSaForm({ ...saForm, lastName: e.target.value })} placeholder="Enter last name" />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={saForm.email} onChange={(e) => setSaForm({ ...saForm, email: e.target.value })} required placeholder="partner@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={saForm.password} onChange={(e) => setSaForm({ ...saForm, password: e.target.value })} required placeholder="••••••••" />
          </div>
          <div className="form-group">
            <label>Department</label>
            <input value={saForm.department} onChange={(e) => setSaForm({ ...saForm, department: e.target.value })} placeholder="e.g. Channel Partners" />
          </div>
          <div className={styles.modalActions}>
            <button className={styles.btnPrimary} type="submit" disabled={busy} style={{ flex: 1 }}>
              {busy ? 'Creating...' : 'Create Super Admin'}
            </button>
            <button className={styles.btnSecondary} type="button" onClick={() => setShowSaModal(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
