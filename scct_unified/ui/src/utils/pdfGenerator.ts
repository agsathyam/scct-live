import { SimplePDF } from './simplePdf';
import { SimpleZip } from './simpleZip';

interface DocDef {
  filename: string;
  title: string;
  contractId?: string;
  subtitle?: string;
  content: string;
}

const DOCUMENTS: DocDef[] = [
  {
    filename: "MSA_Global_Retail_VIP.pdf",
    title: "MASTER SERVICE AGREEMENT (MSA) - GLOBAL RETAIL INC",
    contractId: "DOC-VIP-900",
    subtitle: "TIER: VIP PLATINUM",
    content: `1. SERVICE LEVEL AGREEMENT (SLA)
Provider guarantees 98% on-time delivery for all shipments.
For VIP Platinum tier, any delay exceeding 24 hours requires immediate remediation.

2. PENALTY CLAUSES
Late delivery ( > 48 hours) will incur a penalty of 5% of the total shipment value.
This penalty is automatic and deducted from the monthly invoice.

3. EXPEDITED SHIPPING
In the event of a predicted delay, Provider MUST upgrade shipping to 'Air Expedite' at Provider's sole expense. No prior approval is needed for costs under $5,000.

4. LOST SHIPMENTS
If a shipment is lost (no scan > 72h), immediate full refund or reshipment is required.`
  },
  {
    filename: "SOP_HealthPlus_Pharma.pdf",
    title: "STANDARD OPERATING PROCEDURE (SOP) - HEALTHPLUS SYSTEMS",
    contractId: "DOC-SLA-001",
    subtitle: "CATEGORY: PHARMACEUTICAL / COLD CHAIN",
    content: `1. TEMPERATURE CONTROL
All shipments must be maintained between 2°C and 8°C.
Any excursion above 8°C for more than 4 hours renders the product 'Adulterated'.

2. DAMAGED GOODS PROTOCOL
If a temperature excursion or physical damage is detected:
   a) Isolate the shipment immediately.
   b) Do NOT attempt to deliver.
   c) Initiate immediate replacement shipment (Reshipment) via Next Flight Out.

3. REPORTING
All deviations must be reported to the Quality Assurance team within 4 hours.`
  },
  {
    filename: "Inventory_Allocation_Policy.pdf",
    title: "GLOBAL INVENTORY ALLOCATION POLICY (2025)",
    subtitle: "APPLICABLE TO: ALL FULFILLMENT CENTERS",
    content: `1. STOCK SCARCITY PROTOCOL
In the event of inventory shortage (Demand > Supply):

   TIER 1 (VIP): Priority allocation. 100% fulfillment guaranteed. If local stock is unavailable, transfer from regional hubs at company expense.

   TIER 2 (STANDARD): First-Come-First-Served. Backorders authorized with 14-day lead time.

2. SAFETY STOCK
A safety stock buffer of 200 units is reserved exclusively for VIP contract fulfillment.`
  },
  {
    filename: "Force_Majeure_Standard_Terms.pdf",
    title: "STANDARD TERMS & CONDITIONS Of CARRIAGE",
    contractId: "DOC-POL-105",
    subtitle: "APPLICABLE TO: STANDARD TIER CUSTOMERS",
    content: `1. FORCE MAJEURE
Carrier is NOT liable for delays caused by Acts of God, including but not limited to:
- Hurricanes, Floods, Earthquakes
- Severe Weather Events (Blizzards, Ice Storms)
- Civil Unrest or War

2. LIABILITY
In the event of a Force Majeure delay, standard SLA guarantees are suspended. Note refunds or credits will be issued for weather-related delays.`
  },
  {
    filename: "SOP_Secure_Transport_HighValue.pdf",
    title: "SOP: SECURE TRANSPORT OF HIGH-VALUE ELECTRONICS",
    subtitle: "APPLICABLE TO: TechGiant Corp, Global Retail Inc",
    content: `ITEMS: Gaming Consoles, Smart Watches

1. SHOCK MONITORING
All shipments >$50k value must be equipped with localized shock sensors (50G threshold).
If a shock event >50G is recorded:
   a) Goods are deemed POTENTIALLY COMPROMISED.
   b) Do not deliver to retail partners.
   c) Reroute to Central Inspection Facility (CIF) for diagnostic testing.

2. SECURITY CAGES
High-value pallets must be stored in locked security cages at all transit hubs.`
  },
  {
    filename: "Protocol_International_Customs_Rotterdam.pdf",
    title: "PORT PROTOCOL: ROTTERDAM (NL) IMPORT CLEARANCE",
    subtitle: "APPLICABLE TO: SEA FREIGHT ARRIVALS",
    content: `1. DOCUMENTATION FAILURE
If Customs Documentation (T1 Form) is incomplete:
   - Shipment is placed in Bonded Warehouse (Zone B).
   - Detention charges apply after 48 hours (€500/day).

2. MISSED CONNECTIONS
For VIP containers missing onward rail/truck connections due to customs hold:
   - Must be re-booked on 'Priority Express' truck within 12 hours.
   - Rail transport is too slow for recovery; use dedicated road transport.`
  },
  {
    filename: "Policy_Reverse_Logistics_Returns.pdf",
    title: "GLOBAL POLICY: REVERSE LOGISTICS & DAMAGED GOODS",
    subtitle: "SCOPE: PACKAGING COMPROMISE",
    content: `1. INSPECTION THRESHOLD
If outer packaging shows visible damage (>10% surface area or crushed corners):
   - DO NOT DELIVER to customer.
   - Driver must scan as 'Damaged/Refused'.

2. DISPOSITION
   - Low Value (<$500): Field Destroy (discard) and reship.
   - High Value (>$500): Return to Vendor (RTV) for credit.
   - Hazmat/Pharma: Isolate and await Safety Officer clearance.`
  },
  {
    filename: "Work_Instruction_Memphis_Hub.pdf",
    title: "WORK INSTRUCTION: MEMPHIS SUPER-HUB OPERATIONS",
    subtitle: "SCENARIO: CONGESTION / CAPACITY OVERFLOW",
    content: `1. REROUTING LOGIC
When sort capacity exceeds 95%:
   - Divert Standard Ground volumes to Nashville or St. Louis hubs.
   - PRIORITIZE Air Express and VIP volumes for Memphis sort.

2. DELAY NOTIFICATION
   - Automated alerts must be sent to customers if sort delay > 4 hours.
   - For VIP customers, proactive CSR outreach is required.`
  },
  {
    filename: "Supplier_Quality_Manual_QC.pdf",
    title: "SUPPLIER QUALITY MANUAL (SQM) - INBOUND STANDARDS",
    subtitle: "SECTION 5: INBOUND QUALITY CONTROL (IQC)",
    content: `1. BATCH FAILURE
If a random sampling (AQL 2.5) fails inspection:
   - The ENTIRE SKU batch is placed on 'Quality Hold' status.
   - No units can be allocated to orders until 100% re-inspection is complete.

2. SHORTAGE IMPACT
   - If logic hold causes stockout, trigger 'Inventory Shortage' protocol.
   - Notify Supply Planning immediately to expedite replacement PO.`
  },
  {
    filename: "MSA_TechGiant_Corp_Strategic.pdf",
    title: "STRATEGIC PARTNERSHIP AGREEMENT - TECHGIANT CORP",
    contractId: "DOC-VIP-900 (APPENDIX A)",
    content: `1. JOINT SUPPLY CHAIN VISIBILITY
   - Integrated data sharing for real-time inventory tracking.

2. PEAK SEASON PRIORITY
   - TechGiant freight receives 'Head of Line' privileges during Q4.
   - Carrier commits to 110% capacity allocation vs forecast.

3. PENALTY EXEMPTION
   - Non-critical delays (<4h) do not incur penalties if communicated proactively.`
  },
  {
    filename: "HazMat_Handling_Guidelines.pdf",
    title: "HAZMAT HANDLING GUIDELINES - CLASS 6.2 (INFECTIOUS)",
    subtitle: "APPLICABLE TO: Biological Reference Materials, Vaccines",
    content: `1. PACKAGING REQUIREMENTS
   - Triple packaging (UN certified) required.
   - Dry Ice must be labeled with net weight.

2. SPILL / DAMAGE PROTOCOL
   - If package integrity is compromised, EVACUATE area immediately.
   - Contact HAZMAT Response Team.
   - DO NOT ATTEMPT to repackage or clean up without PPE.`
  },
  {
    filename: "SLA_MidWest_Chains_Retail.pdf",
    title: "SERVICE AGREEMENT - MIDWEST CHAINS LLC",
    contractId: "DOC-POL-105",
    subtitle: "TIER: STANDARD GROUND",
    content: `1. TRANSIT TIMES
   - Standard delivery window is 3-5 business days.
   - Weekend delivery is NOT included.

2. CLAIMS
   - Claims for lost goods must be filed within 30 days.
   - Maximum liability limited to $100 per package unless insurance purchased.`
  }
];

export const generateKnowledgeDocs = async (): Promise<Blob> => {
  const zip = new SimpleZip();

  for (const doc of DOCUMENTS) {
    const pdfGenerator = new SimplePDF();

    let fullContent = doc.content;
    // Prepend metadata matching python version
    if (doc.contractId) fullContent = `CONTRACT ID: ${doc.contractId}\n` + fullContent;
    if (doc.subtitle) fullContent = `${doc.subtitle}\n\n` + fullContent;

    const pdfData = pdfGenerator.createPDF(doc.title, fullContent);
    zip.addFile(doc.filename, pdfData);
  }

  const zipData = zip.generate();
  return new Blob([zipData as any], { type: 'application/zip' });
};
