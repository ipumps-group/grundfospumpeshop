/**
 * Mailide tõlkeloader. Kasutab messages/emails/{locale}.json faile.
 *
 * Miks eraldi (mitte next-intl)? React Email template'id renderduvad
 * server-pool väljaspool React request context'i, seega
 * useTranslations() ei tööta. Eraldi loader annab meile kontrolli.
 */

export type EmailLocale = 'et' | 'en' | 'ru' | 'lv' | 'lt';

export interface EmailMessages {
  common: {
    greeting: string;
    thanks: string;
    questions: string;
    footer: string;
    viewOrder: string;
    total: string;
    subtotal: string;
    discount: string;
    quantity: string;
    orderNumber: string;
  };
  orderConfirmation: {
    preview: string;
    subject: string;
    heading: string;
    intro: string;
    itemsHeading: string;
    shippingHeading: string;
    shippingNote: string;
    paymentMethod: string;
  };
  orderShipped: {
    preview: string;
    subject: string;
    heading: string;
    intro: string;
    trackingLabel: string;
    trackingButton: string;
    itemsHeading: string;
    etaDefault: string;
    deliveryMethod: {
      parcel_machine: string;
      courier: string;
      post_office: string;
      pickup: string;
    };
  };
  refundConfirmation: {
    preview: string;
    subject: string;
    heading: string;
    intro: string;
    amountLabel: string;
    reasonLabel: string;
    timingNote: string;
  };
  abandonedCart: {
    preview: string;
    subject: string;
    heading: string;
    intro: string;
    itemsHeading: string;
    returnButton: string;
    footerNote: string;
  };
  prepaymentInvoice: {
    preview: string;
    subject: string;
    heading: string;
    intro: string;
    itemsHeading: string;
    paymentHeading: string;
    bankLabel: string;
    ibanLabel: string;
    dueDateLabel: string;
    amountLabel: string;
    referenceLabel: string;
  };
}

const SUPPORTED: EmailLocale[] = ['et', 'en', 'ru', 'lv', 'lt'];
const FALLBACK: EmailLocale = 'et';

function isSupported(locale: string): locale is EmailLocale {
  return (SUPPORTED as string[]).includes(locale);
}

/**
 * Laeb kliendi keele mailide tõlked. Kui keelt ei toetata või faili pole,
 * annab fallback'i ET-le.
 */
export async function loadEmailMessages(
  locale: string | null | undefined
): Promise<EmailMessages> {
  const safeLocale: EmailLocale =
    locale && isSupported(locale) ? locale : FALLBACK;

  try {
    const mod = await import(`@/messages/emails/${safeLocale}.json`);
    return mod.default as EmailMessages;
  } catch {
    // Faili pole (nt ru.json pole veel loodud) — fallback ET-le
    const mod = await import(`@/messages/emails/${FALLBACK}.json`);
    return mod.default as EmailMessages;
  }
}

/**
 * Asendab {placeholder} stringi vastavate väärtustega.
 * Näide: interpolate("Tere, {name}!", { name: "Ronald" }) → "Tere, Ronald!"
 *
 * Kui võtit ei leia values'es, jätab {võti} muutmata, et viga oleks nähtav.
 */
export function interpolate(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match
  );
}