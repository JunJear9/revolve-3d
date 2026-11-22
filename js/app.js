/* Revolve-3D · app shell: hash routing, language switch, library checks and module start-up. */
(function (RV) {
  'use strict';

  const I = RV.i18n, $ = id => document.getElementById(id);
  const ROUTES = ['home', 'formulas', 'practice', 'simulator', 'quiz'];
  const MODULES = { formulas: RV.formulas, practice: RV.practice, simulator: RV.simulator, quiz: RV.quiz };
  const TITLE = { en: 'Revolve-3D · Solids of Revolution', bm: 'Revolve-3D · Pepejal Kisaran' };
  const started = {};          // module name -> true (ok), false (failed to start)
  let current = null;
  let bannerKey = null;        // which notice is showing (re-translated on language change)

  function routeFromHash() {
    const r = location.hash.replace(/^#\/?/, '');
    return ROUTES.includes(r) ? r : 'home';
  }

  function showBanner(key) {
    bannerKey = key;
    const el = $('lib-error');
    el.hidden = !key;
    el.textContent = key ? I.t(key) : '';
  }

  function webglAvailable() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  // One failing module must not stop the others.
  function start(name, fn) {
    try {
      fn();
      started[name] = true;
    } catch (err) {
      started[name] = false;
      console.error(`[Revolve-3D] ${name} did not start:`, err);
    }
  }

  function callIfReady(name, method) {
    if (started[name] && MODULES[name] && MODULES[name][method]) {
      try { MODULES[name][method](); } catch (err) { console.error(`[Revolve-3D] ${name}.${method} failed:`, err); }
    }
  }

  function go(route, opts) {
    current = route;
    document.querySelectorAll('[data-page]').forEach(sec => { sec.hidden = sec.id !== route; });
    document.querySelectorAll('[data-route]').forEach(a => {
      if (a.dataset.route === route) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    callIfReady(route, 'show');
    document.title = TITLE[I.lang];
    if (!opts || opts.scroll !== false) window.scrollTo({ top: 0, behavior: 'auto' });
    if (!opts || opts.focus !== false) {
      const h1 = document.querySelector(`#${route} h1`);
      if (h1) h1.focus({ preventScroll: true });
    }
  }

  function boot() {
    I.apply();

    const libsOK = typeof window.math !== 'undefined' && typeof window.THREE !== 'undefined';
    start('formulas', () => RV.formulas.init());
    start('practice', () => RV.practice.init());
    start('simulator', () => RV.simulator.init());
    start('quiz', () => RV.quiz.init());

    if (!libsOK || Object.values(started).includes(false)) showBanner('lib.error');
    else if (!webglAvailable()) showBanner('webgl.error');
    else showBanner(null);

    document.querySelectorAll('[data-lang]').forEach(b => {
      b.addEventListener('click', () => I.setLang(b.dataset.lang));
    });

    I.onChange(() => {
      ['formulas', 'simulator', 'practice', 'quiz'].forEach(name => callIfReady(name, 'render'));
      if (bannerKey) showBanner(bannerKey);
      document.title = TITLE[I.lang];
    });

    window.addEventListener('hashchange', () => go(routeFromHash()));

    let timer = null;
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (current === 'simulator') callIfReady('simulator', 'refresh');
        if (current === 'practice') callIfReady('practice', 'refresh');
      }, 150);
    });

    go(routeFromHash(), { focus: false, scroll: false });
  }

  RV.app = { go, routeFromHash };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.RV = window.RV || {});
