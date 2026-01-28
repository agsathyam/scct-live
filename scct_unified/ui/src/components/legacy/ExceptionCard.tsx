import React from 'react';
import { ExceptionEvent, ExceptionStatus } from '../../types';

interface Props {
  event: ExceptionEvent;
  isActive: boolean;
  onClick: () => void;
}

export const ExceptionCard: React.FC<Props> = ({ event, isActive, onClick }) => {
  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition-all hover:border-slate-500 mb-3 ${isActive ? 'bg-slate-800 border-blue-500 ring-1 ring-blue-500' : 'bg-slate-900 border-slate-700'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className={`text-xs font-bold px-2 py-1 rounded border ${getSeverityColor(event.severity)}`}>
          {event.severity}
        </div>
        <span className="text-xs text-slate-500 font-mono">{event.id}</span>
      </div>

      <h3 className="text-white font-medium text-sm mb-1">
        <span className="capitalize">{event.type.replace(/_/g, ' ').toLowerCase()}</span>
        <span className="text-slate-400 font-normal"> for </span>
        <span className="text-blue-300">{event.customer.name}</span>
      </h3>
      <p className="text-slate-400 text-xs line-clamp-2">{event.description}</p>

      <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${event.customer.tier === 'VIP' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
            {event.customer.tier}
          </span>
          <span className="text-xs text-slate-500">{event.shipment.origin} → {event.shipment.destination}</span>
        </div>
        {event.status === ExceptionStatus.RESOLVED && (
          <span className="text-xs text-green-400 flex items-center gap-1">
            ✓ Resolved
          </span>
        )}
      </div>
    </div>
  );
};