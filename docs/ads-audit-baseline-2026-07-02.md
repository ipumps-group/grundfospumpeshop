# Ads Audit Baseline — 2 July 2026

**Business:** Pumbapood / Pump OÜ  
**Website:** pumbapood.ee  
**Audit timestamp:** 2 July 2026, approximately 13:00 Europe/Tallinn  
**Platforms:** Google Ads, Meta Ads, website order database

This document records the baseline, changes, and verification completed on 2 July 2026. Use it as the comparison point for the next audit.

## Baseline before changes

### Google Ads

| Period | Spend | Impressions | Clicks | CTR | Avg. CPC | Conversions |
|---|---:|---:|---:|---:|---:|---:|
| June 2026 | €401.73 | 5,791 | 836 | 14.44% | €0.48 | 0 |
| 1–2 July 2026 | €46.42 | 1,117 | 102 | 9.13% | €0.46 | 0 |
| Total observed | €448.15 | 6,908 | 938 | 13.58% | €0.48 | 0 |

The main search campaign had a €15/day budget. The campaign named `Pumbapood Brand Search - EE 20260629` had a €20/day budget and spent €48.63 between 29 June and 2 July.

The supposed brand campaign was matching generic searches because it contained the broad-match keyword `pump`. Examples included `basseini pump`, `mudapump`, `12v pump`, `paadipump`, competitor brands, Russian searches, and English industrial-pump searches.

All four configured Google conversion actions were enabled:

- Purchase — primary
- Contact form submission — primary
- Begin checkout — secondary
- Add to cart — secondary

None had recorded an attributed conversion during the audited period.

### Meta Ads

| Period | Spend | Impressions | All clicks | Link clicks | Landing-page views | Conversions |
|---|---:|---:|---:|---:|---:|---:|
| June 2026 | €261.32 | 275,350 | 4,237 | 2,665 | 1,154 | 0 |
| 1–2 July 2026 | €23.25 | 75,919 | 1,557 | 1,273 | 334 | 0 |
| Total observed | €284.57 | 351,269 | 5,794 | 3,938 | 1,488 | 0 |

Landing-page-view rate from link clicks declined from 43.3% in June to 26.2% in July. This suggested low-quality or accidental clicks and inefficient placements.

The remarketing ad set produced 1,757 link clicks but only 312 landing-page views during 20 June–2 July, with no purchase, lead, checkout, or add-to-cart outcomes.

Poor placement examples included Audience Network, in-stream video, Reels overlays, and several Reels/mobile-web placements. Facebook mobile Feed had a materially better landing-page-view rate.

### Store orders and attribution

Seven order records existed from 1 June through the audit date. One appeared to be a real order worth €619.39; most other records were €0.12 test orders.

The plausible real order had no stored advertising consent and no Meta click identifier, so it could not be attributed to either advertising platform. Platform-reported revenue and ROAS therefore remained zero.

## Live account changes applied

### Google Ads

Changes were applied directly to the live account and verified through the Google Ads API:

| Setting | Before | After |
|---|---|---|
| Brand campaign name | `Pumbapood Brand Search - EE 20260629` | `Pumbapood + Grundfos Brand Search - EE` |
| Brand daily budget | €20/day | €5/day |
| Broad keyword `pump` | Enabled | Paused |
| Phrase keyword `pumbad tallinn` | Enabled | Paused |
| Main Search daily budget | €15/day | Unchanged |

The remaining brand campaign keywords are restricted to Pumbapood, Pump OÜ, and Grundfos brand/dealer intent. The main Search budget was not increased because there were no verified conversions.

### Meta Ads

Changes were applied directly to the live account and verified through the Meta API:

| Ad set | Before | After | Placement change |
|---|---:|---:|---|
| Remarketing — landing-page visitors 30 days | €5/day, active | Paused | None while paused |
| Puurkaevu veevarustus — SQ/SQE | €3.33/day | €1/day | Facebook Feed and Marketplace only |
| Veevarustus majas — veeautomaadid | €10/day | €3/day | Facebook Feed and Marketplace only |
| Aia kastmine — veeautomaadid | €2.50/day | €1/day | Existing automatic Facebook/Instagram placements retained |

Active Meta prospecting budget was reduced from €15.83/day to €5/day. Meta rejected feed-only targeting for the small gardening audience as too narrow, so its placements were retained while its budget was reduced.

The existing Traffic campaign remains active for controlled diagnostic traffic. The paused Sales campaign was not enabled because the account did not yet have reliable conversion signals.

### Same-day follow-up: budgets restored and Advantage Sales launched

After the budget strategy was clarified, all three traffic ad sets remained active and their original budgets were restored:

| Active traffic ad set | Final daily budget |
|---|---:|
| Puurkaevu veevarustus — SQ/SQE | €3.33 |
| Veevarustus majas — veeautomaadid | €10.00 |
| Aia kastmine — veeautomaadid | €2.50 |

A new ad set was created and activated in the previously empty `Pumbapood ostud - EE 2026` Sales campaign:

- Ad set: `Sales Advantage - veebikülastajad + uued ostjad`
- Budget: €5/day
- Objective: Sales
- Optimization: Purchase / offsite conversions
- Seed audience: website visitors from the previous 30 days
- Advantage Audience expansion: enabled to find additional new buyers
- Geography: Estonia
- Platforms: Facebook, Instagram, and Messenger
- Creative: the existing `Tuli meelde?` remarketing creative

The old Traffic-objective remarketing ad set remains paused to prevent it from competing with the new Purchase-optimized Sales ad. At the time of setup, the strict 30-day website audience contained only approximately 20 people, which was too small for meaningful delivery without Advantage expansion.

## Website tracking fixes completed

The following local code changes were made:

1. Purchase tracking no longer trusts stale `sessionStorage` checkout values.
2. The success page polls the server for up to approximately 20 seconds and only tracks an order after its status is confirmed as paid, shipped, or delivered.
3. Product quantities, item prices, order value, and transaction ID now come from the authoritative order record.
4. Google and Meta purchase events are marked as sent only after the relevant tracking call succeeds.
5. Meta browser and server Purchase events share the same event ID for deduplication.
6. Meta Conversions API Purchase events are only sent when advertising consent was stored with the order.
7. Google conversion actions validate their own ID and label independently; one missing optional label no longer disables every conversion action.
8. GA4 events now require analytics consent, while Google Ads conversion events require advertising consent.

Important files:

- `app/[locale]/checkout/success/page.tsx`
- `app/[locale]/checkout/page.tsx`
- `app/api/webhooks/montonio/route.ts`
- `lib/google-ads.ts`
- `lib/tracking-consent.ts`
- `tests/tracking.test.ts`

## Verification

- Tracking test suite: **14/14 tests passed**.
- Targeted lint for the tracking files: **passed**.
- Next.js production build: **passed** after enabling Windows system TLS certificates for the build process.
- Live Google and Meta settings: **verified through each platform API**.
- Repository-wide lint: still has a pre-existing backlog of 197 errors outside this ads/tracking change.

## Deployment status

The live advertising-account changes are active.

The website tracking changes were completed and verified in the local workspace but were **not deployed during this audit**, because the workspace already contained unrelated uncommitted changes. Confirm deployment before evaluating post-fix conversion tracking.

## Next audit comparison checklist

Run the next audit after the tracking changes have been deployed and at least 7–14 full days of data have accumulated.

### Confirm first

- Record the production deployment date and commit.
- Complete one consented test purchase.
- Confirm Google Ads receives Purchase, Begin Checkout, and Add to Cart.
- Confirm Meta Events Manager receives browser and server Purchase with deduplication.
- Confirm a paid order stores advertising consent, `_fbp`, and `_fbc` where available.
- Exclude test transactions from business-performance reporting.

### Compare Google Ads

- Spend, impressions, clicks, CTR, and CPC by campaign.
- Purchase and lead conversions by campaign and search term.
- Conversion rate, CPA, revenue, and ROAS.
- Search terms entering the renamed brand campaign.
- Brand campaign spend attributable to true Pumbapood/Grundfos intent.
- Main Search impression share and lost share, but only increase budget when conversions justify it.
- Search terms with at least €5 spend and no commercial outcome.

### Compare Meta Ads

- Link clicks versus landing-page views and their ratio.
- Landing-page-view cost by ad set, ad, and placement.
- Add to Cart, Initiate Checkout, Lead, Purchase, CPA, and ROAS.
- Performance of Facebook Feed/Marketplace against the retained gardening placements.
- Whether the three active prospecting ad sets generate genuine on-site events at the €5/day combined budget.
- Keep remarketing paused until it can optimize for a verified Lead, Checkout, or Purchase event instead of link clicks.

### Decision thresholds

- Do not restore or increase budgets based only on CTR or cheap clicks.
- Consider scaling only after at least several verified commercial conversions and positive unit economics.
- If tracking is verified but an ad set spends €20–€30 without any qualified event, pause or replace it.
- If Meta link-click-to-landing-page-view rate remains below 50%, investigate placements, destination speed, redirects, and in-app-browser behavior.
- Once enough Purchase or Lead data exists, replace the Meta Traffic campaign with Sales or Lead optimization.

## Baseline totals for quick comparison

| Metric | Baseline value |
|---|---:|
| Combined Google + Meta spend | €732.72 |
| Google clicks | 938 |
| Meta link clicks | 3,938 |
| Meta landing-page views | 1,488 |
| Platform-attributed conversions | 0 |
| Platform-attributed revenue | €0 |
| Google active daily budget after changes | €20/day |
| Meta Traffic daily budget after final changes | €15.83/day |
| Meta Advantage Sales daily budget | €5/day |
| Meta total active daily budget after final changes | €20.83/day |
