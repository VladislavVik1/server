// public/js/landing-map.js
(function () {
  const onReady = () =>
    new Promise((res) => {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", res, { once: true });
      } else res();
    });

  onReady().then(init);

  async function init() {
    if (!window.L) return;
    const el = document.getElementById("crimeMap");
    if (!el) return;

    // --- Карта ---
    const map = L.map("crimeMap", { scrollWheelZoom: true }).setView([39.5, -98.35], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const bounds = L.latLngBounds([]);
    const heatPoints = [];

    // --- helpers ---
    const normalize = (raw) => {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (Array.isArray(raw.data)) return raw.data;
      if (Array.isArray(raw.items)) return raw.items;
      if (Array.isArray(raw.reports)) return raw.reports;
      if (Array.isArray(raw.result)) return raw.result; // { success: true, result: [] }
      return [];
    };

    // Универсальный парсер координат
    const getCoords = (r) => {
      // 1) Наш основной формат: location.coordinates = { lat, lng }
      if (r?.location?.coordinates) {
        const c = r.location.coordinates;
        if (typeof c.lat === "number" && typeof c.lng === "number") {
          return [c.lat, c.lng];
        }
        // Иногда могут прислать массив [lng, lat]
        if (Array.isArray(c) && c.length >= 2) {
          const [lng, lat] = c;
          if (typeof lat === "number" && typeof lng === "number") return [lat, lng];
        }
      }
      // 2) Плоские поля внутри location
      if (r?.location && typeof r.location.lat === "number" && typeof r.location.lng === "number") {
        return [r.location.lat, r.location.lng];
      }
      // 3) Плоские поля на корне
      if (typeof r?.lat === "number" && typeof r?.lng === "number") {
        return [r.lat, r.lng];
      }
      return null;
    };

    const esc = (s) =>
      String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const addMarker = (r) => {
      const pos = getCoords(r);
      if (!pos) return;

      const type = r.type || r.category || "Incident";
      const descr = r.description || r.comments || "";
      const address = r.location?.address || r.location?.label || "";
      const when = r.date || r.createdAt || r.updatedAt || null;
      const dateStr = when ? new Date(when).toLocaleString() : "";

      const html = `
        <div style="min-width:220px">
          <div style="font-weight:700;margin-bottom:4px;">${esc(type)}</div>
          ${address ? `<div style="margin-bottom:4px;"><i class="fa fa-location-dot"></i> ${esc(address)}</div>` : ""}
          ${dateStr ? `<div style="margin-bottom:6px;"><i class="fa fa-clock"></i> ${esc(dateStr)}</div>` : ""}
          ${descr ? `<div style="color:#555">${esc(descr)}</div>` : ""}
        </div>
      `;

      L.marker(pos).addTo(map).bindPopup(html);
      bounds.extend(pos);
      heatPoints.push([pos[0], pos[1], 1]);
    };

    // --- fetch data (без токена) ---
    const endpoints = [
      "/api/public/landing/reports" // публичный эндпоинт approved-репортов
    ];

    let list = [];
    for (const url of endpoints) {
      try {
        const res = await fetch(url, { credentials: "same-origin" });
        if (!res.ok) {
          console.warn("Reports endpoint not OK:", url, res.status);
          continue;
        }
        const json = await res.json();
        list = normalize(json);
        if (list.length) break;
      } catch (e) {
        console.warn("Fetch error:", url, e);
      }
    }

    if (!Array.isArray(list)) list = normalize(list);

    // Отрисовка
    let count = 0;
    for (const r of list) {
      addMarker(r);
      count++;
    }

    // Heatmap (если подключён плагин)
    if (window.L.heatLayer && heatPoints.length) {
      L.heatLayer(heatPoints, { radius: 25, blur: 15, maxZoom: 12, minOpacity: 0.5 }).addTo(map);
    }

    // fitBounds или дефолт
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2));
    } else {
      map.setView([39.5, -98.35], 4);
      L.popup()
        .setLatLng(map.getCenter())
        .setContent("Нет публичных репортов для отображения.")
        .openOn(map);
    }
  }
})();
