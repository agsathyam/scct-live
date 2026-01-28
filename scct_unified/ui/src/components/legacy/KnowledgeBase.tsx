import React, { useState, useEffect } from 'react';
import { useDemo } from '../../context/DemoContext';
import { generatePDF, generateAllDocsZip, SimulatedDoc } from '../../services/documentGenerator';

export const KnowledgeBase: React.FC = () => {
  const { documents, industry } = useDemo();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  useEffect(() => {
    if (documents.length > 0 && !selectedDocId) {
      setSelectedDocId(documents[0].id);
    }
  }, [documents]);

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  const handleDownloadPDF = (doc: SimulatedDoc) => {
    const blob = generatePDF(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    const blob = await generateAllDocsZip(industry);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${industry}_KnowledgeBase.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full">
      {/* Document List */}
      <div className="w-80 bg-slate-900 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-white font-semibold">Document Library</h2>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{industry}</span>
          </div>
          <p className="text-xs text-slate-500 mb-2">Vertex AI Search Index Source</p>
          <button
            onClick={handleDownloadZip}
            className="w-full bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-bold py-2 rounded border border-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <span>📦 Download All (ZIP)</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {documents.map(doc => (
            <button
              key={doc.id}
              onClick={() => setSelectedDocId(doc.id)}
              className={`w-full text-left p-3 rounded-lg mb-1 transition-all ${selectedDocId === doc.id
                  ? 'bg-[var(--primary-brand)]/20 text-blue-100 border border-[var(--primary-brand)]/50'
                  : 'text-slate-400 hover:bg-slate-800'
                }`}
            >
              <div className="text-xs font-bold mb-1">{doc.id}</div>
              <div className="text-sm font-medium line-clamp-1">{doc.title}</div>
              <div className="flex justify-between mt-1">
                <div className="text-[10px] text-slate-500 uppercase">{doc.category}</div>
                <div className="text-[10px] text-slate-600">{doc.lastUpdated}</div>
              </div>
            </button>
          ))}
          {documents.length === 0 && (
            <div className="p-4 text-center text-slate-600 text-xs italic">
              No documents generated for this industry.
            </div>
          )}
        </div>
      </div>

      {/* Document Preview */}
      <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden relative">
        {selectedDoc ? (
          <>
            <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-800 rounded">📄</div>
                <div>
                  <h1 className="text-white font-medium text-sm">{selectedDoc.title}</h1>
                  <div className="text-xs text-slate-500">Last updated: {selectedDoc.lastUpdated}</div>
                </div>
              </div>
              <button
                onClick={() => handleDownloadPDF(selectedDoc)}
                className="flex items-center gap-2 bg-slate-800 text-blue-400 border border-slate-700 px-4 py-2 rounded text-sm font-bold hover:bg-slate-700 hover:text-white transition-colors"
              >
                <span>⬇ Download PDF</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-950">
              {/* Document Paper Simulation */}
              <div className="max-w-3xl mx-auto bg-white text-black p-12 min-h-[800px] shadow-2xl relative">
                <div className="absolute top-0 right-0 p-4 opacity-50">
                  <div className="text-4xl font-black text-gray-200 uppercase rotate-[-15deg]">CONFIDENTIAL</div>
                </div>

                <div className="flex justify-between border-b-2 border-black pb-4 mb-8">
                  <div className="font-bold text-xl font-serif">SCCT Control Tower</div>
                  <div className="text-right text-xs">
                    <div>ID: {selectedDoc.id}</div>
                    <div>Category: {selectedDoc.category}</div>
                  </div>
                </div>

                <h1 className="text-center font-serif text-2xl font-bold uppercase mb-8 underline">{selectedDoc.title}</h1>

                <div className="font-serif text-sm leading-relaxed whitespace-pre-wrap text-justify">
                  {selectedDoc.content}
                </div>

                <div className="mt-16 pt-8 border-t border-gray-400 flex justify-between">
                  <div>
                    <div className="border-t border-black w-48 pt-2 text-xs">Authorized Signature</div>
                  </div>
                  <div>
                    <div className="border-t border-black w-32 pt-2 text-xs">Date</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            Select a document to view
          </div>
        )}
      </div>
    </div>
  );
};