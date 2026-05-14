export type Carrier = 'omniva' | 'dpd' | 'itella' | 'venipak' | 'other';

export type DeliveryMethod = 'courier' | 'pickup';

export const CARRIER_DISPLAY_NAMES: Record<Carrier, string> = {
  omniva: 'Omniva',
  dpd: 'DPD',
  itella: 'Itella',
  venipak: 'Venipak',
  other: 'Kuller',
};

/**
 * Ehitab kliendile jälgimise URL-i konkreetse kulleri veebis.
 * Kui kullerit ei tunne, kasutab oma saidi fallback'i URL-i
 * (seal võid hiljem luua /track/[number] lehe oma API-ga).
 */
export function buildTrackingUrl(
  carrier: Carrier,
  trackingNumber: string
): string {
  const cleaned = trackingNumber.trim();

  switch (carrier) {
    case 'omniva':
      return `https://www.omniva.ee/abi/jalgimine/${cleaned}`;
    case 'dpd':
      return `https://tracking.dpd.de/status/et_EE/parcel/${cleaned}`;
    case 'itella':
      return `https://itella.ee/era-saatja/saadetise-jalgimine/?trackingId=${cleaned}`;
    case 'other':
    default: {
      const site =
        process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pumbapood.ee';
      return `${site}/track/${cleaned}`;
    }
  }
}