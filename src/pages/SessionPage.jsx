import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, User, Building2, Calendar,
  FileText, AlertTriangle, List, IndianRupee, PackageSearch,
  ChevronRight, ChevronDown, ExternalLink, Copy, Check,
  CheckSquare, Square, Loader2, BookOpen, Scale,
  MessageSquare, Phone, Printer, RefreshCw, Info,
  TrendingUp, Receipt, Shield, Clock, Gavel, Lightbulb,
  Download, Plus, Minus, MessageCircle
} from 'lucide-react';
import { format } from 'date-fns';

const WA_LINK = 'http://wa.me/917204027810?text=Hi';

const BARE_ACT_LINKS = {
  GST: 'https://cbic-gst.gov.in/gst-acts.html',
  INCOME_TAX: 'https://incometaxindia.gov.in/Pages/acts/income-tax-act.aspx',
};

// ── CSV / Excel download utility ──────────────────────────────
function downloadCSV(filename, headers, rows) {
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
  };
  const lines = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Tooltip component ─────────────────────────────────────────
function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span
          className="absolute z-50 left-6 -top-1 w-56 text-xs p-2 rounded-lg shadow-lg pointer-events-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', lineHeight: 1.5 }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

export default function SessionPage() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [session, setSession]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [docStatus, setDocStatus] = useState({});
  const [replyOpen, setReplyOpen] = useState(false);
  const [copied, setCopied]     = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    const unsub = onSnapshot(doc(db, 'sessions', sessionId), (snap) => {
      if (!snap.exists()) { setError('Session not found.'); setLoading(false); return; }
      const data = { id: snap.id, ...snap.data() };
      if (data.userId !== user?.uid) { setError('Access denied.'); setLoading(false); return; }
      setSession(data);
      setDocStatus(data.documentStatus || {});
      setLoading(false);
    });
    return unsub;
  }, [sessionId, user]);

  const toggleDoc = async (docId, value) => {
    const newStatus = { ...docStatus, [docId]: value };
    setDocStatus(newStatus);
    await updateDoc(doc(db, 'sessions', sessionId), { documentStatus: newStatus });
  };

  const copyReply = async () => {
    await navigator.clipboard.writeText(session?.analysis?.draftReply || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: 'var(--accent)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading session...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <AlertTriangle size={28} className="mx-auto mb-3" style={{ color: 'var(--danger)' }} />
        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{error}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4">Back to Dashboard</button>
      </div>
    </div>
  );

  if (session?.status === 'processing') return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: 'var(--accent)' }} />
        <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Analysis in progress...</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>This may take up to 90 seconds.</p>
      </div>
    </div>
  );

  if (session?.status === 'error') return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-sm">
        <AlertTriangle size={28} className="mx-auto mb-3" style={{ color: 'var(--danger)' }} />
        <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Analysis Failed</p>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{session.errorMessage || 'An error occurred.'}</p>
        <div className="flex gap-2 justify-center">
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">Back</button>
          <button onClick={() => navigate('/session/new')} className="btn-primary"><RefreshCw size={14} /> Retry</button>
        </div>
      </div>
    </div>
  );

  const a = session?.analysis || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 page-enter">

      {/* Top Bar */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <button onClick={() => navigate('/dashboard')} className="btn-ghost mb-2" style={{ paddingLeft: 0 }}>
            <ArrowLeft size={14} /> Dashboard
          </button>
          <h1 className="font-display font-semibold" style={{ color: 'var(--text-primary)', fontSize: '1.75rem' }}>
            {session.name}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`badge ${session.actType === 'GST' ? 'badge-info' : 'badge-gold'}`}>
              {session.actType === 'GST' ? <Receipt size={11} /> : <TrendingUp size={11} />}
              {session.actType === 'GST' ? 'GST Notice' : 'Income Tax Notice'}
            </span>
            <span className="badge badge-success"><Check size={11} /> Analyzed</span>
            {a.noticeMetadata?.date && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                <Calendar size={11} className="inline mr-1" />{a.noticeMetadata.date}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => window.print()} className="btn-secondary text-xs no-print">
            <Printer size={13} /> Print
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      {a.summary && (
        <div
          className="p-5 rounded-xl mb-6"
          style={{ background: 'linear-gradient(135deg, var(--accent-bg), var(--bg-elevated))', border: '1px solid var(--accent-border)' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--accent)', color: '#fff' }}>
              <Lightbulb size={15} />
            </div>
            <div>
              <p className="font-medium text-sm mb-1" style={{ color: 'var(--accent)' }}>Plain English Summary</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{a.summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar + Main Layout ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* LEFT SIDEBAR */}
        <aside className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-20 space-y-4">

          {/* Assessee / Noticee */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <div className="section-header-icon" style={{ width: 28, height: 28 }}><User size={13} /></div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {session.actType === 'GST' ? 'Taxpayer / Noticee' : 'Assessee Details'}
              </h3>
            </div>
            <div className="px-4 py-3 space-y-0">
              {a.noticeeDetails?.name && (
                <div className="flex items-center gap-2.5 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1.5px solid var(--accent-border)' }}>
                    {a.noticeeDetails.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{a.noticeeDetails.name}</p>
                    {a.noticeeDetails.tradeName && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.noticeeDetails.tradeName}</p>}
                  </div>
                </div>
              )}
              <SidebarRow label={session.actType === 'GST' ? 'GSTIN' : 'PAN'} value={a.noticeeDetails?.gstin || a.noticeeDetails?.pan} mono />
              <SidebarRow label="Address" value={a.noticeeDetails?.address} />
              <SidebarRow label="Email" value={a.noticeeDetails?.email} />
              {session.actType === 'INCOME_TAX' && <SidebarRow label="AY" value={a.noticeeDetails?.assessmentYear} />}
              {session.actType === 'GST' && <SidebarRow label="Period" value={a.noticeeDetails?.taxPeriod} />}
            </div>
          </div>

          {/* Notice Details */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <div className="section-header-icon" style={{ width: 28, height: 28 }}><Building2 size={13} /></div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notice Details</h3>
            </div>
            <div className="px-4 py-3">
              <SidebarRow label="Type" value={a.noticeMetadata?.noticeType} />
              <SidebarRow label="DIN" value={a.noticeMetadata?.din} mono />
              <SidebarRow label="Ref No." value={a.noticeMetadata?.refNo} mono />
              <SidebarRow label="Date" value={a.noticeMetadata?.date} />
              <SidebarRow label="FY" value={a.noticeMetadata?.financialYear} />
              <SidebarRow label="AY" value={a.noticeMetadata?.assessmentYear} />
              <SidebarRow label="Issued By" value={a.noticeMetadata?.issuedBy} />
              <SidebarRow label="Jurisdiction" value={a.noticeMetadata?.jurisdiction} />
              <SidebarRow label="Ward" value={a.noticeMetadata?.ward} />
              {a.noticeMetadata?.replyDueDate && (
                <div className="mt-3 p-2.5 rounded-lg" style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>⚠ Reply Due By</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--danger)' }}>{a.noticeMetadata.replyDueDate}</p>
                </div>
              )}
            </div>
          </div>

          {/* Talk to CA */}
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl w-full transition-all duration-150 no-print"
            style={{ background: '#25D36615', border: '1.5px solid #25D36630', textDecoration: 'none' }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#25D366', color: '#fff' }}>
              <MessageCircle size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Talk to a CA</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>WhatsApp BizExpress</p>
            </div>
            <ChevronRight size={14} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
          </a>

        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 space-y-5">

          {/* Sections Invoked */}
          <SectionsCard sections={a.sectionsInvoked || []} actType={session.actType} />

          {/* Allegations */}
          {(a.allegations?.length > 0) && <AllegationsCard allegations={a.allegations} />}

          {/* Demands Table */}
          <DemandsCard demands={a.demands || []} />

          {/* Interest & Penalty */}
          {(a.interestPenalty?.length > 0) && <InterestPenaltyCard items={a.interestPenalty} />}

          {/* Total Demand */}
          {a.totalDemand && <TotalDemandCard data={a.totalDemand} />}

          {/* Documents Required */}
          <DocumentsCard docs={a.documentsRequired || []} docStatus={docStatus} onToggle={toggleDoc} />

          {/* Options Available */}
          {(a.nextSteps?.length > 0) && <NextStepsCard steps={a.nextSteps} />}

          {/* Draft Reply */}
          {a.draftReply && (
            <DraftReplyCard reply={a.draftReply} open={replyOpen} onToggle={() => setReplyOpen(v => !v)} onCopy={copyReply} copied={copied} />
          )}

          {/* BizExpress CTA */}
          <BizExpressCTA />

        </main>
      </div>
    </div>
  );
}

// ── Sidebar helper row ─────────────────────────────────────────
function SidebarRow({ label, value, mono }) {
  if (!value) return null;
  return (
    <div className="py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
      <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{label}</p>
      <p className={`text-xs font-medium mt-0.5 ${mono ? 'font-mono' : ''}`} style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{value}</p>
    </div>
  );
}

// ── Section Wrapper ───────────────────────────────────────────
function SectionWrapper({ icon, title, children, accent, badge, onDownload }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="section-header" style={{ marginBottom: 0 }}>
          <div className="section-header-icon" style={{ background: accent ? 'var(--accent-bg)' : 'var(--bg-elevated)' }}>{icon}</div>
          <h3 className="section-header-title">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {badge && <span className="badge badge-gold text-xs">{badge}</span>}
          {onDownload && (
            <button
              onClick={onDownload}
              className="btn-ghost flex items-center gap-1.5 text-xs no-print"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}
              title="Download as Excel"
            >
              <Download size={12} /> Excel
            </button>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Sections Invoked — collapsible ────────────────────────────
function SectionsCard({ sections, actType }) {
  const [expanded, setExpanded] = useState(false);
  if (sections.length === 0) return null;
  const bareActLink = BARE_ACT_LINKS[actType];

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 border-b text-left transition-colors"
        style={{ borderColor: 'var(--border)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div className="flex items-center gap-3">
          <div className="section-header-icon" style={{ background: 'var(--accent-bg)' }}><BookOpen size={15} /></div>
          <div>
            <h3 className="section-header-title">Sections Invoked</h3>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {sections.map((s, i) => (
                <span key={i} className="font-mono text-xs px-2 py-0.5 rounded-md font-semibold"
                  style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                  § {s.section}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <a
            href={bareActLink}
            target="_blank"
            rel="noopener"
            onClick={e => e.stopPropagation()}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-medium no-print"
            style={{ color: 'var(--accent)' }}
          >
            View Bare Act <ExternalLink size={11} />
          </a>
          <span className="badge badge-gold text-xs">{sections.length} Section{sections.length !== 1 ? 's' : ''}</span>
          {expanded ? <Minus size={16} style={{ color: 'var(--text-muted)' }} /> : <Plus size={16} style={{ color: 'var(--text-muted)' }} />}
        </div>
      </button>

      {/* Expanded Detail Table */}
      {expanded && (
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Act</th>
                  <th>What It Covers</th>
                  <th>Plain English</th>
                  <th>Implication</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((s, i) => (
                  <tr key={i}>
                    <td><span className="font-mono font-semibold text-sm" style={{ color: 'var(--accent)' }}>§ {s.section}</span></td>
                    <td><span className="badge badge-info text-xs">{s.act || (actType === 'GST' ? 'CGST' : 'IT Act')}</span></td>
                    <td style={{ maxWidth: 200 }}><span className="text-sm" style={{ color: 'var(--text-primary)' }}>{s.title || s.description}</span></td>
                    <td style={{ maxWidth: 200 }}><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.shortNote || '—'}</span></td>
                    <td>{s.implication && <span className="badge badge-warning text-xs">{s.implication}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex justify-end">
            <a href={bareActLink} target="_blank" rel="noopener"
              className="inline-flex items-center gap-1.5 text-xs font-medium"
              style={{ color: 'var(--accent)' }}>
              <ExternalLink size={12} /> View Full {actType === 'GST' ? 'CGST/IGST' : 'Income Tax'} Bare Act
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function AllegationsCard({ allegations }) {
  const handleDownload = () => {
    downloadCSV('allegations.csv',
      ['#', 'Ground', 'Section', 'Description', 'Amount (₹)'],
      allegations.map((a, i) => [i + 1, a.ground, a.section, a.description, a.amount || ''])
    );
  };
  return (
    <SectionWrapper icon={<AlertTriangle size={15} />} title="Allegations / Grounds" badge={`${allegations.length}`} onDownload={handleDownload}>
      <div className="space-y-3">
        {allegations.map((a, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.65rem' }}>
                  {i + 1}
                </span>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{a.ground}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {a.section && <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>§ {a.section}</span>}
                {a.amount && <span className="amount-highlight text-sm">₹{a.amount}</span>}
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', paddingLeft: '1.75rem' }}>{a.description}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

function DemandsCard({ demands }) {
  if (demands.length === 0) return null;
  const total = demands.reduce((s, d) => s + (parseFloat(d.amount?.toString().replace(/[^0-9.]/g, '')) || 0), 0);
  const handleDownload = () => {
    downloadCSV('demands.csv',
      ['#', 'Tax Head', 'Description', 'Section', 'Period', 'Amount (₹)'],
      demands.map((d, i) => [i + 1, d.taxHead, d.description, d.section, d.period, d.amount || ''])
    );
  };
  return (
    <SectionWrapper icon={<IndianRupee size={15} />} title="Demand Details" badge={`${demands.length} Items`} onDownload={handleDownload}>
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr><th>#</th><th>Tax Head</th><th>Section</th><th>Period</th><th className="text-right">Amount (₹)</th></tr>
          </thead>
          <tbody>
            {demands.map((d, i) => (
              <tr key={i}>
                <td className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                <td>
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{d.taxHead || d.description}</p>
                  {d.description && d.taxHead && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{d.description}</p>}
                </td>
                <td>{d.section && <span className="font-mono text-xs" style={{ color: 'var(--accent)' }}>§ {d.section}</span>}</td>
                <td className="text-sm">{d.period || '—'}</td>
                <td className="text-right"><span className="amount-highlight">{d.amount ? `₹${d.amount}` : '—'}</span></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="text-right font-semibold text-sm pt-3 pb-2 px-4" style={{ color: 'var(--text-primary)' }}>Subtotal</td>
              <td className="text-right pt-3 pb-2 px-4">
                <span className="amount-highlight font-bold" style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>
                  ₹{new Intl.NumberFormat('en-IN').format(Math.round(total))}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </SectionWrapper>
  );
}

function InterestPenaltyCard({ items }) {
  const handleDownload = () => {
    downloadCSV('interest-penalty.csv',
      ['Type', 'Section', 'Base Amount (₹)', 'Rate', 'Period', 'Estimated Amount (₹)'],
      items.map(i => [i.type, i.section, i.baseAmount, i.rate, i.period, i.estimatedAmount || ''])
    );
  };
  return (
    <SectionWrapper icon={<Clock size={15} />} title="Estimated Interest & Penalty" onDownload={handleDownload}>
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr><th>Type</th><th>Section</th><th>Base Amount</th><th>Rate</th><th>Period</th><th className="text-right">Estimated (₹)</th></tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td><span className={`badge ${item.type?.toLowerCase().includes('penalty') ? 'badge-danger' : 'badge-warning'}`}>{item.type}</span></td>
                <td>{item.section && <span className="font-mono text-xs" style={{ color: 'var(--accent)' }}>§ {item.section}</span>}</td>
                <td className="amount-highlight">{item.baseAmount ? `₹${item.baseAmount}` : '—'}</td>
                <td className="text-sm">{item.rate || '—'}</td>
                <td className="text-sm">{item.period || '—'}</td>
                <td className="text-right amount-highlight" style={{ color: 'var(--warning)' }}>{item.estimatedAmount ? `₹${item.estimatedAmount}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs mt-3 flex items-start gap-2 p-2.5 rounded-lg" style={{ color: 'var(--text-secondary)', background: 'var(--warning-bg)' }}>
        <Info size={13} style={{ flexShrink: 0, marginTop: 1, color: 'var(--warning)' }} />
        Estimates only. Actual amounts may vary based on payment date, applicable rates, and officer discretion.
      </p>
    </SectionWrapper>
  );
}

function TotalDemandCard({ data }) {
  const items = [
    { label: 'Tax / Duty', value: data.tax, color: 'var(--info)' },
    { label: 'Interest',   value: data.interest, color: 'var(--warning)' },
    { label: 'Penalty',    value: data.penalty,  color: 'var(--danger)' },
    { label: 'Other',      value: data.other,    color: 'var(--text-muted)' },
  ].filter(i => i.value && i.value !== '0');

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid var(--accent-border)', background: 'var(--accent-bg)' }}>
      <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--accent-border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)', color: '#fff' }}>
          <Scale size={15} />
        </div>
        <h3 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Total Demand Summary</h3>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {items.map((item, i) => (
            <div key={i} className="card p-4">
              <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
              <p className="font-mono font-bold text-lg" style={{ color: item.color }}>₹{item.value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Grand Total Demand</span>
          <span className="font-display font-bold text-2xl" style={{ color: 'var(--accent)', letterSpacing: '-0.02em' }}>₹{data.total}</span>
        </div>
        <p className="text-xs mt-2.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <Info size={11} /> Amounts extracted from notice. Verify with original document before taking action.
        </p>
      </div>
    </div>
  );
}

function DocumentsCard({ docs, docStatus, onToggle }) {
  if (docs.length === 0) return null;
  const doneCount = docs.filter((_, i) => docStatus[`doc_${i}`]).length;
  const progress  = Math.round((doneCount / docs.length) * 100);

  const handleDownload = () => {
    downloadCSV('documents-required.csv',
      ['#', 'Document', 'Description', 'Relevance', 'Importance', 'Ready'],
      docs.map((d, i) => [i + 1, d.document, d.description, d.relevance, d.urgency, docStatus[`doc_${i}`] ? 'Yes' : 'No'])
    );
  };

  return (
    <SectionWrapper
      icon={<PackageSearch size={15} />}
      title="Documents Required"
      badge={`${doneCount}/${docs.length} Ready`}
      onDownload={handleDownload}
    >
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-sm font-mono font-semibold" style={{ color: progress === 100 ? 'var(--success)' : 'var(--accent)' }}>{progress}%</span>
      </div>

      {/* Compact table */}
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th className="w-8">#</th>
              <th>Document</th>
              <th className="hide-mobile">Description</th>
              <th>Importance</th>
              <th className="text-center w-20">Ready?</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc, i) => {
              const key  = `doc_${i}`;
              const done = !!docStatus[key];
              return (
                <tr
                  key={i}
                  onClick={() => onToggle(key, !done)}
                  className="cursor-pointer transition-colors"
                  style={{ background: done ? 'var(--success-bg)' : undefined, opacity: done ? 0.75 : 1 }}
                >
                  <td className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-medium"
                        style={{ color: done ? 'var(--success)' : 'var(--text-primary)', textDecoration: done ? 'line-through' : 'none' }}
                      >
                        {doc.document}
                      </span>
                      {doc.relevance && (
                        <Tooltip text={doc.relevance}>
                          <Info size={12} style={{ color: 'var(--text-muted)', flexShrink: 0, cursor: 'help' }} />
                        </Tooltip>
                      )}
                    </div>
                  </td>
                  <td className="hide-mobile">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{doc.description || '—'}</span>
                  </td>
                  <td>
                    {doc.urgency && (
                      <span className={`badge text-xs ${
                        doc.urgency === 'high' ? 'badge-danger' :
                        doc.urgency === 'medium' ? 'badge-warning' : 'badge-success'
                      }`}>{doc.urgency}</span>
                    )}
                  </td>
                  <td className="text-center">
                    <span style={{ color: done ? 'var(--success)' : 'var(--text-muted)' }}>
                      {done ? <CheckSquare size={17} /> : <Square size={17} />}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {doneCount === docs.length && docs.length > 0 && (
        <div className="mt-4 p-3 rounded-lg flex items-center gap-2 text-sm font-medium"
          style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <Check size={15} /> All documents ready! You're prepared for the next step.
        </div>
      )}
    </SectionWrapper>
  );
}

function NextStepsCard({ steps }) {
  return (
    <SectionWrapper icon={<Lightbulb size={15} />} title="Options Available to You" badge={`${steps.length} Option${steps.length !== 1 ? 's' : ''}`} accent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((step, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1.5px solid var(--accent-border)' }}>
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{step.option || step.title}</p>
                {step.timeline && <span className="badge badge-info text-xs"><Clock size={10} /> {step.timeline}</span>}
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{step.description}</p>
            {(step.pros || step.cons) && (
              <div className="grid grid-cols-2 gap-2">
                {step.pros && (
                  <div className="p-2 rounded-lg" style={{ background: 'var(--success-bg)' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--success)' }}>✓ Pros</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{step.pros}</p>
                  </div>
                )}
                {step.cons && (
                  <div className="p-2 rounded-lg" style={{ background: 'var(--danger-bg)' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--danger)' }}>✗ Cons</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{step.cons}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

function DraftReplyCard({ reply, open, onToggle, onCopy, copied }) {
  return (
    <div className="card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 border-b text-left transition-colors"
        style={{ borderColor: 'var(--border)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div className="section-header" style={{ marginBottom: 0 }}>
          <div className="section-header-icon"><MessageSquare size={15} /></div>
          <div>
            <h3 className="section-header-title">Draft Reply</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI-generated — review with your CA before sending</p>
          </div>
        </div>
        <ChevronDown size={16} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
      </button>

      {open && (
        <div className="p-5">
          <div className="flex items-start gap-3 p-3.5 rounded-lg mb-4"
            style={{ background: 'var(--warning-bg)', border: '1px solid rgba(251,176,64,0.25)' }}>
            <Shield size={15} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <strong>Disclaimer:</strong> This draft reply is AI-generated for informational purposes only.
              It does not constitute legal or tax advice. Please review and finalize with a qualified Chartered Accountant before submitting to any authority.
            </p>
          </div>
          <div
            className="p-5 rounded-xl mb-4 font-body text-sm leading-loose whitespace-pre-wrap"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', maxHeight: 500, overflowY: 'auto' }}
          >
            {reply}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={onCopy} className="btn-secondary gap-2">
              {copied ? <><Check size={14} style={{ color: 'var(--success)' }} /> Copied!</> : <><Copy size={14} /> Copy to Clipboard</>}
            </button>
            <a href={WA_LINK} target="_blank" rel="noopener" className="btn-primary gap-2">
              <MessageCircle size={14} /> Review with CA on WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function BizExpressCTA() {
  return (
    <div className="p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-5"
      style={{ background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-subtle))', border: '1px solid var(--border)' }}>
      <img
        src="https://bizexpress.in/wp-content/uploads/2021/08/BizE-Logo-HD.png"
        alt="BizExpress"
        className="h-10 w-auto object-contain flex-shrink-0"
        onError={e => e.target.style.display = 'none'}
      />
      <div className="flex-1">
        <p className="font-display font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
          Don't have a CA? Let BizExpress handle it.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Our expert CAs and tax professionals can respond to this notice, negotiate with authorities, and protect your interests. No hassle, end-to-end.
        </p>
      </div>
      <a href={WA_LINK} target="_blank" rel="noopener" className="btn-primary flex-shrink-0">
        <MessageCircle size={14} /> WhatsApp BizExpress
      </a>
    </div>
  );
}
