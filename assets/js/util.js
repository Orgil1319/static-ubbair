(function () {
  const UB = (window.UB = window.UB || {});

  UB.routes = [];
  UB.route = (pattern, handler) => {
    const keys = [];
    const re = new RegExp(`^${pattern.replace(/\//g, "\\/").replace(/:(\w+)/g, (m, k) => (keys.push(k), "([^/]+)"))}\\/?$`);
    UB.routes.push({ re, keys, handler });
  };

  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  UB.esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

  UB.num = (n) => Math.round(Number(n) || 0).toLocaleString("en-US");
  UB.money = (n) => `${UB.num(n)} ₮`;
  UB.short = (n) => {
    const v = Number(n) || 0;
    if (v >= 1e9) return `${(v / 1e9).toFixed(2).replace(/\.?0+$/, "")} тэрбум ₮`;
    const m = v / 1e6;
    return `${m.toFixed(1).replace(/\.0$/, "")} сая ₮`;
  };
  UB.perM2 = (price, area) => (area > 0 ? price / area : 0);
  UB.mln = (v, d = 2) => `${(v / 1e6).toFixed(d)} сая ₮`;

  UB.today = () => new Date().toISOString().slice(0, 10);
  UB.fmtDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    const p = (x) => String(x).padStart(2, "0");
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
  };
  UB.daysFrom = (iso) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  UB.daysUntil = (iso) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);

  UB.uid = () => {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  };

  UB.debounce = (fn, ms) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  UB.parseQuery = (q) => {
    const out = {};
    new URLSearchParams(q || "").forEach((v, k) => (out[k] = v));
    return out;
  };
  UB.toQuery = (obj) => {
    const p = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") p.set(k, v);
    });
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  UB.toast = (msg, type = "") => {
    const box = document.getElementById("toasts");
    if (!box) return;
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), 3600);
  };

  UB.lightbox = (src) => {
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `<img src="${UB.esc(src)}" alt="Зураг">`;
    back.addEventListener("click", () => back.remove());
    document.body.appendChild(back);
  };

  UB.compressImage = (file, max = 1100, quality = 0.72) =>
    new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) return reject(new Error("Зөвхөн зураг оруулна уу."));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Зураг уншиж чадсангүй."));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Зургийн формат танигдсангүй."));
        img.onload = () => {
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

  UB.md = (text) => {
    const lines = UB.esc(text).split("\n");
    const html = [];
    let list = false;
    const inline = (s) =>
      s
        .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
        .replace(/\*(.+?)\*/g, "<i>$1</i>")
        .replace(/\[([^\]]+)\]\((#[^)\s]*|https?:\/\/[^)\s]+)\)/g, (m, label, href) => {
          const ext = href.startsWith("http");
          return `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`;
        });
    lines.forEach((line) => {
      const m = line.match(/^\s*[-•]\s+(.*)$/);
      if (m) {
        if (!list) {
          html.push("<ul>");
          list = true;
        }
        html.push(`<li>${inline(m[1])}</li>`);
        return;
      }
      if (list) {
        html.push("</ul>");
        list = false;
      }
      if (line.trim()) html.push(`<p>${inline(line)}</p>`);
    });
    if (list) html.push("</ul>");
    return html.join("");
  };

  UB.normalize = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/\s+/g, " ")
      .trim();

  UB.levenshtein = (a, b) => {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = new Array(b.length + 1);
    let cur = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      cur[0] = i;
      const ca = a.charCodeAt(i - 1);
      for (let j = 1; j <= b.length; j++) {
        const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      [prev, cur] = [cur, prev];
    }
    return prev[b.length];
  };
  UB.similarity = (a, b) => {
    const len = Math.max(a.length, b.length);
    return len ? 1 - UB.levenshtein(a, b) / len : 1;
  };

  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);
  UB.sha256 = (message) => {
    const bytes = new TextEncoder().encode(message);
    const bitLen = bytes.length * 8;
    const padLen = (((bytes.length + 9 + 63) >> 6) << 6);
    const data = new Uint8Array(padLen);
    data.set(bytes);
    data[bytes.length] = 0x80;
    const view = new DataView(data.buffer);
    view.setUint32(padLen - 4, bitLen >>> 0);
    view.setUint32(padLen - 8, Math.floor(bitLen / 0x100000000));
    const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
    const W = new Uint32Array(64);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let off = 0; off < padLen; off += 64) {
      for (let i = 0; i < 16; i++) W[i] = view.getUint32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
        const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        h = g;
        g = f;
        f = e;
        e = (d + t1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (t1 + t2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0;
      H[1] = (H[1] + b) >>> 0;
      H[2] = (H[2] + c) >>> 0;
      H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0;
      H[5] = (H[5] + f) >>> 0;
      H[6] = (H[6] + g) >>> 0;
      H[7] = (H[7] + h) >>> 0;
    }
    return Array.from(H, (x) => x.toString(16).padStart(8, "0")).join("");
  };

  UB.hashPassword = (password, salt) => {
    let h = `${salt}:${password}`;
    for (let i = 0; i < 2000; i++) h = UB.sha256(`${salt}${h}`);
    return h;
  };
})();
