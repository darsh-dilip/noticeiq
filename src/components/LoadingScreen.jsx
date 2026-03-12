import React from 'react';
import { FileText } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 animate-pulse-gold"
        style={{ background: 'var(--accent)', boxShadow: '0 4px 20px rgba(184,134,11,0.3)' }}
      >
        <FileText size={24} color="white" />
      </div>
      <p className="font-display text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        Notice<span style={{ color: 'var(--accent)' }}>IQ</span>
      </p>
      <div className="mt-6 flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: 'var(--accent)',
              animation: `bounce 1s infinite ${i * 0.15}s`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
