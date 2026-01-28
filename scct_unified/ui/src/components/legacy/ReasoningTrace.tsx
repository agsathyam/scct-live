import React, { useEffect, useRef, useState } from 'react';
import { AgentLog } from '../../types';

interface Props {
  logs: string[];
  isProcessing: boolean;
}

// Helper to safely parse JSON
const safeJsonParse = (str: string) => {
  try {
    const jsonStart = str.indexOf('{');
    const jsonStartArr = str.indexOf('[');
    let start = -1;

    if (jsonStart !== -1 && jsonStartArr !== -1) start = Math.min(jsonStart, jsonStartArr);
    else if (jsonStart !== -1) start = jsonStart;
    else if (jsonStartArr !== -1) start = jsonStartArr;

    if (start !== -1) {
      const jsonStr = str.substring(start).replace(/'/g, '"');
      return JSON.parse(jsonStr);
    }
    return null;
  } catch (e) {
    return null; // Silent fail
  }
};

export const ReasoningTrace: React.FC<Props> = ({ logs, isProcessing }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, devMode]);

  const formatLog = (log: string) => {
    if (!log || typeof log !== 'string') return null;
    if (devMode) return <span className="font-mono text-[10px] text-slate-400 whitespace-pre-wrap">{log}</span>;

    // --- BUSINESS USER VIEW LOGIC ---

    // 1. History Results
    if (log.includes('History Results:')) {
      const data = safeJsonParse(log);
      if (data && data.results && Array.isArray(data.results) && data.results.length > 0) {
        const count = data.results.length;
        const uniqueActions = Array.from(new Set(data.results.map((r: any) => r.action)));
        return (
          <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30 text-blue-300">
            <span className="font-bold">📚 Historical Analysis:</span> Found <span className="text-white font-bold">{count} similar past events</span>.
            <span className="text-xs text-blue-400 mt-1 block">
              Common Resolution: {uniqueActions.join(', ').replace(/_/g, ' ')}
            </span>
          </div>
        );
      }
      return <span className="text-slate-500 italic">No similar historical patterns found.</span>;
    }

    // 2. Search Results
    if (log.includes('Search Results:')) {
      if (log.includes("'results': []") || log.includes('"results": []')) {
        return <span className="text-slate-500 italic">ℹ️ No specific policy documents found for this query.</span>;
      }

      const data = safeJsonParse(log);
      if (data && data.results && Array.isArray(data.results)) {
        return (
          <div className="bg-purple-900/20 p-3 rounded border border-purple-500/30 text-purple-300">
            <div className="mb-2">
              <span className="font-bold">🔎 Knowledge Retrieval:</span> Found <span className="text-white font-bold">{data.results.length} relevant policy documents</span>.
            </div>
            <ul className="space-y-2 mt-2">
              {data.results.map((doc: any, idx: number) => (
                <li key={idx} className="bg-purple-950/30 p-2 rounded border border-purple-500/20 text-xs">
                  <div className="font-bold text-purple-200 mb-0.5">
                    {doc.url ? (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-purple-100 flex items-center gap-1">
                        📄 {doc.title || 'Untitled Document'}
                        <span className="opacity-50 text-[10px]">↗</span>
                      </a>
                    ) : (
                      <span>📄 {doc.title || 'Untitled Document'}</span>
                    )}
                  </div>
                  <div className="text-purple-400/80 line-clamp-2" title={doc.content}>
                    {doc.content ? doc.content.substring(0, 150) + (doc.content.length > 150 ? '...' : '') : 'No content preview.'}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      }
      return null;
    }

    // 3. Status Updates & "Thinking" (Deduplicated)
    if (log.includes('Formulating Decision')) {
      return (
        <div className="flex items-center gap-2 text-slate-400 my-1 animate-pulse">
          <span>⚙️</span>
          <span className="italic font-bold text-slate-500">Assessing resolution strategy...</span>
        </div>
      );
    }

    // Hide specific "Evaluating Tool Registry" thought entirely (User Request)
    if (log.includes('Evaluating Tool Registry')) return null;

    // 4. Detailed Thought Process (Truncated)
    if (log.includes('Turn ') && log.includes('Assessing Situation')) {
      return null; // Skip header
    }

    if (log.includes('🤔')) {
      const text = log.replace('🤔', '').trim();
      // Additional filter for technical thought lines often output by this specific prompt
      if (text.includes('Evaluating Tool Registry')) return null;

      // Truncate to first sentence or 150 chars
      const summary = text.split('.')[0] + '.';
      return (
        <div className="text-slate-300 italic pl-4 border-l-2 border-slate-700 py-1 my-1">
          {summary}
        </div>
      );
    }

    // 5. Tool Selection
    if (log.includes('Agent selected tool:')) {
      const tool = log.split(':')[1]?.trim() || 'Action';
      return <div className="text-cyan-400 font-bold mt-2">🛠️ Selected Strategy: <span className="text-white bg-cyan-900/50 px-2 py-0.5 rounded">{tool.replace(/_/g, ' ').toUpperCase()}</span></div>;
    }

    if (log.includes('Executing Action:') || log.includes('Initializing') || log.includes('Loading Context')) {
      return null; // Hide noise
    }

    // 6. Action Results
    if (log.includes('Action Successful:') || log.includes('Tool execution successful:')) {
      const data = safeJsonParse(log);
      if (data) {
        if (data.status === 'escalated') {
          return <div className="text-green-400 font-bold bg-green-900/20 p-2 rounded border border-green-500/30">✅ Escalation Ticket Created: {data.ticket_id}</div>;
        }
        if (data.status === 'success') {
          if (data.new_order_id) return <div className="text-green-400 font-bold">✅ Reshipment Order Created: {data.new_order_id}</div>;
          if (data.updated_eta) return <div className="text-green-400 font-bold">✅ TMS Updated: New ETA {data.updated_eta}</div>;
        }
      }
      return <span className="text-green-400 font-bold">✅ Action Completed Successfully.</span>;
    }

    // 7. Start/End headers
    if (log.includes('Initiating resolution workflow')) {
      return <div className="text-white font-bold border-b border-slate-700 pb-2 mb-2">🚀 Starting Autonomous Resolution Agent</div>;
    }

    // Event Type Header (keep)
    if (log.includes('Event Type:')) {
      return <div className="text-xs text-slate-500 uppercase tracking-widest mb-4">{log}</div>;
    }

    // Default: If it looks technical (contains { etc), maybe hide it or show simplified
    if (log.includes('{') || log.includes('[')) return null;

    return <span className="text-slate-400">{log.replace(/_/g, ' ')}</span>;
  };

  return (
    <div className="flex flex-col h-full bg-black rounded-lg border border-slate-800 overflow-hidden font-mono text-xs">
      <div className="bg-slate-900 p-2 border-b border-slate-800 flex justify-between items-center px-4">
        <span className={`font-bold tracking-wider flex items-center gap-2 ${devMode ? 'text-blue-400' : 'text-slate-400'}`}>
          {devMode ? 'TERMINAL: AGENT_LOGS' : 'AUTONOMOUS RESOLUTION AGENT'}
        </span>
        <div className="flex items-center gap-3">
          {isProcessing && <span className="animate-pulse text-green-500 text-[10px] font-bold">● PROCESSING</span>}
          <button
            onClick={() => setDevMode(!devMode)}
            className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${devMode ? 'text-blue-400 bg-slate-800' : 'text-slate-600'}`}
            title={devMode ? "Switch to Business View" : "Switch to Developer Logs"}
          >
            🛠️
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {logs.length === 0 && (
          <div className="text-slate-600 italic text-center mt-10">Waiting for events...</div>
        )}
        {(() => {
          // Filter first to handle deduplication across hidden logs
          const visibleLogs = logs.map((log, originalIndex) => ({
            log,
            formatted: formatLog(log),
            key: originalIndex
          })).filter(item => item.formatted !== null);

          return visibleLogs.map((item, i) => {
            // Sequential Deduplication on VISIBLE logs
            // If the current log is "Formulating Decision" and the PREVIOUS VISIBLE log was also "Formulating Decision", skip it.
            if (item.log.includes('Formulating Decision') && visibleLogs[i - 1]?.log.includes('Formulating Decision')) {
              return null;
            }

            return (
              <div key={item.key} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 items-start group">
                <span className="text-slate-400 shrink-0 mt-0.5 font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity select-none">
                  {new Date().toLocaleTimeString().split(' ')[0]}
                </span>
                <div className="flex-1 break-words leading-relaxed">
                  {item.formatted}
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
};