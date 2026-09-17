

'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  BarElement, PointElement, LineElement,
  Filler
} from 'chart.js';
import api from '@/src/lib/api';
import LoadingSpinner from './LoadingSpinner';
import styles from './Charts.module.scss';

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  BarElement, PointElement, LineElement,
  Filler
);

const CHART_TYPES = [
  { key: 'doughnut', label: '🍩 Donut' },
  { key: 'bar',      label: '📊 Bar'   },
  { key: 'line',     label: '📈 Line'  },
];

const PALETTE = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#a855f7', '#06b6d4', '#f97316', '#64748b'
];

const basePlugins = (position = 'bottom') => ({
  legend: {
    position,
    labels: {
      color: 'rgba(255,255,255,0.85)',
      usePointStyle: true,
      pointStyle: 'circle',
      padding: 18,
      font: {
        size: 12,
        family: "'Plus Jakarta Sans', sans-serif",
        weight: '700'
      },
    },
  },
  tooltip: {
    backgroundColor: 'rgba(15,23,42,0.97)',
    titleFont: { size: 13, weight: '800', family: "'Plus Jakarta Sans', sans-serif" },
    bodyFont:  { size: 12, weight: '600', family: "'Plus Jakarta Sans', sans-serif" },
    padding: 12,
    cornerRadius: 10,
    displayColors: true,
    borderColor: 'rgba(37,99,235,0.35)',
    borderWidth: 1,
  },
});

const getDoughnutOptions = () => ({
  maintainAspectRatio: false,
  cutout: '72%',
  elements: {
    arc: {
      borderWidth: 2,
      borderColor: '#0f172a',
      hoverBorderColor: '#ffffff',
      hoverOffset: 18,
    },
  },
  plugins: basePlugins('bottom'),
});

const getBarOptions = () => ({
  maintainAspectRatio: false,
  responsive: true,
  plugins: basePlugins('top'),
  scales: {
    x: {
      ticks: { color: 'rgba(255,255,255,0.65)', font: { size: 11 } },
      grid:  { color: 'rgba(255,255,255,0.04)' },
    },
    y: {
      beginAtZero: true,
      ticks: { color: 'rgba(255,255,255,0.65)', font: { size: 11 }, precision: 0 },
      grid:  { color: 'rgba(255,255,255,0.07)' },
    },
  },
});

const getLineOptions = () => ({
  maintainAspectRatio: false,
  responsive: true,
  plugins: basePlugins('top'),
  elements: {
    point: { radius: 5, hoverRadius: 8, borderWidth: 2 },
    line:  { tension: 0.45 },
  },
  scales: {
    x: {
      ticks: { color: 'rgba(255,255,255,0.65)', font: { size: 11 } },
      grid:  { color: 'rgba(255,255,255,0.04)' },
    },
    y: {
      beginAtZero: true,
      ticks: { color: 'rgba(255,255,255,0.65)', font: { size: 11 }, precision: 0 },
      grid:  { color: 'rgba(255,255,255,0.07)' },
    },
  },
});

// Adapt doughnut dataset → bar / line
function adaptDataset(dataset, chartType) {
  if (chartType === 'doughnut') return dataset;

  const colors = Array.isArray(dataset.backgroundColor)
    ? dataset.backgroundColor
    : [dataset.backgroundColor];

  if (chartType === 'bar') {
    return {
      ...dataset,
      backgroundColor: colors.map(c => c + 'BB'),
      borderColor: colors,
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
      hoverBackgroundColor: colors,
    };
  }

  // line
  return {
    ...dataset,
    backgroundColor: colors[0] + '25',
    borderColor: colors[0],
    borderWidth: 3,
    pointBackgroundColor: colors,
    pointBorderColor: '#0f172a',
    fill: true,
  };
}

export default function Charts({ stats, role: rawRole }) {
  const role = (rawRole === 'root' || rawRole === 'delegated') ? 'superadmin' : rawRole;
  const [chartType, setChartType] = useState('doughnut');

  /* ── Queries ─────────────────────────────────────────────────────────── */
  const { data: buildings, isLoading: buildingsLoading } = useQuery({
    queryKey: ['user-buildings'],
    queryFn: async () => {
      const res = await api.get('/users/buildings');
      return res.data?.data || res.data || [];
    },
    enabled: role === 'user',
    staleTime: 5 * 60 * 1000,
  });

  const { data: teamUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-team-users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data?.data || [];
    },
    enabled: role === 'admin',
    staleTime: 5 * 60 * 1000,
  });

  const { data: adminLeads, isLoading: leadsLoading } = useQuery({
    queryKey: ['admin-all-leads'],
    queryFn: async () => {
      const res = await api.get('/buildings');
      return res.data?.data || res.data || [];
    },
    enabled: role === 'admin',
    staleTime: 5 * 60 * 1000,
  });

  /* ── Build raw chart data per role ───────────────────────────────────── */
  const { title, rawData, isEmpty, isLoading } = useMemo(() => {
    /* SUPERADMIN */
    if (role === 'superadmin') {
      const values = [
        stats?.secondary || 0,  // active admins
        stats?.tertiary  || 0,  // inactive admins
        stats?.extra1    || 0,  // total users
        stats?.extra2    || 0,  // total leads
      ];
      return {
        title: 'Platform Overview',
        isLoading: false,
        isEmpty: values.every(v => v === 0),
        rawData: {
          labels: ['Active Admins', 'Inactive Admins', 'Total Users', 'Total Leads'],
          datasets: [{
            label: 'Count',
            data: values,
            backgroundColor: ['#10b981', '#ef4444', '#3b82f6', '#f59e0b'],
            borderColor: 'transparent',
            hoverOffset: 20,
          }],
        },
      };
    }

    /* ADMIN — users + lead status breakdown */
    if (role === 'admin') {
      if (usersLoading || leadsLoading) {
        return { title: 'Team & Lead Overview', isLoading: true, isEmpty: false, rawData: null };
      }

      const users  = teamUsers  || [];
      const leads  = adminLeads || [];

      const activeUsers   = users.filter(u => u.isActive).length;
      const inactiveUsers = users.length - activeUsers;

      // lead status map
      const statusMap = {};
      leads.forEach(l => {
        const s = (l.status || 'new').toLowerCase();
        statusMap[s] = (statusMap[s] || 0) + 1;
      });

      const convertedCount = leads.filter(l =>
        ['closed-won', 'converted', 'closed'].includes((l.status || '').toLowerCase())
      ).length;

      const labels = [
        'Active Users', 'Inactive Users',
        ...Object.keys(statusMap).map(k => `${k.charAt(0).toUpperCase() + k.slice(1)} Leads`),
      ];
      const values = [activeUsers, inactiveUsers, ...Object.values(statusMap)];

      return {
        title: 'Team & Lead Overview',
        isLoading: false,
        isEmpty: values.every(v => v === 0),
        rawData: {
          labels,
          datasets: [{
            label: 'Count',
            data: values,
            backgroundColor: PALETTE.slice(0, values.length),
            borderColor: 'transparent',
            hoverOffset: 20,
          }],
        },
      };
    }

    /* USER */
    if (role === 'user') {
      if (buildingsLoading) {
        return { title: 'Your Lead Statuses', isLoading: true, isEmpty: false, rawData: null };
      }

      const counts = { new: 0, contacted: 0, quoted: 0, closed: 0 };
      (buildings || []).forEach(b => {
        const s = (b.status || 'new').toLowerCase();
        const key = s.includes('closed') ? 'closed' : (counts[s] !== undefined ? s : 'new');
        counts[key]++;
      });

      return {
        title: 'Your Lead Statuses',
        isLoading: false,
        isEmpty: Object.values(counts).every(v => v === 0),
        rawData: {
          labels: ['New', 'Contacted', 'Quoted', 'Closed'],
          datasets: [{
            label: 'Leads',
            data: Object.values(counts),
            backgroundColor: ['#6366f1', '#3b82f6', '#f59e0b', '#10b981'],
            borderColor: 'transparent',
            hoverOffset: 20,
          }],
        },
      };
    }

    return { title: 'Overview', rawData: null, isEmpty: true, isLoading: false };
  }, [role, stats, buildings, teamUsers, adminLeads, buildingsLoading, usersLoading, leadsLoading]);

  /* ── Adapt dataset to selected chart type ────────────────────────────── */
  const chartData = useMemo(() => {
    if (!rawData) return null;
    return {
      ...rawData,
      datasets: rawData.datasets.map(ds => adaptDataset(ds, chartType)),
    };
  }, [rawData, chartType]);

  const chartOptions = useMemo(() => {
    if (chartType === 'doughnut') return getDoughnutOptions();
    if (chartType === 'bar')      return getBarOptions();
    return getLineOptions();
  }, [chartType]);

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className={styles.chartCard}>
      {/* Header row */}
      <div className={styles.chartHeader}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.chartToggle}>
          {CHART_TYPES.map(ct => (
            <button
              key={ct.key}
              className={`${styles.toggleBtn} ${chartType === ct.key ? styles.active : ''}`}
              onClick={() => setChartType(ct.key)}
            >
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className={styles.chartWrapper}>
        {isLoading ? (
          <LoadingSpinner size="sm" text="Loading chart…" />
        ) : !chartData || isEmpty ? (
          <div className={styles.emptyChart}>
            <span>📭</span>
            <p>No data generated yet.</p>
          </div>
        ) : chartType === 'doughnut' ? (
          <Doughnut data={chartData} options={chartOptions} />
        ) : chartType === 'bar' ? (
          <Bar    data={chartData} options={chartOptions} />
        ) : (
          <Line   data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
}