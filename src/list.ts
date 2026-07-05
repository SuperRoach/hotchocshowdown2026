import { hasAnyFavorites, isStarred } from "./favorites";
import type { LocationFeature } from "./locations";
import { getAllRatings, getRating } from "./ratings";

export interface VenueListController {
  refresh: () => void;
  close: () => void;
  isOpen: () => boolean;
}

interface SetupVenueListOptions {
  features: LocationFeature[];
  onSelect: (id: string) => void;
}

const NO_RATINGS_TITLE =
  "Rate more places to be able to sort by your rating (only you can see it)";
const SORT_BY_RATING_TITLE = "Sort by your rating (only you can see it)";
const NO_FAVORITES_TITLE =
  "Star places to show favourited hot choccy places (only you can see it)";
const SORT_BY_FAVORITES_TITLE = "Show favourited hot choccy places";
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
  const sortRatingButton = document.getElementById("venue-list-sort");
  const sortStarButton = document.getElementById("venue-list-sort-star");

  if (
    !(button instanceof HTMLButtonElement) ||
    !(panel instanceof HTMLElement) ||
    !(list instanceof HTMLOListElement)
  ) {
    return {
      refresh: () => undefined,
      close: () => undefined,
      isOpen: () => false,
    };
  }

  let sortByRating = false;
  let sortByStarred = false;
  const items = new Map<string, HTMLLIElement>();

  const setOpen = (open: boolean): void => {
    panel.toggleAttribute("hidden", !open);
    button.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("venue-list-open", open);
  };

  const close = (): void => {
    setOpen(false);
  };

  const updateRatingSortButton = (): void => {
    if (!(sortRatingButton instanceof HTMLButtonElement)) {
      return;
    }

    const canSort = hasAnyRatings();
    sortRatingButton.disabled = !canSort;
    sortRatingButton.classList.toggle("is-active", canSort && sortByRating);
    sortRatingButton.setAttribute(
      "aria-pressed",
      canSort && sortByRating ? "true" : "false",
    );

    if (!canSort) {
      sortRatingButton.title = NO_RATINGS_TITLE;
      sortRatingButton.setAttribute("aria-label", NO_RATINGS_TITLE);
      return;
    }

    if (sortByRating) {
      sortRatingButton.title = SORT_BY_DEFAULT_TITLE;
      sortRatingButton.setAttribute("aria-label", SORT_BY_DEFAULT_TITLE);
    } else {
      sortRatingButton.title = SORT_BY_RATING_TITLE;
      sortRatingButton.setAttribute("aria-label", SORT_BY_RATING_TITLE);
    }
  };

  const updateStarSortButton = (): void => {
    if (!(sortStarButton instanceof HTMLButtonElement)) {
      return;
    }

    const canSort = hasAnyFavorites();
    sortStarButton.disabled = !canSort;
    sortStarButton.classList.toggle("is-active", canSort && sortByStarred);
    sortStarButton.setAttribute(
      "aria-pressed",
      canSort && sortByStarred ? "true" : "false",
    );

    if (!canSort) {
      sortStarButton.title = NO_FAVORITES_TITLE;
      sortStarButton.setAttribute("aria-label", NO_FAVORITES_TITLE);
      return;
    }

    if (sortByStarred) {
      sortStarButton.title = SORT_BY_DEFAULT_TITLE;
      sortStarButton.setAttribute("aria-label", SORT_BY_DEFAULT_TITLE);
    } else {
      sortStarButton.title = SORT_BY_FAVORITES_TITLE;
      sortStarButton.setAttribute("aria-label", SORT_BY_FAVORITES_TITLE);
    }
  };

  const applySort = (): void => {
    const rows = features.map((feature, index) => ({
      id: feature.properties.id,
      index,
      rating: getRating(feature.properties.id),
      starred: isStarred(feature.properties.id),
      item: items.get(feature.properties.id),
    }));

    rows.sort((a, b) => {
      if (sortByStarred && a.starred !== b.starred) {
        return a.starred ? -1 : 1;
      }

      if (sortByRating) {
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

  const refreshRowState = (): void => {
    for (const row of list.querySelectorAll<HTMLElement>("[data-location-id]")) {
      const id = row.dataset.locationId;
      if (!id) {
        continue;
      }

      const starred = isStarred(id);
      row.classList.toggle("is-starred", starred);

      const badge = row.querySelector(".venue-list-rating");
      if (badge instanceof HTMLElement) {
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
    }

    if (!hasAnyRatings() && sortByRating) {
      sortByRating = false;
    }

    if (!hasAnyFavorites() && sortByStarred) {
      sortByStarred = false;
    }

    updateRatingSortButton();
    updateStarSortButton();
    applySort();
  };

  list.replaceChildren();
  items.clear();

  features.forEach((feature, index) => {
    const { id, place, title } = feature.properties;
    const number = index + 1;
    const rating = getRating(id);
    const starred = isStarred(id);

    const item = document.createElement("li");
    item.className = "venue-list-item";

    const row = document.createElement("button");
    row.type = "button";
    row.className = `venue-list-row${starred ? " is-starred" : ""}`;
    row.dataset.locationId = id;
    row.dataset.index = String(number);
    row.innerHTML = `
      <span class="venue-list-number${starred ? " venue-list-number--starred" : ""}">${number}</span>
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

  if (sortRatingButton instanceof HTMLButtonElement) {
    sortRatingButton.addEventListener("click", () => {
      if (!hasAnyRatings()) {
        return;
      }

      sortByRating = !sortByRating;
      updateRatingSortButton();
      applySort();
    });
  }

  if (sortStarButton instanceof HTMLButtonElement) {
    sortStarButton.addEventListener("click", () => {
      if (!hasAnyFavorites()) {
        return;
      }

      sortByStarred = !sortByStarred;
      updateStarSortButton();
      applySort();
    });
  }

  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
      button.focus();
    }
  });

  updateRatingSortButton();
  updateStarSortButton();
  setOpen(false);

  return {
    refresh: refreshRowState,
    close,
    isOpen: () => !panel.hasAttribute("hidden"),
  };
}
