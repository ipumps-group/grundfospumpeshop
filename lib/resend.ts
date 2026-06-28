import { Resend } from 'resend'
import { COMPANY } from './config'

let _resend: Resend | null = null;
export function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set');
  }
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

/**
 * "From" aadress kõigi mailide jaoks.
 * Formaat: "Kuvatav nimi <aadress@domeen>"
 * Domeen peab olema Resendis verifitseeritud.
 */
export const EMAIL_FROM = `${COMPANY.legalName} <${
  process.env.RESEND_FROM_EMAIL ?? 'noreply@pumbapood.ee'
}>`;

/**
 * Reply-To aadress — kui klient vajutab mailis "Reply",
 * siis vastus suunatakse sellele aadressile.
 */
export const EMAIL_REPLY_TO =
  process.env.RESEND_REPLY_TO ?? 'info@pumbapood.ee';

/**
 * Saidi baas-URL — kasutatakse mailides linkide genereerimiseks.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pumbapood.ee';