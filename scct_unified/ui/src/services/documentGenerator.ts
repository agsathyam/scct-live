import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { Industry, INDUSTRY_SCENARIOS } from './scenarioGenerator';
import { KNOWLEDGE_BASE_DOCS } from '../constants';

// --- Types ---
export interface SimulatedDoc {
  id: string;
  title: string;
  category: 'Contract' | 'SLA' | 'SOP' | 'Policy' | 'Report' | 'Certificate';
  content: string; // Markdown/Text content for RAG
  industry: Industry;
  lastUpdated: string;
}

// --- Global Corporate Identity ---
const MEGACORPS = {
  MANUFACTURING: 'Apex Dynamics',
  LOGISTICS: 'Zenith Global',
  TECH: 'Orbit Systems',
  PHARMA: 'Nexus Health',
  RAW_MATERIALS: 'Prime Materials'
};

const CARRIER_POOL = [
  { name: MEGACORPS.LOGISTICS, method: 'Air Freight', sla: '24h' },
  { name: 'FastTrack Logistics', method: 'Ground', sla: '3-5 Days' },
  { name: 'OceanBlue Shipping', method: 'Ocean', sla: '14-30 Days' }
];

// --- Rich Templates ---

const FULL_MSA_TEMPLATE = (client: string, vendor: string, industry: Industry, value: number) => {
  const isHighValue = value > 1000000;

  return `
MASTER SERVICE AGREEMENT (MSA)
------------------------------
CONTRACT ID: ${client.substring(0, 3)}-${new Date().getFullYear()}-MSA
EFFECTIVE DATE: 2023-01-01
BETWEEN: ${client} ("Client")
AND: ${vendor} ("Provider")

SECTION 1: DEFINITIONS
1.1 "Services" refers to end-to-end supply chain logistics, including freight forwarding, warehousing, and customs brokerage.
1.2 "Confidential Information" includes all customer data, shipment values, and trade lane strategies.

SECTION 2: SERVICE LEVEL AGREEMENT (SLA)
2.1 Performance Targets:
    - On-Time Delivery (OTD): 98.5%
    - Inventory Accuracy: 99.9%
    - Claims Ratio: < 0.1%

2.2 Penalties for Non-Performance:
    - For every 1% drop below OTD target, Provider grants a 2% credit on monthly invoices.
    - Critical Failures (>48h delay on JIT lines) trigger an immediate Root Cause Analysis (RCA) within 24 hours.

SECTION 3: LIABILITY & INSURANCE
3.1 Standard Liability: Limited to $10.00 per kg for general cargo.
3.2 High Value Goods Exception: ${isHighValue ? `
    **ADDENDUM HV-01**: For shipments valued over $1,000,000, Provider maintains "All-Risk" Cargo Insurance coverage up to 110% of commercial invoice value.
    Security Escort required for last-mile delivery.` : 'Not Applicable.'}

SECTION 4: INDUSTRY SPECIFIC PROTOCOLS (${industry})
4.1 ${industry === 'PHARMA' ? 'GDP COMPLIANCE: Provider adheres to EU GDP Guidelines (2013/C 343/01). Temperature excursions >2°C must be reported within 60 minutes.' : ''}
4.2 ${industry === 'TECH' ? 'TAPA-A SECURITY: All transit hubs must be TAPA-A certified. GPS tracking active 24/7.' : ''}
4.3 ${industry === 'AUTO' ? 'JIT SEQUENCING: Delivery windows are +/- 15 minutes. Line stoppage penalties apply at $10,000 per minute.' : ''}
4.4 ${industry === 'RETAIL' ? 'MUST ARRIVE BY DATE (MABD): Retail compliance chargebacks apply for late deliveries ($500 per PO).' : ''}

SECTION 5: FORCE MAJEURE
5.1 Neither party is liable for failure to perform due to Acts of God, War, Strikes, or Pandemics.
5.2 Weather delays MUST be communicated 12 hours prior to scheduled pickup for waiver eligibility.

SIGNED:
__________________________      __________________________
${client} Authorized Rep        ${vendor} Legal Counsel
`.trim();
};

const VIP_TIER_SLA = (client: string, tier: string) => `
SERVICE LEVEL AGREEMENT - ${tier} TIER
--------------------------------------
CLIENT: ${client}
STATUS: ${tier} (Active)

1. PRIORITY HANDLING
   - ${tier} shipments receive "Must Ride" status on all air freight bookings.
   - Dedicated Account Manager available 24/7/365.

2. EXPEDITED RESOLUTION
   - Resolution Time Objective (RTO): 2 hours.
   - Automatic escalation to Regional Director for delays > 4 hours.

3. FINANCIAL GUARANTEES
   - 100% Money-Back Guarantee for Service Failures (excluding Weather).
   - Quarterly Business Review (QBR) required.
`;

const SECURITY_PROTOCOL = (industry: Industry) => `
GLOBAL SECURITY STANDARD (GSS-2024)
-----------------------------------
APPLICABLE TO: High Value (> $100k) & Sensitive Cargo

1. TRANSPORT SECURITY
   - Hard-sided trailers only. No soft-sided/curtain-sided vehicles.
   - ISO 17712 High Security Seals required on all international movements.
   - Team Drivers required for routes > 500 miles (Non-stop transit).

2. TRACKING & VISIBILITY
   - Real-time GPS polling interval: 15 minutes.
   - Geo-fencing alerts enabled for route deviation > 1 mile.
   - Light sensors enabled to detect unauthorized door opening.

3. WAREHOUSING
   - Caged storage area with biometric access control.
   - CCTV retention: 90 days.
`;

const CUSTOMS_GUIDE = (origin: string, dest: string) => `
TRADE COMPLIANCE MANUAL: ${origin.split(',')[1] || 'INTL'} to ${dest.split(',')[1] || 'INTL'}
------------------------------------------------------------
LANE: ${origin} -> ${dest}

1. REQUIRED DOCUMENTATION
   - Commercial Invoice (CI) with HTS Codes.
   - Packing List (PL).
   - Certificate of Origin (CoO).
   - Bill of Lading (BOL/AWB).

2. DUTIES & TAXES
   - INCOTERMS 2020: DDP (Delivered Duty Paid) unless specified otherwise.
   - Importer of Record (IoR) is responsible for HS Code accuracy.

3. RESTRICTED GOODS
   - Lithium Batteries (UN3481/UN3091) require DG Declaration.
   - Dual-Use Goods check required against Denied Party Lists.
`;

const SOP_TEMPLATE = (title: string, steps: string[]) => `
STANDARD OPERATING PROCEDURE (SOP)
DOC ID: SOP-${Math.floor(Math.random() * 10000)}
TITLE: ${title}
----------------------------

1. OBJECTIVE
   Ensure consistent, compliant handling of ${title.toLowerCase()} events across the network.

2. SCOPE
   Applies to all ${MEGACORPS.LOGISTICS} Operations Centers globally.

3. PROCEDURE
${steps.map((step, i) => `   3.${i + 1} ${step}`).join('\n')}

4. ESCALATION MATRIX
   - Level 1: Shift Supervisor (15 min)
   - Level 2: Duty Manager (1 hour)
   - Level 3: Regional Director (4 hours)
`;

// --- Generators ---

const generateDocuments = (industry: Industry): SimulatedDoc[] => {
  const docs: SimulatedDoc[] = [];
  const scenarios = INDUSTRY_SCENARIOS[industry] || [];

  const uniqueContracts = new Set<string>();
  const uniqueTiers = new Set<string>();

  // 1. ITERATE SCENARIOS (The Source of Truth)
  scenarios.forEach(evt => {
    // A. Contracts (MSA)
    const contractId = evt.contractId || `CTR-${evt.customer.id}`;
    if (!uniqueContracts.has(contractId)) {
      uniqueContracts.add(contractId);
      let vendor = MEGACORPS.MANUFACTURING;
      if (industry === 'TECH') vendor = MEGACORPS.TECH;
      if (industry === 'PHARMA') vendor = MEGACORPS.PHARMA;

      docs.push({
        id: contractId,
        title: `Master Service Agreement - ${evt.customer.name}`,
        category: 'Contract',
        content: FULL_MSA_TEMPLATE(evt.customer.name, vendor, industry, evt.customer.contractValue || 0),
        industry,
        lastUpdated: '2023-11-15'
      });
    }

    // B. Tier Specific Policy
    if (evt.customer.tier && !uniqueTiers.has(evt.customer.tier)) {
      uniqueTiers.add(evt.customer.tier);
      docs.push({
        id: `POL-TIER-${evt.customer.tier}`,
        title: `${evt.customer.tier} Service Level Policy`,
        category: 'Policy',
        content: VIP_TIER_SLA(evt.customer.name, evt.customer.tier),
        industry,
        lastUpdated: '2024-01-01'
      });
    }

    // C. High Value Security Protocol
    if (evt.shipment.value > 100000) {
      const secDocId = 'POL-SEC-HIGHVAL';
      if (!docs.find(d => d.id === secDocId)) {
        docs.push({
          id: secDocId,
          title: 'Global High-Value Cargo Security Protocol',
          category: 'Policy',
          content: SECURITY_PROTOCOL(industry),
          industry,
          lastUpdated: '2023-06-20'
        });
      }
    }

    // D. Cross-Border / Customs
    // Simple heuristic: If origin/dest strings look different or imply international
    const isInternational = !evt.shipment.destination.includes('USA') && !evt.shipment.destination.includes('US') && !evt.shipment.destination.includes('United States');
    // Actually, let's look for known international cities in our data
    const intlCities = ['Taipei', 'Seoul', 'Berlin', 'Basel', 'Mexico City'];
    const isCrossBorder = intlCities.some(city => evt.shipment.origin.includes(city) || evt.shipment.destination.includes(city));

    if (isCrossBorder) {
      const customsId = `GDE-CUSTOMS-${industry.substring(0, 3)}`;
      if (!docs.find(d => d.id === customsId)) {
        docs.push({
          id: customsId,
          title: 'International Trade Compliance Guide',
          category: 'SOP',
          content: CUSTOMS_GUIDE(evt.shipment.origin, evt.shipment.destination),
          industry,
          lastUpdated: '2023-09-01'
        });
      }
    }
  });

  // 2. Carrier SLAs (Global Pool)
  const carriers = new Set([MEGACORPS.LOGISTICS, ...scenarios.map(e => e.shipment.carrier)]);
  carriers.forEach(carrier => {
    docs.push({
      id: `SLA-${carrier.replace(/\s+/g, '-').toUpperCase()}`,
      title: `Carrier SLA - ${carrier}`,
      category: 'SLA',
      content: `
CARRIER AGREEMENT: ${carrier}
---------------------------
1. SERVICE STANDARDS
   - Standard Ground: 3-5 Business Days.
   - Expedited Air: 24-48 Hours.
   - Claims Liability: Limited to $25/lb unless declared value > $500.

2. PERFORMANCE METRICS
   - On-Time Pickup: 99.0%
   - On-Time Delivery: 98.0%
   - EDI Compliance: 100% (214 Status Messages required).

3. SURCHARGES
   - Fuel Surcharge: Indexed to DOE National Average.
   - Residential Delivery: $5.00 per package.
            `.trim(),
      industry,
      lastUpdated: '2023-08-15'
    });
  });

  // 3. Industry Specific Playbooks (Static but Detailed)
  switch (industry) {
    case 'PHARMA':
      docs.push({
        id: 'SOP-COLD-CHAIN-EXCURSION',
        title: 'Cold Chain Excursion Resolution SOP',
        category: 'SOP',
        content: SOP_TEMPLATE('Temperature Excursion Response', [
          'Observe datalogger alarm status.',
          'Download temperature curve data (PDF/CSV).',
          'Compare against product stability budget (e.g. 2-8°C allowed for 48h).',
          'If confirmed excursion: Quarantine immediately.',
          'Contact Quality Assurance (QA) for disposition.'
        ]),
        industry,
        lastUpdated: '2023-12-01'
      });
      break;
    case 'TECH':
      docs.push({
        id: 'SOP-NPI-LAUNCH',
        title: 'New Product Introduction (NPI) Security',
        category: 'SOP',
        content: SOP_TEMPLATE('Confidential Prototype Transport', [
          'Use unmarked vehicles only.',
          'Double-manned driver teams.',
          'Route risk assessment filed 24h prior to departure.',
          'No stops within 50 miles of origin/destination.'
        ]),
        industry,
        lastUpdated: '2023-10-10'
      });
      break;
    case 'AUTO':
      docs.push({
        id: 'SOP-LINE-DOWN',
        title: 'Critical Line-Down Emergency Response',
        category: 'SOP',
        content: SOP_TEMPLATE('Plant Stoppage Prevention', [
          'Verify "Minutes to Starvation" with Plant Materials Manager.',
          'If < 4 hours: Charter Helicopter immediately.',
          'If < 12 hours: Dedicated Sprinter Van (Hot Shot).',
          'Notify Control Tower Lead.'
        ]),
        industry,
        lastUpdated: '2023-08-05'
      });
      break;
    default: // Retail
      docs.push({
        id: 'SOP-PEAK-SEASON',
        title: 'Peak Season Surge Planning',
        category: 'SOP',
        content: SOP_TEMPLATE('Q4 Holiday Operations', [
          'Activate overflow warehousing contracts.',
          'Pre-book air freight block space agreements (BSA).',
          'Staff up Customer Service desk to 24/7.',
          'Daily control tower stand-up at 08:00 EST.'
        ]),
        industry: 'RETAIL',
        lastUpdated: '2023-06-01'
      });
  }

  // 4. Inject Static Knowledge Base Docs (Base Content)
  // Especially important for DEFAULT/General Logistics which has few scenarios
  if (industry === 'DEFAULT') {
    KNOWLEDGE_BASE_DOCS.forEach(kDoc => {
      // Avoid duplicates if ID already exists (though unlikely for static)
      if (!docs.find(d => d.id === kDoc.id)) {
        docs.push({
          id: kDoc.id,
          title: kDoc.title,
          category: kDoc.category as any,
          content: kDoc.content,
          industry: 'DEFAULT', // Mark as general
          lastUpdated: kDoc.lastUpdated
        });
      }
    });
  }

  return docs;
};

// --- PDF Generation ---

const addWatermark = (doc: jsPDF, text: string) => {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setTextColor(240); // Very light gray
    doc.setFontSize(50);
    doc.text(text, 50, 150, { angle: 45 });
  }
};

export const generatePDF = (docData: SimulatedDoc): Blob => {
  try {
    const doc = new jsPDF();

    // Safety checks
    const safeContent = docData.content || 'Content unavailable';
    const safeTitle = docData.title || 'Untitled Document';
    const safeId = docData.id || 'UNKNOWN-ID';

    // Header
    // Simple 1x1 gray pixel base64 for logo placeholder to avoid CORS/Network issues corrupting the PDF
    const logoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    doc.addImage(logoBase64, 'PNG', 20, 10, 10, 10);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(safeTitle, 20, 30);

    // Meta
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`DOC ID: ${safeId}`, 20, 38);
    doc.text(`CATEGORY: ${docData.category} | VERTICAL: ${docData.industry}`, 20, 43);
    doc.text(`LAST UPDATED: ${docData.lastUpdated}`, 20, 48);

    // Line
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(20, 52, 190, 52);

    // Body
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0);

    const splitText = doc.splitTextToSize(safeContent, 170);
    doc.text(splitText, 20, 60);

    // Footer
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`CONFIDENTIAL - INTERNAL USE ONLY - Generated by SCCT AI`, 20, 280);
    doc.text(`Page 1 of 1`, 180, 280);

    // addWatermark(doc, 'CONFIDENTIAL'); // Removed to prevent text obstruction

    return doc.output('blob');
  } catch (err) {
    console.error(`Failed to generate PDF for ${docData.id}:`, err);
    // Return empty blob on failure to prevent crash
    return new Blob([`Error generating PDF: ${err}`], { type: 'text/plain' });
  }
};

export const generateAllDocsZip = async (industry: Industry): Promise<Blob> => {
  try {
    const zip = new JSZip();
    const docs = generateDocuments(industry);
    const folder = zip.folder(`${industry}_KnowledgeBase`);

    if (folder) {
      docs.forEach(doc => {
        try {
          const pdfBlob = generatePDF(doc);
          folder.file(`${doc.id}.pdf`, pdfBlob);
        } catch (e) {
          console.warn(`Skipping ${doc.id} in ZIP due to error`);
        }
      });
    }

    return await zip.generateAsync({ type: "blob" });
  } catch (err) {
    console.error("Failed to generate ZIP:", err);
    throw err;
  }
};

export { generateDocuments }; // Export named
