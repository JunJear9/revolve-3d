/* Revolve-3D · shared problem model for Practice and Quiz (choose-the-setup questions). */
(function (RV) {
  'use strict';

  const E = RV.engine;
  const T = (k, v) => RV.i18n.t(k, v);

  // Each problem describes the region by its boundaries. Limits are NOT stated for washers
  // (students must solve f = g), but are stated as lines for disks.
  const PROBLEMS = [
    { ax: 'x', f: 'x^2', g: '', a: 0, b: 2 },
    { ax: 'x', f: 'sqrt(4-x^2)', g: '', a: -2, b: 2 },
    { ax: 'x', f: 'x', g: 'x^2', a: 0, b: 1 },
    { ax: 'x', f: '4', g: 'x^2', a: -2, b: 2 },
    { ax: 'y', f: 'y^2', g: '', a: 0, b: 2 },
    { ax: 'y', f: '1', g: 'y^2', a: -1, b: 1 }
  ];

  const STEPS = ['var', 'method', 'outer', 'limits', 'integrand', 'volume'];

  // Build a problem with its spec and the outer/inner roles resolved.
  function make(base) {
    const spec = E.buildSpec(base).spec;
    const outerFirst = E.outerIsFirst(spec);
    const p = { ...base, spec, hasG: spec.hasG, outerFirst };
    p.R = !p.hasG || outerFirst ? p.f : p.g;
    p.r = !p.hasG ? '0' : outerFirst ? p.g : p.f;
    p.w = p.ax === 'x' ? 'y' : 'x';
    p.coef = E.coefficient(spec);
    return p;
  }

  const disp = s => E.disp(s);
  const num = n => String(n).replace('-', '−');
  const rOf = p => disp(p.R);
  const rInner = p => (p.r === '0' ? '0' : disp(p.r));

  function statement(p) {
    const vars = { w: p.w, v: p.ax, a: num(p.a), b: num(p.b), F: disp(p.f), G: p.hasG ? disp(p.g) : '' };
    return p.hasG ? T('pr.statement.washer', vars) : T('pr.statement.disk', vars);
  }

  // Options for a choice step. Keys are stable; labels are computed at call time (language-aware).
  function options(p, step) {
    switch (step) {
      case 'var':
        return [{ k: 'x', label: 'dx' }, { k: 'y', label: 'dy' }];
      case 'method':
        return [{ k: 'disk', label: T('pr.opt.disk') }, { k: 'washer', label: T('pr.opt.washer') }];
      case 'outer':
        return [
          { k: 'F', label: `${p.w} = ${disp(p.f)}` },
          { k: 'G', label: p.hasG ? `${p.w} = ${disp(p.g)}` : T('pr.axisLabel', { v: p.ax, w: p.w }) }
        ];
      case 'integrand': {
        const R = rOf(p), r = rInner(p);
        return p.hasG
          ? [
            { k: 'ok', label: `(${R})² − (${r})²` },
            { k: 'd1', label: `(${R} − ${r})²` },
            { k: 'd2', label: `(${R})² + (${r})²` },
            { k: 'd3', label: `${R} · ${r}` }
          ]
          : [
            { k: 'ok', label: `(${R})²` },
            { k: 'd1', label: `${R}` },
            { k: 'd2', label: `2(${R})` },
            { k: 'd3', label: `(${R})³` }
          ];
      }
      default:
        return [];
    }
  }

  // The correct key for each choice step.
  const ANSWER = {
    var: p => p.ax,
    method: p => (p.hasG ? 'washer' : 'disk'),
    outer: p => (p.outerFirst ? 'F' : 'G'),
    integrand: () => 'ok'
  };

  function shuffle(a) {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  }

  function order(p, step) {
    return shuffle(options(p, step).map(o => o.k));
  }

  function optionsIn(p, step, keys) {
    const all = options(p, step);
    return keys.map(k => all.find(o => o.k === k));
  }

  // Wrong limit pairs for multiple-choice quizzes (up to three, all with b > a).
  function limitDistractors(p) {
    const { a, b } = p;
    const cand = [[a, b + 1], [a + 1, b], [a - 1, b], [a, b - 1], [-b, b], [a - 1, b + 1], [a + 1, b + 1]];
    const seen = new Set([`${a},${b}`]);
    const out = [];
    for (const [x, y] of cand) {
      const key = `${x},${y}`;
      if (y > x && !seen.has(key)) {
        seen.add(key);
        out.push([x, y]);
      }
      if (out.length === 3) break;
    }
    return out;
  }

  // Text of the correct answer for a step (used when the student asks to see it).
  function answerText(p, step) {
    if (step === 'limits') return T('pr.range', { a: num(p.a), b: num(p.b) });
    if (step === 'volume') return E.piStr(p.coef);
    const key = ANSWER[step](p);
    return options(p, step).find(o => o.k === key).label;
  }

  RV.problems = {
    PROBLEMS, STEPS, make, statement, options, optionsIn, order, shuffle,
    ANSWER, limitDistractors, answerText, disp, num, rOf, rInner
  };
})(window.RV = window.RV || {});
