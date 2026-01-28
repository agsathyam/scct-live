import { ExceptionEvent, ExceptionStatus } from '../types';

export type Industry = 'RETAIL' | 'TECH' | 'PHARMA' | 'AUTO' | 'DEFAULT';

export const INDUSTRIES: { id: Industry; label: string }[] = [
  { id: 'DEFAULT', label: 'General Logistics' },
  { id: 'RETAIL', label: 'Retail & Grocery' },
  { id: 'TECH', label: 'High Tech & Electronics' },
  { id: 'PHARMA', label: 'Pharma & Healthcare' },
  { id: 'AUTO', label: 'Automotive & Manufacturing' },
];

const BASE_EVENT = {
  status: ExceptionStatus.NEW,
  timestamp: new Date().toISOString(),
};

// Helper for dates
const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);

export const INDUSTRY_SCENARIOS: Record<Industry, ExceptionEvent[]> = {
  'RETAIL': [
    {
      ...BASE_EVENT,
      id: 'EVT-GROC-101',
      type: 'INVENTORY_SHORTAGE' as any,
      severity: 'CRITICAL',
      description: 'Refrigeration unit failure in transit. Temp > 8°C for 4 hours. Spoilage risk for fresh produce.',
      customer: { id: 'C-FRESH', name: 'FreshMarket Inc', tier: 'VIP', contractValue: 1200000, logo: '/logos/freshmarket_v2.png' },
      shipment: {
        id: 'SH-GROC-99', origin: 'Salinas, CA', destination: 'Chicago, IL', value: 45000, carrier: 'CoolTrans', status: 'DELAYED', items: ['Organic Avocados', 'Berries'],
        currentLocation: 'Omaha, NE', expectedDelivery: tomorrow.toISOString(), predictedDelivery: nextWeek.toISOString()
      },
      contractId: 'CTR-FRESH-2024'
    },
    {
      ...BASE_EVENT,
      id: 'EVT-GROC-102',
      type: 'LATE_SHIPMENT' as any,
      severity: 'HIGH',
      description: 'Pallet rejected at DC due to damaged packaging. Replacement stock needed within 24h for weekend promo.',
      customer: { id: 'C-WM', name: 'Global Mart', tier: 'STANDARD', contractValue: 5000000, logo: '/logos/global_mart_v2.png' },
      shipment: {
        id: 'SH-GROC-88', origin: 'Atlanta, GA', destination: 'Miami, FL', value: 12000, carrier: 'FastTrack', status: 'HELD_AT_TERMINAL', items: ['Cereal Boxes', 'Snacks'],
        currentLocation: 'Jacksonville, FL', expectedDelivery: tomorrow.toISOString(), predictedDelivery: tomorrow.toISOString()
      },
      contractId: 'CTR-GM-Q4'
    }
  ],
  'TECH': [
    {
      ...BASE_EVENT,
      id: 'EVT-TECH-900',
      type: 'LATE_SHIPMENT' as any,
      severity: 'CRITICAL',
      description: 'Just-in-Time shipment of GPU chipsets stuck in customs clearance due to missing HTS codes. Line stop risk.',
      customer: { id: 'C-NVIDIA', name: 'TechGiant Corp', tier: 'VIP', contractValue: 85000000, logo: '/logos/techgiant_v2.png' },
      shipment: {
        id: 'SH-TECH-X1', origin: 'Taipei, TW', destination: 'Austin, TX', value: 2500000, carrier: 'AirCargo Elite', status: 'CUSTOMS_HOLD', items: ['H100 Tensor Cores'],
        currentLocation: 'Anchorage, AK', expectedDelivery: tomorrow.toISOString(), predictedDelivery: nextWeek.toISOString()
      },
      contractId: 'CTR-CHIP-GLOBAL'
    },
    {
      ...BASE_EVENT,
      id: 'EVT-TECH-901',
      type: 'DAMAGED_GOODS' as any,
      severity: 'HIGH',
      description: 'Shockwatch indicator triggered > 50G impact detected during last mile delivery. Inspection required.',
      customer: { id: 'C-DATAC', name: 'CloudData Systems', tier: 'VIP', contractValue: 15000000, logo: '/logos/clouddata_v2.png' },
      shipment: {
        id: 'SH-TECH-S2', origin: 'Fremont, CA', destination: 'Ashburn, VA', value: 450000, carrier: 'SecureLogistics', status: 'DELIVERED_DAMAGED', items: ['Server Racks'],
        currentLocation: 'Ashburn, VA', expectedDelivery: tomorrow.toISOString(), predictedDelivery: tomorrow.toISOString()
      },
      contractId: 'CTR-CLOUD-SLA'
    }
  ],
  'PHARMA': [
    {
      ...BASE_EVENT,
      id: 'EVT-PHRM-505',
      type: 'DAMAGED_GOODS' as any,
      severity: 'CRITICAL',
      description: 'Cold chain excursion detected. Logger shows 25°C for 60 mins. Product integrity compromised. FDA reporting required.',
      customer: { id: 'C-MED', name: 'MediLife Pharma', tier: 'VIP', contractValue: 42000000, logo: '/logos/medilife_v2.png' },
      shipment: {
        id: 'SH-PHRM-V1', origin: 'Basel, CH', destination: 'Boston, MA', value: 1800000, carrier: 'BioLogistix', status: 'QUARANTINED', items: ['Oncology Meds', 'Insulin'],
        currentLocation: 'Newark, NJ', expectedDelivery: tomorrow.toISOString(), predictedDelivery: tomorrow.toISOString()
      },
      contractId: 'CTR-GDP-COMPLIANCE'
    },
    {
      ...BASE_EVENT,
      id: 'EVT-PHRM-506',
      type: 'LATE_SHIPMENT' as any,
      severity: 'MEDIUM',
      description: 'Delay in clinical trial supplies delivery to investigational site. Patient protocol impact.',
      customer: { id: 'C-CLIN', name: 'HealthPlus Systems', tier: 'STANDARD', contractValue: 2200000, logo: '/logos/healthplus_v2.png' },
      shipment: {
        id: 'SH-PHRM-T2', origin: 'Raleigh, NC', destination: 'Phoenix, AZ', value: 55000, carrier: 'FedEx Custom Critical', status: 'DELAYED', items: ['Phase 3 Kits'],
        currentLocation: 'Memphis, TN', expectedDelivery: tomorrow.toISOString(), predictedDelivery: nextWeek.toISOString()
      },
      contractId: 'CTR-CLINICAL-TRIAL'
    }
  ],
  'AUTO': [
    {
      ...BASE_EVENT,
      id: 'EVT-AUTO-202',
      type: 'LATE_SHIPMENT' as any,
      severity: 'CRITICAL',
      description: 'Line Down Threat: Brake calipers delayed by snow storm. Assembly plant has 4 hours of buffer stock remaining.',
      customer: { id: 'C-OEM', name: 'Detroit Motors', tier: 'VIP', contractValue: 120000000, logo: '/logos/detroit_motors_v2.png' },
      shipment: {
        id: 'SH-AUTO-B1', origin: 'Mexico City, MX', destination: 'Detroit, MI', value: 120000, carrier: 'RailFreight', status: 'WEATHER_DELAY', items: ['Brake Calipers'],
        currentLocation: 'Laredo, TX', expectedDelivery: tomorrow.toISOString(), predictedDelivery: nextWeek.toISOString()
      },
      contractId: 'CTR-JIT-SLA'
    },
    {
      ...BASE_EVENT,
      id: 'EVT-AUTO-203',
      type: 'INVENTORY_SHORTAGE' as any,
      severity: 'HIGH',
      description: 'Tier 2 supplier short-shipped wiring harnesses. Expedited air freight required to avoid shift cancellation.',
      customer: { id: 'C-EV', name: 'Electric Mobility', tier: 'VIP', contractValue: 65000000, logo: '/logos/electric_mobility.png' },
      shipment: {
        id: 'SH-AUTO-W2', origin: 'Seoul, KR', destination: 'Berlin, DE', value: 85000, carrier: 'AirBridge', status: 'PARTIAL_DELIVERY', items: ['High Voltage Harness'],
        currentLocation: 'Frankfurt, DE', expectedDelivery: tomorrow.toISOString(), predictedDelivery: tomorrow.toISOString()
      },
      contractId: 'CTR-EV-SUPPLY'
    }
  ],
  'DEFAULT': []
};

export const generateScenarios = (industry: Industry): ExceptionEvent[] => {
  return INDUSTRY_SCENARIOS[industry] || [];
};
