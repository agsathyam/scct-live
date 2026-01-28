import { ExceptionEvent, ExceptionStatus, ExceptionType } from './types';

// Simulated RAG Knowledge Base (Contracts & Policies)
// Formatted for potential export to Vertex AI Search
export const KNOWLEDGE_BASE_DOCS = [
  {
    id: 'DOC-SLA-001',
    title: 'Master Carrier Agreement - Domestic Ground',
    category: 'Carrier SLA',
    lastUpdated: '2023-09-01',
    content: `
MASTER SERVICE AGREEMENT
AGREEMENT ID: MSA-2024-LOG-001
BETWEEN: RETAIL OPS CORP AND GLOBAL LOGISTICS CARRIER

SECTION 1: DEFINITIONS
1.1 "Carrier" refers to the logistics provider executing the delivery.
1.2 "Shipper" refers to Retail Ops Corp.
1.3 "SLA" refers to Service Level Agreement.

SECTION 4. DELIVERY WINDOWS & PERFORMANCE STANDARDS
4.1 Standard Ground Shipping: Carrier guarantees delivery within 3-5 business days for Zone 1-3, and 5-7 business days for Zone 4-8.
4.2 Express Services: "Next Day Air" must be delivered by 10:30 AM local time. "2nd Day Air" by end of business day (5:00 PM).
4.3 Weekend Delivery: Not included in standard SLA unless "Saturday Delivery" accessorial is purchased ($15.00 surcharge).

SECTION 5. DELAY EXCEPTIONS & PENALTIES
5.1 Controllable Delays: Delays caused by Carrier operations (sorting errors, mechanical failure, lost package) exceeding 24 hours relative to the commit time are eligible for a Service Failure Refund.
5.2 Refund Calculation: 
   (a) 100% of shipping charges for Express shipments.
   (b) 50% for Ground shipments.
5.3 Claims Process: Shipper must file claim within 15 days of expected delivery.

SECTION 6. FORCE MAJEURE
6.1 Exclusions: Delays caused by Acts of God (weather, earthquake, flood), strikes, civil commotion, or acts of terrorism are exempt from SLA penalties.
6.2 Notification: Carrier must update status code to 'WEA-DELAY' or 'EXC-FORCE' within 4 hours of event to claim exemption.
    `
  },
  {
    id: 'DOC-POL-105',
    title: 'Global Customer Compensation Matrix v3.2',
    category: 'Policy',
    lastUpdated: '2023-11-15',
    content: `
INTERNAL POLICY DOCUMENT - CONFIDENTIAL
SUBJECT: CUSTOMER EXCEPTION RESOLUTION & COMPENSATION
VERSION: 3.2

1. OBJECTIVE
To standardize the compensation process for logistics failures and ensure brand loyalty while minimizing margin erosion.

2. LATE SHIPMENT COMPENSATION TIERING
If a shipment is missed due to Supply Chain fault (internal or carrier controllable):

   2.1 STANDARD TIER CUSTOMERS
   - Proactive Notification: Required if delay > 48 hours.
   - Compensation: Refund shipping costs upon customer request only.
   - Coupon: 5% off next order if delay > 5 days.

   2.2 PARTNER TIER CUSTOMERS
   - Proactive Notification: Required if delay > 24 hours.
   - Compensation: Automatic refund of shipping costs.
   
   2.3 VIP TIER CUSTOMERS (STRATEGIC)
   - Proactive Notification: Immediate (within 2 hours of detection).
   - Compensation: Automatic 100% Refund of shipping costs.
   - Goodwill: $50 account credit or 10% discount on next order.
   - Remediation: Immediate upgrade to NFO (Next Flight Out) if replacement is needed.

3. AUTHORITY LEVELS
- Agent (Automated): Up to $250.00 USD.
- Supervisor (Human): Up to $2,000.00 USD.
- Director: > $2,000.00 USD.

NOTE: Claims exceeding automated limits must be routed via 'escalateToHuman' tool.
    `
  },
  {
    id: 'DOC-OPS-202',
    title: 'Inventory Allocation & Shortage Protocol',
    category: 'Operations',
    lastUpdated: '2023-06-20',
    content: `
OPERATIONAL STANDARD 202: STOCKOUTS & ALLOCATION
EFFECTIVE DATE: JUNE 20, 2023

1. CRITICAL LOW STOCK DEFINITION
Any SKU with inventory count < 10 units or < 3 days of cover.

2. ALLOCATION LOGIC (The "Golden Rule")
In the event of competing orders for limited stock, inventory is hard-allocated in the following order:
   Priority 1: VIP Customers (Strategic Accounts)
   Priority 2: Contract Partners with Fill-Rate Penalties
   Priority 3: Direct-to-Consumer (Standard)

3. REMEDIATION FOR STOCKOUTS

   3.1 VIP CUSTOMER STOCKOUTS
   - Authorization granted to source from "Alternative Fulfillment Centers" (AFC).
   - Authorization granted to "Ship-from-Store" (SFS) regardless of shipping cost.
   - Upgrade to Air Freight to meet original commit date (Cost Cap: $500).

   3.2 STANDARD CUSTOMER STOCKOUTS
   - Place order on backorder status.
   - Notify customer immediately with "Delay Apology" template.
   - Offer cancellation or 5% discount code for waiting.
    `
  },
  {
    id: 'DOC-VIP-900',
    title: 'Strategic Partner Addendum - TechGiant Corp',
    category: 'Customer Contract',
    lastUpdated: '2022-01-10',
    content: `
CUSTOMER SPECIFIC ADDENDUM
PARENT CONTRACT: MSA-2022-TG-99
CUSTOMER: TECHGIANT CORP (ID: C-9901)

CLAUSE 12: ZERO DOWNTIME GUARANTEE
Supplier guarantees 99.9% on-time delivery for 'Critical Infrastructure' items (e.g., GPU Clusters, Server Racks, Networking Gear).

CLAUSE 13: REMEDY FOR DELAY
13.1 Remediation: Any predicted delay > 24 hours must be remediated via 'Expedite' (Air Freight) at Supplier's sole expense.
13.2 Hot Shot: If Air Freight is not possible, a "Hot Shot" dedicated courier must be deployed immediately.
13.3 Communication: TechGiant Supply Chain Director must be CC'd on all delay notifications.

CLAUSE 14: PENALTY CLAUSE
Failure to expedite results in a 5% total contract penalty clause ($250k minimum) per incident if downtime exceeds 48 hours.
    `
  },
  {
    id: 'DOC-HAZ-441',
    title: 'Hazardous Materials & Cold Chain Handling',
    category: 'Operations',
    lastUpdated: '2023-03-12',
    content: `
HAZMAT & PERISHABLE GOODS PROTOCOL
REF: UN-3481 / ISO-9001

1. TEMPERATURE EXCURSIONS (COLD CHAIN)
For Pharma/Medical shipments requiring 2°C - 8°C:
- If temp sensor reads > 8°C for > 2 hours (Cumulative), goods are deemed SPOILED.
- Action: Immediate return to origin. Do not deliver to customer.
- Reshipment: Immediate replacement via Next Flight Out (NFO).

2. SHOCK SENSOR ACTIVATION (FRAGILE GOODS)
- For equipment with "TiltWatch" or "ShockWatch" indicators (e.g., MRI parts, Glassware).
- If sensor is RED upon arrival at hub, shipment must be inspected by QA immediately.
- If damage is confirmed, Replacement Order must be triggered with "Expedited" service.

3. LITHIUM BATTERIES (UN3481)
- Damaged packages containing batteries must NOT be re-shipped via Air Cargo due to fire risk.
- Must move via Ground Only.
- Labeling: "DAMAGED/DEFECTIVE LITHIUM BATTERIES" label required.
    `
  },
  {
    id: 'DOC-SURGE-2023',
    title: 'Holiday Peak Season & Force Majeure Protocol',
    category: 'Policy',
    lastUpdated: '2023-10-01',
    content: `
PEAK SEASON & FORCE MAJEURE PROTOCOL (NOV 15 - JAN 15)

1. CARRIER GUARANTEES SUSPENSION
During Peak Season, standard Ground guarantees are SUSPENDED by FedEx/UPS.
- No refunds for ground delays of < 2 days.
- Express guarantees remain in effect.

2. FORCE MAJEURE EVENTS
- "Act of God" events (Hurricanes, Blizzards, Floods) automatically void delivery guarantees.
- Cancellation: If route is blocked for > 5 days, customer must be offered full cancellation + refund.
- Re-routing: Agents are authorized to re-route via alternative hub if available (Cost limit: +20%).

3. AGENT BEHAVIOR MODIFICATION
- Do not offer automatic refunds for weather delays during this period.
- Increase 'Late Shipment' threshold from 24h to 48h before triggering proactive notification.
- VIP Customer guarantees remain in full effect (funded by internal margin, not carrier recovery).
    `
  },
  {
    id: 'PLAYBOOK-RES-001',
    title: 'Resolution Playbook: Late Shipments',
    category: 'Playbook',
    lastUpdated: '2023-12-01',
    content: `
# RESOLUTION PLAYBOOK: LATE SHIPMENTS
**Objective**: Balance Cost of Resolution vs. Customer Lifetime Value (CLV) Risk.

## 1. ANALYSIS FRAMEWORK
When a shipment is delayed, the agent must evaluate:
1. **Severity**: Is the delay > 24 hours?
2. **Customer Tier**: VIP vs. Standard.
3. **Item Criticality**: Is this a medical/infrastructure item?

## 2. COMMON RESOLUTION PATHS

### Path A: The "Apology" (Low Cost)
- **Trigger**: Weather delays, Force Majeure, Standard customers < 48h delay.
- **Action**: Send proactive email. No refund.
- **Trade-off**: Saves margin, but risk of churn is low for Standard tier.

### Path B: The "Refund & Discount" (Medium Cost)
- **Trigger**: Operational failure (carrier fault), Partner tier customers.
- **Action**: Refund shipping fees + 10% coupon.
- **Trade-off**: Direct revenue loss ($15-$50), but preserves relationship.

### Path C: The "Expedite / Upgrade" (High Cost)
- **Trigger**: VIP Customers, Medical/Critical items, Delays > 72h.
- **Action**: Intercept package and upgrade to Air Freight or ship replacement via NFO (Next Flight Out).
- **Trade-off**: High immediate cost ($100-$500), but prevents high-value contract churn ($1M+).

## 3. DECISION MATRIX
| Customer | Delay Reason | Recommended Action | Max Auth Cost |
|----------|--------------|--------------------|---------------|
| VIP      | Any          | Expedite/Replace   | $1,000        |
| Partner  | Carrier      | Refund Shipping    | $100          |
| Standard | Weather      | Notify Only        | $0            |
| Standard | Carrier      | $10 Coupon         | $10           |
    `
  },
  {
    id: 'PLAYBOOK-RES-002',
    title: 'Resolution Playbook: Inventory Shortage Trade-offs',
    category: 'Playbook',
    lastUpdated: '2023-11-20',
    content: `
# RESOLUTION PLAYBOOK: INVENTORY SHORTAGES
**Context**: Item is out of stock at primary DC.

## SCENARIO: ALLOCATION CONFLICT
When stock is low, who gets the item?

### The "Rob Peter to Pay Paul" Strategy
If a VIP order comes in and stock is 0, but a Standard order is "Pending Fulfillment":
1. **Action**: Cancel/Unassign the Standard order inventory.
2. **Re-assign**: Allocate to VIP order.
3. **Compensation**: Give Standard customer a $25 apology credit.

### The "Ship from Store" (SFS) Trade-off
- **Pros**: Saves the sale.
- **Cons**: High fulfillment cost (picking off retail shelf + Zone 7 shipping).
- **Rule**: Only use SFS for orders with Margin > $40 or VIP customers.

## COST vs. SERVICE IMPACT
- **Backorder**: High churn risk, $0 cost.
- **Substitution**: Medium churn risk (customer might return), Low cost.
- **Competitor Buy**: Buying from Amazon to ship to our customer. Extreme cost (Retail + Shipping), but 100% Service retention. *Use only for C-Suite complaints.*
    `
  }
];

export const GEMINI_CONFIG = {
  modelId: 'gemini-2.0-flash-exp',
  displayName: 'Gemini 2.0 Flash'
};

export const MOCK_EVENTS: ExceptionEvent[] = [
  {
    id: 'EVT-8821',
    timestamp: new Date().toISOString(),
    type: ExceptionType.LATE_SHIPMENT,
    severity: 'HIGH',
    status: ExceptionStatus.NEW,
    description: 'Shipment stalled in Memphis hub. Predicted 72h delay for H100 GPU Cluster.',
    contractId: 'DOC-VIP-900',
    customer: {
      id: 'C-9901',
      name: 'TechGiant Corp',
      logo: '/logos/techgiant_v2.png',
      tier: 'VIP',
      contractValue: 5000000
    },
    shipment: {
      id: 'SH-5521',
      origin: 'San Francisco, CA',
      destination: 'New York, NY',
      currentLocation: 'Memphis, TN',
      carrier: 'FedEx',
      value: 1250000,
      expectedDelivery: '2023-10-25T10:00:00Z',
      predictedDelivery: '2023-10-28T14:00:00Z',
      status: 'In Transit',
      items: ['H100 GPU Cluster', 'Rack Mount Kit']
    }
  },
  {
    id: 'EVT-8822',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    type: ExceptionType.INVENTORY_SHORTAGE,
    severity: 'MEDIUM',
    status: ExceptionStatus.NEW,
    description: 'Fulfillment center reports stock discrepancy. Cannot fulfill complete order.',
    contractId: 'DOC-OPS-202',
    customer: {
      id: 'C-3321',
      name: 'Retail Partner LLC',
      logo: '/logos/global_mart_v2.png',
      tier: 'STANDARD',
      contractValue: 50000
    },
    shipment: {
      id: 'SH-5522',
      origin: 'Austin, TX',
      destination: 'Chicago, IL',
      currentLocation: 'Austin Warehouse',
      carrier: 'UPS',
      value: 240000,
      expectedDelivery: '2023-10-26T10:00:00Z',
      predictedDelivery: '2023-10-27T10:00:00Z',
      status: 'Processing',
      items: ['Wireless Headsets (Bulk Order)']
    }
  },
  {
    id: 'EVT-8823',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    type: ExceptionType.WEATHER_DELAY,
    severity: 'CRITICAL',
    status: ExceptionStatus.NEW,
    description: 'Severe storm warning in delivery path (Denver). Carrier invoked Force Majeure.',
    contractId: 'DOC-SLA-001',
    customer: {
      id: 'C-7742',
      name: 'HealthPlus Systems',
      logo: '/logos/healthplus_v2.png',
      tier: 'VIP',
      contractValue: 2100000
    },
    shipment: {
      id: 'SH-5523',
      origin: 'Seattle, WA',
      destination: 'Denver, CO',
      currentLocation: 'Transit',
      carrier: 'DHL',
      value: 450000,
      expectedDelivery: '2023-10-24T09:00:00Z',
      predictedDelivery: 'Unknown',
      status: 'On Hold',
      items: ['Medical Imaging Units']
    }
  }
];