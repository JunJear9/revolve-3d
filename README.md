# Revolve-3D (v2)

An interactive teaching aid for volumes of revolution (Matriculation Mathematics), built for the i-Math Innovation Competition 2026. It helps students choose the setup of a volume integral: the axis, the disk or washer method, which curve is outer, the limits and the integrand. Then it shows the solid in 3D.

Working title: **Revolve-3D**. English and Bahasa Melayu (BM) are both included.

## Open it

1. Unzip the folder, keep all sub-folders together.
2. Double-click `index.html`. It runs offline in any modern browser, on a phone or a computer.
3. Keep the `vendor/` folder next to `index.html`. It holds the 3D library (three.js) and the maths library (math.js), so no internet connection is needed.

## What is inside

| Page | What it does |
|---|---|
| **Home** | Explains the problem and how to use the site in class. |
| **Formulas** | A volume guide (disk or washer, dx or dy, which radius is R) and 12 integration formulas. Each formula has a slider and a live check: the slope of the answer must equal the original function. |
| **Practice** | Six checked steps: variable, method, outer radius, limits, integrand, volume. The next step opens only when the current one is correct. Hints appear after a wrong answer, and the answer can be shown after two misses. The 3D solid appears when the problem is solved, with the full working. |
| **Simulator** | Enter any curve (or two), choose the axis and the limits. Drag the solid to turn it, move the slice, and read the working step by step. A numerical check (Simpson's rule) confirms the answer. |
| **Quiz** | Three parts of five questions each: formulas, choose the setup, and volumes. Only a first-try correct answer scores. |

The language switch (EN / BM) is at the top right. The choice is remembered on the device.

## Using it in class

1. Open the **Simulator**, pick a preset and rotate the solid (about 5 minutes).
2. Students work through **Practice**, one problem at a time.
3. Use the **Formulas** volume guide to explain which method to choose and why.
4. Finish with the **Quiz**. Part 2 tests the setup, not only the final number.

## Changes from v1

- The Laws tab is removed. Formulas, Volumes (now Practice and Simulator) and the Quiz remain.
- New **Practice** mode, "choose the setup", built around the lecturer's feedback that students struggle with the setup, not only with the calculation.
- English / Bahasa Melayu switch.
- The volume guide (disk or washer, dx or dy, which radius is R) is on the Formulas page.
- Corrected washer preset: y = 4 and y = x² now run from −2 to 2 (they meet at x = ±2). The v1 range from 0 to 2 covered only half the region.
- Added a y-axis washer preset (x = 1 and x = y²).

## Files

```
index.html          the page (all sections)
css/style.css       layout, colours, light and dark themes, print styles
js/core.js          all English and BM text, language switch, DOM helper
js/engine.js        volume engine: polynomial fit, exact working, numerical check
js/problems.js      the shared problem list used by Practice and the Quiz
js/viewer.js        2D region plot and 3D solid (three.js)
js/simulator.js     Simulator page
js/practice.js      Practice page (six checked steps)
js/quiz.js          Quiz page (three parts)
js/formulas.js      Formulas page (volume guide and formula cards)
js/app.js           routing, language switch, start-up checks
vendor/             three.js r128 and math.js 12.4.1 (licences included)
```

## Limits

- The step-by-step working covers polynomials up to degree 4, a single c·eᵏˣ term and a single c·ln x term. Other functions show the numerical volume only, and the site says so.
- The 3D view needs WebGL. Without it, the 2D views still work and a notice appears.

## Maintaining it

- **Text:** every sentence is in `js/core.js`, in two blocks (`en` and `bm`). Add a key to both.
- **Problems:** the practice problems are in `PROBLEMS` in `js/problems.js`. Each one needs `ax` (the axis variable), `f`, `g` (empty for a disk), `a` and `b`.
- **Libraries:** if you replace the files in `vendor/`, keep the same names and versions. The site was tested with three.js r128 and math.js 12.4.1.

## Credits and licences

- Three.js (MIT). Licence: `vendor/LICENSE-three.txt`
- math.js 12.4.1 (Apache-2.0). Licence: `vendor/LICENSE-mathjs.txt`
- Team: [group member names to be added]
