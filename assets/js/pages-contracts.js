(function () {
  const UB = window.UB;
  const e = UB.esc;
  const ui = UB.ui;
  const n = (v) => UB.num(v);

  const FIELDS = {
    ownerName: "", ownerRegNum: "", ownerPhone: "", ownerEmail: "",
    tenantName: "", tenantRegNum: "", tenantPhone: "", tenantEmail: "",
    address: "", area: "", rooms: "", floor: "",
    startDate: "", endDate: "", monthlyRent: "", depositMonths: "1", paymentDay: "1", noticeDays: "30",
  };
  const REQUIRED = [
    ["ownerName", "Эзний нэр", 1], ["ownerRegNum", "Эзний регистр", 1], ["ownerPhone", "Эзний утас", 1],
    ["tenantName", "Түрээслэгчийн нэр", 1], ["tenantRegNum", "Түрээслэгчийн регистр", 1], ["tenantPhone", "Түрээслэгчийн утас", 1],
    ["address", "Хаяг", 2], ["area", "Талбай", 2],
    ["startDate", "Эхлэх огноо", 3], ["endDate", "Дуусах огноо", 3], ["monthlyRent", "Сарын түрээс", 3],
  ];

  const input = (form, key, label, type = "text", ph = "", extra = "") =>
    `<label class="field"><span class="label">${label}</span><input class="input" name="${key}" type="${type}" value="${e(form[key])}" placeholder="${e(ph)}" ${extra}></label>`;
  const select = (form, key, label, options) =>
    `<label class="field"><span class="label">${label}</span><select class="select" name="${key}">${options.map(([v, t]) => `<option value="${v}"${String(form[key]) === String(v) ? " selected" : ""}>${t}</option>`).join("")}</select></label>`;

  UB.route("/contracts/generate", (params, query) => {
    const form = { ...FIELDS, address: query.address || "", rooms: query.rooms || "", area: query.area || "" };
    let step = 1;
    const today = new Date();
    if (!form.startDate) form.startDate = today.toISOString().slice(0, 10);
    if (!form.endDate) {
      const end = new Date(today);
      end.setFullYear(end.getFullYear() + 1);
      end.setDate(end.getDate() - 1);
      form.endDate = end.toISOString().slice(0, 10);
    }
    const stepHtml = () => {
      if (step === 1) return `<div class="stack-lg">
        <div><h2 class="small semibold mb12" style="padding-bottom:8px;border-bottom:1px solid var(--line-soft)">🏠 Байрны эзэн (түрээслүүлэгч)</h2><div class="grid g2" style="gap:12px">
          ${input(form, "ownerName", "Овог нэр", "text", "Дорж Батаа", 'autocomplete="off"')}${input(form, "ownerRegNum", "Регистрийн дугаар", "text", "АА12345678", 'autocomplete="off"')}
          ${input(form, "ownerPhone", "Утасны дугаар", "tel", "9911 2233", 'inputmode="tel"')}${input(form, "ownerEmail", "И-мэйл", "email", "owner@example.com")}
        </div></div>
        <div><h2 class="small semibold mb12" style="padding-bottom:8px;border-bottom:1px solid var(--line-soft)">👤 Түрээслэгч</h2><div class="grid g2" style="gap:12px">
          ${input(form, "tenantName", "Овог нэр", "text", "Батхүү Мөнх", 'autocomplete="off"')}${input(form, "tenantRegNum", "Регистрийн дугаар", "text", "БА98765432", 'autocomplete="off"')}
          ${input(form, "tenantPhone", "Утасны дугаар", "tel", "9922 3344", 'inputmode="tel"')}${input(form, "tenantEmail", "И-мэйл", "email", "tenant@example.com")}
        </div></div></div>`;
      if (step === 2) return `<div class="stack">
        <h2 class="small semibold">🏢 Байрны мэдээлэл</h2>
        ${input(form, "address", "Хаяг", "text", "Сүхбаатар дүүрэг, 1-р хороо, Энхтайваны өргөн чөлөө 10")}
        <div class="grid g3" style="gap:12px;grid-template-columns:repeat(3,minmax(0,1fr))">${input(form, "area", "Талбай (м²)", "number", "52", 'inputmode="decimal" min="1" step="0.01"')}${input(form, "rooms", "Өрөө", "number", "2", 'inputmode="numeric" min="0"')}${input(form, "floor", "Давхар", "number", "5", 'inputmode="numeric"')}</div>
      </div>`;
      return `<div class="stack">
        <h2 class="small semibold">📋 Гэрээний нөхцөл</h2>
        <div class="grid g2" style="gap:12px">
          ${input(form, "startDate", "Эхлэх огноо", "date")}${input(form, "endDate", "Дуусах огноо", "date")}
          ${input(form, "monthlyRent", "Сарын түрээс (₮)", "number", "800000", 'inputmode="numeric" min="0" step="1000"')}
          ${select(form, "depositMonths", "Барьцаа мөнгө", [[1, "1 сарын түрээс"], [2, "2 сарын түрээс"], [3, "3 сарын түрээс"]])}
          ${select(form, "paymentDay", "Төлбөрийн өдөр", [1, 5, 10, 15, 20, 25].map((d) => [d, `Сарын ${d}-нд`]))}
          ${select(form, "noticeDays", "Урьдчилан мэдэгдэх хоног", [14, 30, 60].map((d) => [d, `${d} хоног`]))}
        </div>
        <div class="alert alert-info"><div class="semibold mb4">✅ Гэрээнд автоматаар орох заалтууд</div>
          • Барьцаа мөнгийг гэрээ дуусмагц 7 хоногт буцааж өгөх<br>• Гарахаас <span data-notice>${e(form.noticeDays)}</span> хоногийн өмнө бичгээр мэдэгдэх үүрэг (ИХ 204-р зүйл)<br>• Байрны эзний буруутай үйлдлээс гарсан бол нөхөн төлбөргүй гарах эрх<br>• Гэрээг Үл хөдлөх хөрөнгийн газарт бүртгүүлэх зааварчилгаа (ИХ 318.4)
        </div>
      </div>`;
    };
    return {
      title: "Гэрээ үүсгэх",
      html: `
      <div class="page page-narrow">
        <div class="mb16"><h1 class="h1 mb4">Түрээсийн гэрээ үүсгэх</h1><p class="small muted">Иргэний хуулийн 318-р зүйлд нийцсэн стандарт загвар</p></div>
        <div class="steps mb16" data-steps></div>
        <form class="card pad" data-form novalidate></form>
        <div class="row-between mt16"><button class="btn btn-secondary" type="button" data-prev>← Буцах</button><button class="btn btn-primary" type="button" data-next>Үргэлжлүүлэх →</button></div>
        <div data-msg class="mt12"></div>
      </div>`,
      mount: (root) => {
        const formEl = root.querySelector("[data-form]");
        const prev = root.querySelector("[data-prev]");
        const next = root.querySelector("[data-next]");
        const msg = root.querySelector("[data-msg]");
        const draw = () => {
          root.querySelector("[data-steps]").innerHTML = [1, 2, 3].map((s) => `<div class="step${step >= s ? " on" : ""}"><span class="n">${s}</span>${["Талуудын мэдээлэл", "Байрны мэдээлэл", "Гэрээний нөхцөл"][s - 1]}</div>`).join("");
          formEl.innerHTML = stepHtml();
          prev.style.visibility = step > 1 ? "visible" : "hidden";
          next.textContent = step < 3 ? "Үргэлжлүүлэх →" : "📄 Гэрээ үүсгэх";
        };
        const save = () => new FormData(formEl).forEach((v, k) => (form[k] = String(v)));
        const sync = () => {
          save();
          const nd = formEl.querySelector("[data-notice]");
          if (nd) nd.textContent = form.noticeDays;
        };
        formEl.addEventListener("input", sync);
        formEl.addEventListener("change", sync);
        const missingFor = (s) => REQUIRED.filter(([k, , st]) => st === s && !String(form[k]).trim()).map(([, l]) => l);
        prev.addEventListener("click", () => {
          save();
          msg.innerHTML = "";
          step = Math.max(1, step - 1);
          draw();
        });
        next.addEventListener("click", () => {
          save();
          const miss = missingFor(step);
          if (miss.length) {
            msg.innerHTML = `<div class="alert alert-danger">Дутуу талбар: ${miss.map(e).join(", ")}</div>`;
            return;
          }
          msg.innerHTML = "";
          if (step < 3) {
            step++;
            draw();
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }
          if (form.endDate <= form.startDate) {
            msg.innerHTML = `<div class="alert alert-danger">Дуусах огноо эхлэх огнооноос хойш байх ёстой.</div>`;
            return;
          }
          if (Number(form.monthlyRent) <= 0 || Number(form.area) <= 0) {
            msg.innerHTML = `<div class="alert alert-danger">Түрээс болон талбай 0-ээс их байх ёстой.</div>`;
            return;
          }
          const user = UB.store.currentUser();
          const rent = Math.round(Number(form.monthlyRent));
          const contract = {
            id: UB.uid(),
            number: `LS-${UB.uid().replace(/-/g, "").slice(0, 8).toUpperCase()}`,
            userId: user ? user.id : null,
            owner: { name: form.ownerName.trim(), reg: form.ownerRegNum.trim(), phone: form.ownerPhone.trim(), email: form.ownerEmail.trim(), address: form.address.trim() },
            tenant: { name: form.tenantName.trim(), reg: form.tenantRegNum.trim(), phone: form.tenantPhone.trim(), email: form.tenantEmail.trim(), address: form.address.trim() },
            address: form.address.trim(),
            area: Number(form.area),
            rooms: Number(form.rooms) || 0,
            floor: Number(form.floor) || 0,
            monthlyRent: rent,
            deposit: rent * Number(form.depositMonths || 1),
            startDate: form.startDate,
            endDate: form.endDate,
            paymentDay: Number(form.paymentDay),
            noticeDays: Number(form.noticeDays),
            ownerSigned: false,
            tenantSigned: false,
            status: "draft",
            createdAt: new Date().toISOString(),
          };
          const list = UB.store.contracts();
          list.unshift(contract);
          if (UB.store.saveContracts(list)) {
            UB.toast("Гэрээ бэлэн боллоо.", "ok");
            UB.go(`#/contracts/view/${contract.id}`);
          }
        });
        draw();
      },
    };
  });

  const longDate = (iso) => {
    const d = new Date(iso);
    return `${d.getFullYear()} оны ${String(d.getMonth() + 1).padStart(2, "0")} дугаар сарын ${String(d.getDate()).padStart(2, "0")}-ний өдөр`;
  };

  const contractDoc = (c) => `
    <article class="doc">
      <h1>ОРОН СУУЦНЫ ТҮРЭЭСИЙН ГЭРЭЭ</h1>
      <p class="sub">Дугаар: ${e(c.number)}</p>
      <p class="sub">Улаанбаатар хот, ${longDate(c.startDate)}</p>
      <h2>НЭГ. ТАЛУУДЫН МЭДЭЭЛЭЛ</h2>
      <p><b>Түрээслүүлэгч (Байрны эзэн):</b></p>
      <p>Овог нэр: <b>${e(c.owner.name)}</b></p><p>РД: ${e(c.owner.reg)}</p><p>Утас: ${e(c.owner.phone)}</p>${c.owner.email ? `<p>И-мэйл: ${e(c.owner.email)}</p>` : ""}<p>Хаяг: ${e(c.owner.address)}</p>
      <p style="margin-top:10px"><b>Түрээслэгч:</b></p>
      <p>Овог нэр: <b>${e(c.tenant.name)}</b></p><p>РД: ${e(c.tenant.reg)}</p><p>Утас: ${e(c.tenant.phone)}</p>${c.tenant.email ? `<p>И-мэйл: ${e(c.tenant.email)}</p>` : ""}<p>Хаяг: ${e(c.tenant.address)}</p>
      <h2>ХОЁР. БАЙРНЫ МЭДЭЭЛЭЛ</h2>
      <p>2.1. Түрээслүүлэх орон сууц: <b>${e(c.address)}</b></p>
      <p>2.2. Нийт талбай: <b>${e(c.area)} м²</b>${c.rooms ? `, ${c.rooms} өрөө` : ""}${c.floor ? `, ${c.floor} давхар` : ""}</p>
      <h2>ГУРАВ. САНХҮҮГИЙН НӨХЦӨЛ</h2>
      <p>3.1. Сарын түрээсийн төлбөр: <b>${n(c.monthlyRent)} ₮</b> (сарын ${c.paymentDay}-нд төлнө).</p>
      <p>3.2. Барьцаа мөнгө: <b>${n(c.deposit)} ₮</b>. Гэрээ дуусмагц 7 хоногийн дотор бүрэн буцаана.</p>
      <p>3.3. Нийтийн үйлчилгээ (цахилгаан, ус, халаалт)-ний төлбөрийг түрээслэгч тус тусад нь хариуцна.</p>
      <h2>ДӨРӨВ. ГЭРЭЭНИЙ ХУГАЦАА</h2>
      <p>4.1. Гэрээ ${UB.fmtDate(c.startDate)}-ээс ${UB.fmtDate(c.endDate)} хүртэл хүчинтэй.</p>
      <h2>ТАВ. ЭРТ ГАРАХ НӨХЦӨЛ</h2>
      <p>5.1. Түрээслэгч хугацаанаас өмнө гарах бол ${c.noticeDays}-аас доошгүй хоногийн өмнө бичгээр мэдэгдэх үүрэгтэй. (Иргэний хуулийн 204.1)</p>
      <p>5.2. Мэдэгдэлгүй гарсан тохиолдолд 1 сарын түрээсийн (${n(c.monthlyRent)} ₮) нөхөн төлбөр төлнө.</p>
      <p>5.3. Байрны эзний буруутай үйлдлээс (засвар хийгдэхгүй, ус/цахилгаан/халаалт тасарсан) болж гарсан тохиолдолд 5.2-т заасан нөхөн төлбөр хамаарахгүй.</p>
      <p>5.4. Байрны эзэн хугацаанаас өмнө гарахыг шаардвал ${c.noticeDays}-аас доошгүй хоногийн өмнө мэдэгдэж, барьцаа мөнгийг 7 хоногийн дотор бүрэн буцаана.</p>
      <h2>ЗУРГАА. БАРЬЦАА МӨНГӨ</h2>
      <p>6.1. Байрны эзэн гэрээ байгуулахдаа ${n(c.deposit)} ₮ барьцаа мөнгө авна.</p>
      <p>6.2. Барьцаа мөнгийг дараах тохиолдолд суутгаж болно: байранд гэмтэл учруулсан (элэгдэл бус), мэдэгдэлгүй гарсан, төлбөр хоцорсон.</p>
      <p>6.3. Суутгалыг баримтаар нотолж, дүнг тодорхойлно. Нотолгоогүйгээр суутгахыг хориглоно.</p>
      <div class="notice">⚠️ ЧУХАЛ: Монгол Улсын Иргэний хуулийн 318.4-т зааснаар энэхүү гэрээг Үл хөдлөх хөрөнгийн улсын бүртгэлд бүртгүүлэхгүй бол хүчин төгөлдөр бус гэж үзнэ. Гарын үсэг зурсны дараа заавал Нийслэлийн УБЕГ-т бүртгүүлнэ үү.</div>
      <h2>ГАРЫН ҮСЭГ ЗУРАХ ХЭСЭГ</h2>
      <table>
        <tr><th>ТҮРЭЭСЛҮҮЛЭГЧ</th><th>ТҮРЭЭСЛЭГЧ</th></tr>
        <tr><td>${e(c.owner.name)}<br>РД: ${e(c.owner.reg)}<div class="sigline">Гарын үсэг: ____________</div></td><td>${e(c.tenant.name)}<br>РД: ${e(c.tenant.reg)}<div class="sigline">Гарын үсэг: ____________</div></td></tr>
        <tr><td>Огноо: ____.____.____</td><td>Огноо: ____.____.____</td></tr>
      </table>
    </article>`;

  const canSee = (c) => {
    const user = UB.store.currentUser();
    return !c.userId || (user && (user.id === c.userId || user.isAdmin));
  };

  UB.route("/contracts/view/:id", (params) => {
    const c = UB.store.getContract(params.id);
    if (!c || !canSee(c)) return { title: "Олдсонгүй", html: `<div class="page page-narrow">${ui.empty("📄", "Гэрээ олдсонгүй.", `<a class="btn btn-secondary mt16" href="#/contracts/tracker">Миний гэрээнүүд</a>`)}</div>` };
    return {
      title: `Гэрээ ${c.number}`,
      html: `
      <div class="page">
        <div class="no-print card pad mb16 stack">
          <div class="row-between wrap"><div><h1 class="h2">Гэрээ бэлэн боллоо</h1><p class="small muted mt4">${e(c.number)} · ${e(c.address)}</p></div><span class="badge ${c.status === "sent" ? "badge-blue" : "badge-gray"}">${c.status === "sent" ? "Гарын үсэгт илгээсэн" : "Ноорог"}</span></div>
          <div class="grid g3" style="gap:10px">
            <button class="btn btn-primary" type="button" data-print>🖨️ PDF болгох / хэвлэх</button>
            <a class="btn btn-secondary" href="#/contracts/sign/${e(c.id)}">✍️ Гарын үсэг</a>
            <a class="btn btn-secondary" href="#/contracts/tracker">📅 Миний гэрээнүүд</a>
          </div>
          <p class="xs faint">PDF болгохдоо хэвлэх цонхонд «Save as PDF / PDF болгон хадгалах»-ыг сонгоно. Утсан дээр «Хуваалцах → Хэвлэх» замаар хадгалж болно.</p>
        </div>
        ${contractDoc(c)}
      </div>`,
      mount: (root) => {
        root.querySelector("[data-print]").addEventListener("click", () => window.print());
      },
    };
  });

  UB.route("/contracts/sign/:id", (params) => {
    const c = UB.store.getContract(params.id);
    if (!c || !canSee(c)) return { title: "Олдсонгүй", html: `<div class="page page-narrow">${ui.empty("📄", "Гэрээ олдсонгүй.")}</div>` };
    const subject = `Түрээсийн гэрээ ${c.number} — гарын үсэг зурах хүсэлт`;
    const body = `Сайн байна уу,\n\n${c.address} хаягийн орон сууцны түрээсийн гэрээ (${c.number}) бэлэн боллоо.\n\nСарын түрээс: ${n(c.monthlyRent)} ₮\nБарьцаа: ${n(c.deposit)} ₮\nХугацаа: ${UB.fmtDate(c.startDate)} – ${UB.fmtDate(c.endDate)}\n\nГэрээний PDF-ийг хавсаргав. Танилцаад гарын үсэг зурна уу.`;
    const mails = [c.owner.email, c.tenant.email].filter(Boolean).join(",");
    const mailto = `mailto:${encodeURIComponent(mails).replace(/%2C/g, ",")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const party = (label, p, key) => `<div class="row-between" style="padding:8px 0">
      <div class="grow"><div class="small semibold">${label}</div><div class="xs muted truncate">${e(p.name)}${p.email ? ` · ${e(p.email)}` : ""}</div></div>
      <button class="btn btn-sm ${c[key] ? "btn-green" : "btn-secondary"}" type="button" data-sign="${key}">${c[key] ? "✅ Гарын үсэг зурсан" : "⏳ Хүлээгдэж байна"}</button>
    </div>`;
    const allSigned = c.ownerSigned && c.tenantSigned;
    return {
      title: "Гэрээг баталгаажуулах",
      html: `
      <div class="page page-narrow">
        <h1 class="h1 mb4">Гэрээг баталгаажуулах</h1>
        <p class="small muted mb16">Гэрээний агуулгыг шалгаад, гарын үсэг зурах хүсэлт явуулна уу.</p>
        <div class="card pad mb16">
          <div class="xxs upper faint bold mb12">Гэрээний хураангуй · ${e(c.number)}</div>
          <div class="kv">${[
            ["Байрны эзэн", c.owner.name], ["Түрээслэгч", c.tenant.name], ["Хаяг", c.address], ["Талбай", `${c.area} м²`],
            ["Сарын түрээс", `${n(c.monthlyRent)} ₮`], ["Барьцаа мөнгө", `${n(c.deposit)} ₮`], ["Эхлэх огноо", UB.fmtDate(c.startDate)], ["Дуусах огноо", UB.fmtDate(c.endDate)],
          ].map(([k, v]) => `<div><div class="k">${k}</div><div class="v">${e(v)}</div></div>`).join("")}</div>
        </div>
        <div class="card pad mb16">
          <div class="xxs upper faint bold mb4">Гарын үсгийн статус</div>
          ${party("Байрны эзэн", c.owner, "ownerSigned")}${party("Түрээслэгч", c.tenant, "tenantSigned")}
          <p class="xs faint mt8">Цаасан гэрээнд гарын үсэг зурсны дараа товчийг дарж тэмдэглэнэ үү.</p>
        </div>
        ${c.status === "sent" || allSigned ? `<div class="card pad card-amber mb16">
          <div class="semibold mb8" style="color:var(--amber-800)">⚠️ Чухал дараагийн алхам</div>
          <p class="small mb8" style="color:var(--amber-800)">Гарын үсэг зурсны дараа гэрээг <b>Улсын бүртгэлийн ерөнхий газарт</b> бүртгүүлэх шаардлагатай. Иргэний хуулийн 318.4-т заасны дагуу бүртгэлгүй гэрээ хүчин төгөлдөр бус болно.</p>
          <p class="small" style="color:var(--amber-800)">📍 Нийслэлийн Улсын бүртгэлийн хэлтэс эсвэл e-mongolia<br>📋 Шаардлагатай баримт: гэрээний эх хувь, иргэний үнэмлэх, үл хөдлөх хөрөнгийн гэрчилгээ</p>
        </div>` : ""}
        <div class="grid g2" style="gap:10px">
          <a class="btn btn-secondary" href="#/contracts/view/${e(c.id)}">📄 PDF харах</a>
          <a class="btn btn-primary" href="${mails ? mailto : "#"}" data-send>✉️ Гарын үсгийн хүсэлт явуулах</a>
        </div>
        <p class="xs faint mt8">${mails ? "И-мэйл програм тань нээгдэж, хоёр талд хүсэлт бэлдэнэ. Гэрээний PDF-ийг хавсаргаад илгээгээрэй." : "И-мэйл хаяг оруулаагүй тул PDF-ээ татаж мессенжерээр илгээгээрэй."}</p>
      </div>`,
      mount: (root) => {
        root.querySelectorAll("[data-sign]").forEach((b) =>
          b.addEventListener("click", () => {
            const key = b.dataset.sign;
            const cur = UB.store.getContract(c.id);
            const patch = { [key]: !cur[key] };
            const after = { ...cur, ...patch };
            if (after.ownerSigned && after.tenantSigned) patch.status = "signed";
            else if (cur.status === "signed") patch.status = "sent";
            UB.store.updateContract(c.id, patch);
            UB.go(`#/contracts/sign/${c.id}`);
          })
        );
        root.querySelector("[data-send]").addEventListener("click", (ev) => {
          if (!mails) {
            ev.preventDefault();
            UB.go(`#/contracts/view/${c.id}`);
          }
          const cur = UB.store.getContract(c.id);
          if (cur.status === "draft") {
            UB.store.updateContract(c.id, { status: "sent" });
            setTimeout(() => UB.go(`#/contracts/sign/${c.id}`), 300);
          }
        });
      },
    };
  });

  UB.route("/contracts/tracker", () => {
    const user = UB.store.currentUser();
    const list = UB.store.contracts().filter((c) => (user ? c.userId === user.id || !c.userId : !c.userId));
    const card = (c) => {
      const left = UB.daysUntil(c.endDate);
      const expired = left < 0;
      const urgent = !expired && left <= 30;
      const statusLabel = { draft: "Ноорог", sent: "Илгээсэн", signed: "Гарын үсэг зурсан" }[c.status] || c.status;
      return `<div class="card pad" style="${expired ? "opacity:.75;border-color:#fecaca" : urgent ? "border-color:#fcd34d" : ""}">
        <div class="row-between row-top mb12">
          <div class="grow"><h3 class="h3 truncate">${e(c.address)}</h3><p class="small muted mt4">${e(c.tenant.name)} · ${n(c.monthlyRent)} ₮/сар · <span class="xs">${statusLabel}</span></p></div>
          <span class="badge ${expired ? "badge-gray" : urgent ? "badge-medium" : "badge-low"}">${expired ? "Дууссан" : urgent ? `⚠️ ${left} хоног үлдсэн` : `${left} хоног`}</span>
        </div>
        ${ui.timeline(c.startDate, c.endDate)}
        <div class="grid g3 mt12" style="gap:8px;grid-template-columns:repeat(3,minmax(0,1fr))">
          <a class="btn btn-secondary btn-sm" href="#/contracts/sign/${e(c.id)}">Дэлгэрэнгүй</a>
          <a class="btn btn-secondary btn-sm" href="#/contracts/view/${e(c.id)}">PDF</a>
          <button class="btn btn-danger btn-sm" type="button" data-del="${e(c.id)}">Устгах</button>
        </div>
      </div>`;
    };
    return {
      title: "Гэрээний хяналт",
      html: `
      <div class="page page-narrow">
        <div class="row-between mb16"><div><h1 class="h1">Гэрээний хяналт</h1><p class="small muted mt4">Түрээсийн гэрээний хугацаа болон сануулга</p></div><a class="btn btn-primary" href="#/contracts/generate">+ Шинэ</a></div>
        ${user ? "" : `<div class="alert alert-info mb16">Та нэвтрээгүй байна. Нэвтэрч гэрээ үүсгэвэл таны бүртгэлд хадгалагдана. <a href="#/login?next=%2Fcontracts%2Ftracker">Нэвтрэх</a></div>`}
        <div class="stack">${list.length ? list.map(card).join("") : ui.empty("📄", "Гэрээ байхгүй байна.", `<a class="btn btn-ghost mt8" href="#/contracts/generate">Шинэ гэрээ үүсгэх →</a>`)}</div>
      </div>`,
      mount: (root) =>
        root.addEventListener("click", (ev) => {
          const b = ev.target.closest("[data-del]");
          if (!b || !confirm("Энэ гэрээг устгах уу?")) return;
          UB.store.deleteContract(b.dataset.del);
          UB.go("#/contracts/tracker");
        }),
    };
  });

  const CHECKLIST = [
    { id: "written", label: "Гэрээ бичгээр байгуулагдсан уу?", description: "Амаар хийсэн гэрээ хуулийн хүчин чадлаа алдаж болзошгүй. Бүх нөхцөлийг бичгээр тогтоох шаардлагатай.", law: "ИХ 318-р зүйл", required: true },
    { id: "registered", label: "Гэрээг Үл хөдлөх хөрөнгийн газарт бүртгүүлэх үү?", description: "Бүртгэлгүй гэрээ хуулийн хүчин чадалгүй болно. Гэрээнд гарын үсэг зурсны дараа 7 хоногт бүртгүүлнэ.", law: "ИХ 318.4", required: true },
    { id: "deposit", label: "Барьцаа мөнгийг буцааж өгөх нөхцөл гэрээнд байгаа юу?", description: "Барьцаа мөнгийг хэзээ, ямар нөхцөлд буцааж өгөхийг гэрээнд тодорхой заасан байх хэрэгтэй.", required: true },
    { id: "notice", label: "Урьдчилан мэдэгдэх хоногийг тогтоосон уу?", description: "Байрны эзэн болон түрээслэгч аль нэг нь гэрээ цуцлах тохиолдолд нөгөө талдаа хэдэн хоногийн өмнө мэдэгдэхийг заах шаардлагатай.", law: "ИХ 204-р зүйл", required: true },
    { id: "owner", label: "Гэрчилгээ дээрх өмчлөгч байрны эзэнтэй таарч байна уу?", description: "Үл хөдлөх хөрөнгийн гэрчилгээний эх хувийг харж, өмчлөгчийн нэр, регистрийг иргэний үнэмлэхтэй тулгана.", required: true },
    { id: "utility", label: "Нийтийн үйлчилгээний төлбөр (цахилгаан, ус, халаалт) хэн төлөхийг заасан уу?", description: "Нийтийн үйлчилгээний төлбөрийг хэн хариуцахыг гэрээнд тодорхой бичнэ.", required: false },
    { id: "repair", label: "Их засвар, жижиг засварыг хэн хариуцахыг заасан уу?", description: "Барилгын том засварыг байрны эзэн, өдөр тутмын жижиг засварыг түрээслэгч хариуцах нь нийтлэг стандарт.", required: false },
    { id: "sublease", label: "Дахин түрээслэх боломжийг зааж өгсөн үү?", description: "Оюутнуудын хувьд ихэвчлэн хамт амьдрагч нэмэх эсэхийг байрны эзнээс зөвшөөрөл авахыг гэрээнд заана.", required: false },
    { id: "inventory", label: "Байрны тавилга, тоног төхөөрөмжийн жагсаалт үйлдсэн үү?", description: "Гэрээ дуусгавар болоход маргаан гарахаас сэргийлж байрны бүх зүйлийг дурдсан хавсралт бэлтгэнэ.", required: false },
  ];

  UB.route("/contracts/checklist", () => ({
    title: "Хуулийн чек-лист",
    html: `<div class="page page-narrow"><div class="mb16"><h1 class="h1 mb4">5 минутын хуулийн чек-лист</h1><p class="muted">Гэрээ байгуулахаасаа өмнө эдгээр зүйлийг шалгана уу.</p></div><div data-body></div></div>`,
    mount: (root) => {
      const body = root.querySelector("[data-body]");
      const draw = () => {
        const checked = UB.store.checklist();
        const req = CHECKLIST.filter((i) => i.required);
        const done = req.filter((i) => checked[i.id]).length;
        const all = done === req.length;
        const item = (i) => `<button class="card check-item${checked[i.id] ? " done" : ""}" type="button" data-id="${i.id}">
          <span class="box">${checked[i.id] ? "✓" : ""}</span>
          <span class="grow"><span class="title small semibold" style="display:block">${i.label}</span><span class="xs muted" style="display:block;margin-top:4px">${i.description}</span>${i.law ? `<span class="badge badge-blue mt8">${i.law}</span>` : ""}</span>
        </button>`;
        body.innerHTML = `
          <div class="card pad mb16"><div class="row-between mb8"><span class="small semibold">Заавал шаардлагатай зүйлс</span><span class="small bold">${done}/${req.length}</span></div><div class="progress"><span style="width:${(done / req.length) * 100}%;background:${all ? "#22c55e" : "var(--blue)"}"></span></div>${all ? `<p class="xs green semibold mt8">✅ Заавал шаардлагатай бүх зүйлийг шалгасан байна!</p>` : ""}</div>
          <h2 class="xxs upper faint bold mb8">Заавал шаардлагатай</h2><div class="stack-sm mb16">${req.map(item).join("")}</div>
          <h2 class="xxs upper faint bold mb8">Нэмэлт зөвлөмж</h2><div class="stack-sm">${CHECKLIST.filter((i) => !i.required).map(item).join("")}</div>
          ${all ? `<div class="card pad card-green center mt16"><p class="small semibold mb12" style="color:var(--green-800)">Бүх шаардлагатай зүйлийг шалгасан байна!</p><a class="btn btn-primary" href="#/contracts/generate">Гэрээ үүсгэх →</a></div>` : ""}
          <div class="center mt16"><button class="btn btn-ghost btn-sm" type="button" data-reset>Чек-листийг цэвэрлэх</button></div>`;
      };
      body.addEventListener("click", (ev) => {
        const b = ev.target.closest("[data-id]");
        if (b) {
          const v = UB.store.checklist();
          v[b.dataset.id] = !v[b.dataset.id];
          UB.store.saveChecklist(v);
          draw();
        }
        if (ev.target.closest("[data-reset]")) {
          UB.store.saveChecklist({});
          draw();
        }
      });
      draw();
    },
  }));
})();
