import React, { useState } from 'react';
import { DataFactory } from './DataFactory';
import { KnowledgeBase } from './KnowledgeBase';
import { ActionServices } from './ActionServices';
import { VertexAgentConfig } from '../../types';
import { generateKnowledgeDocs } from '../../utils/pdfGenerator';

interface Props {
  agentConfig: VertexAgentConfig;
  setAgentConfig: (config: VertexAgentConfig) => void;
  onExport: () => void;
}

type Tab = 'MANUAL' | 'DATA_LAB' | 'DEV_HUB' | 'DEPLOYMENT';

export const SettingsView: React.FC<Props> = ({ agentConfig, setAgentConfig, onExport }) => {
  const [activeTab, setActiveTab] = useState<Tab>('MANUAL');

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="p-6 pb-4">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <span className="text-3xl">⚙️</span>
            <span>System Settings & Tools</span>
          </h2>
          <p className="text-slate-400 mt-1">
            Complete control tower for safe deployment, simulation, and observability.
          </p>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex px-6 gap-6 overflow-x-auto">
          <TabButton
            active={activeTab === 'MANUAL'}
            onClick={() => setActiveTab('MANUAL')}
            label="User Guide & Architecture"
            icon="📘"
          />
          <TabButton
            active={activeTab === 'DATA_LAB'}
            onClick={() => setActiveTab('DATA_LAB')}
            label="Synthetic Data Lab"
            icon="🧪"
          />
          <TabButton
            active={activeTab === 'DEV_HUB'}
            onClick={() => setActiveTab('DEV_HUB')}
            label="Developer Hub"
            icon="👨‍💻"
          />
          <TabButton
            active={activeTab === 'DEPLOYMENT'}
            onClick={() => setActiveTab('DEPLOYMENT')}
            label="Deployment Settings"
            icon="🚀"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">

        {/* SECTION 1: USER MANUAL & ARCHITECTURE */}
        {activeTab === 'MANUAL' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-8">
              <h4 className="font-bold text-slate-300 mb-6 uppercase tracking-wider text-xs">High-Level System Flow</h4>

              {/* CSS Architecture Diagram */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 py-4 mb-8">
                {/* Frontend */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-32 h-20 bg-blue-600/20 border-2 border-blue-500 rounded-lg flex items-center justify-center text-center p-2 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                    <span className="font-bold text-blue-100">React UI</span>
                    <br /><span className="text-[10px] text-blue-300">(User Interface)</span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-slate-500 text-2xl hidden md:block">↔️</div>
                <div className="text-slate-500 text-2xl md:hidden">↕️</div>

                {/* Backend Agent */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-40 h-24 bg-purple-600/20 border-2 border-purple-500 rounded-lg flex items-center justify-center text-center p-2 relative shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                    <div className="absolute -top-3 bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">ORCHESTRATOR</div>
                    <div>
                      <span className="font-bold text-purple-100">Python Agent</span>
                      <br /><span className="text-[10px] text-purple-300">(FastAPI / LangChain)</span>
                    </div>
                  </div>
                </div>

                {/* Split Arrows */}
                <div className="flex md:flex-col gap-2">
                  <div className="text-slate-500 md:-rotate-45">↗️</div>
                  <div className="text-slate-500 md:rotate-45">↘️</div>
                </div>

                {/* Services */}
                <div className="flex flex-col gap-4">
                  <div className="w-48 h-16 bg-green-600/20 border border-green-500 rounded-lg flex items-center justify-center gap-2 p-2">
                    <span className="text-xl">🧠</span>
                    <div className="text-left">
                      <div className="font-bold text-green-100 text-sm">Vertex AI Gemini</div>
                      <div className="text-[10px] text-green-300">Reasoning Engine</div>
                    </div>
                  </div>
                  <div className="w-48 h-16 bg-orange-600/20 border border-orange-500 rounded-lg flex items-center justify-center gap-2 p-2">
                    <span className="text-xl">🛠️</span>
                    <div className="text-left">
                      <div className="font-bold text-orange-100 text-sm">Tools (Cloud Run)</div>
                      <div className="text-[10px] text-orange-300">ERP, TMS, Email</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-400">
                <div className="bg-slate-950 p-4 rounded border border-slate-800">
                  <strong className="text-white block mb-2">1. Simulate</strong>
                  Use the "Simulate Event" button on the Dashboard to inject random supply chain exceptions (delays, damages).
                </div>
                <div className="bg-slate-950 p-4 rounded border border-slate-800">
                  <strong className="text-white block mb-2">2. Orchestrate</strong>
                  The Agent analyzes the event using RAG (Knowledge Base) and selects the best tool to resolve it.
                </div>
                <div className="bg-slate-950 p-4 rounded border border-slate-800">
                  <strong className="text-white block mb-2">3. Deploy</strong>
                  Switch to "Connected Mode" in Deployment Settings to swap the mock simulation for the real Vertex AI backend.
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: SYNTHETIC DATA & KNOWLEDGE */}
        {activeTab === 'DATA_LAB' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-0 flex flex-col">
            {/* Top: Generator */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <h4 className="font-bold text-white text-lg mb-2 flex items-center gap-2">
                <span>🏭</span> Operational Data Generator
              </h4>
              <p className="text-sm text-slate-400 mb-6 max-w-3xl">
                Generate synthetic shipment history in BigQuery to simulate a real data warehouse environment for the agent to query.
              </p>
              <DataFactory onExport={onExport} />
            </div>

            {/* Middle: Knowledge Generator (PDFs) */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="font-bold text-white text-lg mb-2 flex items-center gap-2">
                  <span>📄</span> Synthetic Contract Generator (Client-Side)
                </h4>
                <p className="text-sm text-slate-400 max-w-2xl">
                  Generate and download 12 high-fidelity PDF contracts (VIP MSAs, Pharma SOPs) directly in your browser.
                  Architecture: Pure Frontend Generation (No Backend Dependencies).
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const blob = await generateKnowledgeDocs();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = "synthetic_knowledge_docs.zip";
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  } catch (e) {
                    console.error("Failed to generate docs", e);
                    alert("Generation failed");
                  }
                }}
                className="shrink-0 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all hover:scale-105"
              >
                <span>⬇️</span> Generate & Download PDFs
              </button>
            </div>

            {/* Bottom: Knowledge Viewer */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-0 flex flex-col min-h-[600px] overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <span>📚</span> Knowledge Base Preview
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    RAG Documents (Policies, SLAs, Protocols) ingested into Vertex AI Search.
                  </p>
                </div>
                <div className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                  Read-Only Preview
                </div>
              </div>
              <div className="flex-1 bg-black relative">
                <KnowledgeBase />
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: DEVELOPER HUB */}
        {activeTab === 'DEV_HUB' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col min-h-0">

            {/* Capabilities - Horizontal Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center gap-3">
                <span className="text-2xl">🧠</span>
                <div>
                  <div className="font-bold text-white text-sm">Multi-turn Reasoning</div>
                  <div className="text-xs text-slate-400">ReAct Pattern Implemented</div>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center gap-3">
                <span className="text-2xl">📚</span>
                <div>
                  <div className="font-bold text-white text-sm">RAG Integration</div>
                  <div className="text-xs text-slate-400">Vertex AI Search Connected</div>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <div className="font-bold text-white text-sm">Action Services</div>
                  <div className="text-xs text-slate-400">OpenAPI Tool Definitions</div>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center gap-3">
                <span className="text-2xl">👥</span>
                <div>
                  <div className="font-bold text-white text-sm">Human-in-the-loop</div>
                  <div className="text-xs text-slate-400">Escalation Workflow</div>
                </div>
              </div>
            </div>

            {/* Action Services - Main Area */}
            <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col min-h-[500px]">
              <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white">Action Service Definitions (OpenAPI)</h4>
                  <p className="text-xs text-slate-400 mt-1">Live tool definitions available to the agent for execution.</p>
                </div>
                <div className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded font-mono">
                  scct_ui/services/geminiService.ts
                </div>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 overflow-y-auto">
                  <ActionServices />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: DEPLOYMENT */}
        {activeTab === 'DEPLOYMENT' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-lg">Vertex AI Connection</h4>
                <p className="text-slate-400 text-sm mt-1 max-w-xl">
                  Toggle between the local simulation (mock LLM) and the live Vertex AI backend.
                  Requires valid Google Cloud credentials in the backend environment.
                </p>
                <div className="mt-4 flex gap-4 text-xs font-mono text-slate-500">
                  <div>PROJECT_ID: <span className="text-slate-300">{agentConfig.projectId || 'Not Configured'}</span></div>
                  <div>REGION: <span className="text-slate-300">{agentConfig.locationId}</span></div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                {/* Tool Simulation Toggle */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs ${agentConfig.simulateTools ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                    {agentConfig.simulateTools ? '🚧 TOOLS SIMULATED' : '🌩️ TOOLS CONNECTED'}
                  </span>
                  <button
                    onClick={() => setAgentConfig({ ...agentConfig, simulateTools: !agentConfig.simulateTools })}
                    className={`w-10 h-5 rounded-full p-1 transition-colors ${agentConfig.simulateTools ? 'bg-amber-500' : 'bg-slate-700'}`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${agentConfig.simulateTools ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className={`px-3 py-1 rounded text-sm font-bold border ${agentConfig.useRealAgent ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                  {agentConfig.useRealAgent ? '● LIVE CONNECTED' : '○ SIMULATION MODE'}
                </div>
                <button
                  onClick={() => setAgentConfig({ ...agentConfig, useRealAgent: !agentConfig.useRealAgent })}
                  className={`px-6 py-2 rounded-lg font-bold transition-all ${agentConfig.useRealAgent
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                    }`}
                >
                  {agentConfig.useRealAgent ? 'Disconnect Agent' : 'Connect to Vertex AI'}
                </button>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string; icon: string }> = ({ active, onClick, label, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${active
      ? 'border-blue-500 text-blue-400'
      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
      }`}
  >
    <span className="text-xl">{icon}</span>
    <span className={`font-bold text-sm ${active ? 'text-white' : ''}`}>{label}</span>
  </button>
);
