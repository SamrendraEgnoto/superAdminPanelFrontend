

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import Modal from '@/src/components/Modal';
import api from '@/src/lib/api';
import { Loader2, Search } from 'lucide-react';
import styles from './AssignUserModal.module.scss';

const PERMISSION_OPTIONS = ['read', 'edit', 'delete'];

export default function AssignUsersModal({ isOpen, onClose, leadId, onSuccess }) {
  const [localAssignedUsers, setLocalAssignedUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch all users with caching
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data?.data || res.data || [];
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch lead assignments with caching
  const { data: leadData, isLoading: leadLoading } = useQuery({
    queryKey: ['lead-assignments', leadId],
    queryFn: async () => {
      const res = await api.get(`/buildings/${leadId}`);
      return res.data?.data || res.data;
    },
    enabled: isOpen && !!leadId,
    staleTime: 2 * 60 * 1000,
  });

  // Derive assigned users from server data, merged with local changes
 // Remove the useMemo wrapper and let React Compiler optimize automatically
  const getAssignedUsers = () => {
    const serverUsers = leadData?.assignedUsers;
    if (!serverUsers) return localAssignedUsers;
    
    // If we have local changes, use them; otherwise use server data
    if (localAssignedUsers.length > 0) return localAssignedUsers;
    
    return serverUsers.map(a => ({
      userId: a.user?._id || a.user,
      firstName: a.user?.firstName || '',
      lastName: a.user?.lastName || '',
      permissions: a.permissions || ['read'],
      isExisting: true
    }));
  };

  const assignedUsers = getAssignedUsers();
  // Initialize local state only once when server data is available
  React.useEffect(() => {
    if (leadData?.assignedUsers && localAssignedUsers.length === 0) {
      const formatted = leadData.assignedUsers.map(a => ({
        userId: a.user?._id || a.user,
        firstName: a.user?.firstName || '',
        lastName: a.user?.lastName || '',
        permissions: a.permissions || ['read'],
        isExisting: true
      }));
      setLocalAssignedUsers(formatted);
    }
  }, [leadData?.assignedUsers, localAssignedUsers.length]);

  // Assignment mutation
  const assignMutation = useMutation({
    mutationFn: async (payload) => {
      return api.post(`/buildings/${leadId}/assign`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lead-assignments', leadId]);
      queryClient.invalidateQueries(['buildings']);
      
      alert('Users assigned successfully');
      onClose();
      onSuccess?.();
    },
    onError: (err) => {
      console.error('Assign error:', err.response?.data || err);
      alert(err.response?.data?.message || 'Assign failed');
    }
  });

  const availableUsers = useMemo(() => {
    return allUsers
      .filter(u => !assignedUsers.some(a => a.userId === u._id))
      .map(u => ({
        userId: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        permissions: ['read'],
        isExisting: false
      }));
  }, [allUsers, assignedUsers]);

  const handleUserToggle = useCallback((userId) => {
    const exists = assignedUsers.find(u => u.userId === userId);
    if (exists) {
      setLocalAssignedUsers(prev => prev.filter(u => u.userId !== userId));
    } else {
      const newUser = availableUsers.find(u => u.userId === userId);
      if (newUser) {
        setLocalAssignedUsers(prev => [...prev, newUser]);
      }
    }
  }, [assignedUsers, availableUsers]);

  const handlePermissionToggle = useCallback((userId, permission) => {
    if (permission === 'read') return;
    
    setLocalAssignedUsers(prev => prev.map(u => {
      if (u.userId !== userId) return u;
      
      let perms = u.permissions.includes(permission)
        ? u.permissions.filter(p => p !== permission)
        : [...u.permissions, permission];
      
      if (!perms.includes('read')) perms.push('read');
      
      return { ...u, permissions: perms };
    }));
  }, []);

  const handleAssign = useCallback(() => {
    if (assignedUsers.length === 0) {
      return alert('Select at least one user');
    }

    for (let u of assignedUsers) {
      if (!u.permissions || u.permissions.length === 0) {
        return alert(`Select at least one permission for ${u.firstName}`);
      }
    }

    const payload = {
      users: assignedUsers.map(u => ({
        userId: u.userId,
        permissions: u.permissions
      }))
    };

    assignMutation.mutate(payload);
  }, [assignedUsers, assignMutation]);

  const isLoading = usersLoading || leadLoading;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Users">
      {isLoading ? (
        <div className={styles.loading}>
          <Loader2 size={24} />
          <span>Loading...</span>
        </div>
      ) : (
        <>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search users by name..."
              value={userSearchTerm}
              onChange={e => setUserSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}
            />
          </div>
          <div className={styles.container}>
            {[...assignedUsers, ...availableUsers]
              .filter(u => {
                if (!userSearchTerm.trim()) return true;
                const q = userSearchTerm.toLowerCase();
                const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
                return name.includes(q);
              })
              .map(u => (
              <div key={u.userId} className={styles.userCard}>
                <div className={styles.userHeader}>
                  <input
                    type="checkbox"
                    checked={assignedUsers.some(a => a.userId === u.userId)}
                    onChange={() => handleUserToggle(u.userId)}
                  />
                  <span>
                    {u.firstName} {u.lastName}
                    {u.isExisting && <small> (assigned)</small>}
                  </span>
                </div>
                {assignedUsers.some(a => a.userId === u.userId) && (
                  <div className={styles.permissions}>
                    {PERMISSION_OPTIONS.map(p => (
                      <label key={p} className={p === 'read' ? styles.disabled : ''}>
                        <input
                          type="checkbox"
                          checked={u.permissions.includes(p)}
                          disabled={p === 'read'}
                          onChange={() => handlePermissionToggle(u.userId, p)}
                        />
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            className={styles.submitBtn}
            onClick={handleAssign}
            disabled={assignMutation.isLoading}
          >
            {assignMutation.isLoading ? <Loader2 size={16} /> : 'Assign / Update Users'}
          </button>
        </>
      )}
    </Modal>
  );
}