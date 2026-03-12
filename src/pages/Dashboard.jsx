import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  collection, query, where, orderBy, onSnapshot, doc, deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Plus, ArrowRight, Receipt, FileText, TrendingUp,
  Calendar, Building, Trash2, Search, Filter,
  AlertCircle, Clock, CheckCircle, Loader2,
  IndianRupee, Hash, ChevronRight, BookOpen
} from 'lucide-react';
import { format } from 'date-fns';

const ACT_TYPES = [
  {
    id: 'GST',
    label: 'GST',
    fullName: 'Goods & Services Tax',
    icon: <Receipt size={18} />,
    color: '#2563EB',
    bg: 'rgba(37,99,235,0.08)',
    border: 'rgba(37,99,235,0.2)',
    desc: 'CGST, IGST, SGST Notices',
  },
  {
    id: 'INCOME_TAX',
    label: 'Income Tax',
    fullName: 'Income Tax Act, 1961',
    icon: <TrendingUp size={18} />,
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.2)',
    desc: 'Assessment, Scrutiny Notices',
  },
];

const STATUS_CONFIG = {
  processing: { label: 'Analyzing', icon: <Loader2 size={12} className="animate-spin" />, cls: 'badge-warning' },
  complete:   { label: 'Complete',  icon: <CheckCircle size={12} />,                       cls: 'badge-success' },
  error:      { label: 'Failed',    icon: <AlertCircle size={12} />,                       cls: 'badge-danger' },
};

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab]   = useState('GST');
  const [sessions, setSessions]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting]     = useState(null);

  const firstName = profile?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Live session listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const filtered = sessions
    .filter(s => s.actType === activeTab)
    .filter(s => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name?.toLowerCase().includes(q) ||
        s.analysis?.noticeeDetails?.name?.toLowerCase().includes(q) ||
        s.analysis?.shortDescription?.toLowerCase().includes(q) ||
        s.analysis?.noticeMetadata?.refNo?.toLowerCase().includes(q)
      );
    });

  const currentActSessions = sessions.filter(s => s.actType === activeTab);
  const stats = {
    total: currentActSessions.length,
    complete: currentActSessions.filter(s => s.status === 'complete').length,
    totalDemand: currentActSessions.reduce((sum, s) => {
      const t = s.analysis?.totalDemand?.total;
      return sum + (parseFloat(t?.toString().replace(/[^0-9.]/g, '')) || 0);
    }, 0),
  };

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    if (!confirm('Delete this session? This cannot be undone.')) return;
    setDeleting(sessionId);
    try {
      await deleteDoc(doc(db, 'sessions', sessionId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const formatAmount = (n) => {
    if (!n || n === 0) return '—';
    return '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 page-enter">

      {/* Greeting */}
      <div className="mb-8">
        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{greeting},</p>
        <h1 className="font-display font-semibold" style={{ color: 'var(--text-primary)', fontSize: '2rem' }}>
          {firstName} <span style={{ color: 'var(--accent)' }}>·</span> Dashboard
        </h1>
        {profile?.company && (
          <p className="text-sm mt-1 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <Building size={13} />
            {profile.company}
          </p>
        )}
      </div>

      {/* Act Type Tabs */}
      <div className="flex items-center gap-3 mb-6">
        {ACT_TYPES.map((act) => (
          <button
            key={act.id}
            onClick={() => setActiveTab(act.id)}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: activeTab === act.id ? act.bg : 'var(--bg-card)',
              border: `1.5px solid ${activeTab === act.id ? act.border : 'var(--border)'}`,
              color: activeTab === act.id ? act.color : 'var(--text-secondary)',
              boxShadow: activeTab === act.id ? `0 2px 12px ${act.bg}` : 'none',
            }}
          >
            {act.icon}
            <span>{act.label}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
              style={{
                background: activeTab === act.id ? act.border : 'var(--bg-elevated)',
                color: activeTab === act.id ? act.color : 'var(--text-muted)',
              }}
            >
              {sessions.filter(s => s.actType === act.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<Hash size={16} />}
          label="Total Sessions"
          value={stats.total}
        />
        <StatCard
          icon={<CheckCircle size={16} />}
          label="Analyzed"
          value={stats.complete}
          color="var(--success)"
        />
        <StatCard
          icon={<IndianRupee size={16} />}
          label="Total Demand"
          value={formatAmount(stats.totalDemand)}
          mono
        />
        <StatCard
          icon={<Calendar size={16} />}
          label="This Month"
          value={sessions.filter(s => {
            const d = s.createdAt?.toDate?.();
            return d && d.getMonth() === new Date().getMonth() && s.actType === activeTab;
          }).length}
        />
      </div>

      {/* Session Table Section */}
      <div className="card overflow-hidden">
        {/* Table Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div className="section-header-icon">
              <BookOpen size={15} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                {ACT_TYPES.find(a => a.id === activeTab)?.fullName} Sessions
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {ACT_TYPES.find(a => a.id === activeTab)?.desc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search sessions..."
                className="input-field pl-9 py-2 text-sm"
                style={{ width: 220, padding: '0.45rem 0.75rem 0.45rem 2.25rem' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Add New */}
            <button
              onClick={() => navigate('/session/new', { state: { actType: activeTab } })}
              className="btn-primary text-xs"
              style={{ padding: '0.5rem 1rem', gap: 6 }}
            >
              <Plus size={14} strokeWidth={2.5} />
              Add New
            </button>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-8">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-4 mb-4">
                <div className="skeleton h-4 w-6 rounded" />
                <div className="skeleton h-4 flex-1 rounded" />
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-4 w-20 rounded" />
                <div className="skeleton h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            actType={activeTab}
            onAdd={() => navigate('/session/new', { state: { actType: activeTab } })}
            hasSearch={!!searchQuery}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th className="w-10">#</th>
                  <th>Session Name</th>
                  <th className="hide-mobile">Noticee</th>
                  <th className="hide-mobile">Type</th>
                  <th className="hide-mobile">Date</th>
                  <th>Sections</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="w-24 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((session, idx) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    index={idx + 1}
                    onGoTo={() => navigate(`/session/${session.id}`)}
                    onDelete={(e) => handleDelete(e, session.id)}
                    isDeleting={deleting === session.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help Card */}
      <div
        className="mt-4 p-5 rounded-xl flex items-start gap-4"
        style={{
          background: 'var(--accent-bg)',
          border: '1px solid var(--accent-border)',
        }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <AlertCircle size={16} />
        </div>
        <div>
          <p className="font-medium text-sm mb-0.5" style={{ color: 'var(--accent)' }}>
            Need a CA to handle this notice?
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            BizExpress has a network of qualified CAs ready to help. Let us take the complexity off your hands.{' '}
            <a
              href={import.meta.env.VITE_BIZEXPRESS_CONTACT || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold inline-flex items-center gap-1"
              style={{ color: 'var(--accent)' }}
            >
              Contact BizExpress <ChevronRight size={13} />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, mono }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: color || 'var(--accent)' }}>{icon}</span>
        <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
      </div>
      <p
        className={`text-2xl font-bold ${mono ? 'font-mono' : 'font-display'}`}
        style={{ color: color || 'var(--text-primary)', letterSpacing: mono ? '-0.02em' : '-0.02em' }}
      >
        {value}
      </p>
    </div>
  );
}

function SessionRow({ session, index, onGoTo, onDelete, isDeleting }) {
  const analysis = session.analysis || {};
  const meta = analysis.noticeMetadata || {};
  const noticee = analysis.noticeeDetails || {};

  const sections = analysis.sectionsInvoked || [];
  const totalDemand = analysis.totalDemand?.total;

  const statusCfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.complete;

  const dateStr = meta.date || (session.createdAt?.toDate?.()
    ? format(session.createdAt.toDate(), 'dd MMM yyyy')
    : '—');

  const sectionList = sections.slice(0, 3).map(s => s.section).join(', ');

  return (
    <tr
      onClick={onGoTo}
      className="cursor-pointer transition-colors duration-100"
      style={{ color: 'var(--text-secondary)' }}
    >
      <td className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{index}</td>
      <td>
        <div>
          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{session.name}</p>
          {meta.refNo && <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{meta.refNo}</p>}
        </div>
      </td>
      <td className="hide-mobile">
        <span className="text-sm">{noticee.name || '—'}</span>
        {noticee.pan && <span className="block text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{noticee.pan || noticee.gstin}</span>}
      </td>
      <td className="hide-mobile">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {analysis.noticeType || '—'}
        </span>
      </td>
      <td className="hide-mobile">
        <span className="text-sm">{dateStr}</span>
      </td>
      <td>
        {sectionList
          ? <span className="text-xs font-mono" style={{ color: 'var(--accent)' }}>{sectionList}{sections.length > 3 ? ` +${sections.length - 3}` : ''}</span>
          : <span style={{ color: 'var(--text-muted)' }}>—</span>
        }
      </td>
      <td>
        <span className="amount-highlight text-sm">
          {totalDemand ? `₹${totalDemand}` : '—'}
        </span>
      </td>
      <td>
        <span className={`badge ${statusCfg.cls}`}>
          {statusCfg.icon}
          {statusCfg.label}
        </span>
      </td>
      <td>
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={e => { e.stopPropagation(); if (session.status !== 'processing') onGoTo(); }}
            className="btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1"
            style={{ color: 'var(--accent)', fontSize: '0.75rem' }}
          >
            Go To <ArrowRight size={12} />
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
        </div>
      </td>
    </tr>
  );
}

function EmptyState({ actType, onAdd, hasSearch }) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center py-14 px-4 text-center">
        <Search size={32} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mb-3" />
        <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No sessions match your search</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Try a different name, noticee, or reference number</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center py-16 px-4 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--accent-bg)', border: '1.5px solid var(--accent-border)' }}
      >
        <FileText size={24} style={{ color: 'var(--accent)' }} />
      </div>
      <p className="font-display font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
        No {actType} sessions yet
      </p>
      <p className="text-sm mb-5" style={{ color: 'var(--text-muted)', maxWidth: 320 }}>
        Upload a {actType} notice to start your first analysis session.
        It takes less than a minute.
      </p>
      <button onClick={onAdd} className="btn-primary">
        <Plus size={15} /> Start First Session
      </button>
    </div>
  );
}
