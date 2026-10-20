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

## Supabase — uued `public` tabelid vajavad eksplitsiitseid GRANT-e

Alates **2026-10-30** ei saa uued `public` skeemi tabelid enam automaatseid Data API
õigusi (`anon`/`authenticated`/`service_role`). Ilma GRANT-ita vastab PostgREST
`42501 permission denied for table <nimi>`. Olemasolevaid tabeleid see EI mõjuta.

Iga `CREATE TABLE` peab olema **samas migratsioonis** kaetud kolmikuga:

```sql
-- 1. GRANT (miinimum, mida roll vajab — RLS piirab ridu edasi)
grant select on public.minu_tabel to anon;                                   -- kui avalik loetus
grant select, insert, update, delete on public.minu_tabel to authenticated;  -- kui sisselogitud kasutaja kirjutab
grant select, insert, update, delete on public.minu_tabel to service_role;   -- serveripoolsed API-d

-- 2. RLS
alter table public.minu_tabel enable row level security;

-- 3. Policy
create policy "..." on public.minu_tabel for select to authenticated using (...);
```

Reeglid:
- **Tabel + grants + RLS + policy on üks tervik** — ära lisa tabelit ilma GRANT-ideta.
- `serial`/`bigserial` veeru korral lisa ka
  `grant usage, select on sequence public.<tabel>_<veerg>_seq to service_role;`
  (identity-veerud seda ei vaja).
- Avalikud RPC-funktsioonid vajavad samuti
  `grant execute on function public.<fn>(<argtüübid>) to authenticated, service_role;`.
- Olemasolevad mustrid on failides `migrations/001_ads_schema.sql`,
  `scripts/new-supabase-schema.sql` ja `scripts/fix-rls-disabled-in-public.sql` (ptk 6).
