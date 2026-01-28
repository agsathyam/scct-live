
export enum ExceptionStatus {
  NEW = 'NEW',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
  IN_PROGRESS = 'IN_PROGRESS'
}

export enum ExceptionType {
  LATE_SHIPMENT = 'LATE_SHIPMENT',
  INVENTORY_SHORTAGE = 'INVENTORY_SHORTAGE',
  WEATHER_DELAY = 'WEATHER_DELAY',
  DAMAGED_GOODS = 'DAMAGED_GOODS'
}

export interface CustomerInfo {
  id: string;
  name: string;
  tier: string;
  contractValue: number;
  logo?: string;
}

export interface ShipmentInfo {
  id: string;
  origin: string;
  destination: string;
  value: number;
  carrier: string;
  status: string;
  currentLocation: string;
  expectedDelivery: string;
  predictedDelivery: string;
  items: string[];
}

export interface ExceptionEvent {
  id: string;
  type: ExceptionType | string;
  status: ExceptionStatus;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  description: string;
  customer: CustomerInfo;
  shipment: ShipmentInfo;
  contractId: string;
}

export interface ToolResult {
  updated_eta?: string;
  new_eta?: string;
  new_order_id?: string;
  carrier?: string;
  ticket_id?: string;
  [key: string]: any;
}

export interface AgentDecision {
  action: string;
  confidence: number;
  reasoning: string;
  toolResult?: ToolResult;
  retrievedDocs?: any[];
  toolUsed?: string;
  costImpact?: number;
}

export interface VertexAgentConfig {
  useRealAgent: boolean;
  simulateTools: boolean;
  projectId: string;
  locationId: string;
  agentId: string;
  accessToken: string;
}

export interface SuggestedAction {
  label: string;
  cost: number;
  impact: string;
}

export interface HumanTask {
  id: string;
  eventId: string;
  reason: string;
  context: any[];
  status: string;
  suggestedActions: SuggestedAction[];
}
