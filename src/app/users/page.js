'use client';

import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/lib/api';
import api from '@/src/lib/api';
import Modal from '@/src/components/Modal';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import { Plus, Search, RefreshCw, Edit2, Trash2, AlertCircle, Eye, EyeOff, Download } from 'lucide-react';
import styles from './Users.module.scss';
import AssignLeadsToUserModal from '@/src/components/Modals/AssignLeadsToUserModal';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';
import { validatePhone, sanitizePhone } from '@/src/lib/validation';
import toast from 'react-hot-toast';
import Pagination from '@/src/components/Pagination';
import PhoneInput from '@/src/components/PhoneInput';
import { exportToCsv } from '@/src/lib/exportCsv';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  department: '',
  phone: '',
  canCreateSubUsers: true,
  canCreateLead: false
};

export default function UsersPage() {
  const [list, setList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const pageSize = 5;
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [assignModal, setAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    try {
      const endpoint =
        (user?.role === 'superadmin' || user?.role === 'root')
          ? '/superadmin/users'
          : user?.role === 'admin'
          ? '/users'
          : '/users/team';

      const res = await api.get(endpoint);

      const data = res.data?.data || res.data || [];
      const mapped = data.map(u => ({
        ...u,
        statistics: {
          leadCount: u.statistics?.leadCount || 0,
          wonLeads: u.statistics?.wonLeads || 0
        }
      })).sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setList(mapped);
      setFiltered(mapped);
    } catch (err) {
      console.error('Load users error:', err);
      setList([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'root' || user.isRoot)) {
      router.replace('/admins');
      return;
    }
    if (user) load();
  }, [user, router]);

  const handleExportCsv = () => {
    const headers = [
      { label: 'Full Name', accessor: (u) => `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User' },
      { label: 'Email', key: 'email' },
      { label: 'Phone', key: 'phone' },
      { label: 'Role', key: 'role' },
      { label: 'Department', key: 'department' },
      { label: 'Status', accessor: (u) => u.isActive ? 'Active' : 'Inactive' },
      { label: 'Created At', accessor: (u) => u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '' }
    ];
    exportToCsv('Users', headers, filtered);
  };

  useEffect(() => {
    const q = search.toLowerCase();
    const data = list.filter(u =>
      `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''} ${u.phone || ''} ${u.department || ''} ${u.role || ''}`.toLowerCase().includes(q)
    );
    setFiltered(data);
  }, [search, list]);

  const submit = async (e) => {
    e.preventDefault();
    if (form.phone) {
      const phoneErr = validatePhone(form.phone);
      if (phoneErr) { toast.error(phoneErr); return; }
    }
    setBusy(true);
    setFormError('');
    try {
      let payload = { ...form };
      if (editing && !payload.password) delete payload.password;

      const endpoint = (user?.role === 'superadmin' || user?.role === 'root')
        ? (editing ? `/superadmin/users/${editing._id}` : '/superadmin/users')
        : user?.role === 'admin'
        ? (editing ? `/admin/users/${editing._id}` : '/admin/users')
        : (editing ? `/users/team/${editing._id}` : '/users/team');

      if (editing) {
        await api.put(endpoint, payload);
        toast.success('User updated successfully');
      } else {
        await api.post(endpoint, payload);
        toast.success('User created successfully');
      }

      setForm(initialForm);
      setEditing(null);
      setFormError('');
      setShowModal(false);
      await load();

      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to save user';
      setFormError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      const endpoint = user?.role === 'superadmin'
        ? `/superadmin/users/${id}`
        : user?.role === 'admin'
        ? `/admin/users/${id}`
        : `/users/team/${id}`;
      await api.delete(endpoint);
      await load();

      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Delete failed';
      toast.error(errorMsg);
    }
  };

  const openEdit = (u) => {
    setEditing(u);
    setFormError('');
    setForm({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email || '',
      password: '',
      department: u.department || '',
      phone: u.phone || '',
      canCreateSubUsers: u.canCreateSubUsers ?? true,
      canCreateLead: u.canCreateLead || false
    });
    setShowModal(true);
  };

  const openAssignModal = (user) => {
    setSelectedUser(user);
    setAssignModal(true);
  };

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedUsers = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [filtered.length]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>User Management</h1>
          <p>Manage your team members</p>
        </div>
        <div className={styles.headerActions}>
          {(user?.role === 'superadmin' || user?.role === 'admin' || user?.canCreateSubUsers) && (
            <button
              className={styles.btnPrimary}
              onClick={() => { setForm(initialForm); setEditing(null); setShowModal(true); }}
            >
              <Plus size={18} /> Add User
            </button>
          )}
          <button className={styles.btnSecondary} onClick={handleExportCsv} title="Export CSV">
            <Download size={18} /> Export CSV
          </button>
          <button className={styles.btnSecondary} onClick={load} title="Refresh">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className={styles.searchCard}>
        <Search size={20} />
        <input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setFormError(''); }}
        title={editing ? 'Edit User' : 'Create User'}
      >
        <form onSubmit={submit} className={styles.modalForm}>
          {formError && (
            <div className={styles.errorAlert}>
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
          )}
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              First Name <span className="requiredStar">*</span>
            </label>
            <input
              placeholder="First Name"
              value={form.firstName}
              onChange={(e) => { setFormError(''); setForm({ ...form, firstName: e.target.value }); }}
              required
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Last Name
            </label>
            <input
              placeholder="Last Name"
              value={form.lastName}
              onChange={(e) => { setFormError(''); setForm({ ...form, lastName: e.target.value }); }}
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Email <span className="requiredStar">*</span>
            </label>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => { setFormError(''); setForm({ ...form, email: e.target.value }); }}
              required
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {editing ? 'Password (Optional)' : 'Password'} {!editing && <span className="requiredStar">*</span>}
            </label>
            <div className="passwordInputWrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={editing ? 'Password (optional)' : 'Password'}
                value={form.password}
                onChange={(e) => { setFormError(''); setForm({ ...form, password: e.target.value }); }}
                required={!editing}
              />
              <button
                type="button"
                className="passwordToggleBtn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Department
            </label>
            <input
              placeholder="Department"
              value={form.department}
              onChange={(e) => { setFormError(''); setForm({ ...form, department: e.target.value }); }}
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Phone Number
            </label>
            <PhoneInput
              value={form.phone}
              onChange={(e) => { setFormError(''); setForm({ ...form, phone: e.target.value }); }}
              placeholder="7 to 15 digits"
            />
          </div>
          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={form.canCreateSubUsers}
                onChange={(e) => setForm({ ...form, canCreateSubUsers: e.target.checked })}
              />
              Can Create Sub-Users
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={form.canCreateLead}
                onChange={(e) => setForm({ ...form, canCreateLead: e.target.checked })}
              />
              Can Create Leads
            </label>
          </div>
          <div className={styles.modalActions}>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={busy}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {busy ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Leads</th>
                  <th>Won</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={styles.empty}>No users found</td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                  <tr key={u._id}>
                    <td className={styles.nameCell}>
                      {u.firstName} {u.lastName}
                    </td>
                    <td>{u.email}</td>
                    <td>{u.department || '—'}</td>
                    <td>{u.statistics?.leadCount || 0}</td>
                    <td>{u.statistics?.wonLeads || 0}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.iconBtn}
                          onClick={() => openEdit(u)}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className={`${styles.iconBtn} ${styles.dangerBtn}`}
                          onClick={() => handleDelete(u._id)}
                        >
                          <Trash2 size={15} />
                        </button>
                        <button
                          className={styles.assignBtn}
                          onClick={() => openAssignModal(u)}
                        >
                          Assign
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

      {assignModal && selectedUser && (
        <AssignLeadsToUserModal
          user={selectedUser}
          onClose={() => setAssignModal(false)}
          refresh={load}
        />
      )}
    </div>
  );
}
