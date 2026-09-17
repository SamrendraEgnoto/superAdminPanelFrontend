
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { superAdminApi, adminApi, api, queryKeys } from '@/src/lib/api';
import Charts from '@/src/components/Charts';
import { useAuth } from '@/src/context/AuthContext';
import {
  Users, UserCog, Building2, TrendingUp,
  Clock, CheckCircle2, AlertCircle, XCircle,
  BarChart3, Activity
} from 'lucide-react';
import styles from './Dashboard.module.scss';

/* ── Small helper to render one stat card ──────────────────────────────── */
function StatCard({ label, value, icon, trend = 'positive', sub, loading }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statHeader}>
        <span className={styles.statLabel}>{label}</span>
        <div className={styles.statIconWrapper}>{icon}</div>
      </div>
      <div className={styles.statValue}>
        {loading ? <span className={styles.pulse}>…</span> : value}
      </div>
      <div className={`${styles.statTrend} ${styles[trend]}`}>
        {sub}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const role = (user?.role === 'root' || user?.role === 'delegated') ? 'superadmin' : user?.role;

  /* ── Data fetch ──────────────────────────────────────────────────────── */
  const { data: dashboardData, isLoading: statsLoading, refetch: refetchDashboard } = useQuery({
    queryKey: queryKeys.dashboardStats(role),
    queryFn: async () => {

      /* SUPERADMIN */
      if (role === 'superadmin') {
        const [statsRes, adminsRes] = await Promise.all([
          superAdminApi.getDashboardStats(),
          superAdminApi.getAdmins({ limit: 5, sort: '-createdAt' }),
        ]);
        return {
          stats: statsRes.data?.data || {},
          recent: adminsRes.data?.data || adminsRes.data || [],
        };
      }

      /* ADMIN — richer data: users + leads */
      if (role === 'admin') {
        try {
          const res = await adminApi.getDashboard();
          const data = res.data?.data || {};
          const stats = data.statistics || {};
          const recentLeads = data.recentLeads || [];

          return {
            stats: {
              totalUsers:     stats.totalUsers || 0,
              activeUsers:    stats.activeUsers || 0,
              inactiveUsers:  (stats.totalUsers || 0) - (stats.activeUsers || 0),
              totalLeads:     stats.totalLeads || 0,
              convertedLeads: stats.wonLeads || 0,
              pendingLeads:   stats.activeLeads || 0,
            },
            recent: recentLeads,
          };
        } catch (err) {
          console.error('Dashboard API failed:', err);
          return { stats: {}, recent: [] };
        }
      }

      /* USER */
      if (role === 'user') {
        const [buildingsRes, teamRes] = await Promise.all([
          api.get('/users/buildings'),
          api.get('/users/team'),
        ]);
        const buildings = buildingsRes.data?.data || buildingsRes.data || [];
        const team      = teamRes.data?.data || [];

        const statusCounts = buildings.reduce((acc, b) => {
          acc[b.status] = (acc[b.status] || 0) + 1;
          return acc;
        }, {});

        return {
          stats: {
            teamMembers:  team.length,
            totalLeads:   buildings.length,
            closedLeads:  statusCounts['closed-won'] || statusCounts['closed'] || 0,
          },
          recent: buildings.slice(0, 5),
        };
      }

      return { stats: {}, recent: [] };
    },
    enabled: !!role,
    staleTime: 0,
  });

  const stats  = dashboardData?.stats  || {};
  const recent = dashboardData?.recent || [];

  /* ── Per-role chart stats (passed to Charts) ─────────────────────────── */
  const chartStats = React.useMemo(() => {
    if (role === 'superadmin') {
      return {
        secondary: stats.activeAdmins   || 0,
        tertiary:  stats.inactiveAdmins || 0,
        extra1:    stats.totalUsers     || 0,
        extra2:    stats.totalLeads     || 0,
      };
    }
    if (role === 'admin') {
      return {
        secondary: stats.activeUsers    || 0,
        tertiary:  stats.inactiveUsers  || 0,
        extra1:    stats.totalLeads     || 0,
        extra2:    stats.convertedLeads || 0,
      };
    }
    if (role === 'user') {
      return {
        secondary: stats.totalLeads  || 0,
        tertiary:  stats.closedLeads || 0,
        extra1:    0,
        extra2:    0,
      };
    }
    return {};
  }, [role, stats]);

  /* ── Stat cards per role ─────────────────────────────────────────────── */
  const statCards = React.useMemo(() => {
    if (role === 'superadmin') return [
      { label: 'Total Admins',    value: stats.totalAdmins    || 0, icon: <UserCog      size={22}/>, trend: 'positive', sub: 'All admins'       },
      { label: 'Active Admins',   value: stats.activeAdmins   || 0, icon: <CheckCircle2 size={22}/>, trend: 'positive', sub: 'Currently active'  },
      { label: 'Inactive Admins', value: stats.inactiveAdmins || 0, icon: <XCircle      size={22}/>, trend: 'neutral',  sub: 'Inactive'          },
      { label: 'Total Users',     value: stats.totalUsers     || 0, icon: <Users        size={22}/>, trend: 'positive', sub: 'Platform-wide'     },
      { label: 'Total Leads',     value: stats.totalLeads     || 0, icon: <Building2    size={22}/>, trend: 'positive', sub: 'Platform-wide'     },
    ];

    if (role === 'admin') return [
      { label: 'Total Users',     value: stats.totalUsers     || 0, icon: <Users        size={22}/>, trend: 'positive', sub: 'Your team'         },
      { label: 'Active Users',    value: stats.activeUsers    || 0, icon: <CheckCircle2 size={22}/>, trend: 'positive', sub: 'Active now'        },
      { label: 'Inactive Users',  value: stats.inactiveUsers  || 0, icon: <XCircle      size={22}/>, trend: 'neutral',  sub: 'Inactive'          },
      { label: 'Total Leads',     value: stats.totalLeads     || 0, icon: <Building2    size={22}/>, trend: 'positive', sub: 'All leads'         },
      { label: 'Converted Leads', value: stats.convertedLeads || 0, icon: <TrendingUp   size={22}/>, trend: 'positive', sub: 'Closed/won'        },
      { label: 'Pending Leads',   value: stats.pendingLeads   || 0, icon: <Clock        size={22}/>, trend: 'neutral',  sub: 'In pipeline'       },
    ];

    if (role === 'user') return [
      { label: 'Team Members',    value: stats.teamMembers    || 0, icon: <Users        size={22}/>, trend: 'positive', sub: 'In your team'      },
      { label: 'Total Leads',     value: stats.totalLeads     || 0, icon: <Building2    size={22}/>, trend: 'neutral',  sub: 'Assigned to you'   },
      { label: 'Closed Leads',    value: stats.closedLeads    || 0, icon: <CheckCircle2 size={22}/>, trend: 'positive', sub: 'Conversions'       },
    ];

    return [];
  }, [role, stats]);

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className={styles.dashboard}>

      {/* Welcome */}
      <div className={styles.header}>
        <div>
          <h1>Welcome back, <span className={styles.roleTag}>{user?.name || role}</span>!</h1>
          <p>Here&apos;s your live overview for today.</p>
        </div>
        <div className={styles.liveChip}>
          <Activity size={14} /> Live
        </div>
      </div>

      {/* Stat cards */}
      <div className={`${styles.grid} ${styles[`cols${statCards.length}`]}`}>
        {statCards.map((c, i) => (
          <StatCard key={i} {...c} loading={statsLoading} />
        ))}
      </div>

      {/* Chart + activity */}
      <div className={styles.contentGrid}>
        <div className={styles.chartSection}>
          <Charts stats={chartStats} role={role} />
        </div>

        <div className={styles.activitySection}>
          <div className={styles.activityHeader}>
            <h3>Recent Activity</h3>
            <button className={styles.viewAllBtn}>View All</button>
          </div>

          {statsLoading ? (
            <div className={styles.skeletonList}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.skeletonItem} />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className={styles.emptyState}>
              <AlertCircle size={38} className={styles.emptyIcon} />
              <p>
                {role === 'superadmin'
                  ? 'No admins registered yet.'
                  : role === 'admin'
                  ? 'No leads found yet.'
                  : 'No leads assigned to you.'}
              </p>
            </div>
          ) : (
            <div className={styles.activityList}>
              {recent.map(item => {
                const isSA     = role === 'superadmin';
                const isAdmin  = role === 'admin';
                const title    = isSA ? item.companyName : isAdmin ? (item.clientName || item.buildingType || 'Lead') : item.buildingType;
                const sub      = isSA ? item.email : (item.userInfo?.email || item.clientEmail || 'N/A');
                const status   = isSA ? (item.isActive ? 'Active' : 'Inactive') : (item.status || 'new');
                const badgeCls = isSA
                  ? (item.isActive ? styles.completed : styles.cancelled)
                  : styles[status.toLowerCase().replace(/[^a-z]/g, '') || 'new'];

                return (
                  <div key={item._id} className={styles.activityItem}>
                    <div className={styles.itemLeft}>
                      <div className={styles.itemIcon}>
                        {isSA ? <UserCog size={17} /> : <Building2 size={17} />}
                      </div>
                      <div className={styles.itemDetails}>
                        <span className={styles.itemTitle}>{title}</span>
                        <span className={styles.itemSub}>{sub}</span>
                      </div>
                    </div>
                    <span className={`${styles.statusBadge} ${badgeCls}`}>{status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}