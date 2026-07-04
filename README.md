# Hot Choc Showdown 2026 Map

A lightweight static map of Hot Choc Showdown 2026 venues in Ballarat. Locations come from a CSV file, are converted to GeoJSON at build time, and are shown on a Leaflet map.

This is a fan-made project. The official program is on the [Ballarat Winter Festival Hot Choc Showdown](https://www.ballaratwinterfestival.com.au/program/hot-choc-showdown) page.

## Requirements

- [Node.js](https://nodejs.org/) 20 or newer
- npm (comes with Node.js)

## Setup

```bash
git clone <your-repo-url>
cd hotchoccy
npm install
```

## Run locally

Start the dev server (regenerates GeoJSON from the CSV, then starts Vite):

```bash
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/).

## Update locations

Edit the source data:

```txt
data/hot-choc-locations.csv
```

Columns:

```txt
Hot chocolate, Place, Tags shown, Address, Hot Chocolate Link, Picture URL, Latitude, Longitude
```

`npm run dev` and `npm run build` both regenerate `public/hot-choc-locations.geojson` from that CSV. You do not need to edit the GeoJSON by hand.

To regenerate data only:

```bash
npm run generate:data
```

## Production build

```bash
npm run build
```

Output is written to `dist/`. Preview the production build locally:

```bash
npm run preview
```

## Deploy

Host the contents of `dist/` on any static host (Cloudflare Pages, Netlify, Vercel, GitHub Pages, etc.).

Configure the host to:

1. Install dependencies with `npm install`
2. Build with `npm run build`
3. Publish the `dist` directory

The site needs HTTPS in production for the “Show my location” button to work.
