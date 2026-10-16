/* =========================================================
   Blush & Bloom — Portfolio page — standalone script for portfolio.html
   ========================================================= */
(function () {
  'use strict';

  // Icons are inline Lucide SVGs in the HTML — no CDN or JS needed to render them.

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const body = document.body;
  const DESKTOP = window.matchMedia('(min-width: 1024px)');
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };

  /* ---------- Preloader: split title into letters ---------- */
  const preTitle = $('[data-split]');
  if (preTitle) {
    const text = preTitle.textContent;
    preTitle.textContent = '';
    [...text].forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'ch';
      span.style.setProperty('--c', i);
      span.textContent = ch === ' ' ? ' ' : ch;
      preTitle.appendChild(span);
    });
  }

  const preloader = $('#preloader');
  const MIN_SHOW = 2200;
  const start = performance.now();
  let finished = false;
  function finishLoading() {
    if (finished) return;
    finished = true;
    const wait = Math.max(0, MIN_SHOW - (performance.now() - start));
    setTimeout(() => {
      if (preloader) preloader.classList.add('is-done');
      body.classList.add('loaded');
    }, wait);
  }
  if (document.readyState === 'complete') finishLoading();
  else window.addEventListener('load', finishLoading);
  setTimeout(finishLoading, 4500); // failsafe

  /* ---------- Stagger index for nav items ---------- */
  $$('.nav-list > li').forEach((li, i) => li.style.setProperty('--n', i));

  /* ---------- Theme (light / dark) ---------- */
  const themeBtn = $('#themeToggle');
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    themeBtn.setAttribute('aria-pressed', String(t === 'dark'));
  }
  applyTheme(root.getAttribute('data-theme') || 'light');
  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    store.set('bb-theme', next);
  });

  /* ---------- Direction (LTR / RTL) ---------- */
  const dirBtn = $('#dirToggle');
  const dirLabel = $('.dir-label', dirBtn);
  function applyDir(d) {
    root.setAttribute('dir', d);
    dirLabel.textContent = d === 'rtl' ? 'LTR' : 'RTL';
    dirBtn.setAttribute('aria-label', d === 'rtl' ? 'Switch to left-to-right' : 'Switch to right-to-left');
  }
  applyDir(root.getAttribute('dir') || 'ltr');
  dirBtn.addEventListener('click', () => {
    const next = root.getAttribute('dir') === 'rtl' ? 'ltr' : 'rtl';
    applyDir(next);
    store.set('bb-dir', next);
  });

  /* ---------- Header scroll state + back to top ---------- */
  const header = $('#header');
  const toTop = $('#toTop');
  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 30);
    toTop.classList.toggle('is-visible', y > 700);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' }));

  /* ---------- Home dropdown ---------- */
  const dd = $('#homeDropdown');
  const ddBtn = $('.dropdown-toggle', dd);
  function setDropdown(open) {
    dd.classList.toggle('is-open', open);
    ddBtn.setAttribute('aria-expanded', String(open));
  }
  ddBtn.addEventListener('click', e => {
    e.stopPropagation();
    setDropdown(!dd.classList.contains('is-open'));
  });
  document.addEventListener('click', e => { if (!dd.contains(e.target)) setDropdown(false); });

  /* ---------- Mobile menu (hamburger) ---------- */
  const hamburger = $('#hamburger');
  const nav = $('#nav');
  const overlay = $('#navOverlay');
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    hamburger.classList.toggle('is-open', open);
    overlay.classList.toggle('is-visible', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    body.classList.toggle('no-scroll', open);
    if (!open) setDropdown(false);
  }
  hamburger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  overlay.addEventListener('click', () => setMenu(false));
  $$('a.nav-link, .dropdown-link', nav).forEach(a => a.addEventListener('click', () => {
    setDropdown(false);
    setMenu(false);
  }));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (dd.classList.contains('is-open')) { setDropdown(false); ddBtn.focus(); }
    if (nav.classList.contains('is-open')) { setMenu(false); hamburger.focus(); }
  });
  const onBreakpoint = e => { if (e.matches) setMenu(false); };
  if (DESKTOP.addEventListener) DESKTOP.addEventListener('change', onBreakpoint);
  else DESKTOP.addListener(onBreakpoint);

  /* ---------- Active link highlighting (page-based) ---------- */
  const topLinks = $$('.nav-link');
  const page = (decodeURIComponent(location.pathname.split('/').pop()) || 'index.html').toLowerCase();
  const homePages = ['index.html', 'home2.html'];

  $$('.dropdown-link').forEach(a => {
    const on = a.getAttribute('href').toLowerCase() === page;
    a.classList.toggle('is-current', on);
    if (on) a.setAttribute('aria-current', 'page');
  });

  let activeLink = null;
  if (homePages.includes(page)) {
    activeLink = $('[data-home]');
  } else {
    activeLink = topLinks.find(a => (a.getAttribute('href') || '').toLowerCase() === page) || null;
    if (activeLink) activeLink.setAttribute('aria-current', 'page');
  }
  topLinks.forEach(a => a.classList.toggle('is-active', a === activeLink));

  /* ---------- Scroll animations (every section) ---------- */

  const animated = $$('.reveal, [data-animate]');
  function show(el) {
    el.classList.add('is-visible');
    // After the entrance finishes, drop the stagger delay so hover effects respond instantly
    const delay = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
    setTimeout(() => el.style.setProperty('--d', '0s'), (delay + 1.2) * 1000);
  }
  if ('IntersectionObserver' in window && !REDUCED) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) { show(en.target); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    animated.forEach(el => io.observe(el));
  } else {
    animated.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Counters ---------- */
  function animateCount(el) {
    const target = Number(el.dataset.count);
    const decimal = Number(el.dataset.decimal || 0);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const t0 = performance.now();
    const step = now => {
      const p = Math.min((now - t0) / duration, 1);
      const val = target * (1 - Math.pow(1 - p, 3));
      el.textContent = decimal
        ? (val / Math.pow(10, decimal)).toFixed(decimal) + suffix
        : Math.round(val).toLocaleString('en-IN') + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => { if (en.isIntersecting) { animateCount(en.target); obs.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(c => cio.observe(c));
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- Smooth scroll buttons (hero "View Gallery" + scroll cue) ---------- */
  $$('[data-scroll-to]').forEach(btn => btn.addEventListener('click', () => {
    const target = $(btn.dataset.scrollTo);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - header.offsetHeight;
    window.scrollTo({ top, behavior: REDUCED ? 'auto' : 'smooth' });
  }));

  /* =========================================================
     PORTFOLIO sections
     ========================================================= */

  /* ---------- Gallery filters (sliding pill + animated re-layout) ---------- */
  const filterBar = $('.p-filters');
  const grid = $('[data-gallery]');
  const items = grid ? $$('.p-item', grid) : [];
  if (filterBar && grid) {
    const ink = $('.p-filter-ink', filterBar);
    const buttons = $$('.p-filter', filterBar);
    const moveInk = btn => {
      if (!ink || !btn) return;
      ink.style.setProperty('--ink-w', btn.offsetWidth + 'px');
      ink.style.setProperty('--ink-h', btn.offsetHeight + 'px');
      ink.style.setProperty('--ink-x', btn.offsetLeft + 'px');
      ink.style.setProperty('--ink-y', btn.offsetTop + 'px');
    };
    const activeBtn = () => buttons.find(b => b.classList.contains('is-active'));
    moveInk(activeBtn());
    requestAnimationFrame(() => filterBar.classList.add('is-ready'));
    window.addEventListener('resize', () => moveInk(activeBtn()));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveInk(activeBtn()));

    let timer = null;
    const applyFilter = cat => {
      clearTimeout(timer);
      const match = el => cat === 'all' || el.dataset.cat === cat;
      // 1) fade out everything that is leaving
      items.forEach(el => { if (!match(el) && !el.classList.contains('is-hidden')) el.classList.add('is-filtering'); });
      timer = setTimeout(() => {
        // 2) re-layout, then animate the remaining items in with a stagger
        let n = 0;
        items.forEach(el => {
          el.classList.remove('is-filtering', 'is-entering');
          const show = match(el);
          el.classList.toggle('is-hidden', !show);
          if (show) {
            el.classList.add('is-visible');           // never left waiting on the scroll reveal
            el.style.setProperty('--e', (n++ * 0.05) + 's');
            void el.offsetWidth;
            if (!REDUCED) el.classList.add('is-entering');
          }
        });
      }, REDUCED ? 0 : 280);
    };
    buttons.forEach(btn => btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) return;
      buttons.forEach(b => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
      moveInk(btn);
      btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
      applyFilter(btn.dataset.filter);
    }));
  }

  /* ---------- Gallery lightbox (steps through the currently filtered items) ---------- */
  const lightbox = $('#lightbox');
  if (lightbox && items.length) {
    const lbImg = $('#lbImg');
    const lbCaption = $('#lbCaption');
    const lbCount = $('#lbCount');
    let list = [];
    let current = 0;
    let lastFocus = null;

    const showShot = i => {
      current = (i + list.length) % list.length;
      const shot = list[current];
      lbImg.classList.add('is-loading');
      lbImg.onload = lbImg.onerror = () => lbImg.classList.remove('is-loading');
      lbImg.src = shot.dataset.full;
      lbImg.alt = shot.dataset.caption || '';
      lbCaption.textContent = shot.dataset.caption || '';
      lbCount.textContent = `${String(current + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
    };
    const openLightbox = shot => {
      list = items.filter(el => !el.classList.contains('is-hidden'));
      lastFocus = document.activeElement;
      showShot(list.indexOf(shot));
      if (typeof lightbox.showModal === 'function') lightbox.showModal(); else lightbox.setAttribute('open', '');
      body.classList.add('no-scroll');
    };
    const closeLightbox = () => {
      if (typeof lightbox.close === 'function') lightbox.close(); else lightbox.removeAttribute('open');
    };

    items.forEach(shot => shot.addEventListener('click', () => openLightbox(shot)));
    lightbox.addEventListener('close', () => {
      body.classList.remove('no-scroll');
      if (lastFocus) lastFocus.focus();
    });
    lightbox.addEventListener('click', e => {
      const btn = e.target.closest('[data-lb]');
      if (btn) {
        const act = btn.dataset.lb;
        if (act === 'close') closeLightbox();
        else showShot(current + (act === 'next' ? 1 : -1));
      } else if (e.target === lightbox) {
        closeLightbox(); // backdrop click
      }
    });
    lightbox.addEventListener('keydown', e => {
      const rtl = root.getAttribute('dir') === 'rtl';
      if (e.key === 'ArrowRight') showShot(current + (rtl ? -1 : 1));
      if (e.key === 'ArrowLeft') showShot(current + (rtl ? 1 : -1));
    });
    let startX = null;
    lightbox.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', e => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) showShot(current + (dx < 0 ? 1 : -1));
      startX = null;
    });
  }

  /* ---------- Before & after: service tabs swap the photo pair + caption ---------- */
  const ba = $('[data-ba]');
  if (ba) {
    const tabs = $$('.p-ba-tab');
    const photos = $$('.photo', ba);
    const note = $('.p-ba-note');
    const noteText = $('.p-ba-note-text');
    tabs.forEach(tab => tab.addEventListener('click', () => {
      if (tab.classList.contains('is-active')) return;
      tabs.forEach(t => { t.classList.toggle('is-active', t === tab); t.setAttribute('aria-pressed', String(t === tab)); });
      ba.classList.add('is-swapping');
      if (note) note.classList.add('is-swapping');
      setTimeout(() => {
        photos.forEach(ph => ph.style.setProperty('--img', `url('${tab.dataset.img}')`));
        if (noteText) noteText.innerHTML = tab.dataset.note || '';
        ba.classList.remove('is-swapping');
        if (note) note.classList.remove('is-swapping');
      }, REDUCED ? 0 : 450);
    }));
  }

  /* ---------- Love notes carousel (autoplay, pauses on hover/focus, swipe) ---------- */
  const carousel = $('[data-carousel]');
  if (carousel) {
    const slides = $$('.p-quote', carousel);
    const dots = $$('.p-dot');
    let index = 0;
    let auto = null;

    const go = i => {
      const next = (i + slides.length) % slides.length;
      if (next === index) return;
      const prev = slides[index];
      prev.classList.remove('is-active');
      prev.classList.add('is-leaving');
      prev.setAttribute('aria-hidden', 'true');
      setTimeout(() => prev.classList.remove('is-leaving'), 600);
      slides[next].classList.add('is-active');
      slides[next].removeAttribute('aria-hidden');
      dots.forEach((d, k) => d.classList.toggle('is-active', k === next));
      index = next;
    };
    const play = () => { if (!REDUCED) { stop(); auto = setInterval(() => go(index + 1), 6000); } };
    const stop = () => { clearInterval(auto); auto = null; };

    $$('[data-step]').forEach(b => b.addEventListener('click', () => { go(index + Number(b.dataset.step)); play(); }));
    dots.forEach(d => d.addEventListener('click', () => { go(Number(d.dataset.go)); play(); }));
    [carousel, $('.p-quotes-nav')].forEach(el => {
      if (!el) return;
      el.addEventListener('mouseenter', stop);
      el.addEventListener('mouseleave', play);
      el.addEventListener('focusin', stop);
      el.addEventListener('focusout', play);
    });
    let sx = null;
    carousel.addEventListener('touchstart', e => { sx = e.touches[0].clientX; stop(); }, { passive: true });
    carousel.addEventListener('touchend', e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
      sx = null; play();
    });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));
    play();
  }

  /* ---------- Footer year ---------- */
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
})();