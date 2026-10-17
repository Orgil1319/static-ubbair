(function () {
  const UB = window.UB;
  const DISCLAIMER = "*Санамж: Энэхүү систем нь зөвхөн зөвлөх зорилготой бөгөөд хуулийн баталгаа болохгүй.*";

  const SYSTEM_PROMPT = `Чи бол Үл хөдлөх хөрөнгийн салбарт 10 жил ажилласан, мэргэжлийн, найрсаг Монгол зөвлөх байна.
Хэрэглэгчийн асуултад маш тодорхой, соёлтой, цэвэр Монгол хэлний найруулгаар, товч хариул.
Зөвхөн доор өгсөн "Контекст" доторх мэдээлэлд тулгуурла. Мэдээлэл байхгүй бол өөрөөсөө бүү зохио, "мэдээлэл алга" гэж хэл.
Таны үүрэг:
- Иргэдэд байрны эрсдэлийг энгийн, ойлгомжтой монгол хэлээр тайлбарлах.
- Мэргэжлийн нэр томьёог тайлбарлах, айлгахгүй байх.
- Аливаа мэдээллийн эх сурвалжийг дурдах.
- Хариултын төгсгөлд "Санамж: Энэхүү систем нь зөвхөн зөвлөх зорилготой бөгөөд хуулийн баталгаа болохгүй." гэсэн анхааруулгыг заавал оруулна.`;

  const LAW = [
    { id: "318", tags: ["contract", "register"], title: "Иргэний хуулийн 318-р зүйл", text: "Орон сууц түрээслэх гэрээг заавал бичгээр байгуулна. Амаар хийсэн гэрээ маргаан гарсан үед хамгаалалт хангалтгүй." },
    { id: "318.4", tags: ["register", "contract"], title: "Иргэний хуулийн 318.4", text: "Түрээсийн гэрээг бичгээр байгуулж, үл хөдлөх хөрөнгийн улсын бүртгэлд бүртгүүлээгүй бол хүчин төгөлдөр бус гэж үзнэ. Гарын үсэг зурсны дараа Нийслэлийн УБЕГ-т бүртгүүлнэ." },
    { id: "204.1", tags: ["notice", "contract"], title: "Иргэний хуулийн 204.1", text: "Аль нэг тал гэрээнээс татгалзах буюу гэрээг цуцлах бол нөгөө талдаа урьдчилан (ихэвчлэн 30 хоногийн өмнө) бичгээр мэдэгдэх үүрэгтэй. Байрны эзэн түрээслэгчийг гэнэт гаргаж болохгүй." },
    { id: "deposit", tags: ["deposit", "contract"], title: "Барьцаа мөнгө", text: "Барьцаа мөнгийг гэрээ дуусмагц хохирол байхгүй бол бүрэн буцааж өгөх үүрэгтэй (жишиг гэрээнд 7 хоногийн дотор). Суутгал хийхэд баримтаар нотлох шаардлагатай, нотолгоогүй суутгахыг хориглоно." },
    { id: "early", tags: ["notice", "contract"], title: "Эрт гарах нөхцөл", text: "Түрээслэгч хугацаанаас өмнө гарах бол мэдэгдэх хугацааг баримтална; мэдэгдэлгүй гарвал ихэвчлэн 1 сарын түрээстэй тэнцэх нөхөн төлбөр төлнө. Байрны эзний буруугаас (ус, дулаан, цахилгаан тасарсан, засвар хийгдээгүй) гарсан бол нөхөн төлбөр хамаарахгүй." },
    { id: "utility", tags: ["contract"], title: "Нийтийн үйлчилгээ", text: "Цахилгаан, ус, халаалтын төлбөрийг хэн хариуцахыг гэрээнд тодорхой бичнэ." },
    { id: "repair", tags: ["repair", "contract"], title: "Засвар", text: "Барилгын их засварыг байрны эзэн, өдөр тутмын жижиг засварыг түрээслэгч хариуцах нь нийтлэг стандарт. Доголдлыг огноо, зурагтай тэмдэглэж, байрны эзэнд бичгээр мэдэгдэх нь нотолгоо болно." },
    { id: "inventory", tags: ["contract"], title: "Эд хогшлын жагсаалт", text: "Байрны тавилга, тоног төхөөрөмжийн жагсаалтыг гэрээний хавсралт болгож, хүлээлцэх үеийн зургийг хадгална." },
  ];

  const FRAUD = [
    "Үнэ нь ойр орчмынхоосоо хэт хямд (40%-аас доош) байвал болгоомжил.",
    "Үл хөдлөх хөрөнгийн гэрчилгээний эх хувийг харж, өмчлөгчийн нэр иргэний үнэмлэхтэй таарч байгааг шалга. e-mongolia-аас лавлагаа авч болно.",
    "Гэрээ байгуулаагүй, гэрчилгээ шалгаагүй байхад урьдчилгаа, барьцаа мөнгө бүү шилжүүл.",
    "\"Өнөөдөр л шийдэхгүй бол өөр хүн авна\" гэж яаруулах нь луйврын түгээмэл арга.",
    "Шинэ барилгын урьдчилгаа төлөхөөс өмнө компанийн тусгай зөвшөөрөл хүчинтэй эсэхийг [Хар жагсаалт](#/blacklist) хэсгээс шалга.",
  ];

  const INTENTS = [
    ["greet", ["сайн уу", "сайн байна", "сайн бн", "hello", "hi ", "sain bn", "мэнд"]],
    ["flood", ["үер", "усанд", "flood", "ver ", "бороо"]],
    ["risk", ["эрсдэл", "аюул", "найдвартай юу", "risk", "erdsel", "аюулгүй юу"]],
    ["price", ["үнэ", "хямд", "үнэтэй", "хөөс", "м2", "м²", "мкв", "price", "une "]],
    ["company", ["компани", "хар жагсаалт", "тусгай зөвшөөрөл", "ххк", "барилгын компани", "company", "license", "zuvshuurul"]],
    ["deposit", ["барьцаа", "deposit", "bartsaa"]],
    ["notice", ["мэдэгд", "цуцал", "цуцл", "хөөх", "хөөж", "гаргах", "эрт гар", "notice"]],
    ["register", ["бүртгүүл", "улсын бүртгэл", "убег", "318.4", "бүртгэлд"]],
    ["contract", ["гэрээ", "заалт", "contract", "geree"]],
    ["find", ["хайж", "хайх", "олж өг", "санал болго", "байр хэрэгтэй", "байр авмаар", "хүртэл", "төсөв", "search", "bair haij"]],
    ["fraud", ["луйвар", "хууран", "залил", "fraud", "урьдчилгаа", "гэрчилгээ"]],
    ["checklist", ["чек-лист", "чеклист", "юу анхаар", "юу шалга", "checklist"]],
    ["repair", ["засвар", "эвдэр", "гоож", "доголдол"]],
    ["amenity", ["сургууль", "цэцэрлэг", "school", "kindergarten"]],
    ["thanks", ["баярлалаа", "гоё", "thanks", "bayarlalaa"]],
  ];

  const detectIntents = (text) => {
    const t = ` ${UB.normalize(text)} `;
    const hits = [];
    INTENTS.forEach(([id, words]) => {
      const n = words.filter((w) => t.includes(w)).length;
      if (n) hits.push([id, n]);
    });
    return hits.sort((a, b) => b[1] - a[1]).map((h) => h[0]);
  };

  const STOP = new Set(["энэ", "тэр", "барилгын", "манай", "ямар", "ямар нэг", "сайн", "найдвартай", "уг", "нэг", "ийм", "тийм"]);
  const extractCompany = (text) => {
    const q = text.match(/["«“„']([^"»”']{2,60})["»”']/);
    if (q) return q[1].trim();
    const llc = text.match(/((?:[\p{L}\d\-]+\s){0,1}[\p{L}\d\-]+)\s*(?:ххк|хк|llc)(?=$|[\s.,!?\-])/iu);
    if (llc) return llc[1].trim();
    const before = text.match(/([\p{L}\d\-]+(?:\s[\p{L}\d\-]+)?)\s+компани/iu);
    if (before) {
      const words = before[1].split(" ").filter((w) => !STOP.has(w.toLowerCase()));
      if (words.length) return words.join(" ");
    }
    return "";
  };

  const parseFind = (text) => {
    const t = UB.normalize(text);
    let district = "";
    const map = [["Хан-Уул", ["хан-уу", "хан уу", "худ", "яармаг", "зайсан"]], ["Баянзүрх", ["баянзүрх", "бзд"]], ["Сүхбаатар", ["сүхбаатар", "сбд"]], ["Чингэлтэй", ["чингэлтэй", " чд"]], ["Баянгол", ["баянгол", "бгд"]], ["Сонгинохайрхан", ["сонгинохайрхан", "схд"]]];
    for (const [name, words] of map) if (words.some((w) => t.includes(w))) district = name;
    let maxPrice = 0;
    const tb = t.match(/(\d+(?:[.,]\d+)?)\s*тэрбум/);
    const say = t.match(/(\d+(?:[.,]\d+)?)\s*сая/);
    if (tb) maxPrice = parseFloat(tb[1].replace(",", ".")) * 1e9;
    else if (say) maxPrice = parseFloat(say[1].replace(",", ".")) * 1e6;
    const rm = t.match(/(\d)\s*өрөө/);
    return { district, maxPrice, rooms: rm ? Number(rm[1]) : 0 };
  };

  const findListings = ({ district, maxPrice, rooms }) => {
    const all = [...UB.data.approvedAds().map((a) => ({ ...a, riskScore: UB.data.riskFor(a).score })), ...UB.data.listings()];
    return all
      .filter((p) => (!district || p.district === district) && (!maxPrice || (p.price && p.price <= maxPrice)) && (!rooms || p.rooms === rooms))
      .sort((a, b) => (a.riskScore || 0) - (b.riskScore || 0) || a.price - b.price)
      .slice(0, 5);
  };

  const describeRisk = (ctx) => {
    const r = ctx.risk;
    const lines = [`**${ctx.item.title}** — эрсдэлийн оноо **${r.score}/100** (${{ low: "бага", medium: "дунд", high: "өндөр" }[r.level]}).`];
    r.items.filter((i) => i.severity !== "info" || i.type === "amenity").forEach((i) => lines.push(`- ${i.label}: ${i.description}`));
    lines.push(r.summary);
    return lines.join("\n");
  };

  const describeFlood = (ctx) => {
    const f = ctx.risk.items.find((i) => i.type === "flood");
    if (!f) return "Энэ байрны үерийн мэдээлэл олдсонгүй.";
    return `**${f.label}**\n${f.description}\nЭх сурвалж: ${f.source}.`;
  };

  const describePrice = (ctx) => {
    const pa = ctx.price;
    if (!pa || !pa.perM2) return "Энэ зарын үнэ эсвэл талбайн мэдээлэл дутуу тул үнийн шинжилгээ хийх боломжгүй.";
    const lines = [`Энэ байрны м² үнэ **${UB.mln(pa.perM2)}**, харьцуулалт: ${pa.referenceLabel} — дундаж **${UB.mln(pa.reference)}**.`];
    if (pa.diff !== null) {
      if (Math.abs(pa.diff) < 10) lines.push(`Үнэ орчин тойрныхоо дундажтай ойрхон байна (${pa.diff > 0 ? "+" : ""}${pa.diff.toFixed(0)}%).`);
      else if (pa.diff > 0) lines.push(`Үнэ дунджаас **${pa.diff.toFixed(0)}% өндөр** байна. Хэт үнэлэгдсэн байж болзошгүй тул үнэ тохирох боломжтой.`);
      else lines.push(`Үнэ дунджаас **${Math.abs(pa.diff).toFixed(0)}% бага** байна.${pa.diff <= -40 ? " Хэт хямд үнэ нь луйврын шинж байж болох тул гэрчилгээ, өмчлөгчийг заавал шалгаарай." : ""}`);
    }
    return lines.join("\n");
  };

  const lawText = (tags) =>
    LAW.filter((l) => l.tags.some((t) => tags.includes(t)))
      .map((l) => `- **${l.title}**: ${l.text}`)
      .join("\n");

  const companyAnswer = async (name) => {
    await UB.data.ensureLicenses();
    const res = UB.data.checkCompany(name);
    if (res.error) return res.error;
    if (!res.found) return `**"${name}"** нэр БХБЯ-ны тусгай зөвшөөрлийн жагсаалтад олдсонгүй. Энэ нь заавал муу гэсэн үг биш ч барилга угсралт хийх тусгай зөвшөөрөлгүй байж болзошгүй тул компаниас зөвшөөрлийн хуулбарыг шаардаарай. [Хар жагсаалт шалгах](#/blacklist?q=${encodeURIComponent(name)})`;
    const b = res.best;
    const status = res.status === "valid" ? "✅ тусгай зөвшөөрөл **хүчинтэй**" : "⛔ тусгай зөвшөөрлийн хугацаа **дууссан**";
    return `**${b.name}**${b.reg ? ` (РД ${b.reg})` : ""} — ${status}${b.to ? ` (дуусах: ${UB.fmtDate(b.to)})` : ""}.\nТөрөл: ${b.kind}; эх сурвалж: ${b.source}.${res.matches.length > 1 ? `\nӨөр ${res.matches.length - 1} төстэй нэр олдсон тул [дэлгэрэнгүйг](#/blacklist?q=${encodeURIComponent(name)}) харна уу.` : ""}`;
  };

  const localReply = async (text, ctx) => {
    const intents = detectIntents(text);
    const parts = [];
    const used = new Set();
    const add = (id, s) => {
      if (!used.has(id) && s) {
        used.add(id);
        parts.push(s);
      }
    };
    const company = extractCompany(text);

    for (const intent of intents.slice(0, 3)) {
      if (intent === "greet") add("greet", "Сайн байна уу! Би байрны эрсдэл, үнэ, гэрээ, компанийн тусгай зөвшөөрлийн талаар туслах зөвлөгч байна.");
      if (intent === "thanks") add("thanks", "Таньд баярлалаа! Өөр асуух зүйл байвал бичээрэй.");
      if (intent === "flood") add("flood", ctx && ctx.risk ? describeFlood(ctx) : "Байрны үерийн эрсдэлийг мэдэхийн тулд [Байр хайх](#/search) хэсгээс байраа сонгоод «🛡 Эрсдэл» табыг үзээрэй. Газрын зураг дээрх улаан хэсгүүд нь Нийслэлийн үерийн эрсдэлтэй бүсүүд юм.");
      if (intent === "risk") add("risk", ctx && ctx.risk ? describeRisk(ctx) : "Байр бүрийн эрсдэлийг үерийн бүс, барилгын нас, ашиглалтын байдал, үнийн хэвийн бус байдал зэргээр 0–100 оноогоор үнэлдэг. [Байр хайх](#/search) хэсгээс байраа сонгоно уу.");
      if (intent === "price") add("price", ctx && ctx.price ? describePrice(ctx) : `Улаанбаатарын зарын м² үнийн дундаж ойролцоогоор **${UB.mln(UB.data.cityMedian())}**. Тодорхой байрны үнийг ойр орчмын байртай харьцуулахын тулд байрны хуудасны «📊 Үнэ» табыг үзээрэй.`);
      if (intent === "company") {
        if (company) add("company", await companyAnswer(company));
        else if (ctx && ctx.item) add("company", "Энэ зард барилгын компанийн нэр байхгүй байна. Зарлагчаас компанийн нэрийг асуугаад, надад \"Компанийн нэр ХХК\" гэж бичвэл тусгай зөвшөөрлийг нь шалгаж өгнө.");
        else add("company", "Компанийн нэрийг бичээрэй, жишээ нь: *\"Давхар харш\" ХХК найдвартай юу?* Би БХБЯ-ны тусгай зөвшөөрлийн жагсаалтаас шалгаж өгнө.");
      }
      if (intent === "deposit") add("deposit", lawText(["deposit"]));
      if (intent === "notice") add("notice", lawText(["notice"]));
      if (intent === "register") add("register", lawText(["register"]));
      if (intent === "contract") add("contract", `Гэрээнд заавал байх ёстой зүйлс:\n${lawText(["contract"])}\n[Стандарт гэрээ үүсгэх](#/contracts/generate) · [Чек-лист](#/contracts/checklist)`);
      if (intent === "fraud") add("fraud", `Луйврын эрсдэлээс сэргийлэх зөвлөмж:\n${FRAUD.map((f) => `- ${f}`).join("\n")}`);
      if (intent === "checklist") add("checklist", "Гэрээ байгуулахын өмнө: бичгээр байгуулах, УБЕГ-т бүртгүүлэх, барьцааны нөхцөл, мэдэгдэх хугацаа, нийтийн үйлчилгээ, засвар, эд хогшлын жагсаалт. Дэлгэрэнгүйг [5 минутын чек-лист](#/contracts/checklist)-ээс үзээрэй.");
      if (intent === "repair") add("repair", `${lawText(["repair"])}\nДоголдлоо [Байрны дневник](#/diary)-т огноо, зурагтай тэмдэглэж аваарай.`);
      if (intent === "amenity") {
        const a = ctx && ctx.risk && ctx.risk.items.find((i) => i.type === "amenity");
        add("amenity", a ? `${a.label}. ${a.description}` : "Газрын зургийн «Боловсрол» давхаргыг асаавал сургууль, цэцэрлэгүүд харагдана. [Байр хайх](#/search)");
      }
      if (intent === "find") {
        const f = parseFind(text);
        const found = findListings(f);
        const cond = [f.district && `${f.district} дүүрэг`, f.maxPrice && `${UB.short(f.maxPrice)} хүртэл`, f.rooms && `${f.rooms} өрөө`].filter(Boolean).join(", ");
        add("find", found.length ? `${cond ? `${cond} — ` : ""}эрсдэл багатайгаас нь эрэмбэлсэн ${found.length} байр:\n${found.map((p) => `- [${p.title}](#/property/${p.id}) — ${UB.short(p.price)}${p.area ? `, ${p.area} м²` : ""}`).join("\n")}` : `${cond || "Таны нөхцөл"}-д тохирох байр олдсонгүй. Нөхцөлөө өөрчлөөд дахин асуугаарай.`);
      }
    }

    if (!parts.length && company) parts.push(await companyAnswer(company));
    if (!parts.length) {
      parts.push(
        ctx && ctx.item
          ? `Энэ байрны талаар дараахыг асууж болно:\n- "Үерийн эрсдэл хэр вэ?"\n- "Үнэ нь хэвийн үү?"\n- "Гэрээнд юу оруулах вэ?"\n- "Ойролцоо сургууль бий юу?"`
          : `Би дараах сэдвээр тусална:\n- Байр хайх: *"Хан-Ууд 300 сая хүртэл 2 өрөө"*\n- Компани шалгах: *"Давхар харш ХХК найдвартай юу?"*\n- Гэрээ, барьцаа, мэдэгдэх хугацаа, бүртгэл\n- Луйвраас сэргийлэх зөвлөмж`
      );
    }
    return { text: parts.join("\n\n"), intents, company };
  };

  const buildContext = async (text, ctx, local) => {
    const lines = [];
    if (ctx && ctx.item) {
      const p = ctx.item;
      lines.push(`Байр: ${p.title}; дүүрэг: ${p.district || "тодорхойгүй"}; үнэ: ${UB.money(p.price)}; талбай: ${p.area} м²; өрөө: ${p.rooms || "?"}; ашиглалтад орсон он: ${p.builtYear || "?"}.`);
      if (ctx.risk) lines.push(`Эрсдэлийн оноо: ${ctx.risk.score}/100. Хүчин зүйлс: ${ctx.risk.items.map((i) => `${i.label} — ${i.description}`).join(" | ")}`);
      if (ctx.price && ctx.price.perM2) lines.push(`Үнэ: м² ${UB.mln(ctx.price.perM2)}, харьцуулалт (${ctx.price.referenceLabel}) ${UB.mln(ctx.price.reference)}, зөрүү ${ctx.price.diff === null ? "?" : ctx.price.diff.toFixed(0) + "%"}.`);
    }
    lines.push(`Хуулийн мэдлэг: ${LAW.map((l) => `${l.title}: ${l.text}`).join(" | ")}`);
    lines.push(`Луйврын шинж: ${FRAUD.join(" ")}`);
    lines.push(`Системийн дотоод хариулт (баримт болгон ашигла): ${local.text}`);
    return lines.join("\n");
  };

  const groqReply = async (history, ctx, local) => {
    const s = UB.store.settings();
    const context = await buildContext(history[history.length - 1].content, ctx, local);
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${s.groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: s.groqModel || "llama-3.3-70b-versatile",
        temperature: 0.2,
        max_tokens: 900,
        messages: [{ role: "system", content: `${SYSTEM_PROMPT}\n\nКонтекст:\n${context}` }, ...history.slice(-8).map((m) => ({ role: m.role, content: m.content }))],
      }),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = await res.json();
    return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
  };

  const reply = async (history, ctx) => {
    const last = history[history.length - 1].content;
    const local = await localReply(last, ctx);
    const s = UB.store.settings();
    if (s.groqKey) {
      try {
        const text = await groqReply(history, ctx, local);
        if (text.trim()) return { text: text.includes("Санамж") ? text : `${text}\n\n${DISCLAIMER}`, mode: "groq" };
      } catch (e) {
        return { text: `${local.text}\n\n${DISCLAIMER}\n\n*(Groq AI-д холбогдож чадсангүй, офлайн мэдлэгийн сангаас хариуллаа.)*`, mode: "local" };
      }
    }
    return { text: `${local.text}\n\n${DISCLAIMER}`, mode: "local" };
  };

  const contextFor = (item) => {
    if (!item) return null;
    return { item, risk: UB.data.riskFor(item), price: item.price && item.area ? UB.data.priceAnalysis(item) : null };
  };

  UB.advisor = { reply, contextFor, DISCLAIMER, LAW, FRAUD };
})();
