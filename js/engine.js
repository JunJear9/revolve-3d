/* Revolve-3D · maths engine: pure functions, no DOM.
   Needs the global `math` object (math.js). */
(function (root) {
  'use strict';

  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const SM = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+', 'ˣ': 'x' };
  const SU = {};
  Object.keys(SM).forEach(k => { SU[SM[k]] = k; });

  const sup = n => String(n).split('').map(c => SUP[+c]).join('');

  function frac(x) {
    for (let q = 1; q <= 360; q++) {
      const p = Math.round(x * q);
      if (Math.abs(p / q - x) < 1e-9) return [p, q];
    }
    return null;
  }

  function fmt(n, wrap) {
    if (Math.abs(n) < 1e-12) return '0';
    const f = frac(n);
    if (f) return f[1] === 1 ? String(f[0]) : (wrap ? '(' : '') + f[0] + '/' + f[1] + (wrap ? ')' : '');
    return String(+n.toFixed(4));
  }

  const paren = n => (n < 0 ? '(' + fmt(n) + ')' : fmt(n));

  function piStr(C) {
    if (Math.abs(C) < 1e-12) return '0';
    const f = frac(C);
    if (f) {
      const [p, q] = f;
      const n = p === 1 ? 'π' : p === -1 ? '−π' : fmt(p) + 'π';
      return q === 1 ? n : n + '/' + q;
    }
    return fmt(C) + 'π';
  }

  function polyStr(c, v) {
    let s = '';
    for (let k = c.length - 1; k >= 0; k--) {
      const a = c[k];
      if (Math.abs(a) < 1e-12) continue;
      const m = Math.abs(a);
      const t = k === 0 ? fmt(m) : ((m === 1 ? '' : fmt(m, 1)) + v + (k > 1 ? sup(k) : ''));
      s += s ? (a < 0 ? ' − ' : ' + ') + t : (a < 0 ? '−' : '') + t;
    }
    return s || '0';
  }

  function polyExpr(c, v) {
    return c.map((a, k) => (a ? (k ? (a === 1 ? '' : a + '*') + v + (k > 1 ? '^' + k : '') : '' + a) : ''))
      .filter(Boolean).join('+') || '0';
  }

  const pmul = (p, q) => {
    const r = Array(p.length + q.length - 1).fill(0);
    p.forEach((a, i) => q.forEach((b, j) => { r[i + j] += a * b; }));
    return r;
  };
  const psub = (p, q) => {
    const n = Math.max(p.length, q.length);
    return Array.from({ length: n }, (_, i) => (p[i] || 0) - (q[i] || 0));
  };
  const pint = p => [0, ...p.map((a, i) => a / (i + 1))];
  const pev = (p, x) => p.reduceRight((s, a) => s * x + a, 0);

  // Fit a polynomial of degree <= 4 through five samples, then verify it at three other points.
  function fitPoly(fn) {
    try {
      const xs = [0, 1, 2, 3, 4], n = 5, ys = xs.map(fn);
      if (ys.some(y => !isFinite(y))) return null;
      const A = xs.map((x, i) => [...Array.from({ length: n }, (_, k) => x ** k), ys[i]]);
      for (let i = 0; i < n; i++) {
        let m = i;
        for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[m][i])) m = r;
        [A[i], A[m]] = [A[m], A[i]];
        for (let r = 0; r < n; r++) {
          if (r === i) continue;
          const f = A[r][i] / A[i][i];
          for (let c = i; c <= n; c++) A[r][c] -= f * A[i][c];
        }
      }
      const c = A.map((row, i) => Math.round(row[n] / row[i] * 1e9) / 1e9);
      for (const x of [-1.7, 5.3, 0.4]) {
        const tol = 1e-6 * (1 + Math.abs(fn(x)));
        if (!(Math.abs(pev(c, x) - fn(x)) <= tol)) return null;
      }
      let d = c.length;
      while (d > 1 && c[d - 1] === 0) d--;
      return c.slice(0, d);
    } catch (e) {
      return null;
    }
  }

  // Convert typed input (superscripts, √, ×, ÷, ln, π, eˣ) into math.js syntax.
  function norm(s) {
    return s
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ˣ]+/g, m => '^(' + [...m].map(c => SM[c]).join('') + ')')
      .replace(/√\(/g, 'sqrt(')
      .replace(/−/g, '-')
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'pi')
      .replace(/(^|[^a-z])ln\(/g, '$1log(');
  }

  // Convert math.js syntax back into readable maths.
  function pretty(s) {
    return s
      .replace(/\^\(([-+]?[0-9x]+)\)|\^([-+]?[0-9x]+)/g, (m, a, b) => [...(a || b)].map(c => SU[c]).join(''))
      .replace(/sqrt\(/g, '√(')
      .replace(/\bpi\b/g, 'π');
  }

  const disp = s => pretty(s).replace(/\blog\(/g, 'ln(').replace(/-/g, '−').replace(/\*/g, '·');

  function mk(expr) {
    const code = math.compile(norm(expr));
    return t => {
      const v = code.evaluate({ x: t, y: t });
      if (v && typeof v === 'object' && 're' in v && Math.abs(v.im) < 1e-6) return v.re;
      return typeof v === 'number' ? v : NaN;
    };
  }

  function simpson(h, a, b, n = 400) {
    let s = h(a) + h(b);
    const d = (b - a) / n;
    for (let i = 1; i < n; i++) s += h(a + i * d) * (i % 2 ? 4 : 2);
    return s * d / 3;
  }

  function makeSpec(o) {
    const fe = String(o.f).trim();
    const ge = String(o.g || '').trim();
    const hasG = ge !== '' && ge !== '0';
    return {
      ax: o.ax, v: o.ax, a: o.a, b: o.b, f: fe, g: hasG ? ge : '', hasG,
      fn: mk(fe), gn: mk(hasG ? ge : '0')
    };
  }

  // Returns { spec } or { err: 'empty' | 'range' | 'parse' }.
  function buildSpec(o) {
    if (!o.f || !String(o.f).trim()) return { err: 'empty' };
    if (!isFinite(o.a) || !isFinite(o.b)) return { err: 'parse' };
    if (!(o.b > o.a)) return { err: 'range' };
    try {
      const s = makeSpec(o);
      [s.a, (s.a + s.b) / 2, s.b].forEach(t => {
        if (!isFinite(s.fn(t)) || !isFinite(s.gn(t))) throw new Error('domain');
      });
      return { spec: s };
    } catch (e) {
      return { err: 'parse' };
    }
  }

  // Coefficient c so that V = c·π.
  const coefficient = s => simpson(t => s.fn(t) ** 2 - s.gn(t) ** 2, s.a, s.b);

  // True when the first curve is at least as far from the axis as the second at the midpoint.
  function outerIsFirst(s) {
    if (!s.hasG) return true;
    const m = (s.a + s.b) / 2;
    return Math.abs(s.fn(m)) >= Math.abs(s.gn(m));
  }

  function innerExceedsOuter(s) {
    if (!s.hasG) return false;
    for (let i = 0; i <= 40; i++) {
      const t = s.a + (s.b - s.a) * i / 40;
      if (Math.abs(s.gn(t)) > Math.abs(s.fn(t)) + 1e-9) return true;
    }
    return false;
  }

  function classify(fn) {
    const p = fitPoly(fn);
    if (p) return { t: 'p', p };
    const f0 = fn(0), f1 = fn(1);
    if (isFinite(f0) && Math.abs(f0) > 1e-12 && isFinite(f1) && f1 / f0 > 0) {
      const k = Math.log(f1 / f0);
      if (Math.abs(k) > 1e-9 && [-1.3, 0.6, 2.2].every(x => Math.abs(fn(x) - f0 * Math.exp(k * x)) < 1e-6 * (1 + Math.abs(fn(x))))) {
        return { t: 'e', c: f0, k };
      }
    }
    const c = fn(Math.E);
    if (isFinite(c) && Math.abs(c) > 1e-12 && [0.5, 2, 7].every(x => Math.abs(fn(x) - c * Math.log(x)) < 1e-6 * (1 + Math.abs(fn(x))))) {
      return { t: 'l', c };
    }
    return null;
  }

  function sqInt(q, v) {
    if (q.t === 'p') {
      const F = pint(pmul(q.p, q.p));
      return { s: polyStr(F, v), F: x => pev(F, x), n: 'w.int.poly' };
    }
    if (q.t === 'e') {
      const k2 = 2 * q.k, a = q.c * q.c / k2;
      return { s: `${fmt(a, 1)} e^(${fmt(k2)}${v})`, F: x => a * Math.exp(k2 * x), n: 'w.int.exp' };
    }
    const c2 = q.c * q.c;
    return {
      s: `${c2 === 1 ? '' : fmt(c2, 1) + ' '}[ ${v}(ln ${v})² − 2${v} ln ${v} + 2${v} ]`,
      F: x => c2 * (x * Math.log(x) ** 2 - 2 * x * Math.log(x) + 2 * x),
      n: 'w.int.log'
    };
  }

  const INTS = (a, b) => `π ∫<span class="il"><i>${fmt(b)}</i><i>${fmt(a)}</i></span>`;
  const LIMS = (a, b) => `<span class="il"><i>${fmt(b)}</i><i>${fmt(a)}</i></span>`;

  function polyWorking(o, T) {
    const { v, fp, gp, a, b, hasG } = o;
    const ex = psub(pmul(fp, fp), pmul(gp, gp));
    const F = pint(ex);
    const Fb = pev(F, b), Fa = pev(F, a), C = Fb - Fa;
    const d = 'd' + v, I = INTS(a, b);
    const fs = polyStr(fp, v), gs = polyStr(gp, v);
    const steps = [
      { label: T(hasG ? 'w.washer' : 'w.disk'), eq: hasG ? `V = ${I} ( R² − r² ) ${d}` : `V = ${I} R² ${d}` },
      { label: T('w.radii'), eq: hasG ? `R = ${fs},&nbsp; r = ${gs}` : `R = ${fs}` },
      { label: T('w.subst'), eq: hasG ? `V = ${I} [ (${fs})² − (${gs})² ] ${d}` : `V = ${I} (${fs})² ${d}` },
      { label: T('w.expand'), eq: `V = ${I} ( ${polyStr(ex, v)} ) ${d}` },
      { label: T('w.integrate'), eq: `V = π [ ${polyStr(F, v)} ]${LIMS(a, b)}` },
      { label: T('w.limits'), eq: `V = π ( ${paren(Fb)} − ${paren(Fa)} )` },
      { label: T('w.simplify'), eq: `V = ${piStr(C)} ≈ ${(C * Math.PI).toFixed(3)} ${T('unit')}`, box: true }
    ];
    return { steps, C };
  }

  function genWorking(o, T) {
    const { v, qf, qg, a, b, hasG } = o;
    const A = sqInt(qf, v), B = hasG ? sqInt(qg, v) : null;
    const Rv = A.F(b) - A.F(a), rv = B ? B.F(b) - B.F(a) : 0, C = Rv - rv;
    const d = 'd' + v, I = INTS(a, b);
    const cf = c => (c === 1 ? '' : fmt(c, 1) + ' ');
    const nm = q => (q.t === 'p' ? polyStr(q.p, v) : q.t === 'e' ? `${cf(q.c)}e^(${fmt(q.k)}${v})` : `${cf(q.c)}ln ${v}`);
    const steps = [
      { label: T(hasG ? 'w.washer' : 'w.disk'), eq: hasG ? `V = ${I} ( R² − r² ) ${d}` : `V = ${I} R² ${d}` },
      { label: T('w.radii'), eq: hasG ? `R = ${nm(qf)},&nbsp; r = ${nm(qg)}` : `R = ${nm(qf)}` },
      { label: T('w.subst'), eq: hasG ? `V = ${I} [ (${nm(qf)})² − (${nm(qg)})² ] ${d}` : `V = ${I} (${nm(qf)})² ${d}` },
      { label: T(A.n), eq: `V = π [ ${A.s}${B ? ' − (' + B.s + ')' : ''} ]${LIMS(a, b)}` },
      { label: T('w.limits'), eq: `V = π ( ${fmt(Rv)}${B ? ' − ' + paren(rv) : ''} )` },
      { label: T('w.simplify'), eq: `V = ${fmt(C)}π ≈ ${(C * Math.PI).toFixed(3)} ${T('unit')}`, box: true }
    ];
    return { steps, C };
  }

  // Step-by-step working for the spec, or null when the functions are not supported.
  function working(s, T) {
    const qf = classify(s.fn);
    const qg = s.hasG ? classify(s.gn) : { t: 'p', p: [0] };
    if (!qf || !qg) return null;
    const o = { v: s.v, a: s.a, b: s.b, hasG: s.hasG };
    if (qf.t === 'p' && qg.t === 'p') return polyWorking({ ...o, fp: qf.p, gp: qg.p }, T);
    return genWorking({ ...o, qf, qg }, T);
  }

  function workingHTML(w) {
    return w.steps.map(s => `<div class="lab">${s.label}</div><div class="eq${s.box ? ' box' : ''}">${s.eq}</div>`).join('');
  }

  // Accepts 2/15, 0.13, 2π/15 (π is read as 1). Returns a number or null.
  function parseAnswer(str) {
    if (str === null || str === undefined || String(str).trim() === '') return null;
    try {
      const v = math.evaluate(String(str).replace(/π/g, 'pi'), { pi: 1 });
      return typeof v === 'number' && isFinite(v) ? v : null;
    } catch (e) {
      return null;
    }
  }

  const engine = {
    fmt, frac, piStr, polyStr, polyExpr, pmul, psub, pint, pev, fitPoly,
    norm, pretty, disp, mk, simpson, makeSpec, buildSpec, coefficient,
    outerIsFirst, innerExceedsOuter, classify, working, workingHTML, parseAnswer
  };

  root.RV = root.RV || {};
  root.RV.engine = engine;
  if (typeof module !== 'undefined' && module.exports) module.exports = engine;
})(typeof window !== 'undefined' ? window : globalThis);
