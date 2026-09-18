/**
 * Pumbapood (Pump OÜ) püsiv müügi- ja turunduse raamistus nädalaraportile.
 * AINUS tõeallikas — insights.ts ja llm.ts impordivad siit, et iga
 * nädalaraport ja tegevuskava oleks selle eesmärgiga raamistatud.
 * Kui strateegia muutub, muuda SIIN.
 */

/** Põhieesmärk — kõik kanalid (SEO, Ads, sisu, e-post) teenivad seda. */
export const PRIMARY_GOAL =
  "E-poe tellimused: pumbad ja pumbavarustus era- ja äriklientidele — müük toimub veebis (pakiautomaat/kuller). Projektimüük B2B-le (elamud, ärihooned, haldurid) on kasvav teine jalg."

/** Sihtpiirkond — e-pood saadab Eesti, Läti ja Leedu pihta; põhiturg on Eesti. */
export const TARGET_REGION = "Eesti (+ Läti, Leedu)"
/** Lühike vorm reklaami-/sisutekstide jaoks. */
export const TARGET_REGION_SHORT = "Eestis ja Baltikumis"

/**
 * Segmendid/päringud, mida EI taheta (välja arvatud brändi- ja
 * tootepäringud): Ads'is negatiivseteks märksõnadeks, SEO-s/sisus
 * ei prioriseerita.
 */
export const DEPRIORITIZED_SEGMENTS = [
  "tööotsija-intendid (palk, tööpakkumine, koolitus, cv)",
  "pumba rent / üürimine (pumbapood müüb, ei rendi)",
  "tasuta / osta kasutatult-tüüpi päringud, mis ei konverteeri",
] as const

/**
 * Negatiivsed märksõnanimekirjad pole ühekordne töö: broad-match
 * märksõnad tõmbavad uusi soovimatuid termineid sisse ka pärast
 * välistamist → iganädalane otsinguterminite läbivaatus on kohustuslik
 * (toetab: nädalaraporti „kulutab ilma konversioonideta" reegel +
 * Ads'i search-terms vaade).
 */
export const NEGATIVE_KEYWORDS_MAINTENANCE =
  "Negatiivseid nimekirju hooldatakse iganädalaselt (broad match toob uusi soovimatuid termineid pidevalt sisse)."

/**
 * Valmis kontekstiplokk LLM-i süsteemprompti ja käsitsi koostatavate
 * tegevuskavade päisesse — hoiab eesmärgi pidevalt silme ees.
 */
export const STRATEGY_CONTEXT = `PÕHIEESMÄRK (raami KÕIK prioriteedid ja soovitused selle järgi):
- ${PRIMARY_GOAL}
- Sihtpiirkond: ${TARGET_REGION}.
- Soovimatud segmendid (Ads: negatiivsed märksõnad; SEO/sisu: ei prioriseerita): ${DEPRIORITIZED_SEGMENTS.join("; ")}.
- Tootekategooriad: veeautomaadid/hüdrofoorid, kütte- ja tsirkulatsioonipumbad, sooja tarbevee pumbad, puurkaevupumbad, drenaažipumbad, salvkaevupumbad, rõhutõstepumbad, reoveepumbad; põhibrändid nt Grundfos (sh Unilift seeria).`
