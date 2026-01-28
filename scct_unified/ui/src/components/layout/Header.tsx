import React, { useState, useEffect } from 'react';
import { VertexAgentConfig } from '../../types';
import { User } from '../../services/authService';

// --- REFACTORED HEADER ---
interface HeaderProps {
  title: string; // Kept for metadata/breadcrumbs if needed, but deemphasized
  config: VertexAgentConfig;
  onOpenSettings: () => void;
  stats?: {
    resolutionRate: string;
    costSaved: number;
  };
  brand?: {
    name: string;
    logo?: string;
    colors: any;
    showName?: boolean;
    tagline?: string;
    showTagline?: boolean;
  };
}

export const Header: React.FC<HeaderProps & { user: User | null }> = ({ title, config, onOpenSettings, stats, brand, user }) => {
  // const [user, setUser] = useState<User | null>(null); // Lifted to App.tsx



  return (
    <header className="h-26 shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-slate-900/40 backdrop-blur-md relative z-20">
      <div className="flex items-center gap-4">
        {/* Brand Logo & Identity Block */}
        <div className="flex items-center gap-5">
          <div className="h-20 w-auto min-w-[5rem] flex items-center justify-center overflow-hidden">
            {brand?.logo ? (
              <img src={brand.logo} alt="Logo" className="h-full w-auto object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">
                🗼
              </div>
            )}
          </div>

          {(brand?.showName || brand?.showTagline) && (
            <div className="flex flex-col justify-center gap-0.5">
              {brand?.showName && (
                <h2 className="text-2xl font-bold text-white tracking-[0.2em] leading-none font-synergy">
                  {brand.name}
                </h2>
              )}
              {brand?.showTagline && (
                <span className="text-xs text-blue-400/80 uppercase tracking-[0.25em] font-medium">
                  {brand.tagline || 'Autonomous Supply Chain'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-8">
        {/* Subtle Page Indicator (Breadcrumb style) */}
        <div className="hidden lg:flex items-center gap-2 px-4 border-l border-white/5">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">View</span>
          <span className="text-xs text-slate-300 font-mono bg-slate-800 px-2 py-1 rounded">{title}</span>
        </div>

        {stats && (
          <div className="hidden xl:flex gap-8 border-l border-white/5 pl-8">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Auto-Resolution</div>
              <div className="text-lg font-bold text-emerald-400 leading-none">{stats.resolutionRate}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Est. Savings</div>
              <div className="text-lg font-bold text-blue-400 leading-none">${stats.costSaved.toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Auth & Mode Toggle Section - Consolidated for better alignment */}
        <div className="flex items-center gap-4 border-l border-white/5 pl-6">



          {/* Connected Mode Toggle */}
          <button
            onClick={onOpenSettings}
            className={`group flex items-center gap-3 px-4 py-2 rounded-lg border text-xs font-medium transition-all ${config.useRealAgent
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
          >
            <div className={`w-2 h-2 rounded-full ${config.useRealAgent ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
            {config.useRealAgent ? 'Connected' : 'Simulated'}
          </button>
        </div>
      </div>
    </header>
  );
};
