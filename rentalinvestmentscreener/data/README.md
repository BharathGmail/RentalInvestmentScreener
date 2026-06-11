# Data Directory

CSV files used by the PropVest AI San Francisco investment screener belong here. Keep raw source exports separate from cleaned, app-ready files so underwriting assumptions are easy to audit.

## Layout

- `raw/`: Unmodified CSV exports from MLS, brokers, property managers, lenders, or manual research.
- `processed/`: Normalized CSV files generated from raw inputs and ready for import into the app.
- `templates/`: Header-only CSV templates that define the expected shape for future imports.

## CSV Conventions

- Use snake_case column names.
- Store currency as plain numbers without `$` or commas.
- Store percentages as decimals, for example `0.075` for `7.5%`.
- Preserve source files in `raw/`; write transformed files to `processed/`.
- Do not commit private seller, tenant, loan, or personally identifiable information.

## Current Templates

- `templates/properties.csv`: San Francisco property candidates.
- `templates/investor-profile.csv`: Investor profile inputs used by the matching model.
- `templates/market-assumptions.csv`: Market-level operating assumptions.
