# AGENTS

## Google Ads — kohustuslik kvaliteedistandard

Enne mis tahes Google Ads kampaaniate loomist, optimeerimist või reklaamide muutmist
**loe ja järgi `docs/reklaamide-kvaliteedi-juhend.md`**. Lühireeglid:

1. **Kõik asset-väljad täidetud lõpuni** — RSA: 15 pealkirja + 4 kirjeldust; sitelinkid ≥8
   (2 kirjeldusreaga); callout ×4, structured snippet, price, call laiendused lingitud.
2. **Pildid on KOHUSTUSLIKUD** — iga uus kampaania saab vähemalt 3 pildiassetit,
   igaüks kahes formaadis (1:1 1200×1200 + 1.91:1 1200×628). Kasuta
   `scripts/add-image-assets.mjs` (lisa pildid `IMAGES` massiivi). Kampaaniat EI käivitata
   ilma pildiassetiteta. Iga pilt peab olema unikaalse sisuga (Google dedupib identseid).
3. **Kitsad reklaamirühmad** (2–6 märksõna) + täpsed märksõnavormid pealkirjades.
4. **Töökäik:** skript alati `--dry-run` → näita väljundit → kasutaja kinnitus → live →
   kontrolli seisu (`tmp/_live-check.mjs`: 15H, policy APPROVED).
5. Teadaolevad API-piirangud (v24): image field type `AD_IMAGE`, price `finalUrl` + keel `en`,
   `~` keelatud reklaamitekstis — vt juhendi peatükk 7.
