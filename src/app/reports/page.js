'use client';

import React, { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { userApi, adminApi, superAdminApi, api } from '@/src/lib/api';
import Charts from '@/src/components/Charts';
import { exportToCsv } from '@/src/lib/exportCsv';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  TrendingUp, Users, Building2, DollarSign,
  Download, RefreshCw, ArrowUpRight, ArrowDownRight,
  Minus, UserCog, CheckCircle2, XCircle, Clock,
  Search, FileSpreadsheet
} from 'lucide-react';
import styles from './Reports.module.scss';

export default function ReportsPage() {
  const { user } = useAuth();
  const role = (user?.role === 'root' || user?.role === 'delegated') ? 'superadmin' : user?.role;

  const [dateRange,  setDateRange]  = useState('last_30_days');
  const [reportType, setReportType] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [adminSearch, setAdminSearch] = useState('');

  /* ── Role-based stats query ─────────────────────────────────────────── */
  const { data: roleStats, isLoading: statsLoading } = useQuery({
    queryKey: ['report-role-stats', role, refreshKey],
    queryFn: async () => {
      /* SUPERADMIN & DELEGATED SUPER ADMIN (DSA) */
      if (role === 'superadmin') {
        const [statsRes, adminsRes, usersRes] = await Promise.all([
          superAdminApi.getDashboardStats(),
          superAdminApi.getAdmins({ limit: 100, sort: '-createdAt' }).catch(() => ({ data: { data: [] } })),
          superAdminApi.getUsers({ limit: 100 }).catch(() => ({ data: { data: [] } })),
        ]);
        const d = statsRes.data?.data || {};
        const admins = adminsRes.data?.data || adminsRes.data || [];
        const users = usersRes.data?.data || usersRes.data || [];

        const cards = [
          { label: 'Total Admins',    value: (d.totalAdmins ?? d.totalDataViewers) ?? 0,    icon: <UserCog    size={22}/>, variant: 'primary',  change: null },
          { label: 'Active Admins',   value: (d.activeAdmins ?? d.activeDataViewers) ?? 0,   icon: <CheckCircle2 size={22}/>, variant: 'success', change: null },
          { label: 'Total Users',     value: d.totalUsers || 0,                           icon: <Users        size={22}/>, variant: 'info',    change: null },
          { label: 'Active Users',    value: (d.activeUsers ?? d.totalUsers) || 0,         icon: <CheckCircle2 size={22}/>, variant: 'success', change: null },
          { label: 'Total Leads',     value: (d.totalLeads ?? d.totalOwnLeads) ?? 0,        icon: <Building2    size={22}/>, variant: 'warning', change: null },
          { label: 'Converted Leads', value: d.convertedLeads || 0,                         icon: <TrendingUp   size={22}/>, variant: 'primary', change: null },
        ];

        return {
          cards,
          admins,
          users,
          chartStats: {
            secondary: (d.activeAdmins ?? d.activeDataViewers)   || 0,
            tertiary:  (d.inactiveAdmins ?? d.inactiveDataViewers) || 0,
            extra1:    d.totalUsers     || 0,
            extra2:    (d.totalLeads ?? d.totalOwnLeads)     || 0,
          },
        };
      }

      /* ADMIN */
      if (role === 'admin') {
        const [dashRes, usersRes] = await Promise.all([
          adminApi.getDashboard(),
          adminApi.getUsers().catch(() => ({ data: { data: [] } })),
        ]);
        const stats = dashRes.data?.data?.statistics || {};
        const users = usersRes.data?.data || usersRes.data || [];

        return {
          cards: [
            { label: 'Total Users',      value: stats.totalUsers || 0,     icon: <Users        size={22}/>, variant: 'primary' },
            { label: 'Active Users',     value: stats.activeUsers || 0,    icon: <CheckCircle2 size={22}/>, variant: 'success' },
            { label: 'Inactive Users',   value: stats.inactiveUsers || 0,  icon: <XCircle      size={22}/>, variant: 'danger'  },
            { label: 'Total Leads',      value: stats.totalLeads || 0,     icon: <Building2    size={22}/>, variant: 'info'    },
            { label: 'Converted Leads',  value: stats.convertedLeads || 0, icon: <TrendingUp   size={22}/>, variant: 'warning' },
            { label: 'Pending Leads',    value: stats.pendingLeads || 0,   icon: <Clock        size={22}/>, variant: 'neutral' },
          ],
          users,
          admins: [],
          chartStats: {
            secondary: stats.activeUsers || 0,
            tertiary:  stats.inactiveUsers || 0,
            extra1:    stats.totalLeads || 0,
            extra2:    stats.convertedLeads || 0,
          },
        };
      }

      /* USER */
      const response = await userApi.getReports({ range: dateRange, type: reportType });
      const d = response.data?.stats || response.data || {};
      return {
        cards: [
          { label: 'Total Leads',     value: d.totalLeads     || 0, icon: <Building2   size={22}/>, variant: 'primary' },
          { label: 'Converted Leads', value: d.convertedLeads || 0, icon: <TrendingUp  size={22}/>, variant: 'success' },
          { label: 'Revenue',         value: `$${(d.revenue || 0).toLocaleString()}`, icon: <DollarSign size={22}/>, variant: 'warning' },
          { label: 'Active Users',    value: d.activeUsers    || 0, icon: <Users       size={22}/>, variant: 'info'    },
        ],
        users: [],
        admins: [],
        chartStats: {
          secondary: d.convertedLeads || 0,
          tertiary:  0,
          extra1:    d.activeUsers    || 0,
          extra2:    d.totalLeads     || 0,
        },
      };
    },
    enabled: !!role,
    staleTime: 0,
  });

  /* ── Metrics ─────────────────────────────────────────────────────────── */
  const metrics = [
    { label: 'Conversion Rate',     value: '68%',    change: '+5%',   trend: 'positive' },
    { label: 'Avg. Deal Size',      value: '$2,450',  change: '+12%',  trend: 'positive' },
    { label: 'Response Time',       value: '2.4h',    change: '+0.3h', trend: 'negative' },
    { label: 'Client Satisfaction', value: '4.8/5', change: '+0.2',  trend: 'positive' },
  ];

  /* ── Filtering for data lists ────────────────────────────────────────── */
  const usersList  = roleStats?.users  || [];
  const adminsList = roleStats?.admins || [];

  const filteredUsers = React.useMemo(() => {
    if (!userSearch.trim()) return usersList;
    const q = userSearch.toLowerCase();
    return usersList.filter(u =>
      (u.firstName && u.firstName.toLowerCase().includes(q)) ||
      (u.lastName  && u.lastName.toLowerCase().includes(q))  ||
      (u.email     && u.email.toLowerCase().includes(q))     ||
      (u.phone     && u.phone.toLowerCase().includes(q))     ||
      (u.role      && u.role.toLowerCase().includes(q))
    );
  }, [usersList, userSearch]);

  const filteredAdmins = React.useMemo(() => {
    if (!adminSearch.trim()) return adminsList;
    const q = adminSearch.toLowerCase();
    return adminsList.filter(a =>
      (a.companyName && a.companyName.toLowerCase().includes(q)) ||
      (a.firstName   && a.firstName.toLowerCase().includes(q))   ||
      (a.lastName    && a.lastName.toLowerCase().includes(q))    ||
      (a.email       && a.email.toLowerCase().includes(q))       ||
      (a.phone       && a.phone.toLowerCase().includes(q))
    );
  }, [adminsList, adminSearch]);

  /* ── Exports ─────────────────────────────────────────────────────────── */
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('3D Estimator — Business Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Range: ${dateRange.replace(/_/g, ' ')}`, 14, 36);

    const body = (roleStats?.cards || []).map(c => [c.label, String(c.value)]);

    autoTable(doc, {
      startY: 44,
      head: [['Metric', 'Value']],
      body,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`Report_${role}_${dateRange}.pdf`);
  };

  const exportSummaryCsv = () => {
    const rows = (roleStats?.cards || []).map(c => ({
      metric: c.label,
      value: c.value
    }));
    metrics.forEach(m => {
      rows.push({ metric: m.label, value: m.value });
    });
    exportToCsv(`Report_Summary_${role}_${dateRange}`, [
      { label: 'Metric', key: 'metric' },
      { label: 'Value', key: 'value' }
    ], rows);
  };

  const exportUsersCsv = () => {
    exportToCsv(`Report_Users_${role}`, [
      { label: 'Name', accessor: u => [u.firstName, u.lastName].filter(Boolean).join(' ') || 'User' },
      { label: 'Email', key: 'email' },
      { label: 'Phone', key: 'phone' },
      { label: 'Role', key: 'role' },
      { label: 'Status', accessor: u => (u.isActive !== false ? 'Active' : 'Inactive') },
      { label: 'Created At', accessor: u => (u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A') },
    ], filteredUsers);
  };

  const exportAdminsCsv = () => {
    exportToCsv(`Report_Admins_${role}`, [
      { label: 'Company / Name', accessor: a => a.companyName || [a.firstName, a.lastName].filter(Boolean).join(' ') || 'Admin' },
      { label: 'Email', key: 'email' },
      { label: 'Phone', key: 'phone' },
      { label: 'Type', accessor: a => a.adminType || 'Standard' },
      { label: 'Status', accessor: a => (a.isActive ? 'Active' : 'Inactive') },
      { label: 'Created At', accessor: a => (a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'N/A') },
    ], filteredAdmins);
  };

  const getTrendIcon = (trend) => {
    if (trend === 'positive') return <ArrowUpRight size={13} />;
    if (trend === 'negative') return <ArrowDownRight size={13} />;
    return <Minus size={13} />;
  };

  const cards   = roleStats?.cards      || [];
  const cStats  = roleStats?.chartStats || {};

  /* ── JSX ─────────────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Reports &amp; Analytics</h1>
          <p>
            {role === 'superadmin' && 'Platform-wide insights across all admins, branch users, and lead pipeline'}
            {role === 'admin'      && 'Complete overview of your team and lead pipeline'}
            {role === 'user'       && 'Your personal lead and performance stats'}
          </p>
        </div>

        <div className={styles.actions}>
          {role === 'user' && (
            <select
              className={styles.select}
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
            >
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_year">Last Year</option>
            </select>
          )}

          <button
            className={styles.refreshBtn}
            onClick={() => setRefreshKey(k => k + 1)}
            title="Refresh"
          >
            <RefreshCw size={17} className={statsLoading ? styles.spinning : ''} />
          </button>

          <button className={styles.exportCsvBtn} onClick={exportSummaryCsv} title="Export CSV Summary">
            <FileSpreadsheet size={17} /> Export CSV
          </button>

          <button className={styles.exportBtn} onClick={exportPDF}>
            <Download size={17} /> Export PDF
          </button>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────── */}
      <div className={`${styles.statsGrid} ${styles[`cols${Math.min(cards.length, 6)}`]}`}>
        {statsLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`${styles.statCard} ${styles.skeleton}`} />
            ))
          : cards.map((card, i) => (
              <div key={i} className={styles.statCard}>
                <div className={`${styles.iconBox} ${styles[card.variant]}`}>
                  {card.icon}
                </div>
                <div className={styles.statBody}>
                  <p className={styles.statLabel}>{card.label}</p>
                  <h3 className={styles.statValue}>{card.value}</h3>
                </div>
              </div>
            ))
        }
      </div>

      {/* ── Charts + metrics row ─────────────────────────────────────── */}
      <div className={styles.reportsGrid}>

        {/* Chart panel */}
        <div className={styles.chartPanel}>
          <Charts stats={cStats} role={role} />
        </div>

        {/* Metrics panel */}
        <div className={styles.metricsPanel}>
          <div className={styles.panelHeader}>
            <h3>Performance Metrics</h3>
            {role === 'user' && (
              <select
                className={styles.miniSelect}
                value={reportType}
                onChange={e => setReportType(e.target.value)}
              >
                <option value="overview">Overview</option>
                <option value="leads">Leads</option>
                <option value="users">Users</option>
                <option value="revenue">Revenue</option>
              </select>
            )}
          </div>

          <div className={styles.metricList}>
            {metrics.map((m, i) => (
              <div key={i} className={styles.metricItem}>
                <span className={styles.metricLabel}>{m.label}</span>
                <div className={styles.metricRight}>
                  <span className={styles.metricValue}>{m.value}</span>
                  <span className={`${styles.badge} ${styles[m.trend]}`}>
                    {getTrendIcon(m.trend)}{m.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Team Users Breakdown (DSA & Admin) ────────────────────────── */}
      {usersList.length > 0 && (
        <div className={styles.breakdownSection}>
          <div className={styles.breakdownHeader}>
            <h3>Team Users Breakdown ({filteredUsers.length})</h3>
            <div className={styles.breakdownControls}>
              <div className={styles.searchBox}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search user by name, email, role..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>
              <button className={styles.exportCsvBtn} onClick={exportUsersCsv}>
                <FileSpreadsheet size={16} /> Export Users CSV
              </button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || 'User';
                  const isActive = u.isActive !== false;
                  return (
                    <tr key={u._id}>
                      <td>
                        <strong>{fullName}</strong>
                      </td>
                      <td>{u.email || '—'}</td>
                      <td>{u.phone || '—'}</td>
                      <td>
                        <span className={styles.roleBadge}>{u.role || 'user'}</span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${isActive ? styles.active : styles.inactive}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Admins Breakdown (SuperAdmin / DSA) ──────────────────────── */}
      {adminsList.length > 0 && (
        <div className={styles.breakdownSection}>
          <div className={styles.breakdownHeader}>
            <h3>Admins Breakdown ({filteredAdmins.length})</h3>
            <div className={styles.breakdownControls}>
              <div className={styles.searchBox}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search admin by name, company, email..."
                  value={adminSearch}
                  onChange={e => setAdminSearch(e.target.value)}
                />
              </div>
              <button className={styles.exportCsvBtn} onClick={exportAdminsCsv}>
                <FileSpreadsheet size={16} /> Export Admins CSV
              </button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Company / Admin</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map(a => {
                  const title = a.companyName || [a.firstName, a.lastName].filter(Boolean).join(' ') || 'Admin';
                  return (
                    <tr key={a._id}>
                      <td>
                        <strong>{title}</strong>
                      </td>
                      <td>{a.email || '—'}</td>
                      <td>{a.phone || '—'}</td>
                      <td>
                        <span className={styles.roleBadge}>{a.adminType || 'Standard'}</span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${a.isActive ? styles.active : styles.inactive}`}>
                          {a.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}