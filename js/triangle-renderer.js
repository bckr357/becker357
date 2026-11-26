/**
 * MTGTriangleRenderer – SVG-Darstellung eines Dreiecks aus dem Ergebnis des MTGTriangleSolver.
 *
 * Folgt dem gemeinsamen Format (siehe SOLVER-FORMAT.md, Abschnitt „Renderer“).
 *
 * Einstieg:
 *   zeichneDreieck(ziel, ergebnis, optionen)   → Promise<Element>; erfüllt, nachdem MathJax gesetzt hat
 *                                                (ohne MathJax erscheinen Klartext-Beschriftungen)
 *   zeichneDreieckAlsSvg(ergebnis, optionen)   → SVG-String (synchron, ohne DOM)
 *
 *   ergebnis  Ergebnis von MTGTriangleSolver.berechneDreieck (figur 'dreieck'); gelesen werden
 *             masse, gegeben und einheit. Der Renderer rechnet nichts selbst. Bei mehrdeutigen Dreiecken
 *             wird die gewünschte Lösung aus ergebnis.loesungen übergeben.
 *   optionen  { ansicht: { breite, hoehe, rand }, stellen, einheit: { laenge }, formelsatz,
 *               zeige: { seiten, winkel, werte, berechneteWerte, unbekannteBeschriftungen, ecken },
 *               hoehen: { a, b, c, spiegeln: { a, b, c } },
 *               hervorhebung: 'rolle' | 'eigen' | 'keine',
 *               hervorhebungen: { alpha: { farbe, linie, flaeche, marke, betont }, hc: '#0e7490', dreieck: { … } },
 *               farben: { gegeben, berechnet, neutral, linie, flaeche },
 *               winkel: { radius, position: [..3], abstand: [..3] },
 *               stil: { schriftgroesse, linienbreite, seitenabstand } }
 *   Unbekannte Optionen werfen einen Fehler. marke: 'ring' | 'unterstrich' | 'plakette'.
 *
 * Bereitgestellt über window.MTGTriangleRenderer bzw. globalThis.MTGTriangleRenderer und module.exports.
 */
(function (root, factory) {
    const exported = factory();
    root.MTGTriangleRenderer = exported;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exported;
    }
}(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function () {

    const RAD_TO_DEG = 180 / Math.PI;
    const STYLE_ID = 'mtg-triangle-renderer-styles';

    const SEITEN = ['c', 'a', 'b'];                 // Seite von Ecke A→B, B→C, C→A (gegen den Uhrzeigersinn)
    const WINKEL = ['alpha', 'beta', 'gamma'];      // Winkel an den Ecken A, B, C

    const BESCHRIFTUNG = {
        a: { tex: 'a', klar: 'a' },
        b: { tex: 'b', klar: 'b' },
        c: { tex: 'c', klar: 'c' },
        alpha: { tex: '\\alpha', klar: 'α' },
        beta: { tex: '\\beta', klar: 'β' },
        gamma: { tex: '\\gamma', klar: 'γ' },
        ha: { tex: 'h_a', klar: 'ha' },
        hb: { tex: 'h_b', klar: 'hb' },
        hc: { tex: 'h_c', klar: 'hc' }
    };

    const STANDARD_OPTIONEN = {
        ansicht: { breite: 640, hoehe: 460, rand: 78 },
        stellen: 2,
        formelsatz: true,
        zeige: {
            seiten: true,
            winkel: true,
            werte: true,
            berechneteWerte: true,
            unbekannteBeschriftungen: true,
            ecken: true
        },
        hoehen: {
            a: false,
            b: false,
            c: false,
            spiegeln: { a: false, b: false, c: false }
        },
        hervorhebung: 'rolle',
        hervorhebungen: {},
        // Seitenvariablen (--txt, --acc, --fill) haben Vorrang, sonst greifen die --mtg-Variablen mit Dark Mode
        farben: {
            gegeben: 'var(--mtg-gegeben)',
            berechnet: 'var(--acc, var(--mtg-berechnet))',
            neutral: 'var(--txt, var(--mtg-text))',
            linie: 'var(--txt, var(--mtg-text))',
            flaeche: 'var(--fill, var(--mtg-flaeche))'
        },
        winkel: {
            radius: 30,
            position: [0.5, 0.5, 0.5],
            abstand: [null, null, null]
        },
        stil: {
            schriftgroesse: 15,
            linienbreite: 1.3,
            seitenabstand: 6
        }
    };

    const ERLAUBTE_OPTIONEN = [
        'ansicht', 'stellen', 'einheit', 'formelsatz', 'zeige', 'hoehen',
        'hervorhebung', 'hervorhebungen', 'farben', 'winkel', 'stil'
    ];

    // Nur eigene, mit --mtg- benannte Variablen; :where() hat die Spezifität 0, die Seite kann sie also überschreiben.
    function sorgeFuerStile() {
        if (typeof document === 'undefined' || !document.head) return;
        if (document.getElementById(STYLE_ID)) return;

        const dunkel = `
  --mtg-text: #e8eaf0;
  --mtg-flaeche: #22304a;
  --mtg-gegeben: #5fd38a;
  --mtg-berechnet: #7fb0ff;
  --mtg-grund: #1c2029;`;

        const styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        styleEl.textContent = `
:where(:root) {
  --mtg-text: #1d2433;
  --mtg-flaeche: #e8f0fc;
  --mtg-gegeben: #1a7f37;
  --mtg-berechnet: #1f5fbf;
  --mtg-grund: #fff;
}
@media (prefers-color-scheme: dark) {
  :where(:root:not([data-theme="light"])) {${dunkel}
  }
}
:where(:root[data-theme="dark"]) {${dunkel}
}
.mtg-tri-svg {
  display: block;
  width: 100%;
  height: auto;
  color: var(--txt, var(--mtg-text));
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
  background: color-mix(in srgb, currentColor 14%, var(--surf, var(--mtg-grund)));
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

    // -------------------------------------------------------------------------
    // Optionen und Eingabe prüfen
    // -------------------------------------------------------------------------
    function fuehreOptionenZusammen(optionen = {}) {
        if (!optionen || typeof optionen !== 'object') {
            throw new Error('Die Optionen müssen als Objekt übergeben werden.');
        }
        for (const k of Object.keys(optionen)) {
            if (!ERLAUBTE_OPTIONEN.includes(k)) {
                throw new Error(`Unbekannte Option "${k}". Erlaubt sind: ${ERLAUBTE_OPTIONEN.join(', ')}.`);
            }
        }

        const D = STANDARD_OPTIONEN;

        let stellen = D.stellen;
        if (optionen.stellen != null) {
            stellen = Number(optionen.stellen);
            if (!Number.isInteger(stellen) || stellen < 0 || stellen > 10) {
                throw new Error('Die Genauigkeit (stellen) muss eine ganze Zahl zwischen 0 und 10 sein.');
            }
        }

        const hervorhebung = optionen.hervorhebung ?? D.hervorhebung;
        if (!['rolle', 'eigen', 'keine'].includes(hervorhebung)) {
            throw new Error('Die Hervorhebung muss "rolle", "eigen" oder "keine" sein.');
        }

        if (optionen.einheit != null && typeof optionen.einheit !== 'object') {
            throw new Error('Die Einheit muss als Objekt { laenge, flaeche, volumen } übergeben werden.');
        }

        const hoehen = {
            ...D.hoehen,
            ...(optionen.hoehen || {}),
            spiegeln: { ...D.hoehen.spiegeln, ...(optionen.hoehen?.spiegeln || {}) }
        };
        const winkel = {
            ...D.winkel,
            ...(optionen.winkel || {}),
            position: Array.isArray(optionen.winkel?.position) ? optionen.winkel.position : [...D.winkel.position],
            abstand: Array.isArray(optionen.winkel?.abstand) ? optionen.winkel.abstand : [...D.winkel.abstand]
        };

        return {
            ansicht: { ...D.ansicht, ...(optionen.ansicht || {}) },
            stellen,
            einheit: optionen.einheit || null,
            formelsatz: optionen.formelsatz !== false,
            zeige: { ...D.zeige, ...(optionen.zeige || {}) },
            hoehen,
            hervorhebung,
            hervorhebungen: optionen.hervorhebungen || {},
            farben: { ...D.farben, ...(optionen.farben || {}) },
            winkel,
            stil: { ...D.stil, ...(optionen.stil || {}) }
        };
    }

    function leseErgebnis(ergebnis, opts) {
        if (!ergebnis || typeof ergebnis !== 'object' || ergebnis.figur !== 'dreieck'
            || !ergebnis.masse || typeof ergebnis.masse !== 'object') {
            throw new Error('Erwartet wird das Ergebnis von MTGTriangleSolver.berechneDreieck (figur "dreieck").');
        }
        const werte = ergebnis.masse;
        for (const k of ['a', 'b', 'c']) {
            if (!(Number.isFinite(werte[k]) && werte[k] > 0)) {
                throw new Error(`Im Ergebnis fehlt die Seite "${k}" oder sie ist ungültig.`);
            }
        }
        return {
            werte,
            gegeben: Object.keys(ergebnis.gegeben ?? {}),
            einheit: opts.einheit?.laenge ?? ergebnis.einheit?.laenge ?? ''
        };
    }

    // -------------------------------------------------------------------------
    // Geometrie
    // -------------------------------------------------------------------------
    function punkteAusSeiten(a, b, c) {
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

    // Startwinkel und Öffnungswinkel (im Bogenmaß) des Innenwinkels an jeder Ecke
    function messeBoegen(p) {
        const boegen = [];
        for (let i = 0; i < 3; i++) {
            const V = p[i];
            const N = p[(i + 1) % 3];
            const Pr = p[(i + 2) % 3];
            const a1 = Math.atan2(N[1] - V[1], N[0] - V[0]);
            const a2 = Math.atan2(Pr[1] - V[1], Pr[0] - V[0]);
            let it = (a2 - a1) % (2 * Math.PI);
            if (it < 0) it += 2 * Math.PI;
            boegen.push({ a1, it });
        }
        return boegen;
    }

    // -------------------------------------------------------------------------
    // Hervorhebung und Beschriftung
    // -------------------------------------------------------------------------
    function holeHervorhebung(key, opts, ctx) {
        const roh = opts.hervorhebungen[key];
        const eigen = typeof roh === 'string'
            ? { farbe: roh, linie: roh }
            : (roh && typeof roh === 'object' ? roh : null);

        const istGegeben = ctx.gegeben.includes(key);
        let rollenfarbe = opts.farben.neutral;
        if (opts.hervorhebung === 'rolle') {
            rollenfarbe = istGegeben ? opts.farben.gegeben : opts.farben.berechnet;
        }

        const farbe = (eigen && eigen.farbe) || rollenfarbe;
        const linie = (eigen && eigen.linie) || (eigen && eigen.betont ? farbe : null);
        return {
            farbe,
            linie,
            flaeche: (eigen && eigen.flaeche) || null,
            betont: Boolean(eigen && eigen.betont),
            marke: (eigen && eigen.marke) || null,   // 'ring' | 'unterstrich' | 'plakette'
            istGegeben
        };
    }

    // Liefert { inhalt, klartext }: inhalt ist TeX (MathJax) oder Klartext, klartext dient als Fallback und zur Breitenschätzung
    function beschriftung(key, wert, opts, ctx) {
        const sym = BESCHRIFTUNG[key] || { tex: key, klar: key };
        const istWinkel = WINKEL.includes(key);
        const zeigeWert = opts.zeige.werte
            && (ctx.gegeben.includes(key) || opts.zeige.berechneteWerte)
            && Number.isFinite(wert);

        const suffix = istWinkel ? '°' : (ctx.einheit ? ` ${ctx.einheit}` : '');
        const klartext = zeigeWert ? `${sym.klar} = ${fmt(wert, opts.stellen)}${suffix}` : sym.klar;

        if (!opts.formelsatz) {
            return { inhalt: escapeXml(klartext), klartext };
        }
        if (!zeigeWert) {
            return { inhalt: `\\(${sym.tex}\\)`, klartext };
        }
        const einheitTex = istWinkel
            ? '^\\circ'
            : (ctx.einheit ? `\\,\\text{${escapeXml(ctx.einheit)}}` : '');
        return { inhalt: `\\(${sym.tex} = ${fmtTex(wert, opts.stellen)}${einheitTex}\\)`, klartext };
    }

    function zeichneBeschriftung(x, y, label, spec, opts, rot = 0) {
        const FS = Number(opts.stil.schriftgroesse) || 15;
        const boxW = Math.max(76, FS * 8.5);
        const boxH = Math.max(28, FS * 2.2);
        const left = x - boxW / 2;
        const top = y - boxH / 2;

        const klassen = ['mtg-fo-inner'];
        if (spec.betont) klassen.push('is-emph');
        if (spec.marke === 'unterstrich') klassen.push('is-underline');
        if (spec.marke === 'plakette') klassen.push('is-badge');

        const drehung = Math.abs(rot) > 0.05
            ? ` transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"`
            : '';

        const ring = spec.marke === 'ring'
            ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(FS * 1.15).toFixed(1)}" ` +
              `style="fill:none;stroke:${escapeXml(spec.farbe)};stroke-width:${Math.max(1.5, Number(opts.stil.linienbreite) * 1.2).toFixed(2)};stroke-dasharray:4 2"${drehung}/>`
            : '';

        return `${ring}<foreignObject x="${left.toFixed(1)}" y="${top.toFixed(1)}" width="${boxW.toFixed(1)}" height="${boxH.toFixed(1)}" ` +
            `style="overflow:visible"${drehung}>` +
            `<div xmlns="http://www.w3.org/1999/xhtml" class="mtg-fo-wrap" style="font-size:${FS}px;color:${escapeXml(spec.farbe)}">` +
            `<div class="${klassen.join(' ')}" data-klartext="${escapeXml(label.klartext)}">${label.inhalt}</div>` +
            `</div></foreignObject>`;
    }

    function zeichneRechtwinkel(F, V, W, r, dr, farbe, sw) {
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
        const bogenStil = `fill:none;stroke:${farbe};stroke-width:${(sw * 0.6).toFixed(2)}`;
        return `<path d="${d}" style="${bogenStil}"/><circle cx="${dotX}" cy="${dotY}" r="2.2" fill="${farbe}"/>`;
    }

    // -------------------------------------------------------------------------
    // SVG aufbauen
    // -------------------------------------------------------------------------
    function baueSvg(ergebnis, opts) {
        const { werte, gegeben, einheit } = leseErgebnis(ergebnis, opts);
        const ctx = { gegeben, einheit };
        const punkte = punkteAusSeiten(werte.a, werte.b, werte.c);
        const boegen = messeBoegen(punkte);

        const { breite: W, hoehe: H, rand: M } = opts.ansicht;
        const FS = Number(opts.stil.schriftgroesse) || 15;
        const SW = Number(opts.stil.linienbreite) || 1.3;
        const SG = Number(opts.stil.seitenabstand) || 6;
        const AR = Number(opts.winkel.radius) || 30;

        const xs = punkte.map(q => q[0]);
        const ys = punkte.map(q => q[1]);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const spanW = Math.max(1e-6, Math.max(...xs) - minX);
        const spanH = Math.max(1e-6, Math.max(...ys) - minY);

        const scale = Math.min((W - 2 * M) / spanW, (H - 2 * M) / spanH);
        const ox = (W - spanW * scale) / 2;
        const oy = (H - spanH * scale) / 2;

        const S = punkte.map(q => [
            ox + (q[0] - minX) * scale,
            H - (oy + (q[1] - minY) * scale)
        ]);

        const dreieckSpec = opts.hervorhebungen.dreieck || {};
        const fuellung = dreieckSpec.flaeche || opts.farben.flaeche;
        const umriss = dreieckSpec.linie || opts.farben.linie;
        const umrissBreite = dreieckSpec.betont ? SW * 1.6 : SW;

        let out = `<polygon points="${S.map(q => `${q[0].toFixed(2)},${q[1].toFixed(2)}`).join(' ')}" ` +
            `style="fill:${escapeXml(fuellung)};stroke:${escapeXml(umriss)};stroke-width:${umrissBreite};stroke-linejoin:round"/>`;

        const eckenNamen = ['A', 'B', 'C'];

        for (let i = 0; i < 3; i++) {
            const V = S[i];
            const N = S[(i + 1) % 3];
            const Pr = S[(i + 2) % 3];
            const { a1, it } = boegen[i];
            const midAng = a1 + it / 2;
            const istRechter = Math.abs(it * RAD_TO_DEG - 90) < 0.01;

            const lu = Math.hypot(N[0] - V[0], N[1] - V[1]);
            const lp = Math.hypot(Pr[0] - V[0], Pr[1] - V[1]);
            const r = Math.max(8, Math.min(AR, 0.45 * Math.min(lu, lp)));

            const wk = WINKEL[i];
            const winkelSpec = holeHervorhebung(wk, opts, ctx);
            const bogenFarbe = opts.hervorhebung === 'eigen' && opts.hervorhebungen[wk]
                ? winkelSpec.farbe
                : opts.farben.linie;
            const bogenBreite = winkelSpec.betont ? SW * 1.3 : SW * 0.6;

            if (istRechter) {
                out += `<circle cx="${(V[0] + 0.55 * r * Math.cos(midAng)).toFixed(1)}" ` +
                    `cy="${(V[1] - 0.55 * r * Math.sin(midAng)).toFixed(1)}" r="2" fill="${escapeXml(bogenFarbe)}"/>`;
            }

            if (opts.zeige.winkel) {
                let d = '';
                for (let j = 0; j <= 24; j++) {
                    const t = a1 + (it * j) / 24;
                    d += `${j ? 'L' : 'M'}${(V[0] + r * Math.cos(t)).toFixed(1)},${(V[1] - r * Math.sin(t)).toFixed(1)}`;
                }
                out += `<path d="${d}" style="fill:none;stroke:${escapeXml(bogenFarbe)};stroke-width:${bogenBreite.toFixed(2)}"/>`;
            }

            if (opts.zeige.ecken) {
                const vx = V[0] - 22 * Math.cos(midAng);
                const vy = V[1] + 22 * Math.sin(midAng);
                out += `<text x="${vx.toFixed(1)}" y="${vy.toFixed(1)}" ` +
                    `style="font-size:${FS + 4}px;font-weight:400;fill:${escapeXml(opts.farben.neutral)};text-anchor:middle;dominant-baseline:middle">${eckenNamen[i]}</text>`;
            }

            const zeigeWinkelLabel = opts.zeige.winkel && (winkelSpec.istGegeben || opts.zeige.unbekannteBeschriftungen);
            if (zeigeWinkelLabel && !istRechter) {
                const label = beschriftung(wk, werte[wk], opts, ctx);
                const posFaktor = opts.winkel.position[i] ?? 0.5;
                const mp = a1 + posFaktor * it;
                const tw = label.klartext.length * 0.55 * FS + 8;
                const hh = FS * 0.65;
                const ux = Math.cos(mp);
                const uy = -Math.sin(mp);
                const need = r + 8;

                let lr = r;
                if (opts.winkel.abstand[i] != null) {
                    lr = Number(opts.winkel.abstand[i]);
                } else {
                    for (; lr < 400; lr += 0.5) {
                        if (Math.hypot(Math.max(Math.abs(lr * ux) - tw / 2, 0), Math.max(Math.abs(lr * uy) - hh, 0)) >= need) {
                            break;
                        }
                    }
                }
                out += zeichneBeschriftung(V[0] + lr * ux, V[1] + lr * uy, label, winkelSpec, opts, 0);
            }

            // Seitenbeschriftung außen
            const sk = SEITEN[i];
            const seitenSpec = holeHervorhebung(sk, opts, ctx);
            const zeigeSeitenLabel = opts.zeige.seiten && (seitenSpec.istGegeben || opts.zeige.unbekannteBeschriftungen);
            if (zeigeSeitenLabel) {
                const label = beschriftung(sk, werte[sk], opts, ctx);
                const mx = (V[0] + N[0]) / 2;
                const my = (V[1] + N[1]) / 2;
                const ex = (N[0] - V[0]) / Math.max(1e-6, lu);
                const ey = (N[1] - V[1]) / Math.max(1e-6, lu);

                const mathDx = punkte[(i + 1) % 3][0] - punkte[i][0];
                const mathDy = punkte[(i + 1) % 3][1] - punkte[i][1];
                const ml = Math.max(1e-6, Math.hypot(mathDx, mathDy));

                let rot = Math.atan2(ey, ex) * RAD_TO_DEG;
                if (rot > 90) rot -= 180;
                else if (rot < -90) rot += 180;

                const off = SG + 12;
                out += zeichneBeschriftung(mx + (mathDy / ml) * off, my + (mathDx / ml) * off, label, seitenSpec, opts, rot);
            }
        }

        // Höhen h_a, h_b, h_c
        const schwerpunkt = [
            (S[0][0] + S[1][0] + S[2][0]) / 3,
            (S[0][1] + S[1][1] + S[2][1]) / 3
        ];
        const hBuchstaben = ['a', 'b', 'c'];

        for (let v = 0; v < 3; v++) {
            const hl = hBuchstaben[v];
            if (!opts.hoehen[hl]) continue;

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
            const hSpec = holeHervorhebung(hk, opts, ctx);
            const linienFarbe = hSpec.linie || opts.farben.linie;
            const hBreite = hSpec.betont ? SW * 1.2 : SW * 0.6;
            const hStil = `fill:none;stroke:${escapeXml(linienFarbe)};stroke-width:${hBreite.toFixed(2)};stroke-dasharray:5 3`;

            out += `<line x1="${V[0].toFixed(1)}" y1="${V[1].toFixed(1)}" x2="${F[0].toFixed(1)}" y2="${F[1].toFixed(1)}" style="${hStil}"/>`;
            if (t < 0 || t > 1) {
                const E = t < 0 ? P : Q;
                out += `<line x1="${E[0].toFixed(1)}" y1="${E[1].toFixed(1)}" x2="${F[0].toFixed(1)}" y2="${F[1].toFixed(1)}" style="${hStil}"/>`;
            }

            out += zeichneRechtwinkel(F, V, dP > dQ ? P : Q, 16, 9, escapeXml(linienFarbe), SW);

            const zeigeHoehenLabel = opts.zeige.seiten && (hSpec.istGegeben || opts.zeige.unbekannteBeschriftungen);
            if (zeigeHoehenLabel) {
                const mx2 = (V[0] + F[0]) / 2;
                const my2 = (V[1] + F[1]) / 2;
                const hx = F[0] - V[0];
                const hy = F[1] - V[1];
                const hq = Math.max(1e-6, Math.hypot(hx, hy));
                let nx = -hy / hq;
                let ny = hx / hq;

                const gespiegelt = Boolean(opts.hoehen.spiegeln && opts.hoehen.spiegeln[hl]);
                const vorzeichen = ((v === 2) !== gespiegelt) ? -1 : 1;
                if (vorzeichen * ((mx2 - schwerpunkt[0]) * nx + (my2 - schwerpunkt[1]) * ny) < 0) {
                    nx = -nx;
                    ny = -ny;
                }

                const label = beschriftung(hk, werte[hk], opts, ctx);
                const off = FS * 1.2 + 8;
                out += zeichneBeschriftung(mx2 + nx * off, my2 + ny * off, label, hSpec, opts, 0);
            }
        }

        return `<svg class="mtg-tri-svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Gezeichnetes Dreieck" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
    }

    // -------------------------------------------------------------------------
    // Formelsatz (MathJax) mit Klartext-Fallback
    // -------------------------------------------------------------------------
    async function setzeFormeln(el, opts) {
        if (!opts.formelsatz) return;

        const aufKlartext = () => {
            el.querySelectorAll('.mtg-fo-inner[data-klartext]').forEach(n => {
                n.textContent = n.getAttribute('data-klartext');
            });
        };

        for (let i = 0; i < 80; i++) {        // höchstens ca. 2 s auf MathJax warten
            if (typeof window !== 'undefined' && window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
                try {
                    await window.MathJax.typesetPromise([el]);
                } catch (e) {
                    aufKlartext();
                }
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 25));
        }
        aufKlartext();
    }

    // -------------------------------------------------------------------------
    // Öffentliche Funktionen
    // -------------------------------------------------------------------------
    function zeichneDreieckAlsSvg(ergebnis, optionen = {}) {
        sorgeFuerStile();
        return baueSvg(ergebnis, fuehreOptionenZusammen(optionen));
    }

    async function zeichneDreieck(ziel, ergebnis, optionen = {}) {
        if (typeof document === 'undefined') {
            throw new Error('zeichneDreieck benötigt einen Browser (DOM). Ohne DOM zeichneDreieckAlsSvg verwenden.');
        }
        const el = typeof ziel === 'string' ? document.querySelector(ziel) : ziel;
        if (!el) {
            throw new Error('Ziel-Element für MTGTriangleRenderer.zeichneDreieck nicht gefunden.');
        }

        const opts = fuehreOptionenZusammen(optionen);
        sorgeFuerStile();
        const svgMarkup = baueSvg(ergebnis, opts);

        let ergebnisEl;
        if (el.tagName && el.tagName.toLowerCase() === 'svg') {
            const temp = document.createElement('div');
            temp.innerHTML = svgMarkup;
            const svg = temp.firstElementChild;
            el.setAttribute('class', svg.getAttribute('class'));
            el.setAttribute('viewBox', svg.getAttribute('viewBox'));
            el.setAttribute('role', svg.getAttribute('role'));
            el.setAttribute('aria-label', svg.getAttribute('aria-label'));
            el.innerHTML = svg.innerHTML;
            ergebnisEl = el;
        } else {
            el.innerHTML = svgMarkup;
            ergebnisEl = el.firstElementChild;
        }

        await setzeFormeln(ergebnisEl, opts);
        return ergebnisEl;
    }

    return {
        zeichneDreieck,
        zeichneDreieckAlsSvg,
        STANDARD_OPTIONEN
    };
}));
