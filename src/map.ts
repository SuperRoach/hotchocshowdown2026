import L from "leaflet";
import type { LocationFeatureCollection } from "./locations";
import { createPopupHtml, syncPopupRatingUi } from "./popup";
import { getRating, setRating } from "./ratings";

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

export type MarkerMap = Map<string, L.Marker>;

export interface AddLocationMarkersOptions {
  onRatingChange?: (id: string, rating: number) => void;
}

function createNumberedIcon(number: number): L.DivIcon {
  return L.divIcon({
    className: "numbered-marker",
    html: `<span class="numbered-marker-badge">${number}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

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

export function openLocation(map: L.Map, markers: MarkerMap, id: string): void {
  const marker = markers.get(id);
  if (!marker) {
    return;
  }

  map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15));
  marker.openPopup();
}

export function addLocationMarkers(
  map: L.Map,
  collection: LocationFeatureCollection,
  options: AddLocationMarkersOptions = {},
): MarkerMap {
  const markers: MarkerMap = new Map();
  const bounds = L.latLngBounds([]);

  collection.features.forEach((feature, index) => {
    const [lng, lat] = feature.geometry.coordinates;
    const latLng = L.latLng(lat, lng);
    const { id, place, title } = feature.properties;
    const number = index + 1;

    const marker = L.marker(latLng, {
      title: `${number}. ${place} — ${title}`,
      alt: `${number}. ${place}: ${title}`,
      riseOnHover: true,
      icon: createNumberedIcon(number),
    })
      .bindTooltip(`${number}. ${place}`, {
        direction: "top",
        offset: [0, -16],
        opacity: 0.95,
      })
      .bindPopup(createPopupHtml(feature.properties, lat, lng), {
        maxWidth: 280,
        autoPanPadding: [24, 24],
        autoPanPaddingTopLeft: [24, 72],
      })
      .addTo(map);

    marker.on("popupopen", () => {
      const popupElement = marker.getPopup()?.getElement();
      if (!popupElement) {
        return;
      }

      const ratingRoot = popupElement.querySelector<HTMLElement>(".popup-rating");
      if (!ratingRoot) {
        return;
      }

      syncPopupRatingUi(popupElement, id, getRating(id));

      if (ratingRoot.dataset.wired === "true") {
        return;
      }

      ratingRoot.dataset.wired = "true";
      ratingRoot.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) {
          return;
        }

        if (!target.classList.contains("popup-rating-button")) {
          return;
        }

        const rating = Number(target.dataset.rating);
        if (!Number.isInteger(rating) || rating < 0 || rating > 10) {
          return;
        }

        setRating(id, rating);
        syncPopupRatingUi(popupElement, id, rating);
        options.onRatingChange?.(id, rating);
      });
    });

    markers.set(id, marker);
    bounds.extend(latLng);
  });

  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  }

  return markers;
}
