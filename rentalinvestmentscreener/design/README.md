# Design Intake

Place exported wireframes and design references here before translating them into app components.

## Figma Workflow

- Export the relevant frame as PNG or SVG and place it in `wireframes/`.
- Include mobile and desktop frames when both exist.
- Keep notes about spacing, colors, components, and interaction states in this file or a sibling markdown file.
- Build from the existing component structure in `src/components/` and feature modules in `src/features/`.

## Implementation Notes

- Prefer server-rendered components for dashboards and tables.
- Add client components only for interactions that require local state.
- Avoid heavy charting packages unless the wireframe requires interactions that cannot be handled with lightweight SVG.
