import type { LocationProperties } from "./locations";
import { getRating } from "./ratings";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

function isDisplayTag(tag: string): boolean {
  const normalized = tag.trim().toLowerCase();
  return Boolean(normalized) && !normalized.startsWith("tag not shown");
}

function createRatingControlsHtml(locationId: string): string {
  const current = getRating(locationId);
  const buttons = Array.from({ length: 11 }, (_, value) => {
    const active = current === value ? " is-active" : "";
    return `<button type="button" class="popup-rating-button${active}" data-rating="${value}" aria-pressed="${current === value}">${value}</button>`;
  }).join("");

  return `
    <div class="popup-rating" data-location-id="${escapeHtml(locationId)}">
      <div class="popup-rating-buttons" role="group" aria-label="Your rating, 0 to 10">
        ${buttons}
      </div>
    </div>
  `;
}

export function createPopupHtml(
  properties: LocationProperties,
  lat: number,
  lng: number,
): string {
  const tags = properties.tags
    .filter(isDisplayTag)
    .map((tag) => `<span class="popup-tag">${escapeHtml(tag)}</span>`)
    .join("");

  const directionsUrl = createDirectionsUrl(lat, lng);
  const detailUrl = escapeHtml(properties.url);

  const image = properties.imageUrl
    ? `<a class="popup-image-link" href="${detailUrl}" target="_blank" rel="noopener noreferrer">
        <img
          class="popup-image"
          src="${escapeHtml(properties.imageUrl)}"
          alt="${escapeHtml(properties.title)}"
          loading="lazy"
          onerror="this.closest('a')?.remove()"
        />
      </a>`
    : "";

  return `
    <article class="popup" data-location-id="${escapeHtml(properties.id)}">
      <h2 class="popup-place">${escapeHtml(properties.place)}</h2>
      <h3 class="popup-title">
        <a href="${detailUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(properties.title)}</a>
      </h3>
      ${image}
      <p class="popup-address">
        <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(properties.address)}</a>
      </p>
      ${tags ? `<div class="popup-tags">${tags}</div>` : ""}
      ${createRatingControlsHtml(properties.id)}
      <div class="popup-links">
        <a class="popup-directions" href="${directionsUrl}" target="_blank" rel="noopener noreferrer">Directions</a>
      </div>
    </article>
  `;
}

export function syncPopupRatingUi(
  root: ParentNode,
  locationId: string,
  rating: number | null,
): void {
  const ratingRoot =
    root.querySelector<HTMLElement>(`.popup-rating[data-location-id="${CSS.escape(locationId)}"]`) ??
    root.querySelector<HTMLElement>(".popup-rating");

  if (!ratingRoot) {
    return;
  }

  for (const button of ratingRoot.querySelectorAll<HTMLButtonElement>(".popup-rating-button")) {
    const value = Number(button.dataset.rating);
    const isActive = rating !== null && value === rating;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  }
}
