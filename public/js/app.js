/* Lê /api/config (config.json) e monta a página. Não precisa editar aqui. */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const APPLE = "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701";
const ICONS = {
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".8" fill="currentColor"/>',
  github: '<path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 11v5M8 8v.01M12 16v-5M12 13c0-1.2 1-2 2-2s2 .8 2 2v3"/>',
  telegram: '<path d="M21 4 3 11l5.5 2L10 19l3-4 4.5 3.5z"/><path d="m8.5 13 8-6"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L12 6.3M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7L12 17.7"/>'
};
// Placeholders da galeria (usados quando "src" está vazio)
const PH = ["linear-gradient(150deg,#CFE8FA,#7DB8F0)", "linear-gradient(150deg,#FFF1CC,#F9C964)", "linear-gradient(150deg,#EBF4FA,#9CCBF5)", "linear-gradient(150deg,#7DB8F0,#0071E3)"];
let CONFIG;

async function boot() {
  try {
    const r = await fetch("/api/config", { cache: "no-store" });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || r.statusText);
    CONFIG = data;
  } catch (e) {
    document.body.insertAdjacentHTML("beforeend", `<div class="cfg-error" role="alert"><div><h2>Erro no config.json</h2><p>${esc(e.message)}</p></div></div>`);
    return;
  }
  applyTheme(); loadFonts(); renderText(); renderSocials(); renderProjects(); renderGallery(); initCountdown(); initNav(); initMotion(); initLiveGlass();
}

/* ---- Tema e fontes ---- */
function applyTheme() {
  const root = document.documentElement.style;
  Object.entries(CONFIG.theme || {}).forEach(([k, v]) => root.setProperty("--" + k.replace(/[A-Z]/g, m => "-" + m.toLowerCase()), v));
  const s = CONFIG.site || {};
  if (s.language) document.documentElement.lang = s.language;
  if (s.themeColor) $('meta[name="theme-color"]').content = s.themeColor;
  if (s.description) $('meta[name="description"]').content = s.description;
}
function loadFonts() {
  const css = (CONFIG.fonts || []).map(f => `@font-face{font-family:"${f.family}";src:url("/fonts/${encodeURI(f.file)}");font-weight:${f.weight};font-style:normal;font-display:swap}`).join("");
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
}

/* ---- Textos ---- */
function renderText() {
  const p = CONFIG.profile, a = CONFIG.about;
  $$(".apple").forEach(el => el.setAttribute("d", APPLE));
  const map = { firstName: p.displayName.split(" ")[0], displayName: p.displayName, signature: p.signature, intro: p.intro, role: p.role, aboutTitle: a.title, copyright: `© ${new Date().getFullYear()} ${p.fullName}` };
  $$("[data-bind]").forEach(el => { const v = map[el.dataset.bind]; if (v != null) el.textContent = v; });
  document.title = `${p.fullName} — Apple Lover · ${p.role}`;
  $("#aboutText").innerHTML = a.paragraphs.map(t => `<p>${esc(t)}</p>`).join("");
  $("#chips").innerHTML = a.chips.map(c => `<li>${esc(c)}</li>`).join("");
  if (a.portrait) {
    const img = new Image(); img.alt = p.fullName; img.loading = "lazy"; img.src = a.portrait;
    img.onerror = () => img.remove(); $("#portrait").prepend(img);
  }
}

function renderSocials() {
  const html = CONFIG.socials.map(s => {
    const svg = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[s.icon] || ICONS.link}</svg>`;
    return s.url
      ? `<li><a class="soc glass" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${svg}${esc(s.name)}</a></li>`
      : `<li><span class="soc glass off" title="Adicione a URL em config.json">${svg}${esc(s.name)}</span></li>`;
  }).join("");
  $("#heroSocials").innerHTML = html;
}

/* ---- Projetos (bento) ---- */
function renderProjects() {
  $("#projGrid").innerHTML = CONFIG.projects.map((p, i) => {
    const tag = p.url ? "a" : "article";
    const attrs = p.url ? ` href="${esc(p.url)}" target="_blank" rel="noopener noreferrer"` : "";
    return `<${tag} class="card glass rv${p.featured ? " featured" : ""}" style="--d:${(i % 3) * .08}s"${attrs}>
      ${p.url ? '<i class="ic lk" aria-hidden="true">&#x100263;</i>' : ""}<span class="cat">${esc(p.category)}</span><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>
      <ul class="tags">${(p.tags || []).map(t => `<li>${esc(t)}</li>`).join("")}</ul>
      ${p.url ? '<span class="go">Ver projeto <i class="ic" aria-hidden="true">&#x10012F;</i></span>' : ""}</${tag}>`;
  }).join("");
}

/* ---- Galeria + lightbox ---- */
function placeholder(g, i = 0) {
  const d = document.createElement("div"); d.className = "ph"; d.style.setProperty("--bg-ph", PH[i % PH.length]);
  d.textContent = g.src ? "Imagem não encontrada" : "Sua foto aqui"; return d;
}
function renderGallery() {
  const box = $("#masonry");
  CONFIG.gallery.forEach((g, i) => {
    const b = document.createElement("button");
    b.className = "shot rv"; b.type = "button";
    b.style.setProperty("--ratio", g.ratio || "4/5"); b.style.setProperty("--d", (i % 3) * .08 + "s");
    b.setAttribute("aria-label", `Ampliar: ${g.alt}`);
    if (g.src) {
      const img = new Image(); img.src = g.src; img.alt = g.alt; img.loading = "lazy"; img.decoding = "async";
      img.onerror = () => img.replaceWith(placeholder(g, i)); b.appendChild(img);
    } else b.appendChild(placeholder(g, i));
    b.addEventListener("click", () => openLB(g, b, i));
    box.appendChild(b);
  });
}
let lastFocus = null;
function openLB(g, trigger, i) {
  lastFocus = trigger; const body = $("#lbBody"); body.innerHTML = "";
  if (g.src) { const im = new Image(); im.src = g.src; im.alt = g.alt; body.appendChild(im); } else body.appendChild(placeholder(g, i));
  $("#lb").classList.add("open"); $("#lbClose").focus();
}
function closeLB() { $("#lb").classList.remove("open"); lastFocus?.focus(); }

/* ---- Contagem regressiva ---- */
function initCountdown() {
  const b = CONFIG.birthday, sec = $("#birthday"), note = $("#bNote");
  if (!b || !b.month || !b.day) { sec.hidden = true; $$("a[href='#birthday']").forEach(a => a.parentElement.remove()); return; }
  const set = (id, v) => { const el = $("#" + id), t = String(v).padStart(2, "0"); if (el.firstChild.textContent !== t) { const s = document.createElement("span"); s.textContent = t; el.replaceChildren(s); } };
  const target = () => {
    const n = new Date(); let t = new Date(n.getFullYear(), b.month - 1, b.day, b.hour || 0, b.minute || 0);
    if (n > new Date(n.getFullYear(), b.month - 1, b.day, 23, 59, 59)) t = new Date(n.getFullYear() + 1, b.month - 1, b.day, b.hour || 0, b.minute || 0);
    return t;
  };
  const tick = () => {
    const n = new Date(), t = target(); let diff = t - n;
    const party = n.getMonth() === b.month - 1 && n.getDate() === b.day;
    sec.classList.toggle("party", party);
    if (party) { $("#bTitle").textContent = "🎉 Hoje é o aniversário do dev!"; note.textContent = `Parabéns, ${CONFIG.profile.displayName.split(" ")[0]}!`; confetti(); diff = 0; }
    else { $("#bTitle").textContent = "Próximo aniversário"; note.textContent = `Em ${t.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}.`; }
    const s = Math.max(0, Math.floor(diff / 1000));
    set("n-d", Math.floor(s / 86400)); set("n-h", Math.floor(s % 86400 / 3600)); set("n-m", Math.floor(s % 3600 / 60)); set("n-s", s % 60);
  };
  tick(); setInterval(tick, 1000);
}
let confettiDone = false;
function confetti() {
  if (confettiDone) return; confettiDone = true;
  const c = $("#confetti"), cols = ["#F59E0B", "#0071E3", "#CFE8FA", "#FFFFFF"];
  for (let i = 0; i < 40; i++) {
    const e = document.createElement("i");
    e.style.cssText = `left:${Math.random() * 100}%;background:${cols[i % 4]};animation-duration:${3 + Math.random() * 3}s;animation-delay:${Math.random() * 3}s`;
    c.appendChild(e);
  }
}

/* ---- Navegação ---- */
function initNav() {
  const nav = $("#nav"), burger = $("#burger"), links = $("#links");
  const toggle = open => { links.classList.toggle("open", open); burger.setAttribute("aria-expanded", open); };
  burger.addEventListener("click", () => toggle(!links.classList.contains("open")));
  $$("a", links).forEach(a => a.addEventListener("click", () => toggle(false)));
  addEventListener("keydown", e => { if (e.key === "Escape") { toggle(false); closeLB(); } });
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 24);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  addEventListener("click", e => { if (!nav.contains(e.target)) toggle(false); });
  addEventListener("resize", () => toggle(false));
  const map = new Map($$("a", links).map(a => [a.getAttribute("href").slice(1), a]));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { map.forEach(a => a.classList.remove("active")); map.get(e.target.id)?.classList.add("active"); } }), { rootMargin: "-45% 0px -50% 0px" });
  $$("main section").forEach(s => io.observe(s));
  $("#lbClose").addEventListener("click", closeLB);
  $("#lb").addEventListener("click", e => { if (e.target.id === "lb") closeLB(); });
}

/* ---- Reveal + parallax ---- */
function initMotion() {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
  $$(".rv").forEach(el => io.observe(el));
  const layers = $$("[data-speed]"); let ticking = false;
  const run = () => { const y = scrollY; if (y < innerHeight * 1.2) layers.forEach(l => l.style.transform = `translate3d(0,${y * l.dataset.speed}px,0)`); ticking = false; };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
}

/* Proteção leve: sem botão direito e sem arrastar nas fotos */
addEventListener("contextmenu", e => { if (e.target.closest?.(".shot, .lb, .portrait")) e.preventDefault(); });
addEventListener("dragstart", e => { if (e.target.tagName === "IMG") e.preventDefault(); });

boot();

/* ---- Liquid Glass AO VIVO na navbar (sem captura, sem biblioteca) ----
   O navegador aplica o filtro direto no que está atrás da navbar, em tempo real:
   backdrop-filter + um filtro SVG (feDisplacementMap) com um mapa de refração gerado uma única vez.
   Funciona em navegadores Chromium (Chrome, Edge, Brave, Arc). Safari/Firefox ficam com o vidro fosco em CSS.
   Ajustes no config.json: "liquidGlass": { "enabled": true, "nav": { "bezel": 16, "shift": 14, "blur": 1.5, "saturate": 1.6 } }
   bezel = largura da borda que entorta a imagem (px) | shift = quanto entorta (px) | blur = desfoque do fundo (px) */
function initLiveGlass() {
  const cfg = CONFIG.liquidGlass || {};
  if (cfg.enabled === false) return;
  if (!navigator.userAgentData?.brands?.some(b => /Chromium/i.test(b.brand))) return;
  if (matchMedia("(prefers-reduced-transparency: reduce)").matches) return;
  const nav = $("#nav");
  const o = { bezel: 18, shift: 10, blur: 4, saturate: 1.5, tint: .30, tintScrolled: .55, blurScrolled: 10, ...(cfg.nav || {}) };
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "0"); svg.setAttribute("height", "0"); svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "position:absolute;pointer-events:none";
  svg.innerHTML = `<filter id="lgFilter" filterUnits="userSpaceOnUse" x="0" y="0" width="10" height="10" color-interpolation-filters="sRGB">
    <feImage id="lgMap" x="0" y="0" width="10" height="10" preserveAspectRatio="none" result="map"/>
    <feDisplacementMap in="SourceGraphic" in2="map" scale="${o.shift * 2}" xChannelSelector="R" yChannelSelector="G"/></filter>`;
  document.body.appendChild(svg);
  const filter = svg.querySelector("filter"), img = svg.querySelector("feImage");

  // Mapa de refração de uma pílula w×h: perto da borda, empurra a amostra para dentro (R = x, G = y; 128 = sem deslocamento).
  const build = () => {
    const w = Math.round(nav.offsetWidth), h = Math.round(nav.offsetHeight);
    if (!w || !h) return;
    const r = h / 2, B = Math.min(o.bezel, r);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d"), im = g.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const px = x + .5, py = y + .5, cx = Math.min(Math.max(px, r), w - r);
      const dx = cx - px, dy = r - py, len = Math.hypot(dx, dy) || 1;
      const depth = Math.max(0, r - len);
      const t = depth < B ? 1 - depth / B : 0, m = t * t * (3 - 2 * t) * t; // suave: some devagar rumo ao centro, sem "corte" visível
      const i = (y * w + x) * 4;
      d[i] = 128 + (dx / len) * m * 127; d[i + 1] = 128 + (dy / len) * m * 127; d[i + 2] = 128; d[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    [filter, img].forEach(n => { n.setAttribute("width", w); n.setAttribute("height", h); });
    img.setAttribute("href", c.toDataURL());
  };
  build();
  const set = (k, v) => nav.style.setProperty(k, v);
  set("--lg-blur", o.blur + "px"); set("--lg-blur-s", o.blurScrolled + "px"); set("--lg-sat", o.saturate); set("--lg-tint", o.tint); set("--lg-tint-s", o.tintScrolled);
  nav.classList.add("lg-live");
  let raf = 0; new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(build); }).observe(nav);
}