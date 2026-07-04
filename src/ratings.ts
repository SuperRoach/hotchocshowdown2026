const STORAGE_KEY = "hot-choc-ratings";

export type RatingsMap = Record<string, number>;

function isValidRating(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 10
  );
}

export function getAllRatings(): RatingsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const ratings: RatingsMap = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (isValidRating(value)) {
        ratings[id] = value;
      }
    }
    return ratings;
  } catch {
    return {};
  }
}

export function getRating(id: string): number | null {
  const rating = getAllRatings()[id];
  return isValidRating(rating) ? rating : null;
}

export function setRating(id: string, value: number): void {
  if (!isValidRating(value)) {
    return;
  }

  const ratings = getAllRatings();
  ratings[id] = value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
}
