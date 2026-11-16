(() => {
  const S = window.STAND, CARS = window.CARROS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $("#app");
  const ic = (n, cls = "") => `<svg class="ic ${cls}"><use href="#i-${n}"/></svg>`;
  const img = (car, i = 0, s = 0) => `https://cdn.easysite.pt/pub/7325/${car.id}/API_NCAUTO_${car.fotos[i]}-${s}.webp`; // 0 = 2048px · 6 = 800px · 4 = 480px
  const MES = { JAN:"Jan.", FEV:"Fev.", MAR:"Mar.", ABR:"Abr.", MAI:"Mai.", JUN:"Jun.", JUL:"Jul.", AGO:"Ago.", SET:"Set.", OUT:"Out.", NOV:"Nov.", DEZ:"Dez." };
  const regFmt = r => { const [m, y] = r.split(" "); return `${MES[m] || m} ${y}`; };
  const ano = c => +c.registo.split(" ")[1];
  const mesN = c => Object.keys(MES).indexOf(c.registo.split(" ")[0]);
  const num = n => n.toLocaleString("pt-PT").replace(/\./g, " ").replace(/ /g, " ");
  const priceHTML = c => {
    if (!c.preco) return `<span class="consulta">Sob/Consulta</span>`;
    const s = num(c.preco).split(" ");
    return s.length > 1 ? `${s[0]}<em> ${s.slice(1).join(" ")} €</em>` : `${s[0]}<em> €</em>`;
  };
  const ribbon = (c, lg = false) => {
    let t = "", k = "";
    if (c.status === "VENDIDO") { t = "VENDIDO"; k = "vendido"; }
    else if (c.status === "RESERVADO") { t = "RESERVADO"; k = "reservado"; }
    else if (c.garantia === "Fábrica") { t = "GARANTIA DE FÁBRICA"; k = "garantia"; }
    else if (c.origem === "Nacional") { t = "NACIONAL"; k = ""; }
    return t ? `<div class="ribbon ${k} ${lg ? "lg" : ""}"><span>${t}</span></div>` : "";
  };
  const toast = msg => { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("on"), 2800); };

  /* ---------- Estado dos filtros ---------- */
  const slug = s => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const F = { marca: "", modelo: "", fuel: "", seg: "", pmax: "", ano: "", chip: "todos", sort: "recente" };
  const CHIPS = [
    ["todos", "Todos"], ["Porsche", "Porsche"], ["Mercedes-Benz", "Mercedes-Benz"], ["Aston Martin", "Aston Martin"],
    ["suv", "SUV"], ["cabrio", "Cabrio"], ["garantia", "Garantia de fábrica"], ["nacional", "Nacional"], ["classicos", "Clássicos"], ["vendidos", "Vendidos"]
  ];
  const fuelGroup = c => /Híbrido/i.test(c.combustivel) ? "Híbrido" : /Gasóleo/i.test(c.combustivel) ? "Gasóleo" : /Elé/i.test(c.combustivel) ? "Elétrico" : "Gasolina";
  const segGroup = c => /SUV/i.test(c.segmento) ? "SUV" : c.segmento.split(" ")[0];
  function filtered() {
    let r = CARS.filter(c => {
      if (F.marca && c.marca !== F.marca) return false;
      if (F.modelo && !c.modelo.startsWith(F.modelo)) return false;
      if (F.fuel && fuelGroup(c) !== F.fuel) return false;
      if (F.seg && segGroup(c) !== F.seg) return false;
      if (F.pmax && c.preco > +F.pmax) return false;
      if (F.ano && ano(c) < +F.ano) return false;
      switch (F.chip) {
        case "todos": return true;
        case "suv": return /SUV/i.test(c.segmento);
        case "cabrio": return /Cabrio/i.test(c.segmento);
        case "garantia": return c.garantia === "Fábrica";
        case "nacional": return c.origem === "Nacional";
        case "classicos": return ano(c) <= 2005;
        case "vendidos": return c.status === "VENDIDO";
        default: return slug(c.marca) === slug(F.chip);
      }
    });
    const by = {
      recente: () => 0,
      az: (a, b) => (a.marca + a.modelo).localeCompare(b.marca + b.modelo),
      za: (a, b) => (b.marca + b.modelo).localeCompare(a.marca + a.modelo),
      pasc: (a, b) => a.preco - b.preco,
      pdesc: (a, b) => b.preco - a.preco,
      novos: (a, b) => (ano(b) * 12 + mesN(b)) - (ano(a) * 12 + mesN(a)),
      antigos: (a, b) => (ano(a) * 12 + mesN(a)) - (ano(b) * 12 + mesN(b))
    }[F.sort];
    return F.sort === "recente" ? r : [...r].sort(by);
  }
  const modelBase = m => m.split(" ")[0];

  /* ---------- Card ---------- */
  /* ---------- Cinta de marcas ---------- */
  const BRANDS = ["Porsche", "Ferrari", "Mercedes-Benz", "Lamborghini", "Aston Martin", "Bentley", "BMW", "McLaren", "Audi", "Land Rover", "Maserati"];
  function brandsHTML() {
    const inStock = new Set(CARS.filter(c => c.status !== "VENDIDO").map(c => c.marca));
    const list = [...new Set([...BRANDS, ...inStock])].filter(m => document.getElementById("i-b-" + slug(m)));
    const item = (m, hid) => `<a class="brand-it ${inStock.has(m) ? "has" : ""}" href="${inStock.has(m) ? "#/viaturas/" + slug(m) : "#/contactos"}" title="${inStock.has(m) ? "Ver " + m + " em stock" : m + " — sob consulta"}" ${hid ? 'tabindex="-1" aria-hidden="true"' : ""}><svg class="ic"><use href="#i-b-${slug(m)}"/></svg><span>${m}</span></a>`;
    return `<section class="brands" aria-label="Marcas">
      <p class="brands-ttl">As melhores marcas do mundo</p>
      <div class="brands-view"><div class="brands-track">${list.map(m => item(m, 0)).join("")}${list.map(m => item(m, 1)).join("")}</div></div>
    </section>`;
  }

  function cardHTML(c) {
    const n = Math.min(c.fotos.length, 5);
    return `<article class="card ${c.status === "VENDIDO" ? "is-sold" : ""}" data-id="${c.id}">
      <a class="card-link" href="#/viatura/${c.id}" aria-label="${c.marca} ${c.modelo}"></a>
      <div class="card-media" data-i="0" data-n="${n}">
        ${ribbon(c)}
        ${Array.from({ length: n }, (_, i) => `<img ${i ? `data-src="${img(c, i, 6)}"` : `src="${img(c, 0, 6)}"`} class="${i ? "" : "on"}" alt="${c.marca} ${c.modelo} — foto ${i + 1}" loading="lazy" decoding="async">`).join("")}
        <button class="card-nav prev" data-step="-1" aria-label="Foto anterior">${ic("left")}</button>
        <button class="card-nav next" data-step="1" aria-label="Foto seguinte">${ic("right")}</button>
        <div class="dots">${Array.from({ length: n }, (_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>
      </div>
      <div class="card-meta">
        <span>${ic("cal")}${regFmt(c.registo)}</span>
        <span>${ic("fuel")}${fuelGroup(c)}</span>
        <span>${ic("road")}${num(c.km)} km</span>
      </div>
      <div class="card-body"><h3>${c.marca}</h3><p>${c.modelo}</p></div>
      <div class="card-foot">
        <div class="price"><small>Preço</small><strong>${priceHTML(c)}</strong></div>
        <button class="more" data-qv aria-label="Ver resumo rápido">${ic("dots")}</button>
      </div>
      <div class="qv" aria-hidden="true">
        <button class="qv-close" data-qv-close aria-label="Fechar">${ic("x")}</button>
        <h4>${c.marca}</h4><p>${c.modelo}</p>
        <ul>
          <li>${ic("gauge")}<div><small>Potência</small>${c.cv} cv</div></li>
          <li>${ic("engine")}<div><small>Cilindrada</small>${num(c.cc)} cc</div></li>
          <li>${ic("gear")}<div><small>Caixa</small>${c.transmissao}</div></li>
          <li>${ic("car")}<div><small>Segmento</small>${c.segmento}</div></li>
          <li>${ic("palette")}<div><small>Cor</small>${c.cor.split(" (")[0]}</div></li>
          <li>${ic("award")}<div><small>Garantia</small>${c.garantia}</div></li>
        </ul>
        <div class="qv-actions">
          <a class="btn btn-primary" href="#/viatura/${c.id}">Ver viatura</a>
          <a class="btn btn-ghost" href="tel:${S.telefoneLink}">${ic("phone")}Ligar</a>
        </div>
      </div>
    </article>`;
  }

  /* ---------- HOME ---------- */
  function renderHome(target) {
    const heroCars = CARS.filter(c => !c.status).slice(0, 5);
    const marcas = [...new Set(CARS.map(c => c.marca))].sort();
    const stockN = CARS.filter(c => c.status !== "VENDIDO").length;
    app.innerHTML = `
    <section class="hero" id="hero">
      ${heroCars.map((c, i) => `<div class="hero-slide ${i ? "" : "on"}"><img src="${img(c, 0)}" alt="${c.marca} ${c.modelo}" ${i ? 'loading="lazy" decoding="async"' : 'fetchpriority="high"'}></div>`).join("")}
      <button class="hero-nav prev" data-h="-1" aria-label="Viatura anterior">${ic("left")}</button>
      <button class="hero-nav next" data-h="1" aria-label="Viatura seguinte">${ic("right")}</button>
      <div class="hero-txt"><div class="wrap"><span class="eyebrow">Stand automóvel · Lisboa</span><h1>Que viatura procura?</h1><div class="hero-dots">${heroCars.map((_, i) => `<button type="button" data-hd="${i}" class="${i ? "" : "on"}" aria-label="Viatura ${i + 1}"></button>`).join("")}</div></div></div>
      <div class="hero-car" id="heroCar"></div>
    </section>

    <div class="search wrap">
      <form class="search-box" id="searchForm">
        <div class="field"><label for="sMarca">Marca</label><select id="sMarca"><option value="">Todas</option>${marcas.map(m => `<option>${m}</option>`).join("")}</select></div>
        <div class="field"><label for="sModelo">Modelo</label><select id="sModelo"><option value="">Todos</option></select></div>
        <button class="search-go" type="submit"><b id="sCount">${CARS.length}</b><span>viaturas</span>${ic("right")}</button>
      </form>
      <div class="search-more"><button type="button" id="advBtn">${ic("plus")}Pesquisa detalhada</button></div>
      <div class="adv" id="adv">
        <div class="f"><label>Combustível</label><select data-f="fuel"><option value="">Todos</option><option>Gasolina</option><option>Gasóleo</option><option>Híbrido</option></select></div>
        <div class="f"><label>Segmento</label><select data-f="seg"><option value="">Todos</option><option>SUV</option><option>Cabrio</option><option>Coupé</option><option>Sedan</option></select></div>
        <div class="f"><label>Preço até</label><select data-f="pmax"><option value="">Sem limite</option><option value="50000">50 000 €</option><option value="100000">100 000 €</option><option value="150000">150 000 €</option><option value="200000">200 000 €</option></select></div>
        <div class="f"><label>Ano a partir de</label><select data-f="ano"><option value="">Qualquer</option><option>2015</option><option>2020</option><option>2023</option><option>2025</option></select></div>
      </div>
    </div>

    <section class="sec" style="padding-bottom:20px">
      <div class="sec-head"><h2>Últimas entradas</h2><span class="eyebrow">Os mais recentes</span></div>
      <div class="latest">${CARS.filter(c => c.status !== "VENDIDO").slice(0, 10).map(c => `
        <a class="latest-item" href="#/viatura/${c.id}"><img src="${img(c, 0, 6)}" alt="" loading="lazy" decoding="async"><div><b>${c.marca}</b><span>${c.modelo}</span></div></a>`).join("")}
      </div>
    </section>

    ${brandsHTML()}

    <section class="sec" id="stock">
      <div class="wrap">
        <div class="sec-head"><h2>Stock Carros de Selecção</h2><span class="eyebrow">Viaturas seleccionadas</span></div>
        <div class="stock-tools">
          <div class="chips" id="chips">${CHIPS.map(([k, l]) => `<button class="chip ${F.chip === k ? "on" : ""}" data-chip="${k}">${l}</button>`).join("")}</div>
          <label class="sort">Ordenar por:
            <select id="sort">
              <option value="recente">Mais recentes</option><option value="az">Marca: A a Z</option><option value="za">Marca: Z a A</option>
              <option value="pasc">Preço mais baixo</option><option value="pdesc">Preço mais alto</option>
              <option value="novos">Mais novos (ano)</option><option value="antigos">Mais antigos (ano)</option>
            </select>
          </label>
        </div>
        <div class="grid" id="grid"></div>
      </div>
    </section>

    <section class="sec" id="servicos">
      <div class="wrap">
        <div class="sec-head"><h2>Serviços</h2><span class="eyebrow">Simples, rápido e transparente</span></div>
        <div class="services">
          <div class="svc"><div class="svc-ic">${ic("euro")}</div><h3>Financiamento</h3><p>Crédito automóvel à sua medida, com simulação rápida e sem compromisso.</p><a href="#/credito">Pedir financiamento ${ic("right")}</a></div>
          <div class="svc"><div class="svc-ic">${ic("key")}</div><h3>Compramos o seu carro</h3><p>Avaliamos a sua viatura e apresentamos uma proposta, sem compromisso.</p><a href="#/compramos">Pedir avaliação ${ic("right")}</a></div>
          <div class="svc"><div class="svc-ic">${ic("search")}</div><h3>Consultadoria</h3><p>Não encontra o carro que procura? Nós procuramos, verificamos e tratamos de tudo.</p><a href="#/consultadoria">Pedir ajuda ${ic("right")}</a></div>
          <div class="svc"><div class="svc-ic">${ic("shield")}</div><h3>Garantia</h3><p>Viaturas com garantia de fábrica ou garantia do stand. Compre com total tranquilidade.</p><a href="#/viaturas/garantia">Ver viaturas ${ic("right")}</a></div>
        </div>
        <div class="trust">
          <div><b>${stockN}</b><span>Viaturas em stock</span></div>
          <div><b>${marcas.length}</b><span>Marcas premium</span></div>
          <div><b>${CARS.filter(c => c.garantia === "Fábrica").length}</b><span>Com garantia de fábrica</span></div>
          <div><b>${CARS.filter(c => c.origem === "Nacional").length}</b><span>Viaturas nacionais</span></div>
        </div>
      </div>
    </section>

    <section class="sec" id="empresa" style="padding-top:20px">
      <div class="wrap about">
        <img src="${img(CARS[0], 0, 6)}" alt="Instalações Carros de Selecção em Lisboa" loading="lazy" decoding="async">
        <div>
          <span class="eyebrow">Empresa</span>
          <h2>Viaturas escolhidas a dedo, no centro de Lisboa.</h2>
          <p>Na Carros de Selecção cada viatura é seleccionada pelo seu histórico, estado e exclusividade. Trabalhamos com desportivos e SUV premium — Porsche, Mercedes-Benz, Aston Martin e outras marcas de referência.</p>
          <p>Visite as nossas instalações na Rua Dona Filipa de Vilhena e conheça de perto o nosso stock. Tratamos do financiamento, da retoma e de toda a documentação.</p>
          <div class="visit-actions"><a class="btn btn-primary" href="#/viaturas">Ver stock</a><a class="btn btn-ghost" href="#/contactos">Contactos</a></div>
        </div>
      </div>
    </section>`;

    // hero: rotação automática, flechas, pontos e deslizar com o dedo
    const slides = $$(".hero-slide"), hc = $("#heroCar"), heroEl = $("#hero");
    let hi = 0;
    const setHeroCar = () => { const c = heroCars[hi]; hc.innerHTML = `<a href="#/viatura/${c.id}"><b>${c.marca}</b> ${c.modelo.split(" ").slice(0, 3).join(" ")} · ${num(c.preco)} € ${ic("right")}</a>`; };
    const heroGo = i => { hi = (i + slides.length) % slides.length; slides.forEach((s, k) => s.classList.toggle("on", k === hi)); $$(".hero-dots button").forEach((d, k) => d.classList.toggle("on", k === hi)); setHeroCar(); };
    const heroAuto = () => { clearInterval(renderHome._t); renderHome._t = setInterval(() => { if (document.hidden) return; if (!document.body.contains(slides[0])) return clearInterval(renderHome._t); heroGo(hi + 1); }, 6000); };
    heroEl._go = i => { heroGo(i); heroAuto(); };
    heroEl._pause = () => clearInterval(renderHome._t);
    heroEl._resume = heroAuto;
    $$("[data-h]").forEach(b => b.onclick = () => heroEl._go(hi + +b.dataset.h));
    $$("[data-hd]").forEach(b => b.onclick = () => heroEl._go(+b.dataset.hd));
    setHeroCar(); heroAuto();

    // pesquisa
    const sM = $("#sMarca"), sMo = $("#sModelo"), cnt = $("#sCount");
    const fillModels = () => {
      const ms = [...new Set(CARS.filter(c => !sM.value || c.marca === sM.value).map(c => modelBase(c.modelo)))].sort();
      sMo.innerHTML = `<option value="">Todos</option>` + ms.map(m => `<option>${m}</option>`).join("");
    };
    const updCount = () => { F.marca = sM.value; F.modelo = sMo.value; const old = F.chip; F.chip = "todos"; cnt.textContent = filtered().length; F.chip = old; };
    fillModels(); sM.value = F.marca; sMo.value = F.modelo;
    sM.onchange = () => { fillModels(); updCount(); };
    sMo.onchange = updCount;
    $$("[data-f]").forEach(s => { s.value = F[s.dataset.f]; s.onchange = () => { F[s.dataset.f] = s.value; updCount(); }; });
    $("#advBtn").onclick = e => { const a = $("#adv"); a.classList.toggle("open"); e.currentTarget.innerHTML = `${ic(a.classList.contains("open") ? "minus" : "plus")}Pesquisa detalhada`; };
    $("#searchForm").onsubmit = e => { e.preventDefault(); updCount(); F.chip = "todos"; drawGrid(); $("#stock").scrollIntoView({ behavior: "smooth" }); };

    $("#sort").value = F.sort;
    $("#sort").onchange = e => { F.sort = e.target.value; drawGrid(); };
    $("#chips").onclick = e => { const b = e.target.closest("[data-chip]"); if (!b) return; F.chip = b.dataset.chip; $$(".chip").forEach(x => x.classList.toggle("on", x === b)); drawGrid(); };
    drawGrid();

    if (target) requestAnimationFrame(() => { const el = document.getElementById(target); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - parseInt(getComputedStyle(document.documentElement).getPropertyValue("--hdr")) - 10, behavior: "instant" in window ? "auto" : "auto" }); });
    else window.scrollTo(0, 0);
  }

  function drawGrid() {
    const g = $("#grid"); if (!g) return;
    const r = filtered();
    g.innerHTML = r.length ? r.map(cardHTML).join("") : `<div class="empty"><h3>Sem resultados</h3><p>Experimente alterar os filtros da pesquisa.</p></div>`;
  }

  /* Interacções dos cards (delegadas) */
  document.addEventListener("click", e => {
    const step = e.target.closest(".card-nav");
    if (step) {
      e.preventDefault();
      const m = step.closest(".card-media"), n = +m.dataset.n; let i = (+m.dataset.i + +step.dataset.step + n) % n;
      const ims = $$("img", m); const im = ims[i]; if (im.dataset.src) { im.src = im.dataset.src; im.removeAttribute("data-src"); }
      ims.forEach((x, k) => x.classList.toggle("on", k === i)); $$(".dots i", m).forEach((x, k) => x.classList.toggle("on", k === i)); m.dataset.i = i;
      return;
    }
    const qv = e.target.closest("[data-qv]");
    if (qv) { e.preventDefault(); $$(".card.qv-open").forEach(c => c.classList.remove("qv-open")); qv.closest(".card").classList.add("qv-open"); return; }
    if (e.target.closest("[data-qv-close]")) { e.preventDefault(); e.target.closest(".card").classList.remove("qv-open"); return; }
  });

  /* ---------- Deslizar com o dedo: a foto acompanha o dedo (portada, cards e galeria) ---------- */
  let blockClick = 0;
  const loadSlide = el => { const im = el.tagName === "IMG" ? el : el.querySelector("img"); if (im && im.dataset.src) { im.src = im.dataset.src; im.removeAttribute("data-src"); } };
  const cardGo = (m, i) => {
    const ims = $$("img", m); loadSlide(ims[i]);
    ims.forEach((x, k) => x.classList.toggle("on", k === i)); $$(".dots i", m).forEach((x, k) => x.classList.toggle("on", k === i)); m.dataset.i = i;
  };
  const SW_SEL = ".card-media, .hero, #gal";
  const swItems = c => c.matches(".hero") ? $$(".hero-slide", c) : c.matches("#gal") ? $$(".gal-img", c) : $$("img", c);
  let sw = null;
  const swReset = st => {
    [st.cur, st.nb].forEach(el => { if (el) { el.style.transform = ""; el.style.opacity = ""; el.style.transition = ""; el.style.zIndex = ""; } });
    void st.c.offsetWidth; st.c.classList.remove("swiping");
  };
  document.addEventListener("pointerdown", e => {
    if (e.pointerType === "mouse" || sw) return;
    if (e.target.closest("button, select, input, .qv, .hero-car")) return;
    let c = e.target.closest(SW_SEL);
    if (!c && e.target.closest(".card-link")) { const m = e.target.closest(".card").querySelector(".card-media"), r = m.getBoundingClientRect(); if (e.clientY >= r.top && e.clientY <= r.bottom) c = m; }
    if (!c) return;
    const items = swItems(c); if (items.length < 2) return;
    const i = Math.max(0, items.findIndex(x => x.classList.contains("on")));
    sw = { c, items, i, x: e.clientX, y: e.clientY, w: c.clientWidth, dx: 0, t: 0, dir: 0, id: e.pointerId, active: false, cur: items[i], nb: null };
  }, { passive: true });
  document.addEventListener("pointermove", e => {
    const s = sw; if (!s || e.pointerId !== s.id) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (!s.active) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { sw = null; return; }
      if (Math.abs(dx) < 8) return;
      s.active = true; s.t = performance.now(); s.c.classList.add("swiping");
      if (s.c._pause) s.c._pause();
    }
    s.dx = dx; const n = s.items.length, dir = dx < 0 ? 1 : -1;
    if (dir !== s.dir) {
      if (s.nb) { s.nb.style.transform = ""; s.nb.style.opacity = ""; s.nb.style.zIndex = ""; }
      s.dir = dir; s.nb = s.items[(s.i + dir + n) % n]; loadSlide(s.nb);
    }
    s.cur.style.transform = `translate3d(${dx}px,0,0)`; s.cur.style.opacity = "1"; s.cur.style.zIndex = "2";
    s.nb.style.transform = `translate3d(${dx + dir * s.w}px,0,0)`; s.nb.style.opacity = "1"; s.nb.style.zIndex = "2";
  }, { passive: true });
  const swEnd = e => {
    const st = sw; if (!st || e.pointerId !== st.id) return; sw = null;
    if (!st.active || !st.nb) return;
    blockClick = Date.now();
    const v = Math.abs(st.dx) / Math.max(1, performance.now() - st.t);
    const pass = e.type !== "pointercancel" && (Math.abs(st.dx) > st.w * 0.18 || (v > 0.45 && Math.abs(st.dx) > 25));
    const T = "transform .34s cubic-bezier(.22,.8,.24,1)";
    st.cur.style.transition = T; st.nb.style.transition = T;
    if (pass) {
      st.cur.style.transform = `translate3d(${-st.dir * st.w}px,0,0)`; st.nb.style.transform = "translate3d(0,0,0)";
      const ni = (st.i + st.dir + st.items.length) % st.items.length;
      setTimeout(() => { if (st.c._go) st.c._go(ni); else cardGo(st.c, ni); swReset(st); }, 350);
    } else {
      st.cur.style.transform = "translate3d(0,0,0)"; st.nb.style.transform = `translate3d(${st.dir * st.w}px,0,0)`;
      setTimeout(() => swReset(st), 350);
      if (st.c._resume) st.c._resume();
    }
  };
  document.addEventListener("pointerup", swEnd);
  document.addEventListener("pointercancel", swEnd);
  document.addEventListener("click", e => { if (Date.now() - blockClick < 450 && e.target.closest(SW_SEL + ", .card")) { e.preventDefault(); e.stopPropagation(); } }, true);

  /* ---------- DETALHE ---------- */
  const GROUPS = [
    ["Segurança & Desempenho", "shield", /\bABS\b|Airbag|Alarme|\bESP\b|ISOFIX|Imobilizador|Fecho|parqueamento|Sensor|C[aâ]mara|Camara|Alerta|Aviso|Assist|Cruise|Direc|revis|ângulo/i],
    ["Equipamento Interior", "wheel", /Banco|Apoio|Volante|Patilhas|Estofos|Manete|fumador|Encosto|Cintos/i],
    ["Equipamento Exterior", "car", /Far[óo]is|Jantes|Luzes|Retrovisor|Vidros Escurecidos|Xen[óo]n|Tecto|Capota|Barras|Gancho|Acabamentos|Detalhes/i],
    ["Conforto & Multimédia", "music", /.*/]
  ];
  function groupEquip(list) {
    const out = GROUPS.map(g => ({ t: g[0], i: g[1], items: [] }));
    list.forEach(x => { const k = GROUPS.findIndex(g => g[2].test(x)); out[k].items.push(x); });
    return out.filter(g => g.items.length);
  }
  const defaultObs = c => `${c.marca} ${c.modelo}\n\nCor exterior: ${c.cor}\n${c.origem === "Nacional" ? "Viatura nacional.\n" : ""}Estado: ${c.estado.toLowerCase()}.\n${c.garantia === "Fábrica" ? "Ainda dentro da garantia de fábrica.\n" : ""}\nAceitamos retomas e tratamos do financiamento.\nVisite-nos na Rua Dona Filipa de Vilhena 28A, Lisboa — ${S.telefone}.\n\n* Os dados apresentados carecem de confirmação junto do vendedor.`;

  function renderDetail(id) {
    const c = CARS.find(x => x.id === id);
    if (!c) { location.hash = "#/"; return; }
    const specs = [
      ["cal", "Registo", regFmt(c.registo)], ["road", "Quilómetros", num(c.km)], ["seat", "Lugares", c.lugares],
      ["car", "Segmento", c.segmento], ["fuel", "Combustível", c.combustivel], ["gauge", "Potência", `${c.cv} Cv`],
      ["engine", "Cilindrada", `${num(c.cc)} Cc`], ["gear", "Transmissão", c.transmissao], ["palette", "Cor", c.cor],
      ["door", "Portas", c.portas], ["star", "Estado", c.estado], ["award", "Garantia", c.garantia],
      ...(c.origem ? [["flag", "Origem", c.origem]] : []), ["pin", "Stand", "Lisboa"]
    ];
    const groups = groupEquip(c.equip);
    const others = CARS.filter(x => x.id !== c.id && x.status !== "VENDIDO")
      .sort((a, b) => (b.marca === c.marca) - (a.marca === c.marca) || Math.abs(a.preco - c.preco) - Math.abs(b.preco - c.preco)).slice(0, 3);
    const sold = c.status === "VENDIDO";

    app.innerHTML = `
    <div class="dbar" id="dbar"><div class="wrap dbar-in">
      <img class="dbar-thumb" src="${img(c, 0, 4)}" alt="">
      <div class="dbar-name"><b>${c.marca}</b><span>${c.modelo}</span></div>
      <div class="dbar-reg">${ic("cal")}<div><small>Registo</small><b>${regFmt(c.registo)}</b></div></div>
      <div class="dbar-price"><small>Preço</small><strong>${sold ? "Vendido" : priceHTML(c)}</strong></div>
      <div class="dbar-act">
        <a class="btn btn-primary" href="tel:${S.telefoneLink}">${ic("phone")}Ligar</a>
        <a class="btn btn-ghost" href="#info" data-scroll="info">${ic("info")}Mais info</a>
      </div>
    </div></div>
    <div id="dsentinel"></div>

    <div class="wrap">
      <div class="d-top">
        <div>
          <div class="gal" id="gal">
            ${ribbon(c, true)}
            ${c.fotos.map((f, i) => `<img class="gal-img ${i ? "" : "on"}" ${i ? `data-src="${img(c, i)}"` : `src="${img(c, 0)}"`} alt="${c.marca} ${c.modelo} — foto ${i + 1}">`).join("")}
            <button class="gal-nav prev" data-g="-1" aria-label="Foto anterior">${ic("left")}</button>
            <button class="gal-nav next" data-g="1" aria-label="Foto seguinte">${ic("right")}</button>
            <button class="icon-btn gal-exp" id="galExp" aria-label="Ampliar">${ic("expand")}</button>
            <span class="gal-count">${ic("camera")}<span id="galIdx">1</span> / ${c.fotos.length} Fotos</span>
          </div>
          <div class="thumbs" id="thumbs">${c.fotos.map((f, i) => `<button class="${i ? "" : "on"}" data-t="${i}" aria-label="Foto ${i + 1}"><img src="${img(c, i, 4)}" alt="" loading="lazy" decoding="async"></button>`).join("")}</div>
        </div>
        <aside class="also">
          <h3>Também vai gostar destes!</h3>
          ${others.map(o => `<a class="mini" href="#/viatura/${o.id}"><img src="${img(o, 0, 6)}" alt="" loading="lazy" decoding="async"><span>${o.marca}<em>${o.modelo}</em></span></a>`).join("")}
          <a class="btn btn-ghost btn-pill-sm" href="#/viaturas">Ver listagem</a>
        </aside>
      </div>

      <div class="panel">
        <div class="specs" id="specs">${specs.map((s, i) => `<div class="spec ${i >= 7 ? "hide" : ""}">${ic(s[0])}<small>${s[1]}</small><b>${s[2]}</b></div>`).join("")}</div>
        <div class="toggle-row"><button class="toggle" data-tg="specs" data-l="características">${ic("plus")}Ver mais características</button></div>
      </div>

      <div class="d-bottom">
        <div>
          <div class="panel eq-wrap" id="eq">
            ${groups.map((g, gi) => `<div class="eq-group ${gi >= 2 ? "hide" : ""}">
              <div class="eq-head">${ic(g.i)}${g.t}</div>
              <ul class="eq-list">${g.items.map((x, i) => `<li class="${i >= 6 ? "hide" : ""}">${ic("check")}${x}</li>`).join("")}</ul>
            </div>`).join("")}
            <div class="toggle-row"><button class="toggle" data-tg="eq" data-l="equipamento">${ic("plus")}Ver mais equipamento</button></div>
          </div>

          <div class="panel">
            <h3 class="ttl">${ic("info")}Observações</h3>
            <div class="obs" id="obs">${(c.obs || defaultObs(c)).replace(/</g, "&lt;")}</div>
            <div class="toggle-row"><button class="toggle" data-tg="obs" data-l="observações">${ic("plus")}Ver mais observações</button></div>
            <div class="d-tools">
              <a class="btn btn-primary btn-pill-sm" href="#/credito/${c.id}">${ic("euro")}Financiar esta viatura</a>
              <button class="btn btn-ghost btn-pill-sm" id="printBtn">${ic("print")}Criar PDF / Imprimir</button>
              <button class="btn btn-ghost btn-pill-sm" id="shareBtn">${ic("share")}Partilhar</button>
            </div>
          </div>
        </div>

        <div class="panel" id="info">
          <h3 class="ttl">${ic("chat")}Fale connosco</h3>
          <div class="form-tabs" id="ftabs"><button class="on" data-m="msg">Mensagem</button><button data-m="fin">Financiamento</button><button data-m="ret">Retoma</button></div>
          <form class="dform" id="dform" data-mode="msg" data-demo-form>
            <input type="text" placeholder="Nome" required>
            <div class="row2"><input type="email" placeholder="Email" required><input type="tel" placeholder="Telefone"></div>
            <div class="only fin row2"><input type="number" placeholder="Entrada inicial (€)"><select><option>Prazo: 48 meses</option><option>60 meses</option><option>72 meses</option><option>84 meses</option></select></div>
            <div class="only ret row2"><input type="text" placeholder="Marca e modelo da sua viatura"><input type="text" placeholder="Ano / Quilómetros"></div>
            <textarea>Gostaria de saber mais informação sobre a viatura ${c.marca} ${c.modelo} (${c.preco ? num(c.preco) + " €" : "Sob/Consulta"}).</textarea>
            <label class="check"><input type="checkbox" required> Li e aceito os Termos de Utilização e Proteção de Dados</label>
            <button class="btn btn-primary" type="submit">Enviar pedido</button>
          </form>
        </div>
      </div>
      <a class="back" href="#/viaturas">${ic("left")}Voltar ao stock</a>
    </div>`;
    window.scrollTo(0, 0);

    // galeria
    const ims = $$(".gal-img"); let gi = 0;
    const go = i => {
      gi = (i + ims.length) % ims.length; const im = ims[gi];
      if (im.dataset.src) { im.src = im.dataset.src; im.removeAttribute("data-src"); }
      ims.forEach((x, k) => x.classList.toggle("on", k === gi));
      $$("#thumbs button").forEach((x, k) => x.classList.toggle("on", k === gi));
      $("#galIdx").textContent = gi + 1;
      const t = $$("#thumbs button")[gi]; t && t.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    };
    $$("[data-g]").forEach(b => b.onclick = () => go(gi + +b.dataset.g));
    $("#thumbs").onclick = e => { const b = e.target.closest("[data-t]"); b && go(+b.dataset.t); };
    $("#gal")._go = go;
    $("#galExp").onclick = () => openLB(c, gi);

    // toggles
    $$("[data-tg]").forEach(b => b.onclick = () => {
      const el = $("#" + b.dataset.tg); const o = el.classList.toggle("open");
      b.innerHTML = `${ic(o ? "minus" : "plus")}${o ? "Ver menos" : "Ver mais"} ${b.dataset.l}`;
    });
    if (!$$("#eq .hide").length) $("#eq .toggle-row").remove();

    // form tabs
    $("#ftabs").onclick = e => { const b = e.target.closest("[data-m]"); if (!b) return; $$("#ftabs button").forEach(x => x.classList.toggle("on", x === b)); $("#dform").dataset.mode = b.dataset.m; };
    $("#printBtn").onclick = () => window.print();
    $("#shareBtn").onclick = async () => {
      const data = { title: `${c.marca} ${c.modelo} | ${S.nome}`, url: location.href };
      try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(location.href); toast("Link copiado!"); } } catch (_) {}
    };
    $("[data-scroll]").onclick = e => { e.preventDefault(); const el = $("#info"); scrollTo({ top: el.getBoundingClientRect().top + scrollY - 170, behavior: "smooth" }); };

    // barra fixa
    const io = new IntersectionObserver(([en]) => $("#dbar") && $("#dbar").classList.toggle("stuck", !en.isIntersecting), { rootMargin: `-${parseInt(getComputedStyle(document.documentElement).getPropertyValue("--hdr")) + 90}px 0px 0px 0px` });
    io.observe($("#dsentinel"));
    document.title = `${c.marca} ${c.modelo} | ${S.nome} em Lisboa`;
  }

  /* ---------- Lightbox ---------- */
  let LB = null;
  function openLB(c, i) { LB = { c, i }; showLB(); $("#lb").classList.add("open"); document.body.style.overflow = "hidden"; }
  function showLB() { const { c, i } = LB; $("#lbImg").src = img(c, i); $("#lbCount").textContent = `${i + 1} / ${c.fotos.length}`; }
  function closeLB() { $("#lb").classList.remove("open"); document.body.style.overflow = ""; LB = null; }
  $("#lb").onclick = e => {
    if (e.target.closest("[data-lb]")) { LB.i = (LB.i + +e.target.closest("[data-lb]").dataset.lb + LB.c.fotos.length) % LB.c.fotos.length; showLB(); }
    else if (e.target.closest("[data-lb-close]") || e.target.id === "lb") closeLB();
  };
  document.addEventListener("keydown", e => {
    if (LB) { if (e.key === "Escape") closeLB(); if (e.key === "ArrowRight") { LB.i = (LB.i + 1) % LB.c.fotos.length; showLB(); } if (e.key === "ArrowLeft") { LB.i = (LB.i - 1 + LB.c.fotos.length) % LB.c.fotos.length; showLB(); } }
    else if (e.key === "Escape") { setMenu(false); $(".fab-wrap").classList.remove("open"); $$(".card.qv-open").forEach(c => c.classList.remove("qv-open")); }
  });

  /* ---------- Menu, FAB, formulários ---------- */
  const mm = $("#drawer");
  const setMenu = on => { document.body.classList.toggle("menu-open", on); mm.setAttribute("aria-hidden", String(!on)); if (!on) $$(".mm-item[aria-expanded]").forEach(b => b.setAttribute("aria-expanded", "false")); };
  $("#menuBtn").onclick = () => setMenu(true);
  $("#drawerClose").onclick = () => setMenu(false);
  $("#mmBrands").innerHTML = [...new Set(CARS.map(c => c.marca))].sort().map(m => {
    const n = CARS.filter(c => c.marca === m && c.status !== "VENDIDO").length, s = slug(m);
    const logo = document.getElementById("i-b-" + s) ? `<svg class="ic"><use href="#i-b-${s}"/></svg>` : `<span class="mm-mono">${m.split(/[\s-]+/).map(w => w[0]).join("").slice(0, 2)}</span>`;
    return `<a class="mm-brand" href="#/viaturas/${s}">${logo}<b>${m}</b><small>${n} ${n === 1 ? "viatura" : "viaturas"}</small></a>`;
  }).join("");
  mm.addEventListener("click", e => {
    const b = e.target.closest("button.mm-item");
    if (b) { const open = b.getAttribute("aria-expanded") === "true"; $$(".mm-item[aria-expanded]").forEach(x => x.setAttribute("aria-expanded", "false")); b.setAttribute("aria-expanded", String(!open)); return; }
    if (e.target.closest("a")) setMenu(false);
  });
  $("#fabTeam").innerHTML = (S.equipa || []).map(p => {
    const pessoa = !p.linha && p.icon !== "mail" && p.icon !== "chat" && !/^(Linha|Telefone)/.test(p.nome);
    const av = p.foto ? `<img src="${p.foto}" alt="">` : pessoa ? p.nome.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() : ic(p.icon);
    const ext = /^https?:/.test(p.href) ? ' target="_blank" rel="noopener"' : "";
    return `<a href="${p.href}"${ext}><span class="fab-av">${av}</span><span class="fab-tx"><small>${p.funcao}</small><b${p.icon === "mail" ? ' class="sm"' : ""}>${p.nome}</b>${p.info ? `<em>${p.info}${p.canal ? " · " + p.canal : ""}</em>` : ""}</span><span class="fab-go">${ic(p.icon)}</span></a>`;
  }).join("");
  $("#fab").onclick = () => $(".fab-wrap").classList.toggle("open");
  $("#fabClose").onclick = () => $(".fab-wrap").classList.remove("open");
  $("#fabTeam").addEventListener("click", e => { if (e.target.closest("a")) $(".fab-wrap").classList.remove("open"); });
  /* Menus da barra superior: abrem ao passar o rato; em ecrãs tácteis abrem ao primeiro toque */
  $$(".hdr-dd").forEach(dd => {
    const btn = dd.querySelector(".hdr-btn");
    const set = on => { dd.classList.toggle("open", on); btn.setAttribute("aria-expanded", String(on)); };
    dd._set = set;
    btn.addEventListener("click", e => { if (matchMedia("(hover:none)").matches && !dd.classList.contains("open")) { e.preventDefault(); $$(".hdr-dd").forEach(o => o._set && o._set(false)); set(true); } else { set(false); btn.blur(); } });
    dd.querySelector(".dd").addEventListener("click", e => { if (e.target.closest("a")) { set(false); document.activeElement && document.activeElement.blur(); } });
  });
  document.addEventListener("click", e => { $$(".hdr-dd").forEach(dd => { if (!dd.contains(e.target)) dd._set(false); }); });
  document.addEventListener("click", e => { if (!e.target.closest(".fab-wrap")) $(".fab-wrap").classList.remove("open"); });
  document.addEventListener("submit", e => {
    if (!e.target.matches("[data-demo-form]")) return;
    e.preventDefault(); e.target.reset(); toast("Obrigado! Entraremos em contacto brevemente.");
  });
  $$("[data-open-search]").forEach(b => b.onclick = () => {
    if (!$("#searchForm")) { location.hash = "#/pesquisa"; return; }
    const el = $("#searchForm"); scrollTo({ top: el.getBoundingClientRect().top + scrollY - 140, behavior: "smooth" });
    $("#adv").classList.add("open");
  });

  /* ---------- Páginas de serviço ---------- */
  const MARCAS = ["Abarth","Alfa Romeo","Alpine","Aston Martin","Audi","Bentley","BMW","BYD","Citroën","Cupra","Dacia","DS","Ferrari","Fiat","Ford","Honda","Hyundai","Jaguar","Jeep","Kia","Lamborghini","Land Rover","Lexus","Maserati","Mazda","McLaren","Mercedes-Benz","MINI","Mitsubishi","Nissan","Opel","Peugeot","Porsche","Renault","Rolls-Royce","Seat","Skoda","Smart","Suzuki","Tesla","Toyota","Volkswagen","Volvo"];
  const fl = (label, ctrl, req, cls = "") => `<label class="fl ${cls}"><span>${label}${req ? " <b>*</b>" : ""}</span>${ctrl}</label>`;
  const inp = (label, type = "text", req = false, extra = "", cls = "") => fl(label, `<input type="${type}" placeholder="Escreva aqui" ${req ? "required" : ""} ${extra}>`, req, cls);
  const sel = (label, opts, req = false, extra = "", cls = "") => fl(label, `<select ${req ? "required" : ""} ${extra}><option value="">Selecione</option>${opts.map(o => `<option>${o}</option>`).join("")}</select>`, req, cls);
  const card = (n, title, sub, body) => `<fieldset class="fm-card"><div class="fm-head"><i>${n}</i><h2>${title}${sub ? `<small>${sub}</small>` : ""}</h2></div>${body}</fieldset>`;
  const endRow = btn => `<div class="fm-end"><label class="check"><input type="checkbox" required> Li e aceito os Termos de Utilização e Proteção de Dados</label><button class="btn btn-primary" type="submit">${btn}</button></div><p class="fm-note">Os campos marcados com * são de preenchimento obrigatório.</p>`;
  const steps = list => `<div class="pg-box"><h3>Como funciona</h3><ol class="pg-steps">${list.map(([t, d], i) => `<li><i>${i + 1}</i><div><b>${t}</b><span>${d}</span></div></li>`).join("")}</ol></div>`;
  const helpBox = () => `<div class="pg-box dk"><h3>Prefere falar connosco?</h3><p>A nossa equipa esclarece todas as dúvidas, sem compromisso.</p><a class="tel" href="tel:${S.telefoneLink}">${ic("phone")}${S.telefone}</a><a class="lnk" href="#/contactos">Ver todos os contactos ${ic("right")}</a></div>`;
  const shell = (eyebrow, title, lead, form, aside) => `
    <section class="pg-hero"><div class="wrap">
      <nav class="pg-crumb" aria-label="Navegação"><a href="#/">Início</a>${ic("right")}<a href="#/servicos">Serviços</a>${ic("right")}<span>${title}</span></nav>
      <span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${lead}</p>
    </div></section>
    <section class="pg"><div class="wrap pg-grid"><form class="fm" data-demo-form>${form}</form><aside class="pg-aside">${aside}</aside></div></section>`;

  function renderPage(kind, arg) {
    if (kind === "credito") {
      const stock = CARS.filter(c => c.status !== "VENDIDO");
      app.innerHTML = shell("Financiamento à medida", "Intermediação de Crédito",
        "Escolha a viatura, preencha os seus dados e nós tratamos do processo junto das entidades financeiras. Resposta rápida e sem compromisso.",
        card("01", "Viatura", "Escolha a viatura que pretende financiar",
          `<div class="fm-grid">
            ${fl("Selecione a viatura", `<select id="crCar" required><option value="">Escolher carro</option>${stock.map(c => `<option value="${c.id}">${c.marca} ${c.modelo}${c.preco ? " — " + num(c.preco) + " €" : ""}</option>`).join("")}<option value="outra">Nenhuma das viaturas acima, pretendo outra viatura</option></select>`, true, "full")}
          </div>
          <div class="fm-pick" id="crPick" aria-live="polite"></div>
          <div class="fm-grid" style="margin-top:16px">
            ${inp("Entrada inicial (€)", "number", false, 'min="0" step="500" inputmode="numeric"')}
            ${sel("Prazo pretendido", ["24 meses", "36 meses", "48 meses", "60 meses", "72 meses", "84 meses", "96 meses", "120 meses"])}
          </div>`) +
        card("02", "Dados pessoais", "Titular do contrato",
          `<div class="fm-grid">
            ${inp("Nome", "text", true, 'autocomplete="name"', "full")}
            ${inp("Email", "email", true, 'autocomplete="email"')}
            ${inp("Telemóvel", "tel", true, 'autocomplete="tel" inputmode="tel"')}
            ${inp("Morada completa", "text", false, 'autocomplete="street-address"', "full")}
            ${inp("Código postal", "text", false, 'autocomplete="postal-code" placeholder="0000-000"')}
            ${inp("Localidade")}
            ${sel("Estado civil", ["Casado/a", "Em união de facto", "Solteiro/a", "Divorciado/a", "Separado/a", "Viúvo/a"])}
            ${inp("Nacionalidade")}
            ${inp("Data de nascimento", "date")}
            ${inp("N.º de identificação (CC / Passaporte)")}
            ${inp("N.º de contribuinte", "text", false, 'inputmode="numeric"')}
            ${inp("IBAN", "text", false, 'placeholder="PT50 ..."')}
          </div>`) +
        card("03", "Situação profissional e habitação", "Ajuda-nos a encontrar a melhor proposta",
          `<div class="fm-grid">
            ${inp("Profissão")}
            ${inp("Nome da empresa")}
            ${inp("Remuneração líquida mensal (€)", "number", false, 'min="0" inputmode="numeric"')}
            ${sel("Tipo de contrato", ["Efectivo", "A prazo", "Conta própria", "Recibos verdes", "Outro"])}
            ${inp("Anos de serviço", "number", false, 'min="0" inputmode="numeric"')}
            ${sel("Tipo de habitação", ["Arrendada", "Própria com hipoteca", "Própria sem hipoteca", "Familiar"])}
          </div>
          <button type="button" class="fm-add" id="crAdd">${ic("plus")}<span>Adicionar outro titular / fiador</span></button>
          <div class="fm-more" id="crMore"><div class="fm-grid">
            ${inp("Nome do 2.º titular / fiador", "text", false, "", "full")}
            ${inp("Telemóvel", "tel")}
            ${inp("N.º de contribuinte")}
            ${inp("Profissão")}
            ${inp("Remuneração líquida mensal (€)", "number", false, 'min="0"')}
          </div></div>`) +
        card("04", "Mensagem e documentos", "Opcional: junte recibos de vencimento ou outros documentos",
          `<div class="fm-grid">
            ${fl("Mensagem", `<textarea required placeholder="Escreva aqui"></textarea>`, true, "full")}
            ${fl("Carregar ficheiros", `<input type="file" multiple>`, false, "full")}
          </div>${endRow("Enviar pedido")}`),
        steps([["Escolha a viatura", "Selecione um carro do nosso stock ou diga-nos qual procura."], ["Preencha os seus dados", "Quanto mais completa a informação, mais rápida a resposta."], ["Receba a proposta", "Analisamos o pedido e contactamos com as condições."]]) +
        helpBox() + `<p class="pg-legal">A Carros de Selecção disponibiliza serviços de intermediação de crédito. O pedido não tem qualquer compromisso e está sujeito à análise e aprovação da entidade financeira. <a href="https://www.bportugal.pt/intermediariocreditofar/carros-de-seleccao-sociedade-automovel-lda" target="_blank" rel="noopener">Consultar registo no Banco de Portugal</a></p>`);
      const pick = $("#crPick"), car = $("#crCar");
      const showPick = () => {
        const c = CARS.find(x => x.id === car.value);
        pick.classList.toggle("on", !!c);
        pick.innerHTML = c ? `<img src="${img(c, 0, 6)}" alt="${c.marca} ${c.modelo}"><div><b>${c.marca}</b><span>${c.modelo}</span><small>${regFmt(c.registo)} · ${num(c.km)} km · ${c.combustivel}</small><div class="pr">${c.preco ? num(c.preco) + " €" : "Sob consulta"}</div><a href="#/viatura/${c.id}">Ver ficha da viatura ${ic("right")}</a></div>` : "";
      };
      if (arg && CARS.some(c => c.id === arg)) car.value = arg;
      car.onchange = showPick; showPick();
      $(".fm").addEventListener("reset", () => setTimeout(showPick));
      $("#crAdd").onclick = () => { const on = $("#crMore").classList.toggle("on"); $("#crAdd span").textContent = on ? "Remover 2.º titular / fiador" : "Adicionar outro titular / fiador"; };
      document.title = "Intermediação de Crédito | " + S.nome;
    } else if (kind === "consultadoria") {
      const extras = ["GPS", "Caixa automática", "Faróis LED", "Faróis Xénon / Bi-Xénon", "Cruise control", "Sensores de estacionamento", "Câmara traseira", "Estofos em pele", "Ar condicionado", "Tecto de abrir", "Apple CarPlay / Android Auto"];
      app.innerHTML = shell("Procuramos por si", "Consultadoria Automóvel",
        "Não encontrou a viatura ideal no nosso stock? Diga-nos o que procura e nós encontramos, verificamos o histórico e tratamos de todo o processo.",
        card("01", "Informação pessoal", "", `<div class="fm-grid">${inp("Nome", "text", true, 'autocomplete="name"', "full")}${inp("Email", "email", true, 'autocomplete="email"')}${inp("Telemóvel", "tel", true, 'autocomplete="tel"')}</div>`) +
        card("02", "Viatura pretendida", "Descreva o carro que procura",
          `<div class="fm-grid">
            ${fl("Marca", `<input list="dlMarcas" required placeholder="Escreva aqui"><datalist id="dlMarcas">${MARCAS.map(m => `<option value="${m}">`).join("")}</datalist>`, true)}
            ${inp("Modelo", "text", true)}
            ${inp("Versão")}
            ${inp("Orçamento máximo (€)", "number", false, 'min="0" step="1000" inputmode="numeric"')}
            ${fl(`Quilómetros máximos: <output id="oKm">150 000 km</output>`, `<input type="range" min="0" max="300000" step="5000" value="150000" data-out="oKm" data-suf=" km">`)}
            ${fl(`Ano mínimo: <output id="oAno">2015</output>`, `<input type="range" min="1950" max="${new Date().getFullYear()}" step="1" value="2015" data-out="oAno" data-raw="1">`)}
          </div>`) +
        card("03", "Extras pretendidos", "Selecione os que são importantes para si", `<div class="xchips">${extras.map(x => `<label class="xchip"><input type="checkbox"><span>${x}</span></label>`).join("")}</div>`) +
        card("04", "Mensagem", "", `<div class="fm-grid">${fl("Mensagem", `<textarea required placeholder="Cor preferida, urgência, outras preferências..."></textarea>`, true, "full")}</div>${endRow("Enviar pedido")}`),
        steps([["Diga-nos o que procura", "Marca, modelo, orçamento e os extras de que não abdica."], ["Nós procuramos e verificamos", "Seleccionamos viaturas e confirmamos histórico e estado."], ["Apresentamos as opções", "Recebe as propostas e decide com toda a informação."]]) + helpBox());
      document.title = "Consultadoria Automóvel | " + S.nome;
    } else {
      app.innerHTML = shell("Avaliação sem compromisso", "Compramos o seu Carro",
        "Quer vender a sua viatura? Envie-nos os dados e algumas fotografias. Avaliamos e apresentamos uma proposta, também em regime de retoma.",
        card("01", "Informação da viatura", "",
          `<div class="fm-grid">
            ${sel("Marca", [...MARCAS, "Outra"], true)}
            ${inp("Modelo", "text", true)}
            ${inp("Versão")}
            ${sel("Combustível", ["Gasolina", "Gasóleo", "Híbrido", "Híbrido Plug-In", "Eléctrico", "GPL"])}
            ${inp("Matrícula", "text", false, 'placeholder="AA-00-AA" style="text-transform:uppercase"')}
            ${inp("Ano", "number", false, `min="1950" max="${new Date().getFullYear()}" inputmode="numeric"`)}
            ${inp("Quilómetros", "number", false, 'min="0" step="1000" inputmode="numeric"')}
            ${sel("Pretende", ["Vender a viatura", "Dar em retoma por outra viatura"])}
          </div>`) +
        card("02", "Fotografias", "Exterior, interior e painel de instrumentos ajudam a uma avaliação mais rigorosa", `<div class="fm-grid">${fl("Carregar fotografias", `<input type="file" accept="image/*" multiple>`, false, "full")}</div>`) +
        card("03", "Os seus contactos", "", `<div class="fm-grid">${inp("Nome", "text", true, 'autocomplete="name"', "full")}${inp("Email", "email", true, 'autocomplete="email"')}${inp("Telemóvel", "tel", true, 'autocomplete="tel"')}</div>`) +
        card("04", "Mensagem", "", `<div class="fm-grid">${fl("Mensagem", `<textarea required placeholder="Estado geral, revisões, número de donos..."></textarea>`, true, "full")}</div>${endRow("Pedir avaliação")}`),
        steps([["Envie os dados da viatura", "Marca, modelo, quilómetros e algumas fotografias."], ["Avaliamos a sua viatura", "A nossa equipa analisa e, se necessário, agenda uma visita."], ["Receba a nossa proposta", "Proposta de compra ou valor de retoma, sem compromisso."]]) + helpBox());
      document.title = "Compramos o seu Carro | " + S.nome;
    }
    $$("[data-out]", app).forEach(r => { const upd = () => { $("#" + r.dataset.out).textContent = r.dataset.raw ? r.value : num(+r.value) + (r.dataset.suf || ""); }; r.addEventListener("input", upd); $(".fm").addEventListener("reset", () => setTimeout(upd)); });
    window.scrollTo(0, 0);
  }

  /* ---------- Tema (claro / preto e vermelho) ---------- */
  const themeBtn = $("#themeBtn"), themeBtnH = $("#themeBtnH");
  const applySkin = () => {
    const noir = document.documentElement.getAttribute("data-skin") === "noir";
    $$("img[data-logo]").forEach(i => { i.src = noir ? "assets/logo-noir.svg" : i.dataset.logo; });
    themeBtn.innerHTML = `<svg class="ic"><use href="#i-${noir ? "sun" : "moon"}"/></svg><span>${noir ? "Modo claro" : "Modo escuro"}</span>`;
    themeBtnH.innerHTML = `<svg class="ic"><use href="#i-${noir ? "sun" : "moon"}"/></svg><span>${noir ? "Claro" : "Escuro"}</span>`;
    themeBtnH.setAttribute("aria-label", noir ? "Mudar para modo claro" : "Mudar para modo escuro");
  };
  themeBtn.onclick = themeBtnH.onclick = () => {
    const noir = document.documentElement.getAttribute("data-skin") !== "noir";
    if (noir) document.documentElement.setAttribute("data-skin", "noir"); else document.documentElement.removeAttribute("data-skin");
    try { localStorage.setItem("skin", noir ? "noir" : "claro"); } catch (e) {}
    applySkin();
  };
  applySkin();

  /* ---------- Router ---------- */
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [p, a] = h.split("/");
    document.title = "Carros de Selecção · Stand Automóvel em Lisboa";
    if (p === "viatura" && a) return renderDetail(a);
    if (p === "viaturas") {
      if (a) { const k = CHIPS.find(([x]) => slug(x) === slug(decodeURIComponent(a))); F.chip = k ? k[0] : a; } else if (!$("#grid")) { F.chip = "todos"; }
      return renderHome("stock");
    }
    if (p === "credito" || p === "consultadoria" || p === "compramos") return renderPage(p, a);
    if (p === "servicos") return renderHome("servicos");
    if (p === "empresa") return renderHome("empresa");
    if (p === "contactos") { if (!$("#grid")) renderHome(); return requestAnimationFrame(() => $("#contactos").scrollIntoView()); }
    if (p === "pesquisa") { renderHome("hero"); return requestAnimationFrame(() => { $("#adv").classList.add("open"); }); }
    renderHome();
  }
  window.addEventListener("hashchange", route);
  route();
})();
