import React, { useState } from 'react';
import { generateBigQueryData, downloadCSV } from '../../services/dataGenerator';

interface Props {
    onExport: () => void;
}

export const DataFactory: React.FC<Props> = ({ onExport }) => {
    const [recordCount, setRecordCount] = useState(1000);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedData, setGeneratedData] = useState<{ shipments: any[], exceptions: any[], outcomes: any[] } | null>(null);

    const handleGenerate = () => {
        setIsGenerating(true);
        setGeneratedData(null);

        // Simulate processing time
        setTimeout(() => {
            const data = generateBigQueryData(recordCount);
            setGeneratedData(data);
            setIsGenerating(false);
        }, 800);
    };

    return (
        <div className="h-full bg-slate-950 p-6 overflow-hidden flex flex-col animate-in fade-in duration-500">
            <div className="max-w-4xl mx-auto w-full space-y-6">

                {/* Header */}
                <div className="border-b border-white/5 pb-4">
                    <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <span className="text-blue-400">🏭</span>
                        Data Engineering Hub
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Generate synthetic operational history for BigQuery and manage RAG ingestion.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* LEFT: Structural Data (BigQuery) */}
                    <div className="bg-slate-900/40 rounded-xl p-5 border border-white/5 flex flex-col gap-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-1 h-4 rounded-full bg-blue-500"></span>
                            <h2 className="text-sm font-bold text-white uppercase tracking-wide">Operational History</h2>
                        </div>

                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Records to Generate</label>
                                <input
                                    type="number"
                                    value={recordCount}
                                    onChange={(e) => setRecordCount(Number(e.target.value))}
                                    className="w-full bg-black/20 border border-slate-700/50 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500 card-shadow-inner font-mono"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className={`px-4 py-2 rounded h-[38px] text-xs font-bold text-white transition-all whitespace-nowrap ${isGenerating
                                        ? 'bg-slate-700 cursor-wait'
                                        : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20'
                                        }`}
                                >
                                    {isGenerating ? 'Generating...' : '🚀 Generate'}
                                </button>
                            </div>
                        </div>

                        {generatedData ? (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <div className="text-xs text-green-400 flex items-center gap-1.5 font-bold bg-green-900/10 p-2 rounded border border-green-500/20">
                                    <span>✓</span> Generated {generatedData.shipments.length} records
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    <DownloadButton label="Shipments.csv" filename="bq_shipments.csv" data={generatedData.shipments} color="blue" />
                                    <DownloadButton label="Exceptions.csv" filename="bq_exceptions.csv" data={generatedData.exceptions} color="orange" />
                                    <DownloadButton label="Resolutions.csv" filename="bq_resolutions.csv" data={generatedData.outcomes} color="purple" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-6 border-2 border-dashed border-slate-800 rounded-lg">
                                <div className="text-center opacity-30">
                                    <div className="text-2xl mb-1">📊</div>
                                    <div className="text-[10px]">No data generated yet</div>
                                </div>
                            </div>
                        )}
                        <div className="text-[10px] text-slate-500 font-mono mt-auto pt-2">
                            Target Table: `supply_chain_control_tower`
                        </div>
                    </div>

                    {/* RIGHT: Unstructured Data (RAG) */}
                    <div className="bg-slate-900/40 rounded-xl p-5 border border-white/5 flex flex-col gap-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-1 h-4 rounded-full bg-emerald-500"></span>
                            <h2 className="text-sm font-bold text-white uppercase tracking-wide">Knowledge Base (RAG)</h2>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="bg-black/20 p-4 rounded-lg border border-white/5 text-xs text-slate-300 space-y-2">
                                <p>Export current Playbooks, Contracts, and Policies into JSONL format for Vertex AI Search.</p>
                                <button
                                    onClick={onExport}
                                    className="w-full mt-3 flex items-center justify-center gap-2 p-2 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/30 transition-all font-bold"
                                >
                                    <span>💾 Download JSONL</span>
                                </button>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-[10px] font-bold text-slate-500 uppercase">Ingestion Steps</h3>
                                <div className="space-y-1.5">
                                    <Step num={1} text="Go to Agent Builder > Data Stores" />
                                    <Step num={2} text="Create Cloud Storage Data Store" />
                                    <Step num={3} text="Upload the .jsonl file" />
                                    <Step num={4} text="Select 'Unstructured' schema" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const Step: React.FC<{ num: number, text: string }> = ({ num, text }) => (
    <div className="flex gap-2 text-xs text-slate-400">
        <span className="font-mono text-slate-600 font-bold bg-black/30 px-1.5 rounded">{num}</span>
        <span>{text}</span>
    </div>
);

const DownloadButton: React.FC<{ label: string; filename: string; data: any[]; color: string }> = ({ label, filename, data, color }) => {
    const getColorClasses = (c: string) => {
        switch (c) {
            case 'orange': return 'text-orange-400 border-orange-500/20 hover:bg-orange-500/10';
            case 'purple': return 'text-purple-400 border-purple-500/20 hover:bg-purple-500/10';
            default: return 'text-blue-400 border-blue-500/20 hover:bg-blue-500/10';
        }
    };

    return (
        <button
            onClick={() => downloadCSV(data, filename)}
            className={`flex items-center justify-between px-3 py-2 rounded bg-black/20 border transition-all text-xs font-medium ${getColorClasses(color)}`}
        >
            <span className="flex items-center gap-2">
                <span>📄</span>
                <span>{label}</span>
            </span>
            <span className="opacity-50 hover:opacity-100 text-[10px] uppercase">Download</span>
        </button>
    );
};