'use client';

import React, { useEffect, useState } from 'react';
import api, { superAdminApi } from '@/src/lib/api';
import { useAuth } from '@/src/context/AuthContext';
import Modal from '@/src/components/Modal';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import { Plus, Search, RefreshCw, Edit2, Trash2, UserCog, ShieldCheck, ShieldOff, Zap, ShieldAlert, Code, Copy, Check, AlertCircle, Eye, EyeOff, UserCheck, Share2 } from 'lucide-react';
import styles from './Admins.module.scss';
import Pagination from '@/src/components/Pagination';
import toast from 'react-hot-toast';
import PhoneInput from '@/src/components/PhoneInput';
import { validatePhone } from '@/src/lib/validation';

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
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showSaPassword, setShowSaPassword] = useState(false);
  const [assignAdminModal, setAssignAdminModal] = useState(false);
  const [selectedAdminForAssign, setSelectedAdminForAssign] = useState(null);
  const [adminAvailableLeads, setAdminAvailableLeads] = useState([]);
  const [selectedLeadIdsForAdmin, setSelectedLeadIdsForAdmin] = useState([]);
  const [assignAdminLoading, setAssignAdminLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    companyName: '',
    phone: '',
    plan: 'Basic'
  });
  const [adminFormError, setAdminFormError] = useState('');
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
  const [saForm, setSaForm] = useState({ firstName: '', lastName: '', email: '', password: '', department: '', phone: '' });
  const [saFormError, setSaFormError] = useState('');

  // Pagination — 5 per page, client-side
  const pageSize = 5;
  const [page, setPage] = useState(1);
  const [saPage, setSaPage] = useState(1);



  const resetForm = () => {
    setForm({ firstName: '', lastName: '', email: '', password: '', companyName: '', phone: '', plan: 'Basic' });
    setAdminFormError('');
  };
  const resetSaForm = () => {
    setSaForm({ firstName: '', lastName: '', email: '', password: '', department: '', phone: '' });
    setSaFormError('');
  };

  const sortDesc = (arr) => [...arr].sort((a,b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
  const load = async () => {
    setLoading(true);
    try {
      const params = search ? { companyName: search } : {}
      const r = await superAdminApi.getAdmins(params);
      const sorted = sortDesc(r.data || []);
      setList(sorted);
      setFiltered(sorted);
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
      const data = r.data?.data || [];
      setSaList(sortDesc(data));
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

  // Reset to page 1 when filter or tab changes
  useEffect(() => { setPage(1); }, [filtered.length, search]);
  useEffect(() => { setSaPage(1); }, [saList.length]);
  useEffect(() => { setPage(1); setSaPage(1); }, [tab]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedAdmins = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalSaPages = Math.ceil(saList.length / pageSize) || 1;
  const paginatedSAs = saList.slice((saPage - 1) * pageSize, saPage * pageSize);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setAdminFormError('');
    if (form.phone) {
      const phoneErr = validatePhone(form.phone);
      if (phoneErr) {
        setAdminFormError(phoneErr);
        toast.error(phoneErr);
        setBusy(false);
        return;
      }
    }
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;

        const res = await superAdminApi.updateAdmin(editing._id, payload);

        setList(prev =>
          prev.map(a =>
            a._id === editing._id ? { ...a, ...res.data } : a
          )
        );
        toast.success('Admin updated successfully');
      } else {
        // Root creates full tenant Admins (with plan selection)
        // DSA creates data-viewer Admins (no plan, no embed key)
        const payload = isDsa
          ? { firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password, companyName: form.companyName, phone: form.phone }
          : { ...form, plan: form.plan || 'Basic' };

        const res = await superAdminApi.createAdmin(payload);
        const newAdmin = res.data?.data || res.data;
        setList(prev => [newAdmin, ...prev]);

        if (isDsa) {
          toast.success(`Data Viewer "${newAdmin.companyName || newAdmin.firstName}" created successfully`);
        } else {
          toast.success('Admin created successfully');
        }
      }

      resetForm();
      setEditing(null);
      setShowModal(false);

    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Operation failed';
      setAdminFormError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setBusy(false);
    }
  };

  const submitSa = async (e) => {
    e.preventDefault();
    setBusy(true);
    setSaFormError('');
    if (saForm.phone) {
      const phoneErr = validatePhone(saForm.phone);
      if (phoneErr) {
        setSaFormError(phoneErr);
        toast.error(phoneErr);
        setBusy(false);
        return;
      }
    }
    try {
      const res = await superAdminApi.createSuperAdmin({ ...saForm });
      setSaList(prev => [res.data.data, ...prev]);
      resetSaForm();
      setShowSaModal(false);
      toast.success('Delegated Super Admin created successfully');
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to create Super Admin';
      setSaFormError(errorMsg);
      toast.error(errorMsg);
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

  const openAssignLeadsModal = async (admin) => {
    setSelectedAdminForAssign(admin);
    setAssignAdminModal(true);
    setAssignAdminLoading(true);
    try {
      const res = await api.get('/buildings');
      const leads = res.data?.data || res.data || [];
      const list = Array.isArray(leads) ? leads : [];
      setAdminAvailableLeads(list);
      // Pre-select leads already shared with this admin
      const preSelected = list
        .filter(l => l.sharedWith?.some(s => (s.adminId?._id || s.adminId)?.toString() === admin._id?.toString()))
        .map(l => l._id);
      setSelectedLeadIdsForAdmin(preSelected);
    } catch (err) {
      console.error('Failed to load leads for admin assignment', err);
      toast.error('Failed to load leads');
    } finally {
      setAssignAdminLoading(false);
    }
  };

  const handleSaveAdminLeads = async () => {
    if (!selectedAdminForAssign) return;
    setBusy(true);
    try {
      await api.post('/superadmin/leads/share', {
        leadIds: selectedLeadIdsForAdmin,
        adminId: selectedAdminForAssign._id,
        note: 'Assigned via Admin Management'
      });
      toast.success(`Leads successfully assigned to ${selectedAdminForAssign.companyName || selectedAdminForAssign.firstName}`);
      setAssignAdminModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign leads');
    } finally {
      setBusy(false);
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
            onClose={() => { setShowModal(false); setAdminFormError(''); }}
            title={editing ? 'Edit Admin Account' : 'New Admin Account'}
          >
            <form onSubmit={submit} className={styles.modalForm}>
              {adminFormError && (
                <div className={styles.errorAlert}>
                  <AlertCircle size={18} />
                  <span>{adminFormError}</span>
                </div>
              )}
              <div className="form-group">
                <label>First Name <span className="requiredStar">*</span></label>
                <input value={form.firstName} onChange={(e) => { setAdminFormError(''); setForm({ ...form, firstName: e.target.value }); }} required placeholder="Enter first name" />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input value={form.lastName} onChange={(e) => { setAdminFormError(''); setForm({ ...form, lastName: e.target.value }); }} placeholder="Enter last name" />
              </div>
              <div className="form-group">
                <label>Email Address <span className="requiredStar">*</span></label>
                <input type="email" value={form.email} onChange={(e) => { setAdminFormError(''); setForm({ ...form, email: e.target.value }); }} required placeholder="admin@example.com" />
              </div>
              <div className="form-group">
                <label>{editing ? 'New Password (Optional)' : 'Password'} {!editing && <span className="requiredStar">*</span>}</label>
                <div className="passwordInputWrapper">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!editing}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="passwordToggleBtn"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Company / Organisation Name <span className="requiredStar">*</span></label>
                <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required placeholder="Enter company name" />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <PhoneInput
                  value={form.phone}
                  onChange={(e) => { setAdminFormError(''); setForm({ ...form, phone: e.target.value }); }}
                  placeholder="7 to 15 digits"
                />
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
                  paginatedAdmins.map(a => (
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

                          {isDsa && (
                            <button
                              className={styles.iconBtn}
                              title="Assign Leads to Admin"
                              onClick={() => openAssignLeadsModal(a)}
                              style={{
                                padding: '4px 8px',
                                background: 'rgba(56, 189, 248, 0.12)',
                                color: '#38bdf8',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              <UserCheck size={14} /> Assign Leads
                            </button>
                          )}

                          <button className={styles.iconBtn} onClick={() => { setEditing(a); setForm({ firstName: a.firstName || '', lastName: a.lastName || '', email: a.email || '', password: '', companyName: a.companyName || '', phone: a.phone || '', plan: a.plan || 'Basic' }); setShowModal(true) }}>
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
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={pageSize} />
        </>
      )}

      {tab === 'superadmins' && isRoot && (
        <>
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
                  paginatedSAs.map(sa => (
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
          <Pagination currentPage={saPage} totalPages={totalSaPages} onPageChange={setSaPage} totalItems={saList.length} pageSize={pageSize} />
        </>
      )}

      <Modal
        isOpen={showSaModal}
        onClose={() => { setShowSaModal(false); setSaFormError(''); }}
        title="New Delegated Super Admin"
      >
        <form onSubmit={submitSa} className={styles.modalForm}>
          {saFormError && (
            <div className={styles.errorAlert}>
              <AlertCircle size={18} />
              <span>{saFormError}</span>
            </div>
          )}
          <div className="form-group">
            <label>First Name <span className="requiredStar">*</span></label>
            <input value={saForm.firstName} onChange={(e) => { setSaFormError(''); setSaForm({ ...saForm, firstName: e.target.value }); }} required placeholder="Enter first name" />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input value={saForm.lastName} onChange={(e) => { setSaFormError(''); setSaForm({ ...saForm, lastName: e.target.value }); }} placeholder="Enter last name" />
          </div>
          <div className="form-group">
            <label>Email Address <span className="requiredStar">*</span></label>
            <input type="email" value={saForm.email} onChange={(e) => { setSaFormError(''); setSaForm({ ...saForm, email: e.target.value }); }} required placeholder="partner@example.com" />
          </div>
          <div className="form-group">
            <label>Password <span className="requiredStar">*</span></label>
            <div className="passwordInputWrapper">
              <input
                type={showSaPassword ? 'text' : 'password'}
                value={saForm.password}
                onChange={(e) => { setSaFormError(''); setSaForm({ ...saForm, password: e.target.value }); }}
                required
                placeholder="••••••••"
              />
              <button
                type="button"
                className="passwordToggleBtn"
                onClick={() => setShowSaPassword(!showSaPassword)}
                aria-label={showSaPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showSaPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Department</label>
            <input value={saForm.department} onChange={(e) => { setSaFormError(''); setSaForm({ ...saForm, department: e.target.value }); }} placeholder="e.g. Channel Partners" />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <PhoneInput
              value={saForm.phone}
              onChange={(e) => { setSaFormError(''); setSaForm({ ...saForm, phone: e.target.value }); }}
              placeholder="7 to 15 digits"
            />
          </div>
          <div className={styles.modalActions}>
            <button className={styles.btnPrimary} type="submit" disabled={busy} style={{ flex: 1 }}>
              {busy ? 'Creating...' : 'Create Super Admin'}
            </button>
            <button className={styles.btnSecondary} type="button" onClick={() => setShowSaModal(false)}>Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Assign / Share Leads to Admin Modal (DSA) */}
      <Modal
        isOpen={assignAdminModal}
        onClose={() => setAssignAdminModal(false)}
        title={`Assign Leads to ${selectedAdminForAssign?.companyName || selectedAdminForAssign?.firstName || 'Admin'}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Select leads to share/assign with this Data Viewer admin. The admin and their team will have access to manage these leads.
          </p>

          {assignAdminLoading ? (
            <LoadingSpinner />
          ) : adminAvailableLeads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No leads available to assign.
            </div>
          ) : (
            <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {adminAvailableLeads.map(l => {
                const isChecked = selectedLeadIdsForAdmin.includes(l._id);
                return (
                  <label
                    key={l._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: isChecked ? 'rgba(37,99,235,0.1)' : 'var(--input-bg)',
                      border: isChecked ? '1px solid var(--primary)' : '1px solid var(--border)',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLeadIdsForAdmin([...selectedLeadIdsForAdmin, l._id]);
                        } else {
                          setSelectedLeadIdsForAdmin(selectedLeadIdsForAdmin.filter(id => id !== l._id));
                        }
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {(l.firstName || l.userInfo?.firstName || 'Lead')} {(l.lastName || l.userInfo?.lastName || '')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {l.email || l.userInfo?.email || '—'} · {l.buildingType || 'Standard'} · Status: {l.status || 'new'}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <div className={styles.modalActions}>
            <button
              className={styles.btnPrimary}
              disabled={busy || selectedLeadIdsForAdmin.length === 0}
              onClick={handleSaveAdminLeads}
              style={{ flex: 1 }}
            >
              {busy ? 'Assigning...' : `Assign ${selectedLeadIdsForAdmin.length} Lead(s)`}
            </button>
            <button
              className={styles.btnSecondary}
              onClick={() => setAssignAdminModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
