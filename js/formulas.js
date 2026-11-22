/* Revolve-3D · Formulas tab: volume decision guide + integration formulas with live checks. */
(function (RV) {
  'use strict';

  const I = RV.i18n, T = (k, v) => I.t(k, v), pick = I.pick, h = RV.dom.h;
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
      a: [1, 4, 2], sym: 'a', fn: (a, x) => 1 / Math.cos(a * x) ** 2, F: (a, x) => Math.tan(a * x) / a },
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

  const sliderValue = FORMS.map(f => (f.a ? f.a[2] : null));

  const IL = (top, bottom) => `<span class="il"><i>${top}</i><i>${bottom}</i></span>`;

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
            const box = $(`fc-${i}`);
            box.replaceChildren(checkLine(F, sliderValue[i]));
          }
        })));
    }
    kids.push(h('div', { id: `fc-${i}` }, checkLine(F, F.a ? sliderValue[i] : 1)));
    return h('details', { class: 'card formula', 'data-i': i, open }, kids);
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
  }

  function init() {
    render();
  }

  RV.formulas = { init, render, show: () => {} };
})(window.RV = window.RV || {});
