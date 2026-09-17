// 'use client';

// import React, { useEffect, useState } from 'react';
// import { useQueryClient } from '@tanstack/react-query';
// import { queryKeys } from '@/src/lib/api';
// import api from '@/src/lib/api';
// import Modal from '@/src/components/Modal';
// import LoadingSpinner from '@/src/components/LoadingSpinner';
// import { Plus, Search, RefreshCw, Edit2, Trash2 } from 'lucide-react';
// import styles from './Users.module.scss';
// import AssignLeadsToUserModal from '@/src/components/Modals/AssignLeadsToUserModal';
// import { useAuth } from '@/src/context/AuthContext';

// const initialForm = {
//   firstName: '',
//   lastName: '',
//   email: '',
//   password: '',
//   department: '',
//   phone: '',
//   canCreateSubUsers: true,
//   canCreateLead: false
// };

// export default function UsersPage() {
//   const [list, setList] = useState([]);
//   const [filtered, setFiltered] = useState([]);
//   const [form, setForm] = useState(initialForm);
//   const [showModal, setShowModal] = useState(false);
//   const [editing, setEditing] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [busy, setBusy] = useState(false);
//   const [search, setSearch] = useState('');
//   const [assignModal, setAssignModal] = useState(false);
//   const [selectedUser, setSelectedUser] = useState(null);

//   const queryClient = useQueryClient();
//   const { user } = useAuth();

//   const load = async () => {
//     setLoading(true);
//     try {
//       const res = await api.get('/users');
//       const data = res.data?.data || res.data || [];
//       const mapped = data.map(u => ({
//         ...u,
//         statistics: {
//           leadCount: u.statistics?.leadCount || 0,
//           wonLeads: u.statistics?.wonLeads || 0
//         }
//       }));
//       setList(mapped);
//       setFiltered(mapped);
//     } catch (err) {
//       console.error('Load users error:', err);
//       setList([]);
//       setFiltered([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { load(); }, []);

//   useEffect(() => {
//     const q = search.toLowerCase();
//     const data = list.filter(u =>
//       `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''}`.toLowerCase().includes(q)
//     );
//     setFiltered(data);
//   }, [search, list]);

//   const submit = async (e) => {
//     e.preventDefault();
//     setBusy(true);
//     try {
//       let payload = { ...form };
//       if (editing && !payload.password) delete payload.password;
//       if (editing) {
//         await api.put(`/admin/users/${editing._id}`, payload);
//       } else {
//         await api.post('/admin/users', payload);
//       }
//       setForm(initialForm);
//       setEditing(null);
//       setShowModal(false);
//       await load();
//       // Refresh dashboard counts
//       queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
//     } catch (err) {
//       console.error('Save error:', err);
//       alert(err?.response?.data?.message || 'Something went wrong');
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm('Delete this user?')) return;
//     try {
//       await api.delete(`/admin/users/${id}`);
//       await load();
//       // Refresh dashboard counts
//       queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
//     } catch (err) {
//       console.error('Delete error:', err);
//       alert(err?.response?.data?.message || 'Delete failed');
//     }
//   };

//   const openEdit = (u) => {
//     setEditing(u);
//     setForm({
//       firstName: u.firstName || '',
//       lastName: u.lastName || '',
//       email: u.email || '',
//       password: '',
//       department: u.department || '',
//       phone: u.phone || '',
//       canCreateSubUsers: u.canCreateSubUsers ?? true,
//       canCreateLead: u.canCreateLead || false
//     });
//     setShowModal(true);
//   };

//   const openAssignModal = (user) => {
//     setSelectedUser(user);
//     setAssignModal(true);
//   };

//   return (
//     <div className={styles.page}>
//       <div className={styles.header}>
//         <div>
//           <h1>User Management</h1>
//           <p>Manage your team members</p>
//         </div>
//         <div className={styles.headerActions}>
//           {/* <button
//             className={styles.btnPrimary}
//             onClick={() => { setForm(initialForm); setEditing(null); setShowModal(true); }}
//           >
//             <Plus size={18} /> Add User
//           </button> */}
//           {(user?.role === 'admin' || user?.canCreateSubUsers) && (
//             <button
//               className={styles.btnPrimary}
//               onClick={() => { setForm(initialForm); setEditing(null); setShowModal(true); }}
//             >
//               <Plus size={18} /> Add User
//             </button>
//           )}
//           <button className={styles.btnSecondary} onClick={load}>
//             <RefreshCw size={18} />
//           </button>
//         </div>
//       </div>

//       <div className={styles.searchCard}>
//         <Search size={20} />
//         <input
//           placeholder="Search users..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />
//       </div>

//       <Modal
//         isOpen={showModal}
//         onClose={() => setShowModal(false)}
//         title={editing ? 'Edit User' : 'Create User'}
//       >
//         <form onSubmit={submit} className={styles.modalForm}>
//           <input
//             placeholder="First Name"
//             value={form.firstName}
//             onChange={(e) => setForm({ ...form, firstName: e.target.value })}
//             required
//           />
//           <input
//             placeholder="Last Name"
//             value={form.lastName}
//             onChange={(e) => setForm({ ...form, lastName: e.target.value })}
//           />
//           <input
//             type="email"
//             placeholder="Email"
//             value={form.email}
//             onChange={(e) => setForm({ ...form, email: e.target.value })}
//             required
//           />
//           <input
//             type="password"
//             placeholder={editing ? 'Password (optional)' : 'Password'}
//             value={form.password}
//             onChange={(e) => setForm({ ...form, password: e.target.value })}
//             required={!editing}
//           />
//           <input
//             placeholder="Department"
//             value={form.department}
//             onChange={(e) => setForm({ ...form, department: e.target.value })}
//           />
//           <input
//             placeholder="Phone"
//             value={form.phone}
//             onChange={(e) => setForm({ ...form, phone: e.target.value })}
//           />
//           <div className={styles.checkboxGroup}>
//             <label className={styles.checkboxLabel}>
//               <input
//                 type="checkbox"
//                 checked={form.canCreateSubUsers}
//                 onChange={(e) => setForm({ ...form, canCreateSubUsers: e.target.checked })}
//               />
//               Can Create Sub-Users
//             </label>
//             <label className={styles.checkboxLabel}>
//               <input
//                 type="checkbox"
//                 checked={form.canCreateLead}
//                 onChange={(e) => setForm({ ...form, canCreateLead: e.target.checked })}
//               />
//               Can Create Leads
//             </label>
//           </div>
//           <div className={styles.modalActions}>
//             <button
//               type="submit"
//               className={styles.btnPrimary}
//               disabled={busy}
//               style={{ flex: 1, justifyContent: 'center' }}
//             >
//               {busy ? 'Saving...' : editing ? 'Update' : 'Create'}
//             </button>
//             <button
//               type="button"
//               className={styles.btnSecondary}
//               onClick={() => setShowModal(false)}
//             >
//               Cancel
//             </button>
//           </div>
//         </form>
//       </Modal>

//       {loading ? (
//         <LoadingSpinner />
//       ) : (
//         <div className={styles.tableWrapper}>
//           <table className={styles.table}>
//             <thead>
//               <tr>
//                 <th>Name</th>
//                 <th>Email</th>
//                 <th>Department</th>
//                 <th>Leads</th>
//                 <th>Won</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filtered.length === 0 ? (
//                 <tr>
//                   <td colSpan="6" className={styles.empty}>No users found</td>
//                 </tr>
//               ) : (
//                 filtered.map((u) => (
//                   <tr key={u._id}>
//                     <td className={styles.nameCell}>
//                       {u.firstName} {u.lastName}
//                     </td>
//                     <td>{u.email}</td>
//                     <td>{u.department || '—'}</td>
//                     <td>{u.statistics?.leadCount || 0}</td>
//                     <td>{u.statistics?.wonLeads || 0}</td>
//                     <td>
//                       <div className={styles.actions}>
//                         <button
//                           className={styles.iconBtn}
//                           onClick={() => openEdit(u)}
//                         >
//                           <Edit2 size={15} />
//                         </button>
//                         <button
//                           className={`${styles.iconBtn} ${styles.dangerBtn}`}
//                           onClick={() => handleDelete(u._id)}
//                         >
//                           <Trash2 size={15} />
//                         </button>
//                         <button
//                           className={styles.assignBtn}
//                           onClick={() => openAssignModal(u)}
//                         >
//                           Assign
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {assignModal && selectedUser && (
//         <AssignLeadsToUserModal
//           user={selectedUser}
//           onClose={() => setAssignModal(false)}
//           refresh={load}
//         />
//       )}
//     </div>
//   );
// }

'use client';

import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/lib/api';
import api from '@/src/lib/api';
import Modal from '@/src/components/Modal';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import { Plus, Search, RefreshCw, Edit2, Trash2 } from 'lucide-react';
import styles from './Users.module.scss';
import AssignLeadsToUserModal from '@/src/components/Modals/AssignLeadsToUserModal';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';

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
  const [form, setForm] = useState(initialForm);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [assignModal, setAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const router = useRouter();

  // ✅ FIXED: dynamic API based on role
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
      }));

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

  useEffect(() => {
    const q = search.toLowerCase();
    const data = list.filter(u =>
      `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''}`.toLowerCase().includes(q)
    );
    setFiltered(data);
  }, [search, list]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      let payload = { ...form };
      if (editing && !payload.password) delete payload.password;

      const endpoint = user?.role === 'superadmin'
        ? (editing ? `/superadmin/users/${editing._id}` : '/superadmin/users')
        : user?.role === 'admin'
        ? (editing ? `/admin/users/${editing._id}` : '/admin/users')
        : (editing ? `/users/team/${editing._id}` : '/users/team');

      if (editing) {
        await api.put(endpoint, payload);
      } else {
        await api.post(endpoint, payload);
      }

      setForm(initialForm);
      setEditing(null);
      setShowModal(false);
      await load();

      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
    } catch (err) {
      console.error('Save error:', err);
      alert(err?.response?.data?.message || 'Something went wrong');
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
      console.error('Delete error:', err);
      alert(err?.response?.data?.message || 'Delete failed');
    }
  };

  const openEdit = (u) => {
    setEditing(u);
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
          <button className={styles.btnSecondary} onClick={load}>
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
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit User' : 'Create User'}
      >
        <form onSubmit={submit} className={styles.modalForm}>
          <input
            placeholder="First Name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            required
          />
          <input
            placeholder="Last Name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder={editing ? 'Password (optional)' : 'Password'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!editing}
          />
          <input
            placeholder="Department"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
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
                filtered.map((u) => (
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