# PropVest AI

A Next.js prototype for matching investors to San Francisco real estate opportunities using financial analysis, investor preferences, and regulatory/compliance intelligence.

The app package lives in `rentalinvestmentscreener/`.

## Repository Layout

```text
.
|-- README.md
`-- rentalinvestmentscreener/
    |-- .dockerignore
    |-- data/
    |   |-- raw/
    |   |-- processed/
    |   `-- templates/
    |-- design/
    |   `-- wireframes/
    |-- docs/
    |-- Dockerfile
    |-- public/
    |   `-- listing-images/
    |-- src/
    |   |-- app/
    |   |-- components/
    |   |-- features/
    |   `-- lib/
    |-- package.json
    `-- README.md
```

## Architecture

- `src/app/`: Next.js route files, page composition, metadata, and global CSS.
- `src/components/`: Reusable presentation components shared across routes.
- `src/features/recommendations/`: Client-side recommendation UI with scoped DOM updates.
- `src/features/screening/`: San Francisco property data model, sample candidates, scoring, and metric calculations.
- `src/lib/`: Framework-agnostic helpers such as number formatting.
- `data/`: CSV storage area for raw inputs, processed outputs, and import templates.
- `public/listing-images/`: Demo listing photos referenced by the San Francisco candidate records.
- `design/`: Figma wireframe exports and implementation notes.
- `docs/`: Product objective mapping and implementation notes.

## Development

```bash
cd rentalinvestmentscreener
npm install
npm run dev
```

Open `http://localhost:3000` after the dev server starts.

## Docker

Build the production image:

```bash
cd rentalinvestmentscreener
docker build -t rental-investment-screener .
```

Run the container:

```bash
docker run --rm --name rental-investment-screener -p 3000:3000 rental-investment-screener
```

Open `http://localhost:3000` after the container starts.

## Verification

```bash
cd rentalinvestmentscreener
npm run lint
npm run build
```

## Data

Use `rentalinvestmentscreener/data/templates/` to create new CSV inputs. Put untouched source files in `data/raw/` and cleaned app-ready files in `data/processed/`. Listing photos should live in `rentalinvestmentscreener/public/listing-images/` and be referenced from property records with `/listing-images/...` paths. The current launch scope is San Francisco only.

## Figma Wireframes

Place exported Figma frames in `rentalinvestmentscreener/design/wireframes/`. The current UI is componentized so a wireframe can be translated section by section into `src/components/` and `src/app/page.tsx`.

## Interaction Model

Investor profile and search changes are handled in a React client boundary. The browser does not submit the whole page; scoped DOM regions such as recommendation KPIs, cards, list/map views, tables, and selected-property detail refresh from local state.
