import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Upload, FileText, Receipt, TrendingUp, ArrowLeft,
  CheckCircle2, Loader2, AlertCircle, X, File,
  Sparkles, Brain, ClipboardList, Tag
} from 'lucide-react';

const ACT_OPTIONS = [
  {
    id: 'GST',
    label: 'GST Notice',
    desc: 'CGST / IGST / SGST',
    icon: <Receipt size={20} />,
    color: '#2563EB',
  },
  {
    id: 'INCOME_TAX',
    label: 'Income Tax Notice',
    desc: 'Assessment / Scrutiny',
    icon: <TrendingUp size={20} />,
    color: '#7C3AED',
  },
];

const ANALYSIS_STEPS = [
  { icon: <Upload size={16} />,      label: 'Uploading document',           duration: 1000 },
  { icon: <Brain size={16} />,        label: 'Reading notice content',       duration: 3000 },
  { icon: <Sparkles size={16} />,     label: 'Identifying sections & demands', duration: 4000 },
  { icon: <ClipboardList size={16} />, label: 'Structuring analysis report',  duration: 2000 },
  { icon: <Tag size={16} />,          label: 'Finalizing session',           duration: 1000 },
];

export default function NewSessionPage() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const { user }    = useAuth();
  const fileInputRef = useRef(null);

  const [actType, setActType]   = useState(location.state?.actType || 'GST');
  const [sessionName, setSessionName] = useState('');
  const [file, setFile]         = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [error, setError]       = useState('');

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(f.type)) {
      setError('Please upload a PDF or image file (JPG, PNG, WebP).');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File size must be under 20 MB.');
      return;
    }
    setError('');
    setFile(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const onDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true); }, []);
  const onDragLeave = useCallback(() => setDragOver(false), []);

  const toBase64 = (f) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(f);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please upload a notice file.'); return; }
    if (!sessionName.trim()) { setError('Please give this session a name.'); return; }

    setAnalyzing(true);
    setError('');

    let sessionId;

    try {
      // Step 0: Upload to Firebase Storage
      setCurrentStep(0);
      const storagePath = `notices/${user.uid}/${Date.now()}_${file.name}`;
      const storageRef  = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      // Create session doc with 'processing' status
      const sessionRef = await addDoc(collection(db, 'sessions'), {
        userId:    user.uid,
        name:      sessionName.trim(),
        actType,
        status:    'processing',
        createdAt: serverTimestamp(),
        noticeFile: { url: fileUrl, name: file.name, type: file.type, size: file.size },
        analysis:  null,
      });
      sessionId = sessionRef.id;

      // Step 1-2: Encode and send to API
      setCurrentStep(1);
      const base64Data = await toBase64(file);

      setCurrentStep(2);
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData:  base64Data,
          fileType:  file.type,
          actType,
          sessionName: sessionName.trim(),
        }),
      });

      setCurrentStep(3);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Analysis failed (${response.status})`);
      }

      const analysis = await response.json();

      // Step 4: Save analysis to Firestore
      setCurrentStep(4);
      await updateDoc(doc(db, 'sessions', sessionId), {
        status: 'complete',
        analysis,
        updatedAt: serverTimestamp(),
        documentStatus: {},
      });

      // Navigate to session
      navigate(`/session/${sessionId}`, { replace: true });

    } catch (err) {
      console.error(err);
      setError(err.message || 'Analysis failed. Please try again.');

      // Mark session as error if it was created
      if (sessionId) {
        await updateDoc(doc(db, 'sessions', sessionId), {
          status: 'error',
          errorMessage: err.message,
        }).catch(() => {});
      }
      setAnalyzing(false);
      setCurrentStep(-1);
    }
  };

  if (analyzing) {
    return <AnalyzingScreen steps={ANALYSIS_STEPS} currentStep={currentStep} fileName={file?.name} />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 page-enter">

      {/* Back */}
      <button
        onClick={() => navigate('/dashboard')}
        className="btn-ghost mb-6"
        style={{ paddingLeft: 0 }}
      >
        <ArrowLeft size={15} /> Back to Dashboard
      </button>

      <div className="mb-7">
        <h1 className="font-display font-semibold mb-1.5" style={{ color: 'var(--text-primary)', fontSize: '1.9rem' }}>
          New Analysis Session
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Upload your notice and our AI will decode every detail — sections, demands, and next steps.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Act Type */}
        <div>
          <label className="label">Notice Type *</label>
          <div className="grid grid-cols-2 gap-3">
            {ACT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setActType(opt.id)}
                className="flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-200"
                style={{
                  background: actType === opt.id ? `${opt.color}0D` : 'var(--bg-elevated)',
                  border: `1.5px solid ${actType === opt.id ? opt.color + '40' : 'var(--border)'}`,
                  boxShadow: actType === opt.id ? `0 2px 12px ${opt.color}15` : 'none',
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: actType === opt.id ? `${opt.color}15` : 'var(--bg-card)',
                    color: actType === opt.id ? opt.color : 'var(--text-muted)',
                    border: `1px solid ${actType === opt.id ? opt.color + '30' : 'var(--border)'}`,
                  }}
                >
                  {opt.icon}
                </div>
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{opt.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{opt.desc}</p>
                </div>
                {actType === opt.id && (
                  <CheckCircle2 size={16} className="ml-auto flex-shrink-0 mt-0.5" style={{ color: opt.color }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Session Name */}
        <div>
          <label className="label">Session Name *</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. ABC Pvt Ltd — SCN Oct 2024"
            value={sessionName}
            onChange={e => setSessionName(e.target.value)}
            maxLength={80}
            required
          />
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
            Give this session a memorable name so you can find it later.
          </p>
        </div>

        {/* File Upload */}
        <div>
          <label className="label">Notice Document *</label>
          {!file ? (
            <div
              className={`upload-zone flex flex-col items-center justify-center py-12 px-6 text-center cursor-pointer ${dragOver ? 'drag-over' : ''}`}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: dragOver ? 'var(--accent-bg)' : 'var(--bg-card)',
                  border: '1.5px solid var(--border)',
                }}
              >
                <Upload size={22} style={{ color: dragOver ? 'var(--accent)' : 'var(--text-muted)' }} />
              </div>
              <p className="font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Drop your notice here
              </p>
              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                or <span style={{ color: 'var(--accent)', fontWeight: 600 }}>browse files</span>
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Supports PDF, JPG, PNG, WebP · Max 20 MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={e => handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div
              className="flex items-center gap-4 p-4 rounded-xl"
              style={{
                background: 'var(--success-bg)',
                border: '1.5px solid rgba(52,211,153,0.25)',
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--success-bg)', border: '1px solid rgba(52,211,153,0.3)' }}
              >
                <File size={18} style={{ color: 'var(--success)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-3.5 rounded-lg"
            style={{ background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.25)' }}>
            <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
            <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="btn-primary w-full justify-center py-3.5 text-base"
        >
          <Sparkles size={18} />
          Analyze Notice
        </button>

        <p className="text-xs text-center" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Your document is securely encrypted and stored. Analysis typically takes 30–90 seconds.
        </p>
      </form>
    </div>
  );
}

function AnalyzingScreen({ steps, currentStep, fileName }) {
  const progress = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="w-full max-w-md text-center">

        {/* Animated Icon */}
        <div className="relative inline-flex mb-8">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--accent-bg)', border: '2px solid var(--accent-border)' }}
          >
            <Brain size={34} style={{ color: 'var(--accent)' }} />
          </div>
          <div
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'var(--accent)', boxShadow: '0 2px 8px rgba(184,134,11,0.4)' }}
          >
            <Loader2 size={14} color="white" className="animate-spin" />
          </div>
        </div>

        <h2 className="font-display font-semibold mb-2" style={{ color: 'var(--text-primary)', fontSize: '1.5rem' }}>
          Analyzing Your Notice
        </h2>
        {fileName && (
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            {fileName}
          </p>
        )}

        {/* Progress Bar */}
        <div className="progress-bar mb-6">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.max(progress, 5)}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-2 text-left">
          {steps.map((step, i) => {
            const done    = i < currentStep;
            const current = i === currentStep;
            const pending = i > currentStep;
            return (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg transition-all duration-300"
                style={{
                  background: current ? 'var(--accent-bg)' : done ? 'var(--bg-elevated)' : 'transparent',
                  border: current ? '1px solid var(--accent-border)' : '1px solid transparent',
                  opacity: pending ? 0.4 : 1,
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: done ? 'var(--success-bg)' : current ? 'var(--accent-bg)' : 'var(--bg-elevated)',
                    color: done ? 'var(--success)' : current ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                >
                  {done
                    ? <CheckCircle2 size={14} />
                    : current
                      ? <Loader2 size={12} className="animate-spin" />
                      : step.icon
                  }
                </div>
                <span
                  className="text-sm font-medium"
                  style={{ color: done || current ? 'var(--text-primary)' : 'var(--text-muted)' }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Please don't close this tab. Analysis usually takes 30–90 seconds.
        </p>
      </div>
    </div>
  );
}
