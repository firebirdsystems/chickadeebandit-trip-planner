# Trip Planner

A [Chickadee Bandit](http://chickadeebandit.com) app for collaborative family vacation planning — itinerary by day, per-person packing lists, shared notes, and booking confirmations in one place.

## Features

- **Itinerary** — Day-by-day view with categorized items (transport, accommodation, activity, restaurant). Each item supports a time, description, confirmation code, and booking URL.
- **Packing lists** — Per-member and shared lists with check-off. Adults see everyone's progress at a glance.
- **Grocery integration** — Push shared packing items (sunscreen, adapters, snacks) directly to the household shopping list.
- **Documents** — Upload and download booking confirmations via the hub's shared document layer.

## Development

```bash
npm install
npm run dev    # http://localhost:3001
npm run build  # dist/bundle.json
npm test
```

Set up the pre-push hook once per clone:

```bash
git config core.hooksPath .githooks
```
