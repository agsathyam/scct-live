import React, { createContext, useContext, useState, useEffect } from 'react';
import { extractColorsFromImage, BrandColors } from '../utils/colorUtils';
import { generateScenarios, Industry, INDUSTRIES } from '../services/scenarioGenerator';
import { generateDocuments, SimulatedDoc } from '../services/documentGenerator';
import { ExceptionEvent } from '../types';

interface DemoBrand {
  name: string;
  logo?: string; // Data URL
  colors: BrandColors;
  showName?: boolean;
  tagline?: string;
  showTagline?: boolean;
}

interface DemoContextType {
  brand: DemoBrand;
  industry: Industry;
  customScenarios: ExceptionEvent[];
  documents: SimulatedDoc[];
  updateBrand: (name: string, logo?: string, showName?: boolean, tagline?: string, showTagline?: boolean) => Promise<void>;
  setIndustry: (ind: Industry) => void;
  resetDemo: () => void;
}

const DEFAULT_BRAND: DemoBrand = {
  name: 'SYNERGY',
  colors: { primary: '#3b82f6', secondary: '#1e40af' }, // Blue default
  showName: true,
  tagline: 'Autonomous Supply Chain Control Tower',
  showTagline: true
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from local storage
  const [brand, setBrand] = useState<DemoBrand>(() => {
    const saved = localStorage.getItem('demo_brand');
    return saved ? JSON.parse(saved) : DEFAULT_BRAND;
  });

  const [industry, setIndustryState] = useState<Industry>(() => {
    return (localStorage.getItem('demo_industry') as Industry) || 'DEFAULT';
  });

  const [customScenarios, setCustomScenarios] = useState<ExceptionEvent[]>([]);
  const [documents, setDocuments] = useState<SimulatedDoc[]>([]);

  useEffect(() => {
    // Regenerate scenarios & docs when industry changes
    if (industry !== 'DEFAULT') {
      setCustomScenarios(generateScenarios(industry));
      setDocuments(generateDocuments(industry));
    } else {
      setCustomScenarios([]);
      setDocuments(generateDocuments('DEFAULT'));
    }
    localStorage.setItem('demo_industry', industry);
  }, [industry]);

  const updateBrand = async (name: string, logo?: string, showName?: boolean, tagline?: string, showTagline?: boolean) => {
    let colors = brand.colors;
    if (logo && logo !== brand.logo) {
      colors = await extractColorsFromImage(logo);
    }
    // Default showName to existing valid state or true if undefined
    const nameVisible = showName !== undefined ? showName : (brand.showName ?? true);
    const taglineVisible = showTagline !== undefined ? showTagline : (brand.showTagline ?? true);
    const textTagline = tagline !== undefined ? tagline : (brand.tagline ?? 'Autonomous Supply Chain Control Tower');

    // Ensure we keep existing fields if not provided, though typically we pass all
    const newBrand = { name, logo, colors, showName: nameVisible, tagline: textTagline, showTagline: taglineVisible };
    setBrand(newBrand);
    localStorage.setItem('demo_brand', JSON.stringify(newBrand));

    // Apply CSS Variables globally for immediate effect
    document.documentElement.style.setProperty('--primary-brand', colors.primary);
  };

  const setIndustry = (ind: Industry) => {
    setIndustryState(ind);
  };

  const resetDemo = () => {
    setBrand(DEFAULT_BRAND);
    setIndustry('DEFAULT');
    localStorage.removeItem('demo_brand');
    localStorage.removeItem('demo_industry');
    document.documentElement.style.removeProperty('--primary-brand');
  };

  // On mount, apply colors if they exist
  useEffect(() => {
    if (brand.colors.primary) {
      document.documentElement.style.setProperty('--primary-brand', brand.colors.primary);
    }
  }, []);

  return (
    <DemoContext.Provider value={{ brand, industry, customScenarios, documents, updateBrand, setIndustry, resetDemo }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within a DemoProvider');
  return context;
};
