'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { userApi, adminApi, superAdminApi, api } from '@/src/lib/api';
import Charts from '@/src/components/Charts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  TrendingUp, Users, Building2, DollarSign,
  Download, RefreshCw, ArrowUpRight, ArrowDownRight,
  Minus, UserCog, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import styles from './Reports.module.scss';

export default function ReportsPage() {
  const { user } = useAuth();
  const role = (user?.role === 'root' || user?.role === 'delegated') ? 'superadmin' : user?.role;

  const [dateRange,  setDateRange]  = useState('last_30_days');
  const [reportType, setReportType] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  /* ── Role-based stats query ─────────────────────────────────────────── */
  const { data: roleStats, isLoading: statsLoading, refetch } = useQuery({
    queryKey: ['report-role-stats', role, refreshKey],
    queryFn: async () => {
      if (role === 'superadmin') {
        const res = await superAdminApi.getDashboardStats();
        const d = res.data?.data || {};
        return {
          cards: [
            { label: 'Total Admins',    value: d.totalAdmins    || 0, icon: <UserCog    size={22}/>, variant: 'primary',  change: null },
            { label: 'Active Admins',   value: d.activeAdmins   || 0, icon: <CheckCircle2 size={22}/>, variant: 'success', change: null },
            { label: 'Inactive Admins', value: d.inactiveAdmins || 0, icon: <XCircle     size={22}/>, variant: 'danger',  change: null },
            { label: 'Total Users',     value: d.totalUsers     || 0, icon: <Users        size={22}/>, variant: 'info',    change: null },
            { label: 'Total Leads',     value: d.totalLeads     || 0, icon: <Building2    size={22}/>, variant: 'warning', change: null },
          ],
          chartStats: {
            secondary: d.activeAdmins   || 0,
            tertiary:  d.inactiveAdmins || 0,
            extra1:    d.totalUsers     || 0,
            extra2:    d.totalLeads     || 0,
          },
        };
      }

      // if (role === 'admin') {
      //   const [usersRes, leadsRes] = await Promise.all([
      //     adminApi.getUsers(),
      //     api.get('/leads'),
      //   ]);
      //   const users  = usersRes.data?.data || [];
      //   const leads  = leadsRes.data?.data || leadsRes.data || [];

      //   const activeUsers   = users.filter(u => u.isActive).length;
      //   const inactiveUsers = users.length - activeUsers;

      //   const convertedLeads = leads.filter(l =>
      //     ['closed-won', 'converted', 'closed'].includes((l.status || '').toLowerCase())
      //   ).length;

      //   const pendingLeads = leads.filter(l =>
      //     ['new', 'contacted', 'quoted'].includes((l.status || '').toLowerCase())
      //   ).length;

      //   return {
      //     cards: [
      //       { label: 'Total Users',      value: users.length,    icon: <Users         size={22}/>, variant: 'primary' },
      //       { label: 'Active Users',     value: activeUsers,     icon: <CheckCircle2  size={22}/>, variant: 'success' },
      //       { label: 'Inactive Users',   value: inactiveUsers,   icon: <XCircle       size={22}/>, variant: 'danger'  },
      //       { label: 'Total Leads',      value: leads.length,    icon: <Building2     size={22}/>, variant: 'info'    },
      //       { label: 'Converted Leads',  value: convertedLeads,  icon: <TrendingUp    size={22}/>, variant: 'warning' },
      //       { label: 'Pending Leads',    value: pendingLeads,    icon: <Clock         size={22}/>, variant: 'neutral' },
      //     ],
      //     chartStats: {
      //       secondary: activeUsers,
      //       tertiary:  inactiveUsers,
      //       extra1:    leads.length,
      //       extra2:    convertedLeads,
      //     },
      //   };
      // }
      if (role === 'admin') {
        const res = await adminApi.getDashboard();
        const stats = res.data?.data?.statistics || {};

        return {
          cards: [
            {
              label: 'Total Users',
              value: stats.totalUsers || 0,
              icon: <Users size={22} />,
              variant: 'primary',
            },
            {
              label: 'Active Users',
              value: stats.activeUsers || 0,
              icon: <CheckCircle2 size={22} />,
              variant: 'success',
            },
            {
              label: 'Inactive Users',
              value: stats.inactiveUsers || 0,
              icon: <XCircle size={22} />,
              variant: 'danger',
            },
            {
              label: 'Total Leads',
              value: stats.totalLeads || 0,
              icon: <Building2 size={22} />,
              variant: 'info',
            },
            {
              label: 'Converted Leads',
              value: stats.convertedLeads || 0,
              icon: <TrendingUp size={22} />,
              variant: 'warning',
            },
            {
              label: 'Pending Leads',
              value: stats.pendingLeads || 0,
              icon: <Clock size={22} />,
              variant: 'neutral',
            },
          ],
          chartStats: {
            secondary: stats.activeUsers || 0,
            tertiary: stats.inactiveUsers || 0,
            extra1: stats.totalLeads || 0,
            extra2: stats.convertedLeads || 0,
          },
        };
      }

      // user role — fallback to userApi.getReports
      const response = await userApi.getReports({ range: dateRange, type: reportType });
      const d = response.data?.stats || response.data || {};
      return {
        cards: [
          { label: 'Total Leads',     value: d.totalLeads     || 0, icon: <Building2   size={22}/>, variant: 'primary' },
          { label: 'Converted Leads', value: d.convertedLeads || 0, icon: <TrendingUp  size={22}/>, variant: 'success' },
          { label: 'Revenue',         value: `$${(d.revenue || 0).toLocaleString()}`, icon: <DollarSign size={22}/>, variant: 'warning' },
          { label: 'Active Users',    value: d.activeUsers    || 0, icon: <Users       size={22}/>, variant: 'info'    },
        ],
        chartStats: {
          secondary: d.convertedLeads || 0,
          tertiary:  0,
          extra1:    d.activeUsers    || 0,
          extra2:    d.totalLeads     || 0,
        },
      };
    },
    enabled: !!role,
    staleTime: 2 * 60 * 1000,
  });

  /* ── Metrics (static + can be wired to API later) ───────────────────── */
  const metrics = [
    { label: 'Conversion Rate',   value: '68%',    change: '+5%',   trend: 'positive' },
    { label: 'Avg. Deal Size',    value: '$2,450',  change: '+12%',  trend: 'positive' },
    { label: 'Response Time',     value: '2.4h',    change: '+0.3h', trend: 'negative' },
    { label: 'Client Satisfaction', value: '4.8/5', change: '+0.2',  trend: 'positive' },
  ];

  /* ── Export PDF ──────────────────────────────────────────────────────── */
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
            {role === 'superadmin' && 'Platform-wide insights across all admins and users'}
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

          <button className={styles.exportBtn} onClick={exportPDF}>
            <Download size={17} /> Export PDF
          </button>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────── */}
      <div className={`${styles.statsGrid} ${styles[`cols${Math.min(cards.length, 6)}`]}`}>
        {statsLoading
          ? Array.from({ length: role === 'admin' ? 6 : 4 }).map((_, i) => (
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
    </div>
  );
}