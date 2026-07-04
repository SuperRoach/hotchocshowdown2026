import type { LocationProperties } from "./locations";

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
    <article class="popup">
      <h2 class="popup-place">${escapeHtml(properties.place)}</h2>
      <h3 class="popup-title">
        <a href="${detailUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(properties.title)}</a>
      </h3>
      ${image}
      <p class="popup-address">
        <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(properties.address)}</a>
      </p>
      ${tags ? `<div class="popup-tags">${tags}</div>` : ""}
      <div class="popup-links">
        <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer">Directions</a>
      </div>
    </article>
  `;
}
