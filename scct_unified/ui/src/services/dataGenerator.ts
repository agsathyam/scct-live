import { ExceptionType } from '../types';

// Helpers
const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const uuid = () => Math.random().toString(36).substring(2, 11).toUpperCase();

// Generators
const generateDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

export const generateBigQueryData = (count: number = 1000) => {
  const shipments = [];
  const exceptions = [];
  const outcomes = [];

  const customers = [
    { id: 'C-9901', name: 'TechGiant Corp', tier: 'VIP' },
    { id: 'C-7742', name: 'HealthPlus Systems', tier: 'VIP' },
    { id: 'C-3321', name: 'Retail Partner LLC', tier: 'PARTNER' },
    { id: 'C-1001', name: 'Gadget Store Inc', tier: 'STANDARD' },
    { id: 'C-1002', name: 'Boutique Outlets', tier: 'STANDARD' },
    { id: 'C-1005', name: 'Corner Shop', tier: 'STANDARD' },
  ];

  const carriers = ['FedEx', 'UPS', 'DHL', 'USPS'];
  const origins = ['San Francisco, CA', 'Austin, TX', 'Seattle, WA', 'New York, NY', 'Memphis, TN', 'Chicago, IL'];
  const destinations = ['Miami, FL', 'Denver, CO', 'Boston, MA', 'Los Angeles, CA', 'Phoenix, AZ', 'Dallas, TX'];

  for (let i = 0; i < count; i++) {
    const cust = random(customers);
    const shipDate = generateDate(new Date('2023-01-01'), new Date('2023-12-31'));
    // 2-8 days delivery
    const deliveryDays = Math.floor(Math.random() * 6) + 2; 
    const expectedDelivery = new Date(shipDate);
    expectedDelivery.setDate(shipDate.getDate() + deliveryDays);

    const shipmentId = `SH-${uuid()}`;
    const value = cust.tier === 'VIP' ? Math.floor(Math.random() * 50000) + 1000 : Math.floor(Math.random() * 2000) + 50;
    
    // 1. SHIPMENT ROW
    const shipment = {
      shipment_id: shipmentId,
      customer_id: cust.id,
      customer_tier: cust.tier,
      origin: random(origins),
      destination: random(destinations),
      carrier: random(carriers),
      service_level: Math.random() > 0.8 ? 'Express' : 'Ground',
      value_usd: value,
      ship_date: shipDate.toISOString().split('T')[0],
      expected_delivery: expectedDelivery.toISOString().split('T')[0],
    };
    shipments.push(shipment);

    // 25% Chance of Exception
    if (Math.random() < 0.25) {
      const exceptionId = `EXC-${uuid()}`;
      const type = random(Object.values(ExceptionType)) as string;
      
      // Correlate severity with customer tier slightly
      let severity = 'LOW';
      if (cust.tier === 'VIP' || value > 10000) severity = 'HIGH';
      if (type === ExceptionType.WEATHER_DELAY) severity = 'CRITICAL';

      // 2. EXCEPTION ROW
      const exception = {
        exception_id: exceptionId,
        shipment_id: shipmentId,
        event_timestamp: new Date(expectedDelivery.getTime() - Math.random() * 86400000).toISOString(),
        exception_type: type,
        description: `System detected ${type} at ${random(origins)} Hub. Impact: ${Math.floor(Math.random()*48)+12}h delay.`,
        severity: severity
      };
      exceptions.push(exception);

      // 3. OUTCOME ROW (Historical Resolution)
      let action = 'MANUAL_REVIEW';
      let cost = 0;
      let sentiment = 3;

      // Logic for historical decisions
      if (cust.tier === 'VIP') {
        if (type === ExceptionType.LATE_SHIPMENT) {
          action = 'EXPEDITE_UPGRADE';
          cost = 250 + Math.random() * 100;
          sentiment = 5;
        } else if (type === ExceptionType.DAMAGED_GOODS) {
          action = 'FULL_REPLACEMENT';
          cost = value;
          sentiment = 4;
        }
      } else {
        if (type === ExceptionType.WEATHER_DELAY) {
          action = 'NOTIFY_CUSTOMER';
          cost = 0;
          sentiment = 3;
        } else {
          action = 'OFFER_DISCOUNT';
          cost = 25;
          sentiment = 2;
        }
      }

      const outcome = {
        resolution_id: `RES-${uuid()}`,
        exception_id: exceptionId,
        action_taken: action,
        cost_incurred: parseFloat(cost.toFixed(2)),
        customer_satisfaction_score: sentiment,
        agent_model_version: 'legacy_rule_engine_v1',
        resolution_timestamp: new Date(new Date(exception.event_timestamp).getTime() + 3600000 * 2).toISOString()
      };
      outcomes.push(outcome);
    }
  }

  return { shipments, exceptions, outcomes };
};

export const downloadCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName])).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};