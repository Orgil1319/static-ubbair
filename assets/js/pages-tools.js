(function () {
  const UB = window.UB;
  const e = UB.esc;
  const ui = UB.ui;

  const highlight = (name, q) => {
    const i = name.toLowerCase().indexOf(q.toLowerCase());
    if (!q || i < 0) return e(name);
    return `${e(name.slice(0, i))}<mark>${e(name.slice(i, i + q.length))}</mark>${e(name.slice(i + q.length))}`;
  };

  const resultCard = (res) => {
    if (res.error) return `<div class="alert alert-warn">${e(res.error)}</div>`;
    if (!res.found) {
      return `<div class="card pad card-amber">
        <div class="row row-top"><div style="font-size:30px">🔎</div><div>
          <div class="semibold" style="color:var(--amber-800)">Тусгай зөвшөөрлийн жагсаалтад олдсонгүй</div>
          <p class="small mt4" style="color:var(--amber-800)">"${e(res.query)}" нэртэй компани БХБЯ-ны барилга угсралт, зураг төсөл, хот байгуулалтын тусгай зөвшөөрөлтэй байгууллагын жагсаалтад алга.</p>
        </div></div>
        <ul class="small mt12" style="color:var(--amber-800);padding-left:18px">
          <li>Нэрээ өөрөөр (жишээ нь хашилтгүй, товчилсон) бичиж дахин шалгаарай, эсвэл регистрийн дугаараар хайгаарай.</li>
          <li>Барилга барьж буй компани бол тусгай зөвшөөрлийн гэрчилгээний хуулбарыг шаардаарай.</li>
          <li>Жагсаалтад байхгүй нь луйвар гэсэн үг биш, гэхдээ урьдчилгаа төлөхөөсөө өмнө нарийвчлан шалгаарай.</li>
        </ul>
      </div>`;
    }
    const valid = res.status === "valid";
    return `<div class="card pad ${valid ? "card-green" : "card-red"}">
      <div class="row row-top mb12"><div style="font-size:30px">${valid ? "✅" : "🚨"}</div><div>
        <div class="semibold" style="font-size:17px;color:${valid ? "var(--green-800)" : "var(--red-800)"}">${valid ? "Тусгай зөвшөөрөл ХҮЧИНТЭЙ" : "Тусгай зөвшөөрлийн хугацаа ДУУССАН"}</div>
        <p class="small mt4" style="color:${valid ? "var(--green-800)" : "var(--red-800)"}">${valid ? "Хамгийн их тохирсон компанийн тусгай зөвшөөрлийн хугацаа дуусаагүй байна." : "Хамгийн их тохирсон компанийн тусгай зөвшөөрлийн хугацаа дууссан байна. Гэрээ байгуулахаасаа өмнө сунгалт хийгдсэн эсэхийг заавал шалгаарай."}</p>
      </div></div>
      <div class="stack-sm">
        ${res.matches.map((m) => `<div class="card pad-sm" style="background:#fff">
          <div class="row-between row-top">
            <div class="grow"><div class="small semibold">${e(m.name)}</div><div class="xs muted mt4">${m.reg ? `РД: ${e(m.reg)} · ` : ""}${e(m.kind)}</div></div>
            <span class="badge ${m.expired ? "badge-high" : "badge-low"}">${m.expired ? "Дууссан" : "Хүчинтэй"}</span>
          </div>
          <div class="row-between xs faint mt8 wrap"><span>${m.from ? `Олгосон: ${UB.fmtDate(m.from)} · ` : ""}${m.to ? `Дуусах: ${UB.fmtDate(m.to)}` : "Дуусах огноо тодорхойгүй"}</span><span>${e(m.source)} · тохирол ${Math.min(100, Math.round(m.score * 100))}%</span></div>
        </div>`).join("")}
      </div>
      ${valid ? "" : `<div class="alert alert-danger mt12"><b>Дараах алхам авахыг зөвлөж байна:</b><ul style="margin:6px 0 0;padding-left:18px"><li>БХБЯ эсвэл Барилгын хөгжлийн төвөөс зөвшөөрлийн сунгалтыг лавлах</li><li>Хуульч эсвэл мэргэжлийн зуучаар дамжуулах</li><li>Барилгын зөвшөөрлийг шалгах</li></ul></div>`}
    </div>`;
  };

  UB.route("/blacklist", (params, query) => ({
    title: "Хар жагсаалт шалгах",
    html: `
    <div class="page page-narrow">
      <div class="mb24"><h1 class="h1 mb8">Хар жагсаалт шалгах</h1><p class="muted">Барилгын компанийн нэр эсвэл регистрийн дугаараар хайж, БХБЯ-ны тусгай зөвшөөрөл хүчинтэй эсэхийг шалгана.</p></div>
      <form class="card pad mb24" data-form autocomplete="off">
        <label class="label" for="company-q">Компанийн нэр эсвэл регистр</label>
        <div class="row mt8" style="align-items:stretch">
          <div class="grow rel">
            <input class="input" id="company-q" name="q" type="search" placeholder="Жишээ: Давхар харш, 6617719" value="${e(query.q || "")}">
            <div class="suggest hidden" data-suggest></div>
          </div>
          <button class="btn btn-primary shrink0" type="submit" data-submit>Шалгах</button>
        </div>
        <p class="help mt8">ХХК, ХК гэх дагаврыг оруулахгүй байж болно. Бичиж эхлэхэд санал автоматаар гарна.</p>
      </form>
      <div data-result></div>
      <div class="mt32 stack">
        <h2 class="small semibold" style="color:var(--text-2)">Мэдээллийн эх сурвалжууд</h2>
        ${[
          ["Б", "Барилга байгууламжийн тусгай зөвшөөрөл", "Барилга угсралтын ажил гүйцэтгэх эрхтэй ААН-ийн жагсаалт (2026.01.30)", "БХБЯ"],
          ["З", "Зураг төслийн тусгай зөвшөөрөл", "Зураг төсөл боловсруулах эрхтэй ААН-ийн жагсаалт (2026.01.30)", "БХБЯ"],
          ["Х", "Хот байгуулалтын баримт бичиг", "Хот байгуулалтын баримт бичиг боловсруулах эрхтэй ААН (2026.06)", "БХБЯ"],
        ].map(([l, n, d, b]) => `<div class="card pad-sm row row-top"><div class="badge badge-blue" style="width:32px;height:32px;justify-content:center;border-radius:10px">${l}</div><div class="grow"><div class="small semibold">${n}</div><div class="xs muted mt4">${d}</div></div><span class="xs faint nowrap">${b}</span></div>`).join("")}
        <p class="xs faint">Өгөгдөл ${UB.fmtDate(UB.data.meta.licensesDate)}-ны байдлаар. Хугацаа дууссан эсэхийг өнөөдрийн огноотой харьцуулж тооцоолно.</p>
      </div>
    </div>`,
    mount: (root) => {
      const form = root.querySelector("[data-form]");
      const input = form.q;
      const box = root.querySelector("[data-suggest]");
      const out = root.querySelector("[data-result]");
      const submit = root.querySelector("[data-submit]");
      let items = [];
      let hl = -1;
      let ready = false;
      submit.disabled = true;
      submit.textContent = "Ачаалж байна...";
      const hide = () => {
        box.classList.add("hidden");
        hl = -1;
      };
      const drawSuggest = () => {
        if (!items.length) return hide();
        box.innerHTML = `<div class="suggest-head">${items.length} илэрц</div>${items.map((n, i) => `<button type="button" data-name="${e(n)}" class="${i === hl ? "hl" : ""}"><span>🏢</span><span class="truncate">${highlight(n, input.value.trim())}</span></button>`).join("")}`;
        box.classList.remove("hidden");
      };
      const check = () => {
        const q = input.value.trim();
        if (!q || !ready) return;
        hide();
        out.innerHTML = resultCard(UB.data.checkCompany(q)) + `<div class="row mt8" style="justify-content:flex-end">${ui.fresh(UB.data.meta.licensesDate)}</div>`;
        history.replaceState(null, "", `#/blacklist${UB.toQuery({ q })}`);
      };
      UB.data.ensureLicenses().then(() => {
        ready = true;
        submit.disabled = false;
        submit.textContent = "Шалгах";
        if (input.value.trim()) check();
      }).catch((err) => {
        submit.textContent = "Алдаа";
        out.innerHTML = `<div class="alert alert-danger">${e(err.message)}</div>`;
      });
      const suggest = UB.debounce(() => {
        if (!ready) return;
        items = UB.data.suggestCompanies(input.value);
        hl = -1;
        drawSuggest();
      }, 200);
      input.addEventListener("input", () => {
        out.innerHTML = "";
        suggest();
      });
      input.addEventListener("keydown", (ev) => {
        if (box.classList.contains("hidden")) return;
        if (ev.key === "ArrowDown") {
          ev.preventDefault();
          hl = Math.min(hl + 1, items.length - 1);
          drawSuggest();
        } else if (ev.key === "ArrowUp") {
          ev.preventDefault();
          hl = Math.max(hl - 1, -1);
          drawSuggest();
        } else if (ev.key === "Enter" && hl >= 0) {
          ev.preventDefault();
          input.value = items[hl];
          check();
        } else if (ev.key === "Escape") hide();
      });
      box.addEventListener("mousedown", (ev) => {
        const b = ev.target.closest("[data-name]");
        if (!b) return;
        ev.preventDefault();
        input.value = b.dataset.name;
        check();
      });
      const outside = (ev) => {
        if (!form.contains(ev.target)) hide();
      };
      document.addEventListener("mousedown", outside);
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        check();
        input.blur();
      });
      return () => document.removeEventListener("mousedown", outside);
    },
  }));

  const RIGHTS = [
    { icon: "📝", title: "Гэрээний эрх", desc: "Гэрээ заавал бичгээр байх ёстой. Амаар хийсэн гэрээ маргаан гарсан үед хамгаалалт хангалтгүй.", law: "ИХ 318-р зүйл", link: "#/contracts/checklist", action: "Чек-лист" },
    { icon: "🔔", title: "Гарах мэдэгдлийн эрх", desc: "Байрны эзэн таныг гаргахыг хүсвэл 30 хоногийн өмнө бичгээр мэдэгдэх үүрэгтэй. Гэнэт хөөж болохгүй.", law: "ИХ 204-р зүйл", link: "#/contracts/generate", action: "Гэрээ үүсгэх" },
    { icon: "💰", title: "Барьцаа мөнгийн буцаалт", desc: "Байрыг гэмтэлгүй тушаасан бол барьцаа мөнгийг гэрээ дуусмагц буцааж авах эрхтэй.", law: "ИХ 318.4", link: "#/contracts/tracker", action: "Гэрээ хянах" },
    { icon: "📍", title: "Бүртгэлийн эрх", desc: "Гэрээг Үл хөдлөх хөрөнгийн газарт бүртгүүлэх шаардлагатай. Бүртгэлгүй гэрээ хуулийн хүчин чадалгүй.", law: "ИХ 318.4", link: "#/contracts/checklist", action: "Чек-лист" },
  ];
  const FAQ = [
    ["Байрны эзэн намайг гэрээ дуусахаас өмнө гаргах эрхтэй юу?", "Гэрээ дуусахаас өмнө байрны эзэн таныг гаргах бол заавал шалтгаан, хуульд заасан нөхцөл байх шаардлагатай. Шалтгаангүй гаргавал та хохирлоо шүүхээр барагдуулах эрхтэй."],
    ["Барьцаа мөнгийг буцааж авахгүй бол яах вэ?", "Байрыг гэмтэлгүй буцааж өгсөн бол барьцаа мөнгөө шаардах хуулийн эрхтэй. Эхлээд бичгээр шаардлага гарга, хариу өгөхгүй бол шүүхэд гомдол гаргах боломжтой."],
    ["Гэрээгүй байрлаж болох уу?", "Хуулийн хамгаалалт хамгийн сул байдаг тул гэрээгүй байрлахгүй байхыг зөвлөж байна. Маргаан гарсан үед гэрээгүй тохиолдолд нотлох баримтгүй болно."],
    ["Байрны доголдлыг яаж нотлох вэ?", "Доголдол гарсан өдөр нь зураг авч, огноотой тэмдэглэж, байрны эзэнд бичгээр (мессеж, и-мэйл) мэдэгдээрэй. «Байрны дневник» хэсэгт хадгалж болно."],
  ];

  UB.route("/lease", () => ({
    title: "Түрээслэгчийн эрх",
    html: `
    <div class="page page-narrow">
      <div class="center mb24"><h1 class="h1 mb8">Түрээслэгчийн эрхийн төв</h1><p class="muted small" style="max-width:520px;margin:0 auto">Оюутан, залуус, түрээслэгчид гэрээ, байрны эрсдэл, хөөгдөлтөөс хамгаалах үндсэн заавар.</p></div>
      <div class="grid g2 mb24">${RIGHTS.map((r) => `<div class="card pad"><div style="font-size:26px" class="mb8">${r.icon}</div><h3 class="h3 mb4">${r.title}</h3><p class="small muted mb12">${r.desc}</p><div class="row-between"><span class="badge badge-blue">${r.law}</span><a class="xs semibold" href="${r.link}">${r.action} →</a></div></div>`).join("")}</div>
      <div class="grid g4 mb24" style="grid-template-columns:repeat(2,minmax(0,1fr))">
        ${[["#/contracts/generate", "📄", "Гэрээ үүсгэх"], ["#/contracts/checklist", "☑️", "Чек-лист"], ["#/contracts/tracker", "📅", "Гэрээ хянах"], ["#/diary", "📔", "Байрны дневник"]].map(([h, i, l]) => `<a class="card pad-sm center" href="${h}"><div style="font-size:24px">${i}</div><div class="xs semibold mt4">${l}</div></a>`).join("")}
      </div>
      <div class="card pad"><h2 class="h3 mb8">Нийтлэг асуулт</h2>${FAQ.map(([q, a]) => `<details class="faq"><summary>${q}</summary><p>${a}</p></details>`).join("")}</div>
    </div>`,
  }));

  const CATS = {
    issue: { label: "Доголдол", cls: "badge-high" },
    repair: { label: "Засвар", cls: "badge-low" },
    note: { label: "Тэмдэглэл", cls: "badge-blue" },
  };

  UB.route("/diary", () => ({
    title: "Байрны дневник",
    html: `
    <div class="page page-narrow">
      <div class="row-between mb16"><div><h1 class="h1">Байрны дневник</h1><p class="small muted mt4">Байрны доголдол, засварыг бүртгэн нотолгоо болго</p></div><button class="btn btn-primary" type="button" data-toggle>+ Нэмэх</button></div>
      <div class="alert alert-info mb16">💡 Байрны эзэнтэй маргаан гарсан тохиолдолд дневник нь хамгийн хүчтэй нотолгоо болно. Зураг болон огноотой тэмдэглэлээ хадгалаарай. Мэдээлэл зөвхөн энэ төхөөрөмжийн browser-т хадгалагдана.</div>
      <form class="card pad card-blue mb16 stack hidden" data-form>
        <h3 class="h3">Шинэ бичлэг</h3>
        <div class="field"><span class="label">Төрөл</span><div class="row wrap" data-cats>${Object.entries(CATS).map(([k, c], i) => `<button type="button" class="btn btn-sm ${i === 0 ? "btn-primary" : "btn-secondary"}" data-cat="${k}">${c.label}</button>`).join("")}</div></div>
        <label class="field"><span class="label">Гарчиг</span><input class="input" name="title" placeholder="Жишээ: Ус гоожиж байна" required></label>
        <label class="field"><span class="label">Огноо</span><input class="input" name="date" type="date" value="${UB.today()}"></label>
        <label class="field"><span class="label">Дэлгэрэнгүй тайлбар</span><textarea class="textarea" name="description" placeholder="Болсон зүйлийг тайлбарлана уу..."></textarea></label>
        <div class="field"><span class="label">Зураг (4 хүртэл)</span><label class="dropzone">📷 Зураг оруулах<input type="file" accept="image/*" multiple hidden data-files></label><div class="photo-grid" data-previews></div></div>
        <div class="row" style="justify-content:flex-end"><button class="btn btn-secondary" type="button" data-cancel>Болих</button><button class="btn btn-primary" type="submit">Хадгалах</button></div>
      </form>
      <div data-list class="stack"></div>
    </div>`,
    mount: (root) => {
      const form = root.querySelector("[data-form]");
      const list = root.querySelector("[data-list]");
      let cat = "issue";
      let photos = [];
      const drawPreviews = () => (root.querySelector("[data-previews]").innerHTML = photos.map((p, i) => `<img src="${p}" alt="Зураг ${i + 1}" data-zoom>`).join(""));
      const draw = () => {
        const entries = UB.store.diary();
        list.innerHTML = entries.length
          ? entries.map((en) => `<div class="card pad-sm">
              <div class="row-between row-top mb4"><h3 class="small semibold">${e(en.title)}</h3><div class="row shrink0" style="gap:8px"><span class="badge ${CATS[en.category].cls}">${CATS[en.category].label}</span><span class="xs faint">${UB.fmtDate(en.date)}</span></div></div>
              ${en.description ? `<p class="small muted">${e(en.description)}</p>` : ""}
              ${en.images && en.images.length ? `<div class="photo-grid mt8">${en.images.map((src, i) => `<img src="${src}" alt="Зураг ${i + 1}" data-zoom>`).join("")}</div>` : ""}
              <div class="row mt8" style="justify-content:flex-end"><button class="btn btn-ghost btn-sm" type="button" data-del="${e(en.id)}" style="color:var(--red)">Устгах</button></div>
            </div>`).join("")
          : ui.empty("📔", "Дневник хоосон байна. Эхний бичлэгээ нэмнэ үү.");
      };
      root.querySelector("[data-toggle]").addEventListener("click", () => form.classList.toggle("hidden"));
      root.querySelector("[data-cancel]").addEventListener("click", () => {
        form.reset();
        photos = [];
        drawPreviews();
        form.classList.add("hidden");
      });
      root.querySelector("[data-cats]").addEventListener("click", (ev) => {
        const b = ev.target.closest("[data-cat]");
        if (!b) return;
        cat = b.dataset.cat;
        root.querySelectorAll("[data-cat]").forEach((x) => {
          x.classList.toggle("btn-primary", x === b);
          x.classList.toggle("btn-secondary", x !== b);
        });
      });
      root.querySelector("[data-files]").addEventListener("change", async (ev) => {
        const files = Array.from(ev.target.files || []).slice(0, 4 - photos.length);
        for (const f of files) {
          try {
            photos.push(await UB.compressImage(f, 900, 0.7));
          } catch (err) {
            UB.toast(err.message, "err");
          }
        }
        ev.target.value = "";
        drawPreviews();
      });
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const fd = new FormData(form);
        const title = String(fd.get("title") || "").trim();
        if (!title) return;
        const entries = UB.store.diary();
        entries.unshift({ id: UB.uid(), date: fd.get("date") || UB.today(), title, description: String(fd.get("description") || "").trim(), images: photos, category: cat });
        entries.sort((a, b) => (a.date < b.date ? 1 : -1));
        if (UB.store.saveDiary(entries)) {
          form.reset();
          photos = [];
          drawPreviews();
          form.classList.add("hidden");
          UB.toast("Бичлэг хадгалагдлаа.", "ok");
          draw();
        }
      });
      list.addEventListener("click", (ev) => {
        const b = ev.target.closest("[data-del]");
        if (!b || !confirm("Энэ бичлэгийг устгах уу?")) return;
        UB.store.saveDiary(UB.store.diary().filter((x) => x.id !== b.dataset.del));
        draw();
      });
      draw();
    },
  }));
})();
