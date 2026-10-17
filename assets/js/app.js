(function () {
  const UB = window.UB;
  const e = UB.esc;
  const view = document.getElementById("view");

  const NAV = [
    { href: "#/", label: "Нүүр", icon: "🏠", match: (p) => p === "/" },
    { href: "#/search", label: "Байр хайх", icon: "🔍", match: (p) => p.startsWith("/search") || p.startsWith("/property") },
    { href: "#/ads", label: "Миний зар", icon: "📣", match: (p) => p.startsWith("/ads") },
    { href: "#/blacklist", label: "Хар жагсаалт", icon: "⚠️", match: (p) => p.startsWith("/blacklist") },
    { href: "#/lease", label: "Түрээс", icon: "🔑", match: (p) => p.startsWith("/lease") },
    { href: "#/contracts/generate", label: "Гэрээ үүсгэх", icon: "📄", match: (p) => p.startsWith("/contracts/generate") || p.startsWith("/contracts/view") },
    { href: "#/contracts/tracker", label: "Гэрээ хянах", icon: "📅", match: (p) => p.startsWith("/contracts/tracker") || p.startsWith("/contracts/sign") || p.startsWith("/contracts/checklist") },
    { href: "#/diary", label: "Байрны дневник", icon: "📔", match: (p) => p.startsWith("/diary") },
    { sep: true },
    { href: "#/admin", label: "Админ", icon: "🛠️", match: (p) => p.startsWith("/admin") },
    { href: "#/settings", label: "Тохиргоо", icon: "⚙️", match: (p) => p.startsWith("/settings") },
  ];
  const BOTTOM = [
    { href: "#/", label: "Нүүр", icon: "🏠", match: (p) => p === "/" },
    { href: "#/search", label: "Хайх", icon: "🔍", match: (p) => p.startsWith("/search") || p.startsWith("/property") },
    { href: "#/blacklist", label: "Шалгах", icon: "🛡️", match: (p) => p.startsWith("/blacklist") },
    { href: "#/contracts/generate", label: "Гэрээ", icon: "📄", match: (p) => p.startsWith("/contracts") },
  ];

  const routes = UB.routes;

  let cleanup = null;
  UB.current = { path: "/", query: {}, item: null };

  const parseHash = () => {
    const raw = location.hash.replace(/^#/, "") || "/";
    const [path, query] = raw.split("?");
    return { path: path || "/", query: UB.parseQuery(query) };
  };

  UB.go = (hash) => {
    if (location.hash === hash) render();
    else location.hash = hash;
  };

  const renderNav = (path) => {
    document.getElementById("nav").innerHTML = NAV.map((n) => (n.sep ? `<div class="nav-sep"></div>` : `<a href="${n.href}" class="${n.match(path) ? "active" : ""}"><span class="nav-icon">${n.icon}</span>${n.label}</a>`)).join("");
    document.getElementById("bottom-nav").innerHTML =
      BOTTOM.map((n) => `<a href="${n.href}" class="${n.match(path) ? "active" : ""}"><span class="bi">${n.icon}</span>${n.label}</a>`).join("") +
      `<button type="button" data-open-menu><span class="bi">☰</span>Цэс</button>`;
    const user = UB.store.currentUser();
    document.getElementById("sidebar-foot").innerHTML = `
      ${user ? `<div class="profile-box"><div class="xxs semibold muted">Профайл${user.isAdmin ? " · Админ" : ""}</div><div class="who">${e(user.name || user.email)}</div><div class="xs muted truncate">${e(user.email)}</div><button class="btn btn-secondary btn-sm btn-block mt8" type="button" data-logout>Гарах</button></div>` : `<a class="btn btn-secondary btn-block" href="#/login" style="color:var(--blue-d);background:var(--blue-50);border-color:var(--blue-100)">Нэвтрэх</a>`}
      <div class="mini-note"><span style="font-size:18px">🤖</span><div><b>AI Зөвлөх</b>Байр худалдан авахтай холбоотой эрсдэл, зөвлөгөө.</div></div>`;
  };

  const render = async () => {
    const { path, query } = parseHash();
    if (cleanup) {
      try {
        cleanup();
      } catch (err) {}
      cleanup = null;
    }
    UB.current = { path, query, item: null };
    document.body.classList.remove("nav-open");
    renderNav(path);
    let match = null;
    for (const r of routes) {
      const m = path.match(r.re);
      if (m) {
        const params = {};
        r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
        match = { r, params };
        break;
      }
    }
    try {
      const out = match ? await match.r.handler(match.params, query) : notFound();
      const page = typeof out === "string" ? { html: out } : out;
      view.innerHTML = page.html;
      document.title = page.title ? `${page.title} — УБ Байр` : "УБ Байр — Аюулгүй байрны зөвлөгч";
      window.scrollTo(0, 0);
      if (page.mount) {
        const c = page.mount(view);
        if (typeof c === "function") cleanup = c;
      }
    } catch (err) {
      console.error(err);
      view.innerHTML = `<div class="page page-narrow">${UB.ui.empty("⚠️", "Хуудсыг ачаалахад алдаа гарлаа.", `<p class="xs muted mt8">${e(err.message || err)}</p><a class="btn btn-primary mt16" href="#/">Нүүр рүү буцах</a>`)}</div>`;
    }
  };

  const notFound = () => ({ title: "Олдсонгүй", html: `<div class="page page-narrow">${UB.ui.empty("🧭", "Хуудас олдсонгүй.", `<a class="btn btn-primary mt16" href="#/">Нүүр хуудас</a>`)}</div>` });

  const chatHost = document.getElementById("chatbot");
  let chatOpen = false;
  const drawChat = () => {
    if (!chatOpen) {
      chatHost.innerHTML = `<button class="chat-fab" type="button" aria-label="AI зөвлөх нээх" data-chat-open><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>`;
      document.body.classList.remove("chat-open");
      return;
    }
    document.body.classList.add("chat-open");
    chatHost.innerHTML = `<div class="chat-panel" role="dialog" aria-label="AI зөвлөх">
      <div class="chat-head"><div class="row"><span style="font-size:20px">✨</span><div><div class="semibold small">AI Зөвлөх</div><div class="xs" style="opacity:.85">${UB.store.settings().groqKey ? "Groq AI + мэдлэгийн сан" : "Үл хөдлөхийн туслах"}</div></div></div><button class="icon-btn" type="button" data-chat-close aria-label="Хаах">✕</button></div>
      <div class="chat grow" data-chat></div></div>`;
    const item = UB.current.item;
    UB.ui.chat(chatHost.querySelector("[data-chat]"), {
      greeting: item ? `Сайн байна уу! Та **${item.title}** байрыг үзэж байна. Энэ байрны эрсдэл, үнэ, гэрээний талаар асуугаарай.` : "Сайн байна уу! 👋 Би УБ Байрны AI зөвлөх байна. Үл хөдлөх хөрөнгө, түрээс, гэрээ, компанийн найдвартай байдлын талаар асуугаарай.",
      chips: item ? ["Үерийн эрсдэл хэр вэ?", "Үнэ нь хэвийн үү?", "Гэрээнд юу оруулах вэ?"] : ["Хан-Ууд 300 сая хүртэл 2 өрөө", "Барьцаа мөнгө яаж буцааж авах вэ?", "Луйврын шинж юу вэ?"],
      context: () => (UB.current.item ? UB.advisor.contextFor(UB.current.item) : null),
      onNavigate: () => {
        if (window.matchMedia("(max-width: 767px)").matches) {
          chatOpen = false;
          drawChat();
        }
      },
    });
  };
  chatHost.addEventListener("click", (ev) => {
    if (ev.target.closest("[data-chat-open]")) {
      chatOpen = true;
      drawChat();
    } else if (ev.target.closest("[data-chat-close]")) {
      chatOpen = false;
      drawChat();
    }
  });

  document.addEventListener("click", (ev) => {
    if (ev.target.closest("#menu-open") || ev.target.closest("[data-open-menu]")) document.body.classList.add("nav-open");
    if (ev.target.closest("#scrim")) document.body.classList.remove("nav-open");
    if (ev.target.closest("#nav-back")) history.length > 1 ? history.back() : UB.go("#/");
    if (ev.target.closest("[data-logout]")) {
      UB.store.logout();
      UB.toast("Системээс гарлаа.");
      UB.go("#/");
    }
    const img = ev.target.closest("[data-zoom]");
    if (img) UB.lightbox(img.getAttribute("src"));
  });

  UB.store.onAuth(() => renderNav(parseHash().path));
  window.addEventListener("hashchange", render);
  window.addEventListener("storage", () => renderNav(parseHash().path));
  drawChat();
  render();
})();
