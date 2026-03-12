import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Mail, Lock, User, Phone, Building2, Eye, EyeOff,
  ArrowRight, FileText, Sun, Moon, Chrome, AlertCircle,
  CheckCircle2, Loader2
} from 'lucide-react';

const FEATURES = [
  { icon: '⚡', label: 'Instant AI Analysis', desc: 'Deep reading of GST & Income Tax notices in seconds' },
  { icon: '📋', label: 'Structured Breakdown', desc: 'Every section, demand, and allegation clearly mapped' },
  { icon: '📁', label: 'Document Tracker', desc: `Know exactly what's required and track completion` },
  { icon: '✍️', label: 'Draft Reply', desc: 'AI-drafted replies with professional disclaimer' },
];

export default function AuthPage() {
  const [mode, setMode]             = useState('login'); // 'login' | 'signup' | 'forgot'
  const [showPwd, setShowPwd]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  const [form, setForm] = useState({
    email: '', password: '', name: '', phone: '', company: ''
  });

  const { signup, login, loginWithGoogle, resetPassword } = useAuth();
  const { theme, toggleTheme }  = useTheme();
  const navigate = useNavigate();

  const update = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!form.name.trim()) throw new Error('Please enter your full name.');
        if (!form.phone.trim()) throw new Error('Please enter your phone number.');
        await signup(form);
        navigate('/dashboard');
      } else if (mode === 'login') {
        await login(form.email, form.password);
        navigate('/dashboard');
      } else if (mode === 'forgot') {
        await resetPassword(form.email);
        setSuccess('Password reset email sent. Please check your inbox.');
      }
    } catch (err) {
      const map = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/user-not-found':       'No account found with this email.',
        'auth/wrong-password':       'Incorrect password. Please try again.',
        'auth/invalid-email':        'Please enter a valid email address.',
        'auth/too-many-requests':    'Too many attempts. Please wait a moment.',
        'auth/invalid-credential':   'Invalid email or password.',
      };
      setError(map[err.code] || err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(''); setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>

      {/* Left Panel — Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: '#0D0F18' }}
      >
        {/* Decorative Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #D4A853 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-20 right-10 w-60 h-60 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #60A5FA 0%, transparent 70%)' }}
          />
          {/* Grid Pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D4A853" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: '#D4A853', boxShadow: '0 4px 16px rgba(212,168,83,0.35)' }}>
              <FileText size={22} color="#0D0F18" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-display font-semibold text-white">
              Notice<span style={{ color: '#D4A853' }}>IQ</span>
            </span>
          </div>
          <p style={{ color: '#5C5A7A', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            by BizExpress
          </p>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <div className="mb-3">
            <span
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{ background: 'rgba(212,168,83,0.12)', color: '#D4A853', border: '1px solid rgba(212,168,83,0.2)' }}
            >
              For CA Firms & Tax Professionals
            </span>
          </div>
          <h1
            className="font-display font-semibold leading-tight mb-4"
            style={{ color: '#E8E4D8', fontSize: '2.8rem' }}
          >
            Decode Any
            <br />
            Tax Notice in
            <br />
            <span style={{ color: '#D4A853' }}>Seconds.</span>
          </h1>
          <p style={{ color: '#6B6888', lineHeight: 1.7, fontSize: '1rem', maxWidth: 380 }}>
            AI-powered analysis of GST and Income Tax notices. Understand every section,
            every demand, and every deadline — instantly structured.
          </p>

          {/* Features */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="p-3.5 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="text-xl mb-1.5">{f.icon}</div>
                <div className="text-sm font-medium mb-0.5" style={{ color: '#E8E4D8' }}>{f.label}</div>
                <div className="text-xs leading-relaxed" style={{ color: '#4A4A6A' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs" style={{ color: '#3A3A5A' }}>
            Powered by BizExpress · India's Business Compliance Partner
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">

        {/* Theme Toggle (mobile visible) */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-lg"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          {theme === 'dark'
            ? <Sun size={16} style={{ color: 'var(--accent-soft)' }} />
            : <Moon size={16} style={{ color: 'var(--text-secondary)' }} />
          }
        </button>

        <div className="w-full max-w-[420px] animate-slide-up">

          {/* Mobile Logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent)' }}>
              <FileText size={18} color="white" />
            </div>
            <span className="text-xl font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
              Notice<span style={{ color: 'var(--accent)' }}>IQ</span>
            </span>
          </div>

          {/* Form Header */}
          <div className="mb-7">
            <h2 className="font-display font-semibold mb-1.5" style={{ color: 'var(--text-primary)', fontSize: '1.9rem' }}>
              {mode === 'signup'  ? 'Create Account'  :
               mode === 'forgot' ? 'Reset Password'  : 'Welcome Back'}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {mode === 'signup'  ? 'Start analyzing tax notices for free' :
               mode === 'forgot' ? 'Enter your email to receive a reset link' :
               'Sign in to access your notice sessions'}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-lg mb-4"
              style={{ background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.25)' }}>
              <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
              <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-3 p-3.5 rounded-lg mb-4"
              style={{ background: 'var(--success-bg)', border: '1px solid rgba(52,211,153,0.25)' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 1 }} />
              <p className="text-sm" style={{ color: 'var(--success)' }}>{success}</p>
            </div>
          )}

          {/* Google Auth */}
          {mode !== 'forgot' && (
            <>
              <button
                onClick={handleGoogle}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-4"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {googleLoading
                  ? <Loader2 size={16} className="animate-spin" />
                  : <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                }
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or with email</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {mode === 'signup' && (
              <>
                <div>
                  <label className="label">Full Name *</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="input-field pl-10"
                      placeholder="Rajesh Kumar"
                      value={form.name}
                      onChange={update('name')}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Phone *</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                      <input
                        type="tel"
                        className="input-field pl-10"
                        placeholder="+91 98765 43210"
                        value={form.phone}
                        onChange={update('phone')}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Company / Firm</label>
                    <div className="relative">
                      <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        className="input-field pl-10"
                        placeholder="Your Firm"
                        value={form.company}
                        onChange={update('company')}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="label">Email Address *</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={update('email')}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="label">Password *</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="input-field pl-10 pr-10"
                    placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'}
                    value={form.password}
                    onChange={update('password')}
                    required
                    minLength={mode === 'signup' ? 8 : undefined}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                  className="text-xs transition-colors"
                  style={{ color: 'var(--accent)' }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200 mt-2"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 2px 12px rgba(184,134,11,0.35)',
              }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
                : mode === 'signup' ? <><ArrowRight size={16} /> Create Account</>
                : mode === 'forgot' ? <><Mail size={16} /> Send Reset Link</>
                : <><ArrowRight size={16} /> Sign In</>
              }
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-6 text-center">
            {mode === 'login' ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Don't have an account?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                  className="font-semibold"
                  style={{ color: 'var(--accent)' }}
                >
                  Sign up free
                </button>
              </p>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                  className="font-semibold"
                  style={{ color: 'var(--accent)' }}
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          {/* Terms */}
          {mode === 'signup' && (
            <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
              By signing up, you agree to our{' '}
              <a href="#" style={{ color: 'var(--accent)' }}>Terms of Service</a>
              {' '}and{' '}
              <a href="#" style={{ color: 'var(--accent)' }}>Privacy Policy</a>.
              Your data is securely stored and never shared without consent.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
