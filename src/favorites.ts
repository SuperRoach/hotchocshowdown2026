const STORAGE_KEY = "hot-choc-favorites";

function readFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

function writeFavoriteIds(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)]));
}

export function getAllFavorites(): string[] {
  return readFavoriteIds();
}

export function hasAnyFavorites(): boolean {
  return readFavoriteIds().length > 0;
}

export function isStarred(id: string): boolean {
  return readFavoriteIds().includes(id);
}

export function setStarred(id: string, starred: boolean): void {
  const ids = readFavoriteIds();

  if (starred) {
    if (!ids.includes(id)) {
      writeFavoriteIds([...ids, id]);
    }
    return;
  }

  writeFavoriteIds(ids.filter((favoriteId) => favoriteId !== id));
}

export function toggleStarred(id: string): boolean {
  const starred = !isStarred(id);
  setStarred(id, starred);
  return starred;
}
