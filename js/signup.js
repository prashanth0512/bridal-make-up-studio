/* ============================================================
   Blush & Bloom Bridal Studio - signup.js
   Preloader, theme + RTL toggles, card stagger, password toggle,
   strength meter, validation and demo sign-up (front-end only).
   ============================================================ */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const body = document.body;
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

  /* ---------- Card contents stagger in ---------- */
  $$('.auth-card > *').forEach((el, i) => el.style.setProperty('--i', i));

  const AUTH = 'bb-auth';
  const form = $('#signupForm');
  const name = $('#sName');
  const user = $('#sUser');
  const pass = $('#sPass');
  const terms = $('#sTerms');
  const msg = $('#authMsg');
  const submit = $('.auth-submit', form);

  /* ---------- Show / hide password ---------- */
  const eye = $('#togglePass');
  eye.addEventListener('click', () => {
    const show = pass.type === 'password';
    pass.type = show ? 'text' : 'password';
    eye.setAttribute('aria-pressed', String(show));
    eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    pass.focus();
  });

  /* ---------- Password strength ---------- */
  const meter = $('#strength');
  const meterText = $('#strengthText');
  const LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  function strength(v) {
    if (!v) return 0;
    let s = 0;
    if (v.length >= 8) s++;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) s++;
    return Math.max(1, s);
  }
  pass.addEventListener('input', () => {
    const lvl = strength(pass.value);
    meter.dataset.level = lvl;
    meterText.textContent = LABELS[lvl];
  });

  /* ---------- Validation ---------- */
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE = /^[+\d][\d\s-]{7,}$/;
  const rules = [
    [name, () => name.value.trim().length >= 2, 'Enter your name'],
    [user, () => EMAIL.test(user.value.trim()) || PHONE.test(user.value.trim()), 'Enter a valid email or phone'],
    [pass, () => pass.value.length >= 8, 'Min. 8 characters'],
    [terms, () => terms.checked, 'Please accept the terms to continue.']
  ];

  function setError(input, text) {
    const field = input.closest('.auth-field');
    const err = $('.auth-error', field);
    field.classList.remove('is-invalid');
    if (text) { void field.offsetWidth; field.classList.add('is-invalid'); }
    err.textContent = text || '';
    input.setAttribute('aria-invalid', String(!!text));
  }
  function check(rule) {
    const [input, ok, text] = rule;
    const valid = ok();
    setError(input, valid ? '' : text);
    return valid;
  }
  rules.forEach(rule => {
    rule[0].addEventListener(rule[0] === terms ? 'change' : 'input', () => {
      if (rule[0] === pass) setError(pass, ''); // while typing, the strength meter takes over
      else if (rule[0].closest('.auth-field').classList.contains('is-invalid')) check(rule);
      msg.textContent = ''; msg.classList.remove('is-ok');
    });
  });

  function signIn(id, text) {
    try {
      localStorage.setItem(AUTH, id);
      sessionStorage.setItem('bb-just-in', '1');
    } catch (err) { /* storage unavailable */ }
    msg.classList.add('is-ok');
    msg.textContent = text;
    setTimeout(() => { window.location.href = 'dashboard.html'; }, REDUCED ? 300 : 1200);
  }

  /* ---------- Submit (demo) ---------- */
  form.addEventListener('submit', e => {
    e.preventDefault();
    const results = rules.map(check);
    const firstBad = results.indexOf(false);
    if (firstBad > -1) { rules[firstBad][0].focus(); return; }

    submit.classList.add('is-busy');
    submit.setAttribute('aria-busy', 'true');
    $('span', submit).textContent = 'Creating account…';
    const first = name.value.trim().split(/\s+/)[0];
    signIn(user.value.trim(), `Welcome, ${first}! Opening your dashboard…`);
  });

  /* ---------- Google / Apple (demo) ----------
     Front-end only: replace with real OAuth (Google Identity Services / Sign in with Apple) before launch. */
  $$('.auth-soc').forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = btn.dataset.provider;
      $$('.auth-soc').forEach(b => { b.disabled = true; });
      btn.classList.add('is-busy');
      $('span', btn).textContent = 'Connecting…';
      rules.forEach(r => setError(r[0], ''));
      signIn(`${provider} account`, `Creating your account with ${provider}…`);
    });
  });

  /* ---------- Terms / privacy (placeholder links) ---------- */
  $$('#termsLink, #privacyLink').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    msg.classList.remove('is-ok');
    msg.textContent = 'Our terms and privacy policy are available at the studio on request.';
  }));
})();