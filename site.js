(function () {
  'use strict';

  var toggle = document.querySelector('.menu-toggle');
  var panel = document.getElementById('mobile-menu');

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
})();
