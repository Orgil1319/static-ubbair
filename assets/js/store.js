(function () {
  const UB = window.UB;
  const PREFIX = "ubbair:v1:";
  const KEYS = ["users", "session", "ads", "contracts", "diary", "checklist", "settings"];
  const memory = {};

  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return key in memory ? memory[key] : fallback;
    }
  };

  const write = (key, value) => {
    memory[key] = value;
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      UB.toast("Browser-ийн санах ой дүүрсэн тул хадгалж чадсангүй. Хуучин зураг, зараа устгаад дахин оролдоно уу.", "err");
      return false;
    }
  };

  const ADMIN_EMAIL = "admin@ubbair.mn";
  const ADMIN_PASSWORD = "admin1234";

  const ensureSeed = () => {
    const users = read("users", []);
    if (!users.some((u) => u.email === ADMIN_EMAIL)) {
      const salt = UB.uid();
      users.push({
        id: UB.uid(),
        email: ADMIN_EMAIL,
        name: "Демо админ",
        salt,
        hash: UB.hashPassword(ADMIN_PASSWORD, salt),
        isAdmin: true,
        createdAt: new Date().toISOString(),
      });
      write("users", users);
    }
  };

  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => fn());

  const store = {
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    read,
    write,
    onAuth: (fn) => listeners.add(fn),

    users: () => read("users", []),
    currentUser: () => {
      const session = read("session", null);
      if (!session) return null;
      return store.users().find((u) => u.id === session.userId) || null;
    },
    register: ({ email, password, name }) => {
      const users = store.users();
      const mail = String(email || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) throw new Error("И-мэйл хаяг буруу байна.");
      if (String(password || "").length < 6) throw new Error("Нууц үг дор хаяж 6 тэмдэгт байна.");
      if (users.some((u) => u.email === mail)) throw new Error("Энэ и-мэйлээр бүртгэл үүссэн байна. Нэвтэрнэ үү.");
      const salt = UB.uid();
      const user = {
        id: UB.uid(),
        email: mail,
        name: String(name || "").trim(),
        salt,
        hash: UB.hashPassword(password, salt),
        isAdmin: false,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      write("users", users);
      write("session", { userId: user.id, at: Date.now() });
      emit();
      return user;
    },
    login: ({ email, password }) => {
      const mail = String(email || "").trim().toLowerCase();
      const user = store.users().find((u) => u.email === mail);
      if (!user || UB.hashPassword(password || "", user.salt) !== user.hash) {
        throw new Error("И-мэйл эсвэл нууц үг буруу байна.");
      }
      write("session", { userId: user.id, at: Date.now() });
      emit();
      return user;
    },
    logout: () => {
      write("session", null);
      emit();
    },

    ads: () => read("ads", []),
    saveAds: (ads) => write("ads", ads),
    addAd: (ad) => {
      const ads = store.ads();
      ads.unshift(ad);
      return store.saveAds(ads);
    },
    updateAd: (id, patch) => {
      const ads = store.ads().map((a) => (a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a));
      return store.saveAds(ads);
    },
    deleteAd: (id) => store.saveAds(store.ads().filter((a) => a.id !== id)),

    contracts: () => read("contracts", []),
    saveContracts: (list) => write("contracts", list),
    getContract: (id) => store.contracts().find((c) => c.id === id) || null,
    updateContract: (id, patch) => store.saveContracts(store.contracts().map((c) => (c.id === id ? { ...c, ...patch } : c))),
    deleteContract: (id) => store.saveContracts(store.contracts().filter((c) => c.id !== id)),

    diary: () => read("diary", []),
    saveDiary: (list) => write("diary", list),

    checklist: () => read("checklist", {}),
    saveChecklist: (v) => write("checklist", v),

    settings: () => ({ baseMap: "esri", groqKey: "", groqModel: "llama-3.3-70b-versatile", cartoKey: "", ...read("settings", {}) }),
    saveSettings: (patch) => write("settings", { ...store.settings(), ...patch }),

    exportAll: () => {
      const out = { app: "ubbair", version: 1, exportedAt: new Date().toISOString() };
      KEYS.forEach((k) => (out[k] = read(k, null)));
      return out;
    },
    importAll: (payload) => {
      if (!payload || payload.app !== "ubbair") throw new Error("Энэ файл УБ Байрны нөөц файл биш байна.");
      KEYS.forEach((k) => {
        if (k in payload && payload[k] !== null) write(k, payload[k]);
      });
      ensureSeed();
      emit();
    },
    resetAll: () => {
      KEYS.forEach((k) => {
        try {
          localStorage.removeItem(PREFIX + k);
        } catch (e) {
          delete memory[k];
        }
      });
      ensureSeed();
      emit();
    },
  };

  UB.store = store;
  ensureSeed();
})();
