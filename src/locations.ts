export interface LocationProperties {
  id: string;
  title: string;
  place: string;
  tags: string[];
  address: string;
  url: string;
  imageUrl: string;
}

export interface LocationFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: LocationProperties;
}

export interface LocationFeatureCollection {
  type: "FeatureCollection";
  features: LocationFeature[];
}

export async function loadLocations(): Promise<LocationFeatureCollection> {
  const response = await fetch("/hot-choc-locations.geojson");

  if (!response.ok) {
    throw new Error(`Failed to load locations (${response.status})`);
  }

  return (await response.json()) as LocationFeatureCollection;
}
