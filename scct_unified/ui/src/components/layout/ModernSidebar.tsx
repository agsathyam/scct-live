import React from 'react';
import { useDemo } from '../../context/DemoContext';
interface SimpleUser {
  displayName: string | null;
  photoURL: string | null;
}

interface ModernSidebarProps {
  currentView: string;
  setView: (view: any) => void;
  openTaskCount: number;
  exceptionCount: number;
  user: SimpleUser | null;
}

export const ModernSidebar: React.FC<ModernSidebarProps> = ({ currentView, setView, openTaskCount, exceptionCount, user }) => {
  const { brand } = useDemo();

  const menuItems = [
    {
      id: 'DASHBOARD',
      label: 'Control Tower',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="url(#grad-tower)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" fill="url(#grad-tower)" fillOpacity="0.15" />
          <circle cx="12" cy="12" r="3" fill="#fff" />
          <path d="M12 12l4.5-4.5" />
          <path d="M12 2v10" />
        </svg>
      ),
      count: exceptionCount,
      badgeColor: 'bg-[var(--primary-brand)]',
      activeBase: 'text-[var(--primary-brand)]',
      shadow: 'shadow-[var(--primary-brand)]/50'
    },
    {
      id: 'HUMAN_REVIEW',
      label: 'Human Review',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="url(#grad-human)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" fill="url(#grad-human)" fillOpacity="0.2" />
          <circle cx="9" cy="7" r="4" fill="url(#grad-human)" fillOpacity="0.2" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      count: openTaskCount,
      badgeColor: 'bg-amber-500',
      activeBase: 'text-amber-400',
      shadow: 'shadow-amber-500/50'
    },
    {
      id: 'KNOWLEDGE_BASE',
      label: 'Knowledge Base',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="url(#grad-knowledge)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="url(#grad-knowledge)" fillOpacity="0.2" />
        </svg>
      ),
      activeBase: 'text-emerald-400',
      shadow: 'shadow-emerald-500/50'
    },
    {
      id: 'DATA_FACTORY',
      label: 'Data Factory',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="url(#grad-data)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" fill="url(#grad-data)" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      ),
      activeBase: 'text-purple-400',
      shadow: 'shadow-purple-500/50'
    },
    {
      id: 'ACTION_SERVICES',
      label: 'Action Services',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="url(#grad-action)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" fill="url(#grad-action)" fillOpacity="0.8" />
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" fill="#fff" fillOpacity="0.5" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
      ),
      activeBase: 'text-pink-400',
      shadow: 'shadow-pink-500/50'
    },
    {
      id: 'SETTINGS',
      label: 'Demo Settings',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="url(#grad-settings)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="url(#grad-settings)" fillOpacity="0.2" />
          <path d="M14 10l-2 2M6 18l-2 2" stroke="#fff" />
        </svg>
      ),
      activeBase: 'text-slate-400',
      shadow: 'shadow-slate-500/50'
    },
  ];

  return (
    <aside className="w-24 h-full bg-slate-900/60 backdrop-blur-xl border-r border-white/5 flex flex-col shrink-0 relative z-20 items-center transition-all duration-300">
      {/* SVG Definitions for Gradients */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <linearGradient id="grad-tower" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="grad-human" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <linearGradient id="grad-knowledge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="grad-data" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
          <linearGradient id="grad-action" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="grad-settings" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Navigation - Added padding top since logo is gone */}
      <nav className="flex-1 space-y-6 flex flex-col items-center pt-8">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            title={item.label}
            className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-300 group relative
                            ${currentView === item.id
                ? `bg-slate-800 ${item.activeBase} shadow-lg ${item.shadow} ring-1 ring-white/10 scale-110`
                : `${item.activeBase} opacity-50 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 hover:bg-white/5 hover:scale-105`
              }`}
          >
            <div className={`w-8 h-8 transition-all duration-300 ${currentView === item.id ? 'drop-shadow-[0_0_8px_currentColor]' : ''}`}>
              {item.icon}
            </div>

            {/* Badge Overlay */}
            {item.count !== undefined && item.count > 0 && (
              <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] flex items-center justify-center text-white font-bold border-2 border-slate-950 ${item.badgeColor} shadow-lg`}>
                {item.count}
              </span>
            )}

            {/* Active Indicator Dot */}
            {currentView === item.id && (
              <div className={`absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r bg-current opacity-50`}></div>
            )}
          </button>
        ))}
      </nav>

      {/* Footer User Profile */}
      <div className="p-6 w-full flex justify-center border-t border-white/5">
        {user ? (
          <div className="w-10 h-10 rounded-full border-2 border-white/10 overflow-hidden shadow-lg" title={user.displayName || 'User'}>
            {user.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">
                {user.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 border-dashed flex items-center justify-center text-slate-500" title="Not Signed In">
            <span className="text-xs">?</span>
          </div>
        )}
      </div>
    </aside>
  );
};
