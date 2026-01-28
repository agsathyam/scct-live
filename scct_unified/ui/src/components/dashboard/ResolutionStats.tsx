import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ResolutionStatsProps {
  data: any[];
  isRealData: boolean;
}

export const ResolutionStats: React.FC<ResolutionStatsProps> = ({ data, isRealData }) => {
  return (
    <div className="h-48 bg-slate-900/20 rounded-xl border border-white/5 backdrop-blur-sm p-4 flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-2 z-10">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <span className="text-lg">📈</span> Resolution Volume
        </h3>
        <span className={`text-[10px] px-2 py-0.5 rounded border ${isRealData ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
          {isRealData ? 'LIVE DATA' : 'SIMULATION'}
        </span>
      </div>

      <div className="flex-1 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorManual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={5} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(3, 7, 18, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', borderRadius: '8px', backdropFilter: 'blur(8px)' }}
              itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area type="monotone" dataKey="resolved" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" name="Auto-Resolved" />
            <Area type="monotone" dataKey="manual" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorManual)" name="Manual Review" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Background Decoration */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};
