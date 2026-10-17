(function () {
  const UB = window.UB;
  const e = UB.esc;
  const ui = UB.ui;

  UB.route("/", () => {
    const listings = UB.data.listings();
    const ads = UB.data.approvedAds();
    const pick = (level) => listings.filter((p) => p.riskLevel === level).sort((a, b) => b.views - a.views)[0];
    const featured = [pick("low"), pick("medium"), pick("high")].filter(Boolean);
    while (featured.length < 3 && listings.length > featured.length) {
      const next = listings.find((p) => !featured.includes(p));
      if (!next) break;
      featured.push(next);
    }
    const nearFlood = listings.filter((p) => p.floodDist <= 150).length;
    return {
      title: "Нүүр",
      html: `
      <section class="hero">
        <div class="orb orb-1"></div><div class="orb orb-2"></div>
        <div class="hero-inner">
          <div class="eyebrow"><span class="dot"></span>AI-д суурилсан үл хөдлөхийн зөвлөгч</div>
          <h1 class="hero-title">Байр авахаасаа өмнө <span class="gradient-text">эрсдэлийг нь тооц.</span></h1>
          <p class="hero-lead">Үерийн бүс, барилгын компанийн тусгай зөвшөөрөл болон зах зээлийн үнийн хөөсийг ганц хайлтаар шалгаж, эрсдэлгүй шийдвэр гаргаарай.</p>
          <form class="search-box" data-search>
            <input type="search" name="q" placeholder="Хаяг, дүүрэг, хотхоны нэрээр хайх..." aria-label="Хайх" autocomplete="off">
            <button class="btn btn-primary" type="submit">Хайх</button>
          </form>
          <div class="ticks"><span>Үнэ + эрсдэл + түүх нэг дор</span><span>Түрээслэгчийн эрх хамгаалалт</span><span>AI зөвлөгчтэй шууд асуулт</span></div>
        </div>
      </section>
      <div class="page" style="padding-top:0">
        <div class="card stats mb32">
          <div class="stat"><div class="num">${listings.length}</div><div class="lbl">Шалгасан байр</div></div>
          <div class="stat"><div class="num blue" data-stat="licenses">…</div><div class="lbl">Тусгай зөвшөөрөл</div></div>
          <div class="stat"><div class="num red">${nearFlood}</div><div class="lbl">Үерийн бүсэд ойр</div></div>
          <div class="stat"><div class="num amber" data-stat="expired">…</div><div class="lbl">Хугацаа дууссан</div></div>
        </div>
        ${ads.length ? `
        <section class="mb32">
          <div class="mb16"><h2 class="h1" style="font-size:26px">Шинэ зарууд</h2><p class="muted mt4">Админ зөвшөөрсөн зарууд энд гарч байна.</p></div>
          <div class="grid g3">${ads.slice(0, 6).map((a) => ui.propertyCard({ ...a, riskLevel: UB.data.riskFor(a).level })).join("")}</div>
        </section>` : ""}
        <section class="mb32">
          <div class="row-between wrap mb16" style="align-items:flex-end">
            <div><h2 class="h1" style="font-size:26px">Онцлох байрууд</h2><p class="muted mt4">Зах зээлд байгаа байрнуудын эрсдэлийн мэдээлэл.</p></div>
            ${ui.fresh(UB.data.meta.listingsDate)}
          </div>
          <div class="grid g3">${featured.map(ui.propertyCard).join("")}</div>
          <div class="center mt16"><a class="btn btn-secondary" href="#/search">Бүх ${listings.length} байрыг харах →</a></div>
        </section>
        <section class="grid g2 mb32">
          <div class="card pad-lg card-amber">
            <div style="font-size:28px" class="mb12">⚠️</div>
            <h3 class="h2 mb8">Компанийн тусгай зөвшөөрөл шалгах</h3>
            <p class="muted mb16">Компанийн нэр эсвэл регистрийн дугаараар хайж барилга угсралт, зураг төслийн тусгай зөвшөөрөл хүчинтэй эсэхийг шалгана уу.</p>
            <a class="btn btn-secondary" href="#/blacklist">Шалгах →</a>
          </div>
          <div class="card pad-lg card-green">
            <div style="font-size:28px" class="mb12">📄</div>
            <h3 class="h2 mb8">Стандарт гэрээ үүсгэх</h3>
            <p class="muted mb16">Иргэний хуулийн 318-р зүйлд нийцсэн, хоёр талын эрх ашгийг хамгаалсан түрээсийн гэрээг хэдхэн минутад бэлдэнэ.</p>
            <a class="btn btn-secondary" href="#/contracts/generate">Үүсгэх →</a>
          </div>
        </section>
      </div>
      <footer class="footer">
        <p>© ${new Date().getFullYear()} УБ Байр. Үл хөдлөх хөрөнгийн эрсдэлийн зөвлөх платформ.</p>
        <p class="xs faint mt4">Өгөгдөл: unegui.mn зарууд · manaikhoroo.ub.gov.mn үерийн бүс, сургууль, цэцэрлэг · БХБЯ тусгай зөвшөөрлийн жагсаалт</p>
      </footer>`,
      mount: (root) => {
        root.querySelector("[data-search]").addEventListener("submit", (ev) => {
          ev.preventDefault();
          const q = new FormData(ev.target).get("q").trim();
          UB.go(`#/search${UB.toQuery({ q })}`);
        });
        UB.data.ensureLicenses().then(() => {
          const s = UB.data.licenseStats();
          const set = (k, v) => {
            const el = root.querySelector(`[data-stat="${k}"]`);
            if (el) el.textContent = v;
          };
          if (s) {
            set("licenses", s.total >= 1000 ? `${(s.total / 1000).toFixed(1)}k` : s.total);
            set("expired", s.expired);
          }
        }).catch(() => {});
      },
    };
  });

  UB.route("/search", (params, query) => {
    const opts = ["Бүгд", ...UB.data.DISTRICTS];
    const state = {
      q: query.q || "",
      district: query.district || "Бүгд",
      risk: query.risk || "Бүгд",
      min: query.min || "",
      max: query.max || "",
      view: "list",
      selected: null,
    };
    return {
      title: "Байр хайх",
      html: `
      <div class="page page-wide">
        <div class="row-between wrap mb16">
          <div><h1 class="h1">Байр хайх</h1><p class="muted small mt4">Үнэ, эрсдэл, ойр орчмын мэдээллийг нэг дор шалгана.</p></div>
          <div class="seg map-toggle" data-seg><button type="button" class="active" data-view="list">📋 Жагсаалт</button><button type="button" data-view="map">🗺️ Газрын зураг</button></div>
        </div>
        <div class="search-layout">
          <div data-left>
            <form class="card pad mb16 stack" data-filters>
              <input class="input" name="q" type="search" placeholder="Хаяг, дүүрэг, хотхоны нэр..." value="${e(state.q)}" autocomplete="off">
              <div class="grid" style="gap:10px;grid-template-columns:repeat(2,minmax(0,1fr))">
                <label class="field"><span class="label">Дүүрэг</span><select class="select" name="district">${opts.map((d) => `<option${d === state.district ? " selected" : ""}>${d}</option>`).join("")}</select></label>
                <label class="field"><span class="label">Эрсдэл</span><select class="select" name="risk">${["Бүгд", "Аюулгүй", "Дунд", "Өндөр"].map((r) => `<option${r === state.risk ? " selected" : ""}>${r}</option>`).join("")}</select></label>
                <label class="field"><span class="label">Доод үнэ (сая ₮)</span><input class="input" name="min" type="number" inputmode="numeric" min="0" value="${e(state.min)}" placeholder="0"></label>
                <label class="field"><span class="label">Дээд үнэ (сая ₮)</span><input class="input" name="max" type="number" inputmode="numeric" min="0" value="${e(state.max)}" placeholder="∞"></label>
              </div>
            </form>
            <div class="row-between mb8"><p class="small muted" data-count></p><button class="btn btn-ghost btn-sm" type="button" data-reset>Шүүлтүүр арилгах</button></div>
            <div class="search-list stack" data-list></div>
          </div>
          <div class="map-wrap map-tall map-mobile-hidden" data-map></div>
        </div>
      </div>`,
      mount: (root) => {
        const form = root.querySelector("[data-filters]");
        const list = root.querySelector("[data-list]");
        const count = root.querySelector("[data-count]");
        const mapHost = root.querySelector("[data-map]");
        const left = root.querySelector("[data-left]");
        let results = [];
        const mapApi = UB.map.create(mapHost, {
          items: [],
          panelOpen: window.matchMedia("(min-width: 1280px)").matches,
          onSelect: (id) => {
            state.selected = id;
            drawList();
            const row = list.querySelector(`[data-id="${CSS.escape(id)}"]`);
            if (row && window.matchMedia("(min-width: 1024px)").matches) row.scrollIntoView({ behavior: "smooth", block: "nearest" });
          },
          onOverlays: () => run(false),
        });
        const drawList = () => {
          count.textContent = `${results.length} үр дүн олдлоо`;
          list.innerHTML = results.length ? results.map((r) => ui.resultRow(r, r.id === state.selected)).join("") : ui.empty("🔍", "Байр олдсонгүй. Шүүлтүүрийг өөрчилнө үү.");
        };
        const run = (fit) => {
          results = UB.data.search({
            q: state.q,
            district: state.district,
            risk: state.risk,
            minPrice: state.min ? Number(state.min) * 1e6 : 0,
            maxPrice: state.max ? Number(state.max) * 1e6 : 0,
          });
          drawList();
          mapApi.setItems(results, state.selected);
          if (fit) mapApi.fit();
          const qs = UB.toQuery({ q: state.q, district: state.district === "Бүгд" ? "" : state.district, risk: state.risk === "Бүгд" ? "" : state.risk, min: state.min, max: state.max });
          history.replaceState(null, "", `#/search${qs}`);
        };
        const read = () => {
          const fd = new FormData(form);
          state.q = fd.get("q").trim();
          state.district = fd.get("district");
          state.risk = fd.get("risk");
          state.min = fd.get("min");
          state.max = fd.get("max");
        };
        const onInput = UB.debounce(() => {
          read();
          run(true);
        }, 250);
        form.addEventListener("input", onInput);
        form.addEventListener("change", onInput);
        form.addEventListener("submit", (ev) => {
          ev.preventDefault();
          read();
          run(true);
          document.activeElement && document.activeElement.blur();
        });
        root.querySelector("[data-reset]").addEventListener("click", () => {
          form.reset();
          form.q.value = "";
          form.min.value = "";
          form.max.value = "";
          form.district.value = "Бүгд";
          form.risk.value = "Бүгд";
          read();
          run(true);
        });
        root.querySelector("[data-seg]").addEventListener("click", (ev) => {
          const b = ev.target.closest("[data-view]");
          if (!b) return;
          state.view = b.dataset.view;
          root.querySelectorAll("[data-view]").forEach((x) => x.classList.toggle("active", x === b));
          const showMap = state.view === "map";
          mapHost.classList.toggle("map-mobile-hidden", !showMap);
          left.classList.toggle("hidden", showMap);
          if (showMap) setTimeout(() => {
            mapApi.resize();
            mapApi.fit();
          }, 50);
        });
        run(true);
        return () => mapApi.destroy();
      },
    };
  });

  const findItem = (id) => {
    const listing = UB.data.get(id);
    if (listing) return listing;
    const ad = UB.store.ads().find((a) => a.id === id);
    if (!ad) return null;
    const user = UB.store.currentUser();
    const canSee = ad.status === "approved" || (user && (user.id === ad.userId || user.isAdmin));
    return canSee ? { ...UB.data.adToItem(ad), raw: ad } : null;
  };

  const distributionChart = (pa, item) => {
    const pts = pa.distribution.map((d) => d.perM2);
    if (pts.length < 3 || !pa.perM2) return `<p class="xs muted">Дүүргийн харьцуулах өгөгдөл хангалтгүй байна.</p>`;
    const all = [...pts, pa.perM2];
    const lo = Math.min(...all) * 0.95;
    const hi = Math.max(...all) * 1.05;
    const W = 400, H = 132, pad = 18;
    const x = (v) => pad + ((v - lo) / (hi - lo)) * (W - pad * 2);
    const med = pa.districtMedian || UB.data.median(pts);
    const ticks = [lo, (lo + hi) / 2, hi];
    return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Дүүргийн м² үнийн тархалт">
      <line x1="${pad}" y1="70" x2="${W - pad}" y2="70" stroke="#e2e8f0" stroke-width="2"/>
      ${pa.distribution.map((d, i) => `<circle cx="${x(d.perM2).toFixed(1)}" cy="${(70 + ((i % 5) - 2) * 6).toFixed(1)}" r="5" fill="${d.id === item.id ? "#2563eb" : "#94a3b8"}" fill-opacity="${d.id === item.id ? 1 : 0.55}"/>`).join("")}
      <line x1="${x(med).toFixed(1)}" y1="30" x2="${x(med).toFixed(1)}" y2="96" stroke="#d97706" stroke-dasharray="4 3" stroke-width="2"/>
      <text x="${x(med).toFixed(1)}" y="24" text-anchor="middle" font-size="13" fill="#92400e">дундаж ${(med / 1e6).toFixed(1)} сая</text>
      <circle cx="${x(pa.perM2).toFixed(1)}" cy="70" r="9" fill="#2563eb" stroke="#fff" stroke-width="3"/>
      <text x="${Math.min(Math.max(x(pa.perM2), 70), W - 70).toFixed(1)}" y="${H - 4}" text-anchor="middle" font-size="13" font-weight="700" fill="#1d4ed8">энэ байр ${(pa.perM2 / 1e6).toFixed(1)} сая</text>
      ${ticks.map((t, i) => `<text x="${x(t).toFixed(1)}" y="${H - 22}" text-anchor="${i === 0 ? "start" : i === 2 ? "end" : "middle"}" font-size="12" fill="#94a3b8">${(t / 1e6).toFixed(1)} сая</text>`).join("")}
    </svg>`;
  };

  const riskTab = (risk) => {
    const color = risk.score < 35 ? "green" : risk.score < 60 ? "amber" : "red";
    const bar = risk.score < 35 ? "#22c55e" : risk.score < 60 ? "#f59e0b" : "#ef4444";
    const sevLabel = { critical: "Маш өндөр", high: "Өндөр", medium: "Дунд", low: "Бага", info: "Мэдээлэл" };
    const sevBadge = { critical: "badge-high", high: "badge-high", medium: "badge-medium", low: "badge-low", info: "badge-blue" };
    return `<div class="stack">
      <div class="row-between"><h2 class="h2">Эрсдэлийн тайлан</h2>${ui.fresh(risk.updatedAt)}</div>
      <div class="card pad">
        <div class="row-between mb12"><span class="small muted">Нийт эрсдэлийн оноо</span><span class="score-num ${color}">${risk.score}/100</span></div>
        <div class="progress"><span style="width:${Math.max(risk.score, 2)}%;background:${bar}"></span></div>
        <p class="small muted mt12">${e(risk.summary)}</p>
      </div>
      ${risk.items.map((it) => `
        <div class="card pad-sm risk-item sev-${it.severity}">
          <div class="row-between row-top mb4"><span class="small semibold">${e(it.label)}</span><span class="badge ${sevBadge[it.severity]}">${sevLabel[it.severity]}</span></div>
          <p class="xs muted">${e(it.description)}${it.link ? ` <a href="${it.link}">Шалгах →</a>` : ""}</p>
          <div class="row-between mt8 xxs faint" style="border-top:1px solid var(--line-soft);padding-top:8px"><span>Эх сурвалж: ${e(it.source || "Тодорхойгүй")}</span>${it.updatedAt ? `<span>🕒 ${UB.fmtDate(it.updatedAt)}</span>` : ""}</div>
        </div>`).join("")}
      <div class="alert alert-info">⚠️ Энэ тайлан нь зөвхөн мэдэгдэл бөгөөд баталгаа биш. Оноог нээлттэй өгөгдөл дээр автоматаар тооцоолсон тул мэргэжлийн үнэлгээ авахыг зөвлөж байна.</div>
    </div>`;
  };

  const priceTab = (item, pa) => {
    if (!pa || !pa.perM2) return ui.empty("📊", "Үнэ эсвэл талбайн мэдээлэл дутуу тул үнийн шинжилгээ хийх боломжгүй.");
    const diff = pa.diff;
    const cls = diff === null ? "alert-info" : Math.abs(diff) < 10 ? "alert-ok" : diff > 0 ? "alert-danger" : "alert-info";
    const msg = diff === null ? "Харьцуулах өгөгдөл хангалтгүй." : Math.abs(diff) < 10 ? `✅ Үнэ орчин тойрныхоо дундажтай ойрхон байна (${diff > 0 ? "+" : ""}${diff.toFixed(0)}%)` : diff > 0 ? `⚠️ Үнэ дунджаас ${diff.toFixed(0)}% өндөр байна. Хэт үнэлэгдсэн байж болзошгүй.` : `ℹ️ Үнэ дунджаас ${Math.abs(diff).toFixed(0)}% бага байна.${diff <= -40 ? " Хэт хямд үнэ нь луйврын шинж байж болох тул гэрчилгээг заавал шалгаарай." : ""}`;
    return `<div class="stack">
      <div class="card pad">
        <h2 class="h2 mb16">Үнийн шинжилгээ</h2>
        <div class="grid g3" style="gap:12px">
          <div><div class="xs muted mb4">Энэ байрны м² үнэ</div><div class="h2">${UB.mln(pa.perM2)}</div></div>
          <div><div class="xs muted mb4">${e(pa.referenceLabel)}</div><div class="h2 muted">${UB.mln(pa.reference)}</div></div>
          <div><div class="xs muted mb4">Улаанбаатарын дундаж</div><div class="h2 muted">${UB.mln(pa.cityMedian)}</div></div>
        </div>
        <div class="alert ${cls} mt16 semibold">${msg}</div>
      </div>
      <div class="card pad">
        <h3 class="small semibold mb12">${e(pa.district)} дүүргийн м² үнийн тархалт</h3>
        ${distributionChart(pa, item)}
        <p class="xxs faint mt8">Саарал цэг бүр нэг зар, шар тасархай шугам нь дундаж үнэ, цэнхэр нь энэ байр.</p>
      </div>
      ${pa.comparables.length ? `<div class="card pad">
        <h3 class="small semibold mb12">Ойролцоо, ижил төстэй байрнуудтай харьцуулалт</h3>
        ${pa.comparables.map((c) => `<a class="row-between" href="#/property/${encodeURIComponent(c.id)}" style="padding:10px 0;border-bottom:1px solid var(--line-soft);color:inherit;text-decoration:none">
          <div class="grow"><div class="small semibold truncate">${e(c.title)}</div><div class="xs faint">${c.area} м² · ${e(c.district)}${c.distance !== null && c.distance !== undefined ? ` · ${c.distance < 1000 ? `${Math.round(c.distance)} м` : `${(c.distance / 1000).toFixed(1)} км`}` : ""}</div></div>
          <div class="right shrink0"><div class="small semibold">${UB.short(c.price)}</div><div class="xs faint">${UB.mln(c.perM2, 2)}/м²</div></div>
        </a>`).join("")}
      </div>` : ""}
      <p class="xs faint center">Өгөгдөл: unegui.mn зарын үнэ · ${UB.fmtDate(pa.updatedAt)}. Зарын үнэ бодит гүйлгээний үнээс ялгаатай байж болно.</p>
    </div>`;
  };

  UB.route("/property/:id", (params) => {
    const item = findItem(params.id);
    if (!item) return { title: "Олдсонгүй", html: `<div class="page page-narrow">${ui.empty("🏚️", "Байр олдсонгүй.", `<a class="btn btn-secondary mt16" href="#/search">← Хайлт руу буцах</a>`)}</div>` };
    UB.current.item = item;
    const isAd = item.kind === "ad";
    const user = UB.store.currentUser();
    const owner = isAd && user && (user.id === item.userId || user.isAdmin);
    const listingRows = [
      ["Ашиглалтад орсон он", item.builtYear || "—"],
      ["Дүүрэг", `${item.district}${item.districtExact ? "" : " (ойролцоогоор)"}`],
      ["Давхар", item.floor ? `${item.floor}/${item.totalFloors || "?"}` : "—"],
      ["Барилгын явц", item.stage || "—"],
      ["Тагт", item.balcony || "—"],
      ["Цахилгаан шат", item.elevator || "—"],
      ["Гараж", item.garage || "—"],
      ["Цонх", item.window || "—"],
      ["Хаалга", item.door || "—"],
      ["Шал", item.floorType || "—"],
      ["Төлбөрийн нөхцөл", item.payment || "—"],
      ["Барилгын компани", "Тодорхойгүй"],
    ];
    const typeLabel = { apartment: "Орон сууц", house: "Хувийн сууц", land: "Газар" };
    const adRows = [
      ["Хаяг", item.address || "—"],
      ["Үнэ", UB.money(item.price)],
      ["Талбай", `${item.area || 0} м²`],
      ["Өрөө", `${item.rooms || 0} өрөө`],
      ["Төрөл", typeLabel[item.propertyType] || item.propertyType || "—"],
      ["Статус", { approved: "Зөвшөөрөгдсөн", pending: "Хүлээгдэж буй", rejected: "Татгалзсан" }[item.status] || item.status],
    ];
    const contractLink = `#/contracts/generate${UB.toQuery({ address: item.address || item.title, rooms: item.rooms || "", area: item.area || "" })}`;
    return {
      title: item.title,
      html: `
      <div class="page page-narrow">
        <a class="small muted" href="#/search">← Хайлт руу буцах</a>
        ${isAd && item.status !== "approved" ? `<div class="alert alert-warn mt12">Энэ зар ${item.status === "pending" ? "админы зөвшөөрөл хүлээж байгаа" : "татгалзсан"} тул зөвхөн та болон админ харж байна.</div>` : ""}
        <div class="rel mt12 mb16">
          ${item.lat && item.lng ? `<div class="map-wrap map-short" data-map></div>` : `<div class="card empty" style="padding:56px 20px">📍 Байршлын мэдээлэлгүй зар</div>`}
          <div style="position:absolute;top:12px;right:56px;z-index:900" data-badge>${ui.riskBadge(item.riskLevel || "low", "lg")}</div>
        </div>
        <div class="row-between row-top mb16">
          <div class="grow"><h1 class="h2" style="font-size:21px">${e(item.title)}</h1><p class="small muted mt4">📍 ${e(item.address || item.district || "")}</p></div>
          <div class="right shrink0"><div class="h2">${e(UB.short(item.price))}</div>${item.perM2 ? `<div class="xs muted">${UB.mln(item.perM2, 2)}/м²</div>` : ""}</div>
        </div>
        <div class="grid g3 mb16" style="grid-template-columns:repeat(3,minmax(0,1fr));gap:10px">
          <div class="card pad-sm center"><div class="small semibold">${item.area || "?"} м²</div><div class="xs muted">Талбай</div></div>
          <div class="card pad-sm center"><div class="small semibold">${item.rooms || "?"} өрөө</div><div class="xs muted">Өрөө</div></div>
          <div class="card pad-sm center"><div class="small semibold">${isAd ? e(typeLabel[item.propertyType] || "Зар") : item.floor ? `${item.floor}/${item.totalFloors}` : "—"}</div><div class="xs muted">${isAd ? "Төрөл" : "Давхар"}</div></div>
        </div>
        <div class="tabs mb16" data-tabs>
          <button class="tab active" type="button" data-tab="overview">Дэлгэрэнгүй</button>
          <button class="tab" type="button" data-tab="risk">🛡 Эрсдэл</button>
          <button class="tab" type="button" data-tab="price">📊 Үнэ</button>
          <button class="tab" type="button" data-tab="advisor">🤖 AI</button>
        </div>
        <div data-pane="overview" class="card pad stack">
          ${item.photo ? `<img src="${e(item.photo)}" alt="${e(item.title)}" data-zoom style="width:100%;max-height:340px;object-fit:cover;border-radius:14px;cursor:zoom-in">` : ""}
          <div><h2 class="h3 mb8">${isAd ? "Зарын тухай" : "Байрны тухай"}</h2><p class="small muted">${isAd ? e(item.description || "") : `unegui.mn сайтад ${item.views ? `${item.views} удаа үзэгдсэн ` : ""}зар. Дэлгэрэнгүй мэдээлэл, зургийг эх зар дээрээс харна уу.`}</p></div>
          ${isAd ? `<div class="alert alert-info"><b>🏠 Түрээслэх, худалдах зар</b><br>Гэрээ байгуулахаасаа өмнө гэрчилгээ, өмчлөгчийн мэдээллийг шалгаж, <a href="#/contracts/checklist">чек-лист</a>-ээ бөглөөрэй.</div>` : ""}
          <div class="kv">${(isAd ? adRows : listingRows).map(([k, v]) => `<div><div class="k">${k}</div><div class="v">${e(v)}</div></div>`).join("")}</div>
        </div>
        <div data-pane="risk" class="hidden"></div>
        <div data-pane="price" class="hidden"></div>
        <div data-pane="advisor" class="hidden"><div class="card chat advisor" data-advisor></div></div>
        <div class="grid g2 mt16" style="gap:10px">
          <a class="btn btn-primary" href="${contractLink}">📄 Түрээсийн гэрээ үүсгэх</a>
          ${isAd ? (item.phone ? `<a class="btn btn-secondary" href="tel:${e(item.phone)}">📞 ${e(item.phone)}</a>` : `<button class="btn btn-secondary" type="button" data-contact>📞 Холбоо барих</button>`) : `<a class="btn btn-secondary" href="${e(item.url)}" target="_blank" rel="noopener">🔗 Эх зарыг unegui.mn-ээс үзэх</a>`}
        </div>
        ${owner ? `<div class="row mt12" style="justify-content:flex-end"><button class="btn btn-danger btn-sm" type="button" data-delete>🗑️ Зарыг устгах</button></div>` : ""}
      </div>`,
      mount: (root) => {
        let mapApi = null;
        let risk = UB.data.riskFor(item);
        const panes = {};
        root.querySelectorAll("[data-pane]").forEach((p) => (panes[p.dataset.pane] = p));
        const redrawRisk = () => {
          risk = UB.data.riskFor(item);
          item.riskLevel = risk.level;
          root.querySelector("[data-badge]").innerHTML = ui.riskBadge(risk.level, "lg");
          panes.risk.innerHTML = riskTab(risk);
          if (mapApi) mapApi.setItems([item], item.id);
        };
        redrawRisk();
        panes.price.innerHTML = priceTab(item, item.price && item.area ? UB.data.priceAnalysis(item) : null);
        if (item.lat && item.lng) {
          mapApi = UB.map.create(root.querySelector("[data-map]"), { items: [item], center: [item.lat, item.lng], zoom: 15, highlightId: item.id, onOverlays: () => isAd && redrawRisk() });
        } else if (isAd) {
          Promise.all([UB.data.ensureFlood(), UB.data.ensurePlaces()]).then(redrawRisk).catch(() => {});
        }
        let chatReady = false;
        root.querySelector("[data-tabs]").addEventListener("click", (ev) => {
          const b = ev.target.closest("[data-tab]");
          if (!b) return;
          root.querySelectorAll("[data-tab]").forEach((x) => x.classList.toggle("active", x === b));
          Object.entries(panes).forEach(([k, p]) => p.classList.toggle("hidden", k !== b.dataset.tab));
          if (b.dataset.tab === "advisor" && !chatReady) {
            chatReady = true;
            UB.ui.chat(root.querySelector("[data-advisor]"), {
              greeting: `Сайн байна уу! Би таны **${item.title}** байрыг сонгоход туслах зөвлөгч. Эрсдэлийн оноо: **${risk.score}/100**.\n\nЯмар асуулт байна вэ?\n\n${UB.advisor.DISCLAIMER}`,
              chips: ["Энэ байрны үерийн эрсдэл хэр их вэ?", "Үнэ нь хэвийн үү?", "Гэрээнд ямар заалт оруулах вэ?", "Ойролцоо сургууль бий юу?"],
              context: () => UB.advisor.contextFor(item),
            });
          }
        });
        const contact = root.querySelector("[data-contact]");
        if (contact) contact.addEventListener("click", () => UB.toast("Зар оруулагч утасны дугаараа оруулаагүй байна."));
        const del = root.querySelector("[data-delete]");
        if (del) del.addEventListener("click", () => {
          if (!confirm("Энэ зарыг устгах уу?")) return;
          UB.store.deleteAd(item.id);
          UB.toast("Зар устгагдлаа.", "ok");
          UB.go("#/ads");
        });
        return () => mapApi && mapApi.destroy();
      },
    };
  });
})();
