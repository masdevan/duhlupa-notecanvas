<p align="center">
  <img src="public/core/logo.png" alt="Duhlupa logo" width="64" />
</p>

# Duhlupa

A minimal tabbed notepad that runs entirely in your browser. Write in multiple tabs, everything is saved locally — no account, no server.

## Features

- Multiple note tabs — add, close, select, and drag to scroll
- Tab titles auto-derive from the first line of each note
- Word wrap width control (desktop & tablet) — drag the wrap handles
- Custom accent & text colors via a circular color picker
- Font choice: Mono or Sans
- Settings modal with save / reset / unsaved-changes guard
- Export & import all data as JSON backup
- Auto-save everything to localStorage, loaded before first paint (no flash)
- Fully responsive (mobile / tablet / desktop)

## Tech Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS 4
- TypeScript

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Project Structure

```
app/           pages, layout, global styles
components/    UI components (editor, tab strip, modals, icons)
lib/           pure logic (storage, types)
public/        static assets (init.js, favicons)
```
