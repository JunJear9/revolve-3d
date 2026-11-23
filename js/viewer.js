/* Revolve-3D · viewers: 2D region plot and 3D solid of revolution. */
(function (RV) {
  'use strict';

  const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  // Draws the region between the curves (or the curve and the axis) in 2D.
  function drawRegion(canvas, s, opt) {
    if (!canvas || !s) return;
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (!W || !H) return;
    const o = opt || {};
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const x = canvas.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);

    const N = 80;
    const ts = Array.from({ length: N + 1 }, (_, i) => s.a + (s.b - s.a) * i / N);
    const P = (t, v) => (s.ax === 'x' ? [t, v] : [v, t]);
    const F = ts.map(t => P(t, s.fn(t)));
    const G = ts.map(t => P(t, s.gn(t)));
    const all = [...F, ...G, [0, 0]];
    let x0 = Math.min(...all.map(p => p[0])), x1 = Math.max(...all.map(p => p[0]));
    let y0 = Math.min(...all.map(p => p[1])), y1 = Math.max(...all.map(p => p[1]));
    const pad = 0.12 * Math.max(x1 - x0, y1 - y0, 1);
    x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
    const k = Math.min(W / (x1 - x0), H / (y1 - y0));
    const ox = (W - k * (x1 - x0)) / 2 - k * x0;
    const oy = (H - k * (y1 - y0)) / 2 + k * y1;
    const X = p => ox + k * p[0];
    const Y = p => oy - k * p[1];

    const line = (p, q, color, w, dash) => {
      x.beginPath();
      x.setLineDash(dash || []);
      x.strokeStyle = color;
      x.lineWidth = w;
      x.moveTo(X(p), Y(p));
      x.lineTo(X(q), Y(q));
      x.stroke();
      x.setLineDash([]);
    };
    const path = pts => {
      x.beginPath();
      pts.forEach((p, i) => (i ? x.lineTo(X(p), Y(p)) : x.moveTo(X(p), Y(p))));
    };

    // Axes: the rotation axis is drawn red and dashed.
    const isX = s.ax === 'x';
    line([x0, 0], [x1, 0], isX ? cssVar('--rd') : cssVar('--bd'), isX ? 2 : 1, isX ? [6, 4] : null);
    line([0, y0], [0, y1], isX ? cssVar('--bd') : cssVar('--rd'), isX ? 1 : 2, isX ? null : [6, 4]);

    // Filled region: along the first curve, back along the second (or the axis).
    path(F);
    [...G].reverse().forEach(p => x.lineTo(X(p), Y(p)));
    x.closePath();
    x.fillStyle = 'rgba(102,120,106,.28)';
    x.fill();

    const stroke = (pts, color) => {
      path(pts);
      x.strokeStyle = color;
      x.lineWidth = 2.5;
      x.stroke();
    };
    stroke(F, cssVar('--ac'));
    if (s.hasG) stroke(G, cssVar('--vi'));

    if (o.slice !== undefined && o.slice !== null) {
      const t0 = s.a + (s.b - s.a) * o.slice;
      line(P(t0, s.gn(t0)), P(t0, s.fn(t0)), '#c99a5b', 4);
    }

    // Label the outer (R) and inner (r) boundaries at the midpoint.
    const mid = (s.a + s.b) / 2;
    const pf = P(mid, s.fn(mid));
    x.fillStyle = cssVar('--fg');
    x.font = '600 13px system-ui, sans-serif';
    x.fillText(Math.abs(s.fn(mid)) >= Math.abs(s.gn(mid)) || !s.hasG ? 'R' : 'r', X(pf) + 6, Y(pf) - 6);
    if (s.hasG) {
      const pg = P(mid, s.gn(mid));
      x.fillText(Math.abs(s.fn(mid)) >= Math.abs(s.gn(mid)) ? 'r' : 'R', X(pg) + 6, Y(pg) + 14);
    }

    x.fillStyle = cssVar('--mut');
    x.font = '12px system-ui, sans-serif';
    x.fillText('x', W - 14, Y([0, 0]) - 6);
    x.fillText('y', X([0, 0]) + 6, 12);
  }

  // 3D solid of revolution built with three.js (lathe geometry).
  class Viewer {
    constructor(canvas) {
      this.canvas = canvas;
      this.spec = null;
      this.opt = { rot: 360, slice: 0.5, showSlice: true };
      this.renderer = null;

      this.scene = new THREE.Scene();
      this.cam = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
      this.world = new THREE.Group();
      this.pivot = new THREE.Group();
      this.world.add(this.pivot);
      this.scene.add(this.world);
      this.world.rotation.set(0.5, -0.6, 0);
      this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      const light = new THREE.DirectionalLight(0xffffff, 0.8);
      light.position.set(3, 5, 6);
      this.scene.add(light);

      try {
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      } catch (e) {
        this.renderer = null;
      }

      let drag = null;
      canvas.addEventListener('pointerdown', e => {
        drag = [e.clientX, e.clientY];
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener('pointermove', e => {
        if (!drag) return;
        this.world.rotation.y += (e.clientX - drag[0]) * 0.01;
        this.world.rotation.x = Math.max(-1.5, Math.min(1.5, this.world.rotation.x + (e.clientY - drag[1]) * 0.01));
        drag = [e.clientX, e.clientY];
        this.render();
      });
      ['pointerup', 'pointercancel'].forEach(n => canvas.addEventListener(n, () => { drag = null; }));
    }

    get available() {
      return !!this.renderer;
    }

    // Set the solid and its options in one rebuild.
    set(spec, opts) {
      if (opts) Object.assign(this.opt, opts);
      this.spec = spec;
      this.build();
    }

    resize() {
      if (!this.renderer) return;
      const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
      if (!w || !h) return;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(w, h, false);
      this.cam.aspect = w / h;
      this.cam.updateProjectionMatrix();
      this.render();
    }

    render() {
      if (this.renderer && this.spec) this.renderer.render(this.scene, this.cam);
    }

    build() {
      this.pivot.children.slice().forEach(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
        this.pivot.remove(o);
      });
      if (!this.renderer || !this.spec) {
        this.render();
        return;
      }
      const s = this.spec, N = 48, mid = (s.a + s.b) / 2;

      const ts = Array.from({ length: N + 1 }, (_, i) => s.a + (s.b - s.a) * i / N);
      const ro = ts.map(t => Math.abs(s.fn(t)));
      const ri = ts.map(t => Math.abs(s.gn(t)));
      const pts = ts.map((t, i) => new THREE.Vector2(ro[i], t - mid));
      for (let i = N; i >= 0; i--) pts.push(new THREE.Vector2(ri[i], ts[i] - mid));
      pts.push(pts[0].clone());

      const phi = Math.max(this.opt.rot * Math.PI / 180, 0.001);
      this.pivot.add(new THREE.Mesh(
        new THREE.LatheGeometry(pts, 64, 0, phi),
        new THREE.MeshPhongMaterial({ color: 0x66786a, side: THREE.DoubleSide, transparent: true, opacity: 0.8, shininess: 40 })
      ));

      const maxR = Math.max(...ro, ...ri, 0.1);
      const L = (s.b - s.a) / 2 + maxR * 0.3 + 0.5;

      if (this.opt.showSlice) {
        const t0 = s.a + (s.b - s.a) * this.opt.slice;
        const outer = Math.abs(s.fn(t0));
        let inner = Math.abs(s.gn(t0));
        if (outer - inner < 1e-4) inner = Math.max(outer - 1e-4, 0);
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(inner, Math.max(outer, 1e-3), 64),
          new THREE.MeshBasicMaterial({ color: 0xc99a5b, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = t0 - mid;
        this.pivot.add(ring);
      }

      this.pivot.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -L, 0), new THREE.Vector3(0, L, 0)]),
        new THREE.LineBasicMaterial({ color: 0xb5655b })
      ));

      this.pivot.rotation.z = s.ax === 'x' ? -Math.PI / 2 : 0;
      const ext = Math.max(s.b - s.a, 2 * maxR);
      this.cam.position.set(0, 0, ext * 1.9 + 1);
      this.cam.lookAt(0, 0, 0);
      this.resize();
    }
  }

  RV.viewer = { drawRegion };
  RV.Viewer = Viewer;
})(window.RV = window.RV || {});
