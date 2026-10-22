/* Boreal Café · demo — interacciones de la landing (Alejo Martín Fernández) */
(function () {
  'use strict';
  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TZ = 'America/Argentina/Buenos_Aires';
  var WHATSAPP = '5491162788172';
  var HORARIOS = { lun: [], mar: [[480, 1200]], mie: [[480, 1200]], jue: [[480, 1200]], vie: [[480, 1200]], sab: [[540, 1200]], dom: [[540, 1200]] };
  var DIAS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
  var DIAS_LARGOS = { dom: 'el domingo', lun: 'el lunes', mar: 'el martes', mie: 'el miércoles', jue: 'el jueves', vie: 'el viernes', sab: 'el sábado' };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- INTRO ---------- */
  function terminarIntro() {
    html.classList.add('listo');
    document.body.style.overflow = '';
  }
  function intro() {
    var el = $('#intro');
    if (!html.classList.contains('con-intro') || !el) { terminarIntro(); return; }
    var t0 = performance.now();
    var foto = $('.hero__taza img');
    var esperas = [];
    if (document.fonts && document.fonts.ready) esperas.push(document.fonts.ready);
    if (foto && foto.decode) esperas.push(foto.decode().catch(function () {}));
    var cargado = Promise.all(esperas);
    var tope = new Promise(function (r) { setTimeout(r, 2600); });
    requestAnimationFrame(function () { el.classList.add('go'); });
    var minimo = new Promise(function (r) { setTimeout(r, 2050); });
    Promise.all([minimo, Promise.race([cargado, tope])]).then(function () {
      el.classList.add('sale');
      terminarIntro();
      setTimeout(function () { el.remove(); html.classList.remove('con-intro'); }, 760);
    });
    // seguro anti-trabas
    setTimeout(function () { if (document.body.contains(el)) { el.remove(); html.classList.remove('con-intro'); terminarIntro(); } }, 5200);
    void t0;
  }

  /* ---------- REVEAL AL HACER SCROLL ---------- */
  function reveals() {
    var items = $$('.rv, .mapa');
    items.forEach(function (el) {
      if (el.style.getPropertyValue('--i')) return;
      var hermanos = $$(':scope > .rv', el.parentElement);
      var i = hermanos.indexOf(el);
      el.style.setProperty('--i', i > 0 ? Math.min(i, 6) : 0);
    });
    if (reduce || !('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('visto'); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- BARRA Y MENÚ ---------- */
  function menu() {
    var b = $('.hamb'), m = $('#menu');
    if (!b || !m) return;
    function cerrar() { m.classList.remove('abierto'); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', 'Abrir menú'); }
    b.addEventListener('click', function () {
      var ab = m.classList.toggle('abierto');
      b.setAttribute('aria-expanded', String(ab));
      b.setAttribute('aria-label', ab ? 'Cerrar menú' : 'Abrir menú');
    });
    m.addEventListener('click', function (e) { if (e.target.closest('a')) cerrar(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });
    document.addEventListener('click', function (e) { if (m.classList.contains('abierto') && !e.target.closest('.barra')) cerrar(); });
    // sección activa
    if ('IntersectionObserver' in window) {
      var links = $$('a', m);
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + e.target.id); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      links.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) io.observe(s); });
    }
  }

  /* ---------- HORA DEL LOCAL ---------- */
  function ahora() {
    var p = {};
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    var mapa = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    var h = Number(p.hour) % 24, m = Number(p.minute);
    return { dow: mapa[p.weekday], min: h * 60 + m, texto: String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') };
  }
  function hhmm(min) { var h = Math.floor(min / 60), m = min % 60; return m ? h + ':' + String(m).padStart(2, '0') : String(h); }
  function proximaApertura(n) {
    for (var k = 0; k < 8; k++) {
      var d = (n.dow + k) % 7, fr = HORARIOS[DIAS[d]];
      if (!fr.length) continue;
      if (k === 0 && n.min >= fr[0][0]) continue;
      return { cuando: k === 0 ? 'hoy' : k === 1 ? 'mañana' : DIAS_LARGOS[DIAS[d]], hora: hhmm(fr[0][0]) };
    }
    return null;
  }
  function estado() {
    var n = ahora(), fr = HORARIOS[DIAS[n.dow]];
    var abierta = fr.filter(function (f) { return n.min >= f[0] && n.min < f[1]; })[0];
    return { n: n, abierto: !!abierta, cierra: abierta ? hhmm(abierta[1]) : null, prox: abierta ? null : proximaApertura(n) };
  }
  function chipEstado() {
    var c = $('[data-estado]'); if (!c) return;
    var e = estado();
    c.classList.toggle('is-abierto', e.abierto);
    c.classList.toggle('is-cerrado', !e.abierto);
    c.textContent = e.abierto ? 'Abierto ahora · cierra ' + e.cierra + ' h' : (e.prox ? 'Cerrado · abrimos ' + e.prox.cuando + ' a las ' + e.prox.hora + ' h' : 'Cerrado');
  }

  /* ---------- HOY EN BOREAL (el reloj) ---------- */
  function hoy() {
    var titulo = $('[data-hoy-titulo]'), bajada = $('[data-hoy-bajada]');
    if (!titulo) return;
    var q = new URLSearchParams(location.search).get('momento');
    var e = estado(), mom = null;
    if (q && /^(manana|mediodia|tarde|cerrado)$/.test(q)) mom = q;
    else if (!e.abierto) mom = 'cerrado';
    else mom = e.n.min < 720 ? 'manana' : e.n.min < 960 ? 'mediodia' : 'tarde';
    var NOMBRES = { manana: 'desayuno', mediodia: 'brunch', tarde: 'merienda' };
    if (mom === 'cerrado') {
      titulo.textContent = 'Ahora estamos cerrados.';
      bajada.textContent = e.prox ? 'Volvemos ' + e.prox.cuando + ' a las ' + e.prox.hora + ' h. Mientras, podés dejar tu encargo armado.' : 'Mientras, podés dejar tu encargo armado.';
    } else {
      var hora = q ? '' : 'Son las ' + e.n.texto + ': ';
      titulo.textContent = (hora ? hora + 'es' : 'Es') + ' hora de ' + NOMBRES[mom] + '.';
      bajada.textContent = 'Esto es lo que más sale en Boreal a esta hora. Sumalo y retiralo en el local.';
    }
    $$('.momento').forEach(function (m) { m.classList.toggle('is-ahora', m.dataset.momento === mom); });
  }

  /* ---------- LA VITRINA (carta corta) ---------- */
  var PAGINAS = [
    { id: 'cafeteria', nombre: 'Cafetería', secs: ['con-cafe', 'frios'] },
    { id: 'pasteleria', nombre: 'Pastelería', secs: ['laminados', 'masas'] },
    { id: 'tortas', nombre: 'Tortas', secs: ['tortas'] },
    { id: 'brunch', nombre: 'Brunch y salado', secs: ['brunch'] },
    { id: 'encargos', nombre: 'Encargos', secs: ['encargos'] }
  ];
  var NOTAS = {
    'con-cafe': 'Café de especialidad tostado por nosotros. También para llevar.',
    'frios': 'Para los días de calor. También para llevar.',
    'laminados': 'Recién horneados. Se pueden encargar por docena.',
    'masas': 'Para acompañar el café.',
    'tortas': 'Por porción. ¿La querés entera? Mirá Encargos.',
    'brunch': 'A cualquier hora, de martes a domingo.',
    'encargos': 'Con 48 h de anticipación. Retirás en Devoto o Urquiza.'
  };
  var COLS2 = [];
  var vit = { pagina: null, seccion: null, cats: [], paneles: {}, paginas: [] };

  function armarVitrina(detalle) {
    var el = detalle.el, cats = detalle.categorias || [];
    var paneles = {};
    $$('.kit-carta__panel', el).forEach(function (p) {
      var it = $('.kit-item', p); if (it) paneles[it.dataset.cat] = p;
    });
    var conItems = Object.keys(paneles);
    var usados = {};
    var paginas = PAGINAS.map(function (pg) {
      var secs = pg.secs.filter(function (s) { return paneles[s]; });
      secs.forEach(function (s) { usados[s] = 1; });
      return { id: pg.id, nombre: pg.nombre, secs: secs };
    });
    var extra = conItems.filter(function (c) { return !usados[c]; });
    if (extra.length) paginas.push({ id: 'mas', nombre: 'Más', secs: extra });
    paginas = paginas.filter(function (p) { return p.secs.length; });
    var nombreCat = {};
    cats.forEach(function (c) { nombreCat[c.id] = c.nombre; });
    nombreCat._otros = 'Otros';
    vit.paneles = paneles; vit.paginas = paginas; vit.nombre = nombreCat;
    vit.orden = [];
    paginas.forEach(function (p) { p.secs.forEach(function (s) { vit.orden.push({ pag: p.id, sec: s }); }); });
    var pag = paginas.filter(function (p) { return p.id === vit.pagina; })[0] || paginas[0];
    var sec = pag && pag.secs.indexOf(vit.seccion) >= 0 ? vit.seccion : (pag ? pag.secs[0] : null);
    pintarPaginas();
    if (pag) mostrar(pag.id, sec, false);
  }

  function pintarPaginas() {
    var box = $('[data-paginas]');
    box.innerHTML = vit.paginas.map(function (p) {
      return '<button type="button" class="pag" role="tab" data-pag="' + p.id + '" aria-selected="false">' + p.nombre + '</button>';
    }).join('');
  }

  function mostrar(pagId, secId, animar) {
    var pag = vit.paginas.filter(function (p) { return p.id === pagId; })[0];
    if (!pag) return;
    if (pag.secs.indexOf(secId) < 0) secId = pag.secs[0];
    vit.pagina = pagId; vit.seccion = secId;
    $$('.pag').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.pag === pagId)); });
    // índice de secciones de la página
    $('[data-indice]').innerHTML = pag.secs.map(function (s) {
      var n = $$('.kit-item', vit.paneles[s]).length;
      return '<button type="button" class="sec-btn" data-sec="' + s + '" aria-current="' + (s === secId) + '">' + (vit.nombre[s] || s) + ' <small>' + n + '</small></button>';
    }).join('');
    Object.keys(vit.paneles).forEach(function (k) {
      var on = k === secId, p = vit.paneles[k];
      p.hidden = !on;
      if (on && animar !== false) {
        var its = $$('.kit-item', p);
        its.forEach(function (i) { i.style.animation = 'none'; });
        void p.offsetWidth;
        its.forEach(function (i) { i.style.animation = ''; });
      }
    });
    var cab = $('[data-cab]');
    var n = $$('.kit-item', vit.paneles[secId]).length;
    $('[data-cab-titulo]').textContent = vit.nombre[secId] || secId;
    $('[data-cab-sub]').textContent = n + (n === 1 ? ' opción' : ' opciones') + (NOTAS[secId] ? ' · ' + NOTAS[secId] : '');
    if (animar !== false) { cab.classList.remove('cambia'); void cab.offsetWidth; cab.classList.add('cambia'); }
    $('.vitrina').classList.toggle('cols-2', COLS2.indexOf(secId) >= 0);
    // anterior / siguiente
    var idx = -1;
    vit.orden.forEach(function (o, i) { if (o.sec === secId) idx = i; });
    var prev = vit.orden[idx - 1], next = vit.orden[idx + 1];
    var bp = $('[data-prev]'), bn = $('[data-next]');
    bp.hidden = !prev; bn.hidden = !next;
    if (prev) { $('[data-prev-txt]').textContent = vit.nombre[prev.sec]; bp.dataset.pag = prev.pag; bp.dataset.sec = prev.sec; }
    if (next) { $('[data-next-txt]').textContent = vit.nombre[next.sec]; bn.dataset.pag = next.pag; bn.dataset.sec = next.sec; }
    // primera foto de la sección en el arco
    var conFoto = $('.kit-item[data-photo]', vit.paneles[secId]);
    if (conFoto) ponerFoto(conFoto);
  }

  function irA(pag, sec) {
    mostrar(pag, sec, true);
    var top = $('.vitrina__cuerpo').getBoundingClientRect().top;
    if (top < 60) window.scrollTo({ top: window.scrollY + top - 140, behavior: reduce ? 'auto' : 'smooth' });
  }

  var fotoActual = null, fotoRaf = 0;
  function ponerFoto(item) {
    var src = item.dataset.photo; if (!src || src === fotoActual) return;
    fotoActual = src;
    var img = $('[data-foto-img]'), cap = $('[data-foto-cap]');
    var nombre = $('h4', item) ? $('h4', item).textContent.trim() : '';
    img.classList.add('cambia');
    setTimeout(function () {
      img.src = src; img.alt = nombre; cap.textContent = nombre;
      var listo = function () { img.classList.remove('cambia'); };
      if (img.decode) img.decode().then(listo, listo); else listo();
    }, 160);
  }

  function vitrinaEventos() {
    var v = $('.vitrina'); if (!v) return;
    v.addEventListener('click', function (e) {
      var p = e.target.closest('.pag'); if (p) { irA(p.dataset.pag, null); return; }
      var s = e.target.closest('.sec-btn'); if (s) { irA(vit.pagina, s.dataset.sec); return; }
      var n = e.target.closest('[data-prev], [data-next]'); if (n) { irA(n.dataset.pag, n.dataset.sec); return; }
      var ver = e.target.closest('.it__ver'); if (ver) { var it = ver.closest('.kit-item'); if (it) verFoto(it.dataset.photo, $('h4', it).textContent.trim()); }
    });
    v.addEventListener('keydown', function (e) {
      if (!e.target.classList.contains('pag') || ['ArrowRight', 'ArrowLeft'].indexOf(e.key) < 0) return;
      var tabs = $$('.pag'), i = tabs.indexOf(e.target) + (e.key === 'ArrowRight' ? 1 : -1);
      var t = tabs[(i + tabs.length) % tabs.length]; t.focus(); t.click();
    });
    v.addEventListener('pointerover', function (e) {
      if (e.pointerType === 'touch') return;
      var it = e.target.closest('.kit-item[data-photo]'); if (!it) return;
      cancelAnimationFrame(fotoRaf);
      fotoRaf = requestAnimationFrame(function () { ponerFoto(it); });
    });
    document.addEventListener('kit:carta', function (e) { if (e.detail.el.closest('.vitrina')) armarVitrina(e.detail); });
    var kitEl = $('.vitrina [data-kit="carta"]');
    if (kitEl && $('.kit-carta__panel', kitEl) && window.borealKit) {
      Promise.all([window.borealKit.store.getCategorias(), window.borealKit.store.getProductos()]).then(function (r) { armarVitrina({ el: kitEl, categorias: r[0], productos: r[1] }); });
    }
  }

  // “Ver foto” en el celu: popup propio, cerrable con X, Escape o tocando afuera
  function verFoto(src, nombre) {
    if (!src) return;
    var pop = document.createElement('div');
    pop.className = 'foto-pop';
    pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-modal', 'true'); pop.setAttribute('aria-label', nombre);
    pop.innerHTML = '<div class="foto-pop__caja"><button type="button" class="foto-pop__x" aria-label="Cerrar">×</button><img alt=""><p></p></div>';
    $('img', pop).src = src; $('img', pop).alt = nombre; $('p', pop).textContent = nombre;
    document.body.appendChild(pop);
    requestAnimationFrame(function () { pop.classList.add('is-open'); });
    var antes = document.activeElement;
    function cerrar() { pop.classList.remove('is-open'); document.removeEventListener('keydown', esc); setTimeout(function () { pop.remove(); }, 280); if (antes && antes.focus) antes.focus({ preventScroll: true }); }
    function esc(e) { if (e.key === 'Escape') cerrar(); }
    pop.addEventListener('click', function (e) { if (e.target === pop || e.target.closest('.foto-pop__x')) cerrar(); });
    document.addEventListener('keydown', esc);
    $('.foto-pop__x', pop).focus();
  }

  /* ---------- DEL GRANO A LA TAZA: scroll horizontal ---------- */
  function grano() {
    var sec = $('.grano'), pista = $('[data-pista]');
    if (!sec || !pista) return;
    var activo = false, extra = 0, raf = 0;
    function medir() {
      var quiere = !reduce && window.innerWidth >= 900;
      pista.style.transform = '';
      if (!quiere) { sec.classList.remove('horizontal'); activo = false; return; }
      extra = Math.max(0, pista.scrollWidth - window.innerWidth);
      if (extra < 40) { sec.classList.remove('horizontal'); activo = false; return; }
      sec.classList.add('horizontal');
      sec.style.setProperty('--alto-grano', (window.innerHeight + extra) + 'px');
      activo = true; mover();
    }
    function mover() {
      raf = 0; if (!activo) return;
      var r = sec.getBoundingClientRect();
      var total = r.height - window.innerHeight;
      var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      pista.style.transform = 'translate3d(' + (-p * extra).toFixed(1) + 'px,0,0)';
    }
    window.addEventListener('scroll', function () { if (activo && !raf) raf = requestAnimationFrame(mover); }, { passive: true });
    var t = 0;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(medir, 150); });
    if (document.readyState === 'complete') medir(); else window.addEventListener('load', medir);
    medir();
  }

  /* ---------- FORMAS DEL MURAL que se mueven con el scroll ---------- */
  function parallax() {
    if (reduce) return;
    var decos = $$('.deco');
    var raf = 0;
    function mover() {
      raf = 0;
      var vh = window.innerHeight;
      decos.forEach(function (d, i) {
        var r = d.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var vel = i % 2 ? 0.08 : -0.06;
        d.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - vh / 2) * vel).toFixed(1) + 'px,0)';
      });
    }
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(mover); }, { passive: true });
    mover();
  }

  /* ---------- TU VASO: color del sticker y nivel ---------- */
  function sticker() {
    var guardado = null;
    try { guardado = localStorage.getItem('boreal:sticker'); } catch (_) { /* sin storage */ }
    function aplicar(c) {
      html.style.setProperty('--sticker', c);
      $$('[data-sticker]').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.sticker === c)); });
    }
    if (guardado) aplicar(guardado);
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sticker]'); if (!b) return;
      aplicar(b.dataset.sticker);
      try { localStorage.setItem('boreal:sticker', b.dataset.sticker); } catch (_) { /* nada */ }
    });
  }
  function nivel(lineas) {
    var n = (lineas || []).reduce(function (s, l) { return s + l.cant; }, 0);
    html.style.setProperty('--nivel', n ? Math.min(1, 0.22 + n * 0.13).toFixed(2) : '0');
  }

  /* ---------- Datos que salen del kit ---------- */
  function conKit(kit) {
    if (kit.carrito) nivel(kit.carrito.lineas);
    precios(kit);
  }
  function precios(kit) {
    kit.store.getProductos().then(function (ps) {
      $$('[data-precio]').forEach(function (el) {
        var p = ps.filter(function (x) { return x.id === el.dataset.precio; })[0];
        el.textContent = p && p.precio != null ? kit.money(p.precio) : 'Consultar';
      });
    });
  }

  function whatsapp() {
    $$('[data-wa]').forEach(function (a) { a.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(a.dataset.wa); });
  }

  /* La píldora del panel no tapa los botones del hero en el celu */
  function pildora() {
    var btns = $('.hero__btns');
    if (!btns || !('IntersectionObserver' in window)) { html.classList.add('pill-ok'); return; }
    new IntersectionObserver(function (e) { html.classList.toggle('pill-ok', !e[0].isIntersecting); }, { threshold: 0 }).observe(btns);
  }

  /* ---------- arranque ---------- */
  intro();
  reveals();
  menu();
  chipEstado();
  hoy();
  vitrinaEventos();
  grano();
  parallax();
  sticker();
  whatsapp();
  pildora();
  setInterval(function () { chipEstado(); }, 60000);
  document.addEventListener('kit:carrito', function (e) { nivel(e.detail.lineas); });
  document.addEventListener('kit:carta', function () { if (window.borealKit) precios(window.borealKit); });
  if (window.borealKit) conKit(window.borealKit);
  document.addEventListener('boreal:kit', function (e) { conKit(e.detail); });
})();
