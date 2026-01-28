import React from 'react';

export const DetailItem: React.FC<{ label: string; value: string; sub?: string; color?: string; className?: string }> = ({ label, value, sub, color = 'text-white', className = '' }) => (
  <div className={`bg-slate-900/40 p-3 rounded-lg border border-white/5 ${className}`}>
    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold">{label}</div>
    <div className={`font-medium text-sm ${color}`}>{value}</div>
    {sub && <div className="text-[10px] text-slate-500 mt-1">{sub}</div>}
  </div>
);
