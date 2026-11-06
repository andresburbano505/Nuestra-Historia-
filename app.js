(function () {
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var CO = 5 * 3600e3; // Colombia = UTC-5

  // ================= pantalla de entrada =================
  var gate = $('gate'), page = $('page'), form = $('gate-form'), input = $('gate-in'), msg = $('gate-msg');
  var opened = false;
  try { opened = sessionStorage.getItem('abierto') === '1'; } catch (e) {}

  function isAnniversary(v) {
    v = v.toLowerCase().replace('marzo', '/3/');
    var g = v.match(/\d+/g) || [];
    if (g.length === 1) {
      var s = g[0];
      return s === '14032024' || s === '1432024' || s === '20240314' || s === '140324' || s === '14324';
    }
    if (g.length !== 3) return false;
    var a = +g[0], b = +g[1], c = +g[2];
    var y = function (n) { return n === 2024 || n === 24; };
    return (a === 14 && b === 3 && y(c)) || (y(a) && b === 3 && c === 14);
  }

  function unlock(animate) {
    try { sessionStorage.setItem('abierto', '1'); } catch (e) {}
    page.inert = false;
    if (!animate) {
      gate.hidden = true; root.classList.remove('locked'); root.classList.add('unlocked');
      startReveal(); return;
    }
    gate.classList.add('open', 'out');
    setTimeout(function () { root.classList.add('unlocked'); }, reduce ? 0 : 1050);
    setTimeout(function () {
      gate.hidden = true; root.classList.remove('locked'); startReveal();
    }, reduce ? 350 : 1600);
  }

  if (opened) { unlock(false); }
  else {
    root.classList.add('locked');
    page.inert = true;
    setTimeout(function () { try { input.focus({ preventScroll: true }); } catch (e) {} }, 60);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (isAnniversary(input.value)) {
      msg.textContent = 'Sabía que no la olvidarías ♥';
      input.blur();
      unlock(true);
    } else {
      msg.textContent = input.value.trim() ? 'Esa no es… inténtalo otra vez' : 'Escribe la fecha primero';
      if (!reduce && input.animate) {
        input.animate(
          [{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' },
           { transform: 'translateX(-4px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }],
          { duration: 320, easing: 'ease-out' });
      }
      input.select();
    }
  });
  input.addEventListener('input', function () { if (msg.textContent) msg.textContent = ''; });

  // ================= juntos desde el 14/03/2024 =================
  var START = Date.UTC(2024, 2, 14) + CO;
  function tickTogether(now) {
    var s = Math.floor(Math.max(0, now - START) / 1000);
    $('c-d').textContent = Math.floor(s / 86400).toLocaleString('es-CO');
    $('c-h').textContent = pad(Math.floor(s % 86400 / 3600));
    $('c-m').textContent = pad(Math.floor(s % 3600 / 60));
    $('c-s').textContent = pad(s % 60);
  }

  // ================= cuentas regresivas =================
  // Devuelve {t: medianoche del día objetivo en Colombia, today: bool, y, m}
  function target(kind, now) {
    var co = new Date(now - CO), Y = co.getUTCFullYear(), M = co.getUTCMonth(), D = co.getUTCDate();
    var y = Y, m, d;
    if (kind === 'month') { d = 14; m = D <= 14 ? M : M + 1; }
    else {
      m = kind === 'bday' ? 3 : 2; d = kind === 'bday' ? 27 : 14;
      if (M > m || (M === m && D > d)) y = Y + 1;
    }
    var t = new Date(Date.UTC(y, m, d));
    var isToday = t.getUTCFullYear() === Y && t.getUTCMonth() === M && t.getUTCDate() === D;
    return { t: t.getTime() + CO, today: isToday, y: t.getUTCFullYear(), m: t.getUTCMonth() };
  }
  var cards = Array.prototype.map.call(document.querySelectorAll('[data-cd]'), function (el) {
    var u = {};
    el.querySelectorAll('[data-u]').forEach(function (b) { u[b.dataset.u] = b; });
    return { el: el, kind: el.dataset.cd, u: u, sub: el.querySelector('[data-sub]') };
  });
  function tickCards(now) {
    cards.forEach(function (c) {
      var x = target(c.kind, now), sub;
      if (c.kind === 'month') {
        var months = (x.y - 2024) * 12 + (x.m - 2);
        sub = x.today ? '¡Hoy cumplimos ' + months + ' meses!' : 'para cumplir ' + months + ' meses';
      } else if (c.kind === 'bday') {
        sub = x.today ? '¡Feliz cumpleaños, mi amor!' : 'para tus ' + (x.y - 2008) + ' años';
      } else {
        var yrs = x.y - 2024;
        sub = x.today ? '¡Hoy cumplimos ' + yrs + (yrs === 1 ? ' año' : ' años') + '!' : 'para cumplir ' + yrs + (yrs === 1 ? ' año' : ' años');
      }
      c.el.classList.toggle('today', x.today);
      if (c.sub.textContent !== sub) c.sub.textContent = sub;
      if (x.today) return;
      var s = Math.floor(Math.max(0, x.t - now) / 1000);
      c.u.d.textContent = Math.floor(s / 86400);
      c.u.h.textContent = pad(Math.floor(s % 86400 / 3600));
      c.u.m.textContent = pad(Math.floor(s % 3600 / 60));
      c.u.s.textContent = pad(s % 60);
    });
  }
  function tick() { var now = Date.now(); tickTogether(now); tickCards(now); }
  tick(); setInterval(tick, 1000);

  // ================= fotos que aparecen al bajar =================
  function startReveal() {
    if (!('IntersectionObserver' in window)) return;
    var vh = window.innerHeight;
    var items = Array.prototype.filter.call(
      document.querySelectorAll('.chap .pol, .final .pol, .album .pol'),
      function (el) { return el.getBoundingClientRect().top > vh; });
    items.forEach(function (el) { el.classList.add('pre'); });
    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (en) { return en.isIntersecting; });
      batch.forEach(function (en, k) {
        var el = en.target;
        el.style.transitionDelay = reduce ? '0s' : '0s, 0s, ' + (k * 70) + 'ms, ' + (k * 70) + 'ms';
        el.classList.remove('pre');
        io.unobserve(el);
        setTimeout(function () { el.style.transitionDelay = ''; }, 900 + k * 70);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  // ================= visor de fotos =================
  var imgs = Array.prototype.slice.call(document.querySelectorAll('img.ph'));
  var lb = $('lb'), lbImg = $('lb-img'), lbCap = $('lb-cap'), i = 0, lastFocus = null, closeT = null;
  function show(n) {
    i = (n + imgs.length) % imgs.length;
    var el = imgs[i];
    lbImg.src = el.currentSrc || el.src;
    lbImg.alt = el.alt;
    var cap = el.parentNode.querySelector('figcaption');
    lbCap.textContent = cap ? cap.textContent : '';
  }
  function open(n) {
    clearTimeout(closeT);
    lastFocus = document.activeElement; show(n);
    lb.hidden = false; document.body.style.overflow = 'hidden';
    lb.getBoundingClientRect();
    lb.classList.add('show');
    $('lb-x').focus();
  }
  function close() {
    lb.classList.remove('show');
    document.body.style.overflow = '';
    closeT = setTimeout(function () { lb.hidden = true; }, reduce ? 0 : 200);
    if (lastFocus) lastFocus.focus();
  }
  imgs.forEach(function (el, n) {
    el.tabIndex = 0;
    el.addEventListener('click', function () { open(n); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(n); } });
  });
  $('lb-x').addEventListener('click', close);
  $('lb-prev').addEventListener('click', function () { show(i - 1); });
  $('lb-next').addEventListener('click', function () { show(i + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden || !lb.classList.contains('show')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(i - 1);
    else if (e.key === 'ArrowRight') show(i + 1);
  });
  var x0 = null;
  lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) show(dx < 0 ? i + 1 : i - 1);
  });

  // ================= solo un video sonando a la vez =================
  document.addEventListener('play', function (e) {
    document.querySelectorAll('video').forEach(function (v) { if (v !== e.target) v.pause(); });
  }, true);
})();
