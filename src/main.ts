import { setupGeolocation } from "./geolocation";
import { setupInfoDialog } from "./info";
import { setupVenueList, type VenueListController } from "./list";
import { loadLocations } from "./locations";
import { addLocationMarkers, createMap, openLocation } from "./map";
import "./styles.css";

function setStatus(message: string | null, kind: "loading" | "error" = "loading"): void {
  const status = document.getElementById("status");
  if (!status) {
    return;
  }

  if (!message) {
    status.hidden = true;
    status.textContent = "";
    return;
  }

  status.hidden = false;
  status.textContent = message;
  status.className = `status status--${kind}`;
}

async function init(): Promise<void> {
  setupInfoDialog();
  const map = createMap("map");
  setupGeolocation(map);

  try {
    const locations = await loadLocations();
    const venueListRef: { current: VenueListController | null } = { current: null };

    const markers = addLocationMarkers(map, locations, {
      onRatingChange: () => {
        venueListRef.current?.refresh();
      },
      onFavoriteChange: () => {
        venueListRef.current?.refresh();
      },
    });

    venueListRef.current = setupVenueList({
      features: locations.features,
      onSelect: (id) => {
        openLocation(map, markers, id);
      },
    });

    setStatus(null);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load locations";
    setStatus(message, "error");
  }
}

void init();
