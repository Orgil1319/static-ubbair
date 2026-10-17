(function () {
  const UB = window.UB;
  const RISK_COLORS = { low: "#16a34a", medium: "#d97706", high: "#dc2626" };
  const UB_CENTER = [47.9077, 106.8832];
  const EMPTY = "empty";

  const GROUPS = [
    { id: "risk", label: "Үл хөдлөх хөрөнгийн эрсдэл", fields: [
      { id: "risk-low", label: "Аюулгүй", color: RISK_COLORS.low, icon: "🏠" },
      { id: "risk-medium", label: "Дунд", color: RISK_COLORS.medium, icon: "🏠" },
      { id: "risk-high", label: "Эрсдэлтэй", color: RISK_COLORS.high, icon: "🏠" },
    ] },
    { id: "safety", label: "Аюултай бүс", fields: [{ id: "flood", label: "Үерийн бүс", color: "#ef4444", icon: "🌊" }] },
    { id: "education", label: "Боловсрол", fields: [
      { id: "kindergartens", label: "Цэцэрлэг", color: "#eab308", icon: "🧸" },
      { id: "schools", label: "Сургууль", color: "#3b82f6", icon: "🏫" },
    ] },
    { id: "health", label: "Эрүүл мэндийн үйлчилгээ", fields: [{ id: "hospitals", label: "Эмнэлэг", color: "#a855f7", icon: "🏥" }] },
  ];

  const baseLayers = () => {
    const s = UB.store.settings();
    const layers = {
      esri: ["Esri гудамжны зураг", () => L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "Tiles &copy; Esri" })],
      osm: ["OpenStreetMap", () => L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, referrerPolicy: "strict-origin-when-cross-origin", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' })],
      sat: ["Хиймэл дагуулын зураг", () => L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "Tiles &copy; Esri" })],
    };
    if (s.cartoKey) {
      layers.carto = ["CARTO Voyager", () => L.tileLayer(`https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${encodeURIComponent(s.cartoKey)}`, { maxZoom: 20, attribution: "&copy; OpenStreetMap contributors &copy; CARTO" })];
    }
    const built = {};
    Object.entries(layers).forEach(([k, [label, make]]) => (built[k] = { label, layer: make() }));
    return { built, chosen: built[s.baseMap] ? s.baseMap : "esri" };
  };

  const pinIcon = (color, big) =>
    L.divIcon({
      className: "",
      html: `<span class="pin${big ? " pin-big" : ""}" style="background:${color}"></span>`,
      iconSize: big ? [24, 24] : [18, 18],
      iconAnchor: big ? [12, 12] : [9, 9],
    });

  const popupHtml = (item) => `
    <div style="min-width:180px">
      <div style="font-weight:700;margin-bottom:4px">${UB.esc(item.title)}</div>
      <div style="color:#64748b;margin-bottom:6px">${item.price ? UB.short(item.price) : ""}${item.area ? ` · ${item.area} м²` : ""}</div>
      <a href="#/property/${encodeURIComponent(item.id)}">Дэлгэрэнгүй →</a>
    </div>`;

  const create = (host, opts = {}) => {
    const withPanel = opts.panel !== false;
    host.innerHTML = `<div class="map"></div>${withPanel ? `<button class="layer-btn" type="button" aria-label="Давхаргууд" title="Давхаргууд">🗂️</button><div class="layer-panel${opts.panelOpen ? "" : " closed"}"></div>` : ""}`;
    const map = L.map(host.querySelector(".map"), { zoomControl: false }).setView(opts.center || UB_CENTER, opts.zoom || 12);
    L.control.zoom({ position: "topright" }).addTo(map);
    const { built, chosen } = baseLayers();
    built[chosen].layer.addTo(map);
    const named = {};
    Object.values(built).forEach((b) => (named[b.label] = b.layer));
    L.control.layers(named, null, { position: "topright" }).addTo(map);
    map.on("baselayerchange", (e) => {
      const key = Object.keys(built).find((k) => built[k].layer === e.layer);
      if (key) UB.store.saveSettings({ baseMap: key });
    });

    const active = new Set(["risk-low", "risk-medium", "risk-high", "flood", "kindergartens", "schools", "hospitals"]);
    const expanded = new Set(GROUPS.map((g) => g.id));
    const overlay = { flood: null, schools: null, kindergartens: null, hospitals: null };
    const markers = L.layerGroup().addTo(map);
    let items = opts.items || [];
    let highlightId = opts.highlightId || null;
    let byId = {};
    let note = "";
    let alive = true;

    const renderMarkers = () => {
      markers.clearLayers();
      byId = {};
      items.forEach((item) => {
        if (!item.lat || !item.lng) return;
        const level = item.riskLevel || "low";
        if (!active.has(`risk-${level}`)) return;
        const big = highlightId === item.id;
        const m = L.marker([item.lat, item.lng], { icon: pinIcon(RISK_COLORS[level], big), zIndexOffset: big ? 1000 : 0 });
        m.bindPopup(popupHtml(item));
        m.on("click", () => opts.onSelect && opts.onSelect(item.id));
        m.addTo(markers);
        byId[item.id] = m;
      });
    };

    const syncOverlays = () => {
      Object.entries(overlay).forEach(([key, layer]) => {
        if (!layer || layer === EMPTY) return;
        const want = active.has(key);
        if (want && !map.hasLayer(layer)) layer.addTo(map);
        if (!want && map.hasLayer(layer)) map.removeLayer(layer);
      });
    };

    const renderPanel = () => {
      const panel = host.querySelector(".layer-panel");
      if (!panel) return;
      panel.innerHTML =
        GROUPS.map((g) => {
          const open = expanded.has(g.id);
          const fields = open
            ? g.fields
                .map((f) => {
                  const disabled = overlay[f.id] === EMPTY;
                  const on = active.has(f.id) && !disabled;
                  return `<button class="layer-item" type="button" data-field="${f.id}"${disabled ? ' disabled title="Эх сурвалжаас мэдээлэл ирээгүй"' : ""}>
                    <span class="layer-icon" style="background:${f.color}22">${f.icon}</span>
                    <span class="grow">${f.label}${disabled ? ' <span class="xxs faint">(мэдээлэлгүй)</span>' : ""}</span>
                    <span class="layer-dot" style="${on ? `border-color:${f.color};background:${f.color}` : ""}"></span>
                  </button>`;
                })
                .join("")
            : "";
          return `<div class="layer-group"><button class="layer-group-head" type="button" data-group="${g.id}"><span>${g.label}</span><span>${open ? "▴" : "▾"}</span></button>${fields}</div>`;
        }).join("") + (note ? `<div class="layer-note">${note}</div>` : "");
    };

    if (withPanel) {
      const panel = host.querySelector(".layer-panel");
      host.querySelector(".layer-btn").addEventListener("click", () => panel.classList.toggle("closed"));
      panel.addEventListener("click", (e) => {
        const g = e.target.closest("[data-group]");
        const f = e.target.closest("[data-field]");
        if (g) {
          expanded.has(g.dataset.group) ? expanded.delete(g.dataset.group) : expanded.add(g.dataset.group);
        } else if (f && !f.disabled) {
          active.has(f.dataset.field) ? active.delete(f.dataset.field) : active.add(f.dataset.field);
          renderMarkers();
          syncOverlays();
        }
        renderPanel();
      });
    }

    if (opts.overlays !== false) {
      UB.data
        .ensureFlood()
        .then((fc) => {
          if (!alive) return;
          overlay.flood = L.geoJSON(fc, {
            renderer: L.canvas({ padding: 0.5 }),
            style: { color: "#ef4444", weight: 1, fillColor: "#ef4444", fillOpacity: 0.3 },
            onEachFeature: (f, layer) => layer.bindPopup(`<b>🌊 Үерийн эрсдэлтэй бүс</b>${f.properties && f.properties.year ? `<br>Тогтоосон он: ${f.properties.year}` : ""}`),
          });
          note = `Эх сурвалж: manaikhoroo.ub.gov.mn (${UB.fmtDate(UB.data.meta.floodDate)})`;
          syncOverlays();
          markers.eachLayer((m) => m.setZIndexOffset(m.options.zIndexOffset || 0));
          renderPanel();
          if (opts.onOverlays) opts.onOverlays();
        })
        .catch(() => UB.toast("Үерийн бүсийн давхаргыг ачаалж чадсангүй.", "err"));
      UB.data
        .ensurePlaces()
        .then((places) => {
          if (!alive) return;
          const pointLayer = (arr, color, label) =>
            arr && arr.length
              ? L.layerGroup(arr.map((p) => L.circleMarker([p.lat, p.lng], { radius: 5, fillColor: color, color: "#fff", weight: 1.5, fillOpacity: 0.9 }).bindPopup(`<b>${UB.esc(p.n)}</b><br><span style="color:#64748b">${label}${p.a ? ` · ${UB.esc(p.a)}` : ""}</span>`)))
              : EMPTY;
          overlay.schools = pointLayer(places.schools, "#3b82f6", "Сургууль");
          overlay.kindergartens = pointLayer(places.kindergartens, "#eab308", "Цэцэрлэг");
          overlay.hospitals = pointLayer(places.hospitals, "#a855f7", "Эмнэлэг");
          syncOverlays();
          renderPanel();
          if (opts.onOverlays) opts.onOverlays();
        })
        .catch(() => UB.toast("Сургууль, цэцэрлэгийн давхаргыг ачаалж чадсангүй.", "err"));
    }

    renderMarkers();
    renderPanel();
    setTimeout(() => alive && map.invalidateSize(), 80);

    return {
      map,
      setItems(next, hl) {
        items = next || [];
        if (hl !== undefined) highlightId = hl;
        renderMarkers();
      },
      focus(id) {
        const m = byId[id];
        if (!m) return;
        map.setView(m.getLatLng(), Math.max(map.getZoom(), 15), { animate: true });
        m.openPopup();
      },
      fit() {
        const pts = items.filter((i) => i.lat && i.lng).map((i) => [i.lat, i.lng]);
        if (pts.length > 1) map.fitBounds(pts, { padding: [30, 30], maxZoom: 15 });
        else if (pts.length === 1) map.setView(pts[0], 15);
      },
      resize() {
        map.invalidateSize();
      },
      destroy() {
        alive = false;
        map.remove();
      },
    };
  };

  UB.map = { create, RISK_COLORS, UB_CENTER };
})();
