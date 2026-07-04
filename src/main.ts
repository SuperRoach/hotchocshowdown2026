import { setupGeolocation } from "./geolocation";
import { setupInfoDialog } from "./info";
import { loadLocations } from "./locations";
import { addLocationMarkers, createMap } from "./map";
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
    addLocationMarkers(map, locations);
    setStatus(null);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load locations";
    setStatus(message, "error");
  }
}

void init();
