/* Revolve-3D · Formulas tab: volume decision guide, integration formulas with live checks, and a graph for each formula. */
(function (RV) {
  'use strict';

  const I = RV.i18n, T = (k, v) => I.t(k, v), pick = I.pick, h = RV.dom.h;
  const { simpson } = RV.engine;
  const $ = id => document.getElementById(id);

  // Each formula has: a slider (optional), a function fn(a, x) and its antiderivative F(a, x).
  // The check differentiates F numerically at x = 0.3 and compares with fn.
  const FORMS = [
    { n: { en: 'Exponential: eᵃˣ⁺ᵇ', bm: 'Eksponen: eᵃˣ⁺ᵇ' }, f: '∫ eᵃˣ⁺ᵇ dx = eᵃˣ⁺ᵇ / a + c',
      h: { en: 'Copy the exponential, then divide by the number in front of x.', bm: 'Salin eksponen, kemudian bahagi dengan nombor di depan x.' },
      y: { en: 'Differentiating eᵃˣ⁺ᵇ gives a·eᵃˣ⁺ᵇ, so dividing by a cancels the extra a.', bm: 'Membezakan eᵃˣ⁺ᵇ menghasilkan a·eᵃˣ⁺ᵇ, jadi membahagi dengan a membatalkan faktor a tambahan.' },
      w: { en: 'When the power is a linear expression such as 3x + 1 or −7x. The check uses b = 1.', bm: 'Apabila kuasa ialah ungkapan linear seperti 3x + 1 atau −7x. Semakan menggunakan b = 1.' },
      a: [1, 5, 2], sym: 'a', fn: (a, x) => Math.exp(a * x + 1), F: (a, x) => Math.exp(a * x + 1) / a },
    { n: { en: 'Other base: aᵐˣ⁺ⁿ', bm: 'Asas lain: aᵐˣ⁺ⁿ' }, f: '∫ aᵐˣ⁺ⁿ dx = aᵐˣ⁺ⁿ / (m ln a) + c',
      h: { en: 'Copy the term, then divide by (the number in front of x) × ln of the base.', bm: 'Salin sebutan, kemudian bahagi dengan (nombor di depan x) × ln asas.' },
      y: { en: 'Differentiating a to the power u gives (ln a) × u′ × the same term, so divide by ln a and by u′ = m.', bm: 'Membezakan asas dengan kuasa u menghasilkan (ln a) × u′ × sebutan yang sama, jadi bahagi dengan ln a dan dengan u′ = m.' },
      w: { en: 'When the base is a plain number like 5 instead of e. The check uses base 5, and m is the slider.', bm: 'Apabila asasnya nombor biasa seperti 5, bukan e. Semakan menggunakan asas 5, dan m ialah gelangsar.' },
      a: [1, 4, 3], sym: 'm', fn: (m, x) => 5 ** (m * x), F: (m, x) => 5 ** (m * x) / (m * Math.log(5)) },
    { n: { en: 'Reciprocal: 1/(ax + b)', bm: 'Salingan: 1/(ax + b)' }, f: '∫ 1/(ax + b) dx = (1/a) ln|ax + b| + c',
      h: { en: 'Put the whole bottom inside ln|…|, then divide by the number in front of x.', bm: 'Letakkan keseluruhan penyebut dalam ln|…|, kemudian bahagi dengan nombor di depan x.' },
      y: { en: 'Differentiating ln|ax + b| gives a/(ax + b), so you divide by a.', bm: 'Membezakan ln|ax + b| menghasilkan a/(ax + b), jadi bahagi dengan a.' },
      w: { en: 'Only when x on the bottom has power 1. For 1/(x² − 4) use partial fractions instead.', bm: 'Hanya apabila x di penyebut berkuasa 1. Untuk 1/(x² − 4), guna pecahan separa.' },
      a: [1, 5, 2], sym: 'a', fn: (a, x) => 1 / (a * x + 1), F: (a, x) => Math.log(Math.abs(a * x + 1)) / a },
    { n: { en: 'Sine: sin ax', bm: 'Sinus: sin ax' }, f: '∫ sin ax dx = −cos ax / a + c',
      h: { en: 'Change sin to −cos, then divide by a.', bm: 'Tukar sin kepada −kos, kemudian bahagi dengan a.' },
      y: { en: 'Differentiating −cos ax gives a sin ax, so you divide by a.', bm: 'Membezakan −kos ax menghasilkan a sin ax, jadi bahagi dengan a.' },
      w: { en: 'Whenever sin has a linear expression inside.', bm: 'Setiap kali sin mempunyai ungkapan linear di dalamnya.' },
      a: [1, 4, 2], sym: 'a', fn: (a, x) => Math.sin(a * x), F: (a, x) => -Math.cos(a * x) / a },
    { n: { en: 'Cosine: cos ax', bm: 'Kosinus: kos ax' }, f: '∫ cos ax dx = sin ax / a + c',
      h: { en: 'Change cos to sin, then divide by a.', bm: 'Tukar kos kepada sin, kemudian bahagi dengan a.' },
      y: { en: 'Differentiating sin ax gives a cos ax, so you divide by a.', bm: 'Membezakan sin ax menghasilkan a kos ax, jadi bahagi dengan a.' },
      w: { en: 'Whenever cos has a linear expression inside.', bm: 'Setiap kali kos mempunyai ungkapan linear di dalamnya.' },
      a: [1, 4, 2], sym: 'a', fn: (a, x) => Math.cos(a * x), F: (a, x) => Math.sin(a * x) / a },
    { n: { en: 'Secant squared: sec² ax', bm: 'Sekan kuasa dua: sek² ax' }, f: '∫ sec² ax dx = tan ax / a + c',
      h: { en: 'Change sec² to tan, then divide by a. The same pattern gives ∫ sec x tan x dx = sec x + c, ∫ csc x cot x dx = −csc x + c and ∫ csc² x dx = −cot x + c.', bm: 'Tukar sek² kepada tan, kemudian bahagi dengan a. Corak yang sama memberi ∫ sek x tan x dx = sek x + c, ∫ kosek x kot x dx = −kosek x + c dan ∫ kosek² x dx = −kot x + c.' },
      y: { en: 'Differentiating tan ax gives a sec² ax.', bm: 'Membezakan tan ax menghasilkan a sek² ax.' },
      w: { en: 'Whenever you meet sec², or the other trig results on the table, with a linear inside.', bm: 'Apabila anda jumpa sek², atau hasil trigonometri lain dalam jadual, dengan ungkapan linear di dalam.' },
      a: [1, 2, 1], sym: 'a', fn: (a, x) => 1 / Math.cos(a * x) ** 2, F: (a, x) => Math.tan(a * x) / a },
    { n: { en: 'Product to sum: sin ax cos bx', bm: 'Hasil darab kepada hasil tambah: sin ax kos bx' }, f: 'sin ax cos bx = ½ [ sin(a + b)x + sin(a − b)x ]',
      h: { en: 'Rewrite the product as a sum, then integrate each sine with the sine rule. cos × cos and sin × sin have their own versions.', bm: 'Tulis semula hasil darab sebagai hasil tambah, kemudian kamirkan setiap sin dengan peraturan sin. Kos × kos dan sin × sin ada versi sendiri.' },
      y: { en: 'A product of sin and cos cannot be integrated directly, but a sum can.', bm: 'Hasil darab sin dan kos tidak boleh dikamirkan terus, tetapi hasil tambah boleh.' },
      w: { en: 'Only when sin and cos (or cos and cos, or sin and sin) are multiplied. The check uses b = 2.', bm: 'Hanya apabila sin dan kos (atau kos dan kos, atau sin dan sin) didarab. Semakan menggunakan b = 2.' },
      a: [3, 6, 4], sym: 'a', fn: (a, x) => Math.sin(a * x) * Math.cos(2 * x),
      F: (a, x) => -Math.cos((a + 2) * x) / (2 * (a + 2)) - Math.cos((a - 2) * x) / (2 * (a - 2)) },
    { n: { en: 'Identity: sin² ax', bm: 'Identiti: sin² ax' }, f: 'sin² ax = (1 − cos 2ax)/2, so ∫ sin² ax dx = x/2 − sin 2ax / (4a) + c',
      h: { en: 'Replace sin² ax with (1 − cos 2ax)/2, then integrate the two terms.', bm: 'Gantikan sin² ax dengan (1 − kos 2ax)/2, kemudian kamirkan dua sebutan itu.' },
      y: { en: 'sin² cannot be integrated directly, but cos 2ax can.', bm: 'sin² tidak boleh dikamirkan terus, tetapi kos 2ax boleh.' },
      w: { en: 'Whenever sin or cos is squared.', bm: 'Setiap kali sin atau kos dikuasa duakan.' },
      a: [1, 4, 2], sym: 'a', fn: (a, x) => Math.sin(a * x) ** 2, F: (a, x) => x / 2 - Math.sin(2 * a * x) / (4 * a) },
    { n: { en: 'Identity: cos² ax', bm: 'Identiti: kos² ax' }, f: 'cos² ax = (1 + cos 2ax)/2, so ∫ cos² ax dx = x/2 + sin 2ax / (4a) + c',
      h: { en: 'Replace cos² ax with (1 + cos 2ax)/2, then integrate the two terms.', bm: 'Gantikan kos² ax dengan (1 + kos 2ax)/2, kemudian kamirkan dua sebutan itu.' },
      y: { en: 'It is the same trick as sin², with a plus sign.', bm: 'Ia helah yang sama seperti sin², dengan tanda tambah.' },
      w: { en: 'Whenever cos is squared.', bm: 'Setiap kali kos dikuasa duakan.' },
      a: [1, 4, 2], sym: 'a', fn: (a, x) => Math.cos(a * x) ** 2, F: (a, x) => x / 2 + Math.sin(2 * a * x) / (4 * a) },
    { n: { en: 'Substitution', bm: 'Penggantian' },
      f: { en: '∫ 2x(x² + 1)³ dx: let u = x² + 1, du = 2x dx, so ∫ u³ du = u⁴/4 + c = (x² + 1)⁴/4 + c', bm: '∫ 2x(x² + 1)³ dx: biar u = x² + 1, du = 2x dx, maka ∫ u³ du = u⁴/4 + c = (x² + 1)⁴/4 + c' },
      h: { en: '1. Let u be the inside part. 2. Replace dx using du. 3. Integrate in u. 4. Put x back.', bm: '1. Biar u ialah bahagian dalam. 2. Gantikan dx menggunakan du. 3. Kamirkan dalam u. 4. Gantikan semula x.' },
      y: { en: 'It reverses the chain rule: the extra factor 2x is exactly du.', bm: 'Ia membalikkan petua rantai: faktor tambahan 2x ialah du.' },
      w: { en: 'When one part is the derivative of another part. Choose u as the complicated bracket, the denominator or the surd.', bm: 'Apabila satu bahagian ialah terbitan bahagian lain. Pilih u sebagai kurungan yang rumit, penyebut atau surd.' },
      a: null, fn: (a, x) => 2 * x * (x * x + 1) ** 3, F: (a, x) => (x * x + 1) ** 4 / 4 },
    { n: { en: 'Integration by parts', bm: 'Kamiran bahagian demi bahagian' },
      f: { en: '∫ u dv = uv − ∫ v du. Example: ∫ x eˣ dx = x eˣ − eˣ + c', bm: '∫ u dv = uv − ∫ v du. Contoh: ∫ x eˣ dx = x eˣ − eˣ + c' },
      h: { en: 'Choose u with LoPET (Logarithm, Polynomial, Exponential, Trig). The rest is dv.', bm: 'Pilih u mengikut LoPET (Logaritma, Polinomial, Eksponen, Trigonometri). Bakinya ialah dv.' },
      y: { en: 'It reverses the product rule.', bm: 'Ia membalikkan petua hasil darab.' },
      w: { en: 'When two different types are multiplied, like x·eˣ or x·ln x.', bm: 'Apabila dua jenis berbeza didarab, seperti x·eˣ atau x·ln x.' },
      a: null, fn: (a, x) => x * Math.exp(x), F: (a, x) => (x - 1) * Math.exp(x) },
    { n: { en: 'Partial fractions', bm: 'Pecahan separa' },
      f: { en: '1/((x − 1)(x + 1)) = ½ [ 1/(x − 1) − 1/(x + 1) ], so ∫ = ½ ln|(x − 1)/(x + 1)| + c', bm: '1/((x − 1)(x + 1)) = ½ [ 1/(x − 1) − 1/(x + 1) ], maka ∫ = ½ ln|(x − 1)/(x + 1)| + c' },
      h: { en: 'If the top is as big as the bottom, do long division first. Factorise the bottom, split into simple fractions, then use the ln formula on each.', bm: 'Jika pembilang sama besar dengan penyebut, buat pembahagian panjang dahulu. Faktorkan penyebut, pecahkan kepada pecahan ringkas, kemudian guna formula ln pada setiap satu.' },
      y: { en: 'Each simple piece has a linear bottom, so the ln formula applies.', bm: 'Setiap pecahan ringkas mempunyai penyebut linear, jadi formula ln terpakai.' },
      w: { en: 'A fraction whose bottom factorises into linear or quadratic parts.', bm: 'Pecahan yang penyebutnya boleh difaktorkan kepada bahagian linear atau kuadratik.' },
      a: null, fn: (a, x) => 1 / ((x - 1) * (x + 1)), F: (a, x) => 0.5 * Math.log(Math.abs((x - 1) / (x + 1))) }
  ];

  // Graph domain [from, to] for each formula, as in the reference file.
  const FD = [
    [-2, 0], [-1, 0.5], [0, 4], [0, 6.3], [0, 6.3], [0, 0.65],
    [0, 6], [0, 6], [0, 6], [0, 1], [0, 2], [1.3, 4]
  ];

  const sliderValue = FORMS.map(f => (f.a ? f.a[2] : null));
  // Graph state per formula: the x being shown, paused flag and direction of play.
  const graphX = FD.map(([lo, hi]) => lo + (hi - lo) * 0.45);
  const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const paused = FORMS.map(() => REDUCED);   // with reduced motion, graphs wait for the student
  const dir = FORMS.map(() => 1);

  const IL = (top, bottom) => `<span class="il"><i>${top}</i><i>${bottom}</i></span>`;
  const aOf = i => (FORMS[i].a ? sliderValue[i] : 1);
  const cl = v => (isFinite(v) ? Math.max(-25, Math.min(25, v)) : 0);
  const num = v => String(Number(v.toFixed(4)));
  const isOpen = i => { const d = $('fd-' + i); return !!(d && d.open); };

  function volumeGuide() {
    return h('section', { class: 'card guide', 'aria-labelledby': 'vol-h' },
      h('h2', { id: 'vol-h' }, T('formulas.vol.h')),
      h('table', { class: 'decision' },
        h('thead', {}, h('tr', {},
          h('th', { scope: 'col' }, T('formulas.vol.col1')),
          h('th', { scope: 'col' }, T('formulas.vol.col2')),
          h('th', { scope: 'col' }, T('formulas.vol.col3')))),
        h('tbody', {},
          h('tr', {},
            h('td', {}, T('formulas.vol.no')),
            h('td', { class: 'name' }, T('formulas.vol.disk')),
            h('td', { class: 'eq-cell', html: `V = π ∫${IL('b', 'a')} R² dx` })),
          h('tr', {},
            h('td', {}, T('formulas.vol.yes')),
            h('td', { class: 'name' }, T('formulas.vol.washer')),
            h('td', { class: 'eq-cell', html: `V = π ∫${IL('b', 'a')} (R² − r²) dx` })))),
      h('ul', { class: 'notes' },
        h('li', {}, T('formulas.vol.b1')),
        h('li', {}, T('formulas.vol.b2')),
        h('li', {}, T('formulas.vol.b3'))),
      h('p', { class: 'warn-note' }, T('formulas.vol.warn')));
  }

  function checkLine(F, a) {
    const x = 0.3, step = 1e-5;
    const slope = (F.F(a, x + step) - F.F(a, x - step)) / (2 * step);
    const value = F.fn(a, x);
    const ok = Math.abs(slope - value) < 1e-4;
    return h('p', { class: 'check mut' },
      T('formulas.check', { sl: slope.toFixed(5), fv: value.toFixed(5) }), ' ',
      h('span', { class: ok ? 'ok' : 'warn' }, ok ? T('formulas.match') : T('formulas.nomatch')));
  }

  // ---- Graph helpers (ported from the reference file) ----

  function niceStep(span, target = 6) {
    const raw = Math.max(span, 1e-9) / target;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const normVal = raw / pow;
    const step = normVal <= 1 ? 1 : normVal <= 2 ? 2 : normVal <= 5 ? 5 : 10;
    return step * pow;
  }

  function fmtTick(v, step) {
    if (Math.abs(v) < step * 1e-4) return '0';
    const dec = step < 0.01 ? 3 : step < 0.1 ? 2 : step < 1 ? 1 : 0;
    return Number(v.toFixed(dec)).toString();
  }

  // Grid, axes and tick labels. Returns the maps from x and y to pixels.
  function drawGrid(ctx, W, H, pad, x0, x1, y0, y1, col) {
    const pw = W - pad.l - pad.r;
    const ph = H - pad.t - pad.b;
    const sx = t => pad.l + pw * (t - x0) / (x1 - x0);
    const sy = v => pad.t + ph * (1 - (v - y0) / (y1 - y0));
    const xStep = niceStep(x1 - x0, Math.max(4, Math.floor(pw / 75)));
    const yStep = niceStep(y1 - y0, Math.max(3, Math.floor(ph / 48)));

    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.l, pad.t, pw, ph);
    ctx.clip();

    ctx.strokeStyle = col('--grid');
    ctx.lineWidth = 1;
    const xSub = xStep / 2, ySub = yStep / 2;
    for (let gx = Math.floor(x0 / xSub) * xSub; gx <= x1 + xSub; gx += xSub) {
      const px = sx(gx);
      ctx.beginPath(); ctx.moveTo(px, pad.t); ctx.lineTo(px, H - pad.b); ctx.stroke();
    }
    for (let gy = Math.floor(y0 / ySub) * ySub; gy <= y1 + ySub; gy += ySub) {
      const py = sy(gy);
      ctx.beginPath(); ctx.moveTo(pad.l, py); ctx.lineTo(W - pad.r, py); ctx.stroke();
    }

    ctx.strokeStyle = col('--line');
    ctx.globalAlpha = 0.55;
    for (let gx = Math.floor(x0 / xStep) * xStep; gx <= x1 + xStep; gx += xStep) {
      const px = sx(gx);
      ctx.beginPath(); ctx.moveTo(px, pad.t); ctx.lineTo(px, H - pad.b); ctx.stroke();
    }
    for (let gy = Math.floor(y0 / yStep) * yStep; gy <= y1 + yStep; gy += yStep) {
      const py = sy(gy);
      ctx.beginPath(); ctx.moveTo(pad.l, py); ctx.lineTo(W - pad.r, py); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = col('--mut');
    ctx.lineWidth = 1.5;
    if (y0 <= 0 && y1 >= 0) {
      const py = sy(0);
      ctx.beginPath(); ctx.moveTo(pad.l, py); ctx.lineTo(W - pad.r, py); ctx.stroke();
    }
    if (x0 <= 0 && x1 >= 0) {
      const px = sx(0);
      ctx.beginPath(); ctx.moveTo(px, pad.t); ctx.lineTo(px, H - pad.b); ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = col('--line');
    ctx.lineWidth = 1;
    ctx.strokeRect(pad.l, pad.t, pw, ph);

    ctx.fillStyle = col('--mut');
    ctx.font = '11px system-ui, sans-serif';
    const yZeroPx = (y0 <= 0 && y1 >= 0) ? Math.min(H - pad.b - 4, Math.max(pad.t + 12, sy(0))) : H - pad.b;
    const xZeroPx = (x0 <= 0 && x1 >= 0) ? Math.min(W - pad.r - 6, Math.max(pad.l + 4, sx(0))) : pad.l;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let gx = Math.ceil(x0 / xStep) * xStep; gx <= x1; gx += xStep) {
      if (Math.abs(gx) < xStep * 1e-4 && x0 < 0 && x1 > 0) continue;
      const px = sx(gx);
      if (px < pad.l + 10 || px > W - pad.r - 10) continue;
      const ty = (yZeroPx < H - pad.b - 14) ? yZeroPx + 4 : H - pad.b + 4;
      ctx.fillText(fmtTick(gx, xStep), px, ty);
    }

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let gy = Math.ceil(y0 / yStep) * yStep; gy <= y1; gy += yStep) {
      if (Math.abs(gy) < yStep * 1e-4 && y0 < 0 && y1 > 0) continue;
      const py = sy(gy);
      if (py < pad.t + 8 || py > H - pad.b - 8) continue;
      const tx = (xZeroPx > pad.l + 26) ? xZeroPx - 5 : pad.l - 4;
      ctx.fillText(fmtTick(gy, yStep), tx, py);
    }

    return { sx, sy, pw, ph };
  }

  // Draws f(t) and F(t) over the domain, the area from lo to x, the tangent at x, and the two dots.
  function drawGraph(i) {
    const cv = $('fg-' + i);
    if (!cv) return;
    const W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;

    const F = FORMS[i], A = aOf(i), [lo, hi] = FD[i], xc = graphX[i];
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cs = getComputedStyle(document.documentElement);
    const col = k => cs.getPropertyValue(k).trim();

    const xs = [], Fv = [], fv = [];
    for (let j = 0; j <= 140; j++) {
      const t = lo + (hi - lo) * j / 140;
      xs.push(t);
      Fv.push(cl(F.F(A, t)));
      fv.push(cl(F.fn(A, t)));
    }
    let y0 = Math.min(0, ...Fv, ...fv), y1 = Math.max(0, ...Fv, ...fv);
    const pd = 0.14 * (y1 - y0 || 1);
    y0 -= pd;
    y1 += pd;

    const pad = { l: 36, r: 12, t: 12, b: 22 };
    const { sx, sy, pw, ph } = drawGrid(ctx, W, H, pad, lo, hi, y0, y1, col);

    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.l, pad.t, pw, ph);
    ctx.clip();

    // Shaded signed area from lo to xc, drawn in strips.
    if (xc > lo + 1e-5) {
      const segs = 120;
      for (let j = 0; j < segs; j++) {
        const t0 = lo + (xc - lo) * j / segs;
        const t1 = lo + (xc - lo) * (j + 1) / segs;
        const v0 = cl(F.fn(A, t0)), v1 = cl(F.fn(A, t1));
        const midV = 0.5 * (v0 + v1);
        ctx.beginPath();
        ctx.moveTo(sx(t0), sy(0));
        ctx.lineTo(sx(t0), sy(v0));
        ctx.lineTo(sx(t1), sy(v1));
        ctx.lineTo(sx(t1), sy(0));
        ctx.closePath();
        ctx.fillStyle = midV >= 0 ? 'rgba(140, 114, 137, 0.26)' : 'rgba(181, 101, 91, 0.24)';
        ctx.fill();
      }
      const nTicks = Math.max(4, Math.round(24 * (xc - lo) / (hi - lo)));
      ctx.lineWidth = 1;
      for (let j = 1; j < nTicks; j++) {
        const ts = lo + (xc - lo) * j / nTicks;
        const vs = cl(F.fn(A, ts));
        ctx.strokeStyle = vs >= 0 ? 'rgba(140, 114, 137, 0.32)' : 'rgba(181, 101, 91, 0.32)';
        ctx.beginPath(); ctx.moveTo(sx(ts), sy(0)); ctx.lineTo(sx(ts), sy(vs)); ctx.stroke();
      }
      ctx.strokeStyle = col('--vi');
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx(lo), sy(0)); ctx.lineTo(sx(xc), sy(0)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx(lo), sy(0)); ctx.lineTo(sx(lo), sy(cl(F.fn(A, lo)))); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx(xc), sy(0)); ctx.lineTo(sx(xc), sy(cl(F.fn(A, xc)))); ctx.stroke();
    }

    const drawCurve = (arr, color, w) => {
      ctx.beginPath();
      xs.forEach((t, j) => (j ? ctx.lineTo(sx(t), sy(arr[j])) : ctx.moveTo(sx(t), sy(arr[j]))));
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.stroke();
    };
    drawCurve(Fv, col('--ac'), 2.6);
    drawCurve(fv, col('--vi'), 2.4);

    // Teal guide lines for F(x0) and the change ΔF.
    const Flo = cl(F.F(A, lo)), Fx = cl(F.F(A, xc));
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = col('--ac');
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(sx(lo), sy(Flo)); ctx.lineTo(sx(xc), sy(Flo)); ctx.stroke();
    ctx.setLineDash([]);

    if (Math.abs(Fx - Flo) > 1e-4) {
      ctx.strokeStyle = col('--ac');
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx(xc), sy(Flo)); ctx.lineTo(sx(xc), sy(Fx)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx(xc) - 4, sy(Flo)); ctx.lineTo(sx(xc) + 4, sy(Flo)); ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(sx(lo), sy(Flo), 3.5, 0, Math.PI * 2);
    ctx.fillStyle = col('--ac');
    ctx.fill();

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = col('--mut');
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(sx(xc), pad.t); ctx.lineTo(sx(xc), H - pad.b); ctx.stroke();
    ctx.setLineDash([]);

    // Tangent to F at xc, with slope f(xc).
    const e = 1e-4;
    const rawFx = F.F(A, xc);
    const m = (F.F(A, xc + e) - F.F(A, xc - e)) / (2 * e);
    const fxVal = F.fn(A, xc);
    const d = (hi - lo) * 0.13;
    ctx.strokeStyle = col('--amber');
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(sx(xc - d), sy(cl(rawFx - m * d)));
    ctx.lineTo(sx(xc + d), sy(cl(rawFx + m * d)));
    ctx.stroke();

    const dot = (v, c) => {
      ctx.beginPath();
      ctx.arc(sx(xc), sy(cl(v)), 5, 0, Math.PI * 2);
      ctx.fillStyle = c;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    };
    dot(rawFx, col('--ac'));
    dot(fxVal, col('--vi'));
    ctx.restore();
  }

  // Numbers under the graph: the area against ΔF, and the slope against f(x).
  function updateReadout(i) {
    const el = $('fr-' + i);
    if (!el) return;
    const F = FORMS[i], A = aOf(i), [lo] = FD[i], xc = graphX[i];
    const e = 1e-5;
    const sl = (F.F(A, xc + e) - F.F(A, xc - e)) / (2 * e);
    const fv = F.fn(A, xc);
    const area = simpson(t => F.fn(A, t), lo, xc, 240);
    const dF = F.F(A, xc) - F.F(A, lo);
    const areaOk = Math.abs(area - dF) < 1e-3 * (1 + Math.abs(dF));
    const slopeOk = Math.abs(sl - fv) < 1e-3 * (1 + Math.abs(fv));
    const mark = ok => h('span', { class: ok ? 'ok' : 'warn' }, ok ? ' ' + T('fg.equal') : ' ✗');
    el.replaceChildren(
      h('div', {}, T('fg.area', { lo: num(lo), x: xc.toFixed(2), area: area.toFixed(4), df: dF.toFixed(4) }), mark(areaOk)),
      h('div', {}, T('fg.slope', { x: xc.toFixed(2), sl: sl.toFixed(4), fv: fv.toFixed(4) }), mark(slopeOk)));
  }

  function redraw() {
    FORMS.forEach((F, i) => {
      if (!isOpen(i)) return;
      drawGraph(i);
      updateReadout(i);
    });
  }

  function setPaused(i, p) {
    paused[i] = p;
    const b = $('fp-' + i);
    if (b) b.textContent = T(p ? 'fg.play' : 'fg.pause');
    if (!p) ensureLoop();
  }

  // One animation loop serves every open, playing graph. It stops when the page is hidden or nothing plays.
  let frame = 0;
  function step() {
    frame = 0;
    if ($('formulas').hidden) return;
    let running = false;
    FORMS.forEach((F, i) => {
      if (paused[i] || !isOpen(i)) return;
      const [lo, hi] = FD[i];
      running = true;
      let nx = graphX[i] + dir[i] * (hi - lo) / 480;   // about 8 seconds from one end to the other
      if (nx >= hi) { nx = hi; dir[i] = -1; }
      else if (nx <= lo) { nx = lo; dir[i] = 1; }
      graphX[i] = nx;
      drawGraph(i);
      updateReadout(i);
    });
    if (running) frame = requestAnimationFrame(step);
  }

  function ensureLoop() {
    if (!frame) frame = requestAnimationFrame(step);
  }

  function wireGraph(i) {
    const cv = $('fg-' + i), d = $('fd-' + i), btn = $('fp-' + i);
    if (!cv || !d || !btn) return;

    d.addEventListener('toggle', () => {
      if (!d.open) return;
      requestAnimationFrame(() => { drawGraph(i); updateReadout(i); ensureLoop(); });
    });
    btn.addEventListener('click', () => setPaused(i, !paused[i]));

    // Dragging scrubs x and pauses the animation.
    const scrub = ev => {
      const r = cv.getBoundingClientRect();
      const [lo, hi] = FD[i];
      const pw = Math.max(1, r.width - 36 - 12);
      graphX[i] = Math.max(lo, Math.min(hi, lo + (hi - lo) * (ev.clientX - r.left - 36) / pw));
      setPaused(i, true);
      drawGraph(i);
      updateReadout(i);
    };
    let dragging = false;
    cv.addEventListener('pointerdown', ev => {
      dragging = true;
      cv.setPointerCapture(ev.pointerId);
      scrub(ev);
    });
    cv.addEventListener('pointermove', ev => { if (dragging) scrub(ev); });
    ['pointerup', 'pointercancel'].forEach(name => cv.addEventListener(name, () => { dragging = false; }));
  }

  function formulaCard(F, i, open) {
    const kids = [
      h('summary', {}, pick(F.n)),
      h('div', { class: 'eq' }, pick(F.f)),
      h('p', {}, h('b', {}, T('formulas.howto') + ' '), pick(F.h)),
      h('p', {}, h('b', {}, T('formulas.why') + ' '), pick(F.y)),
      h('p', {}, h('b', {}, T('formulas.when') + ' '), pick(F.w))
    ];
    if (F.a) {
      kids.push(h('label', { class: 'slider' },
        h('span', {}, `${F.sym} = `, h('output', { id: `fo-${i}` }, String(sliderValue[i]))),
        h('input', {
          type: 'range', min: F.a[0], max: F.a[1], step: 1, value: sliderValue[i],
          'aria-label': `${F.sym}`,
          oninput: e => {
            sliderValue[i] = Number(e.target.value);
            $(`fo-${i}`).textContent = String(sliderValue[i]);
            $(`fc-${i}`).replaceChildren(checkLine(F, sliderValue[i]));
            drawGraph(i);
            updateReadout(i);
          }
        })));
    }
    kids.push(
      h('div', { id: `fc-${i}` }, checkLine(F, aOf(i))),
      h('div', { class: 'fgwrap' }, h('canvas', {
        id: `fg-${i}`, class: 'fgraph', role: 'img', 'aria-label': T('fg.aria')
      })),
      h('div', { class: 'leg' },
        h('span', {}, h('i', { class: 'sw sw-area' }), T('fg.legA')),
        h('span', {}, h('i', { class: 'sw sw-neg' }), T('fg.legN')),
        h('span', {}, h('i', { class: 'sw sw-int' }), T('fg.legF')),
        h('span', {}, h('i', { class: 'sw sw-tan' }), T('fg.legT'))),
      h('div', { class: 'fbar' },
        h('button', { type: 'button', class: 'btn alt sm', id: `fp-${i}` }, T(paused[i] ? 'fg.play' : 'fg.pause'))),
      h('div', { class: 'graph-read', id: `fr-${i}` }),
      h('p', { class: 'mut small' }, T('fg.note')));
    return h('details', { class: 'card formula', id: `fd-${i}`, 'data-i': i, open }, kids);
  }

  // Re-rendering (for example on a language switch) keeps the cards the student has open.
  let rendered = false;

  function render() {
    const body = $('formulas-body');
    const open = new Set(Array.from(body.querySelectorAll('details[data-i]'))
      .filter(d => d.open).map(d => Number(d.dataset.i)));
    if (!rendered) open.add(0);
    rendered = true;
    body.replaceChildren(
      volumeGuide(),
      h('h2', { class: 'section-h' }, T('formulas.int.h')),
      h('p', { class: 'lead' }, T('formulas.intro')),
      ...FORMS.map((F, i) => formulaCard(F, i, open.has(i)))
    );
    FORMS.forEach((_, i) => wireGraph(i));
    redraw();
    ensureLoop();
  }

  function init() {
    render();
  }

  RV.formulas = {
    init,
    render,
    redraw,
    show: () => { redraw(); ensureLoop(); }
  };
})(window.RV = window.RV || {});
