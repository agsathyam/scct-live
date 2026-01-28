import React from 'react';
import { ExceptionEvent, AgentDecision } from '../../types';
import { DetailItem } from '../common/DetailItem.tsx';

interface AgentWorkspaceProps {
  event: ExceptionEvent | undefined;
  isProcessing: boolean;
  decision: AgentDecision | null;
  logs: string[];
}

// Helper to humanize raw agent logs
const humanizeLogMessage = (log: string): { text: string; type: 'info' | 'success' | 'warning' | 'error' | 'reasoning' } => {
  // Strip internal tags but KEEP leading whitespace for indentation
  const cleanLog = log.replace(/\[REAL\]/g, '').replace(/\[HISTORY\]/g, '');
  const trimmedLog = cleanLog.trim();

  // HIDE: Reasoning Logic (Moving to Decision Card)
  if (trimmedLog.includes('[REASONING_HEADER]') ||
    trimmedLog.includes('[REASONING_ITEM]') ||
    trimmedLog.includes('Execution & Summary:')) {
    return { text: "", type: 'info' };
  }

  // "Brain Connected" -> Reasoning
  if (trimmedLog.includes('Brain Connected')) return { text: "🧠 Autonomous agent is researching ways to resolve this exception...", type: 'reasoning' };
  if (cleanLog.includes('Connecting to Neural Core')) return { text: "🔐 Initializing secure connection to Neural Core...", type: 'info' };
  if (trimmedLog.includes('Endpoint:')) return { text: "", type: 'info' }; // Hide

  // Tool Executions
  if (trimmedLog.includes('Tool Execution Completed: search_knowledge_base')) return { text: "🔍 Searching internal knowledge base for carrier SLAs and SOPs...", type: 'reasoning' };
  if (trimmedLog.includes('Tool Execution Completed: get_similar_events')) return { text: "📊 Analyzing historical resolutions for similar patterns to determine best course of action...", type: 'reasoning' };
  if (trimmedLog.includes('Tool Execution Completed: request_reshipment')) return { text: "✈️ Initiating logistical intervention (Reshipment Protocol)...", type: 'success' };

  // JSON Output Hiding - Catch all JSON-like structures for Results
  if (trimmedLog.includes('Result: {') || trimmedLog.includes('Result: {"')) return { text: "✅ Action parameters verified and execution confirmed.", type: 'success' };

  // Hide Tool Args if they are raw JSON
  if (trimmedLog.includes('Tool Call:') && trimmedLog.includes('{')) return { text: "⚙️ Formulating tool execution parameters based on strict constraints...", type: 'info' };

  // Default mappings
  if (trimmedLog.includes('❌')) return { text: trimmedLog, type: 'error' };
  if (trimmedLog.includes('⚠️')) return { text: trimmedLog, type: 'warning' };

  // Document Retrieval (Retain structure/indentation if present, but here we usually just get a summary line)
  if (trimmedLog.includes('RETRIEVED') && trimmedLog.includes('REFERENCES')) return { text: "📜 Accessing relevant policy documents & contracts:", type: 'info' };

  // History Retrieval
  if (trimmedLog.includes('Found') && trimmedLog.includes('similar past events')) return { text: "🗂️ Identified relevant historical precedents:", type: 'info' };

  // Pass through reasoning thoughts (usually start with 🤔 or just text)
  if (trimmedLog.includes('🤔')) return { text: `🤔 ${trimmedLog.replace('🤔', '').trim()}`, type: 'reasoning' };

  // Skip other raw JSON lines if they slipping through
  if (trimmedLog.startsWith('{') && trimmedLog.includes('}')) return { text: "", type: 'info' };

  // Return original cleanLog (with whitespace) to preserve indentation for bullet points/lists
  // But ensure we don't return purely empty whitespace if the original was just tags
  if (!trimmedLog) return { text: "", type: 'info' };

  return { text: cleanLog, type: 'info' };
};



export const AgentWorkspace: React.FC<AgentWorkspaceProps> = ({ event, isProcessing, decision, logs }) => {
  const [isDevMode, setIsDevMode] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of logs
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isProcessing, decision]);

  if (!event) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
        <div className="text-6xl mb-4 opacity-20">🧠</div>
        <p className="text-sm font-medium">Select an exception to view reasoning</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full min-h-0 bg-black/40 rounded-xl border border-white/5 shadow-inner relative overflow-hidden flex flex-col">
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-slate-950 via-slate-950/90 to-transparent z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧠</span>
          <div>
            <h2 className="text-sm font-bold text-slate-200 tracking-wide leading-none">
              Agentic Neural Core
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Dev Mode Toggle */}
          <button
            onClick={() => setIsDevMode(!isDevMode)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-mono transition-all
              ${isDevMode
                ? 'bg-green-900/30 border-green-500/50 text-green-400'
                : 'bg-slate-800/30 border-slate-700 text-slate-500 hover:text-slate-400'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${isDevMode ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
            DEV
          </button>

          {isProcessing && <span className="text-[10px] text-blue-400 animate-pulse font-mono">LIVE STREAMING</span>}
        </div>
      </div>

      {/* Watermark Logo (Big, Faded in background) */}


      {/* Scrollable Content Container */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 pt-12 space-y-3 scroll-smooth">
        {logs.length === 0 && !isProcessing && (
          <div className="text-slate-600 italic text-center mt-20">Waiting for Auto-Resolve trigger...</div>
        )}

        {logs.map((rawLog, idx) => {
          const isRaw = rawLog.startsWith('[RAW]');

          // DEV MODE: Show only raw logs (cleaned)
          if (isDevMode) {
            if (!isRaw) return null; // Hide humanized logs in Dev Mode
            return (
              <div key={idx} className="font-mono text-[10px] text-green-400/80 bg-black/50 p-2 rounded border border-green-900/30 whitespace-pre-wrap break-all mb-1">
                {rawLog.replace('[RAW] ', '')}
              </div>
            );
          }

          // NORMAL MODE: Hide raw logs, show humanized logs
          if (isRaw) return null;

          // Handle Structured Retrieval Events
          if (rawLog.startsWith('[RETRIEVAL_EVENT]')) {
            try {
              const results = JSON.parse(rawLog.substring(17));
              const previousRetrievals = logs.slice(0, idx).filter(l => l.startsWith('[RETRIEVAL_EVENT]')).length;
              const isDeepDive = previousRetrievals > 0;

              return (
                <div key={idx} className="animate-in fade-in slide-in-from-left-2 duration-300 flex items-start gap-3 my-3">
                  <span className="text-[10px] font-mono text-slate-300 mt-1 min-w-[50px] shrink-0 opacity-80">
                    {new Date().toLocaleTimeString().split(' ')[0]}
                  </span>
                  <div className="flex-1 bg-slate-900/30 rounded-lg border border-white/5 overflow-hidden ml-4"> {/* Indented */}
                    <div className="px-3 py-2 bg-slate-800/50 border-b border-white/5 flex items-center gap-2">
                      <span className="text-blue-400 text-xs">📚</span>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {isDeepDive ? 'Deep Dive Analysis' : 'Relevant Policies & SOPs'}
                      </h4>
                      <span className="text-[10px] font-medium text-slate-500 ml-auto">
                        {results.length} Docs Found
                      </span>
                    </div>

                    <div className="p-3 space-y-2">
                      {results.map((doc: any, i: number) => {
                        const title = doc.title || "Unknown Doc";
                        const lowerTitle = title.toLowerCase();
                        // Clean title: remove .pdf, replace underscores
                        const cleanTitle = title.replace(/\.pdf$/i, '').replace(/_/g, ' ');

                        let icon = "📄";
                        if (lowerTitle.includes('msa') || lowerTitle.includes('agreement') || lowerTitle.includes('contract')) {
                          icon = "📜";
                        } else if (lowerTitle.includes('sop') || lowerTitle.includes('standard operating')) {
                          icon = "🛡️";
                        } else if (lowerTitle.includes('compliance') || lowerTitle.includes('terms') || lowerTitle.includes('policy')) {
                          icon = "⚖️";
                        }

                        // Support multiple URL fields
                        const docUrl = doc.uri || doc.url || doc.link || '#';

                        return (
                          <div key={i} className="text-xs flex items-center gap-2">
                            <span className="text-[12px]">{icon}</span>
                            <a href={docUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-slate-200 hover:underline hover:text-blue-300">
                              {cleanTitle}
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            } catch (e) { return null; }
          }

          // Handle Structured History Events
          if (rawLog.startsWith('[HISTORY_EVENT]')) {
            try {
              const results = JSON.parse(rawLog.substring(15));
              return (
                <div key={idx} className="animate-in fade-in slide-in-from-left-2 duration-300 flex items-start gap-3 my-3">
                  <span className="text-[10px] font-mono text-slate-300 mt-1 min-w-[50px] shrink-0 opacity-80">
                    {new Date().toLocaleTimeString().split(' ')[0]}
                  </span>
                  <div className="flex-1 bg-slate-900/30 rounded-lg border border-white/5 overflow-hidden ml-4"> {/* Indented */}
                    <div className="px-3 py-2 bg-slate-800/50 border-b border-white/5 flex items-center gap-2">
                      <span className="text-purple-400 text-xs">🧬</span>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Similar Past Events
                      </h4>
                      <span className="text-[10px] font-medium text-slate-500 ml-auto">
                        {results.length} Matches Found
                      </span>
                    </div>

                    <div className="p-3 space-y-2">
                      {results.map((evt: any, i: number) => {
                        const actionTaken = evt.action || evt.type || "Event";
                        // Clean up action name
                        const friendlyAction = actionTaken.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                        const isSuccess = !evt.outcome || evt.outcome === 'SUCCESS';

                        return (
                          <div key={i} className="flex flex-col gap-1 text-xs bg-black/20 p-2 rounded border border-white/5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-blue-400 font-mono text-[10px] bg-blue-900/20 px-1 rounded border border-blue-800/30">{evt.id}</span>
                                <span className="font-bold text-slate-200">{friendlyAction}</span>
                              </div>

                              {!isSuccess && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-orange-900/40 text-orange-400">
                                  {evt.outcome}
                                </span>
                              )}
                            </div>

                            {evt.reasoning && (
                              <div className="text-slate-400 text-[11px] leading-snug italic border-l-2 border-slate-700 pl-2 mt-1">
                                "{evt.reasoning}"
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              );
            } catch (e) { return null; }
          }



          const { text, type } = humanizeLogMessage(rawLog);
          if (!text) return null; // Skip hidden logs

          return (
            <div key={idx} className="animate-in fade-in slide-in-from-left-2 duration-300 flex items-start gap-3 group my-1">
              <span className="text-[10px] font-mono text-slate-300 mt-1 min-w-[50px] shrink-0 opacity-80">
                {new Date().toLocaleTimeString().split(' ')[0]}
              </span>
              <div className={`text-sm leading-relaxed break-words whitespace-pre-wrap flex-1 font-sans
                  ${type === 'error' ? 'text-red-400 bg-red-900/10 p-2 rounded border border-red-500/10' :
                  type === 'warning' ? 'text-amber-400' :
                    type === 'success' ? 'text-emerald-400 font-medium' :
                      type === 'reasoning' ? 'text-slate-300 italic' :
                        'text-slate-300'
                }`}>
                {text.split('**').map((part, i) =>
                  i % 2 === 1 ? <strong key={i} className="text-white not-italic font-semibold">{part}</strong> : part
                )}
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center gap-2 text-blue-500 animate-pulse py-2 pl-14">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            <span className="text-xs font-mono">Processing...</span>
          </div>
        )}

        {/* Decision Card (Embedded at bottom of stream) */}
        {/* Decision Card (Compact) */}
        {decision && (
          <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pl-4 pb-4">
            <div className={`rounded-lg border overflow-hidden shadow-lg 
                              ${decision.action?.includes('escalate')
                ? 'bg-orange-950/40 border-orange-500/30'
                : 'bg-emerald-950/40 border-emerald-500/30'
              }`}>
              <div className="flex items-center gap-3 p-3">
                {/* Icon */}
                <div className={`p-1.5 rounded-md ${decision.action?.includes('escalate') ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  <span className="text-lg">{decision.action?.includes('escalate') ? '👮' : '⚡'}</span>
                </div>

                {/* Title & Stats */}
                <div className="flex-1 flex items-center justify-between">
                  <h4 className={`text-sm font-bold uppercase tracking-wide ${decision.action?.includes('escalate') ? 'text-orange-300' : 'text-emerald-300'}`}>
                    {decision.action === 'request_reshipment' ? 'Reshipment Triggered' :
                      decision.action === 'update_eta' ? 'ETA Updated' :
                        decision.action?.includes('escalate') ? 'Escalated to Human' :
                          decision.action?.replace(/_/g, ' ')}
                  </h4>
                  <span className="text-[10px] font-mono opacity-60">
                    {Math.round(decision.confidence * 100)}% Confidence
                  </span>
                </div>
              </div>

              {/* Extended Reasoning Summary */}
              <div className="px-3 pb-3 pt-0">
                {/* Reasoning Content */}
                <div className="text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-2 space-y-2">
                  {decision.reasoning?.split('\n').map((line, i) => {
                    const clean = line.replace(/\*\*/g, '').replace('Reasoning Summary:', '').trim();
                    if (!clean) return null;

                    // REMOVE: Redundant Protocol Steps (Intent, Retrieval, Pattern Rec) - these belong in the stream, not the card
                    if (clean.startsWith('I am analyzing') ||
                      clean.includes('Pattern Recognition:') ||
                      clean.includes('Intelligence Retrieval:')) {
                      return null;
                    }

                    // DETECT: List Items (Numbered or Bulleted)
                    const isListItem = line.match(/^\d+\./) || line.trim().startsWith('*') || line.trim().startsWith('-');

                    if (isListItem) {
                      let content = clean.replace(/^\d+\./, '').replace(/^[\*\-]/, '').trim();

                      // Emoji Mapper based on content keywords
                      let emoji = "🔹"; // Default
                      const lower = content.toLowerCase();

                      if (lower.includes('contract') || lower.includes('sla') || lower.includes('policy') || lower.includes('obligation')) emoji = "📜";
                      else if (lower.includes('history') || lower.includes('precedent') || lower.includes('past')) emoji = "🕰️";
                      else if (lower.includes('customer') || lower.includes('relationship') || lower.includes('vip') || lower.includes('partner')) emoji = "🤝";
                      else if (lower.includes('cost') || lower.includes('revenue') || lower.includes('financial') || lower.includes('profit')) emoji = "💰";
                      else if (lower.includes('risk') || lower.includes('disruption') || lower.includes('impact')) emoji = "⚠️";
                      else if (lower.includes('inventory') || lower.includes('stock')) emoji = "📦";
                      else if (lower.includes('weather') || lower.includes('storm')) emoji = "🌩️";

                      return (
                        <div key={i} className="flex gap-2 ml-1">
                          <span className="text-base shrink-0 select-none">{emoji}</span>
                          <span className="flex-1 text-slate-300">{content}</span>
                        </div>
                      )
                    }
                    if (line.includes('Reasoning Summary')) {
                      return <div key={i} className="font-semibold text-slate-300 mb-1">{clean}</div>
                    }

                    return <p key={i}>{clean}</p>;
                  })}
                </div>

                {/* Tool Execution Results (Crisp Bullets) */}
                {decision.toolResult && (
                  <div className="mt-3 text-xs font-mono space-y-1 bg-black/20 p-2 rounded border border-white/5">
                    {/* ETA Update */}
                    {(decision.toolResult.updated_eta || decision.toolResult.new_eta) && (
                      <div className="flex items-center gap-2 text-emerald-300">
                        <span>📅</span>
                        <span>New ETA: {decision.toolResult.updated_eta || decision.toolResult.new_eta}</span>
                      </div>
                    )}
                    {/* Reshipment */}
                    {decision.toolResult.new_order_id && (
                      <div className="flex items-center gap-2 text-blue-300">
                        <span>📦</span>
                        <span>Order: {decision.toolResult.new_order_id}</span>
                      </div>
                    )}
                    {decision.toolResult.carrier && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <span>🚚</span>
                        <span>Carrier: {decision.toolResult.carrier}</span>
                      </div>
                    )}
                    {/* Escalation */}
                    {decision.toolResult.ticket_id && (
                      <div className="flex items-center gap-2 text-orange-300">
                        <span>🎫</span>
                        <span>Ticket: {decision.toolResult.ticket_id}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Spacer for bottom scroll */}
        <div className="h-4" />
      </div>
    </div>
  );
};
