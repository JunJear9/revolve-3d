/* Revolve-3D · Practice tab: choose the setup in six checked steps. */
(function (RV) {
  'use strict';

  const E = RV.engine, P = RV.problems, I = RV.i18n, T = (k, v) => I.t(k, v), h = RV.dom.h;
  const $ = id => document.getElementById(id);

  let cur = null;          // current problem state
  let count = 0;           // problems started this session
  let last = -1;           // index of the previous problem (avoid immediate repeats)
  let viewer3 = null, canvas2 = null;

  function newProblem() {
    const n = P.PROBLEMS.length;
    let i;
    do { i = Math.floor(Math.random() * n); } while (n > 1 && i === last);
    last = i;
    count++;
    const p = P.make(P.PROBLEMS[i]);
    const keys = {};
    ['var', 'method', 'outer', 'integrand'].forEach(s => { keys[s] = P.order(p, s); });
    cur = { p, step: 0, wrong: 0, sel: null, vals: {}, done: [], solved: false, msg: null, keys };
    render();
  }

  function explain(p, step) {
    switch (step) {
      case 'var': return T('pr.step.var.exp', { v: p.ax });
      case 'method': return T('pr.step.method.exp');
      case 'outer': return T('pr.step.outer.exp', { R: P.rOf(p), r: P.rInner(p) });
      case 'limits': return T('pr.step.limits.exp', { a: P.num(p.a), b: P.num(p.b) });
      case 'integrand': return T(p.hasG ? 'pr.step.integrand.exp.washer' : 'pr.step.integrand.exp.disk', { v: p.ax, ans: P.answerText(p, 'integrand') });
      case 'volume': return T('pr.step.volume.exp', { V: E.piStr(p.coef), approx: (p.coef * Math.PI).toFixed(3), unit: T('unit') });
      default: return '';
    }
  }

  function check() {
    const p = cur.p, step = P.STEPS[cur.step];
    let ok = false;

    if (step === 'limits') {
      const a = E.parseAnswer(cur.vals.from), b = E.parseAnswer(cur.vals.to);
      if (a === null || b === null) return say('warn', ['pr.badNumber']);
      ok = Math.abs(Math.min(a, b) - p.a) < 1e-9 && Math.abs(Math.max(a, b) - p.b) < 1e-9;
    } else if (step === 'volume') {
      const ans = E.parseAnswer(cur.vals.volume);
      if (ans === null) return say('warn', ['pr.badNumber']);
      ok = Math.abs(ans - p.coef) <= 0.005 * Math.max(1, Math.abs(p.coef));
      if (!ok && Math.abs(ans - p.coef * Math.PI) < 0.02) {
        cur.wrong++;
        return say('warn', ['pr.badPi']);
      }
    } else {
      if (!cur.sel) return say('warn', ['pr.pickOne']);
      ok = cur.sel === P.ANSWER[step](p);
    }

    if (ok) return pass(step);
    cur.wrong++;
    return say('warn', ['pr.wrong', `pr.step.${step}.hint`]);
  }

  function say(cls, keys) {
    cur.msg = { cls, keys };
    render();
    const fb = $('pr-fb');
    if (fb) fb.focus({ preventScroll: true });
  }

  function pass(step) {
    cur.done.push({ step, revealed: false });
    cur.step++;
    cur.wrong = 0;
    cur.sel = null;
    cur.vals = {};
    cur.msg = { cls: 'ok', keys: ['pr.correct'] };
    if (cur.step >= P.STEPS.length) cur.solved = true;
    render();
  }

  function reveal() {
    const p = cur.p, step = P.STEPS[cur.step];
    cur.done.push({ step, revealed: true });
    cur.step++;
    cur.wrong = 0;
    cur.sel = null;
    cur.vals = {};
    cur.msg = { cls: 'hint', keys: ['pr.answerIs'], vars: { ans: P.answerText(p, step) } };
    if (cur.step >= P.STEPS.length) cur.solved = true;
    render();
  }

  function feedbackNode() {
    if (!cur.msg) return null;
    const lines = cur.msg.keys.map((k, i) => {
      const text = k.startsWith('pr.step.') ? T('pr.hint', { hint: T(k) }) : (k === 'pr.answerIs' ? T(k, cur.msg.vars) : T(k));
      return h('p', { class: i === 0 ? 'fb-main' : 'fb-hint' }, text);
    });
    return h('div', { class: `feedback ${cur.msg.cls}`, id: 'pr-fb', tabindex: '-1', role: 'status', 'aria-live': 'polite' }, lines);
  }

  function choiceInputs(p, step) {
    const name = `pr-${step}`;
    const opts = P.optionsIn(p, step, cur.keys[step]);
    return h('div', { class: 'choices' },
      opts.map(o => h('label', { class: 'choice' },
        h('input', {
          type: 'radio', name, value: o.k, checked: cur.sel === o.k,
          onchange: () => { cur.sel = o.k; }
        }),
        h('span', {}, o.label))));
  }

  function limitInputs() {
    return h('div', { class: 'limits' },
      h('label', {}, h('span', {}, T('pr.limit.from')),
        h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', value: cur.vals.from || '',
          oninput: e => { cur.vals.from = e.target.value; } })),
      h('label', {}, h('span', {}, T('pr.limit.to')),
        h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', value: cur.vals.to || '',
          oninput: e => { cur.vals.to = e.target.value; } })));
  }

  function volumeInput() {
    return h('label', { class: 'volume' }, h('span', {}, T('quiz.vol.answer')),
      h('input', { type: 'text', autocomplete: 'off', spellcheck: 'false', placeholder: '2/15', value: cur.vals.volume || '',
        oninput: e => { cur.vals.volume = e.target.value; } }),
      h('span', { class: 'mut' }, 'π'));
  }

  function currentCard(step) {
    const p = cur.p;
    let body;
    if (step === 'limits') body = h('div', {}, h('p', { class: 'q' }, T('pr.step.limits.q')), limitInputs());
    else if (step === 'volume') body = h('div', {}, h('p', { class: 'q' }, T('pr.step.volume.q')), volumeInput());
    else body = h('fieldset', { class: 'choice-set' },
      h('legend', { class: 'q' }, T(`pr.step.${step}.q`, { v: p.ax })), choiceInputs(p, step));

    return h('div', { class: 'card-step' },
      h('h3', {}, T(`pr.step.${step}.title`)),
      body,
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn', type: 'button', onclick: check }, T('pr.check')),
        cur.wrong >= 2 ? h('button', { class: 'btn alt', type: 'button', onclick: reveal }, T('pr.showAnswer')) : null),
      feedbackNode());
  }

  function stepItem(i) {
    const step = P.STEPS[i];
    const title = T(`pr.step.${step}.title`);
    const dot = (txt, cls) => h('span', { class: `dot ${cls || ''}`, 'aria-hidden': 'true' }, txt);

    if (i < cur.step) {
      const d = cur.done[i];
      return h('li', { class: 'step done' }, dot('✓'),
        h('div', { class: 'grow' },
          h('strong', {}, title),
          h('span', { class: 'exp' }, (d.revealed ? T('pr.revealed') + ' ' : '') + explain(cur.p, step))));
    }
    if (i === cur.step && !cur.solved) {
      return h('li', { class: 'step current' }, dot(String(i + 1), 'on'), h('div', { class: 'grow' }, currentCard(step)));
    }
    return h('li', { class: 'step locked' }, dot(String(i + 1)), h('div', { class: 'grow' }, h('strong', {}, title)));
  }

  function solvedPanel() {
    const p = cur.p;
    const w = E.working(p.spec, T);
    const kids = [h('p', { class: 'ok solved' }, T('pr.solved'))];
    if (w) kids.push(h('div', { class: 'working', html: E.workingHTML(w) }));
    else kids.push(h('p', { class: 'mut' }, T('pr.noWork')));
    kids.push(h('p', { class: 'mut' }, T('pr.numeric', { v: (p.coef * Math.PI).toFixed(3), unit: T('unit') })));
    kids.push(h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'button', onclick: newProblem }, T('pr.nextProblem'))));
    return h('div', { class: 'solved-panel' }, kids);
  }

  function drawRegion() {
    if (cur) RV.viewer.drawRegion(canvas2, cur.p.spec, {});
  }

  function render() {
    const main = $('pr-main');
    if (!cur) {
      main.replaceChildren(h('p', { class: 'mut' }, T('pr.start')));
      return;
    }
    const p = cur.p;
    main.replaceChildren(
      h('p', { class: 'eyebrow' }, T('pr.problem', { n: count })),
      h('p', { class: 'statement' }, P.statement(p)),
      h('ol', { class: 'steps' }, P.STEPS.map((s, i) => stepItem(i))),
      ...(cur.solved ? [solvedPanel()] : [])
    );

    const wrap = $('pr-3d-wrap');
    wrap.hidden = !cur.solved;
    $('pr-3d-hint').hidden = cur.solved;
    if (cur.solved && viewer3) {
      viewer3.set(p.spec, { rot: 360, showSlice: false });
      viewer3.resize();
    }
    drawRegion();
  }

  function init() {
    canvas2 = $('pr-2d');
    viewer3 = new RV.Viewer($('pr-3d'));
    $('pr-new').addEventListener('click', newProblem);
    newProblem();
  }

  function show() {
    render();
    if (cur && cur.solved && viewer3) viewer3.resize();
  }

  function refresh() {
    drawRegion();
    if (cur && cur.solved && viewer3) viewer3.resize();
  }

  RV.practice = { init, show, render, refresh };
})(window.RV = window.RV || {});
