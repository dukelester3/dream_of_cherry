// ── Japan Map (Leaflet) for Service Area ──
(function() {
  function initMap() {
    const el = document.getElementById('japan-map');
    if (!el) return;
    if (typeof L === 'undefined') {
      setTimeout(initMap, 100);
      return;
    }

    const tokyo = [35.68, 139.75];
    const osaka = [34.69, 135.50];

    const map = L.map('japan-map', {
      scrollWheelZoom: false,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    // Fit bounds to show both Tokyo and Osaka
    map.fitBounds([tokyo, osaka], { padding: [40, 40], maxZoom: 6 });

    // Tokyo service area circle
    L.circle(tokyo, {
      radius: 15000,
      color: '#c9a227',
      fillColor: '#c9a227',
      fillOpacity: 0.2,
      weight: 2
    }).addTo(map);

    // Osaka service area circle
    L.circle(osaka, {
      radius: 15000,
      color: '#c9a227',
      fillColor: '#c9a227',
      fillOpacity: 0.2,
      weight: 2
    }).addTo(map);

    // Marker for Tokyo
    L.marker(tokyo, {
      icon: L.divIcon({
        className: 'japan-map-marker',
        html: '<span class="map-pin">東京</span>',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      })
    }).addTo(map);

    // Marker for Osaka
    L.marker(osaka, {
      icon: L.divIcon({
        className: 'japan-map-marker',
        html: '<span class="map-pin">大阪</span>',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      })
    }).addTo(map);

    map.zoomControl.setPosition('bottomright');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }
})();
