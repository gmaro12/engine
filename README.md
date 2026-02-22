# OT Capacity-Demand & Ecology Engine

A specialized tool for school-based Occupational Therapists to analyze student performance data, map capacity vs. demand across routines, and ensure linguistic compliance.

## Features

- **Capacity–Demand Matrix**: Analyze subskills across various school routines.
- **Ecology & Access Mapping**: Identify environmental factors and suggest access levers.
- **Linguistic Compliance**: Automatically scrub 100+ prohibited terms and replace them with OT-compliant language.
- **Grammar Correction**: Automatic "a/an" flip logic for natural-sounding documentation.
- **OTPF-4 Taxonomy**: Comprehensive taxonomy of OT performance skills, including all 7 mandatory Visual Perception skills.
- **Word-Ready Exports**: Standardized taxonomy tables ready for copy-pasting into professional reports.

## Tech Stack

- React + Vite
- Tailwind CSS
- Radix UI
- Lucide React

## Development

```bash
npm install
npm run dev
npm run build
```

## Verification

Run the logic tests:
```bash
npx tsx src/verify-engine.ts
```
