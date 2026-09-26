'use client';

import React, { useEffect, useState } from 'react';
import api from '@/src/lib/api';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import Modal from '@/src/components/Modal';
import { RefreshCw, Trash2, Plus, Share2, Eye, EyeOff, Search, Download } from 'lucide-react';
import styles from './Leads.module.scss';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { validatePhone, sanitizePhone } from '@/src/lib/validation';
import toast from 'react-hot-toast';
import Pagination from '@/src/components/Pagination';
import PhoneInput from '@/src/components/PhoneInput';
import { exportToCsv } from '@/src/lib/exportCsv';
import SearchableSelect from '@/src/components/SearchableSelect';

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
  const pageSize = 5;
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);
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
      data = [...data].sort((a,b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
      setLeads(data);
      setFiltered(data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [search, setSearch] = useState('');

  const handleExportCsv = () => {
    const headers = [
      { label: 'Client Name', accessor: (l) => `${l.firstName || l.userInfo?.firstName || ''} ${l.lastName || l.userInfo?.lastName || ''}`.trim() || 'Lead' },
      { label: 'Email', accessor: (l) => l.email || l.userInfo?.email || '' },
      { label: 'Phone', accessor: (l) => l.phone || l.userInfo?.phoneNumber || l.userInfo?.phone || '' },
      { label: 'Building Type', key: 'buildingType' },
      { label: 'Status', key: 'status' },
      { label: 'Source', key: 'source' },
      { label: 'Priority', key: 'priority' },
      { label: 'Estimated Value', key: 'estimatedValue' },
      { label: 'Actual Value', key: 'actualValue' },
      { label: 'Created At', accessor: (l) => l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '' }
    ];
    exportToCsv('Leads', headers, filtered);
  };

  useEffect(() => {
    if (user) loadLeads();
  }, [user]);

  useEffect(() => {
    let result = leads;
    if (statusFilter) {
      result = result.filter(l => l.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l => {
        const name = `${l.firstName || l.userInfo?.firstName || ''} ${l.lastName || l.userInfo?.lastName || ''}`.toLowerCase();
        const email = String(l.email || l.userInfo?.email || '').toLowerCase();
        const phone = String(l.phone || l.userInfo?.phoneNumber || l.userInfo?.phone || '').toLowerCase();
        const bType = String(l.buildingType || '').toLowerCase();
        const source = String(l.source || '').toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q) || bType.includes(q) || source.includes(q);
      });
    }
    setFiltered(result);
  }, [statusFilter, search, leads]);

  useEffect(() => { setPage(1); }, [filtered.length, statusFilter, search]);
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedLeads = filtered.slice((page - 1) * pageSize, page * pageSize);

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

  const loadAssignableUsers = async () => {
    try {
      const endpoint = user?.role === 'superadmin' ? '/superadmin/users' : '/users';
      const res = await api.get(endpoint);
      const data = res.data?.data || res.data || [];
      setTeamUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load users for assignee dropdown', e);
    }
  };

  useEffect(() => {
    if (user && isPrivileged) loadAssignableUsers();
  }, [user]);

  const updateAssignee = async (leadId, newUserId) => {
    const prev = leads;
    const newAssigneeUser = teamUsers.find(u => u._id === newUserId);
    // optimistic update — show name immediately
    setLeads(prev => prev.map(l => {
      if (l._id !== leadId) return l;
      if (!newUserId) return { ...l, assignedUsers: [] };
      const assigned = newAssigneeUser ? { user: newAssigneeUser, permissions: ['read','edit','delete'] } : { user: newUserId, permissions: ['read','edit','delete'] };
      return { ...l, assignedUsers: [assigned] };
    }));
    try {
      const usersPayload = newUserId ? [{ userId: newUserId, permissions: ['read','edit','delete'] }] : [];
      await api.post(`/buildings/${leadId}/assign`, { users: usersPayload });
      toast.success(newUserId ? 'Assignee updated' : 'Lead unassigned');
    } catch (err) {
      console.error(err);
      setLeads(prev);
      toast.error(err.response?.data?.message || 'Assignee update failed');
    }
  };
  
  const handleCreateLead = async (e) => {
    e.preventDefault();
    const phoneErr = validatePhone(form.userInfo.phoneNumber);
    if (phoneErr) { toast.error(phoneErr); return; }
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
    if (userForm.phone) {
      const phoneErr = validatePhone(userForm.phone);
      if (phoneErr) { toast.error(phoneErr); return; }
    }
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
          <div style={{ minWidth: '150px' }}>
            <SearchableSelect
              value={statusFilter}
              onChange={val => setStatusFilter(val)}
              placeholder="All Status"
              options={[
                { value: '', label: 'All Status' },
                ...statusOptions.map(s => ({ value: s, label: s.toUpperCase() }))
              ]}
            />
          </div>
          <button className={styles.btnSecondary} onClick={handleExportCsv} title="Export Leads to CSV">
            <Download size={18} /> Export CSV
          </button>
          {canCreateLeadOrUser && (
            <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>
              <Plus size={18} /> New Lead
            </button>
          )}
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

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', margin: '16px 0', padding: '10px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px' }}>
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input
          placeholder="Search leads by client name, email, phone, building type, or source..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.88rem' }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>Clear</button>
        )}
      </div>
      
      {/* Lead Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Lead">
        <form onSubmit={handleCreateLead} className={styles.modalForm}>
          <div className="form-group">
            <label>Building Type <span className="requiredStar">*</span></label>
            <input
              value={form.buildingType}
              onChange={e => setForm({ ...form, buildingType: e.target.value })}
              required
              placeholder="e.g. Garage, Carport, Warehouse"
            />
          </div>
          <div className={styles.formRow}>
            <div className="form-group">
              <label>Client First Name <span className="requiredStar">*</span></label>
              <input
                value={form.userInfo.firstName}
                onChange={e => setForm({ ...form, userInfo: { ...form.userInfo, firstName: e.target.value } })}
                required
                placeholder="John"
              />
            </div>
            <div className="form-group">
              <label>Client Last Name <span className="requiredStar">*</span></label>
              <input
                value={form.userInfo.lastName}
                onChange={e => setForm({ ...form, userInfo: { ...form.userInfo, lastName: e.target.value } })}
                required
                placeholder="Doe"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Client Email <span className="requiredStar">*</span></label>
            <input
              value={form.userInfo.email}
              onChange={e => setForm({ ...form, userInfo: { ...form.userInfo, email: e.target.value } })}
              type="email"
              required
              placeholder="john@example.com"
            />
          </div>
          <div className="form-group">
            <label>Client Phone <span className="requiredStar">*</span></label>
            <PhoneInput
              value={form.userInfo.phoneNumber}
              onChange={e => setForm({ ...form, userInfo: { ...form.userInfo, phoneNumber: e.target.value } })}
              required
              placeholder="7 to 15 digits"
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
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              First Name <span className="requiredStar">*</span>
            </label>
            <input placeholder="First Name" value={userForm.firstName} onChange={e => setUserForm({ ...userForm, firstName: e.target.value })} required />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Last Name
            </label>
            <input placeholder="Last Name" value={userForm.lastName} onChange={e => setUserForm({ ...userForm, lastName: e.target.value })} />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Email <span className="requiredStar">*</span>
            </label>
            <input type="email" placeholder="Email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Password <span className="requiredStar">*</span>
            </label>
            <div className="passwordInputWrapper">
              <input
                type={showUserPassword ? 'text' : 'password'}
                placeholder="Password"
                value={userForm.password}
                onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="passwordToggleBtn"
                onClick={() => setShowUserPassword(!showUserPassword)}
                aria-label={showUserPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showUserPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Department
            </label>
            <input placeholder="Department" value={userForm.department} onChange={e => setUserForm({ ...userForm, department: e.target.value })} />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Phone Number
            </label>
            <PhoneInput
              value={userForm.phone}
              onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
              placeholder="7 to 15 digits"
            />
          </div>
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
              <SearchableSelect
                value={selectedAdminId}
                onChange={val => setSelectedAdminId(val)}
                placeholder="Search and select Data Viewer..."
                options={dataViewers.map(dv => ({
                  value: dv._id,
                  label: dv.companyName ? `${dv.companyName} (${dv.email})` : `${dv.firstName} ${dv.lastName || ''} (${dv.email})`.trim()
                }))}
              />
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
        <>
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
                  {user?.role !== 'user' && <th>Assigned</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={user?.role !== 'user' ? "11" : "10"} className={styles.empty}>No leads found</td></tr>
                ) : paginatedLeads.map(lead => {
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
                    {user?.role !== 'user' && (
                      <td>
                        <select
                          value={lead.assignedUsers?.[0]?.user?._id || lead.assignedUsers?.[0]?.user || ''}
                          onClick={e => e.stopPropagation()}
                          onChange={e => { e.stopPropagation(); updateAssignee(lead._id, e.target.value); }}
                          className={styles.statusSelect}
                          disabled={!perms.includes('edit') && !isPrivileged}
                          style={{width:'100px', maxWidth:'100px', overflow:'hidden', textOverflow:'ellipsis'}}
                        >
                          <option value="">Unassigned</option>
                          {teamUsers.map(u => (
                            <option key={u._id} value={u._id}>{u.firstName}</option>
                          ))}
                          {lead.assignedUsers?.map(au => {
                            const uid = typeof au.user === 'object' ? au.user?._id : au.user;
                            const name = typeof au.user === 'object' ? (au.user?.firstName || '') : '';
                            if (!uid || teamUsers.find(tu => tu._id === uid)) return null;
                            return <option key={uid} value={uid}>{name || uid}</option>;
                          })}
                        </select>
                      </td>
                    )}
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
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={pageSize} />
        </>
      )}
    </div>
  )
}
