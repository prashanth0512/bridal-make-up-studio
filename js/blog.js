/* =========================================================
   Blush & Bloom — Blog page — standalone script for blog.html
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

  /* ---------- Smooth scroll buttons (hero buttons + scroll cue) ---------- */
  $$('[data-scroll-to]').forEach(btn => btn.addEventListener('click', () => {
    const target = $(btn.dataset.scrollTo);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - header.offsetHeight;
    window.scrollTo({ top, behavior: REDUCED ? 'auto' : 'smooth' });
  }));

  /* =========================================================
     BLOG sections
     ========================================================= */

  /* ---------- Articles: topic filter + load more ---------- */
  const postGrid = $('[data-posts]');
  if (postGrid) {
    const cards = $$('.b-card', postGrid);
    const filterBar = $('.b-filters');
    const filterBtns = $$('.b-filter', filterBar);
    const ink = $('.b-filter-ink', filterBar);
    const moreWrap = $('.b-more');
    const moreBtn = $('#loadMore');
    const moreCount = $('.b-more-count', moreBtn);
    const initial = Number(postGrid.dataset.initial) || 6;
    let category = 'all';
    let expanded = false;

    const moveInk = btn => {
      if (!ink || !btn) return;
      ink.style.setProperty('--ink-w', btn.offsetWidth + 'px');
      ink.style.setProperty('--ink-h', btn.offsetHeight + 'px');
      ink.style.setProperty('--ink-x', btn.offsetLeft + 'px');
      ink.style.setProperty('--ink-y', btn.offsetTop + 'px');
    };
    const activeBtn = () => filterBtns.find(b => b.classList.contains('is-active'));
    moveInk(activeBtn());
    requestAnimationFrame(() => filterBar.classList.add('is-ready'));
    window.addEventListener('resize', () => moveInk(activeBtn()));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveInk(activeBtn()));

    const matches = card => category === 'all' || card.dataset.cat === category;

    // Show matching cards; the "load more" limit only applies to the unfiltered list
    let timer = null;
    const render = (animate = true) => {
      clearTimeout(timer);
      const browsing = category === 'all';
      const visible = cards.filter(matches);
      const limit = browsing && !expanded ? initial : Infinity;
      const shown = new Set(visible.slice(0, limit));

      if (animate && !REDUCED) cards.forEach(c => { if (!shown.has(c) && !c.classList.contains('is-hidden') && !c.classList.contains('is-more')) c.classList.add('is-filtering'); });

      timer = setTimeout(() => {
        let n = 0;
        cards.forEach(c => {
          const was = !c.classList.contains('is-hidden') && !c.classList.contains('is-more');
          c.classList.remove('is-filtering', 'is-entering', 'is-more');
          const show = shown.has(c);
          c.classList.toggle('is-hidden', !show);
          if (show) {
            c.classList.add('is-visible');
            if (animate && !REDUCED && !was) {
              c.style.setProperty('--e', (n++ * 0.06) + 's');
              void c.offsetWidth;
              c.classList.add('is-entering');
            }
          }
        });
        const remaining = browsing && !expanded ? Math.max(visible.length - initial, 0) : 0;
        moreWrap.hidden = remaining === 0;
        moreCount.textContent = remaining;
      }, animate && !REDUCED ? 260 : 0);
    };

    filterBtns.forEach(btn => btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) return;
      filterBtns.forEach(b => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
      category = btn.dataset.filter;
      moveInk(btn);
      btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
      render();
    }));

    moreBtn.addEventListener('click', () => { expanded = true; render(); });
  }

  /* ---------- Newsletter (front-end validation + thank-you message) ---------- */
  const newsForm = $('#newsForm');
  if (newsForm) {
    const email = $('#newsEmail');
    const msg = $('#newsMsg');
    newsForm.addEventListener('submit', e => {
      e.preventDefault();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
      newsForm.classList.remove('is-invalid');
      msg.classList.remove('is-ok', 'is-error');
      if (!ok) {
        void newsForm.offsetWidth;
        newsForm.classList.add('is-invalid');
        msg.classList.add('is-error');
        msg.textContent = 'Please enter a valid email address.';
        email.focus();
        return;
      }
      msg.classList.add('is-ok');
      msg.textContent = 'Thank you! You are on the list.';
      newsForm.reset();
    });
    email.addEventListener('input', () => { newsForm.classList.remove('is-invalid'); msg.textContent = ''; msg.classList.remove('is-error'); });
  }

  /* ---------- Footer year ---------- */
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
})();