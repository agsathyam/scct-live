import React, { useRef, useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { INDUSTRIES } from '../../services/scenarioGenerator';

export const DemoSettings: React.FC = () => {
  const { brand, industry, updateBrand, setIndustry, resetDemo } = useDemo();
  const [nameInput, setNameInput] = useState(brand.name);
  const [taglineInput, setTaglineInput] = useState(brand.tagline || 'Autonomous Supply Chain');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleLogoUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Basic cleanup to ensure it's a valid data URL
      if (result && result.startsWith('data:image')) {
        updateBrand(nameInput, result, brand.showName, taglineInput, brand.showTagline);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSave = () => {
    updateBrand(nameInput, brand.logo, brand.showName, taglineInput, brand.showTagline);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header Section */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-blue-400">⚙️</span>
            Demo Personalization
          </h1>
          <p className="text-xs text-slate-400 mt-1">Customize the environment for your prospect.</p>
        </div>
        <button
          onClick={resetDemo}
          className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-all border border-red-500/20 hover:border-red-500/40"
        >
          Reset Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Left Column: Brand Identity (Logo & Colors) */}
        <div className="md:col-span-4 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Brand Logo</label>
            <div
              className={`
                aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group
                ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-800/60'}
              `}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {brand.logo ? (
                <div className="relative w-full h-full flex items-center justify-center p-4 group/logo">
                  <img src={brand.logo} alt="Brand Logo" className="max-w-full max-h-full object-contain drop-shadow-md" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateBrand(nameInput, undefined, brand.showName, taglineInput, brand.showTagline);
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover/logo:opacity-100 transition-all shadow-lg scale-75 hover:scale-100"
                    title="Remove Logo"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              ) : (
                <div className="text-center p-4">
                  <div className="text-2xl mb-2 opacity-50">📷</div>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight">Drop logo or click to upload</p>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0])}
              />
            </div>
          </div>

          {/* Color Preview - Condensed */}
          <div className="p-3 bg-slate-900/60 rounded-lg border border-white/5 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-md shadow-inner ring-1 ring-white/10"
              style={{ backgroundColor: brand.colors.primary }}
            />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Primary Color</div>
              <div className="text-xs font-mono text-slate-300 truncate">{brand.colors.primary}</div>
            </div>
          </div>
        </div>

        {/* Right Column: Brand Text & Toggles */}
        <div className="md:col-span-8 space-y-5">

          {/* Company Name Inptu */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Company Name</label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Show in Header</span>
                <button
                  onClick={() => updateBrand(nameInput, brand.logo, !brand.showName, taglineInput, brand.showTagline)}
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${brand.showName ? 'bg-blue-500' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${brand.showName ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleSave}
              className="w-full bg-slate-900/50 border border-slate-700 focus:border-blue-500/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
              placeholder="e.g. Acme Corp"
            />
          </div>

          {/* Tagline Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tagline</label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Show in Header</span>
                <button
                  onClick={() => updateBrand(nameInput, brand.logo, brand.showName, taglineInput, !brand.showTagline)}
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${brand.showTagline ? 'bg-blue-500' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${brand.showTagline ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
            <input
              type="text"
              value={taglineInput}
              onChange={(e) => setTaglineInput(e.target.value)}
              onBlur={handleSave}
              className="w-full bg-slate-900/50 border border-slate-700 focus:border-blue-500/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
              placeholder="e.g. Innovation Delivered"
            />
          </div>

          {/* Industry Selection - Grid Style */}
          <div className="pt-4 border-t border-white/5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3 block">Industry & Scenario Context</label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => setIndustry(ind.id)}
                  className={`
                      relative p-3 rounded-lg border text-left transition-all duration-200 group flex flex-col gap-1.5
                      ${industry === ind.id
                      ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                      : 'bg-slate-900/30 border-slate-800 hover:border-slate-600 hover:bg-slate-800/50'}
                    `}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-lg ${industry === ind.id ? 'scale-110' : 'grayscale group-hover:grayscale-0'} transition-all`}>
                      {ind.id === 'RETAIL' ? '🥦' : ind.id === 'TECH' ? '💻' : ind.id === 'PHARMA' ? '💊' : ind.id === 'AUTO' ? '🚗' : '📦'}
                    </span>
                    {industry === ind.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
                    )}
                  </div>
                  <span className={`text-xs font-semibold ${industry === ind.id ? 'text-blue-100' : 'text-slate-400 group-hover:text-slate-300'}`}>
                    {ind.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
