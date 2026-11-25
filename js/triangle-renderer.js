/**
 * TriangleRenderer
 * Eigenständiger SVG-Renderer für Dreiecke mit CSS-Variablen (Dark Mode),
 * MathJax-4-Unterstützung (STIX-2) und gezielten Hervorhebungen.
 *
 * Wird im Browser über window.MTGTriangleRenderer bereitgestellt.
 */
(function (root, factory) {
    const exported = factory(root.MTGTriangleSolver);
    root.MTGTriangleRenderer = exported;
}(typeof window !== 'undefined' ? window : this, function (Solver) {

    const RAD_TO_DEG = 180 / Math.PI;
    const DEFAULT_VIEWBOX = { width: 640, height: 460, margin: 78 };
    const STYLE_ID = 'mtg-triangle-renderer-styles';

    const SIDE_KEYS = ['c', 'a', 'b'];     // Passend zu Ecken A (0), B (1), C (2) gegen den Uhrzeigersinn
    const ANGLE_KEYS = ['al', 'be', 'ga'];

    const TEX_LABELS = {
        a: 'a',
        b: 'b',
        c: 'c',
        al: '\\alpha',
        alpha: '\\alpha',
        be: '\\beta',
        beta: '\\beta',
        ga: '\\gamma',
        gamma: '\\gamma',
        ha: 'h_a',
        hb: 'h_b',
        hc: 'h_c'
    };

    const PLAIN_LABELS = {
        a: 'a',
        b: 'b',
        c: 'c',
        al: 'α',
        alpha: 'α',
        be: 'β',
        beta: 'β',
        ga: 'γ',
        gamma: 'γ',
        ha: 'ha',
        hb: 'hb',
        hc: 'hc'
    };

    const DEFAULT_OPTIONS = {
        viewBox: DEFAULT_VIEWBOX,
        unit: 'cm',
        decimals: 2,
        given: [],
        useMathJax: true,
        show: {
            sides: true,
            angles: true,
            values: true,
            calculatedValues: true,
            unknownLabels: true,
            vertices: true
        },
        heights: {
            a: false,
            b: false,
            c: false,
            flip: { a: false, b: false, c: false }
        },
        highlightMode: 'role', // 'role' | 'custom' | 'none'
        highlights: {},        // z. B. { al: { color: '#d97706', mark: 'ring', emphasis: true }, hc: '#0e7490' }
        palette: {
            given: 'var(--mtg-given, #1a7f37)',
            calculated: 'var(--acc, #1f5fbf)',
            neutral: 'var(--txt, #1d2433)',
            stroke: 'var(--txt, #1d2433)',
            fill: 'var(--fill, #e8f0fc)'
        },
        angles: {
            radius: 30,
            pos: [0.5, 0.5, 0.5],
            dist: [null, null, null]
        },
        style: {
            fontSize: 15,
            strokeWidth: 1.3,
            sideGap: 6
        }
    };

    function ensureStyles() {
        if (typeof document === 'undefined' || !document.head) return;
        if (document.getElementById(STYLE_ID)) return;

        const styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        styleEl.textContent = `
:root {
  --bg: #f4f5f2;
  --surf: #fff;
  --txt: #1d2433;
  --mut: #667085;
  --line: #d9dde5;
  --acc: #1f5fbf;
  --fill: #e8f0fc;
  --err: #b42318;
  --mtg-given: #1a7f37;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #14171d;
    --surf: #1c2029;
    --txt: #e8eaf0;
    --mut: #9aa3b2;
    --line: #323846;
    --acc: #7fb0ff;
    --fill: #22304a;
    --err: #ff8a80;
    --mtg-given: #5fd38a;
  }
}
:root[data-theme="dark"] {
  --bg: #14171d;
  --surf: #1c2029;
  --txt: #e8eaf0;
  --mut: #9aa3b2;
  --line: #323846;
  --acc: #7fb0ff;
  --fill: #22304a;
  --err: #ff8a80;
  --mtg-given: #5fd38a;
}
.mtg-tri-svg {
  display: block;
  width: 100%;
  height: auto;
  color: var(--txt);
  font-family: "STIX Two Math", "STIX Two Text", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.mtg-tri-svg mjx-container {
  margin: 0 !important;
  display: inline-block !important;
}
.mtg-fo-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  line-height: 1.15;
  white-space: nowrap;
}
.mtg-fo-inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px 5px;
  border-radius: 6px;
}
.mtg-fo-inner.is-emph {
  font-weight: 700;
}
.mtg-fo-inner.is-underline {
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 2px;
}
.mtg-fo-inner.is-badge {
  background: color-mix(in srgb, currentColor 14%, var(--surf));
  border: 1.5px solid currentColor;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}
`;
        document.head.appendChild(styleEl);
    }

    function escapeXml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function fmt(val, dec = 2) {
        if (val == null || !isFinite(val)) return '';
        let n = Number(val);
        if (Math.abs(n) < 1e-11) n = 0;
        let s = n.toFixed(dec);
        if (s.includes('.')) {
            s = s.replace(/0+$/, '').replace(/\.$/, '');
        }
        return s.replace('.', ',');
    }

    function fmtTex(val, dec = 2) {
        return fmt(val, dec).replace(',', '{,}');
    }

    function normalizeKey(k) {
        if (!k) return null;
        const s = String(k).trim().toLowerCase();
        if (['al', 'alpha', 'α'].includes(s)) return 'al';
        if (['be', 'beta', 'β'].includes(s)) return 'be';
        if (['ga', 'gamma', 'γ'].includes(s)) return 'ga';
        if (['ha', 'h_a'].includes(s)) return 'ha';
        if (['hb', 'h_b'].includes(s)) return 'hb';
        if (['hc', 'h_c'].includes(s)) return 'hc';
        if (['a', 'b', 'c'].includes(s)) return s;
        return null;
    }

    function mergeOptions(options = {}) {
        const vb = { ...DEFAULT_VIEWBOX, ...(options.viewBox || {}) };
        const show = { ...DEFAULT_OPTIONS.show, ...(options.show || {}) };
        const heights = {
            ...DEFAULT_OPTIONS.heights,
            ...(options.heights || {}),
            flip: {
                ...DEFAULT_OPTIONS.heights.flip,
                ...((options.heights && options.heights.flip) || {})
            }
        };
        const palette = { ...DEFAULT_OPTIONS.palette, ...(options.palette || {}) };
        const angles = {
            ...DEFAULT_OPTIONS.angles,
            ...(options.angles || {}),
            pos: Array.isArray(options.angles?.pos) ? options.angles.pos : [...DEFAULT_OPTIONS.angles.pos],
            dist: Array.isArray(options.angles?.dist) ? options.angles.dist : [...DEFAULT_OPTIONS.angles.dist]
        };
        const style = { ...DEFAULT_OPTIONS.style, ...(options.style || {}) };

        let decimals = DEFAULT_OPTIONS.decimals;
        if (options.decimals != null) {
            const d = Number(options.decimals);
            if (Number.isInteger(d) && d >= 0 && d <= 10) decimals = d;
        }

        const given = Array.isArray(options.given)
            ? options.given.map(normalizeKey).filter(Boolean)
            : [];

        return {
            viewBox: vb,
            unit: options.unit != null ? String(options.unit).trim() : DEFAULT_OPTIONS.unit,
            decimals,
            given,
            useMathJax: options.useMathJax !== false,
            show,
            heights,
            highlightMode: options.highlightMode || DEFAULT_OPTIONS.highlightMode,
            highlights: options.highlights || {},
            palette,
            angles,
            style
        };
    }

    function normalizeData(data = {}) {
        const out = {};
        for (const [rawKey, rawVal] of Object.entries(data || {})) {
            if (rawVal == null || rawVal === '') continue;
            const key = normalizeKey(rawKey);
            if (!key) continue;
            const num = typeof rawVal === 'string'
                ? Number(rawVal.trim().replace(',', '.').replace(/(°|mm|cm|dm|km|m)$/i, '').trim())
                : Number(rawVal);
            if (isFinite(num) && num > 0) {
                out[key] = num;
            }
        }
        return out;
    }

    function fromSides(a, b, c) {
        const x = (b * b + c * c - a * a) / (2 * c);
        const y2 = b * b - x * x;
        if (y2 <= 1e-9) {
            throw new Error('Mit diesen Seitenlängen ist kein gültiges Dreieck möglich.');
        }
        return [
            [0, 0],
            [c, 0],
            [x, Math.sqrt(y2)]
        ];
    }

    function resolvePointsAndValues(rawData) {
        const d = normalizeData(rawData);

        if (d.a != null && d.b != null && d.c != null) {
            const pts = fromSides(d.a, d.b, d.c);
            const measured = measurePoints(pts);
            return { points: pts, values: { ...measured.values, ...d } };
        }

        if (Solver && typeof Solver.solve === 'function') {
            const solved = Solver.solve(d, { decimals: 8 });
            const v = solved.values;
            const pts = fromSides(v.a, v.b, v.c);
            const measured = measurePoints(pts);
            return { points: pts, values: { ...measured.values, ...v } };
        }

        throw new Error('Es werden entweder alle drei Seiten (a, b, c) oder der geladene MTGTriangleSolver benötigt.');
    }

    function measurePoints(p) {
        const values = {};
        const arcs = [];

        for (let i = 0; i < 3; i++) {
            const V = p[i];
            const N = p[(i + 1) % 3];
            const Pr = p[(i + 2) % 3];

            values[SIDE_KEYS[i]] = Math.hypot(N[0] - V[0], N[1] - V[1]);

            const a1 = Math.atan2(N[1] - V[1], N[0] - V[0]);
            const a2 = Math.atan2(Pr[1] - V[1], Pr[0] - V[0]);
            let it = (a2 - a1) % (2 * Math.PI);
            if (it < 0) it += 2 * Math.PI;

            values[ANGLE_KEYS[i]] = it * RAD_TO_DEG;
            arcs.push({ a1, it });
        }

        const area2 = Math.abs(
            (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) -
            (p[2][0] - p[0][0]) * (p[1][1] - p[0][1])
        );
        values.ha = area2 / values.a;
        values.hb = area2 / values.b;
        values.hc = area2 / values.c;
        values.area = area2 / 2;
        values.perimeter = values.a + values.b + values.c;

        return { values, arcs };
    }

    function getHighlightSpec(key, opts) {
        const customRaw = opts.highlights[key];
        const custom = typeof customRaw === 'string'
            ? { color: customRaw, stroke: customRaw }
            : (customRaw && typeof customRaw === 'object' ? customRaw : null);

        const isGiven = opts.given.includes(key);
        let roleColor = opts.palette.neutral;

        if (opts.highlightMode === 'role') {
            roleColor = isGiven ? opts.palette.given : opts.palette.calculated;
        }

        const color = (custom && custom.color) || roleColor;
        const stroke = (custom && custom.stroke) || (custom && custom.emphasis ? color : null);
        const fill = (custom && custom.fill) || null;
        const emphasis = Boolean(custom && custom.emphasis);
        const mark = (custom && custom.mark) || null; // 'ring' | 'underline' | 'badge'

        return { color, stroke, fill, emphasis, mark, isGiven };
    }

    function formatLabelContent(key, value, opts) {
        const texSym = TEX_LABELS[key] || key;
        const plainSym = PLAIN_LABELS[key] || key;
        const isAngle = ['al', 'be', 'ga'].includes(key);
        const isGiven = opts.given.includes(key);
        const showVal = opts.show.values && (isGiven || opts.show.calculatedValues);

        if (!opts.useMathJax) {
            if (!showVal || value == null || !isFinite(value)) return plainSym;
            const suffix = isAngle ? '°' : (opts.unit ? ` ${opts.unit}` : '');
            return `${plainSym} = ${fmt(value, opts.decimals)}${suffix}`;
        }

        if (!showVal || value == null || !isFinite(value)) {
            return `\\(${texSym}\\)`;
        }

        const valTex = fmtTex(value, opts.decimals);
        const unitTex = isAngle
            ? '^\\circ'
            : (opts.unit ? `\\,\\text{${escapeXml(opts.unit)}}` : '');

        return `\\(${texSym} = ${valTex}${unitTex}\\)`;
    }

    function renderMathJaxLabel(x, y, htmlContent, spec, opts, rot = 0) {
        const FS = Number(opts.style.fontSize) || 15;
        const boxW = Math.max(76, FS * 8.5);
        const boxH = Math.max(28, FS * 2.2);
        const left = x - boxW / 2;
        const top = y - boxH / 2;

        const classes = ['mtg-fo-inner'];
        if (spec.emphasis) classes.push('is-emph');
        if (spec.mark === 'underline') classes.push('is-underline');
        if (spec.mark === 'badge') classes.push('is-badge');

        const transformAttr = Math.abs(rot) > 0.05
            ? ` transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"`
            : '';

        const ringSvg = spec.mark === 'ring'
            ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(FS * 1.15).toFixed(1)}" ` +
              `style="fill:none;stroke:${escapeXml(spec.color)};stroke-width:${Math.max(1.5, Number(opts.style.strokeWidth) * 1.2).toFixed(2)};stroke-dasharray:4 2"${transformAttr}/>`
            : '';

        return `${ringSvg}<foreignObject x="${left.toFixed(1)}" y="${top.toFixed(1)}" width="${boxW.toFixed(1)}" height="${boxH.toFixed(1)}" ` +
            `style="overflow:visible"${transformAttr}>` +
            `<div xmlns="http://www.w3.org/1999/xhtml" class="mtg-fo-wrap" style="font-size:${FS}px;color:${escapeXml(spec.color)}">` +
            `<div class="${classes.join(' ')}">${htmlContent}</div>` +
            `</div></foreignObject>`;
    }

    function renderRightMark(F, V, W, r, dr, strokeColor, sw) {
        const tu = Math.atan2(V[1] - F[1], V[0] - F[0]);
        const tf = Math.atan2(W[1] - F[1], W[0] - F[0]);
        let dl = tf - tu;
        while (dl > Math.PI) dl -= 2 * Math.PI;
        while (dl <= -Math.PI) dl += 2 * Math.PI;

        let d = '';
        for (let j = 0; j <= 12; j++) {
            const a = tu + (dl * j) / 12;
            d += `${j ? 'L' : 'M'}${(F[0] + r * Math.cos(a)).toFixed(1)},${(F[1] + r * Math.sin(a)).toFixed(1)}`;
        }
        const dotX = (F[0] + dr * Math.cos(tu + dl / 2)).toFixed(1);
        const dotY = (F[1] + dr * Math.sin(tu + dl / 2)).toFixed(1);
        const arcStyle = `fill:none;stroke:${strokeColor};stroke-width:${(sw * 0.6).toFixed(2)}`;
        return `<path d="${d}" style="${arcStyle}"/><circle cx="${dotX}" cy="${dotY}" r="2.2" fill="${strokeColor}"/>`;
    }

    function renderToSVGString(data, options = {}) {
        ensureStyles();
        const opts = mergeOptions(options);
        const { points, values } = resolvePointsAndValues(data);
        const { arcs } = measurePoints(points);

        const { width: W, height: H, margin: M } = opts.viewBox;
        const FS = Number(opts.style.fontSize) || 15;
        const SW = Number(opts.style.strokeWidth) || 1.3;
        const SG = Number(opts.style.sideGap) || 6;
        const AR = Number(opts.angles.radius) || 30;

        const xs = points.map(q => q[0]);
        const ys = points.map(q => q[1]);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const spanW = Math.max(1e-6, Math.max(...xs) - minX);
        const spanH = Math.max(1e-6, Math.max(...ys) - minY);

        const scale = Math.min((W - 2 * M) / spanW, (H - 2 * M) / spanH);
        const ox = (W - spanW * scale) / 2;
        const oy = (H - spanH * scale) / 2;

        const S = points.map(q => [
            ox + (q[0] - minX) * scale,
            H - (oy + (q[1] - minY) * scale)
        ]);

        const polyFill = opts.highlights.triangle?.fill || opts.palette.fill;
        const polyStroke = opts.highlights.triangle?.stroke || opts.palette.stroke;
        const polySw = opts.highlights.triangle?.emphasis ? SW * 1.6 : SW;

        let out = `<polygon points="${S.map(q => `${q[0].toFixed(2)},${q[1].toFixed(2)}`).join(' ')}" ` +
            `style="fill:${escapeXml(polyFill)};stroke:${escapeXml(polyStroke)};stroke-width:${polySw};stroke-linejoin:round"/>`;

        const vertexNames = ['A', 'B', 'C'];

        for (let i = 0; i < 3; i++) {
            const V = S[i];
            const N = S[(i + 1) % 3];
            const Pr = S[(i + 2) % 3];
            const { a1, it } = arcs[i];
            const midAng = a1 + it / 2;

            const un = [N[0] - V[0], N[1] - V[1]];
            const lu = Math.hypot(...un);
            const up = [Pr[0] - V[0], Pr[1] - V[1]];
            const lp = Math.hypot(...up);
            const r = Math.max(8, Math.min(AR, 0.45 * Math.min(lu, lp)));

            const ak = ANGLE_KEYS[i];
            const angSpec = getHighlightSpec(ak, opts);
            const angStrokeColor = opts.highlightMode === 'custom' && opts.highlights[ak]
                ? angSpec.color
                : opts.palette.stroke;
            const angArcSw = angSpec.emphasis ? SW * 1.3 : SW * 0.6;

            if (Math.abs(it * RAD_TO_DEG - 90) < 0.01) {
                out += `<circle cx="${(V[0] + 0.55 * r * Math.cos(midAng)).toFixed(1)}" ` +
                    `cy="${(V[1] - 0.55 * r * Math.sin(midAng)).toFixed(1)}" r="2" fill="${escapeXml(angStrokeColor)}"/>`;
            }

            if (opts.show.angles) {
                let d = '';
                for (let j = 0; j <= 24; j++) {
                    const t = a1 + (it * j) / 24;
                    d += `${j ? 'L' : 'M'}${(V[0] + r * Math.cos(t)).toFixed(1)},${(V[1] - r * Math.sin(t)).toFixed(1)}`;
                }
                out += `<path d="${d}" style="fill:none;stroke:${escapeXml(angStrokeColor)};stroke-width:${angArcSw.toFixed(2)}"/>`;
            }

            if (opts.show.vertices) {
                const vx = V[0] - 22 * Math.cos(midAng);
                const vy = V[1] + 22 * Math.sin(midAng);
                out += `<text x="${vx.toFixed(1)}" y="${vy.toFixed(1)}" ` +
                    `style="font-size:${FS + 4}px;font-weight:400;fill:${escapeXml(opts.palette.neutral)};text-anchor:middle;dominant-baseline:middle">${vertexNames[i]}</text>`;
            }

            const canShowAngleLabel = opts.show.angles && (angSpec.isGiven || opts.show.unknownLabels);
            if (canShowAngleLabel && Math.abs(it * RAD_TO_DEG - 90) >= 0.01) {
                const labelContent = formatLabelContent(ak, values[ak], opts);
                const posFactor = opts.angles.pos[i] ?? 0.5;
                const mp = a1 + posFactor * it;
                const tw = labelContent.length * 0.42 * FS + 8;
                const hh = FS * 0.65;
                const ux = Math.cos(mp);
                const uy = -Math.sin(mp);
                const need = r + 8;

                let lr = r;
                if (opts.angles.dist[i] != null) {
                    lr = Number(opts.angles.dist[i]);
                } else {
                    for (; lr < 400; lr += 0.5) {
                        if (Math.hypot(Math.max(Math.abs(lr * ux) - tw / 2, 0), Math.max(Math.abs(lr * uy) - hh, 0)) >= need) {
                            break;
                        }
                    }
                }

                const tx = V[0] + lr * ux;
                const ty = V[1] + lr * uy;
                out += renderMathJaxLabel(tx, ty, labelContent, angSpec, opts, 0);
            }

            // Seitenbeschriftung außen
            const sk = SIDE_KEYS[i];
            const sideSpec = getHighlightSpec(sk, opts);
            const canShowSideLabel = opts.show.sides && (sideSpec.isGiven || opts.show.unknownLabels);
            if (canShowSideLabel) {
                const labelContent = formatLabelContent(sk, values[sk], opts);
                const mx = (V[0] + N[0]) / 2;
                const my = (V[1] + N[1]) / 2;
                const ex = (N[0] - V[0]) / Math.max(1e-6, lu);
                const ey = (N[1] - V[1]) / Math.max(1e-6, lu);

                const mathDx = points[(i + 1) % 3][0] - points[i][0];
                const mathDy = points[(i + 1) % 3][1] - points[i][1];
                const ml = Math.max(1e-6, Math.hypot(mathDx, mathDy));

                let rot = Math.atan2(ey, ex) * RAD_TO_DEG;
                if (rot > 90) rot -= 180;
                else if (rot < -90) rot += 180;

                const off = SG + 12;
                const sx = mx + (mathDy / ml) * off;
                const sy = my + (mathDx / ml) * off;
                out += renderMathJaxLabel(sx, sy, labelContent, sideSpec, opts, rot);
            }
        }

        // Höhen h_a, h_b, h_c
        const cen = [
            (S[0][0] + S[1][0] + S[2][0]) / 3,
            (S[0][1] + S[1][1] + S[2][1]) / 3
        ];
        const hLetters = ['a', 'b', 'c'];

        for (let v = 0; v < 3; v++) {
            const hl = hLetters[v];
            if (!opts.heights[hl]) continue;

            const V = S[v];
            const P = S[(v + 1) % 3];
            const Q = S[(v + 2) % 3];
            const dx = Q[0] - P[0];
            const dy = Q[1] - P[1];
            const denom = dx * dx + dy * dy;
            if (denom < 1e-9) continue;

            const t = ((V[0] - P[0]) * dx + (V[1] - P[1]) * dy) / denom;
            const F = [P[0] + t * dx, P[1] + t * dy];
            const dP = Math.hypot(F[0] - P[0], F[1] - P[1]);
            const dQ = Math.hypot(F[0] - Q[0], F[1] - Q[1]);
            if (Math.min(dP, dQ) < 1.5) continue;

            const hk = 'h' + hl;
            const hSpec = getHighlightSpec(hk, opts);
            const lineColor = hSpec.stroke || opts.palette.stroke;
            const hlSw = hSpec.emphasis ? SW * 1.2 : SW * 0.6;
            const hlStyle = `fill:none;stroke:${escapeXml(lineColor)};stroke-width:${hlSw.toFixed(2)};stroke-dasharray:5 3`;

            out += `<line x1="${V[0].toFixed(1)}" y1="${V[1].toFixed(1)}" x2="${F[0].toFixed(1)}" y2="${F[1].toFixed(1)}" style="${hlStyle}"/>`;
            if (t < 0 || t > 1) {
                const E = t < 0 ? P : Q;
                out += `<line x1="${E[0].toFixed(1)}" y1="${E[1].toFixed(1)}" x2="${F[0].toFixed(1)}" y2="${F[1].toFixed(1)}" style="${hlStyle}"/>`;
            }

            out += renderRightMark(F, V, dP > dQ ? P : Q, 16, 9, escapeXml(lineColor), SW);

            const canShowHeightLabel = opts.show.sides && (hSpec.isGiven || opts.show.unknownLabels);
            if (canShowHeightLabel) {
                const mx2 = (V[0] + F[0]) / 2;
                const my2 = (V[1] + F[1]) / 2;
                const hx = F[0] - V[0];
                const hy = F[1] - V[1];
                const hq = Math.max(1e-6, Math.hypot(hx, hy));
                let nx = -hy / hq;
                let ny = hx / hq;

                const flipped = Boolean(opts.heights.flip && opts.heights.flip[hl]);
                const sgn = ((v === 2) !== flipped) ? -1 : 1;
                if (sgn * ((mx2 - cen[0]) * nx + (my2 - cen[1]) * ny) < 0) {
                    nx = -nx;
                    ny = -ny;
                }

                const labelContent = formatLabelContent(hk, values[hk], opts);
                const off = FS * 1.2 + 8;
                const tx = mx2 + nx * off;
                const ty = my2 + ny * off;
                out += renderMathJaxLabel(tx, ty, labelContent, hSpec, opts, 0);
            }
        }

        return `<svg class="mtg-tri-svg" viewBox="0 0 ${W} ${H}" width="100%" height="auto" role="img" aria-label="Gezeichnetes Dreieck" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
    }

    async function typesetIfAvailable(el, opts) {
        if (!opts.useMathJax || typeof window === 'undefined') return;
        for (let i = 0; i < 40; i++) {
            if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
                await window.MathJax.typesetPromise([el]).catch(() => {});
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 25));
        }
    }

    function render(target, data, options = {}) {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (!el) {
            throw new Error('Ziel-Element für MTGTriangleRenderer.render nicht gefunden.');
        }

        const opts = mergeOptions(options);
        const svgMarkup = renderToSVGString(data, opts);

        let resultEl;
        if (el.tagName && el.tagName.toLowerCase() === 'svg') {
            const temp = document.createElement('div');
            temp.innerHTML = svgMarkup;
            const parsedSvg = temp.firstElementChild;
            el.setAttribute('class', parsedSvg.getAttribute('class'));
            el.setAttribute('viewBox', parsedSvg.getAttribute('viewBox'));
            el.setAttribute('role', parsedSvg.getAttribute('role'));
            el.setAttribute('aria-label', parsedSvg.getAttribute('aria-label'));
            el.innerHTML = parsedSvg.innerHTML;
            resultEl = el;
        } else {
            el.innerHTML = svgMarkup;
            resultEl = el.firstElementChild;
        }

        typesetIfAvailable(resultEl, opts);
        return resultEl;
    }

    return {
        render,
        renderToSVGString,
        DEFAULT_OPTIONS
    };
}));