import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Sun, Moon, LogOut, User, ChevronDown,
  FileText, LayoutDashboard, Plus
} from 'lucide-react';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const initials = (profile?.name || user?.displayName || user?.email || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 h-16 border-b"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent)', boxShadow: '0 2px 8px rgba(184,134,11,0.3)' }}
          >
            <FileText size={16} color="white" strokeWidth={2.5} />
          </div>
          <span
            className="text-xl font-display font-semibold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Notice<span style={{ color: 'var(--accent)' }}>IQ</span>
          </span>
        </Link>

        {/* Center Nav */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/dashboard" icon={<LayoutDashboard size={15} />} active={location.pathname === '/dashboard'}>
              Dashboard
            </NavLink>
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2">

          {/* New Session Button */}
          {user && (
            <button
              onClick={() => navigate('/session/new')}
              className="btn-primary hidden sm:inline-flex"
              style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
            >
              <Plus size={14} strokeWidth={2.5} />
              New Session
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn-ghost w-9 h-9 flex items-center justify-center rounded-lg"
            aria-label="Toggle theme"
            style={{ padding: 0 }}
          >
            {theme === 'dark'
              ? <Sun size={17} style={{ color: 'var(--accent-soft)' }} />
              : <Moon size={17} style={{ color: 'var(--text-secondary)' }} />
            }
          </button>

          {/* User Menu */}
          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors duration-150"
                style={{
                  background: menuOpen ? 'var(--bg-elevated)' : 'transparent',
                  color: 'var(--text-secondary)',
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1.5px solid var(--accent-border)' }}
                >
                  {initials}
                </div>
                <span className="text-sm font-medium hidden sm:block" style={{ color: 'var(--text-primary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile?.name || user.displayName || 'Account'}
                </span>
                <ChevronDown size={14} className={`transition-transform duration-150 ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border py-1.5 z-50 animate-fade-in"
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  <div className="px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {profile?.name || user.displayName}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                    {profile?.company && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>{profile.company}</p>
                    )}
                  </div>

                  <div className="py-1">
                    <MenuItem icon={<User size={14} />} onClick={() => { setMenuOpen(false); }}>
                      My Profile
                    </MenuItem>
                    <MenuItem icon={<LogOut size={14} />} onClick={handleLogout} danger>
                      Sign Out
                    </MenuItem>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, children, icon, active }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150"
      style={{
        background: active ? 'var(--accent-bg)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        border: active ? '1px solid var(--accent-border)' : '1px solid transparent',
      }}
    >
      {icon}
      {children}
    </Link>
  );
}

function MenuItem({ icon, children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors duration-100"
      style={{
        color: danger ? 'var(--danger)' : 'var(--text-secondary)',
        textAlign: 'left',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {icon}
      {children}
    </button>
  );
}
