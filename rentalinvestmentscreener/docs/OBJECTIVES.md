# PropVest AI Objectives

This project is scoped to a San Francisco launch market and a prototype recommendation engine for individual investors and small investment groups.

## Current Product Scope

- Market: San Francisco, CA only.
- User inputs: available capital, down payment budget, investment goal, time horizon, risk tolerance, preferred property type, and primary-residence plan.
- Analysis outputs: ranked property recommendations, match score, projected revenue, cash flow, cash-on-cash return, appreciation outlook, capital gap, and caution flags.
- Compliance outputs: primary-residence assumption, STR registration likelihood, HOA restriction risk, unhosted-night guardrail, zoning notes, and diligence notes.
- Wireframe elements: San Francisco masthead, search filter rail, list/map toggle, property cards, ranked results, and neighborhood intelligence.
- UI behavior: profile and search changes update scoped React DOM regions instead of refreshing the browser.

## Implemented Objective Mapping

- Property discovery: prototype candidate feed in `src/features/screening/property-candidates.ts`.
- Financial analysis: screening and return calculations in `src/features/screening/metrics.ts`.
- Regulatory intelligence: compliance status and caution flags in `src/features/screening/metrics.ts`.
- AI-powered matching: weighted recommendation scoring in `recommendProperties`.
- Personalized investor profile: client-side controls in `src/features/recommendations/propvest-dashboard.tsx`.
- Figma wireframe intake: design artifact copied into `public/sf-property-search-wireframe.png` for the visual masthead.

## Deferred Production Work

- Replace prototype property data with licensed listing, rent, sale, and ownership feeds.
- Verify San Francisco STR rules against authoritative city sources during data ingestion.
- Add authentication and saved investor profiles.
- Add API routes or server actions for live data refreshes.
- Add automated tests once the Node runtime is available in the development environment.
