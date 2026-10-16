/* =========================================================
   Blush & Bloom — Contact page — standalone script for contact.html
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
     CONTACT sections
     ========================================================= */

  /* ---------- Enquiry form: live validation + success state ---------- */
  const form = $('#contactForm');
  if (form) {
    const success = $('#contactSuccess');
    const successName = $('#successName');
    const msg = $('#cMessage');
    const count = $('#cCount');
    const date = $('#cDate');
    if (date) date.min = new Date().toISOString().split('T')[0];

    const rules = {
      cName: v => v.trim().length >= 2 || 'Please enter your name.',
      cPhone: v => /^[+\d][\d\s-]{7,}$/.test(v.trim()) || 'Please enter a valid phone number.',
      cEmail: v => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
      cDate: v => (!!v && v >= date.min) || 'Please choose your wedding date.',
      cService: v => !!v || 'Please choose a service.',
    };
    const check = (input, show = true) => {
      const rule = rules[input.id];
      if (!rule) return true;
      const res = rule(input.value);
      const field = input.closest('.c-field');
      const err = $('.c-error', field);
      const ok = res === true;
      if (show) {
        field.classList.toggle('is-invalid', !ok);
        field.classList.toggle('is-valid', ok && !!input.value.trim());
        err.textContent = ok ? '' : res;
        input.setAttribute('aria-invalid', String(!ok));
      }
      return ok;
    };
    Object.keys(rules).forEach(id => {
      const input = $('#' + id);
      input.addEventListener('blur', () => { if (input.value) check(input); });
      input.addEventListener('input', () => { if (input.closest('.c-field').classList.contains('is-invalid')) check(input); });
      input.addEventListener('change', () => check(input));
    });
    if (msg && count) msg.addEventListener('input', () => { count.textContent = msg.value.length; });

    form.addEventListener('submit', e => {
      e.preventDefault();
      let firstBad = null;
      Object.keys(rules).forEach(id => {
        const input = $('#' + id);
        const field = input.closest('.c-field');
        field.classList.remove('is-invalid');
        void field.offsetWidth;                       // restart the shake animation
        if (!check(input) && !firstBad) firstBad = input;
      });
      if (firstBad) { firstBad.focus(); return; }

      const btn = $('button[type="submit"]', form);
      btn.classList.add('is-sending');
      $('span', btn).textContent = 'Sending…';
      // Front-end only: replace this timeout with a real request to your email service / backend.
      setTimeout(() => {
        successName.textContent = $('#cName').value.trim().split(' ')[0] || 'lovely';
        form.hidden = true;
        success.hidden = false;
        btn.classList.remove('is-sending');
        $('span', btn).textContent = 'Send Enquiry';
        form.reset();
        if (count) count.textContent = '0';
        $$('.c-field', form).forEach(f => f.classList.remove('is-valid', 'is-invalid'));
        const top = success.closest('.c-form-card').getBoundingClientRect().top + window.scrollY - header.offsetHeight - 20;
        window.scrollTo({ top, behavior: REDUCED ? 'auto' : 'smooth' });
      }, REDUCED ? 0 : 900);
    });
    $('#sendAnother').addEventListener('click', () => {
      success.hidden = true;
      form.hidden = false;
      $('#cName').focus();
    });
  }

  /* ---------- Studio hours: live "open now" badge (studio time, Asia/Kolkata) ---------- */
  const status = $('#openStatus');
  if (status) {
    const text = $('.c-status-text', status);
    const rows = $$('.c-hours-list li');
    const update = () => {
      let day, hour;
      try {
        const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
        const get = t => (parts.find(p => p.type === t) || {}).value;
        day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
        hour = Number(get('hour')) + Number(get('minute')) / 60;
      } catch (e) {
        const now = new Date(); day = now.getDay(); hour = now.getHours() + now.getMinutes() / 60;
      }
      const weekday = day >= 1 && day <= 6;
      const open = weekday && hour >= 10 && hour < 20;
      status.classList.toggle('is-open', open);
      if (open) text.textContent = 'Open now · until 8 pm';
      else if (weekday && hour < 10) text.textContent = 'Closed · opens 10 am';
      else if (day === 0) text.textContent = 'Sunday · by appointment';
      else text.textContent = day === 6 ? 'Closed · opens Mon 10 am' : 'Closed · opens 10 am tomorrow';
      if (rows[0]) rows[0].classList.toggle('is-today', weekday);
      if (rows[1]) rows[1].classList.toggle('is-today', day === 0);
    };
    update();
    setInterval(update, 60000);
  }

  /* ---------- FAQ accordion (all closed by default, one open at a time) ---------- */
  $$('[data-faq]').forEach(group => {
    const items = $$('.c-faq-item', group);
    const setItem = (item, open) => {
      item.classList.toggle('is-open', open);
      $('.c-faq-q', item).setAttribute('aria-expanded', String(open));
    };
    items.forEach(item => {
      $('.c-faq-q', item).addEventListener('click', () => {
        const open = !item.classList.contains('is-open');
        items.forEach(other => { if (other !== item) setItem(other, false); });
        setItem(item, open);
      });
    });
  });

  /* ---------- Footer year ---------- */
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
})();