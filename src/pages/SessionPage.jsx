import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Download, User, Building2, Hash, Calendar,
  FileText, AlertTriangle, List, IndianRupee, PackageSearch,
  ChevronRight, ChevronDown, ExternalLink, Copy, Check,
  CheckSquare, Square, Loader2, BookOpen, Scale,
  MessageSquare, Phone, Printer, RefreshCw, Info,
  TrendingUp, Receipt, Shield, Clock, Gavel, Lightbulb
} from 'lucide-react';
import { format } from 'date-fns';

// Bare Act Links
const BARE_ACT_LINKS = {
  GST: {
    base: 'https://cbic-gst.gov.in/gst-acts.html',
    acts: {
      'CGST': 'https://cbic-gst.gov.in/pdf/01CGST-ACTupdatedupto2023.pdf',
      'IGST': 'https://cbic-gst.gov.in/pdf/03IGST-ACTupdatedupto2023.pdf',
      'SGST': 'https://cbic-gst.gov.in/gst-acts.html',
      'default': 'https://cbic-gst.gov.in/gst-acts.html',
    }
  },
  INCOME_TAX: {
    base: 'https://incometaxindia.gov.in/Pages/acts/income-tax-act.aspx',
    acts: {
      'IT Act': 'https://incometaxindia.gov.in/Pages/acts/income-tax-act.aspx',
      'Income Tax': 'https://incometaxindia.gov.in/Pages/acts/income-tax-act.aspx',
      'default': 'https://incometaxindia.gov.in/Pages/acts/income-tax-act.aspx',
    }
  }
};

export default function SessionPage() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [docStatus, setDocStatus] = useState({});
  const [replyOpen, setReplyOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Live session listener
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
    const reply = session?.analysis?.draftReply || '';
    await navigator.clipboard.writeText(reply);
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
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{session.errorMessage || 'An error occurred during analysis.'}</p>
        <div className="flex gap-2 justify-center">
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">Back</button>
          <button onClick={() => navigate('/session/new')} className="btn-primary"><RefreshCw size={14} /> Retry</button>
        </div>
      </div>
    </div>
  );

  const a = session?.analysis || {};

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 page-enter">

      {/* Top Bar */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-ghost mb-2"
            style={{ paddingLeft: 0 }}
          >
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
                <Calendar size={11} className="inline mr-1" />
                {a.noticeMetadata.date}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => window.print()} className="btn-secondary text-xs no-print">
            <Printer size={13} /> Print Report
          </button>
        </div>
      </div>

      {/* Summary Card */}
      {a.summary && (
        <div
          className="p-5 rounded-xl mb-6"
          style={{
            background: 'linear-gradient(135deg, var(--accent-bg), var(--bg-elevated))',
            border: '1px solid var(--accent-border)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <Lightbulb size={15} />
            </div>
            <div>
              <p className="font-medium text-sm mb-1" style={{ color: 'var(--accent)' }}>Plain English Summary</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{a.summary}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">

        {/* Row 1: Noticee + Notice Meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <NoticeeCard data={a.noticeeDetails || {}} actType={session.actType} />
          <NoticeMetaCard data={a.noticeMetadata || {}} />
        </div>

        {/* Sections Invoked */}
        <SectionsCard sections={a.sectionsInvoked || []} actType={session.actType} />

        {/* Allegations / Grounds */}
        {(a.allegations?.length > 0) && (
          <AllegationsCard allegations={a.allegations} />
        )}

        {/* Demands Table */}
        <DemandsCard demands={a.demands || []} />

        {/* Interest & Penalty */}
        {(a.interestPenalty?.length > 0) && (
          <InterestPenaltyCard items={a.interestPenalty} />
        )}

        {/* Total Demand */}
        {a.totalDemand && (
          <TotalDemandCard data={a.totalDemand} />
        )}

        {/* Documents Required */}
        <DocumentsCard
          docs={a.documentsRequired || []}
          docStatus={docStatus}
          onToggle={toggleDoc}
        />

        {/* Options Available */}
        {(a.nextSteps?.length > 0) && (
          <NextStepsCard steps={a.nextSteps} />
        )}

        {/* Draft Reply */}
        {a.draftReply && (
          <DraftReplyCard
            reply={a.draftReply}
            open={replyOpen}
            onToggle={() => setReplyOpen(v => !v)}
            onCopy={copyReply}
            copied={copied}
          />
        )}

        {/* BizExpress CTA */}
        <BizExpressCTA />
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function SectionWrapper({ icon, title, children, accent, badge }) {
  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="section-header" style={{ marginBottom: 0 }}>
          <div className="section-header-icon" style={{ background: accent ? 'var(--accent-bg)' : 'var(--bg-elevated)' }}>
            {icon}
          </div>
          <h3 className="section-header-title">{title}</h3>
        </div>
        {badge && <span className="badge badge-gold text-xs">{badge}</span>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono, href }) {
  if (!value) return null;
  return (
    <div className="flex items-start py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="text-xs uppercase tracking-wide w-36 flex-shrink-0 pt-0.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      {href
        ? <a href={href} target="_blank" rel="noopener" className="text-sm flex items-center gap-1" style={{ color: 'var(--accent)' }}>
            {value} <ExternalLink size={11} />
          </a>
        : <span className={`text-sm font-medium ${mono ? 'font-mono' : ''}`} style={{ color: 'var(--text-primary)' }}>
            {value}
          </span>
      }
    </div>
  );
}

function NoticeeCard({ data, actType }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
        <div className="section-header-icon"><User size={15} /></div>
        <h3 className="section-header-title">
          {actType === 'GST' ? 'Taxpayer / Noticee' : 'Assessee Details'}
        </h3>
      </div>
      <div className="px-5 py-3">
        {data.name && (
          <div className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1.5px solid var(--accent-border)' }}>
              {data.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{data.name}</p>
              {data.tradeName && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{data.tradeName}</p>}
            </div>
          </div>
        )}
        <InfoRow label={actType === 'GST' ? 'GSTIN' : 'PAN'} value={data.gstin || data.pan} mono />
        <InfoRow label="Address" value={data.address} />
        <InfoRow label="Email" value={data.email} />
        <InfoRow label="Phone" value={data.phone} />
        {actType === 'INCOME_TAX' && <InfoRow label="AY" value={data.assessmentYear} />}
        {actType === 'GST' && <InfoRow label="Tax Period" value={data.taxPeriod} />}
      </div>
    </div>
  );
}

function NoticeMetaCard({ data }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
        <div className="section-header-icon"><Building2 size={15} /></div>
        <h3 className="section-header-title">Notice Details</h3>
      </div>
      <div className="px-5 py-3">
        <InfoRow label="Notice Type"    value={data.noticeType} />
        <InfoRow label="DIN"            value={data.din} mono />
        <InfoRow label="Reference No."  value={data.refNo} mono />
        <InfoRow label="Date of Notice" value={data.date} />
        <InfoRow label="Financial Year" value={data.financialYear} />
        <InfoRow label="Assessment Year" value={data.assessmentYear} />
        <InfoRow label="Issued By"      value={data.issuedBy} />
        <InfoRow label="Designation"    value={data.designation} />
        <InfoRow label="Jurisdiction"   value={data.jurisdiction} />
        <InfoRow label="Ward / Range"   value={data.ward} />
        <InfoRow label="Reply Due By"   value={data.replyDueDate} />
      </div>
    </div>
  );
}

function SectionsCard({ sections, actType }) {
  const links = BARE_ACT_LINKS[actType] || BARE_ACT_LINKS.GST;
  if (sections.length === 0) return null;

  return (
    <SectionWrapper
      icon={<BookOpen size={15} />}
      title="Sections Invoked"
      badge={`${sections.length} Section${sections.length !== 1 ? 's' : ''}`}
      accent
    >
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Section</th>
              <th>Act</th>
              <th>What It Covers</th>
              <th>Implication</th>
              <th className="text-right">Bare Act</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s, i) => {
              const actLink = links.acts[s.act] || links.acts['default'] || links.base;
              return (
                <tr key={i}>
                  <td>
                    <span className="font-mono font-semibold text-sm" style={{ color: 'var(--accent)' }}>
                      {s.section}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-info text-xs">{s.act || (actType === 'GST' ? 'CGST' : 'IT Act')}</span>
                  </td>
                  <td className="font-medium" style={{ color: 'var(--text-primary)', maxWidth: 220 }}>
                    {s.description || s.title}
                    {s.shortNote && <p className="text-xs mt-0.5 font-normal" style={{ color: 'var(--text-muted)' }}>{s.shortNote}</p>}
                  </td>
                  <td style={{ maxWidth: 200 }}>
                    {s.implication || s.penalty && (
                      <span className="badge badge-warning">{s.implication || s.penalty}</span>
                    )}
                  </td>
                  <td className="text-right">
                    <a
                      href={actLink}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1 text-xs font-medium"
                      style={{ color: 'var(--accent)' }}
                    >
                      View <ExternalLink size={11} />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionWrapper>
  );
}

function AllegationsCard({ allegations }) {
  return (
    <SectionWrapper
      icon={<Gavel size={15} />}
      title="Allegations & Grounds"
      badge={`${allegations.length} Ground${allegations.length !== 1 ? 's' : ''}`}
    >
      <div className="space-y-3">
        {allegations.map((a, i) => (
          <div
            key={i}
            className="flex gap-4 p-4 rounded-xl"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
              style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
            >
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {a.ground || a.title || `Ground ${i + 1}`}
                </p>
                {a.section && (
                  <span className="badge badge-gold flex-shrink-0">§ {a.section}</span>
                )}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {a.description}
              </p>
              {a.amount && (
                <p className="text-xs mt-2 font-mono font-semibold" style={{ color: 'var(--danger)' }}>
                  Alleged Tax: ₹{a.amount}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

function DemandsCard({ demands }) {
  if (demands.length === 0) return null;
  const total = demands.reduce((s, d) => s + (parseFloat(d.amount?.toString().replace(/[^0-9.]/g, '')) || 0), 0);

  return (
    <SectionWrapper
      icon={<IndianRupee size={15} />}
      title="Demand Details"
      badge={demands.length + ' line items'}
      accent
    >
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>#</th>
              <th>Tax Head / Description</th>
              <th>Section</th>
              <th>Period</th>
              <th className="text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {demands.map((d, i) => (
              <tr key={i}>
                <td className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                <td>
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {d.taxHead || d.description}
                  </p>
                  {d.description && d.taxHead && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{d.description}</p>
                  )}
                </td>
                <td>
                  {d.section && (
                    <span className="font-mono text-xs" style={{ color: 'var(--accent)' }}>§ {d.section}</span>
                  )}
                </td>
                <td className="text-sm">{d.period || '—'}</td>
                <td className="text-right">
                  <span className="amount-highlight" style={{ color: 'var(--text-primary)' }}>
                    {d.amount ? `₹${d.amount}` : '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="text-right font-semibold text-sm pt-3 pb-2 px-4" style={{ color: 'var(--text-primary)' }}>
                Subtotal
              </td>
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
  return (
    <SectionWrapper icon={<Clock size={15} />} title="Estimated Interest & Penalty">
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Type</th>
              <th>Section</th>
              <th>Base Amount</th>
              <th>Rate</th>
              <th>Period</th>
              <th className="text-right">Estimated (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td>
                  <span className={`badge ${item.type?.toLowerCase().includes('penalty') ? 'badge-danger' : 'badge-warning'}`}>
                    {item.type}
                  </span>
                </td>
                <td>
                  {item.section && (
                    <span className="font-mono text-xs" style={{ color: 'var(--accent)' }}>§ {item.section}</span>
                  )}
                </td>
                <td className="amount-highlight">{item.baseAmount ? `₹${item.baseAmount}` : '—'}</td>
                <td className="text-sm">{item.rate || '—'}</td>
                <td className="text-sm">{item.period || '—'}</td>
                <td className="text-right amount-highlight" style={{ color: 'var(--warning)' }}>
                  {item.estimatedAmount ? `₹${item.estimatedAmount}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs mt-3 flex items-start gap-2" style={{ color: 'var(--text-muted)', background: 'var(--warning-bg)', padding: '0.5rem 0.75rem', borderRadius: 8 }}>
        <Info size={13} style={{ flexShrink: 0, marginTop: 1, color: 'var(--warning)' }} />
        These are estimates. Actual interest and penalty may vary based on date of payment, applicable rates, and officer discretion.
      </p>
    </SectionWrapper>
  );
}

function TotalDemandCard({ data }) {
  const items = [
    { label: 'Tax / Duty',        value: data.tax,      color: 'var(--info)' },
    { label: 'Interest',          value: data.interest, color: 'var(--warning)' },
    { label: 'Penalty',           value: data.penalty,  color: 'var(--danger)' },
    { label: 'Other Charges',     value: data.other,    color: 'var(--text-muted)' },
  ].filter(i => i.value && i.value !== '0');

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: '1.5px solid var(--accent-border)',
        background: 'var(--accent-bg)',
      }}
    >
      <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--accent-border)' }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Scale size={15} />
        </div>
        <h3 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
          Total Demand Summary
        </h3>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {items.map((item, i) => (
            <div key={i} className="card p-4">
              <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
              <p className="font-mono font-bold text-lg" style={{ color: item.color }}>
                ₹{item.value}
              </p>
            </div>
          ))}
        </div>
        <div
          className="flex items-center justify-between p-4 rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Grand Total Demand</span>
          <span
            className="font-display font-bold text-2xl"
            style={{ color: 'var(--accent)', letterSpacing: '-0.02em' }}
          >
            ₹{data.total}
          </span>
        </div>
        <p className="text-xs mt-2.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <Info size={11} />
          Amounts extracted from notice. Verify with original document before taking action.
        </p>
      </div>
    </div>
  );
}

function DocumentsCard({ docs, docStatus, onToggle }) {
  if (docs.length === 0) return null;
  const doneCount = docs.filter((_, i) => docStatus[`doc_${i}`]).length;
  const progress = Math.round((doneCount / docs.length) * 100);

  return (
    <SectionWrapper
      icon={<PackageSearch size={15} />}
      title="Documents Required"
      badge={`${doneCount}/${docs.length} Ready`}
    >
      {/* Progress */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-sm font-mono font-semibold" style={{ color: progress === 100 ? 'var(--success)' : 'var(--accent)' }}>
          {progress}%
        </span>
      </div>

      <div className="space-y-2.5">
        {docs.map((doc, i) => {
          const key   = `doc_${i}`;
          const done  = !!docStatus[key];
          return (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-150"
              style={{
                background: done ? 'var(--success-bg)' : 'var(--bg-elevated)',
                border: `1.5px solid ${done ? 'rgba(52,211,153,0.25)' : 'var(--border)'}`,
              }}
              onClick={() => onToggle(key, !done)}
            >
              <div className="flex-shrink-0 mt-0.5" style={{ color: done ? 'var(--success)' : 'var(--text-muted)' }}>
                {done ? <CheckSquare size={18} /> : <Square size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="font-medium text-sm"
                    style={{
                      color: done ? 'var(--success)' : 'var(--text-primary)',
                      textDecoration: done ? 'line-through' : 'none',
                      opacity: done ? 0.7 : 1,
                    }}
                  >
                    {doc.document}
                  </p>
                  {doc.urgency && (
                    <span className={`badge flex-shrink-0 text-xs ${
                      doc.urgency === 'high' ? 'badge-danger' :
                      doc.urgency === 'medium' ? 'badge-warning' : 'badge-success'
                    }`}>
                      {doc.urgency}
                    </span>
                  )}
                </div>
                {doc.description && (
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{doc.description}</p>
                )}
                {doc.relevance && (
                  <p className="text-xs mt-1.5 flex items-center gap-1.5"
                    style={{ color: 'var(--accent)', background: 'var(--accent-bg)', padding: '0.2rem 0.5rem', borderRadius: 4, display: 'inline-flex' }}>
                    <Info size={10} /> {doc.relevance}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {doneCount === docs.length && docs.length > 0 && (
        <div
          className="mt-4 p-3 rounded-lg flex items-center gap-2 text-sm font-medium"
          style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(52,211,153,0.2)' }}
        >
          <Check size={15} /> All documents ready! You're prepared for the next step.
        </div>
      )}
    </SectionWrapper>
  );
}

function NextStepsCard({ steps }) {
  return (
    <SectionWrapper
      icon={<Lightbulb size={15} />}
      title="Options Available to You"
      badge={`${steps.length} Option${steps.length !== 1 ? 's' : ''}`}
      accent
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((step, i) => (
          <div
            key={i}
            className="p-4 rounded-xl"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1.5px solid var(--accent-border)' }}
              >
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                  {step.option || step.title}
                </p>
                {step.timeline && (
                  <span className="badge badge-info text-xs">
                    <Clock size={10} /> {step.timeline}
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
              {step.description}
            </p>
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
          {/* Disclaimer */}
          <div
            className="flex items-start gap-3 p-3.5 rounded-lg mb-4"
            style={{ background: 'var(--warning-bg)', border: '1px solid rgba(251,176,64,0.25)' }}
          >
            <Shield size={15} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <strong>Disclaimer:</strong> This draft reply is AI-generated for informational purposes only.
              It does not constitute legal or tax advice. Please review with a qualified Chartered Accountant
              before submitting to any authority.
            </p>
          </div>

          {/* Reply Content */}
          <div
            className="p-5 rounded-xl mb-4 font-body text-sm leading-loose whitespace-pre-wrap"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              maxHeight: 400,
              overflowY: 'auto',
            }}
          >
            {reply}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onCopy} className="btn-secondary gap-2">
              {copied ? <><Check size={14} style={{ color: 'var(--success)' }} /> Copied!</> : <><Copy size={14} /> Copy to Clipboard</>}
            </button>
            <a
              href={`${import.meta.env.VITE_BIZEXPRESS_CONTACT || '#'}`}
              target="_blank"
              rel="noopener"
              className="btn-primary gap-2"
            >
              <Phone size={14} /> Connect with CA
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function BizExpressCTA() {
  return (
    <div
      className="p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-5"
      style={{
        background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-subtle))',
        border: '1px solid var(--border)',
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--accent)', boxShadow: '0 4px 16px rgba(184,134,11,0.3)', color: '#fff' }}
      >
        <Scale size={22} />
      </div>
      <div className="flex-1">
        <p className="font-display font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
          Don't have a CA? Let BizExpress handle it.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Our expert team of CAs and tax professionals can respond to this notice, negotiate with authorities,
          and protect your interests. No hassle, end-to-end.
        </p>
      </div>
      <a
        href={import.meta.env.VITE_BIZEXPRESS_CONTACT || 'https://bizexpress.in/contact'}
        target="_blank"
        rel="noopener"
        className="btn-primary flex-shrink-0"
      >
        Contact BizExpress <ChevronRight size={14} />
      </a>
    </div>
  );
}
