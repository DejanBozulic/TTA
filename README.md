# TTA

Local Vite React TypeScript application for the TTA prototype.

## Run Locally

From this directory:

```bash
npm install
npm run dev
```

Vite will print a local URL, usually:

```text
http://localhost:5173/
```

Open that URL in a browser to use the app.

## Available Scripts

```bash
npm run dev
```

Starts the local development server.

```bash
npm run build
```

Type-checks and creates a production build.

```bash
npm run preview
```

Serves the production build locally after `npm run build`.

## Prototype Source

The original Claude Artifact prototype is kept unchanged at:

```text
prototype/CtrlingTTA.tsx
```

The runnable app imports a copied component from:

```text
src/CtrlingTTA.tsx
```

## Source Structure

```text
src/CtrlingTTA.tsx          App state and layout composition
src/constants.ts            Shared labels, palettes, and fixed date constants
src/data/mockData.ts        Mock projects, templates, and tasks
src/utils.ts                Date, status, export, and phase helpers
src/components/common.tsx   Reusable controls, tags, modal shell, and phase widgets
src/components/modals.tsx   Task, project, and template modals
src/views/taskViews.tsx     Monthly, list, employee, Gantt, and dashboard views
```
