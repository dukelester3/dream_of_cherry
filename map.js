// ── Japan Map (Leaflet) for Service Area ──
(function() {
  function initMap() {
    const el = document.getElementById('japan-map');
    if (!el || typeof L === 'undefined') return;

    // Center on Tokyo, zoom to show Kanto region
    const map = L.map('japan-map', {
      scrollWheelZoom: false,
      zoomControl: true
    }).setView([35.68, 139.75], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    // Tokyo 23 wards approximate center - circle to indicate service area
    L.circle([35.68, 139.75], {
      radius: 12000,
      color: '#c9a227',
      fillColor: '#c9a227',
      fillOpacity: 0.15,
      weight: 2
    }).addTo(map);

    // Marker for Tokyo
    L.marker([35.68, 139.75], {
      icon: L.divIcon({
        className: 'japan-map-marker',
        html: '<span class="map-pin">東京</span>',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      })
    }).addTo(map);

    // Add zoom control to bottom-right
    map.zoomControl.setPosition('bottomright');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }
})();
