'use client';

import React, { useEffect, useState } from 'react';
import api from '@/src/lib/api';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import Modal from '@/src/components/Modal';
import { RefreshCw, Trash2, Plus, Share2 } from 'lucide-react';
import styles from './Leads.module.scss';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';

const statusOptions = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
const initialUserForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  department: '',
  phone: '',
  canCreateSubUsers: true,
  canCreateLead: false
};


export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    buildingType: '',
    status: 'new',
    userInfo: { firstName: '', lastName: '', email: '', phoneNumber: '' }
  });
  const [userForm, setUserForm] = useState(initialUserForm);
  const [teamUsers, setTeamUsers] = useState([]);

  const { user } = useAuth();
  const router = useRouter();

  const isPrivileged = ['admin', 'superadmin'].includes(user?.role?.toLowerCase()) && !user?.isRoot && user?.role !== 'root';
  const isDsa = (user?.role === 'superadmin' || user?.role === 'delegated') && user?.dbRole === 'delegated';

  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedLeadForShare, setSelectedLeadForShare] = useState(null);
  const [dataViewers, setDataViewers] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [shareNote, setShareNote] = useState('');

  const openShareModal = async (lead) => {
    setSelectedLeadForShare(lead);
    setSelectedAdminId('');
    setShareNote('');
    setShowShareModal(true);
    try {
      const res = await api.get('/superadmin/admins');
      const list = res.data?.data || res.data || [];
      const viewers = Array.isArray(list) ? list.filter(a => a.adminType === 'data-viewer' || !a.adminType) : [];
      setDataViewers(viewers);
      if (viewers.length > 0) setSelectedAdminId(viewers[0]._id);
    } catch (e) {
      console.error('Failed to load data viewers:', e);
    }
  };

  const handleShareLead = async (e) => {
    e.preventDefault();
    if (!selectedAdminId || !selectedLeadForShare) return;
    setBusy(true);
    try {
      await api.post('/superadmin/leads/share', {
        leadIds: [selectedLeadForShare._id],
        adminId: selectedAdminId,
        note: shareNote
      });
      alert('Lead successfully shared with Data Viewer!');
      setShowShareModal(false);
      loadLeads();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to share lead');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'root' || user.isRoot)) {
      router.replace('/admins');
    }
  }, [user, router]);

  const getPermissions = (lead) => {
    if (isPrivileged) return ['read', 'edit', 'delete'];
    if (!user?._id) return [];
    const assigned = lead.assignedUsers?.find((u) => {
      const userId =
        typeof u.user === 'object'
          ? u.user?._id
          : u.user;
      return userId === user._id;
    });
    return assigned?.permissions || [];
  };

  const loadLeads = async (showLoader = false) => {
    if (showLoader) setLoading(true);

    try {
      // admin/superadmin use /buildings (full CRUD scope)
      // regular users use /users/buildings (owner/assigned scope)
      const endpoint = isPrivileged ? '/buildings' : '/users/buildings';
      const res = await api.get(endpoint);

      let data = res.data?.data || res.data || [];
      // Normalise: some responses are paginated { data: [...] }, some are arrays
      if (!Array.isArray(data)) data = [];
      setLeads(data);
      setFiltered(data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadLeads();
  }, [user])

  useEffect(() => {
    if (!statusFilter) setFiltered(leads)
    else setFiltered(leads.filter(l => l.status === statusFilter))
  }, [statusFilter, leads])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;

    const prev = leads;

    // optimistic
    setLeads(prev => prev.filter(l => l._id !== id));

    try {
      await api.delete(`/buildings/${id}`);
    } catch (err) {
      console.error(err);
      setLeads(prev); // rollback
      alert(err?.response?.data?.message || 'Delete failed');
    }
  };

  const updateStatus = async (id, status) => {
    const prev = leads;

    setLeads(prev =>
      prev.map(l => l._id === id ? { ...l, status } : l)
    );

    try {
      await api.patch(`/buildings/${id}/status`, { status });
    }
    catch (err) {
      console.error(err);
      setLeads(prev); 
      alert(err?.response?.data?.message || 'Status update failed');
    }
  }
  
  const handleCreateLead = async (e) => {
    e.preventDefault();
    setBusy(true);

    try {
      // admin + superadmin create via /buildings (scoped by JWT identity in the backend)
      // regular users create via /users/buildings
      const createEndpoint = isPrivileged ? '/buildings' : '/users/buildings';
      const res = await api.post(createEndpoint, form);
      const newLead = res.data?.data || res.data;

      setLeads(prev => [newLead, ...prev]);

      setShowModal(false);
      setForm({
        buildingType: '',
        status: 'new',
        userInfo: { firstName: '', lastName: '', email: '', phoneNumber: '' }
      });

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Lead creation failed');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const endpoint = user?.role === 'superadmin'
        ? '/superadmin/users'
        : user?.role === 'admin'
        ? '/admin/users'
        : '/users/team';
      await api.post(endpoint, userForm);
      setShowUserModal(false);
      setUserForm(initialUserForm);
      alert('User created successfully');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'User creation failed');
    } finally {
      setBusy(false);
    }
  };

  // const canCreate = isPrivileged || user?.canCreateLead;
  const canCreateLeadOrUser = isPrivileged || user?.canCreateLead || user?.canCreateSubUsers;

  return (
    <div className={styles.page}>
        <div className={styles.header}>
        <div>
          <h1>Leads Management</h1>
          <p>Manage your leads and track their progress</p>
        </div>
        <div className={styles.headerActions}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={styles.filterSelect}>
            <option value="">All Status</option>
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {canCreateLeadOrUser && (
            <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>
              <Plus size={18} /> New Lead
            </button>
          )}
          {/* {user?.canCreateSubUsers && (
            <button className={styles.btnPrimary} onClick={() => openAddUserModal()}>
              <Plus size={18} /> Add User
            </button>
          )} */}
           {user?.canCreateSubUsers && (
            <button className={styles.btnPrimary} onClick={() => setShowUserModal(true)}>
              <Plus size={18} /> Add User
            </button>
          )}
          <button className={styles.btnSecondary} onClick={() => loadLeads(true)}>
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </div>
      
      {/* Lead Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Lead">
        <form onSubmit={handleCreateLead} className={styles.modalForm}>
          <div className="form-group">
            <label>Building Type</label>
            <input
              value={form.buildingType}
              onChange={e => setForm({ ...form, buildingType: e.target.value })}
              required
              placeholder="e.g. Garage, Carport, Warehouse"
            />
          </div>
          <div className={styles.formRow}>
            <div className="form-group">
              <label>Client First Name</label>
              <input
                value={form.userInfo.firstName}
                onChange={e => setForm({ ...form, userInfo: { ...form.userInfo, firstName: e.target.value } })}
                required
                placeholder="John"
              />
            </div>
            <div className="form-group">
              <label>Client Last Name</label>
              <input
                value={form.userInfo.lastName}
                onChange={e => setForm({ ...form, userInfo: { ...form.userInfo, lastName: e.target.value } })}
                required
                placeholder="Doe"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Client Email</label>
            <input
              value={form.userInfo.email}
              onChange={e => setForm({ ...form, userInfo: { ...form.userInfo, email: e.target.value } })}
              type="email"
              required
              placeholder="john@example.com"
            />
          </div>
          <div className="form-group">
            <label>Client Phone</label>
            <input
              value={form.userInfo.phoneNumber}
              onChange={e => setForm({ ...form, userInfo: { ...form.userInfo, phoneNumber: e.target.value } })}
              required
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div className={styles.modalActions}>
            <button className={styles.btnPrimary} type="submit" disabled={busy} style={{ flex: 1 }}>
              {busy ? 'Processing...' : 'Create Lead'}
            </button>
            <button className={styles.btnSecondary} type="button" onClick={() => setShowModal(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* User Modal */}
      <Modal isOpen={showUserModal} onClose={() => setShowUserModal(false)} title="Add New User">
        <form onSubmit={handleCreateUser} className={styles.modalForm}>
          <input placeholder="First Name" value={userForm.firstName} onChange={e => setUserForm({ ...userForm, firstName: e.target.value })} required />
          <input placeholder="Last Name" value={userForm.lastName} onChange={e => setUserForm({ ...userForm, lastName: e.target.value })} />
          <input type="email" placeholder="Email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required />
          <input type="password" placeholder="Password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required />
          <input placeholder="Department" value={userForm.department} onChange={e => setUserForm({ ...userForm, department: e.target.value })} />
          <input placeholder="Phone" value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} />
          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={userForm.canCreateSubUsers} onChange={e => setUserForm({ ...userForm, canCreateSubUsers: e.target.checked })} /> Can Create Sub-Users
            </label>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={userForm.canCreateLead} onChange={e => setUserForm({ ...userForm, canCreateLead: e.target.checked })} /> Can Create Leads
            </label>
          </div>
          <div className={styles.modalActions}>
            <button type="submit" className={styles.btnPrimary} disabled={busy} style={{ flex: 1 }}>
              {busy ? 'Processing...' : 'Create User'}
            </button>
            <button type="button" className={styles.btnSecondary} onClick={() => setShowUserModal(false)}>Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Share Lead Modal (DSA) */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share Lead with Data Viewer">
        <form onSubmit={handleShareLead} className={styles.modalForm}>
          <div className="form-group">
            <label>Select Data Viewer Admin</label>
            {dataViewers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No Data Viewer admins found. Create one from the Admins page first.
              </p>
            ) : (
              <select
                value={selectedAdminId}
                onChange={e => setSelectedAdminId(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                required
              >
                {dataViewers.map(dv => (
                  <option key={dv._id} value={dv._id}>
                    {dv.companyName ? `${dv.companyName} (${dv.email})` : `${dv.firstName} ${dv.lastName || ''} (${dv.email})`}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="form-group">
            <label>Note (Optional)</label>
            <input
              placeholder="e.g. Please follow up on this commercial quote"
              value={shareNote}
              onChange={e => setShareNote(e.target.value)}
            />
          </div>
          <div className={styles.modalActions}>
            <button type="submit" className={styles.btnPrimary} disabled={busy || dataViewers.length === 0} style={{ flex: 1 }}>
              {busy ? 'Sharing...' : 'Share Lead'}
            </button>
            <button type="button" className={styles.btnSecondary} onClick={() => setShowShareModal(false)}>Cancel</button>
          </div>
        </form>
      </Modal>

      {loading ? <LoadingSpinner /> : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Building Type</th>
                <th>Status</th>
                <th>Source</th>
                <th>Priority</th>
                <th>Est. Value</th>
                <th>Actual Value</th>
                <th>Assigned</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="11" className={styles.empty}>No leads found</td></tr>
              ) : filtered.map(lead => {
                const perms = getPermissions(lead);

                return (
                  <tr
                    key={lead._id}
                    onClick={() => {
                      if (perms.includes('read')) {
                        router.push(`/leads/${lead._id}`);
                      }
                    }}
                    className={styles.clickableRow}
                  >
                    <td className={styles.nameCell}>
                      {(lead.firstName || lead.userInfo?.firstName || 'Lead')} {(lead.lastName || lead.userInfo?.lastName || '')}
                    </td>
                    <td>{lead.email || lead.userInfo?.email || '—'}</td>
                    <td>{lead.phone || lead.userInfo?.phoneNumber || lead.userInfo?.phone || '—'}</td>
                    <td>
                      <span className={styles.buildingBadge}>
                        {lead.buildingType || 'Standard'}
                      </span>
                    </td>

                    <td>
                      <select
                        value={lead.status}
                        onClick={e => e.stopPropagation()}
                        onChange={e => updateStatus(lead._id, e.target.value)}
                        className={styles.statusSelect}
                        disabled={!perms.includes('edit')}
                      >
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>

                    <td>
                      <span className={`${styles.sourceBadge} ${styles[lead.source || 'manual']}`}>
                        {lead.source || 'manual'}
                      </span>
                    </td>

                    <td>{lead.priority || '—'}</td>
                    <td>{lead.estimatedValue != null ? `$${lead.estimatedValue}` : '—'}</td>
                    <td>{lead.actualValue != null ? `$${lead.actualValue}` : '—'}</td>
                    <td>{lead.assignedUsers?.length || 0}</td>
                    <td>
                      <div className={styles.actionButtons} onClick={e => e.stopPropagation()}>
                        {isDsa && (
                          <button
                            className={styles.shareBtn}
                            title="Share with Data Viewer"
                            onClick={() => openShareModal(lead)}
                          >
                            <Share2 size={15} />
                          </button>
                        )}
                        {perms.includes('delete') && (
                          <button
                            className={styles.deleteBtn}
                            title="Delete lead"
                            onClick={async () => {
                              await handleDelete(lead._id);
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
