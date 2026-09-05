# Kissan Ebazzar Web Frontend

React + Vite frontend for the Kissan Ebazzar animal marketplace, veterinarian booking, reports, schemes, admin, and farmer workflows.

## Setup

```bash
cd frontend
npm install
```

Create a `.env` file when the backend is not running on the default local URL:

```env
VITE_API_URL=http://localhost:5000
```

## Development

```bash
npm run dev
```

## Checks

```bash
npm run lint
npm run build
```

## Notes

- API calls are configured from `src/config/api.js`.
- Build output is written to `dist/`.
- Large listing images are bundled from `src/assets/`; optimize those assets before production releases when bundle size matters.
