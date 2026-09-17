'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/src/lib/api';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import AssignUserModal from '@/src/components/Modals/AssignUserModal';
import styles from './LeadDetails.module.scss';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';

export default function LeadDetailsPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const { user } = useAuth();
  const isPrivileged = ['admin', 'superadmin'].includes(user?.role?.toLowerCase());

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);

  const permissions = lead?.currentUserPermissions || [];

  const loadLead = async () => {
    try {
      const res = await api.get(`/buildings/${id}`);
      if (res.data?.success) {
        setLead(res.data.data);
      } else if (res.data) {
        setLead(res.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load lead');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (id) loadLead(); 
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('userInfo.')) {
      const key = name.split('.')[1];
      setLead(prev => ({
        ...prev,
        userInfo: { ...prev.userInfo, [key]: value }
      }));
    } else if (name.startsWith('attributes.')) {
      const key = name.split('.')[1];
      setLead(prev => ({
        ...prev,
        attributes: { ...prev.attributes, [key]: value }
      }));
    } else {
      setLead(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`/buildings/${id}`, {
        buildingType: lead.buildingType,
        status: lead.status,
        userInfo: lead.userInfo,
        attributes: lead.attributes
      });
      alert('Lead updated successfully');
    } catch (err) {
      console.error(err);
      alert('Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!lead) return <div style={{ padding: 40, textAlign: 'center' }}>No lead found</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={18} /> Back
        </button>
        <h2>{lead.buildingType}</h2>

          {permissions.includes('delete') && (
            <button
              className={styles.deleteBtn}
              onClick={async () => {
                if (!window.confirm('Delete this lead?')) return;

                try {
                  await api.delete(`/buildings/${id}`);
                  alert('Deleted successfully');
                  router.push('/leads');
                } catch (err) {
                  console.error(err);
                  alert(err?.response?.data?.message || 'Delete failed');
                }
              }}
            >
              Delete
            </button>
          )}
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={styles.card}>
            <h3>Lead Information</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>Building Type</label>
                <input
                  name="buildingType"
                  value={lead.buildingType || ''}
                  onChange={handleChange}
                  disabled={!permissions.includes('edit')}
                />
              </div>

              <div className={styles.field}>
                <label>Status</label>
                <select
                  name="status"
                  value={lead.status || ''}
                  onChange={handleChange}
                  disabled={!permissions.includes('edit')}
                >
                  <option value="new">new</option>
                  <option value="contacted">contacted</option>
                  <option value="qualified">qualified</option>
                  <option value="proposal">proposal</option>
                  <option value="negotiation">negotiation</option>
                  <option value="closed-won">closed-won</option>
                  <option value="closed-lost">closed-lost</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Customer Info</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>First Name</label>
                <input
                  name="userInfo.firstName"
                  value={lead.userInfo?.firstName || ''}
                  onChange={handleChange}
                  disabled={!permissions.includes('edit')}
                />
              </div>

              <div className={styles.field}>
                <label>Last Name</label>
                <input
                  name="userInfo.lastName"
                  value={lead.userInfo?.lastName || ''}
                  onChange={handleChange}
                  disabled={!permissions.includes('edit')}
                />
              </div>

              <div className={styles.field}>
                <label>Email</label>
                <input
                  name="userInfo.email"
                  value={lead.userInfo?.email || ''}
                  onChange={handleChange}
                  disabled={!permissions.includes('edit')}
                />
              </div>

              <div className={styles.field}>
                <label>Phone</label>
                <input
                  name="userInfo.phoneNumber"
                  value={lead.userInfo?.phoneNumber || ''}
                  onChange={handleChange}
                  disabled={!permissions.includes('edit')}
                />
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Building Attributes</h3>
            <div className={styles.grid}>
              {/* Main Dimensions */}
              <div className={styles.field}>
                <label>Width (ft)</label>
                <input
                  type="number"
                  name="attributes.width"
                  value={lead.attributes?.width || ''}
                  onChange={handleChange}
                  disabled={!permissions.includes('edit')}
                />
              </div>
              <div className={styles.field}>
                <label>Length (ft)</label>
                <input
                  type="number"
                  name="attributes.length"
                  value={lead.attributes?.length || ''}
                  onChange={handleChange}
                  disabled={!permissions.includes('edit')}
                />
              </div>
              <div className={styles.field}>
                <label>Height (ft)</label>
                <input
                  type="number"
                  name="attributes.height"
                  value={lead.attributes?.height || ''}
                  onChange={handleChange}
                  disabled={!permissions.includes('edit')}
                />
              </div>

              {/* Colors */}
              <div className={styles.field}>
                <label>Roof Color</label>
                <input
                  name="attributes.roofColor"
                  value={lead.attributes?.roofColor || ''}
                  onChange={handleChange}
                  disabled={!permissions.includes('edit')}
                />
              </div>
              <div className={styles.field}>
                <label>Wall Color</label>
                <input
                  name="attributes.wallColor"
                  value={lead.attributes?.wallColor || ''}
                  onChange={handleChange}
                  disabled={!permissions.includes('edit')}
                />
              </div>
              <div className={styles.field}>
                <label>Trim Color</label>
                <input
                  name="attributes.trimColor"
                  value={lead.attributes?.trimColor || ''}
                  onChange={handleChange}
                  disabled={!permissions.includes('edit')}
                />
              </div>

              {/* Walls & More */}
              <div className={styles.field}>
                <label>Front Wall</label>
                <input
                  name="attributes.frontWallFeet"
                  value={lead.attributes?.frontWallFeet || ''}
                  onChange={handleChange}
                  disabled={!permissions.includes('edit')}
                />
              </div>
              <div className={styles.field}>
                <label>Back Wall</label>
                <input
                  name="attributes.backWallFeet"
                  value={lead.attributes?.backWallFeet || ''}
                  onChange={handleChange}
                  disabled={!permissions.includes('edit')}
                />
              </div>
              <div className={styles.field}>
                <label>Roof Pitch</label>
                <input
                  name="attributes.roofPitchRatio"
                  value={lead.attributes?.roofPitchRatio || ''}
                  onChange={handleChange}
                  disabled={!permissions.includes('edit')}
                />
              </div>
              
              {/* Lean-to specific (Conditional rendering or just always show if exists) */}
              {Object.keys(lead.attributes || {}).some(k => k.toLowerCase().includes('lean')) && (
                <>
                  <div className={styles.field}>
                    <label>Lean Width</label>
                    <input
                      name="attributes.leanWidthFeet"
                      value={lead.attributes?.leanWidthFeet || ''}
                      onChange={handleChange}
                      disabled={!permissions.includes('edit')}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Lean Height</label>
                    <input
                      name="attributes.leanHeightFeet"
                      value={lead.attributes?.leanHeightFeet || ''}
                      onChange={handleChange}
                      disabled={!permissions.includes('edit')}
                    />
                  </div>
                </>
              )}
            </div>
            
            {/* Show all other attributes that are not explicitly mapped */}
            <details className={styles.moreAttributes}>
              <summary>View All Attributes</summary>
              <div className={styles.jsonView}>
                <pre>{JSON.stringify(lead.attributes, null, 2)}</pre>
              </div>
            </details>
          </div>
          {permissions.includes('edit') && (
            <button
              className={styles.saveBtn}
              onClick={handleUpdate}
              disabled={saving}
            >
              <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        {isPrivileged && (
          <div className={styles.sidebar}>
            <div className={styles.card}>
              <h3>Assigned Users</h3>

              {lead.assignedUsers?.length > 0 ? (
                lead.assignedUsers.map((u, i) => (
                  <div key={i} className={styles.userRow}>
                    <strong>{u.user?.firstName} {u.user?.lastName}</strong>
                    <span className={styles.permission}>
                      {u.permissions?.join(', ')}
                    </span>
                  </div>
                ))
              ) : (
                <p className={styles.noUsers}>No users assigned</p>
              )}

              <button
                className={styles.assignBtn}
                onClick={() => setOpenAssign(true)}
              >
                <UserPlus size={16} /> Assign Users
              </button>
            </div>
          </div>
        )}
      </div>
      {isPrivileged && (
        <AssignUserModal
          isOpen={openAssign}
          onClose={() => setOpenAssign(false)}
          leadId={id}
          onSuccess={loadLead}
        />
      )}
    </div>
  );
}
