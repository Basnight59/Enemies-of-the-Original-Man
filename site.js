(function () {
  'use strict';

  var toggle = document.querySelector('.menu-toggle');
  var panel = document.getElementById('mobile-menu');

  // ---------- Light / dark toggle ----------
  var root = document.documentElement;
  var themeBtn = document.querySelector('.theme-toggle');
  // styles.css publishes the effective theme as --theme, so this also holds when the OS decides
  function currentTheme() {
    return getComputedStyle(root).getPropertyValue('--theme').trim() === 'light' ? 'light' : 'dark';
  }
  function labelThemeBtn() {
    var next = currentTheme() === 'light' ? 'dark' : 'light';
    var text = 'Switch to ' + next + ' mode';
    themeBtn.setAttribute('aria-label', text);
    themeBtn.setAttribute('title', text);
  }
  themeBtn.addEventListener('click', function () {
    var next = currentTheme() === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('eotom-theme', next); } catch (e) {}
    labelThemeBtn();
  });
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', labelThemeBtn);
  labelThemeBtn();

  // ---------- Mobile menu ----------
  function setOpen(open) {
    panel.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? '×' : '≡';
  }
  toggle.addEventListener('click', function () {
    setOpen(!panel.classList.contains('is-open'));
  });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
  window.matchMedia('(min-width: 1200px)').addEventListener('change', function (e) {
    if (e.matches) setOpen(false);
  });

  // Desktop dropdowns are CSS :hover/:focus-within menus; blur after a pick so the menu closes.
  document.querySelectorAll('.menu a').forEach(function (a) {
    a.addEventListener('click', function () { a.blur(); });
  });

  // ---------- Active section highlighting ----------
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a, .mobile-menu a'));
  var sections = [];
  links.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    var el = id && id !== 'top' && document.getElementById(id);
    if (el && sections.indexOf(el) === -1) sections.push(el);
  });

  // Tracked so scrolling past the last linked section clears the highlight (no nav link points here).
  var tail = document.getElementById('architecture');
  if (tail) sections.push(tail);

  var ticking = false;
  function update() {
    ticking = false;
    var line = 120; // px below viewport top that counts as "current"
    var hash = location.hash.slice(1);
    var current = null;
    var bestTop = -Infinity;
    sections.forEach(function (el) {
      var top = el.getBoundingClientRect().top;
      if (top > line) return;
      // Cards in the same grid row share a top edge: on a tie, prefer the one the URL points at.
      var tie = Math.abs(top - bestTop) < 2;
      if (top > bestTop + 2 || (tie && el.id === hash)) { bestTop = top; current = el.id; }
    });

    links.forEach(function (a) {
      var href = a.getAttribute('href').slice(1);
      var groups = a.getAttribute('data-sections');
      var active = groups ? groups.split(' ').indexOf(current) !== -1
                          : (href === current && !!a.closest('.menu, .sub'));
      a.classList.toggle('is-active', active);
      if (active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  // ---------- Chat assistant ----------
  // URL of the deployed chat-worker (e.g. https://eotom-chat.<account>.workers.dev). Empty keeps the widget hidden.
  var CHAT_ENDPOINT = '';
  var SITE_HOST = 'enemiesoftheoriginalman.com';

  var fab = document.querySelector('.chat-fab');
  var chat = document.getElementById('chat-panel');
  if (!CHAT_ENDPOINT || !fab || !chat) return;

  var log = chat.querySelector('.chat-log');
  var form = chat.querySelector('.chat-form');
  var input = document.getElementById('chat-input');
  var sendBtn = chat.querySelector('.chat-send');
  var starters = chat.querySelector('.chat-starters');
  var history = [];
  var busy = false;

  try { history = JSON.parse(sessionStorage.getItem('eotom-chat') || '[]'); } catch (e) { history = []; }
  function save() {
    try { sessionStorage.setItem('eotom-chat', JSON.stringify(history.slice(-20))); } catch (e) {}
  }

  // Escape everything, then allow only [text](https://...) links and line breaks.
  // Links to this site's own sections stay in-page; everything else opens in a new tab.
  function render(text) {
    var esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    esc = esc.replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, function (m, label, url) {
      var local = url.match(/^https:\/\/(?:www\.)?enemiesoftheoriginalman\.com\/?(#[\w-]+)$/);
      if (local) return '<a href="' + local[1] + '" data-local>' + label + '</a>';
      return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
    });
    esc = esc.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return esc.replace(/\n/g, '<br>');
  }
  function addMsg(role, text) {
    var div = document.createElement('div');
    div.className = 'chat-msg ' + (role === 'user' ? 'user' : 'bot');
    div.innerHTML = render(text);
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }
  history.forEach(function (m) { addMsg(m.role, m.content); });
  if (history.length) starters.hidden = true;

  function setChatOpen(open) {
    chat.hidden = !open;
    fab.setAttribute('aria-expanded', String(open));
    fab.hidden = open;
    if (open) input.focus(); else fab.focus();
  }
  fab.hidden = false;
  fab.addEventListener('click', function () { setChatOpen(true); });
  chat.querySelector('.chat-close').addEventListener('click', function () { setChatOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !chat.hidden) setChatOpen(false);
  });
  log.addEventListener('click', function (e) {
    if (e.target.closest('a[data-local]') && window.matchMedia('(max-width: 479px)').matches) setChatOpen(false);
  });
  starters.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b) ask(b.textContent);
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    ask(input.value);
  });

  function ask(question) {
    question = question.trim();
    if (!question || busy) return;
    busy = true;
    sendBtn.disabled = true;
    starters.hidden = true;
    input.value = '';
    addMsg('user', question);
    history.push({ role: 'user', content: question });
    var bubble = addMsg('bot', '…');
    bubble.classList.add('pending');
    var answer = '';

    fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history })
    }).then(function (res) {
      if (!res.body || !res.ok) return res.text().then(function (t) { throw new Error(t || 'HTTP ' + res.status); });
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) return;
          answer += decoder.decode(r.value, { stream: true });
          bubble.classList.remove('pending');
          bubble.innerHTML = render(answer);
          log.scrollTop = log.scrollHeight;
          return pump();
        });
      }
      return pump();
    }).then(function () {
      if (!answer.trim()) throw new Error('');
      history.push({ role: 'assistant', content: answer });
      save();
    }).catch(function (err) {
      // the question is dropped from history so a retry doesn't send it twice; it goes back in the input box
      history.pop();
      bubble.classList.remove('pending');
      bubble.classList.add('error');
      var msg = err && err.message && err.message.length < 200 && !/^HTTP|fetch/i.test(err.message)
        ? err.message : 'Sorry, the assistant is unavailable right now. Please try again.';
      bubble.textContent = msg;
      input.value = question;
    }).then(function () {
      busy = false;
      sendBtn.disabled = false;
    });
  }
})();
