---
title: Regulatory Source Inventory (Horizon Scanning)
type: domain
status: stable
id: regulatory-source-inventory
updated: 2026-07-02
---

# Regulatory Source Inventory — Horizon Scanning

Vendor-neutral inventory of authoritative external sources a US small-to-mid
manufacturer should monitor for **upcoming or changing** regulations. This is the
seed "source of truth" list for the **Regulatory Watchtower** effort
(`delivery/pending/functional-backlog-2026-07-02` cluster B); admins add/remove
sources at runtime, so treat this as the initial curated set, not a fixed schema.

Scope covers regulated verticals Forge targets — firearms (ATF), food (FDA/USDA),
medical devices (FDA) — plus general manufacturing (OSHA/EPA/DOT/labor/tax).

**Feed legend:** `[API]` machine JSON, `[RSS]` feed, `[EMAIL]` subscription
(usually GovDelivery — parse inbound mail), `[BULK]` bulk download, `[NO FEED]`
scrape/manual, review-prone.

> **Air-gap note:** Horizon scanning is inherently **not** air-gappable — every
> source requires outbound HTTPS. This is the deliberate contrast with the air-gap
> / SKIFF cluster. A Watchtower node must be internet-connected.

---

## Backbone (start here — ~80% of value)

Three cross-cutting federal sources, filtered by the agency slugs relevant to each
customer's regulated domains, cover most horizon-scanning needs and are cleanly
pollable:

| Source | Body | Covers | URL | Feed |
|---|---|---|---|---|
| **Federal Register** | NARA/OFR | Daily proposed rules, final rules, notices from every agency | https://www.federalregister.gov | `[API]` (`/developers/documentation/api/v1`), per-search `[RSS]`, `[EMAIL]` |
| **Unified Agenda / reginfo.gov** | OMB/OIRA | Semiannual agenda of what each agency *plans* to regulate — the true horizon | https://www.reginfo.gov | `[BULK]` XML/CSV; `[NO FEED]` for live UI |
| **Regulations.gov** | GSA/eRulemaking | Dockets, comment periods, supporting docs | https://www.regulations.gov | `[API]` v4 (free api.data.gov key) |
| **GovInfo / eCFR** | GPO / OFR | Authoritative full text (FR, CFR, IRB); current CFR | https://www.govinfo.gov · https://www.ecfr.gov | `[API]`, `[BULK]` |

Everything below is domain-specific enrichment on top of this backbone.

---

## Workplace safety
| Source | Body | Covers | URL | Feed |
|---|---|---|---|---|
| OSHA rulemaking / agenda | DOL–OSHA | Standards, proposed/final rules, enforcement | https://www.osha.gov/laws-regs | `[RSS]`, `[EMAIL]`; rules via FR API |
| NIOSH | CDC–NIOSH | Recommended exposure limits, hazard alerts (predictive) | https://www.cdc.gov/niosh | `[RSS]`, `[EMAIL]` |

## Environmental
| Source | Body | Covers | URL | Feed |
|---|---|---|---|---|
| EPA rules & regulations | EPA | Air, water, waste, chemical (TSCA), reporting | https://www.epa.gov/laws-regulations | `[EMAIL]`; rules via FR API |
| EPA ECHO | EPA | Enforcement & compliance history (facility-level) | https://echo.epa.gov | `[API]`, `[BULK]` |
| State environmental analogs | State DEP/DEQ | State-delegated programs, often stricter than federal | *see State pattern* | Varies — mostly `[EMAIL]` |

## Firearms / explosives
| Source | Body | Covers | URL | Feed |
|---|---|---|---|---|
| ATF rules & regulations | DOJ–ATF | Final/proposed rules (GCA, NFA), 27 CFR | https://www.atf.gov/rules-and-regulations | `[NO FEED]`; rules via FR API (agency slug `alcohol-tobacco-firearms-and-explosives-bureau`) |
| ATF open letters | DOJ–ATF | Industry guidance letters (FFL/SOT-facing, high signal) | https://www.atf.gov/rules-and-regulations/open-letters | `[NO FEED]` |

> ATF is the weakest for automation. Best strategy: poll the FR API filtered to the
> ATF slug + the regulations.gov docket, and scrape Open Letters. Flag to admins as
> manual-review-prone.

## Food
| Source | Body | Covers | URL | Feed |
|---|---|---|---|---|
| FDA Food / FSMA | HHS–FDA | Food safety rules, FSMA, guidance | https://www.fda.gov/food | `[RSS]`, `[EMAIL]`, `[API]` openFDA |
| openFDA | HHS–FDA | Food enforcement/recalls as structured data | https://open.fda.gov | `[API]`, `[BULK]` |
| USDA FSIS | USDA–FSIS | Meat/poultry/egg inspection rules, recalls, directives | https://www.fsis.usda.gov | `[RSS]`, `[EMAIL]`, `[API]` |

## Medical devices
| Source | Body | Covers | URL | Feed |
|---|---|---|---|---|
| FDA CDRH / Medical Devices | HHS–FDA–CDRH | Device rules, classification, QMSR, UDI | https://www.fda.gov/medical-devices | `[RSS]`, `[EMAIL]`, `[API]` openFDA |
| FDA guidance pipeline | HHS–FDA | Draft & final guidance — leading policy indicator | https://www.fda.gov/regulatory-information/search-fda-guidance-documents | `[RSS]`, `[EMAIL]` |

## Transportation / hazmat
| Source | Body | Covers | URL | Feed |
|---|---|---|---|---|
| PHMSA | DOT–PHMSA | Hazmat transport (49 CFR), pipeline safety | https://www.phmsa.dot.gov | `[EMAIL]`; rules via FR API |
| FMCSA | DOT–FMCSA | Motor carrier / driver rules (HOS, CDL) | https://www.fmcsa.dot.gov | `[RSS]`, `[EMAIL]`; rules via FR API |

## Labor / employment
| Source | Body | Covers | URL | Feed |
|---|---|---|---|---|
| DOL (WHD, OFCCP) | DOL | Wage & hour, overtime, contractor rules | https://www.dol.gov | `[RSS]`, `[EMAIL]`; rules via FR API |
| EEOC | EEOC | Anti-discrimination guidance, EEO-1 reporting | https://www.eeoc.gov | `[RSS]`, `[EMAIL]` |
| USCIS — I-9 / E-Verify | DHS–USCIS | Form I-9 changes, E-Verify rules | https://www.uscis.gov · https://www.e-verify.gov | `[EMAIL]`; `[NO FEED]` for form-version changes |
| NLRB | NLRB | Union/labor-relations rules, precedent decisions | https://www.nlrb.gov | `[RSS]`, `[EMAIL]` |

## Tax
| Source | Body | Covers | URL | Feed |
|---|---|---|---|---|
| IRS Newsroom | Treasury–IRS | News releases, guidance announcements | https://www.irs.gov/newsroom | `[RSS]` (IRS Newswire), `[EMAIL]` |
| Internal Revenue Bulletin | Treasury–IRS | Official rulings, revenue procedures | https://www.irs.gov/irb | `[BULK]`; also GovInfo `[API]` |
| State Departments of Revenue | State DOR | State income/sales/use/excise changes | *see State pattern* | Varies — mostly `[EMAIL]` |

## Product safety
| Source | Body | Covers | URL | Feed |
|---|---|---|---|---|
| CPSC | CPSC | Consumer product rules, recalls, standards | https://www.cpsc.gov | `[API]` (recalls), `[RSS]`, `[EMAIL]` |

## Export / trade
| Source | Body | Covers | URL | Feed |
|---|---|---|---|---|
| BIS / EAR | Commerce–BIS | Export Admin Regs, Entity List, CCL, dual-use | https://www.bis.gov | `[EMAIL]`; Entity List via FR API; `[NO FEED]` for list deltas |
| DDTC / ITAR | State–DDTC | USML, ITAR (directly relevant to firearms) | https://www.pmddtc.state.gov | `[NO FEED]`; rules via FR API |
| CBP | DHS–CBP | Customs rulings, CSMS, tariff/import | https://www.cbp.gov | `[EMAIL]` (CSMS), some `[RSS]` |
| Consolidated Screening List | Commerce–ITA | Combined denied/entity/debarred parties (BIS+DDTC+OFAC) | https://www.trade.gov/consolidated-screening-list | `[API]`, `[BULK]` CSV — high value |

## Standards bodies (voluntary, often adopted by reference)
| Source | Body | Covers | URL | Feed |
|---|---|---|---|---|
| ANSI | ANSI | US standards clearinghouse; incorporation-by-reference | https://www.ansi.org | `[NO FEED]` (paywalled) |
| NFPA | NFPA | Fire/electrical codes (NEC 70, 654 combustible dust) | https://www.nfpa.org | `[NO FEED]` (paywalled) |
| ISO | ISO | Management/quality standards (9001, 14001, 13485) | https://www.iso.org | `[NO FEED]` (paywalled) |
| ASTM | ASTM Intl | Material/test-method standards | https://www.astm.org | `[NO FEED]` (paywalled) |
| UL | UL | Product safety standards/certification | https://ulse.org | `[NO FEED]` (paywalled) |

> Standards bodies are effectively unpollable and paywalled. Best approach: monitor
> the *federal adoption* of a standard (FR incorporation-by-reference notices)
> rather than the standards body itself. Flag as manual-subscription to admins.

---

## State-level pattern (do not enumerate 50)

Nearly every state publishes a **state register / administrative bulletin** — the
state analog to the Federal Register — carrying proposed/adopted agency rules on a
fixed cadence. Examples of the pattern: California *Regulatory Notice Register*
(OAL), Texas *Register* (SOS), New York *State Register*, Pennsylvania *Bulletin*,
Florida *Administrative Register*.

- **Feed reality:** uneven — a minority offer `[RSS]`/downloads; most offer
  `[EMAIL]` listservs; some are `[NO FEED]` (HTML/PDF only).
- **Seed strategy:** ship the *pattern* as a template (`State Register — {STATE}`)
  with a per-state URL slot + feed-type field, pre-populated only for the states a
  customer operates in. Admins fill the rest.
- **State agencies to watch within these registers:** environmental (CARB/TCEQ/DEC),
  tax (state DOR), State-Plan OSHA states (e.g. Cal/OSHA), state firearms/food.

---

## Ingestion cheat-sheet (for the poller)

| Tier | Sources | Integration |
|---|---|---|
| **Structured, easy** | Federal Register, Regulations.gov, GovInfo/eCFR, openFDA, ECHO, Consolidated Screening List, CPSC recalls | Poll JSON APIs on schedule — primary engine |
| **Feed-based** | OSHA, NIOSH, FDA topics, FSIS, IRS Newswire, EEOC, NLRB, DOT | RSS parse + GovDelivery email ingestion |
| **Email-only fallback** | BIS, CBP/CSMS, USCIS, many state agencies | Subscribe GovDelivery/listserv → parse inbound mail |
| **Scrape / manual (flag to admins)** | ATF (rules, open letters), DDTC/ITAR, Unified Agenda UI, standards bodies, some state registers | HTML scrape w/ change-detection; mark review-prone |

**Data-model note:** give each source a `feedType` field so the poller dispatches
correctly (JSON API vs RSS vs email-parse vs scrape), and gate industry-specific
groups (ATF, FDA) on the customer's declared regulated verticals.

---

## Known automation gaps

ATF, DDTC/ITAR, and all standards bodies (ANSI/NFPA/ISO/ASTM/UL) have no clean
machine feed. Surface them in the UI as **scrape/manual, review-prone** so admins
set expectations rather than assuming coverage.
