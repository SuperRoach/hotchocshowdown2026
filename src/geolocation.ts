import L from "leaflet";

export function setupGeolocation(map: L.Map): void {
  const button = document.getElementById("locate-button");
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  let userMarker: L.CircleMarker | null = null;
  let accuracyCircle: L.Circle | null = null;

  button.addEventListener("click", () => {
    if (!navigator.geolocation) {
      window.alert("Geolocation is not supported by this browser.");
      return;
    }

    button.disabled = true;
    button.textContent = "Locating…";

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const latLng = L.latLng(latitude, longitude);

        if (userMarker) {
          userMarker.setLatLng(latLng);
        } else {
          userMarker = L.circleMarker(latLng, {
            radius: 8,
            color: "#1d4ed8",
            weight: 2,
            fillColor: "#3b82f6",
            fillOpacity: 0.9,
          })
            .bindPopup("You are here")
            .addTo(map);
        }

        if (accuracyCircle) {
          accuracyCircle.setLatLng(latLng);
          accuracyCircle.setRadius(accuracy);
        } else {
          accuracyCircle = L.circle(latLng, {
            radius: accuracy,
            color: "#3b82f6",
            weight: 1,
            fillColor: "#93c5fd",
            fillOpacity: 0.2,
          }).addTo(map);
        }

        map.setView(latLng, Math.max(map.getZoom(), 15));
        userMarker.openPopup();

        button.disabled = false;
        button.textContent = "Show my location";
      },
      (error) => {
        button.disabled = false;
        button.textContent = "Show my location";
        window.alert(`Unable to get your location: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 0,
      },
    );
  });
}
