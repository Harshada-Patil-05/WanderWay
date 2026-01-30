const mapDiv = document.getElementById("map");

if (mapDiv) {
    const lat = mapDiv.dataset.lat;
    const lng = mapDiv.dataset.lng;
    const title = mapDiv.dataset.title;
    const location = mapDiv.dataset.location;

    if (lat && lng) {
        const map = L.map("map").setView([lat, lng], 13);

        // 🔴 Red marker icon (used in both cases)
        const redIcon = L.icon({
            iconUrl:
                "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
            shadowUrl:
                "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        // 🌍 Fallback: OpenStreetMap
        const osmLayer = L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            { attribution: "© OpenStreetMap contributors" }
        );

        // 🎨 Primary: Jawg styled tiles
        const jawgLayer = L.tileLayer(
            "https://tile.jawg.io/jawg-streets/{z}/{x}/{y}{r}.png?access-token=HGciCXkz4slkdoDD1etyTWOFoB9WXMQw1CaUHDFqI3QHs238M6H3HF9of6Y1Faix",
            {
                attribution:
                    "© Jawg Maps © OpenStreetMap contributors",
                maxZoom: 22
            }
        );

        // 👉 If Jawg fails, switch to OSM
        jawgLayer.on("tileerror", () => {
            console.warn("Jawg token expired — switching to OSM");
            if (!map.hasLayer(osmLayer)) {
                osmLayer.addTo(map);
            }
        });

        // Try Jawg first
        jawgLayer.addTo(map);

        // 📍 Marker
        L.marker([lat, lng], { icon: redIcon })
            .addTo(map)
            .bindPopup(`<b>${title}</b><br>${location}`)
            .openPopup();

        setTimeout(() => {
            map.invalidateSize(true);
        }, 300);

         map.on("zoomend", () => {
            map.panTo([lat, lng]);
        });

    }
}
