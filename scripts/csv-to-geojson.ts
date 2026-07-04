import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const csvPath = resolve(root, "data/hot-choc-locations.csv");
const outputPath = resolve(root, "public/hot-choc-locations.geojson");

interface CsvRow {
  "Hot chocolate": string;
  Place: string;
  "Tags shown": string;
  Address: string;
  "Hot Chocolate Link": string;
  "Picture URL": string;
  Latitude: string;
  Longitude: string;
}

interface LocationProperties {
  id: string;
  title: string;
  place: string;
  tags: string[];
  address: string;
  url: string;
  imageUrl: string;
}

interface LocationFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: LocationProperties;
}

interface LocationFeatureCollection {
  type: "FeatureCollection";
  features: LocationFeature[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function requireField(row: CsvRow, field: keyof CsvRow, rowNumber: number): string {
  const value = row[field]?.trim();
  if (!value) {
    throw new Error(`Row ${rowNumber}: missing required field "${field}"`);
  }
  return value;
}

function parseCoordinate(
  value: string,
  field: "Latitude" | "Longitude",
  rowNumber: number,
): number {
  const coordinate = Number(value);
  if (!Number.isFinite(coordinate)) {
    throw new Error(`Row ${rowNumber}: invalid ${field} "${value}"`);
  }
  return coordinate;
}

function rowToFeature(row: CsvRow, rowNumber: number): LocationFeature {
  const title = requireField(row, "Hot chocolate", rowNumber);
  const place = requireField(row, "Place", rowNumber);
  const address = requireField(row, "Address", rowNumber);
  const url = requireField(row, "Hot Chocolate Link", rowNumber);
  const imageUrl = requireField(row, "Picture URL", rowNumber);
  const latitude = parseCoordinate(
    requireField(row, "Latitude", rowNumber),
    "Latitude",
    rowNumber,
  );
  const longitude = parseCoordinate(
    requireField(row, "Longitude", rowNumber),
    "Longitude",
    rowNumber,
  );

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    properties: {
      id: slugify(`${place}-${title}`),
      title,
      place,
      tags: parseTags(row["Tags shown"] ?? ""),
      address,
      url,
      imageUrl,
    },
  };
}

function main(): void {
  const csv = readFileSync(csvPath, "utf8");
  const parsed = Papa.parse<CsvRow>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    const message = parsed.errors
      .map((error) => `Row ${error.row ?? "?"}: ${error.message}`)
      .join("\n");
    throw new Error(`Failed to parse CSV:\n${message}`);
  }

  const features = parsed.data.map((row, index) => rowToFeature(row, index + 2));
  const collection: LocationFeatureCollection = {
    type: "FeatureCollection",
    features,
  };

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(collection, null, 2)}\n`, "utf8");
  console.log(`Wrote ${features.length} features to ${outputPath}`);
}

main();
