/* =========================================================
   Blush & Bloom — Home 2 (Modern) — standalone script for home2.html
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

  /* =========================================================
     HOME 2 sections
     ========================================================= */

  /* ---------- "Explore Bridal Packages" → smooth scroll to the packages section ---------- */
  $$('[data-scroll-to]').forEach(btn => btn.addEventListener('click', () => {
    const target = $(btn.dataset.scrollTo);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - header.offsetHeight;
    window.scrollTo({ top, behavior: REDUCED ? 'auto' : 'smooth' });
  }));

  /* ---------- Ceremony tabs ---------- */
  const tabs = $$('.m-tab');
  if (tabs.length) {
    const activate = (tab, focus) => {
      tabs.forEach(t => {
        const on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        panel.hidden = !on;
        panel.classList.toggle('is-active', on);
      });
      if (focus) tab.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => activate(t));
      t.addEventListener('keydown', e => {
        const rtl = root.getAttribute('dir') === 'rtl';
        let n = null;
        if (e.key === 'ArrowRight') n = rtl ? i - 1 : i + 1;
        if (e.key === 'ArrowLeft') n = rtl ? i + 1 : i - 1;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = tabs.length - 1;
        if (n === null) return;
        e.preventDefault();
        activate(tabs[(n + tabs.length) % tabs.length], true);
      });
    });
  }

  /* ---------- Package toggle: bride only / bride + family ---------- */
  const planBtns = $$('.m-toggle-btn');
  if (planBtns.length) {
    planBtns.forEach(btn => btn.addEventListener('click', () => {
      const plan = btn.dataset.plan;
      planBtns.forEach(b => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
      $$('.m-price-amount .amt').forEach(el => {
        el.classList.add('is-changing');
        setTimeout(() => { el.textContent = el.dataset[plan]; el.classList.remove('is-changing'); }, 220);
      });
    }));
  }

  /* ---------- FAQ accordion (one open at a time) ---------- */
  const accItems = $$('.m-acc-item');
  accItems.forEach(item => {
    const btn = $('.m-acc-btn', item);
    btn.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      accItems.forEach(other => {
        other.classList.remove('is-open');
        $('.m-acc-btn', other).setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Consultation form ---------- */
  const aForm = $('#appointForm');
  if (aForm) {
    const aError = $('#appointError');
    const aSuccess = $('#appointSuccess');
    const aDate = $('#aDate');
    if (aDate) aDate.min = new Date().toISOString().split('T')[0];
    aForm.addEventListener('submit', e => {
      e.preventDefault();
      let firstBad = null;
      $$('[required]', aForm).forEach(f => {
        const bad = !f.value.trim() || (f.type === 'tel' && !/^[+\d\s-]{8,}$/.test(f.value.trim()));
        f.classList.toggle('invalid', bad);
        if (bad && !firstBad) firstBad = f;
      });
      if (firstBad) {
        aError.textContent = firstBad.type === 'tel' && firstBad.value ? 'Please enter a valid phone number.' : 'Please fill in all required fields.';
        firstBad.focus();
        return;
      }
      aError.textContent = '';
      aForm.reset();
      aForm.hidden = true;
      aSuccess.hidden = false;
    });
    $$('input, select, textarea', aForm).forEach(f => f.addEventListener('input', () => { f.classList.remove('invalid'); aError.textContent = ''; }));
  }

  /* ---------- Footer year ---------- */
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
})();