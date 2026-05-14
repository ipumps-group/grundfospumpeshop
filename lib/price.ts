/**
 * Shared VAT / price helpers.
 * All prices are stored in the DB ex-VAT.
 * Customers always see VAT-inclusive prices.
 */

export const VAT_RATE = 0.24

/** Return price with VAT included */
export const withVat = (exVat: number): number => exVat * (1 + VAT_RATE)

/** Format a number for display: 2 decimals, comma separator, € */
export const fmt = (price: number): string =>
  price.toFixed(2).replace('.', ',') + ' €'

/** Format an ex-VAT price as VAT-inclusive for display */
export const fmtVat = (exVat: number): string => fmt(withVat(exVat))
