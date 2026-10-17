(function () {
  const UB = window.UB;
  const RAW = (window.UB_DATA = window.UB_DATA || {});
  const loading = {};

  const loadScript = (name) => {
    if (RAW[name]) return Promise.resolve(RAW[name]);
    if (loading[name]) return loading[name];
    loading[name] = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `data/${name}.js`;
      s.async = true;
      s.onload = () => (RAW[name] ? resolve(RAW[name]) : reject(new Error(`${name} өгөгдөл хоосон байна`)));
      s.onerror = () => {
        delete loading[name];
        reject(new Error(`${name} өгөгдлийг ачаалж чадсангүй`));
      };
      document.head.appendChild(s);
    });
    return loading[name];
  };

  const DISTRICTS = ["Сүхбаатар", "Чингэлтэй", "Баянзүрх", "Баянгол", "Хан-Уул", "Сонгинохайрхан", "Налайх", "Багануур"];
  const DISTRICT_CENTERS = {
    "Сүхбаатар": [47.923, 106.92],
    "Чингэлтэй": [47.93, 106.899],
    "Баянгол": [47.915, 106.865],
    "Хан-Уул": [47.88, 106.9],
    "Баянзүрх": [47.915, 106.975],
    "Сонгинохайрхан": [47.925, 106.79],
  };
  const DISTRICT_WORDS = [
    ["Хан-Уул", ["худ", "hud", "хан-уул", "хан уул", "яармаг", "зайсан", "мишээл", "буянт-ухаа", "хүннү", "нисэх"]],
    ["Баянзүрх", ["бзд", "баянзүрх", "13-р хороолол", "15-р хороолол", "амгалан"]],
    ["Сүхбаатар", ["сбд", "сүхбаатар", "1-р хороолол"]],
    ["Чингэлтэй", [" чд ", "чингэлтэй"]],
    ["Баянгол", ["бгд", "баянгол", "4-р хороолол", "10-р хороолол", "энхтайван"]],
    ["Сонгинохайрхан", ["схд", "сонгинохайрхан", "толгойт"]],
    ["Налайх", ["налайх"]],
    ["Багануур", ["багануур"]],
  ];

  const KX = Math.cos((47.92 * Math.PI) / 180) * 111320;
  const KY = 110574;
  const toXY = (lng, lat) => [lng * KX, lat * KY];
  const dist = (a, b) => Math.hypot((a.lng - b.lng) * KX, (a.lat - b.lat) * KY);

  const guessDistrict = (text, lat, lng) => {
    const t = ` ${UB.normalize(text)} `;
    for (const [name, words] of DISTRICT_WORDS) if (words.some((w) => t.includes(w))) return name;
    if (lat && lng) {
      let best = null;
      Object.entries(DISTRICT_CENTERS).forEach(([name, c]) => {
        const d = dist({ lat, lng }, { lat: c[0], lng: c[1] });
        if (!best || d < best[1]) best = [name, d];
      });
      return best[0];
    }
    return "Тодорхойгүй";
  };

  const meta = (RAW.properties && RAW.properties.meta) || {};
  const listings = ((RAW.properties && RAW.properties.items) || []).map((p) => ({ ...p, kind: "property", perM2: UB.perM2(p.price, p.area) }));

  const median = (arr) => {
    const v = arr.filter((x) => x > 0).sort((a, b) => a - b);
    if (!v.length) return 0;
    const m = Math.floor(v.length / 2);
    return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
  };

  const cityMedian = median(listings.map((p) => p.perM2));
  const districtMedian = {};
  DISTRICTS.forEach((d) => (districtMedian[d] = median(listings.filter((p) => p.district === d).map((p) => p.perM2))));

  const ringContains = (ring, x, y) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  const segDist = (px, py, ax, ay, bx, by) => {
    const dx = bx - ax, dy = by - ay;
    const len = dx * dx + dy * dy;
    let t = len ? ((px - ax) * dx + (py - ay) * dy) / len : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  };

  let floodIndex = null;
  const buildFloodIndex = (fc) => {
    floodIndex = [];
    (fc.features || []).forEach((f) => {
      const g = f.geometry;
      const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
      polys.forEach((poly) => {
        const rings = poly.map((ring) => ring.map(([lng, lat]) => toXY(lng, lat)));
        let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
        rings[0].forEach(([x, y]) => {
          minx = Math.min(minx, x);
          miny = Math.min(miny, y);
          maxx = Math.max(maxx, x);
          maxy = Math.max(maxy, y);
        });
        floodIndex.push({ rings, box: [minx, miny, maxx, maxy], year: f.properties && f.properties.year });
      });
    });
  };

  const floodDistance = (lat, lng) => {
    if (!floodIndex) return null;
    const [x, y] = toXY(lng, lat);
    let best = Infinity;
    for (const p of floodIndex) {
      const [minx, miny, maxx, maxy] = p.box;
      const boxD = Math.hypot(Math.max(minx - x, 0, x - maxx), Math.max(miny - y, 0, y - maxy));
      if (boxD > best) continue;
      if (boxD === 0 && ringContains(p.rings[0], x, y) && !p.rings.slice(1).some((h) => ringContains(h, x, y))) return 0;
      for (const ring of p.rings) {
        for (let i = 1; i < ring.length; i++) {
          const d = segDist(x, y, ring[i - 1][0], ring[i - 1][1], ring[i][0], ring[i][1]);
          if (d < best) best = d;
        }
      }
    }
    return Math.round(best);
  };

  const nearbyPlaces = (lat, lng) => {
    const places = RAW.places;
    if (!places) return null;
    const scan = (arr) => {
      let count = 0, best = null;
      (arr || []).forEach((pt) => {
        const d = dist({ lat, lng }, pt);
        if (d <= 1000) count++;
        if (!best || d < best[1]) best = [pt.n, Math.round(d)];
      });
      return [count, best];
    };
    const [sc, sb] = scan(places.schools);
    const [kc, kb] = scan(places.kindergartens);
    return { schools1km: sc, kinder1km: kc, nearSchool: sb, nearKinder: kb };
  };

  const nearbyListings = (p, radius = 2000) =>
    listings
      .filter((o) => o.id !== p.id && o.area > 0 && o.price > 0)
      .map((o) => ({ ...o, distance: dist(p, o) }))
      .filter((o) => o.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

  const priceAnalysis = (p) => {
    const perM2 = UB.perM2(p.price, p.area);
    const near = p.lat && p.lng ? nearbyListings(p) : [];
    const nearMedian = near.length >= 3 ? median(near.map((o) => o.perM2)) : 0;
    const district = p.district || guessDistrict(`${p.title} ${p.address || ""}`, p.lat, p.lng);
    const distMedian = districtMedian[district] || 0;
    const reference = nearMedian || distMedian || cityMedian;
    const referenceLabel = nearMedian ? `Ойролцоох 2 км доторх ${near.length} байр` : distMedian ? `${district} дүүрэг` : "Улаанбаатар хот";
    const pool = p.lat && p.lng ? listings.filter((o) => o.id !== p.id).map((o) => ({ ...o, distance: dist(p, o) })) : listings.filter((o) => o.district === district && o.id !== p.id).map((o) => ({ ...o, distance: null }));
    const comparables = pool
      .filter((o) => !p.rooms || !o.rooms || Math.abs(o.rooms - p.rooms) <= 1)
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
      .slice(0, 5);
    const diff = reference && perM2 ? ((perM2 - reference) / reference) * 100 : null;
    return {
      perM2,
      reference,
      referenceLabel,
      cityMedian,
      district,
      districtMedian: distMedian,
      diff,
      comparables,
      distribution: listings.filter((o) => o.district === district && o.perM2 > 0).map((o) => ({ id: o.id, perM2: o.perM2 })),
      updatedAt: meta.listingsDate,
    };
  };

  const scoreFrom = (factors) => {
    const scores = factors.map((f) => f.score).filter((s) => s > 0).sort((a, b) => b - a);
    if (!scores.length) return 0;
    if (scores.length === 1) return scores[0];
    const rest = scores.slice(1);
    return Math.min(100, Math.round(scores[0] * 0.6 + (rest.reduce((a, b) => a + b, 0) / rest.length) * 0.4));
  };
  const levelFrom = (score) => (score >= 60 ? "high" : score >= 35 ? "medium" : "low");

  const riskFor = (p) => {
    const factors = [];
    const year = new Date().getFullYear();
    const floodDist = p.floodDist ?? (p.lat && p.lng ? floodDistance(p.lat, p.lng) : null);
    const near = p.schools1km !== undefined ? p : p.lat && p.lng ? nearbyPlaces(p.lat, p.lng) : null;

    if (floodDist === null || floodDist === undefined) {
      factors.push({ type: "flood", label: "🌊 Үерийн эрсдэл тодорхойгүй", severity: "info", score: 0, description: "Байршлын координат оруулаагүй тул үерийн бүстэй тулгаж чадсангүй.", source: "manaikhoroo.ub.gov.mn", updatedAt: meta.floodDate });
    } else if (floodDist === 0) {
      factors.push({ type: "flood", label: "🌊 Үерийн эрсдэлтэй бүсэд байрлаж байна", severity: "high", score: 80, description: "Энэ байршил Нийслэлийн үерийн эрсдэлтэй бүсийн зурагт орж байна. Хур борооны улиралд (7–8 сар) үерт автах магадлалтай тул суурь, подвал, ус зайлуулах системийг заавал шалгуулаарай.", source: "manaikhoroo.ub.gov.mn үерийн бүсийн давхарга", updatedAt: meta.floodDate });
    } else if (floodDist <= 150) {
      factors.push({ type: "flood", label: `🌊 Үерийн бүсээс ${floodDist} м зайтай`, severity: "medium", score: 55, description: "Үерийн эрсдэлтэй бүсийн хилтэй маш ойрхон байна. Аадар борооны үед гудамж, зогсоол руу ус орох эрсдэлтэй эсэхийг оршин суугчдаас асуугаарай.", source: "manaikhoroo.ub.gov.mn үерийн бүсийн давхарга", updatedAt: meta.floodDate });
    } else if (floodDist <= 500) {
      factors.push({ type: "flood", label: `🌊 Үерийн бүсээс ${floodDist} м зайтай`, severity: "low", score: 20, description: "Үерийн бүсээс тодорхой зайтай ч ойр орчимд үерийн эрсдэлтэй газар бий.", source: "manaikhoroo.ub.gov.mn үерийн бүсийн давхарга", updatedAt: meta.floodDate });
    } else {
      factors.push({ type: "flood", label: `🌊 Үерийн бүсээс хол (${(floodDist / 1000).toFixed(1)} км)`, severity: "low", score: 0, description: "Мэдэгдэж буй үерийн эрсдэлтэй бүсээс хол байна.", source: "manaikhoroo.ub.gov.mn үерийн бүсийн давхарга", updatedAt: meta.floodDate });
    }

    if (p.stage && p.stage !== "Ашиглалтад орсон") {
      factors.push({ type: "permit", label: "⏳ Ашиглалтад хүлээн аваагүй", severity: "medium", score: 60, description: "Барилга албан ёсоор ашиглалтад хүлээн авагдаагүй байна. Инженерийн шугам сүлжээ, нийтийн үйлчилгээ холбогдоогүй байж болно.", source: "Зарын мэдээлэл", updatedAt: meta.listingsDate });
    }
    if (p.builtYear && p.builtYear > year) {
      factors.push({ type: "permit", label: `🏗️ ${p.builtYear} онд ашиглалтад орно гэсэн`, severity: "medium", score: 50, description: "Барилга дуусаагүй байна. Урьдчилгаа төлөхөөс өмнө барилгын зөвшөөрөл, компанийн тусгай зөвшөөрлийг заавал шалгаарай.", source: "Зарын мэдээлэл", updatedAt: meta.listingsDate });
    } else if (p.builtYear && year - p.builtYear >= 40) {
      factors.push({ type: "age", label: `🏚️ Хуучин барилга (${p.builtYear} он)`, severity: "medium", score: 45, description: "40-өөс дээш жилийн настай барилга. Угсралт, дулаалга, шугам сүлжээний элэгдэл болон газар хөдлөлтийн тэсвэрийг мэргэжлийн байгууллагаар үнэлүүлээрэй.", source: "Зарын мэдээлэл", updatedAt: meta.listingsDate });
    } else if (p.builtYear && year - p.builtYear >= 25) {
      factors.push({ type: "age", label: `🏢 ${p.builtYear} онд баригдсан`, severity: "low", score: 20, description: "Дунд насны барилга. Их засвар хийгдсэн эсэхийг асуугаарай.", source: "Зарын мэдээлэл", updatedAt: meta.listingsDate });
    }

    if (p.price > 0 && p.area > 0) {
      const pa = priceAnalysis(p);
      if (pa.diff !== null && pa.diff <= -40) {
        factors.push({ type: "price", label: `💸 Хэт хямд үнэ (${Math.abs(pa.diff).toFixed(0)}% доогуур)`, severity: "medium", score: 55, description: `м² үнэ нь ${pa.referenceLabel.toLowerCase()}-ийн дунджаас ${Math.abs(pa.diff).toFixed(0)}% бага байна. Зах зээлээс хэт хямд үнэ нь луйврын түгээмэл шинж тул гэрчилгээ, өмчлөгчийг заавал шалгаарай.`, source: "unegui.mn зарын дундаж", updatedAt: meta.listingsDate });
      } else if (pa.diff !== null && pa.diff >= 60) {
        factors.push({ type: "price", label: `📈 Үнэ ${pa.diff.toFixed(0)}% өндөр`, severity: "medium", score: 35, description: `м² үнэ нь ${pa.referenceLabel.toLowerCase()}-ийн дунджаас мэдэгдэхүйц өндөр байна. Хэт үнэлэгдсэн байж болзошгүй.`, source: "unegui.mn зарын дундаж", updatedAt: meta.listingsDate });
      }
    }

    factors.push({ type: "developer", label: "🏢 Барилгын компани тодорхойгүй", severity: "info", score: 0, description: "Зард барилгын компанийн нэр байхгүй. Компанийн нэрийг асууж, «Хар жагсаалт» хэсгээс тусгай зөвшөөрөл нь хүчинтэй эсэхийг шалгаарай.", source: "БХБЯ тусгай зөвшөөрлийн жагсаалт", updatedAt: meta.licensesDate, link: "#/blacklist" });

    if (near) {
      const parts = [];
      if (near.nearSchool) parts.push(`хамгийн ойр сургууль: ${near.nearSchool[0]} (${near.nearSchool[1]} м)`);
      if (near.nearKinder) parts.push(`хамгийн ойр цэцэрлэг: ${near.nearKinder[0]} (${near.nearKinder[1]} м)`);
      factors.push({ type: "amenity", label: `🏫 1 км-т ${near.schools1km} сургууль, ${near.kinder1km} цэцэрлэг`, severity: "info", score: 0, description: parts.join("; ") || "Ойролцоо сургууль, цэцэрлэгийн мэдээлэл олдсонгүй.", source: "manaikhoroo.ub.gov.mn", updatedAt: meta.placesDate });
    }

    const score = scoreFrom(factors);
    const level = levelFrom(score);
    let summary;
    const serious = factors.filter((f) => f.score >= 45);
    if (!serious.length) summary = "Бидний мэдээллийн санд энэ байранд ноцтой эрсдэл илрээгүй. Гэхдээ гэрчилгээ, өмчлөгчийг шалгаж, мэргэжлийн үнэлгээ авахыг зөвлөж байна.";
    else summary = `${serious.length} анхаарах эрсдэл илэрлээ. Худалдан авах, түрээслэхээсээ өмнө мэргэжлийн үнэлгээ авахыг зөвлөж байна.`;
    return { score, level, items: factors, summary, updatedAt: meta.floodDate };
  };

  const enriched = listings.map((p) => {
    const r = riskFor(p);
    return { ...p, riskScore: r.score, riskLevel: r.level };
  });

  const adToItem = (ad) => ({
    id: ad.id,
    kind: "ad",
    title: ad.title,
    address: ad.address,
    description: ad.description,
    price: Number(ad.price) || 0,
    area: Number(ad.area) || 0,
    rooms: Number(ad.rooms) || 0,
    lat: ad.lat ? Number(ad.lat) : null,
    lng: ad.lng ? Number(ad.lng) : null,
    district: guessDistrict(`${ad.title} ${ad.address}`, ad.lat ? Number(ad.lat) : null, ad.lng ? Number(ad.lng) : null),
    photo: ad.photo || null,
    propertyType: ad.propertyType,
    phone: ad.phone || "",
    status: ad.status,
    createdAt: ad.createdAt,
    userId: ad.userId,
    perM2: UB.perM2(Number(ad.price) || 0, Number(ad.area) || 0),
  });

  let licenseRows = null;
  const prepLicenses = () => {
    if (licenseRows) return licenseRows;
    const L = RAW.licenses;
    if (!L) return null;
    licenseRows = L.rows.map(([name, reg, kind, from, to]) => ({
      name,
      reg,
      kind: L.kinds[kind][0],
      source: L.kinds[kind][1],
      from,
      to,
      norm: normCompany(name),
    }));
    return licenseRows;
  };
  const SUFFIXES = [" ххк", " хк", " ххн", " llc", " ltd", " co", " corp", " inc", " ххаа", " нөхөрлөл", " тббх", " ххзх"];
  const normCompany = (name) => {
    let n = ` ${UB.normalize(name)} `;
    SUFFIXES.forEach((s) => (n = n.split(`${s} `).join(" ")));
    return n.replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
  };
  const isExpired = (row) => !!row.to && row.to < UB.today();

  const checkCompany = (query) => {
    const rows = prepLicenses();
    const q = query.trim();
    if (!rows) return { error: "Тусгай зөвшөөрлийн өгөгдөл ачаалагдаагүй байна." };
    const digits = q.replace(/\D/g, "");
    const nq = normCompany(q);
    if (nq.length < 2 && digits.length < 5) return { error: "Хайлтын утга хэт богино байна." };
    const scored = [];
    rows.forEach((r) => {
      let score = 0;
      if (digits.length >= 5 && r.reg && r.reg === digits) score = 1.2;
      else if (nq.length >= 2 && (r.norm === nq)) score = 1.1;
      else if (nq.length >= 3 && (r.norm.includes(nq) || (r.norm.length >= 4 && nq.includes(r.norm)))) score = 1;
      else if (nq.length >= 4) {
        const s = UB.similarity(nq, r.norm);
        if (s >= 0.75) score = s;
      }
      if (score) scored.push({ ...r, score, expired: isExpired(r) });
    });
    scored.sort((a, b) => b.score - a.score || (a.expired === b.expired ? 0 : a.expired ? 1 : -1));
    const matches = scored.slice(0, 6);
    if (!matches.length) return { found: false, query: q, matches: [], updatedAt: meta.licensesDate };
    const best = matches[0];
    const validAny = matches.some((m) => m.score >= best.score - 0.001 && !m.expired);
    return {
      found: true,
      query: q,
      best,
      status: validAny ? "valid" : "expired",
      matches,
      updatedAt: meta.licensesDate,
    };
  };

  const suggestCompanies = (query, limit = 8) => {
    const rows = prepLicenses();
    if (!rows) return [];
    const nq = normCompany(query);
    if (nq.length < 2) return [];
    const seen = new Set();
    const out = [];
    rows.forEach((r) => {
      if (seen.has(r.name)) return;
      if (r.norm.includes(nq)) {
        out.push({ name: r.name, score: 1 + nq.length / Math.max(r.norm.length, 1) + (r.norm.startsWith(nq) ? 0.5 : 0) });
        seen.add(r.name);
      } else if (nq.length >= 4) {
        const s = UB.similarity(nq, r.norm);
        if (s > 0.6) {
          out.push({ name: r.name, score: s });
          seen.add(r.name);
        }
      }
    });
    return out.sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.name);
  };

  const licenseStats = () => {
    const rows = prepLicenses();
    if (!rows) return null;
    return { total: rows.length, expired: rows.filter(isExpired).length };
  };

  UB.data = {
    meta,
    DISTRICTS,
    loadScript,
    listings: () => enriched,
    get: (id) => enriched.find((p) => p.id === id) || null,
    ensureFlood: () => loadScript("flood").then((fc) => {
      if (!floodIndex) buildFloodIndex(fc);
      return fc;
    }),
    ensurePlaces: () => loadScript("places"),
    ensureLicenses: () => loadScript("licenses").then(() => prepLicenses()),
    floodDistance,
    nearbyPlaces,
    riskFor,
    priceAnalysis,
    guessDistrict,
    adToItem,
    approvedAds: () => UB.store.ads().filter((a) => a.status === "approved").map(adToItem),
    checkCompany,
    suggestCompanies,
    licenseStats,
    isExpired,
    median,
    cityMedian: () => cityMedian,
    districtMedian: (d) => districtMedian[d] || 0,
    search: ({ q, district, risk, minPrice, maxPrice }) => {
      const nq = UB.normalize(q || "");
      const words = nq.split(" ").filter(Boolean);
      const riskMap = { "Аюулгүй": "low", "Дунд": "medium", "Өндөр": "high" };
      const wantRisk = riskMap[risk] || "";
      const match = (item) => {
        const hay = UB.normalize(`${item.title} ${item.address || ""} ${item.district || ""}`);
        if (words.length && !words.every((w) => hay.includes(w))) return false;
        if (district && district !== "Бүгд" && item.district !== district) return false;
        if (wantRisk && item.riskLevel !== wantRisk) return false;
        if (minPrice && item.price < minPrice) return false;
        if (maxPrice && item.price > maxPrice) return false;
        return true;
      };
      const ads = UB.store
        .ads()
        .filter((a) => a.status === "approved")
        .map(adToItem)
        .map((a) => {
          const r = riskFor(a);
          return { ...a, riskLevel: r.level, riskScore: r.score };
        });
      return [...ads.filter(match), ...enriched.filter(match)];
    },
  };
})();
