# PropVest AI App

This is the Next.js app for the PropVest AI San Francisco prototype. It presents investor-profile inputs, ranked property recommendations, operating performance, appreciation or depreciation, and compliance intelligence while keeping source data, domain calculations, and UI presentation in separate directories.

## Architecture

```text
rentalinvestmentscreener/
|-- data/
|   |-- raw/
|   |-- processed/
|   `-- templates/
|-- design/
|   `-- wireframes/
|-- docs/
|-- public/
|   `-- listing-images/
|-- src/
|   |-- app/
|   |   |-- layout.tsx
|   |   |-- page.tsx
|   |   `-- globals.css
|   |-- components/
|   |-- features/
|   |   |-- recommendations/
|   |   `-- screening/
|   `-- lib/
|-- .dockerignore
|-- Dockerfile
|-- package.json
`-- tsconfig.json
```

### Source Directories

- `src/app/`: App Router files and global styling.
- `src/components/`: Shared UI components such as the header and metric cards.
- `src/features/recommendations/`: Client-side PropVest dashboard with scoped React state updates.
- `src/features/screening/`: San Francisco property candidate types, seed candidate data, matching, and screening calculations.
- `src/lib/`: Generic helpers that are not tied to a specific feature.
- `public/listing-images/`: Demo listing photos served by Next.js from stable public paths.
- `design/`: Figma wireframe exports and notes for UI implementation.
- `docs/`: Product objective mapping and implementation notes.

### Data Directories

- `data/raw/`: Unmodified source CSVs.
- `data/processed/`: Cleaned CSVs ready for app import.
- `data/templates/`: Header-only CSV templates for consistent imports.

## Development

Install dependencies:

```bash
npm install
```

Run the local development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Docker

Build the production image from this app directory:

```bash
docker build -t rental-investment-screener .
```

Run the container locally:

```bash
docker run --rm --name rental-investment-screener -p 3000:3000 rental-investment-screener
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev`: Start the local Next.js development server.
- `npm run build`: Create a production build.
- `npm run start`: Start the production server after a build.
- `npm run lint`: Run ESLint.

## Screening Model

The current page uses typed San Francisco sample candidates from `src/features/screening/property-candidates.ts`. Matching and screening calculations live in `src/features/screening/metrics.ts` and currently compute:

- annual gross booking revenue
- average daily rate and occupancy
- monthly net operating income
- monthly cash flow after debt service
- cap rate
- cash-on-cash return
- acquisition-to-current value movement
- next-period value forecast
- capital fit
- investor risk fit
- property type fit
- San Francisco compliance status and caution flags
- overall recommendation score
- search-scoped ZIP filtering
- neighborhood intelligence for selected properties

## CSV Workflow

1. Add untouched source exports to `data/raw/`.
2. Normalize column names and values into `data/processed/`.
3. Match import files to the templates in `data/templates/`.
4. Store demo listing photos in `public/listing-images/` and reference them with `/listing-images/...` paths in `image_urls`.
5. Keep sensitive seller, tenant, and loan details out of committed CSVs.

## Scoped DOM Updates

The recommendation experience runs inside `src/features/recommendations/propvest-dashboard.tsx` as a React client component. Search and profile controls update local state and recompute recommendation data with `useMemo`; only scoped DOM regions marked with `data-refresh-scope` update. The browser does not perform a full page refresh.

## Figma Wireframe Intake

Add exported Figma frames to `design/wireframes/`. Use `design/README.md` to capture any spacing, color, component, and interaction notes before implementing the wireframe in `src/components/` and `src/app/page.tsx`.

## Verification

```bash
npm run lint
npm run build
```
