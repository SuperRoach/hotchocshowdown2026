import L from "leaflet";
import type { LocationFeatureCollection } from "./locations";
import { createPopupHtml } from "./popup";

import "leaflet/dist/leaflet.css";

// Leaflet's Default icon rebuilds image paths at runtime, which breaks under Vite.
// Serve icons from /public and remove the broken path resolver.
// @ts-expect-error Leaflet does not type this private method.
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

export function createMap(containerId: string): L.Map {
  const map = L.map(containerId, {
    zoomControl: false,
  }).setView([-37.5622, 143.8503], 13);

  L.control.zoom({ position: "bottomright" }).addTo(map);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  return map;
}

export function addLocationMarkers(
  map: L.Map,
  collection: LocationFeatureCollection,
): void {
  const bounds = L.latLngBounds([]);

  for (const feature of collection.features) {
    const [lng, lat] = feature.geometry.coordinates;
    const latLng = L.latLng(lat, lng);
    const { place, title } = feature.properties;

    L.marker(latLng, {
      title: `${place} — ${title}`,
      alt: `${place}: ${title}`,
      riseOnHover: true,
    })
      .bindTooltip(place, {
        direction: "top",
        offset: [0, -36],
        opacity: 0.95,
      })
      .bindPopup(createPopupHtml(feature.properties, lat, lng), {
        maxWidth: 280,
        autoPanPadding: [24, 24],
        autoPanPaddingTopLeft: [24, 72],
      })
      .addTo(map);

    bounds.extend(latLng);
  }

  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  }
}
