/* ══════════════════════════════════════════════════
   HELLIJHON — interações
   ══════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ───────── Abertura: a logo se formando ─────────
     Troque para false se quiser a animação em toda visita
     (por padrão ela roda uma vez por aba, para não cansar em recargas). */
  var INTRO_UMA_VEZ_POR_SESSAO = true;

  (function intro() {
    var el = $('#intro');
    if (!el) return;

    var shapes = $$('#introShapes > *');
    var bar = $('#introBar');
    var jaViu = false;
    try { jaViu = sessionStorage.getItem('hj_intro') === '1'; } catch (e) {}

    function encerrar(rapido) {
      el.classList.add('out');
      document.body.classList.remove('locked');
      setTimeout(function () { el.remove(); }, rapido ? 220 : 900);
      kick();
      try { sessionStorage.setItem('hj_intro', '1'); } catch (e) {}
    }

    document.body.classList.add('locked');

    // Já viu nesta aba, ou pediu menos movimento: mostra e sai rápido.
    if (jaViu || reduce) {
      shapes.forEach(function (s) { s.style.fill = '#fff'; s.style.strokeOpacity = 0; });
      setTimeout(function () { encerrar(true); }, reduce ? 260 : 420);
      return;
    }

    // Mede cada traço e escalona da esquerda para a direita.
    var ordenados = shapes.map(function (s) {
      var x = 0, len = 0;
      try { x = s.getBBox().x; } catch (e) {}
      try { len = s.getTotalLength(); } catch (e) {}
      return { el: s, x: x, len: len };
    }).sort(function (a, b) { return a.x - b.x; });

    ordenados.forEach(function (o, i) {
      // getTotalLength() não cobre todos os shapes em todo browser:
      // sem comprimento, o traço não anima — então já entra preenchido.
      if (!o.len) { o.el.style.fill = '#fff'; o.el.style.strokeOpacity = 0; return; }
      o.el.style.setProperty('--len', o.len);
      o.el.style.setProperty('--d', (i * 0.055) + 's');
    });

    var ultimo = 0.055 * (ordenados.length - 1) + 1.15;   // s
    var total = (ultimo + 0.45) * 1000;                    // + respiro
    var t0 = performance.now();

    el.classList.add('go');

    (function progresso(now) {
      var p = Math.min((now - t0) / total, 1);
      bar.style.width = (p * 100).toFixed(1) + '%';
      if (p < 1) requestAnimationFrame(progresso);
    })(t0);

    setTimeout(function () { el.classList.add('lit'); }, ultimo * 1000 - 260);
    setTimeout(function () { encerrar(false); }, total);

    // Rede de segurança: se algo travar, o site aparece de qualquer jeito.
    setTimeout(function () {
      if (document.body.contains(el)) encerrar(true);
    }, 6000);
  })();

  /* ───────── Ano do rodapé ───────── */
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* ───────── Nav: sticky + scrollspy + progresso ───────── */
  var nav = $('#nav'), bar = $('#scrollBar'), fpEl = $('#fp');
  var links = $$('.nav__links a');
  var sections = links.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);

  function onScroll() {
    var sy = window.scrollY;
    nav.classList.toggle('stuck', sy > 40);

    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (h > 0 ? (sy / h) * 100 : 0) + '%';

    // o hero tem a própria barra embaixo: sobe o reprodutor para não colidir
    if (fpEl) {
      var hero = sections[0];
      fpEl.classList.toggle('raised', hero ? sy < hero.offsetHeight - 90 : false);
    }

    var cur = 0;
    sections.forEach(function (s, i) {
      if (s.offsetTop - window.innerHeight * 0.35 <= sy) cur = i;
    });
    links.forEach(function (a, i) { a.classList.toggle('active', i === cur); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ───────── Menu mobile ───────── */
  var burger = $('#burger'), menu = $('#menu');
  function closeMenu() {
    burger.classList.remove('on'); menu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('locked');
  }
  burger.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    burger.classList.toggle('on', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('locked', open);
  });
  $$('#menu a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
  });

  /* ───────── Reveal on scroll ───────── */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

  $$('.reveal').forEach(function (el, i) {
    el.style.transitionDelay = ((i % 4) * 0.07) + 's';
    io.observe(el);
  });

  /* ───────── Barras de EQ com alturas variadas ───────── */
  var wave = $('.player__wave');
  if (wave) {
    for (var w = 0; w < 44; w++) wave.appendChild(document.createElement('i'));
  }

  $$('.hud__eq i, .player__wave i, .fp__eq i').forEach(function (b) {
    b.style.height = (25 + Math.random() * 70) + '%';
    b.style.animationDelay = (Math.random() * -1.2) + 's';
  });

  /* ───────── BPM oscilante ───────── */
  var bpm = $('#bpmVal');
  if (bpm && !reduce) {
    var base = 124;
    setInterval(function () {
      bpm.textContent = (base + Math.floor(Math.random() * 9) - 2);
    }, 2600);
  }

  /* ───────── Glow do cursor ───────── */
  var glow = $('#cursorGlow');
  if (glow && window.matchMedia('(pointer:fine)').matches) {
    var gx = 0, gy = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', function (e) {
      gx = e.clientX; gy = e.clientY; glow.style.opacity = 1;
    }, { passive: true });
    (function tick() {
      cx += (gx - cx) * 0.09; cy += (gy - cy) * 0.09;
      glow.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      requestAnimationFrame(tick);
    })();
  }

  /* ───────── Parallax leve no retrato do hero ───────── */
  var portrait = $('.hero__portrait');
  if (portrait && !reduce && window.matchMedia('(pointer:fine)').matches) {
    var hero = $('.hero');
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      portrait.style.transform = 'translate3d(' + (px * -26) + 'px,' + (py * -18) + 'px,0)';
    }, { passive: true });
    hero.addEventListener('mouseleave', function () { portrait.style.transform = ''; });
  }

  /* ───────── Espectro animado do hero (canvas) ───────── */
  function kick() {
    var cv = $('#spectrum');
    if (!cv || reduce) return;
    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, BARS = 96, phase = [], seed = [];

    for (var i = 0; i < BARS; i++) { phase.push(Math.random() * Math.PI * 2); seed.push(0.4 + Math.random() * 0.6); }

    function size() {
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener('resize', size);

    var t = 0;
    (function draw() {
      ctx.clearRect(0, 0, W, H);
      t += 0.022;

      var gap = 3;
      var bw = (W - gap * (BARS - 1)) / BARS;

      for (var i = 0; i < BARS; i++) {
        // envelope: mais alto no centro, com "kick" pulsante
        var n = i / (BARS - 1);
        var env = Math.pow(Math.sin(Math.PI * n), 0.7);
        var wob = Math.sin(t * 1.7 + phase[i]) * 0.5 + 0.5;
        var fast = Math.sin(t * 5.3 + i * 0.35) * 0.5 + 0.5;
        var beat = Math.pow(Math.max(0, Math.sin(t * 2.05)), 6) * 0.35;
        var h = (0.12 + (wob * 0.55 + fast * 0.32) * seed[i] * env + beat * env) * H * 0.86;

        var x = i * (bw + gap);
        var g = ctx.createLinearGradient(0, H, 0, H - h);
        g.addColorStop(0, 'rgba(0,6,117,0)');
        g.addColorStop(0.35, 'rgba(0,90,220,0.45)');
        g.addColorStop(1, 'rgba(0,231,255,0.95)');
        ctx.fillStyle = g;
        ctx.fillRect(x, H - h, bw, h);

        // ponta brilhante
        ctx.fillStyle = 'rgba(220,250,255,0.9)';
        ctx.fillRect(x, H - h, bw, 1.6);
      }
      requestAnimationFrame(draw);
    })();
  }


  /* ───────── Reprodutor flutuante ─────────
     Navegadores bloqueiam áudio antes de qualquer interação do usuário.
     Tentamos tocar já no load; se for recusado, a música entra no primeiro
     clique/toque/tecla. O botão sempre reflete o estado real do <audio>. */
  (function reprodutor() {
    var fp = $('#fp'), audio = $('#fpAudio'), btn = $('#fpPlay'), vol = $('#fpVol');
    if (!fp || !audio) return;

    var K_VOL = 'hj_volume', K_OFF = 'hj_audio_off';
    var ls = {
      get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
      set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
      del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
    };

    // volume inicial (lembrado entre visitas)
    var v = 0.45, salvo = parseFloat(ls.get(K_VOL));
    if (!isNaN(salvo)) v = Math.min(1, Math.max(0, salvo));
    audio.volume = v;
    if (vol) { vol.value = Math.round(v * 100); vol.style.setProperty('--fill', (v * 100) + '%'); }

    function sync() {
      var tocando = !audio.paused && !audio.ended;
      fp.classList.toggle('playing', tocando);
      btn.setAttribute('aria-pressed', String(tocando));
      btn.setAttribute('aria-label', tocando ? 'Pausar música' : 'Tocar música');
    }
    audio.addEventListener('play', sync);
    audio.addEventListener('pause', sync);

    btn.addEventListener('click', function () {
      if (audio.paused) {
        ls.del(K_OFF);
        audio.play().then(sync).catch(sync);
      } else {
        ls.set(K_OFF, '1');
        audio.pause();
      }
    });

    if (vol) {
      vol.addEventListener('input', function () {
        audio.volume = vol.value / 100;
        vol.style.setProperty('--fill', vol.value + '%');
        ls.set(K_VOL, audio.volume);
      });
    }

    // início automático, dentro do que o navegador permite
    if (ls.get(K_OFF) === '1' || reduce) { sync(); return; }

    audio.preload = 'auto';
    var eventos = ['pointerdown', 'keydown', 'touchstart'];
    function noPrimeiroGesto() {
      audio.play().catch(function () {});
      eventos.forEach(function (e) { document.removeEventListener(e, noPrimeiroGesto); });
    }
    audio.play().catch(function () {
      eventos.forEach(function (e) {
        document.addEventListener(e, noPrimeiroGesto, { passive: true });
      });
    });
    sync();
  })();

  /* ───────── Lightbox da galeria ───────── */
  var items = $$('.gal__item');
  var lb = $('#lb'), lbImg = $('#lbImg'), lbVid = $('#lbVid'), lbCap = $('#lbCap');
  var idx = 0;

  // a musica de fundo sai de cena enquanto um video toca, senao os
  // dois audios se sobrepoem; volta sozinha depois se estava tocando.
  var trilha = $('#fpAudio'), trilhaPausadaPeloVideo = false;
  function pausarTrilha() {
    if (trilha && !trilha.paused) { trilhaPausadaPeloVideo = true; trilha.pause(); }
  }
  function retomarTrilha() {
    if (trilha && trilhaPausadaPeloVideo) {
      trilhaPausadaPeloVideo = false;
      trilha.play().catch(function () {});
    }
  }

  function descarregarVideo() {
    if (!lbVid) return;
    lbVid.pause();
    lbVid.removeAttribute('src');
    lbVid.load();               // solta o buffer de verdade
    lbVid.hidden = true;
  }

  function open(i) {
    idx = (i + items.length) % items.length;
    var item = items[idx];
    var img = item.querySelector('img');
    var cap = item.querySelector('figcaption');
    var video = item.getAttribute('data-video');

    descarregarVideo();

    if (video) {
      lbImg.hidden = true;
      lbVid.hidden = false;
      lbVid.poster = img.currentSrc || img.src;
      lbVid.src = video;
      pausarTrilha();
      lbVid.play().catch(function () {});
    } else {
      lbImg.hidden = false;
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || '';
      retomarTrilha();
    }

    lbCap.textContent = cap ? cap.textContent : '';
    lb.classList.add('open');
    document.body.classList.add('locked');
  }

  function close() {
    descarregarVideo();
    retomarTrilha();
    lb.classList.remove('open');
    document.body.classList.remove('locked');
  }

  items.forEach(function (f, i) {
    f.setAttribute('tabindex', '0');
    f.setAttribute('role', 'button');
    f.addEventListener('click', function () { open(i); });
    f.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
    });
  });

  $('#lbClose').addEventListener('click', close);
  $('#lbPrev').addEventListener('click', function () { open(idx - 1); });
  $('#lbNext').addEventListener('click', function () { open(idx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') open(idx - 1);
    if (e.key === 'ArrowRight') open(idx + 1);
  });

  /* ───────── Imagens remotas que falharem: esconder o card ───────── */
  $$('.gal__item img').forEach(function (img) {
    img.addEventListener('error', function () {
      var fig = img.closest('.gal__item');
      if (fig) fig.style.display = 'none';
    });
  });

})();
