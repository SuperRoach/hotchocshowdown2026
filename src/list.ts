import type { LocationFeature } from "./locations";
import { getAllRatings, getRating } from "./ratings";

export interface VenueListController {
  refreshRatings: () => void;
  close: () => void;
  isOpen: () => boolean;
}

interface SetupVenueListOptions {
  features: LocationFeature[];
  onSelect: (id: string) => void;
}

type SortMode = "default" | "rating";

const NO_RATINGS_TITLE =
  "Rate more places to be able to sort by your rating (only you can see it)";
const SORT_BY_RATING_TITLE = "Sort by your rating (only you can see it)";
const SORT_BY_DEFAULT_TITLE = "Sort by default order";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function ratingBadgeHtml(rating: number | null): string {
  if (rating === null) {
    return `<span class="venue-list-rating" hidden></span>`;
  }

  return `<span class="venue-list-rating" aria-label="Rated ${rating} out of 10">${rating}</span>`;
}

function hasAnyRatings(): boolean {
  return Object.keys(getAllRatings()).length > 0;
}

export function setupVenueList({
  features,
  onSelect,
}: SetupVenueListOptions): VenueListController {
  const button = document.getElementById("list-button");
  const panel = document.getElementById("venue-list-panel");
  const list = document.getElementById("venue-list");
  const closeButton = document.getElementById("venue-list-close");
  const sortButton = document.getElementById("venue-list-sort");

  if (
    !(button instanceof HTMLButtonElement) ||
    !(panel instanceof HTMLElement) ||
    !(list instanceof HTMLOListElement)
  ) {
    return {
      refreshRatings: () => undefined,
      close: () => undefined,
      isOpen: () => false,
    };
  }

  let sortMode: SortMode = "default";
  const items = new Map<string, HTMLLIElement>();

  const setOpen = (open: boolean): void => {
    panel.toggleAttribute("hidden", !open);
    button.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("venue-list-open", open);
  };

  const close = (): void => {
    setOpen(false);
  };

  const updateSortButton = (): void => {
    if (!(sortButton instanceof HTMLButtonElement)) {
      return;
    }

    const canSort = hasAnyRatings();
    sortButton.disabled = !canSort;
    sortButton.classList.toggle("is-active", canSort && sortMode === "rating");
    sortButton.setAttribute(
      "aria-pressed",
      canSort && sortMode === "rating" ? "true" : "false",
    );

    if (!canSort) {
      sortButton.title = NO_RATINGS_TITLE;
      sortButton.setAttribute("aria-label", NO_RATINGS_TITLE);
      return;
    }

    if (sortMode === "rating") {
      sortButton.title = SORT_BY_DEFAULT_TITLE;
      sortButton.setAttribute("aria-label", SORT_BY_DEFAULT_TITLE);
    } else {
      sortButton.title = SORT_BY_RATING_TITLE;
      sortButton.setAttribute("aria-label", SORT_BY_RATING_TITLE);
    }
  };

  const applySort = (): void => {
    const rows = features.map((feature, index) => ({
      id: feature.properties.id,
      index,
      rating: getRating(feature.properties.id),
      item: items.get(feature.properties.id),
    }));

    rows.sort((a, b) => {
      if (sortMode === "rating") {
        const aRated = a.rating !== null;
        const bRated = b.rating !== null;

        if (aRated && bRated && a.rating !== b.rating) {
          return (b.rating as number) - (a.rating as number);
        }

        if (aRated !== bRated) {
          return aRated ? -1 : 1;
        }
      }

      return a.index - b.index;
    });

    for (const row of rows) {
      if (row.item) {
        list.append(row.item);
      }
    }
  };

  const refreshRatings = (): void => {
    for (const row of list.querySelectorAll<HTMLElement>("[data-location-id]")) {
      const id = row.dataset.locationId;
      if (!id) {
        continue;
      }

      const badge = row.querySelector(".venue-list-rating");
      if (!(badge instanceof HTMLElement)) {
        continue;
      }

      const rating = getRating(id);
      if (rating === null) {
        badge.hidden = true;
        badge.textContent = "";
        badge.removeAttribute("aria-label");
      } else {
        badge.hidden = false;
        badge.textContent = String(rating);
        badge.setAttribute("aria-label", `Rated ${rating} out of 10`);
      }
    }

    if (!hasAnyRatings() && sortMode === "rating") {
      sortMode = "default";
    }

    updateSortButton();
    applySort();
  };

  list.replaceChildren();
  items.clear();

  features.forEach((feature, index) => {
    const { id, place, title } = feature.properties;
    const number = index + 1;
    const rating = getRating(id);

    const item = document.createElement("li");
    item.className = "venue-list-item";

    const row = document.createElement("button");
    row.type = "button";
    row.className = "venue-list-row";
    row.dataset.locationId = id;
    row.dataset.index = String(number);
    row.innerHTML = `
      <span class="venue-list-number">${number}</span>
      <span class="venue-list-text">
        <span class="venue-list-place">${escapeHtml(place)}</span>
        <span class="venue-list-title">${escapeHtml(title)}</span>
      </span>
      ${ratingBadgeHtml(rating)}
    `;

    row.addEventListener("click", () => {
      onSelect(id);
      if (window.matchMedia("(max-width: 720px)").matches) {
        close();
      }
    });

    item.append(row);
    list.append(item);
    items.set(id, item);
  });

  button.addEventListener("click", () => {
    setOpen(panel.hasAttribute("hidden"));
  });

  if (closeButton instanceof HTMLButtonElement) {
    closeButton.addEventListener("click", close);
  }

  if (sortButton instanceof HTMLButtonElement) {
    sortButton.addEventListener("click", () => {
      if (!hasAnyRatings()) {
        return;
      }

      sortMode = sortMode === "default" ? "rating" : "default";
      updateSortButton();
      applySort();
    });
  }

  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
      button.focus();
    }
  });

  updateSortButton();
  setOpen(false);

  return {
    refreshRatings,
    close,
    isOpen: () => !panel.hasAttribute("hidden"),
  };
}
