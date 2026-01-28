import React, { useEffect, useState } from 'react';
import { VertexAgentConfig } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: VertexAgentConfig;
  setConfig: (config: VertexAgentConfig) => void;
}

export const AgentSettings: React.FC<Props> = ({ isOpen, onClose, config, setConfig }) => {
  const [urlInput, setUrlInput] = useState('');

  // Auto-save to local storage whenever config changes
  useEffect(() => {
    localStorage.setItem('scct_agent_config', JSON.stringify(config));
  }, [config]);

  if (!isOpen) return null;

  const handleChange = (key: keyof VertexAgentConfig, value: string | boolean) => {
    setConfig({ ...config, [key]: value });
  };

  const handleUrlParse = (url: string) => {
    setUrlInput(url);
    // Regex to extract parts from: https://.../projects/{PROJECT}/locations/{LOCATION}/reasoningEngines/{AGENT_ID}:query
    const regex = /projects\/([^/]+)\/locations\/([^/]+)\/reasoningEngines\/([^/:]+)/;
    const match = url.match(regex);

    if (match) {
      const [, projectId, locationId, agentId] = match;
      setConfig({
        ...config,
        projectId,
        locationId,
        agentId,
        useRealAgent: true
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-blue-500">🔌</span> Agent Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="p-6 space-y-6">

          <div className="flex items-center justify-between bg-slate-800 p-4 rounded-lg border border-slate-700">
            <div>
              <div className="font-bold text-white">Enable Real Agent</div>
              <div className="text-xs text-slate-400">Switch from Mock Mode to Live API</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.useRealAgent}
                onChange={(e) => handleChange('useRealAgent', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-lg">
            <div className="flex gap-3">
              <div className="text-blue-400 text-xl">ℹ️</div>
              <div className="text-xs text-slate-400 leading-relaxed">
                <strong>Connected Mode Active</strong><br />
                The frontend will communicate securely with the Unified Backend service.<br />
                Ensure you are signed in to authenticate your requests.
              </div>
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white font-bold">Close</button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};