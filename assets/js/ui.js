(function () {
  const UB = window.UB;
  const e = UB.esc;

  const RISK = {
    low: { label: "Аюулгүй", icon: "🟢" },
    medium: { label: "Дунд", icon: "🟡" },
    high: { label: "Эрсдэлтэй", icon: "🔴" },
  };

  const ui = {
    riskBadge: (level, size) => {
      const c = RISK[level] || RISK.low;
      return `<span class="badge badge-${level || "low"}${size === "lg" ? " badge-lg" : ""}">${c.icon} ${c.label}</span>`;
    },
    fresh: (date) => {
      if (!date) return "";
      const stale = UB.daysFrom(date) > 30;
      return `<span class="fresh${stale ? " stale" : ""}" title="Сүүлийн шинэчлэл: ${e(date)}">${e(UB.fmtDate(date))}-нд шинэчлэгдсэн</span>`;
    },
    empty: (icon, text, extra = "") => `<div class="card empty"><div class="big">${icon}</div><p class="small">${text}</p>${extra}</div>`,
    loading: (text = "Уншиж байна...") => `<div class="card empty"><div class="big">⏳</div><p class="small">${text}</p></div>`,
    thumb: (item, cls = "") => (item.photo ? `<img src="${e(item.photo)}" alt="${e(item.title)}" loading="lazy" class="${cls}">` : `<span>${item.kind === "ad" ? "📣" : "🏢"}</span>`),

    propertyCard: (p) => `
      <a class="card prop-card" href="#/property/${encodeURIComponent(p.id)}">
        <div class="prop-thumb">
          ${p.photo ? `<img src="${e(p.photo)}" alt="${e(p.title)}" loading="lazy">` : `<div class="glyph">🏢</div>`}
          <div class="shade"></div>
          <div class="tl">${ui.riskBadge(p.riskLevel)}</div>
          <div class="bl">${e(UB.short(p.price))}</div>
        </div>
        <div class="prop-body">
          <h3 class="h3 truncate mb8">${e(p.title)}</h3>
          <div class="meta"><span>📐 ${p.area || "?"} м²</span>${p.rooms ? `<span>🚪 ${p.rooms} өрөө</span>` : ""}<span>📍 ${e(p.district || "Тодорхойгүй")}</span>${p.builtYear ? `<span>🏗️ ${p.builtYear}</span>` : ""}</div>
        </div>
      </a>`,

    resultRow: (r, selected) => `
      <a class="card result${selected ? " selected" : ""}" href="#/property/${encodeURIComponent(r.id)}" data-id="${e(r.id)}">
        <div class="thumb">${ui.thumb(r)}</div>
        <div class="grow">
          <div class="row-between row-top">
            <h3 class="small semibold truncate" style="color:var(--text)">${e(r.title)}</h3>
            ${r.kind === "ad" ? `<span class="badge badge-blue">Зар</span>` : ui.riskBadge(r.riskLevel)}
          </div>
          <div class="xs muted mt4 truncate">📍 ${e(r.district || "")}${r.address ? ` · ${e(r.address)}` : ""}</div>
          <div class="row mt8 xs" style="gap:14px">
            <span class="semibold" style="color:var(--text)">${e(UB.short(r.price))}</span>
            ${r.area ? `<span class="muted">${r.area} м²</span>` : ""}
            ${r.rooms ? `<span class="muted">${r.rooms} өрөө</span>` : ""}
            ${r.perM2 ? `<span class="muted">${UB.mln(r.perM2, 1)}/м²</span>` : ""}
          </div>
        </div>
      </a>`,

    needLogin: (next) =>
      `<div class="page page-narrow">${ui.empty("🔐", "Энэ хэсгийг ашиглахын тулд нэвтэрнэ үү.", `<div class="row mt16" style="justify-content:center"><a class="btn btn-primary" href="#/login${UB.toQuery({ next })}">Нэвтрэх</a><a class="btn btn-secondary" href="#/register${UB.toQuery({ next })}">Бүртгүүлэх</a></div>`)}</div>`,

    timeline: (start, end) => {
      const s = new Date(start).getTime();
      const en = new Date(end).getTime();
      const total = Math.max(en - s, 1);
      const prog = Math.max(0, Math.min(100, ((Date.now() - s) / total) * 100));
      const w30 = Math.max(0, Math.min(100, ((en - 30 * 864e5 - s) / total) * 100));
      const w7 = Math.max(0, Math.min(100, ((en - 7 * 864e5 - s) / total) * 100));
      return `<div class="timeline"><div class="fill" style="width:${prog}%"></div><div class="mark" style="left:${w30}%;background:#f59e0b" title="30 хоног үлдэнэ"></div><div class="mark" style="left:${w7}%;background:#ef4444" title="7 хоног үлдэнэ"></div></div>
        <div class="row-between xs faint mt4"><span>${UB.fmtDate(start)}</span><span><span class="amber">━ 30 хоног</span> &nbsp; <span class="red">━ 7 хоног</span></span><span>${UB.fmtDate(end)}</span></div>`;
    },

    chat: (host, opts) => {
      const state = { messages: [{ role: "assistant", content: opts.greeting }], busy: false };
      host.innerHTML = `
        <div class="chat-body" data-body></div>
        ${opts.chips && opts.chips.length ? `<div class="chips" data-chips>${opts.chips.map((c) => `<button class="chip" type="button">${e(c)}</button>`).join("")}</div>` : ""}
        <form class="chat-input" data-form>
          <textarea class="input" rows="1" placeholder="${e(opts.placeholder || "Асуулт бичнэ үү...")}" aria-label="Асуулт"></textarea>
          <button class="btn btn-primary" type="submit" aria-label="Илгээх">↑</button>
        </form>`;
      const body = host.querySelector("[data-body]");
      const form = host.querySelector("[data-form]");
      const input = form.querySelector("textarea");
      const button = form.querySelector("button");
      const draw = () => {
        body.innerHTML =
          state.messages.map((m) => `<div class="msg ${m.role === "user" ? "user" : "bot"}">${m.role === "user" ? e(m.content).replace(/\n/g, "<br>") : UB.md(m.content)}</div>`).join("") +
          (state.busy ? `<div class="msg bot typing"><span>•</span><span>•</span><span>•</span></div>` : "");
        body.scrollTop = body.scrollHeight;
        button.disabled = state.busy;
      };
      const send = async (text) => {
        const t = String(text || "").trim();
        if (!t || state.busy) return;
        state.messages.push({ role: "user", content: t });
        state.busy = true;
        draw();
        try {
          const ctx = typeof opts.context === "function" ? opts.context() : null;
          const res = await UB.advisor.reply(state.messages, ctx);
          state.messages.push({ role: "assistant", content: res.text });
        } catch (err) {
          state.messages.push({ role: "assistant", content: "Уучлаарай, алдаа гарлаа. Дахин оролдоно уу." });
        } finally {
          state.busy = false;
          draw();
        }
      };
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const t = input.value;
        input.value = "";
        send(t);
      });
      input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" && !ev.shiftKey) {
          ev.preventDefault();
          form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit"));
        }
      });
      const chips = host.querySelector("[data-chips]");
      if (chips) chips.addEventListener("click", (ev) => {
        const b = ev.target.closest(".chip");
        if (b) send(b.textContent);
      });
      body.addEventListener("click", (ev) => {
        const a = ev.target.closest("a[href^='#']");
        if (a && opts.onNavigate) opts.onNavigate();
      });
      draw();
      return { send };
    },
  };

  UB.ui = ui;
})();
