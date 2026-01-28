import React from 'react';

interface SidebarProps {
  currentView: 'DASHBOARD' | 'KNOWLEDGE_BASE' | 'DATA_FACTORY' | 'ACTION_SERVICES';
  setView: (view: 'DASHBOARD' | 'KNOWLEDGE_BASE' | 'DATA_FACTORY' | 'ACTION_SERVICES') => void;
  onExport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onExport }) => {
  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col h-full sticky top-0">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
          OpsAgent<span className="text-blue-500">.ai</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Autonomous Supply Chain</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 pl-2">Control Tower</div>
        <NavItem 
          active={currentView === 'DASHBOARD'} 
          label="Dashboard" 
          icon="📊" 
          onClick={() => setView('DASHBOARD')}
        />
        <NavItem label="Exceptions Feed" icon="⚠️" count={3} onClick={() => setView('DASHBOARD')} />
        
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-8 pl-2">Knowledge Base</div>
        <NavItem 
          active={currentView === 'KNOWLEDGE_BASE'} 
          label="Contracts (RAG)" 
          icon="📄" 
          onClick={() => setView('KNOWLEDGE_BASE')}
        />
        
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-8 pl-2">Backend & Tools</div>
        <NavItem 
          active={currentView === 'ACTION_SERVICES'} 
          label="Action Services" 
          icon="⚡" 
          onClick={() => setView('ACTION_SERVICES')}
        />
        <NavItem 
          active={currentView === 'DATA_FACTORY'} 
          label="Data Factory" 
          icon="🏭" 
          onClick={() => setView('DATA_FACTORY')}
        />
        
        <div className="mt-8">
            <button 
                onClick={onExport}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg text-xs font-bold bg-slate-800 text-blue-400 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 border-dashed"
            >
                <span>💾 JSONL Export</span>
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-2 px-2">
                For Vertex AI Search ingestion
            </p>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs">
            G3
          </div>
          <div>
            <div className="text-sm font-medium text-white">Gemini 3 Pro</div>
            <div className="text-xs text-green-400">● Online</div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface NavItemProps {
    label: string;
    icon: string;
    active?: boolean;
    count?: number;
    onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, active, count, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-all ${active ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
  >
    <div className="flex items-center gap-3">
      <span className="opacity-80">{icon}</span>
      <span>{label}</span>
    </div>
    {count && <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">{count}</span>}
  </button>
);