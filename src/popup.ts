import type { LocationProperties } from "./locations";
import { isStarred } from "./favorites";
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

function starIconSvg(): string {
  return `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 2.5l2.87 5.82 6.42.93-4.64 4.53 1.1 6.4L12 17.77l-5.75 3.02 1.1-6.4-4.64-4.53 6.42-.93L12 2.5z"
    />
  </svg>`;
}

function createStarButtonHtml(locationId: string): string {
  const starred = isStarred(locationId);
  const label = starred ? "Remove from favourites" : "Add to favourites";

  return `
    <button
      type="button"
      class="popup-star${starred ? " is-starred" : ""}"
      data-location-id="${escapeHtml(locationId)}"
      aria-pressed="${starred ? "true" : "false"}"
      aria-label="${label}"
    >
      ${starIconSvg()}
    </button>
  `;
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
      <div class="popup-title-row">
        <h3 class="popup-title">
          <a href="${detailUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(properties.title)}</a>
        </h3>
        ${createStarButtonHtml(properties.id)}
      </div>
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

export function syncPopupStarUi(root: ParentNode, locationId: string, starred: boolean): void {
  const starButton =
    root.querySelector<HTMLButtonElement>(`.popup-star[data-location-id="${CSS.escape(locationId)}"]`) ??
    root.querySelector<HTMLButtonElement>(".popup-star");

  if (!starButton) {
    return;
  }

  starButton.classList.toggle("is-starred", starred);
  starButton.setAttribute("aria-pressed", starred ? "true" : "false");
  starButton.setAttribute(
    "aria-label",
    starred ? "Remove from favourites" : "Add to favourites",
  );
}
