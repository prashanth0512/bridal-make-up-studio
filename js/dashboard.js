/* =========================================================
   Blush & Bloom — Client dashboard — standalone script for dashboard.html
   App layout: side nav drawer + top bar with RTL / theme toggles.
   Demo data is kept in this browser (localStorage). Connect to your booking
   system and payment gateway before launch.
   ========================================================= */
(function () {
  'use strict';

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

  /* ---------- Side nav: stagger its items in after the preloader ---------- */
  $$('.sn > *').forEach((el, i) => el.style.setProperty('--n', i));

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

  /* ---------- Top bar: shadow once the page scrolls ---------- */
  const topbar = $('#topbar');
  const header = topbar;                       // panel offsets are measured from the top bar
  const onScroll = () => topbar.classList.toggle('is-scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Side nav drawer (tablet + mobile) ---------- */
  const sn = $('#sidenav');
  const snOpen = $('#snOpen');
  const snClose = $('#snClose');
  const snOverlay = $('#snOverlay');
  function setSn(open) {
    sn.classList.toggle('is-open', open);
    snOverlay.classList.toggle('is-visible', open);
    snOpen.setAttribute('aria-expanded', String(open));
    body.classList.toggle('no-scroll', open);
    if (open) snClose.focus();
  }
  snOpen.addEventListener('click', () => setSn(true));
  snClose.addEventListener('click', () => { setSn(false); snOpen.focus(); });
  snOverlay.addEventListener('click', () => setSn(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && sn.classList.contains('is-open')) { setSn(false); snOpen.focus(); } });
  const onBreakpoint = e => { if (e.matches) setSn(false); };
  if (DESKTOP.addEventListener) DESKTOP.addEventListener('change', onBreakpoint); else DESKTOP.addListener(onBreakpoint);

  const showToast = text => { const t = document.getElementById('toast'); if (!t) return; t.textContent = text; t.classList.add('is-visible'); clearTimeout(showToast.t); showToast.t = setTimeout(() => t.classList.remove('is-visible'), 2600); };

  /* ---------- Log In / Log Out (front-end demo — connect real sign-in before launch) ---------- */
  /* Log In opens the standalone login page (login.html); Log Out clears the demo session. */
  const AUTH = 'bb-auth';
  const loginBtn = $('#loginBtn');
  const snUser = $('#snUser');
  const avatar = $('#topAvatar');
  const avatarIcon = avatar ? avatar.innerHTML : '';
  const getUser = () => { try { return localStorage.getItem(AUTH) || sessionStorage.getItem(AUTH); } catch (e) { return null; } };
  const renderAuth = (justIn = false) => {
    const u = getUser();
    loginBtn.classList.toggle('is-signed-in', !!u);
    $('span', loginBtn).textContent = u ? 'Log Out' : 'Log In';
    snUser.hidden = !u;
    if (u) $('strong', snUser).textContent = u;
    if (avatar) {
      avatar.innerHTML = u ? `<b>${u.trim().charAt(0).toUpperCase()}</b>` : avatarIcon;
      avatar.title = u ? `Signed in as ${u}` : 'Not signed in';
      if (justIn) { avatar.classList.remove('is-in'); void avatar.offsetWidth; avatar.classList.add('is-in'); }
    }
  };

  loginBtn.addEventListener('click', () => {
    if (getUser()) {
      try { localStorage.removeItem(AUTH); sessionStorage.removeItem(AUTH); } catch (e) { /* storage unavailable */ }
      renderAuth();
      showToast('You have been logged out');
    } else {
      window.location.href = 'login.html';
    }
  });

  /* Arrived from login.html after signing in */
  let justSignedIn = false;
  try { justSignedIn = sessionStorage.getItem('bb-just-in') === '1'; sessionStorage.removeItem('bb-just-in'); } catch (e) { /* storage unavailable */ }
  if (justSignedIn && getUser()) setTimeout(() => { renderAuth(true); showToast('Welcome back! You are signed in.'); }, REDUCED ? 0 : 2400);

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

  /* =========================================================
     DASHBOARD
     ========================================================= */
  const ICON = {"calendar": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\"/><path d=\"M16 2v4\"/><path d=\"M8 2v4\"/><path d=\"M3 10h18\"/>", "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><polyline points=\"12 6 12 12 16 14\"/>", "map-pin": "<path d=\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\"/><circle cx=\"12\" cy=\"10\" r=\"3\"/>", "trash": "<path d=\"M3 6h18\"/><path d=\"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6\"/><path d=\"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2\"/>", "x": "<path d=\"M18 6 6 18\"/><path d=\"m6 6 12 12\"/>", "check": "<path d=\"M20 6 9 17l-5-5\"/>", "wallet": "<path d=\"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1\"/><path d=\"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4\"/>", "file-text": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\"/><path d=\"M14 2v4a2 2 0 0 0 2 2h4\"/><path d=\"M10 9H8\"/><path d=\"M16 13H8\"/><path d=\"M16 17H8\"/>", "wand-sparkles": "<path d=\"m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72\"/><path d=\"m14 7 3 3\"/><path d=\"M5 6v4\"/><path d=\"M19 14v4\"/><path d=\"M10 2v2\"/><path d=\"M7 8H3\"/><path d=\"M21 16h-4\"/><path d=\"M11 3H9\"/>", "gem": "<path d=\"M6 3h12l4 6-10 13L2 9Z\"/><path d=\"M11 3 8 9l4 13 4-13-3-6\"/><path d=\"M2 9h20\"/>", "flower-2": "<path d=\"M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1\"/><circle cx=\"12\" cy=\"8\" r=\"2\"/><path d=\"M12 10v12\"/><path d=\"M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5Z\"/><path d=\"M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5Z\"/>", "heart": "<path d=\"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z\"/>", "sparkles": "<path d=\"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z\"/>"};
  const svg = (name, cls = '') => `<svg class="lucide lucide-${name} ${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] || ''}</svg>`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rupee = n => '₹' + Number(n).toLocaleString('en-IN');
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parseDay = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
  const fmtDate = iso => { const d = parseDay(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const daysUntil = iso => Math.round((parseDay(iso) - parseDay(todayISO())) / 86400000);
  const TYPE_ICON = { 'Bridal Trial': 'wand-sparkles', 'Engagement': 'gem', 'Haldi & Mehendi': 'flower-2', 'Wedding Day': 'heart', 'Reception': 'sparkles' };
  const MAX_PICKS = 3;

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  let toastTimer = null;
  const toast = text => {
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2600);
  };

  /* ---------- Saved state (demo data) ---------- */
  const KEY = 'bb-dashboard-v1';
  const DEFAULTS = () => ({
    sessions: [
      { id: 's1', type: 'Bridal Trial', date: '2026-10-24', time: '11:00 AM', place: 'Studio', status: 'Confirmed' },
      { id: 's2', type: 'Haldi & Mehendi', date: '2027-02-12', time: '09:00 AM', place: 'Home', status: 'Confirmed' },
      { id: 's3', type: 'Wedding Day', date: '2027-02-14', time: '06:00 AM', place: 'Venue', status: 'Confirmed' },
      { id: 's4', type: 'Reception', date: '2027-02-15', time: '05:00 PM', place: 'Venue', status: 'Pending' },
    ],
    picks: { Wedding: ['l1', 'l4'], Reception: ['l6'], Engagement: [], Haldi: [] },
    notes: { Wedding: '', Reception: '', Engagement: '', Haldi: '' },
    payments: [
      { id: 'p1', label: 'Booking advance', amount: 10000, due: '2026-08-28', paidOn: '2026-08-28' },
      { id: 'p2', label: 'Trial & confirmation', amount: 15000, due: '2026-10-20', paidOn: null },
      { id: 'p3', label: 'Final balance', amount: 17999, due: '2027-02-10', paidOn: null },
    ],
  });
  const load = () => {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.sessions && s.picks && s.payments) return s; } catch (e) { /* storage unavailable */ }
    return DEFAULTS();
  };
  let state = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ } };

  /* ---------- Wedding countdown ---------- */
  const cd = $('.db-countdown');
  if (cd) {
    const target = new Date(cd.dataset.wedding).getTime();
    const parts = { days: $('[data-cd="days"]'), hours: $('[data-cd="hours"]'), mins: $('[data-cd="mins"]'), secs: $('[data-cd="secs"]') };
    const setPart = (el, val) => {
      if (el.textContent === val) return;
      el.textContent = val;
      if (!REDUCED) { el.classList.remove('is-tick'); void el.offsetWidth; el.classList.add('is-tick'); }
    };
    const tick = () => {
      let diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 86400000); diff -= d * 86400000;
      const h = Math.floor(diff / 3600000); diff -= h * 3600000;
      const m = Math.floor(diff / 60000); diff -= m * 60000;
      const s = Math.floor(diff / 1000);
      setPart(parts.days, String(d));
      setPart(parts.hours, String(h).padStart(2, '0'));
      setPart(parts.mins, String(m).padStart(2, '0'));
      setPart(parts.secs, String(s).padStart(2, '0'));
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Section menu: smooth jump + highlight the panel in view ---------- */
  const navLinks = $$('.db-nav-link');
  const panels = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const jump = id => {
    const target = $(id);
    if (!target) return;
    let top = 0;
    for (let el = target; el; el = el.offsetParent) top += el.offsetTop;   // ignores reveal transforms
    window.scrollTo({ top: Math.max(0, top - header.offsetHeight - 20), behavior: REDUCED ? 'auto' : 'smooth' });
  };
  [...navLinks, ...$$('[data-jump]')].forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const id = a.getAttribute('href');
    if (sn.classList.contains('is-open')) { setSn(false); setTimeout(() => jump(id), REDUCED ? 0 : 250); }   // let the drawer close first
    else jump(id);
  }));
  // Scroll a horizontal bar so the item is centred — sideways only, never moves the page
  const centreInBar = (bar, item) => {
    const left = item.offsetLeft - (bar.clientWidth - item.offsetWidth) / 2;
    bar.scrollTo({ left: Math.max(0, left), behavior: REDUCED ? 'auto' : 'smooth' });
  };
  let spyTick = false;
  const spy = () => {
    spyTick = false;
    const line = header.offsetHeight + window.innerHeight * 0.2;
    let current = panels[0];
    panels.forEach(p => { if (p.getBoundingClientRect().top <= line) current = p; });
    navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + current.id));
  };
  window.addEventListener('scroll', () => { if (!spyTick) { spyTick = true; requestAnimationFrame(spy); } }, { passive: true });

  /* ---------- Sessions ---------- */
  const list = $('#sessionList');
  const renderSessions = (newId = null) => {
    state.sessions.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    if (!state.sessions.length) { list.innerHTML = '<li class="db-empty-row">No sessions yet. Book your trial to get started.</li>'; return; }
    list.innerHTML = state.sessions.map(s => {
      const d = parseDay(s.date);
      const past = daysUntil(s.date) < 0;
      const pending = s.status === 'Pending';
      return `<li class="db-session${s.id === newId ? ' is-new' : ''}${past ? ' is-past' : ''}" data-id="${s.id}">
        <span class="db-date"><b>${d.getDate()}</b><small>${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}</small></span>
        <div class="db-session-body">
          <h4>${svg(TYPE_ICON[s.type] || 'calendar')}${esc(s.type)}</h4>
          <p class="db-session-meta"><span>${svg('clock')}${esc(s.time)}</span><span>${svg('map-pin')}${esc(s.place)}</span></p>
        </div>
        <div class="db-session-side">
          <span class="db-status ${pending ? 'is-pending' : 'is-confirmed'}">${pending ? 'Pending' : 'Confirmed'}</span>
          ${pending ? `<button class="db-cancel" type="button" data-cancel="${s.id}">${svg('trash')}<span>Cancel</span></button>` : ''}
        </div>
      </li>`;
    }).join('');
  };
  list.addEventListener('click', e => {
    const btn = e.target.closest('[data-cancel]');
    if (!btn) return;
    if (!btn.classList.contains('is-armed')) {                 // first tap arms, second tap cancels
      btn.classList.add('is-armed');
      $('span', btn).textContent = 'Tap to confirm';
      setTimeout(() => { if (btn.isConnected) { btn.classList.remove('is-armed'); $('span', btn).textContent = 'Cancel'; } }, 3000);
      return;
    }
    const li = btn.closest('.db-session');
    li.classList.add('is-leaving');
    setTimeout(() => {
      state.sessions = state.sessions.filter(s => s.id !== btn.dataset.cancel);
      save(); renderSessions(); refresh();
      toast('Session request cancelled');
    }, REDUCED ? 0 : 380);
  });

  const bookForm = $('#bookForm');
  const bDate = $('#bDate');
  bDate.min = todayISO();
  bookForm.addEventListener('submit', e => {
    e.preventDefault();
    const dateField = bDate.closest('.db-field');
    const slotField = $('.db-slots', bookForm);
    const slot = $('input[name="slot"]:checked', bookForm);
    let ok = true;
    [dateField, slotField].forEach(f => { f.classList.remove('is-invalid'); void f.offsetWidth; });
    if (!bDate.value || bDate.value < bDate.min) { dateField.classList.add('is-invalid'); $('.db-error', dateField).textContent = 'Choose a date from today onwards.'; ok = false; }
    else $('.db-error', dateField).textContent = '';
    if (!slot) { slotField.classList.add('is-invalid'); $('.db-error', slotField).textContent = 'Pick a time slot.'; ok = false; }
    else $('.db-error', slotField).textContent = '';
    if (!ok) return;
    const s = {
      id: 's' + Date.now(), type: $('#bType').value, date: bDate.value, time: slot.value,
      place: $('input[name="place"]:checked', bookForm).value, status: 'Pending',
    };
    state.sessions.push(s);
    save(); renderSessions(s.id); refresh();
    toast(`${s.type} requested for ${fmtDate(s.date)}`);
    bookForm.reset();
  });
  [bDate, ...$$('input[name="slot"]', bookForm)].forEach(i => i.addEventListener('change', () => {
    const f = i.closest('.db-field'); f.classList.remove('is-invalid'); $('.db-error', f).textContent = '';
  }));

  /* ---------- Look references ---------- */
  const tabsWrap = $('.db-tabs');
  const tabs = $$('.db-tab', tabsWrap);
  const ink = $('.db-tab-ink', tabsWrap);
  const looks = $$('.db-look');
  const lookGrid = $('#lookGrid');
  const pickList = $('#pickList');
  const notes = $('#lookNotes');
  let ceremony = tabs[0].dataset.ceremony;

  const moveInk = btn => {
    ink.style.setProperty('--ink-w', btn.offsetWidth + 'px');
    ink.style.setProperty('--ink-h', btn.offsetHeight + 'px');
    ink.style.setProperty('--ink-x', btn.offsetLeft + 'px');
    ink.style.setProperty('--ink-y', btn.offsetTop + 'px');
  };
  const activeTab = () => tabs.find(t => t.classList.contains('is-active'));

  const renderLooks = () => {
    const picked = state.picks[ceremony] || [];
    looks.forEach(l => {
      const on = picked.includes(l.dataset.look);
      l.classList.toggle('is-selected', on);
      l.setAttribute('aria-pressed', String(on));
    });
    $('#pickCeremony').textContent = ceremony;
    $('#pickCount').textContent = `${picked.length} / ${MAX_PICKS} selected`;
    $('#pickCount').classList.toggle('is-done', picked.length === MAX_PICKS);
    pickList.innerHTML = picked.length ? picked.map(id => {
      const card = looks.find(l => l.dataset.look === id);
      const name = $('.db-look-info strong', card).textContent;
      return `<li class="db-pick"><img src="${card.dataset.img}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'db-pick-thumb'}))" /><strong>${esc(name)}</strong><button class="db-pick-remove" type="button" data-remove="${id}" aria-label="Remove ${esc(name)}">${svg('x')}</button></li>`;
    }).join('') : '<li class="db-picks-empty">No looks picked yet for this ceremony.</li>';
    notes.value = state.notes[ceremony] || '';
    tabs.forEach(t => { $('.db-tab-count', t).textContent = (state.picks[t.dataset.ceremony] || []).length; });
  };
  const bumpCount = () => {
    const c = $('.db-tab-count', activeTab());
    c.classList.remove('is-bump'); void c.offsetWidth; c.classList.add('is-bump');
  };

  tabs.forEach(t => t.addEventListener('click', () => {
    if (t.classList.contains('is-active')) return;
    tabs.forEach(x => { x.classList.toggle('is-active', x === t); x.setAttribute('aria-selected', String(x === t)); });
    moveInk(t);
    centreInBar(tabsWrap, t);
    ceremony = t.dataset.ceremony;
    renderLooks();
    if (!REDUCED) { lookGrid.classList.remove('is-switching'); void lookGrid.offsetWidth; lookGrid.classList.add('is-switching'); }
  }));
  looks.forEach(l => l.addEventListener('click', () => {
    const picked = state.picks[ceremony] || (state.picks[ceremony] = []);
    const id = l.dataset.look;
    if (picked.includes(id)) picked.splice(picked.indexOf(id), 1);
    else if (picked.length >= MAX_PICKS) {
      l.classList.remove('is-denied'); void l.offsetWidth; l.classList.add('is-denied');
      toast(`You can pick up to ${MAX_PICKS} looks for ${ceremony}`);
      return;
    } else picked.push(id);
    save(); renderLooks(); bumpCount(); refresh();
  }));
  pickList.addEventListener('click', e => {
    const b = e.target.closest('[data-remove]');
    if (!b) return;
    state.picks[ceremony] = state.picks[ceremony].filter(id => id !== b.dataset.remove);
    save(); renderLooks(); bumpCount(); refresh();
  });
  let notesTimer = null;
  notes.addEventListener('input', () => {
    clearTimeout(notesTimer);
    notesTimer = setTimeout(() => { state.notes[ceremony] = notes.value; save(); }, 300);
  });

  /* ---------- Payments ---------- */
  const instList = $('#instalmentList');
  const ring = $('.db-ring');
  const instStatus = p => {
    if (p.paidOn) return 'paid';
    const left = daysUntil(p.due);
    if (left < 0) return 'overdue';
    if (left <= 21) return 'due';
    return 'upcoming';
  };
  const renderPayments = (justPaid = null) => {
    let nextDue = state.payments.find(p => !p.paidOn);
    instList.innerHTML = state.payments.map((p, i) => {
      const st = instStatus(p);
      const left = daysUntil(p.due);
      const when = st === 'paid' ? `Paid on ${fmtDate(p.paidOn)}`
        : st === 'overdue' ? `Overdue by ${-left} day${left === -1 ? '' : 's'}`
        : left === 0 ? 'Due today' : `Due ${fmtDate(p.due)} · in ${left} day${left === 1 ? '' : 's'}`;
      const isNext = nextDue && nextDue.id === p.id;
      return `<li class="db-inst is-${st}${justPaid === p.id ? ' just-paid' : ''}">
        <span class="db-inst-no">${st === 'paid' ? svg('check') : i + 1}</span>
        <div class="db-inst-body">
          <h4>${esc(p.label)}</h4>
          <p class="db-inst-meta"><span>${svg(st === 'paid' ? 'check' : 'calendar')}${when}</span></p>
        </div>
        <div class="db-inst-side">
          <span class="db-inst-amount">${rupee(p.amount)}</span>
          ${st === 'paid' ? `<span class="db-receipt">${svg('file-text')}Receipt sent</span>`
            : `<button class="btn ${isNext ? 'btn-primary btn-book' : 'btn-outline'}" type="button" data-pay="${p.id}">${svg('wallet')}<span>Pay Now</span></button>`}
        </div>
      </li>`;
    }).join('');
    const total = state.payments.reduce((s, p) => s + p.amount, 0);
    const paid = state.payments.filter(p => p.paidOn).reduce((s, p) => s + p.amount, 0);
    const pct = total ? Math.round(paid / total * 100) : 0;
    ring.style.setProperty('--pct', pct);
    $('#payPct').textContent = pct + '%';
    $('#payTotal').textContent = rupee(total);
    $('#payPaid').textContent = rupee(paid);
    $('#payBalance').textContent = rupee(total - paid);
    const overdue = state.payments.some(p => instStatus(p) === 'overdue');
    const due = state.payments.some(p => instStatus(p) === 'due');
    const chip = $('#payStatusChip');
    chip.textContent = pct === 100 ? 'Fully paid' : overdue ? 'Payment overdue' : due ? 'Payment due soon' : 'On track';
    chip.classList.toggle('is-alert', overdue);
    chip.classList.toggle('is-done', pct === 100);
    $('[data-badge="payments"]').hidden = !(overdue || due);
  };

  // Pay dialog (demo — no money is taken)
  const modal = $('#payModal');
  const confirmBtn = $('#payConfirm');
  let paying = null;
  instList.addEventListener('click', e => {
    const b = e.target.closest('[data-pay]');
    if (!b) return;
    paying = state.payments.find(p => p.id === b.dataset.pay);
    $('#payModalTitle').textContent = paying.label;
    $('#payModalAmount').textContent = rupee(paying.amount);
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
    body.classList.add('no-scroll');
  });
  const closeModal = () => { if (typeof modal.close === 'function') modal.close(); else modal.removeAttribute('open'); };
  modal.addEventListener('close', () => body.classList.remove('no-scroll'));
  $$('[data-close]', modal).forEach(b => b.addEventListener('click', closeModal));
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  confirmBtn.addEventListener('click', () => {
    if (!paying) return;
    confirmBtn.classList.add('is-busy');
    $('span', confirmBtn).textContent = 'Processing…';
    setTimeout(() => {
      paying.paidOn = todayISO();
      const method = $('input[name="payMethod"]:checked', modal).value;
      save(); renderPayments(paying.id); refresh();
      toast(`${rupee(paying.amount)} paid via ${method} (demo)`);
      confirmBtn.classList.remove('is-busy');
      $('span', confirmBtn).textContent = 'Confirm Payment';
      closeModal();
      paying = null;
    }, REDUCED ? 0 : 900);
  });

  /* ---------- Overview numbers + menu badges ---------- */
  const countTo = (el, to, suffix = '') => {
    const from = parseInt(el.textContent, 10) || 0;
    if (REDUCED || from === to) { el.textContent = to + suffix; return; }
    const t0 = performance.now(), dur = 900;
    const step = now => {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const refresh = () => {
    const upcoming = state.sessions.filter(s => daysUntil(s.date) >= 0);
    const totalPicks = Object.values(state.picks).reduce((n, a) => n + a.length, 0);
    const total = state.payments.reduce((s, p) => s + p.amount, 0);
    const paid = state.payments.filter(p => p.paidOn).reduce((s, p) => s + p.amount, 0);
    countTo($('#statSessions'), state.sessions.length);
    countTo($('#statLooks'), totalPicks);
    countTo($('#statPaid'), total ? Math.round(paid / total * 100) : 0, '%');
    const weddingAt = $('.db-countdown') ? new Date($('.db-countdown').dataset.wedding).getTime() : Date.now();
    countTo($('#statDays'), Math.max(0, Math.floor((weddingAt - Date.now()) / 86400000)));   // same maths as the countdown
    const td = $('#topDays'); if (td) td.textContent = Math.max(0, Math.floor((weddingAt - Date.now()) / 86400000));
    $('#sessionCount').textContent = `${state.sessions.length} booked`;
    $('[data-badge="sessions"]').textContent = state.sessions.length;
    $('[data-badge="looks"]').textContent = totalPicks;
    const next = upcoming[0];
    $('#nextTitle').textContent = next ? next.type : 'No upcoming sessions';
    $('#nextMeta').textContent = next
      ? `${fmtDate(next.date)} · ${next.time} · ${next.place}${next.status === 'Pending' ? ' · awaiting confirmation' : ''} · ${daysUntil(next.date) === 0 ? 'today' : 'in ' + daysUntil(next.date) + ' days'}`
      : 'Book your bridal trial below.';
  };

  /* ---------- Reset demo data ---------- */
  $('#resetDemo').addEventListener('click', () => {
    try { localStorage.removeItem(KEY); } catch (e) { /* storage unavailable */ }
    state = DEFAULTS();
    renderSessions(); renderLooks(); renderPayments(); refresh();
    toast('Demo data reset');
  });

  /* ---------- First paint ---------- */
  renderAuth();
  renderSessions();
  renderLooks();
  renderPayments();
  refresh();
  spy();
  moveInk(activeTab());
  requestAnimationFrame(() => tabsWrap.classList.add('is-ready'));
  window.addEventListener('resize', () => moveInk(activeTab()));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveInk(activeTab()));
  // Payments ring fills from 0 when the panel scrolls into view
  if ('IntersectionObserver' in window && !REDUCED) {
    const pct = ring.style.getPropertyValue('--pct');
    ring.style.setProperty('--pct', 0);
    const rio = new IntersectionObserver((entries, obs) => {
      if (entries.some(en => en.isIntersecting)) { ring.style.setProperty('--pct', pct); obs.disconnect(); }
    }, { threshold: 0.4 });
    rio.observe(ring);
  }

  /* ---------- Footer year ---------- */
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
})();