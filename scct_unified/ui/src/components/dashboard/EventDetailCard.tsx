import React from 'react';
import { ExceptionEvent, AgentDecision } from '../../types';
import { DetailItem } from '../common/DetailItem';

interface EventDetailCardProps {
  event: ExceptionEvent | undefined;
  isProcessing: boolean;
  decision: AgentDecision | null;
  onResolve: () => void;
}

export const EventDetailCard: React.FC<EventDetailCardProps> = ({ event, isProcessing, decision, onResolve }) => {
  if (!event) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 p-8">
        <div className="text-6xl mb-6 opacity-20 animate-pulse">📡</div>
        <p className="text-sm font-bold uppercase tracking-widest text-center text-slate-500">Select an Incoming Exception</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Main Card with Gradient Border */}
      <div className="relative group rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 p-[1px] shadow-2xl h-full overflow-hidden">
        <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

        <div className="relative bg-slate-950 rounded-2xl p-6 flex flex-col gap-6 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">

          {/* Header */}
          <div className="flex justify-between items-start gap-6 border-b border-slate-800 pb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${event.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                  event.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                    'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  }`}>
                  {event.severity}
                </span>
                <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{event.id}</span>
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
                {event.type.replace(/_/g, ' ')}
                <span className="text-blue-400 inline-flex items-center gap-2 ml-2">
                  {event.customer.logo && (
                    <img
                      src={event.customer.logo}
                      alt={event.customer.name}
                      className={`h-16 w-auto object-contain mix-blend-screen ${event.customer.name === 'Electric Mobility' ? 'invert' : ''}`}
                    />
                  )}
                  {event.customer.name}
                </span>
              </h1>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-mono">
                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-purple-400">{event.shipment.origin}</span>
                <span>→</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-purple-400">{event.shipment.destination}</span>
              </div>
            </div>

            <button
              onClick={onResolve}
              disabled={isProcessing || !!decision}
              className={`px-6 py-4 rounded-xl font-bold shadow-lg transition-all flex flex-col items-center justify-center min-w-[120px]
                          ${isProcessing
                  ? 'bg-slate-800 text-slate-500 cursor-wait border border-slate-700'
                  : decision
                    ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/50 cursor-default'
                    : 'bg-blue-600 text-white shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-105 border border-blue-500'
                }`}
            >
              {isProcessing ? (
                <span className="animate-spin text-xl mb-1">⏳</span>
              ) : decision ? (
                <span className="text-xl mb-1">✓</span>
              ) : (
                <span className="text-xl mb-1">⚡</span>
              )}
              <span className="text-[10px] uppercase tracking-wider">
                {isProcessing ? 'Resolving' : decision ? 'Resolved' : 'Auto-Resolve'}
              </span>
            </button>
          </div>

          {/* Data Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Root Cause (Full Width) */}
            <div className="col-span-2 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Root Cause / Context</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                {event.description}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Customer</h3>
              <div className="text-lg font-bold text-white">{event.customer.name}</div>
              <div className="text-xs text-purple-400 mt-1 font-medium">{event.customer.tier} Tier</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Shipment Value</h3>
              <div className="text-lg font-bold text-white">${event.shipment.value.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">USD (DDP)</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Predicted Impact</h3>
              <div className="text-lg font-bold text-red-400">Delay {'>'} 48h</div>
              <div className="text-xs text-red-500/60 mt-1 font-medium">SLA Breach Risk</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Active Contract</h3>
              <div className="text-sm font-bold text-white truncate">Master Service Agreement 2024</div>
              <div className="text-xs text-slate-500 mt-1 font-mono">{event.contractId}</div>
            </div>
          </div>

          {/* RAG Context */}
          <div className="pt-6 border-t border-slate-800/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
                <span>📚 Relevant Policy & Contract Context</span>
              </h3>
              <span className="text-[9px] bg-emerald-900/30 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                ✓ Context Loaded
              </span>
            </div>
            <div className="p-3 rounded-lg bg-blue-950/10 border border-blue-500/10 text-xs text-slate-400 leading-relaxed font-mono">
              <span className="text-slate-500">"{event.contractId} - CLAUSE 4.2"</span> — In event of {event.type.replace(/_/g, ' ').toLowerCase()}, carrier liability is limited to $5,000 unless Force Majeure is declared. <span className="text-slate-300">Recommended Action: Verify Force Majeure status with carrier API.</span>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};
