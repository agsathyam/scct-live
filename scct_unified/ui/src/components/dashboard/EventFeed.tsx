import React from 'react';
import { ExceptionEvent, ExceptionStatus } from '../../types';

interface EventFeedProps {
  events: ExceptionEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSimulate: () => void;
  isProcessing: boolean;
}

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const colors = {
    CRITICAL: 'bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.4)]',
    HIGH: 'bg-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.4)]',
    MEDIUM: 'bg-yellow-500 text-black',
    LOW: 'bg-emerald-500 text-white',
  };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colors[severity as keyof typeof colors] || 'bg-slate-500'}`}>
      {severity}
    </span>
  );
};

export const EventFeed: React.FC<EventFeedProps> = ({ events, selectedId, onSelect, onSimulate, isProcessing }) => {
  const activeEvents = events.filter(e => e.status !== ExceptionStatus.RESOLVED && !e.status.includes('ESCALATED'));

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-900/20 rounded-xl border border-white/5 backdrop-blur-sm">
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          Incoming Exceptions
        </h3>
        <button
          onClick={onSimulate}
          disabled={isProcessing}
          className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + SIMULATE
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
        {activeEvents.length === 0 ? (
          <div className="text-center p-8 text-slate-600 text-xs italic">
            No active exceptions.<br />System optimal.
          </div>
        ) : (
          activeEvents.map(evt => (
            <div
              key={evt.id}
              onClick={() => !isProcessing && onSelect(evt.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 group relative
                                ${selectedId === evt.id
                  ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                  : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600'
                }`}
            >
              {selectedId === evt.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg" />
              )}

              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-[10px] text-slate-500">{evt.id}</span>
                <span className="text-[10px] text-slate-400">{new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <SeverityBadge severity={evt.severity} />
                <span className="text-xs font-bold text-slate-200 truncate">{evt.type.replace(/_/g, ' ')}</span>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2 group-hover:text-slate-300">
                {evt.description}
              </p>

              <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-2 border-t border-white/5">
                {evt.customer.logo ? (
                  <img
                    src={evt.customer.logo}
                    alt={evt.customer.name}
                    className={`h-8 w-auto object-contain max-w-[100px] mix-blend-screen ${evt.customer.name === 'Electric Mobility' ? 'invert' : ''}`}

                  />
                ) : (
                  <span className="truncate max-w-[80px] text-blue-400">{evt.customer.name}</span>
                )}
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span className="font-bold text-sm text-white">${evt.shipment.value.toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
