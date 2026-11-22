/* Revolve-3D · Simulator tab: free exploration of any curve, axis and limits. */
(function (RV) {
  'use strict';

  const E = RV.engine, I = RV.i18n, T = (k, v) => I.t(k, v), h = RV.dom.h;
  const $ = id => document.getElementById(id);

  // Presets are checked against the region they describe (inner curve must not cross the outer one).
  const PRESETS = [
    { n: { en: 'Disk: y = x², 0 to 2', bm: 'Cakera: y = x², 0 hingga 2' }, ax: 'x', f: 'x^2', g: '', a: 0, b: 2 },
    { n: { en: 'Cone: y = x, 0 to 3', bm: 'Kon: y = x, 0 hingga 3' }, ax: 'x', f: 'x', g: '', a: 0, b: 3 },
    { n: { en: 'Sphere: y = √(4 − x²)', bm: 'Sfera: y = √(4 − x²)' }, ax: 'x', f: 'sqrt(4-x^2)', g: '', a: -2, b: 2 },
    { n: { en: 'Washer: y = x and y = x², 0 to 1', bm: 'Gelang: y = x dan y = x², 0 hingga 1' }, ax: 'x', f: 'x', g: 'x^2', a: 0, b: 1 },
    { n: { en: 'Washer: y = 4 and y = x², −2 to 2', bm: 'Gelang: y = 4 dan y = x², −2 hingga 2' }, ax: 'x', f: '4', g: 'x^2', a: -2, b: 2 },
    { n: { en: 'Washer: y = e^x and y = 1, 0 to 1', bm: 'Gelang: y = eˣ dan y = 1, 0 hingga 1' }, ax: 'x', f: 'e^x', g: '1', a: 0, b: 1 },
    { n: { en: 'About the y-axis: x = y², 0 to 2', bm: 'Paksi-y: x = y², 0 hingga 2' }, ax: 'y', f: 'y^2', g: '', a: 0, b: 2 },
    { n: { en: 'Washer about the y-axis: x = 1 and x = y²', bm: 'Gelang paksi-y: x = 1 dan x = y²' }, ax: 'y', f: '1', g: 'y^2', a: -1, b: 1 },
    { n: { en: 'Exponential: y = eˣ, 0 to 1', bm: 'Eksponen: y = eˣ, 0 hingga 1' }, ax: 'x', f: 'e^x', g: '', a: 0, b: 1 },
    { n: { en: 'Logarithm: y = ln x, 1 to 3', bm: 'Logaritma: y = ln x, 1 hingga 3' }, ax: 'x', f: 'ln(x)', g: '', a: 1, b: 3 }
  ];

  const KEYS = ['x', 'x²', 'x³', '√(', 'eˣ', 'ln(', 'π', '(', ')', '+', '−', '×', '÷'];
  const POWERS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '⁻', 'ˣ'];

  let viewer = null, canvas2 = null, state = null, lastInput = null;

  const wVar = ax => (ax === 'x' ? 'y' : 'x');

  // Reader's form for the input boxes: 2*x shows as 2x, powers as superscripts, * as ×.
  const display = s => E.pretty(String(s || '').replace(/(\d)\*(?=[a-z(])/g, '$1').replace(/\*/g, '×'));

  function readRaw() {
    return E.buildSpec({
      ax: $('sim-axis').value,
      f: $('sim-f').value.trim(),
      g: $('sim-g').value.trim(),
      a: parseFloat($('sim-a').value),
      b: parseFloat($('sim-b').value)
    });
  }

  function sliceT() {
    return state.a + (state.b - state.a) * Number($('sim-sl').value) / 100;
  }

  function labels() {
    const w = wVar($('sim-axis').value);
    $('sim-fl').textContent = T('sim.curve', { w });
    $('sim-gl').textContent = T('sim.inner', { w });
    $('sim-g').placeholder = T('sim.inner.ph');
    updatePreview();
  }

  function updatePreview() {
    const w = wVar($('sim-axis').value);
    const f = E.pretty($('sim-f').value);
    const g = $('sim-g').value.trim();
    $('sim-preview').textContent = `${w} = ${f}` + (g ? `   ${T('sim.and') || 'and'}   ${w} = ${E.pretty(g)}` : '');
  }

  function fillPresets() {
    const sel = $('sim-pre'), keep = sel.value;
    sel.replaceChildren(
      h('option', { value: '' }, T('sim.choose')),
      ...PRESETS.map((p, i) => h('option', { value: String(i) }, I.pick(p.n)))
    );
    sel.value = keep;
  }

  function loadPreset(p) {
    $('sim-axis').value = p.ax;
    $('sim-f').value = display(p.f);
    $('sim-g').value = p.g ? display(p.g) : '';
    $('sim-a').value = p.a;
    $('sim-b').value = p.b;
    labels();
    update();
  }

  function insertKey(text) {
    const el = lastInput || $('sim-f');
    const s = el.selectionStart ?? el.value.length;
    const e = el.selectionEnd ?? s;
    el.value = el.value.slice(0, s) + text + el.value.slice(e);
    el.focus();
    el.setSelectionRange(s + text.length, s + text.length);
    $('sim-pre').value = '';
    labels();
    update();
  }

  function renderKeys() {
    const box = $('sim-keys');
    box.replaceChildren(
      ...KEYS.map(k => h('button', { type: 'button', class: 'key', onclick: () => insertKey(k) }, k)),
      h('span', { class: 'mut wide' }, T('sim.powers')),
      ...POWERS.map(k => h('button', { type: 'button', class: 'key', onclick: () => insertKey(k) }, k))
    );
  }

  function update() {
    const r = readRaw();
    const msg = $('sim-msg');
    if (r.err) {
      msg.textContent = T('sim.err.' + r.err);
      $('sim-result').replaceChildren();
      state = null;
      viewer.set(null);
      return;
    }
    msg.textContent = '';
    state = r.spec;
    light();
    result();
  }

  // Fast path for sliders: redraw the 3D solid and the 2D region without recomputing the working.
  function light() {
    if (!state) return;
    $('sim-ro').textContent = $('sim-rot').value + '°';
    $('sim-so').textContent = $('sim-sl').value + '%';
    $('sim-st').textContent = state.hasG ? T('sim.washer') : T('sim.disk');
    viewer.set(state, {
      rot: Number($('sim-rot').value),
      slice: Number($('sim-sl').value) / 100,
      showSlice: $('sim-ss').checked
    });
    drawRegion();
    sliceInfo();
  }

  function drawRegion() {
    RV.viewer.drawRegion(canvas2, state, { slice: $('sim-ss').checked ? Number($('sim-sl').value) / 100 : null });
  }

  function sliceInfo() {
    const t0 = sliceT();
    const R = Math.abs(state.fn(t0)), r = Math.abs(state.gn(t0));
    $('sim-si').textContent = T('sim.sliceInfo', {
      v: state.v,
      t: t0.toFixed(2),
      R: R.toFixed(2),
      r: r.toFixed(2),
      A: (Math.PI * (R * R - r * r)).toFixed(2)
    });
  }

  function result() {
    const s = state;
    const val = Math.PI * E.coefficient(s);
    const box = $('sim-result');
    const parts = [
      h('h2', {}, T('sim.volume')),
      h('p', { class: 'big' }, `≈ ${isFinite(val) ? val.toFixed(3) : '?'} ${T('unit')}`)
    ];
    if (E.innerExceedsOuter(s)) parts.push(h('p', { class: 'warn' }, T('sim.warn.inner')));

    const w = E.working(s, T);
    if (w) {
      parts.push(h('div', { class: 'working', html: E.workingHTML(w) }));
      const ok = Math.abs(val - w.C * Math.PI) < 1e-3 * (1 + Math.abs(val));
      parts.push(h('p', { class: 'mut' },
        `${T('sim.numeric')}: ${val.toFixed(3)} `,
        h('span', { class: ok ? 'ok' : 'warn' }, ok ? T('sim.match') : T('sim.differs'))));
    } else {
      parts.push(h('p', { class: 'mut' }, T('sim.noWorking')));
    }
    box.replaceChildren(...parts);
  }

  function init() {
    viewer = new RV.Viewer($('sim-3d'));
    canvas2 = $('sim-2d');

    fillPresets();
    renderKeys();
    loadPreset(PRESETS[0]);

    $('sim-pre').addEventListener('change', e => {
      if (e.target.value !== '') loadPreset(PRESETS[Number(e.target.value)]);
    });
    ['sim-f', 'sim-g', 'sim-a', 'sim-b'].forEach(id => {
      const el = $(id);
      el.addEventListener('focus', () => { lastInput = el; });
      el.addEventListener('input', () => { $('sim-pre').value = ''; labels(); update(); });
      if (id === 'sim-f' || id === 'sim-g') {
        el.addEventListener('blur', () => { el.value = E.pretty(el.value); updatePreview(); });
      }
    });
    $('sim-axis').addEventListener('change', () => { $('sim-pre').value = ''; labels(); update(); });
    ['sim-rot', 'sim-sl', 'sim-ss'].forEach(id => $(id).addEventListener('input', light));
  }

  function show() {
    update();
    viewer.resize();
    if (state) drawRegion();
  }

  function render() {
    fillPresets();
    renderKeys();
    labels();
    update();
  }

  // Load a spec from elsewhere (for example the quiz "Open in simulator" button).
  function load(o) {
    $('sim-axis').value = o.ax;
    $('sim-f').value = display(o.f);
    $('sim-g').value = o.g ? display(o.g) : '';
    $('sim-a').value = o.a;
    $('sim-b').value = o.b;
    $('sim-pre').value = '';
    labels();
    update();
    location.hash = '#simulator';
  }

  function refresh() {
    if (!state || !canvas2) return;
    viewer.resize();
    drawRegion();
  }

  RV.simulator = { init, show, render, load, refresh };
})(window.RV = window.RV || {});
