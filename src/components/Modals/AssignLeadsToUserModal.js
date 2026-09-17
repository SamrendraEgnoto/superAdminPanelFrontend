// 'use client';

// import React, { useEffect, useState } from 'react';
// import api from '@/src/lib/api';
// import Modal from '@/src/components/Modal';
// import styles from './AssignLeadsToUserModal.module.scss';
// import { Trash2 } from 'lucide-react';

// const PERMISSIONS = ['read', 'edit','delete'];

// export default function AssignLeadsToUserModal({ user, onClose, refresh }) {
//   const [leads, setLeads] = useState([]);
//   const [selected, setSelected] = useState([]);

//   useEffect(() => {
//     const loadLeads = async () => {
//       try {
//         const res = await api.get('/buildings');
//         const data = res.data?.data || res.data || [];
//         setLeads(data);
//         const preSelected = [];
//         data.forEach((lead) => {
//           const assigned = lead.assignedUsers?.find((u) => u.user === user._id || u.user?._id === user._id);
//           if (assigned) { 
//             preSelected.push({ 
//               leadId: lead._id, 
//               name: `${lead.userInfo?.firstName || ''} ${lead.userInfo?.lastName || ''}`, 
//               permissions: assigned.permissions || ['read'] 
//             }); 
//           }
//         });
//         setSelected(preSelected);
//       } catch (err) { console.error(err); }
//     };
//     loadLeads();
//   }, [user]);

//   const toggleLead = (lead) => {
//     const exists = selected.find(l => l.leadId === lead._id);
//     if (exists) { setSelected(selected.filter(l => l.leadId !== lead._id)); }
//     else { setSelected([...selected, { leadId: lead._id, name: `${lead.userInfo?.firstName || ''} ${lead.userInfo?.lastName || ''}`, permissions: ['read'] }]); }
//   };

//   const togglePermission = (leadId, perm) => {
//     if (perm === 'read') return; 

//     setSelected(selected.map(l => {
//       if (l.leadId !== leadId) return l;

//       const has = l.permissions.includes(perm);

//       let updated = has
//         ? l.permissions.filter(p => p !== perm)
//         : [...l.permissions, perm];

//       if (!updated.includes('read')) {
//         updated.push('read');
//       }

//       return { ...l, permissions: updated };
//     }));
//   };

//   const handleSubmit = async () => {
//     if (!selected.length) return alert('Select at least one lead');
//     try {
//       const payload = { leads: selected.map(l => ({ leadId: l.leadId, permissions: l.permissions })) };
//       await api.post(`/users/${user._id}/assign-leads`, payload);
//       alert('Leads assigned successfully'); 
//       refresh(); 
//       onClose();
//     } catch (err) { console.error(err); alert(err?.response?.data?.message || 'Assignment failed'); }
//   };

//   return (
//     <Modal isOpen={true} onClose={onClose} title={`Assign Leads to ${user.firstName}`}>
//       <div className={styles.container}>
//         {leads.map((lead) => {
//           const assigned = selected.find(l => l.leadId === lead._id);
//           return (
//             <div key={lead._id} className={styles.userCard}>
//               <div className={styles.userHeader}>
//                 <input type="checkbox" checked={!!assigned} onChange={() => toggleLead(lead)} />
//                 <span>{lead.userInfo?.firstName} {lead.userInfo?.lastName}</span>
//               </div>
//               {assigned && (
//                 <div className={styles.permissions}>
//                   {PERMISSIONS.map(p => (
//                     <label key={p} className={p === 'read' ? styles.disabled : ''}>
//                       <input
//                         type="checkbox"
//                         checked={assigned.permissions.includes(p)}
//                         disabled={p === 'read'} 
//                         onChange={() => togglePermission(lead._id, p)}
//                       />
//                       {p}
//                     </label>
//                   ))}
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//       <div className={styles.btnRow}>
//         <button className={styles.submitBtn} onClick={handleSubmit}>Save</button>
//         <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
//       </div>
//     </Modal>
//   );
// }


'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import api, { queryKeys } from '@/src/lib/api';
import Modal from '@/src/components/Modal';
import { Loader2 } from 'lucide-react';
import styles from './AssignLeadsToUserModal.module.scss';

const PERMISSIONS = ['read', 'edit', 'delete'];

export default function AssignLeadsToUserModal({ user, onClose, refresh }) {
  const [localSelected, setLocalSelected] = useState([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const queryClient = useQueryClient();

  // Fetch leads with caching
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const res = await api.get('/buildings');
      return res.data?.data || res.data || [];
    },
    staleTime: 3 * 60 * 1000,
  });

  // Initialize selected leads from server data once
  useEffect(() => {
    const userId = user?._id;
    if (!leads.length || !userId || hasInitialized) return;
    
    const preSelected = [];
    leads.forEach((lead) => {
      const assigned = lead.assignedUsers?.find((u) => u.user === userId || u.user?._id === userId);
      if (assigned) {
        preSelected.push({
          leadId: lead._id,
          name: `${lead.userInfo?.firstName || ''} ${lead.userInfo?.lastName || ''}`,
          permissions: assigned.permissions || ['read']
        });
      }
    });
    
    setLocalSelected(preSelected);
    setHasInitialized(true);
  }, [leads, user?._id, hasInitialized]);

  // Assignment mutation
  const assignMutation = useMutation({
    mutationFn: async (payload) => {
      return api.post(`/users/${user._id}/assign-leads`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['buildings']);
      queryClient.invalidateQueries(['user-leads', user._id]);
      queryClient.invalidateQueries(queryKeys.dashboardStats('admin'));
      alert('Leads assigned successfully');
      onClose();      
      refresh?.();    
    },
    onError: (err) => {
      console.error(err);
      alert(err?.response?.data?.message || 'Assignment failed');
    }
  });

  const toggleLead = useCallback((lead) => {
    const exists = localSelected.find(l => l.leadId === lead._id);
    if (exists) {
      setLocalSelected(prev => prev.filter(l => l.leadId !== lead._id));
    } else {
      setLocalSelected(prev => [
        ...prev,
        {
          leadId: lead._id,
          name: `${lead.userInfo?.firstName || ''} ${lead.userInfo?.lastName || ''}`,
          permissions: ['read']
        }
      ]);
    }
  }, [localSelected]);

  const togglePermission = useCallback((leadId, perm) => {
    if (perm === 'read') return;

    setLocalSelected(prev => prev.map(l => {
      if (l.leadId !== leadId) return l;

      const has = l.permissions.includes(perm);
      let updated = has
        ? l.permissions.filter(p => p !== perm)
        : [...l.permissions, perm];

      if (!updated.includes('read')) {
        updated.push('read');
      }

      return { ...l, permissions: updated };
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!localSelected.length) return alert('Select at least one lead');
    
    const payload = {
      leads: localSelected.map(l => ({
        leadId: l.leadId,
        permissions: l.permissions
      }))
    };

    assignMutation.mutate(payload);
  }, [localSelected, assignMutation]);

  return (
    <Modal isOpen={true} onClose={onClose} title={`Assign Leads to ${user.firstName}`}>
      {isLoading ? (
        <div className={styles.loading}>
          <Loader2 size={24} />
          <span>Loading leads...</span>
        </div>
      ) : (
        <>
          <div className={styles.container}>
            {leads.map((lead) => {
              const assigned = localSelected.find(l => l.leadId === lead._id);
              return (
                <div key={lead._id} className={styles.userCard}>
                  <div className={styles.userHeader}>
                    <input 
                      type="checkbox" 
                      checked={!!assigned} 
                      onChange={() => toggleLead(lead)} 
                    />
                    <span>{lead.userInfo?.firstName} {lead.userInfo?.lastName}</span>
                  </div>
                  {assigned && (
                    <div className={styles.permissions}>
                      {PERMISSIONS.map(p => (
                        <label key={p} className={p === 'read' ? styles.disabled : ''}>
                          <input
                            type="checkbox"
                            checked={assigned.permissions.includes(p)}
                            disabled={p === 'read'}
                            onChange={() => togglePermission(lead._id, p)}
                          />
                          {p}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className={styles.btnRow}>
            <button 
              className={styles.submitBtn} 
              onClick={handleSubmit}
              disabled={assignMutation.isLoading}
            >
              {assignMutation.isLoading ? <Loader2 size={16} /> : 'Save'}
            </button>
            <button 
              className={styles.cancelBtn} 
              onClick={onClose}
              disabled={assignMutation.isLoading}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}