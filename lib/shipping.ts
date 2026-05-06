import type { Carrier, DeliveryMethod } from './carriers';

interface CreateShipmentInput {
  carrier: Carrier;
  deliveryMethod: DeliveryMethod;
  order: {
    orderNumber: string;
    recipientName: string;
    recipientEmail: string;
    address?: Record<string, string>;
    items: Array<{ name: string; qty: number }>;
  };
}

interface CreateShipmentResult {
  trackingNumber: string;
  labelUrl?: string;
}

export async function createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
  switch (input.carrier) {
    case 'omniva':
      return createOmnivaShipment(input);
    case 'dpd':
      return createDpdShipment(input);
    case 'itella':
      return createItellaShipment(input);
    default:
      throw new Error(`Carrier ${input.carrier} not implemented`);
  }
}

// Omniva example (XML API - needs Omniva credentials from env)
async function createOmnivaShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
  const customerCode = process.env.OMNIVA_CUSTOMER_CODE;
  const password = process.env.OMNIVA_PASSWORD;
  
  if (!customerCode || !password) {
    throw new Error('Omniva credentials not configured (OMNIVA_CUSTOMER_CODE, OMNIVA_PASSWORD)');
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://service.core.epmx.application.eestipost.ee/xsd">
  <soapenv:Header/>
  <soapenv:Body>
    <xsd:businessToClientMsgRequest>
      <partner>${customerCode}</partner>
      <interchange msg_type="info11">
        <header file_id="${input.order.orderNumber}" sender_cd="${customerCode}"/>
        <item_list>
          <item service="PA">
            <measures weight="1.0"/>
            <receiverAddressee>
              <person_name>${input.order.recipientName}</person_name>
              <email>${input.order.recipientEmail}</email>
              <address offloadPostcode="${input.order.parcelMachineId || ''}"/>
            </receiverAddressee>
          </item>
        </item_list>
      </interchange>
    </xsd:businessToClientMsgRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

  const auth = Buffer.from(`${customerCode}:${password}`).toString('base64');
  
  const res = await fetch('https://edixml.post.ee/epmx/services/messagesService.wsdl', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Authorization': `Basic ${auth}`,
      'SOAPAction': '',
    },
    body: xml,
  });

  if (!res.ok) {
    throw new Error(`Omniva API error: ${res.status}`);
  }

  const responseXml = await res.text();
  
  // Parse XML - get barcode (= tracking number)
  const match = responseXml.match(/<barcode>([^<]+)<\/barcode>/);
  if (!match) {
    throw new Error('No barcode in Omniva response');
  }

  return { trackingNumber: match[1] };
}

async function createDpdShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
  // DPD API: https://docs.dpd.com/
  // TODO: Implement DPD shipment creation
  throw new Error('DPD shipment creation not yet implemented');
}

async function createItellaShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
  // Itella/Smartpost API
  // TODO: Implement Itella shipment creation
  throw new Error('Itella shipment creation not yet implemented');
}