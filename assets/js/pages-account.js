(function () {
  const UB = window.UB;
  const e = UB.esc;
  const ui = UB.ui;

  const safeNext = (next, fallback) => (next && next.startsWith("/") && !next.startsWith("//") ? `#${next}` : fallback);

  const authPage = (mode, query) => {
    const isLogin = mode === "login";
    return {
      title: isLogin ? "Нэвтрэх" : "Бүртгүүлэх",
      html: `
      <div class="page" style="max-width:460px">
        <div class="card pad-lg mt24">
          <h1 class="h1 mb4">${isLogin ? "Нэвтрэх" : "Бүртгүүлэх"}</h1>
          <p class="small muted mb24">${isLogin ? "Зар оруулах, гэрээгээ хадгалахын тулд нэвтэрнэ үү." : "Шинэ бүртгэл үүсгэж зар оруулах, гэрээгээ хянах боломжтой."}</p>
          <form class="stack" data-form novalidate>
            ${isLogin ? "" : `<label class="field"><span class="label">Нэр</span><input class="input" name="name" autocomplete="name" placeholder="Таны нэр"></label>`}
            <label class="field"><span class="label">И-мэйл</span><input class="input" name="email" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com" required></label>
            <label class="field"><span class="label">Нууц үг</span><input class="input" name="password" type="password" autocomplete="${isLogin ? "current-password" : "new-password"}" placeholder="••••••" required></label>
            ${isLogin ? "" : `<label class="field"><span class="label">Нууц үг давтах</span><input class="input" name="password2" type="password" autocomplete="new-password" placeholder="••••••" required></label>`}
            <div data-err></div>
            <button class="btn btn-primary btn-block" type="submit">${isLogin ? "Нэвтрэх" : "Бүртгүүлэх"}</button>
          </form>
          <p class="small muted center mt16">${isLogin ? `Бүртгэлгүй юу? <a href="#/register${UB.toQuery({ next: query.next })}">Бүртгүүлэх</a>` : `Бүртгэлтэй юу? <a href="#/login${UB.toQuery({ next: query.next })}">Нэвтрэх</a>`}</p>
        </div>
        ${isLogin ? `<div class="alert alert-info mt16"><b>Демо админ эрх:</b> ${e(UB.store.ADMIN_EMAIL)} / ${e(UB.store.ADMIN_PASSWORD)}<br><span class="xs">Админаар нэвтэрч зар зөвшөөрөх үйл явцыг туршина.</span></div>` : ""}
        <p class="xs faint center mt16">Энэ хувилбарт бүртгэл зөвхөн таны browser-т хадгалагдана. Өөр төхөөрөмж дээр дахин бүртгүүлэх шаардлагатай.</p>
      </div>`,
      mount: (root) => {
        const form = root.querySelector("[data-form]");
        const err = root.querySelector("[data-err]");
        form.addEventListener("submit", (ev) => {
          ev.preventDefault();
          const fd = new FormData(form);
          try {
            let user;
            if (isLogin) user = UB.store.login({ email: fd.get("email"), password: fd.get("password") });
            else {
              if (fd.get("password") !== fd.get("password2")) throw new Error("Нууц үг таарахгүй байна.");
              user = UB.store.register({ email: fd.get("email"), password: fd.get("password"), name: fd.get("name") });
            }
            UB.toast(`Тавтай морил, ${user.name || user.email}!`, "ok");
            UB.go(safeNext(query.next, user.isAdmin ? "#/admin" : "#/ads"));
          } catch (ex) {
            err.innerHTML = `<div class="alert alert-danger">${e(ex.message)}</div>`;
          }
        });
      },
    };
  };
  UB.route("/login", (p, q) => authPage("login", q));
  UB.route("/register", (p, q) => authPage("register", q));

  const STATUS = {
    pending: ["Хүлээгдэж буй", "badge-amber"],
    approved: ["Зөвшөөрөгдсөн", "badge-green"],
    rejected: ["Татгалзсан", "badge-red"],
  };
  const TYPES = { apartment: "Орон сууц", house: "Хувийн сууц", land: "Газар" };

  UB.route("/ads", () => {
    const user = UB.store.currentUser();
    if (!user) return { title: "Миний зар", html: ui.needLogin("/ads") };
    const ads = UB.store.ads().filter((a) => a.userId === user.id);
    return {
      title: "Миний зар",
      html: `
      <div class="page page-narrow">
        <div class="row-between wrap mb16"><div><h1 class="h1">Миний зар</h1><p class="small muted mt4">Таны оруулсан зар, зөвшөөрөл болон статус.</p></div><a class="btn btn-primary" href="#/ads/new">+ Шинэ зар оруулах</a></div>
        <div class="stack">${ads.length ? ads.map((a) => `
          <div class="card pad">
            <div class="row-between row-top wrap">
              <div class="grow"><a class="h3" href="#/property/${e(a.id)}" style="color:var(--text)">${e(a.title)}</a><p class="small muted mt4">${e(a.address)}</p></div>
              <div class="right small muted"><div>${e(UB.short(a.price))}</div><div>${a.rooms} өрөө · ${a.area} м²</div></div>
            </div>
            ${a.photo ? `<img src="${e(a.photo)}" alt="${e(a.title)}" data-zoom style="width:100%;height:200px;object-fit:cover;border-radius:14px;margin-top:12px;cursor:zoom-in">` : ""}
            <div class="row wrap mt12 small"><span class="badge ${STATUS[a.status][1]}">${STATUS[a.status][0]}</span>${a.adminComment ? `<span class="muted">Админы тайлбар: ${e(a.adminComment)}</span>` : ""}<span class="faint">${UB.fmtDate(a.createdAt)}</span><span class="grow"></span><button class="btn btn-ghost btn-sm" type="button" data-del="${e(a.id)}" style="color:var(--red)">Устгах</button></div>
          </div>`).join("") : ui.empty("📣", "Та одоогоор зар оруулаагүй байна.", `<a class="btn btn-primary mt16" href="#/ads/new">Анхны зараа оруулах</a>`)}</div>
      </div>`,
      mount: (root) =>
        root.addEventListener("click", (ev) => {
          const b = ev.target.closest("[data-del]");
          if (!b || !confirm("Энэ зарыг устгах уу?")) return;
          UB.store.deleteAd(b.dataset.del);
          UB.toast("Зар устгагдлаа.");
          UB.go("#/ads");
        }),
    };
  });

  UB.route("/ads/new", () => {
    const user = UB.store.currentUser();
    if (!user) return { title: "Зар оруулах", html: ui.needLogin("/ads/new") };
    return {
      title: "Зар оруулах",
      html: `
      <div class="page page-narrow">
        <div class="card pad-lg">
          <h1 class="h1 mb4">Зар оруулах</h1>
          <p class="small muted mb24">Байрныхаа мэдээллийг оруулаад админ зөвшөөрөхийг хүлээнэ.</p>
          <form class="stack" data-form novalidate>
            <label class="field"><span class="label">Гарчиг *</span><input class="input" name="title" required placeholder="Жишээ: Хан-Уул, 2 өрөө байр түрээслүүлнэ"></label>
            <label class="field"><span class="label">Тайлбар *</span><textarea class="textarea" name="description" required placeholder="Байрны онцлог, нөхцөл..."></textarea></label>
            <label class="field"><span class="label">Хаяг *</span><input class="input" name="address" required placeholder="Хан-Уул дүүрэг, 15-р хороо, ... байр"></label>
            <div class="grid g3" style="gap:12px">
              <label class="field"><span class="label">Үнэ (₮) *</span><input class="input" name="price" type="number" inputmode="numeric" min="0" required placeholder="250000000"></label>
              <label class="field"><span class="label">Талбай (м²) *</span><input class="input" name="area" type="number" inputmode="decimal" min="1" step="0.01" required placeholder="56"></label>
              <label class="field"><span class="label">Өрөө *</span><input class="input" name="rooms" type="number" inputmode="numeric" min="1" value="1" required></label>
            </div>
            <div class="grid g2" style="gap:12px">
              <label class="field"><span class="label">Барилгын төрөл</span><select class="select" name="propertyType">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label>
              <label class="field"><span class="label">Холбоо барих утас</span><input class="input" name="phone" type="tel" inputmode="tel" placeholder="9911 2233"></label>
            </div>
            <div class="field"><span class="label">Зураг</span><label class="dropzone" data-drop>📷 Зураг сонгох<input type="file" accept="image/*" hidden data-file></label><div data-preview></div></div>
            <div class="grid g2" style="gap:12px">
              <label class="field"><span class="label">Өргөрөг (latitude)</span><input class="input" name="lat" inputmode="decimal" placeholder="47.9210"></label>
              <label class="field"><span class="label">Уртраг (longitude)</span><input class="input" name="lng" inputmode="decimal" placeholder="106.9186"></label>
            </div>
            <div class="grid g2" style="gap:10px">
              <button class="btn btn-secondary" type="button" data-geo>📍 Миний байршлыг авах</button>
              <button class="btn btn-secondary" type="button" data-pick>🗺️ Газрын зургаас сонгох</button>
            </div>
            <div class="map-wrap hidden" style="height:280px" data-pickmap></div>
            <div data-err></div>
            <button class="btn btn-primary btn-block" type="submit">Зар оруулах</button>
          </form>
        </div>
      </div>`,
      mount: (root) => {
        const form = root.querySelector("[data-form]");
        const err = root.querySelector("[data-err]");
        const showErr = (m) => (err.innerHTML = m ? `<div class="alert alert-danger">${e(m)}</div>` : "");
        let photo = null;
        let pickMap = null;
        let pin = null;
        root.querySelector("[data-file]").addEventListener("change", async (ev) => {
          const f = ev.target.files && ev.target.files[0];
          if (!f) return;
          try {
            photo = await UB.compressImage(f);
            root.querySelector("[data-preview]").innerHTML = `<img src="${photo}" alt="Урьдчилан харах" style="margin-top:8px;max-height:200px;border-radius:12px">`;
          } catch (ex) {
            showErr(ex.message);
          }
        });
        const setLatLng = (lat, lng) => {
          form.lat.value = lat.toFixed(6);
          form.lng.value = lng.toFixed(6);
          if (pickMap) {
            if (pin) pin.setLatLng([lat, lng]);
            else pin = L.marker([lat, lng]).addTo(pickMap.map);
          }
        };
        root.querySelector("[data-geo]").addEventListener("click", () => {
          if (!navigator.geolocation) return showErr("Таны browser байршлыг дэмждэггүй.");
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setLatLng(pos.coords.latitude, pos.coords.longitude);
              showErr("");
              UB.toast("Байршил авлаа.", "ok");
            },
            () => showErr("Байршлыг олж чадсангүй. Газрын зургаас сонгоно уу."),
            { timeout: 10000 }
          );
        });
        root.querySelector("[data-pick]").addEventListener("click", () => {
          const host = root.querySelector("[data-pickmap]");
          host.classList.remove("hidden");
          if (!pickMap) {
            pickMap = UB.map.create(host, { items: [], panel: false, overlays: false, zoom: 12 });
            pickMap.map.on("click", (ev) => setLatLng(ev.latlng.lat, ev.latlng.lng));
            UB.toast("Газрын зураг дээр байраа дарж сонгоно уу.");
          }
          setTimeout(() => pickMap.resize(), 50);
        });
        form.addEventListener("submit", (ev) => {
          ev.preventDefault();
          const fd = new FormData(form);
          const v = (k) => String(fd.get(k) || "").trim();
          if (!v("title") || !v("description") || !v("address")) return showErr("Гарчиг, тайлбар, хаягийг бөглөнө үү.");
          if (!(Number(v("price")) > 0) || !(Number(v("area")) > 0) || !(Number(v("rooms")) >= 1)) return showErr("Үнэ, талбай, өрөөний тоог зөв оруулна уу.");
          const lat = v("lat") ? Number(v("lat")) : null;
          const lng = v("lng") ? Number(v("lng")) : null;
          if ((lat !== null && (isNaN(lat) || lat < 40 || lat > 53)) || (lng !== null && (isNaN(lng) || lng < 87 || lng > 120))) return showErr("Координат Монгол Улсын хүрээнд байх ёстой.");
          const ad = {
            id: UB.uid(),
            userId: UB.store.currentUser().id,
            title: v("title"),
            description: v("description"),
            address: v("address"),
            price: Math.round(Number(v("price"))),
            area: Number(v("area")),
            rooms: Math.round(Number(v("rooms"))),
            propertyType: v("propertyType"),
            phone: v("phone"),
            photo,
            lat,
            lng,
            status: "pending",
            adminComment: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            approvedAt: null,
          };
          if (UB.store.addAd(ad)) {
            UB.toast("Зар илгээгдлээ. Админ зөвшөөрөхийг хүлээнэ үү.", "ok");
            UB.go("#/ads");
          }
        });
        return () => pickMap && pickMap.destroy();
      },
    };
  });

  const adminGuard = (next) => {
    const user = UB.store.currentUser();
    if (!user) return { title: "Админ", html: ui.needLogin(next) };
    if (!user.isAdmin) return { title: "Админ", html: `<div class="page page-narrow">${ui.empty("⛔", "Энэ хэсэг зөвхөн админд нээлттэй.", `<p class="xs muted mt8">Туршихын тулд гараад ${e(UB.store.ADMIN_EMAIL)} / ${e(UB.store.ADMIN_PASSWORD)}-аар нэвтэрнэ үү.</p>`)}</div>` };
    return null;
  };

  UB.route("/admin", () => {
    const g = adminGuard("/admin");
    if (g) return g;
    const ads = UB.store.ads();
    const count = (s) => ads.filter((a) => a.status === s).length;
    return {
      title: "Админ самбар",
      html: `
      <div class="page">
        <div class="row-between wrap mb16"><div><h1 class="h1">Админ самбар</h1><p class="small muted mt4">Зар, хэрэглэгчийн үйл ажиллагааг удирдах.</p></div><a class="btn btn-primary" href="#/admin/pending">Хүлээгдэж буй зарууд (${count("pending")})</a></div>
        <div class="grid g4">
          <div class="card pad"><p class="small muted">Хүлээгдэж буй зар</p><p class="h1 amber mt8">${count("pending")}</p></div>
          <div class="card pad"><p class="small muted">Зөвшөөрөгдсөн зар</p><p class="h1 green mt8">${count("approved")}</p></div>
          <div class="card pad"><p class="small muted">Татгалзсан зар</p><p class="h1 red mt8">${count("rejected")}</p></div>
          <div class="card pad"><p class="small muted">Нийт хэрэглэгч</p><p class="h1 blue mt8">${UB.store.users().length}</p></div>
        </div>
        <div class="alert alert-info mt16">Статик хувилбарт зар, хэрэглэгч энэ browser-т хадгалагддаг. Олон хүн нэг өгөгдөл хуваалцах бол backend-тэй хувилбарыг ашиглана.</div>
      </div>`,
    };
  });

  UB.route("/admin/pending", () => {
    const g = adminGuard("/admin/pending");
    if (g) return g;
    const pending = UB.store.ads().filter((a) => a.status === "pending");
    return {
      title: "Хүлээгдэж буй зар",
      html: `
      <div class="page page-narrow">
        <div class="row-between wrap mb16"><div><h1 class="h1">Хүлээгдэж буй зар</h1><p class="small muted mt4">Зарыг шалгаад зөвшөөрөх эсвэл татгалзана.</p></div><a class="btn btn-secondary" href="#/admin">← Самбар</a></div>
        <div class="stack">${pending.length ? pending.map((a) => `
          <div class="card pad" data-ad="${e(a.id)}">
            <div class="row-between row-top wrap">
              <div class="grow"><a class="h3" href="#/property/${e(a.id)}" style="color:var(--text)">${e(a.title)}</a><p class="small muted mt4">${e(a.address)}</p><p class="small mt8">${e(a.description)}</p></div>
              <div class="right small muted"><div>Үнэ: ${e(UB.short(a.price))}</div><div>Талбай: ${a.area} м²</div><div>Өрөө: ${a.rooms}</div><div>${UB.fmtDate(a.createdAt)}</div></div>
            </div>
            ${a.photo ? `<img src="${e(a.photo)}" alt="${e(a.title)}" data-zoom style="width:100%;height:180px;object-fit:cover;border-radius:12px;margin-top:12px;cursor:zoom-in">` : ""}
            <label class="field mt12"><span class="label">Админ тайлбар</span><textarea class="textarea" data-comment placeholder="Зөвшөөрөх, татгалзах шалтгаан..."></textarea></label>
            <div class="row mt12"><button class="btn btn-primary" type="button" data-act="approved">Зөвшөөрөх</button><button class="btn btn-danger" type="button" data-act="rejected">Татгалзах</button></div>
          </div>`).join("") : ui.empty("✅", "Хүлээгдэж буй зар байхгүй байна.")}</div>
      </div>`,
      mount: (root) =>
        root.addEventListener("click", (ev) => {
          const b = ev.target.closest("[data-act]");
          if (!b) return;
          const card = b.closest("[data-ad]");
          const status = b.dataset.act;
          if (!confirm(status === "approved" ? "Энэ зарыг зөвшөөрөх үү?" : "Энэ зарыг татгалзах уу?")) return;
          UB.store.updateAd(card.dataset.ad, { status, adminComment: card.querySelector("[data-comment]").value.trim(), approvedAt: status === "approved" ? new Date().toISOString() : null });
          UB.toast(status === "approved" ? "Зар зөвшөөрөгдлөө." : "Зар татгалзагдлаа.", "ok");
          UB.go("#/admin/pending");
        }),
    };
  });

  UB.route("/settings", () => {
    const s = UB.store.settings();
    return {
      title: "Тохиргоо",
      html: `
      <div class="page page-narrow">
        <h1 class="h1 mb16">Тохиргоо</h1>
        <form class="card pad stack mb16" data-ai>
          <h2 class="h3">🤖 AI зөвлөх (заавал биш)</h2>
          <p class="small muted">Түлхүүргүй үед AI зөвлөх сайтын мэдлэгийн сан болон өгөгдлөөс хариулна. <a href="https://console.groq.com/keys" target="_blank" rel="noopener">console.groq.com</a>-оос үнэгүй түлхүүр аваад оруулбал Llama загвараар чөлөөтэй ярилцана.</p>
          <label class="field"><span class="label">Groq API түлхүүр</span><input class="input" name="groqKey" type="password" autocomplete="off" value="${e(s.groqKey)}" placeholder="gsk_..."></label>
          <label class="field"><span class="label">Загвар</span><input class="input" name="groqModel" value="${e(s.groqModel)}"></label>
          <p class="xs faint">Түлхүүр зөвхөн энэ browser-т хадгалагдаж, шууд Groq руу илгээгдэнэ. Нийтийн компьютер дээр бүү оруулаарай.</p>
          <div class="row"><button class="btn btn-primary" type="submit">Хадгалах</button><button class="btn btn-secondary" type="button" data-clear-ai>Түлхүүр устгах</button></div>
        </form>
        <form class="card pad stack mb16" data-map>
          <h2 class="h3">🗺️ Газрын зураг</h2>
          <label class="field"><span class="label">Анхдагч суурь зураг</span><select class="select" name="baseMap">${[["esri", "Esri гудамжны зураг"], ["osm", "OpenStreetMap"], ["sat", "Хиймэл дагуулын зураг"], ["carto", "CARTO (түлхүүр шаардлагатай)"]].map(([k, l]) => `<option value="${k}"${s.baseMap === k ? " selected" : ""}>${l}</option>`).join("")}</select></label>
          <label class="field"><span class="label">CARTO түлхүүр</span><input class="input" name="cartoKey" autocomplete="off" value="${e(s.cartoKey)}" placeholder="carto.com/basemaps/apikey"></label>
          <div><button class="btn btn-primary" type="submit">Хадгалах</button></div>
        </form>
        <div class="card pad stack">
          <h2 class="h3">💾 Өгөгдөл</h2>
          <p class="small muted">Бүртгэл, зар, гэрээ, дневник энэ browser-т хадгалагдаж байгаа. Нөөц файл татаж аваад өөр төхөөрөмж дээр сэргээж болно.</p>
          <div class="grid g3" style="gap:10px">
            <button class="btn btn-secondary" type="button" data-export>⬇️ Нөөц татах</button>
            <label class="btn btn-secondary">⬆️ Нөөц сэргээх<input type="file" accept="application/json,.json" hidden data-import></label>
            <button class="btn btn-danger" type="button" data-reset>🗑️ Бүгдийг устгах</button>
          </div>
        </div>
      </div>`,
      mount: (root) => {
        root.querySelector("[data-ai]").addEventListener("submit", (ev) => {
          ev.preventDefault();
          const fd = new FormData(ev.target);
          UB.store.saveSettings({ groqKey: String(fd.get("groqKey") || "").trim(), groqModel: String(fd.get("groqModel") || "").trim() || "llama-3.3-70b-versatile" });
          UB.toast("AI тохиргоо хадгалагдлаа.", "ok");
        });
        root.querySelector("[data-clear-ai]").addEventListener("click", () => {
          UB.store.saveSettings({ groqKey: "" });
          UB.go("#/settings");
          UB.toast("Түлхүүр устгагдлаа.");
        });
        root.querySelector("[data-map]").addEventListener("submit", (ev) => {
          ev.preventDefault();
          const fd = new FormData(ev.target);
          const cartoKey = String(fd.get("cartoKey") || "").trim();
          let baseMap = fd.get("baseMap");
          if (baseMap === "carto" && !cartoKey) {
            UB.toast("CARTO сонгохын тулд түлхүүр оруулна уу.", "err");
            return;
          }
          UB.store.saveSettings({ baseMap, cartoKey });
          UB.toast("Газрын зургийн тохиргоо хадгалагдлаа.", "ok");
        });
        root.querySelector("[data-export]").addEventListener("click", () => {
          const blob = new Blob([JSON.stringify(UB.store.exportAll(), null, 2)], { type: "application/json" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `ubbair-noots-${UB.today()}.json`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        });
        root.querySelector("[data-import]").addEventListener("change", (ev) => {
          const f = ev.target.files && ev.target.files[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = () => {
            try {
              UB.store.importAll(JSON.parse(r.result));
              UB.toast("Нөөц сэргээгдлээ.", "ok");
              UB.go("#/");
            } catch (ex) {
              UB.toast(ex.message || "Файл уншиж чадсангүй.", "err");
            }
          };
          r.readAsText(f);
        });
        root.querySelector("[data-reset]").addEventListener("click", () => {
          if (!confirm("Бүх бүртгэл, зар, гэрээ, дневникийг устгах уу? Буцаах боломжгүй.")) return;
          UB.store.resetAll();
          UB.toast("Бүх өгөгдөл устгагдлаа.");
          UB.go("#/");
        });
      },
    };
  });
})();
