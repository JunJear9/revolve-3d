/* Revolve-3D · Quiz tab: 3 parts, 5 questions each. Only a first-try correct answer scores. */
(function (RV) {
  'use strict';

  const E = RV.engine, P = RV.problems, I = RV.i18n, T = (k, v) => I.t(k, v), h = RV.dom.h;
  const $ = id => document.getElementById(id);
  const rnd = n => Math.floor(Math.random() * n);

  // Part 1: integration formulas (first option is correct; options are shuffled per question).
  const FORMULA_ITEMS = [
    { q: { en: 'Find ∫ e³ˣ dx.', bm: 'Cari ∫ e³ˣ dx.' },
      o: ['e³ˣ/3 + c', '3e³ˣ + c', 'e³ˣ + c', 'e³ˣ/x + c'],
      e: { en: 'Copy the exponential and divide by the number in front of x.', bm: 'Salin eksponen dan bahagi dengan nombor di depan x.' } },
    { q: { en: 'Find ∫ 1/(2x + 5) dx.', bm: 'Cari ∫ 1/(2x + 5) dx.' },
      o: ['½ ln|2x + 5| + c', 'ln|2x + 5| + c', '2 ln|2x + 5| + c', '−1/(2x + 5)² + c'],
      e: { en: 'A reciprocal of a linear expression gives ln, divided by a = 2.', bm: 'Salingan ungkapan linear memberi ln, dibahagi dengan a = 2.' } },
    { q: { en: 'Find ∫ cos 4x dx.', bm: 'Cari ∫ kos 4x dx.' },
      o: ['sin 4x / 4 + c', '4 sin 4x + c', '−sin 4x / 4 + c', 'sin 4x + c'],
      e: { en: 'Integrate cos to sin, then divide by 4.', bm: 'Kamirkan kos kepada sin, kemudian bahagi dengan 4.' } },
    { q: { en: 'Find ∫ sin 2x dx.', bm: 'Cari ∫ sin 2x dx.' },
      o: ['−cos 2x / 2 + c', 'cos 2x / 2 + c', '−2 cos 2x + c', '−cos 2x + c'],
      e: { en: 'The integral of sin is −cos, then divide by 2.', bm: 'Kamiran sin ialah −kos, kemudian bahagi dengan 2.' } },
    { q: { en: 'Which method suits ∫ x eˣ dx?', bm: 'Kaedah yang manakah sesuai untuk ∫ x eˣ dx?' },
      o: [{ en: 'Integration by parts', bm: 'Kamiran bahagian demi bahagian' }, { en: 'Partial fractions', bm: 'Pecahan separa' },
        { en: 'A trig identity', bm: 'Identiti trigonometri' }, { en: 'The ln formula', bm: 'Formula ln' }],
      e: { en: 'It is a polynomial times an exponential. LoPET says u = x.', bm: 'Ia ialah polinomial didarab eksponen. LoPET memberi u = x.' } },
    { q: { en: 'To integrate sin² 3x, first rewrite it as…', bm: 'Untuk kamirkan sin² 3x, mula-mula tulis semula sebagai…' },
      o: ['(1 − cos 6x)/2', '1 − cos² x', '2 sin 3x', '(1 + cos 6x)/2'],
      e: { en: 'The double-angle identity leaves only cos 6x to integrate.', bm: 'Identiti sudut berganda meninggalkan hanya kos 6x untuk dikamirkan.' } },
    { q: { en: 'Which tool do you use for ∫ sin 4x cos 2x dx?', bm: 'Alat yang manakah digunakan untuk ∫ sin 4x kos 2x dx?' },
      o: [{ en: 'The factor formula: ½[sin 6x + sin 2x]', bm: 'Formula faktor: ½[sin 6x + sin 2x]' },
        { en: 'Integration by parts', bm: 'Kamiran bahagian demi bahagian' }, { en: 'The ln formula', bm: 'Formula ln' },
        { en: 'Only u = 4x', bm: 'Hanya u = 4x' }],
      e: { en: 'A sine times a cosine becomes a sum.', bm: 'Sin didarab kos menjadi hasil tambah.' } },
    { q: { en: 'Why is ∫ 1/(x² − 4) dx not ln|x² − 4| + c?', bm: 'Mengapa ∫ 1/(x² − 4) dx bukan ln|x² − 4| + c?' },
      o: [{ en: 'The ln formula needs a linear bottom', bm: 'Formula ln memerlukan penyebut linear' },
        { en: 'ln cannot be integrated', bm: 'ln tidak boleh dikamirkan' },
        { en: 'The answer is x² − 4', bm: 'Jawapannya ialah x² − 4' }, { en: 'It is actually correct', bm: 'Sebenarnya ia betul' }],
      e: { en: 'Use partial fractions for a quadratic bottom.', bm: 'Guna pecahan separa untuk penyebut kuadratik.' } }
  ];

  // Random polynomial volume problems (f, g as coefficient lists; g = [0] means a disk).
  const VOLUME_GENERATORS = [
    () => ({ f: [0, 0, 1], g: [0], a: 0, b: 1 + rnd(3), ax: 'x' }),
    () => ({ f: [1 + rnd(3), 1], g: [0], a: 0, b: 1 + rnd(2), ax: 'x' }),
    () => { const m = 2 + rnd(2); return { f: [0, m], g: [0, 0, 1], a: 0, b: m, ax: 'x' }; },
    () => ({ f: [4], g: [0, 0, 1], a: 0, b: 1 + rnd(2), ax: 'x' }),
    () => ({ f: [0, 0, 1], g: [0], a: 0, b: 1 + rnd(2), ax: 'y' }),
    () => ({ f: [0, 1 + rnd(2)], g: [0], a: 0, b: 2 + rnd(2), ax: 'x' }),
    () => ({ f: [0, 1], g: [0, 0, 1], a: 0, b: 1, ax: 'y' })
  ];

  let part = 0, qs = [], qi = 0, score = 0, finished = false;

  function shuffle(a) { return P.shuffle(a); }

  // ---- question builders -------------------------------------------------

  function formulaQuestion(item) {
    const opts = item.o.map((label, idx) => ({ label, ok: idx === 0, key: `o${idx}` }));
    return { kind: 'mc', mode: 'formula', item, opts: shuffle(opts), missed: false, answered: false, dis: new Set() };
  }

  function setupQuestion(p, type) {
    let keys;
    if (type === 'method') keys = ['disk', 'washer'];
    else if (type === 'outer') keys = ['F', 'G'];
    else if (type === 'integrand') keys = ['ok', 'd1', 'd2', 'd3'];
    else keys = ['ok', 'd0', 'd1', 'd2'];
    return { kind: 'mc', mode: 'setup', p, type, keys: shuffle(keys), lim: type === 'limits' ? P.limitDistractors(p) : null, missed: false, answered: false, dis: new Set() };
  }

  function volumeQuestion() {
    const q = VOLUME_GENERATORS[rnd(VOLUME_GENERATORS.length)]();
    const isG = !(q.g.length === 1 && q.g[0] === 0);
    const F = E.pint(E.psub(E.pmul(q.f, q.f), E.pmul(q.g, q.g)));
    const C = E.pev(F, q.b) - E.pev(F, q.a);
    const d = E.psub(q.f, q.g);
    const W = E.pint(E.pmul(d, d));
    const Wv = E.pev(W, q.b) - E.pev(W, q.a);
    const expr = c => E.polyExpr(c, q.ax);
    const spec = E.buildSpec({ ax: q.ax, f: expr(q.f), g: isG ? expr(q.g) : '', a: q.a, b: q.b }).spec;
    return { kind: 'num', ...q, isG, C, Wv, spec, typed: '', missed: false, solved: false, showSol: false };
  }

  function buildSet(n) {
    if (n === 1) return shuffle(FORMULA_ITEMS).slice(0, 5).map(formulaQuestion);
    if (n === 2) {
      const combos = [];
      P.PROBLEMS.forEach(base => {
        const p = P.make(base);
        ['method', 'outer', 'integrand'].forEach(t => combos.push([p, t]));
        if (p.hasG) combos.push([p, 'limits']);
      });
      return shuffle(combos).slice(0, 5).map(([p, t]) => setupQuestion(p, t));
    }
    return Array.from({ length: 5 }, volumeQuestion);
  }

  // ---- multiple-choice view (text is computed at render time, so it follows the language) ----

  function mcView(q) {
    if (q.mode === 'formula') {
      return {
        stem: I.pick(q.item.q),
        opts: q.opts.map(o => ({ key: o.key, ok: o.ok, label: I.pick(o.label) })),
        explain: I.pick(q.item.e)
      };
    }
    const p = q.p;
    const stem = P.statement(p);
    const withStem = k => `${stem} ${T(k)}`;
    if (q.type === 'method') {
      return {
        stem: withStem('quiz.s2.method'),
        opts: q.keys.map(k => ({ key: k, ok: k === P.ANSWER.method(p), label: k === 'disk' ? T('pr.opt.disk') : T('pr.opt.washer') })),
        explain: T('quiz.s2.e.method')
      };
    }
    if (q.type === 'outer') {
      const all = P.options(p, 'outer');
      return {
        stem: withStem('quiz.s2.outer'),
        opts: q.keys.map(k => ({ key: k, ok: k === P.ANSWER.outer(p), label: all.find(o => o.k === k).label })),
        explain: T('quiz.s2.e.outer')
      };
    }
    if (q.type === 'integrand') {
      const all = P.options(p, 'integrand');
      return {
        stem: withStem('quiz.s2.integrand'),
        opts: q.keys.map(k => ({ key: k, ok: k === 'ok', label: all.find(o => o.k === k).label })),
        explain: T('quiz.s2.e.integrand')
      };
    }
    // limits
    const pairs = { ok: [p.a, p.b] };
    q.lim.forEach((pair, i) => { pairs[`d${i}`] = pair; });
    return {
      stem: withStem('quiz.s2.limits'),
      opts: q.keys.filter(k => pairs[k]).map(k => ({
        key: k, ok: k === 'ok',
        label: T('pr.range', { a: P.num(pairs[k][0]), b: P.num(pairs[k][1]) })
      })),
      explain: T('quiz.s2.e.limits')
    };
  }

  function answerMC(q, key) {
    if (q.answered) return;
    const opt = mcView(q).opts.find(o => o.key === key);
    if (!opt) return;
    if (opt.ok) {
      if (!q.missed) score++;
      q.answered = true;
      q.feedback = 'ok';
    } else {
      q.missed = true;
      q.dis.add(key);
      q.feedback = 'wrong';
    }
    render();
  }

  // ---- number view (polynomial volumes) ----

  function numStatement(q) {
    const v = q.ax, w = v === 'x' ? 'y' : 'x';
    const vars = { w, v, F: E.polyStr(q.f, v), G: q.isG ? E.polyStr(q.g, v) : '', a: q.a, b: q.b };
    return q.isG ? T('quiz.vol.washer', vars) : T('quiz.vol.disk', vars);
  }

  function checkNum(q) {
    const ans = E.parseAnswer(q.typed);
    if (ans === null) {
      q.feedback = { cls: 'warn', text: T('pr.badNumber') };
      return render();
    }
    const tol = 0.005 * Math.max(1, Math.abs(q.C));
    if (Math.abs(ans - q.C) <= tol) {
      if (!q.missed) score++;
      q.solved = true;
      q.feedback = { cls: 'ok', text: T('quiz.vol.gotIt', { V: E.piStr(q.C) }) };
      return render();
    }
    q.missed = true;
    let msg = 'quiz.vol.wrong';
    if (Math.abs(ans - q.C * Math.PI) < 0.02) msg = 'quiz.vol.pi';
    else if (q.isG && Math.abs(ans - q.Wv) <= tol) msg = 'quiz.vol.sq';
    q.feedback = { cls: 'warn', text: T(msg) };
    render();
  }

  // ---- rendering ----

  function feedbackEl(fb) {
    if (!fb) return null;
    return h('p', { class: `feedback ${fb.cls}`, id: 'quiz-fb', tabindex: '-1', role: 'status', 'aria-live': 'polite' }, fb.text);
  }

  function nextButton() {
    return h('button', { class: 'btn', type: 'button', onclick: () => { qi++; render(); } }, T('quiz.next'));
  }

  function mcBody(q) {
    const v = mcView(q);
    const fbOk = q.feedback === 'ok';
    const fb = q.feedback === 'ok'
      ? h('div', { class: 'feedback ok', id: 'quiz-fb', tabindex: '-1', role: 'status', 'aria-live': 'polite' },
        h('p', {}, T('quiz.correct') + ' ' + v.explain))
      : q.feedback === 'wrong'
        ? h('div', { class: 'feedback warn', id: 'quiz-fb', tabindex: '-1', role: 'status', 'aria-live': 'polite' }, T('quiz.wrongMC'))
        : null;
    return h('div', {},
      h('p', { class: 'q' }, v.stem),
      h('div', { class: 'choices' }, v.opts.map(o => h('button', {
        class: 'opt', type: 'button', disabled: q.dis.has(o.key) || fbOk,
        onclick: () => answerMC(q, o.key)
      }, o.label))),
      fb,
      fbOk ? h('div', { class: 'btn-row' }, nextButton()) : null);
  }

  function numBody(q) {
    const fb = feedbackEl(q.feedback);
    const solution = q.showSol ? (() => {
      const w = E.working(q.spec, T);
      return w ? h('div', { class: 'working', html: E.workingHTML(w) }) : null;
    })() : null;
    return h('div', {},
      h('p', { class: 'q' }, numStatement(q)),
      h('p', {}, T('quiz.vol.prompt')),
      h('label', { class: 'volume' }, h('span', {}, T('quiz.vol.answer')),
        h('input', {
          type: 'text', autocomplete: 'off', spellcheck: 'false', placeholder: '2/15',
          value: q.typed, oninput: e => { q.typed = e.target.value; },
          onkeydown: e => { if (e.key === 'Enter' && !q.solved) checkNum(q); }
        }), h('span', { class: 'mut' }, 'π')),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn', type: 'button', disabled: q.solved, onclick: () => checkNum(q) }, T('quiz.check')),
        q.missed && !q.solved ? h('button', { class: 'btn alt', type: 'button', onclick: () => { q.showSol = true; q.solved = true; render(); } }, T('quiz.showSol')) : null,
        h('button', { class: 'btn alt', type: 'button', onclick: () => RV.simulator.load({ ax: q.ax, f: E.polyExpr(q.f, q.ax), g: q.isG ? E.polyExpr(q.g, q.ax) : '', a: q.a, b: q.b }) }, T('quiz.openSim')),
        q.solved ? nextButton() : null),
      fb,
      solution);
  }

  function finishedView() {
    return h('div', {},
      h('h2', {}, T('quiz.finished')),
      h('p', { class: 'big' }, T('quiz.score', { s: score })),
      h('p', { class: 'mut' }, T('quiz.firstTry')),
      h('button', { class: 'btn', type: 'button', onclick: () => startPart(part) }, T('quiz.again')));
  }

  function render() {
    const body = $('quiz-body');
    document.querySelectorAll('[data-part]').forEach(b => {
      const on = Number(b.dataset.part) === part;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (part === 0) {
      body.replaceChildren(h('p', { class: 'mut' }, T('quiz.choose')));
      return;
    }
    if (finished || qi >= qs.length) {
      finished = true;
      body.replaceChildren(finishedView());
      return;
    }
    const q = qs[qi];
    body.replaceChildren(
      h('p', { class: 'eyebrow' }, T('quiz.counter', { n: qi + 1, s: score })),
      q.kind === 'mc' ? mcBody(q) : numBody(q)
    );
  }

  function startPart(n) {
    part = n;
    qs = buildSet(n);
    qi = 0;
    score = 0;
    finished = false;
    render();
  }

  function init() {
    document.querySelectorAll('[data-part]').forEach(b => {
      b.addEventListener('click', () => startPart(Number(b.dataset.part)));
    });
    render();
  }

  RV.quiz = {
    init,
    show: () => render(),
    render: () => render()
  };
})(window.RV = window.RV || {});
