/**
 * MTGTriangleSolver – Dreiecksberechnungen mit ausführlichem Lösungsweg.
 *
 * Folgt dem gemeinsamen Solver-Format (siehe SOLVER-FORMAT.md, Referenz: solid-solver.js).
 *
 * Einstieg: berechneDreieck(masse, optionen)
 *   masse     Mindestens 3 Bestimmungsstücke: Seiten a, b, c; Winkel alpha, beta, gamma (Grad);
 *             höchstens eine Höhe ha, hb oder hc auf einer gegebenen Seite.
 *             (Kurzformen al, be, ga sowie h_a, h_b, h_c werden ebenfalls akzeptiert.)
 *   optionen  { einheit: { laenge, flaeche, volumen }, stellen, mehrdeutigErlaubt }
 *             einheit.laenge: mm, cm, dm, m, km oder '' (Flächeneinheit wird daraus abgeleitet)
 *
 * Ergebnis:
 *   { figur, bezeichnung, einheit, gegeben, masse, umfang, flaecheninhalt, schritte, html,
 *     eindeutig, anzahlLoesungen, loesungen }
 *   schritte   Lösungsweg als Abschnitte { titel, elemente } (Elemente: Text oder Gleichung)
 *   html       fertig dargestellter Lösungsweg (gleiche CSS-Klassen wie der Solid Solver)
 *   loesungen  alle Lösungen im selben Format (mehrere nur bei mehrdeutigem SsW-Fall und
 *              mehrdeutigErlaubt: true; sonst wird ein Fehler geworfen)
 *
 * Veraltet (nur Übergang): solve(inputs, { unit, decimals, allowAmbiguous }) liefert zusätzlich
 *   values, formatted, given, steps (LaTeX) und schritte je Rechenschritt.
 *
 * Bereitgestellt über window.MTGTriangleSolver bzw. globalThis.MTGTriangleSolver und module.exports.
 */

(function (root, factory) {
    const exported = factory();
    root.MTGTriangleSolver = exported;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exported;
    }
}(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function () {

    const DEG_TO_RAD = Math.PI / 180;
    const RAD_TO_DEG = 180 / Math.PI;
    const ALLOWED_UNITS = ['', 'mm', 'cm', 'dm', 'm', 'km'];
    const INTERMEDIATE_DECIMALS = 4;
    const EINHEIT_DEFAULT = { laenge: 'cm', flaeche: 'cm²', volumen: 'cm³' }; // wie im Solid Solver
    const FIGUR = 'dreieck';
    const BEZEICHNUNG = 'Dreieck';
    const KANONISCH = { al: 'alpha', be: 'beta', ga: 'gamma' };

    // -------------------------------------------------------------------------
    // Formatierungs-Helper
    // -------------------------------------------------------------------------
    function fmt(val, dec = 2, decSep = ',') {
        if (val == null || !isFinite(val)) return '';
        if (Math.abs(val) < 1e-11) val = 0;
        let s = Number(val).toFixed(dec);
        if (s.includes('.')) {
            s = s.replace(/0+$/, '').replace(/\.$/, '');
        }
        return decSep === ',' ? s.replace('.', ',') : s;
    }

    function fmtL(val, dec = 2) {
        return fmt(val, dec, ',').replace(',', '{,}');
    }

    function unitL(unit) {
        return unit ? `\\,\\text{${unit}}` : '';
    }

    function unit2L(unit) {
        return unit ? `\\,\\text{${unit}}^2` : '';
    }

    const LABELS = {
        a: 'Seite a',
        b: 'Seite b',
        c: 'Seite c',
        al: 'Winkel α',
        alpha: 'Winkel α',
        be: 'Winkel β',
        beta: 'Winkel β',
        ga: 'Winkel γ',
        gamma: 'Winkel γ',
        ha: 'Höhe h_a',
        hb: 'Höhe h_b',
        hc: 'Höhe h_c',
        area: 'Flächeninhalt A',
        A: 'Flächeninhalt A',
        perimeter: 'Umfang u',
        u: 'Umfang u'
    };

    const TEX_NAMES = {
        a: 'a', b: 'b', c: 'c',
        al: '\\alpha', alpha: '\\alpha',
        be: '\\beta', beta: '\\beta',
        ga: '\\gamma', gamma: '\\gamma',
        ha: 'h_a', hb: 'h_b', hc: 'h_c',
        area: 'A', A: 'A', perimeter: 'u', u: 'u'
    };

    // Zuordnung: Höhe -> [ [Seite, gegenüberliegender Winkel zur Höhe im Teildreieck], ... ]
    // Denn h_a = b * sin(gamma) = c * sin(beta)
    const HP = {
        ha: [['b', 'ga'], ['c', 'be']],
        hb: [['a', 'ga'], ['c', 'al']],
        hc: [['a', 'be'], ['b', 'al']]
    };
    const HS = { ha: 'a', hb: 'b', hc: 'c' };
    const OPP_ANGLE = { a: 'al', b: 'be', c: 'ga' };

    // -------------------------------------------------------------------------
    // Optionen & Eingaben normalisieren & validieren
    // -------------------------------------------------------------------------
    function normalizeOptions(options = {}) {
        const unit = options.unit != null ? String(options.unit).trim() : '';
        if (!ALLOWED_UNITS.includes(unit)) {
            throw new Error(`Ungültige Einheit "${unit}". Erlaubt sind: mm, cm, dm, m, km oder keine Einheit.`);
        }

        let decimals = 2;
        if (options.decimals != null && options.decimals !== '') {
            decimals = Number(options.decimals);
            if (!Number.isInteger(decimals) || decimals < 0 || decimals > 10) {
                throw new Error('Die Genauigkeit (decimals) muss eine ganze Zahl zwischen 0 und 10 sein.');
            }
        }

        return {
            allowAmbiguous: Boolean(options.allowAmbiguous),
            unit,
            decimals
        };
    }

    function normalizeInputs(inputs) {
        const norm = {};
        if (!inputs || typeof inputs !== 'object') return norm;

        for (const [rawKey, rawVal] of Object.entries(inputs)) {
            if (rawVal == null || rawVal === '') continue;

            const k = rawKey.trim().toLowerCase();
            let targetKey = null;

            if (['α', 'al', 'alpha'].includes(k)) targetKey = 'al';
            else if (['β', 'be', 'beta'].includes(k)) targetKey = 'be';
            else if (['γ', 'ga', 'gamma'].includes(k)) targetKey = 'ga';
            else if (['h_a', 'ha'].includes(k)) targetKey = 'ha';
            else if (['h_b', 'hb'].includes(k)) targetKey = 'hb';
            else if (['h_c', 'hc'].includes(k)) targetKey = 'hc';
            else if (['a', 'b', 'c'].includes(k)) targetKey = k;
            else {
                // Bug 4 behoben: Unbekannte Parameter nicht mehr stillschweigend ignorieren
                throw new Error(`Unbekanntes Eingabefeld "${rawKey}". Erlaubt sind Seiten (a, b, c), Winkel (α, β, γ) und Höhen (h_a, h_b, h_c).`);
            }

            let val;
            if (typeof rawVal === 'string') {
                // Erlaubt optional auch angehängte Einheiten wie "5,4 cm" oder "60°"
                const sanitized = rawVal
                    .trim()
                    .replace(',', '.')
                    .replace(/(°|mm|cm|dm|km|m)$/i, '')
                    .trim();
                val = Number(sanitized);
            } else {
                val = Number(rawVal);
            }

            if (!isFinite(val)) {
                throw new Error(`Ungültiger Zahlenwert für "${LABELS[targetKey] || rawKey}".`);
            }
            if (val <= 0) {
                throw new Error(`Der Wert für "${LABELS[targetKey] || rawKey}" muss größer als 0 sein.`);
            }

            if (norm[targetKey] != null && Math.abs(norm[targetKey] - val) > 1e-9) {
                throw new Error(`Widersprüchliche Mehrfachangabe für ${LABELS[targetKey]}.`);
            }
            norm[targetKey] = val;
        }

        for (const ak of ['al', 'be', 'ga']) {
            if (norm[ak] != null && (norm[ak] <= 0 || norm[ak] >= 180)) {
                throw new Error(`${LABELS[ak]} muss zwischen 0° und 180° liegen.`);
            }
        }

        return norm;
    }

    // -------------------------------------------------------------------------
    // Prüfung der Höhen-Regeln (Unterrichtspraxis)
    // -------------------------------------------------------------------------
    function validateHeightRules(norm) {
        const givenHeights = ['ha', 'hb', 'hc'].filter(h => norm[h] != null);

        if (givenHeights.length > 1) {
            throw new Error('Es darf maximal eine Höhe gegeben sein.');
        }

        if (givenHeights.length === 1) {
            const hx = givenHeights[0];
            const baseSide = HS[hx];
            const oppAngle = OPP_ANGLE[baseSide];

            if (norm[baseSide] == null) {
                throw new Error(`Die ${LABELS[hx]} steht auf ${LABELS[baseSide]}. Diese Seite muss ebenfalls gegeben sein.`);
            }

            if (norm[oppAngle] != null) {
                throw new Error(
                    `Die Kombination aus ${LABELS[hx]}, ${LABELS[baseSide]} und dem gegenüberliegenden ${LABELS[oppAngle]} wird nicht unterstützt.`
                );
            }
        }
    }

    // -------------------------------------------------------------------------
    // Höhenbeziehung auflösen (genau 1 Höhe auf einer gegebenen Seite)
    // -------------------------------------------------------------------------
    function expandHeight(v) {
        const hx = ['ha', 'hb', 'hc'].find(h => v[h] != null);
        if (!hx) return { states: [v], error: null };

        const states = [];
        let lastError = null;

        for (const [S, A] of HP[hx]) {
            // Fall 1: Andere Seite S bekannt -> Winkel A über sin(A) = h_x / S (z. B. h_a, a, b)
            if (v[S] != null && v[A] == null) {
                const q = v[hx] / v[S];
                if (q > 1 + 1e-9) {
                    lastError = new Error(`Mit diesen Angaben gibt es kein Dreieck (${LABELS[hx]} ist größer als ${LABELS[S]}).`);
                    continue;
                }
                const a1 = Math.asin(Math.min(1, q)) * RAD_TO_DEG;
                states.push({ ...v, [A]: a1 });
                if (q < 1 - 1e-9) {
                    states.push({ ...v, [A]: 180 - a1 });
                }
                return { states, error: null };
            }

            // Fall 2: Anliegender Winkel A bekannt -> Seite S über S = h_x / sin(A) (z. B. h_a, a, β)
            if (v[A] != null && v[S] == null) {
                const sinA = Math.sin(v[A] * DEG_TO_RAD);
                states.push({ ...v, [S]: v[hx] / sinA });
                return { states, error: null };
            }
        }

        return { states: [v], error: lastError };
    }

    // -------------------------------------------------------------------------
    // Hauptsolver für Kern-Dreiecksgrößen (Seiten & Winkel)
    // -------------------------------------------------------------------------
    function solveCoreTriangle(v) {
        const sides = [v.a, v.b, v.c];
        const angles = [v.al, v.be, v.ga];

        let numAngles = angles.filter(x => x != null).length;

        if (numAngles === 2) {
            const missingIdx = angles.findIndex(x => x == null);
            const sumKnown = angles.reduce((s, x) => s + (x ?? 0), 0);
            angles[missingIdx] = 180 - sumKnown;
            if (angles[missingIdx] <= 1e-4) {
                throw new Error('Die Winkelsumme der gegebenen Winkel ist bereits größer oder gleich 180°.');
            }
        } else if (numAngles === 3) {
            const sum = angles[0] + angles[1] + angles[2];
            if (Math.abs(sum - 180) > 0.05) {
                throw new Error(`Die Winkelsumme beträgt ${fmt(sum, 2)}°, muss aber 180° ergeben.`);
            }
        }

        numAngles = angles.filter(x => x != null).length;
        const numSides = sides.filter(x => x != null).length;

        if (sides.some(x => x != null && x <= 0) || angles.some(x => x != null && (x <= 0 || x >= 180))) {
            throw new Error('Seiten müssen > 0 sein und Winkel zwischen 0° und 180° liegen.');
        }

        const candidateSidesList = [];

        if (numAngles === 3) {
            if (numSides === 0) {
                throw new Error('Drei Winkel (WWW) allein legen die Größe des Dreiecks nicht eindeutig fest – bitte mindestens eine Seite angeben.');
            }
            const knownIdx = sides.findIndex(x => x != null);
            const scaleFactor = sides[knownIdx] / Math.sin(angles[knownIdx] * DEG_TO_RAD);
            candidateSidesList.push(angles.map(ang => scaleFactor * Math.sin(ang * DEG_TO_RAD)));
        } else if (numSides === 3) {
            // SSS - Prüfe Dreiecksungleichung
            const [sa, sb, sc] = sides;
            if (sa + sb <= sc + 1e-9 || sa + sc <= sb + 1e-9 || sb + sc <= sa + 1e-9) {
                throw new Error('Die Dreiecksungleichung ist verletzt (die Summe zweier Seiten muss größer als die dritte Seite sein).');
            }
            candidateSidesList.push([...sides]);
        } else if (numSides === 2 && numAngles === 1) {
            const missingSideIdx = sides.findIndex(x => x == null);
            const knownAngleIdx = angles.findIndex(x => x != null);

            if (knownAngleIdx === missingSideIdx) {
                // SWS - Eingeschlossener Winkel
                const [p, q] = [0, 1, 2].filter(j => j !== missingSideIdx).map(j => sides[j]);
                const sideRes = [...sides];
                const gammaRad = angles[knownAngleIdx] * DEG_TO_RAD;
                const cSq = p * p + q * q - 2 * p * q * Math.cos(gammaRad);
                if (cSq <= 1e-9) {
                    throw new Error('Mit diesen Angaben kann kein gültiges Dreieck berechnet werden.');
                }
                sideRes[missingSideIdx] = Math.sqrt(cSq);
                candidateSidesList.push(sideRes);
            } else {
                // SsW - Gegenüberliegender Winkel
                const otherSideIdx = [0, 1, 2].find(j => j !== missingSideIdx && j !== knownAngleIdx);
                const sinVal = (sides[otherSideIdx] * Math.sin(angles[knownAngleIdx] * DEG_TO_RAD)) / sides[knownAngleIdx];

                if (sinVal > 1 + 1e-9) {
                    throw new Error('Mit diesen Angaben gibt es kein Dreieck (Sinuswert überschreitet 1).');
                }

                const beta1 = Math.asin(Math.min(1, sinVal)) * RAD_TO_DEG;
                const candidateBetas = [beta1];
                if (sinVal < 1 - 1e-9) {
                    candidateBetas.push(180 - beta1);
                }

                for (const betaCandidate of candidateBetas) {
                    const remainingAngle = 180 - angles[knownAngleIdx] - betaCandidate;
                    if (remainingAngle <= 1e-6) continue;

                    const candidateAngles = [...angles];
                    candidateAngles[otherSideIdx] = betaCandidate;
                    candidateAngles[missingSideIdx] = remainingAngle;

                    const scale = sides[knownAngleIdx] / Math.sin(angles[knownAngleIdx] * DEG_TO_RAD);
                    const calculatedSides = candidateAngles.map(ang => scale * Math.sin(ang * DEG_TO_RAD));
                    candidateSidesList.push(calculatedSides);
                }
            }
        } else if (numSides === 1 && numAngles >= 2) {
            // WSW / WWS
            const sideIdx = sides.findIndex(x => x != null);
            const scale = sides[sideIdx] / Math.sin(angles[sideIdx] * DEG_TO_RAD);
            const calculatedSides = angles.map(ang => scale * Math.sin(ang * DEG_TO_RAD));
            candidateSidesList.push(calculatedSides);
        } else {
            throw new Error('Unzureichende oder nicht eindeutige Angaben. Bitte mindestens 3 Bestimmungsstücke (z. B. SSS, SWS, WSW, WWS, SsW oder mit passender Höhe) angeben.');
        }

        const results = [];
        for (const candidateSides of candidateSidesList) {
            const [a, b, c] = candidateSides;
            if (a <= 1e-9 || b <= 1e-9 || c <= 1e-9) continue;
            if (a + b <= c + 1e-9 || a + c <= b + 1e-9 || b + c <= a + 1e-9) continue;

            const cosA = (b * b + c * c - a * a) / (2 * b * c);
            const cosB = (a * a + c * c - b * b) / (2 * a * c);
            const cosC = (a * a + b * b - c * c) / (2 * a * b);

            if (Math.abs(cosA) > 1 + 1e-6 || Math.abs(cosB) > 1 + 1e-6 || Math.abs(cosC) > 1 + 1e-6) {
                continue;
            }

            const al = Math.acos(Math.max(-1, Math.min(1, cosA))) * RAD_TO_DEG;
            const be = Math.acos(Math.max(-1, Math.min(1, cosB))) * RAD_TO_DEG;
            const ga = Math.acos(Math.max(-1, Math.min(1, cosC))) * RAD_TO_DEG;

            const ha = b * Math.sin(ga * DEG_TO_RAD);
            const hb = a * Math.sin(ga * DEG_TO_RAD);
            const hc = b * Math.sin(al * DEG_TO_RAD);
            const perimeter = a + b + c;
            const area = 0.5 * c * hc;

            results.push({
                a, b, c,
                al, be, ga,
                ha, hb, hc,
                perimeter, u: perimeter,
                area, A: area
            });
        }

        if (!results.length) {
            throw new Error('Kein gültiges Dreieck mit diesen Parametern möglich.');
        }

        return results;
    }

    // -------------------------------------------------------------------------
    // Prüft, ob eine fertige Lösung zu allen ursprünglich eingegebenen Werten passt
    // -------------------------------------------------------------------------
    function matchesInputs(sol, normInputs) {
        for (const [k, targetVal] of Object.entries(normInputs)) {
            const actualVal = sol[k];
            if (actualVal == null) return false;
            const tol = ['al', 'be', 'ga'].includes(k) ? 0.05 : Math.max(1e-4, Math.abs(targetVal) * 1e-4);
            if (Math.abs(actualVal - targetVal) > tol) {
                return false;
            }
        }
        return true;
    }

    // -------------------------------------------------------------------------
    // Dedupliziert kongruente/identische Lösungen
    // -------------------------------------------------------------------------
    function deduplicateSolutions(solutions) {
        const unique = [];
        for (const sol of solutions) {
            const isDup = unique.some(u =>
                Math.abs(u.a - sol.a) < 1e-4 &&
                Math.abs(u.b - sol.b) < 1e-4 &&
                Math.abs(u.c - sol.c) < 1e-4
            );
            if (!isDup) unique.push(sol);
        }
        return unique;
    }

    // -------------------------------------------------------------------------
    // Erzeugt den detaillierten Lösungsweg (Steps) für eine gegebene Dreieckslösung
    // Zwischenergebnisse werden immer mit 4 Nachkommastellen angezeigt.
    // -------------------------------------------------------------------------
    function deriveSteps(val, givenKeys, normOpts, fm) {
        const unit = normOpts.unit;
        const midDec = INTERMEDIATE_DECIMALS;

        const known = new Set(givenKeys);
        const steps = [];

        const SK = ['a', 'b', 'c'];
        const AK = ['al', 'be', 'ga'];
        const HK = ['ha', 'hb', 'hc'];

        // L: Symbol, sv/av: Zwischenwert mit Einheit bzw. in Grad (immer 4 Nachkommastellen).
        // Die Formatierung kommt von außen (fm), damit derselbe Rechenweg als LaTeX und als HTML ausgegeben werden kann.
        const { L, sv, av } = fm;

        // 1. Iteratives Ableiten aller Seiten, Winkel und Höhen
        for (let round = 0; round < 16; round++) {
            const allBaseSolved = [...SK, ...AK, ...HK].every(k => known.has(k));
            if (allBaseSolved) break;

            const candidates = [];
            const rightAngleIdx = AK.findIndex(k => Math.abs(val[k] - 90) < 1e-5);
            const isRightAngledKnown = rightAngleIdx >= 0 && known.has(AK[rightAngleIdx]);

            // A) Höhen-Beziehungen prüfen
            for (const hx of HK) {
                const sx = HS[hx];

                // A1: Flächeninvarianz zum Berechnen der restlichen Höhen am Ende
                for (const hy of HK) {
                    if (hy === hx) continue;
                    const sy = HS[hy];
                    if (known.has(hx) && known.has(sx) && known.has(sy) && !known.has(hy)) {
                        candidates.push({
                            key: hy,
                            prio: 2,
                            formula: `${L(hy)} = \\frac{${L(sx)} \\cdot ${L(hx)}}{${L(sy)}}`,
                            substituted: `${L(hy)} = \\frac{${sv(sx)} \\cdot ${sv(hx)}}{${sv(sy)}}`,
                            explanation: `Berechnung der Höhe $${L(hy)}$ über die Flächengleichheit ($${L(sx)} \\cdot ${L(hx)} = ${L(sy)} \\cdot ${L(hy)}$).`
                        });
                    }
                }

                // A2: Rechtwinkliges Teildreieck: h_x = S * sin(A)
                for (const [S, A] of HP[hx]) {
                    if (known.has(hx) && known.has(A) && !known.has(S)) {
                        candidates.push({
                            key: S,
                            prio: 0,
                            formula: `${L(S)} = \\frac{${L(hx)}}{\\sin(${L(A)})}`,
                            substituted: `${L(S)} = \\frac{${sv(hx)}}{\\sin(${av(A)})}`,
                            explanation: `Berechnung der Seite $${L(S)}$ im rechtwinkligen Teildreieck über $\\sin(${L(A)}) = \\frac{${L(hx)}}{${L(S)}}$.`
                        });
                    }
                    if (known.has(hx) && known.has(S) && !known.has(A)) {
                        const qStr = fmtL(val[hx] / val[S], midDec);
                        const isObtuse = val[A] > 90.0001;
                        candidates.push({
                            key: A,
                            prio: 1,
                            formula: `\\sin(${L(A)}) = \\frac{${L(hx)}}{${L(S)}}`,
                            substituted: `\\sin(${L(A)}) = \\frac{${sv(hx)}}{${sv(S)}} = ${qStr} \\implies ${L(A)} = ${isObtuse ? '180^\\circ - ' : ''}\\arcsin(${qStr})`,
                            explanation: isObtuse
                                ? `Berechnung des Winkels $${L(A)}$ im rechtwinkligen Teildreieck über $\\sin(${L(A)}) = \\frac{${L(hx)}}{${L(S)}}$. Da das Dreieck hier stumpfwinklig ist, wird der Nebenwinkel $180^\\circ - \\arcsin(${qStr})$ verwendet.`
                                : `Berechnung des Winkels $${L(A)}$ im rechtwinkligen Teildreieck über $\\sin(${L(A)}) = \\frac{${L(hx)}}{${L(S)}}$.`
                        });
                    }
                    if (known.has(S) && known.has(A) && !known.has(hx)) {
                        candidates.push({
                            key: hx,
                            prio: 3,
                            formula: `${L(hx)} = ${L(S)} \\cdot \\sin(${L(A)})`,
                            substituted: `${L(hx)} = ${sv(S)} \\cdot \\sin(${av(A)})`,
                            explanation: `Berechnung der Höhe $${L(hx)}$ über das rechtwinklige Teildreieck ($${L(hx)} = ${L(S)} \\cdot \\sin(${L(A)})$).`
                        });
                    }
                }
            }

            // B) Winkel & Seiten berechnen
            for (let i = 0; i < 3; i++) {
                const k = AK[i];
                const o1 = AK[(i + 1) % 3];
                const o2 = AK[(i + 2) % 3];

                if (!known.has(k)) {
                    // Winkelsumme
                    if (known.has(o1) && known.has(o2)) {
                        candidates.push({
                            key: k,
                            prio: 0,
                            formula: `${L(k)} = 180^\\circ - ${L(o1)} - ${L(o2)}`,
                            substituted: `${L(k)} = 180^\\circ - ${av(o1)} - ${av(o2)}`,
                            explanation: `Berechnung des Winkels $${L(k)}$ über die Innenwinkelsumme im Dreieck ($180^\\circ$).`
                        });
                        continue;
                    }

                    // Rechtwinkliges Dreieck (Sin, Cos, Tan)
                    if (isRightAngledKnown && i !== rightAngleIdx) {
                        const hyp = SK[rightAngleIdx];
                        const opp = SK[i];
                        const adj = SK[3 - rightAngleIdx - i];

                        if (known.has(opp) && known.has(hyp)) {
                            const ratioStr = fmtL(val[opp] / val[hyp], midDec);
                            candidates.push({
                                key: k,
                                prio: 1,
                                formula: `\\sin(${L(k)}) = \\frac{${L(opp)}}{${L(hyp)}}`,
                                substituted: `\\sin(${L(k)}) = \\frac{${sv(opp)}}{${sv(hyp)}} = ${ratioStr} \\implies ${L(k)} = \\arcsin(${ratioStr})`,
                                explanation: `Berechnung des Winkels $${L(k)}$ mit dem Sinus im rechtwinkligen Dreieck.`
                            });
                        } else if (known.has(adj) && known.has(hyp)) {
                            const ratioStr = fmtL(val[adj] / val[hyp], midDec);
                            candidates.push({
                                key: k,
                                prio: 1,
                                formula: `\\cos(${L(k)}) = \\frac{${L(adj)}}{${L(hyp)}}`,
                                substituted: `\\cos(${L(k)}) = \\frac{${sv(adj)}}{${sv(hyp)}} = ${ratioStr} \\implies ${L(k)} = \\arccos(${ratioStr})`,
                                explanation: `Berechnung des Winkels $${L(k)}$ mit dem Kosinus im rechtwinkligen Dreieck.`
                            });
                        } else if (known.has(opp) && known.has(adj)) {
                            const ratioStr = fmtL(val[opp] / val[adj], midDec);
                            candidates.push({
                                key: k,
                                prio: 1,
                                formula: `\\tan(${L(k)}) = \\frac{${L(opp)}}{${L(adj)}}`,
                                substituted: `\\tan(${L(k)}) = \\frac{${sv(opp)}}{${sv(adj)}} = ${ratioStr} \\implies ${L(k)} = \\arctan(${ratioStr})`,
                                explanation: `Berechnung des Winkels $${L(k)}$ mit dem Tangens im rechtwinkligen Dreieck.`
                            });
                        }
                    }

                    // Sinussatz für Winkel
                    if (known.has(SK[i])) {
                        for (let j = 0; j < 3; j++) {
                            if (j !== i && known.has(SK[j]) && known.has(AK[j])) {
                                const sinVal = Math.sin(val[k] * DEG_TO_RAD);
                                const qStr = fmtL(sinVal, midDec);
                                const isObtuse = val[k] > 90.0001;
                                candidates.push({
                                    key: k,
                                    prio: 2,
                                    formula: `\\sin(${L(k)}) = \\frac{${L(SK[i])} \\cdot \\sin(${L(AK[j])})}{${L(SK[j])}}`,
                                    substituted: `\\sin(${L(k)}) = \\frac{${sv(SK[i])} \\cdot \\sin(${av(AK[j])})}{${sv(SK[j])}} = ${qStr} \\implies ${L(k)} = ${isObtuse ? '180^\\circ - ' : ''}\\arcsin(${qStr})`,
                                    explanation: isObtuse
                                        ? `Berechnung des Winkels $${L(k)}$ mithilfe des Sinussatzes. Da der Winkel stumpf ($> 90^\\circ$) ist, gilt die Nebenwinkelbeziehung $${L(k)} = 180^\\circ - \\arcsin(${qStr})$.`
                                        : `Berechnung des Winkels $${L(k)}$ mithilfe des Sinussatzes.`
                                });
                                break;
                            }
                        }
                    }

                    // Kosinussatz für Winkel (3 Seiten bekannt)
                    if (SK.every(x => known.has(x))) {
                        const s1 = SK[i];
                        const s2 = SK[(i + 1) % 3];
                        const s3 = SK[(i + 2) % 3];
                        const cosVal = Math.cos(val[k] * DEG_TO_RAD);
                        const qStr = fmtL(cosVal, midDec);
                        candidates.push({
                            key: k,
                            prio: 2,
                            formula: `\\cos(${L(k)}) = \\frac{${L(s2)}^2 + ${L(s3)}^2 - ${L(s1)}^2}{2 \\cdot ${L(s2)} \\cdot ${L(s3)}}`,
                            substituted: `\\cos(${L(k)}) = \\frac{(${sv(s2)})^2 + (${sv(s3)})^2 - (${sv(s1)})^2}{2 \\cdot ${sv(s2)} \\cdot ${sv(s3)}} = ${qStr} \\implies ${L(k)} = \\arccos(${qStr})`,
                            explanation: `Berechnung des Winkels $${L(k)}$ mithilfe des Kosinussatzes.`
                        });
                    }
                }

                // Seite berechnen
                const skKey = SK[i];
                if (!known.has(skKey)) {
                    // Pythagoras im rechtwinkligen Dreieck
                    if (isRightAngledKnown) {
                        const hyp = SK[rightAngleIdx];
                        if (skKey === hyp) {
                            const [c1, c2] = [0, 1, 2].filter(j => j !== rightAngleIdx).map(j => SK[j]);
                            if (known.has(c1) && known.has(c2)) {
                                candidates.push({
                                    key: skKey,
                                    prio: 0,
                                    formula: `${L(skKey)} = \\sqrt{${L(c1)}^2 + ${L(c2)}^2}`,
                                    substituted: `${L(skKey)} = \\sqrt{(${sv(c1)})^2 + (${sv(c2)})^2}`,
                                    explanation: `Berechnung der Hypotenuse $${L(skKey)}$ mit dem Satz des Pythagoras.`
                                });
                            }
                        } else {
                            const cOther = SK[3 - rightAngleIdx - i];
                            if (known.has(hyp) && known.has(cOther)) {
                                candidates.push({
                                    key: skKey,
                                    prio: 0,
                                    formula: `${L(skKey)} = \\sqrt{${L(hyp)}^2 - ${L(cOther)}^2}`,
                                    substituted: `${L(skKey)} = \\sqrt{(${sv(hyp)})^2 - (${sv(cOther)})^2}`,
                                    explanation: `Berechnung der Kathete $${L(skKey)}$ mit dem Satz des Pythagoras.`
                                });
                            }
                        }
                    }

                    // Sinussatz für Seite
                    if (known.has(AK[i])) {
                        for (let j = 0; j < 3; j++) {
                            if (j !== i && known.has(SK[j]) && known.has(AK[j])) {
                                candidates.push({
                                    key: skKey,
                                    prio: 1,
                                    formula: `${L(skKey)} = \\frac{${L(SK[j])} \\cdot \\sin(${L(AK[i])})}{\\sin(${L(AK[j])})}`,
                                    substituted: `${L(skKey)} = \\frac{${sv(SK[j])} \\cdot \\sin(${av(AK[i])})}{\\sin(${av(AK[j])})}`,
                                    explanation: `Berechnung der Seite $${L(skKey)}$ mithilfe des Sinussatzes.`
                                });
                                break;
                            }
                        }
                    }

                    // Kosinussatz für Seite
                    const s2 = SK[(i + 1) % 3];
                    const s3 = SK[(i + 2) % 3];
                    if (known.has(s2) && known.has(s3) && known.has(AK[i])) {
                        candidates.push({
                            key: skKey,
                            prio: 1,
                            formula: `${L(skKey)} = \\sqrt{${L(s2)}^2 + ${L(s3)}^2 - 2 \\cdot ${L(s2)} \\cdot ${L(s3)} \\cdot \\cos(${L(AK[i])})}`,
                            substituted: `${L(skKey)} = \\sqrt{(${sv(s2)})^2 + (${sv(s3)})^2 - 2 \\cdot ${sv(s2)} \\cdot ${sv(s3)} \\cdot \\cos(${av(AK[i])})}`,
                            explanation: `Berechnung der Seite $${L(skKey)}$ mithilfe des Kosinussatzes.`
                        });
                    }
                }
            }

            if (!candidates.length) break;

            candidates.sort((a, b) => a.prio - b.prio);
            const best = candidates[0];

            known.add(best.key);
            steps.push(best);
        }

        // 2. Umfang (perimeter / u) – Zwischenwerte mit 4 Nachkommastellen
        steps.push({
            key: 'perimeter',
            prio: 5,
            formula: `${L('perimeter')} = ${L('a')} + ${L('b')} + ${L('c')}`,
            substituted: `${L('perimeter')} = ${sv('a')} + ${sv('b')} + ${sv('c')}`,
            explanation: `Der Umfang $${L('perimeter')}$ ist die Summe aller drei Seitenlängen.`
        });

        // 3. Flächeninhalt (area / A) – bevorzugt mit einer ursprünglich gegebenen Höhe oder c * hc
        let areaBase = 'c', areaHeight = 'hc';
        if (givenKeys.includes('ha')) { areaBase = 'a'; areaHeight = 'ha'; }
        else if (givenKeys.includes('hb')) { areaBase = 'b'; areaHeight = 'hb'; }

        steps.push({
            key: 'area',
            prio: 6,
            formula: `${L('area')} = \\frac{1}{2} \\cdot ${L(areaBase)} \\cdot ${L(areaHeight)}`,
            substituted: `${L('area')} = \\frac{1}{2} \\cdot ${sv(areaBase)} \\cdot ${sv(areaHeight)}`,
            explanation: `Der Flächeninhalt $${L('area')}$ wird mit der Grundseite $${L(areaBase)}$ und der zugehörigen Höhe $${L(areaHeight)}$ berechnet.`
        });

        return steps;
    }

    // -------------------------------------------------------------------------
    // Lösungsweg als LaTeX (Altformat, Ausgabe unverändert)
    // -------------------------------------------------------------------------
    function buildSolutionSteps(val, givenKeys, options = {}) {
        const normOpts = normalizeOptions(options);
        const unit = normOpts.unit;
        const dec = normOpts.decimals;
        const midDec = INTERMEDIATE_DECIMALS;

        const steps = deriveSteps(val, givenKeys, normOpts, {
            L: k => TEX_NAMES[k] || k,
            sv: k => fmtL(val[k], midDec) + unitL(unit),
            av: k => fmtL(val[k], midDec) + '^\\circ'
        });

        // Finales Aufbereiten aller Steps:
        // Zwischenwerte in der Rechnung haben 4 Stellen, das Endergebnis (resLatex / result) hat `dec` Stellen.
        return steps.map(step => {
            const targetKey = step.targetKey || step.key;
            const rawValue = val[targetKey];
            const isAngle = ['al', 'be', 'ga', 'alpha', 'beta', 'gamma'].includes(targetKey);
            const isArea = targetKey === 'area' || targetKey === 'A';

            const resUnit = isAngle ? '°' : (isArea ? (unit ? `${unit}²` : '') : unit);
            const latexUnit = isAngle ? '^\\circ' : (isArea ? unit2L(unit) : unitL(unit));

            const formattedResult = fmt(rawValue, dec, ',');
            const resLatex = fmtL(rawValue, dec);

            let fullLatex;
            if (step.substituted.includes('\\implies')) {
                fullLatex = `\\[ ${step.substituted} \\approx ${resLatex}${latexUnit} \\]`;
            } else if (step.formula) {
                const rhs = step.substituted.includes('=')
                    ? step.substituted.split('=').slice(1).join('=').trim()
                    : step.substituted;
                fullLatex = `\\[ ${step.formula} = ${rhs} \\approx ${resLatex}${latexUnit} \\]`;
            } else {
                fullLatex = `\\[ ${step.substituted}${latexUnit} \\]`;
            }

            return {
                key: targetKey,
                label: LABELS[targetKey] || targetKey,
                formula: step.formula,
                substituted: step.substituted,
                result: formattedResult + (resUnit ? (isAngle ? '°' : ` ${resUnit}`) : ''),
                resultValue: rawValue,
                unit: resUnit,
                latex: fullLatex,
                explanation: step.explanation
            };
        });
    }

    // -------------------------------------------------------------------------
    // Lösungsweg im Stil des Solid Solvers (HTML, Text- und Gleichungsschritte)
    //   gegebene Größen: <span class="kg">, berechnete Größen: <span class="ks">
    // -------------------------------------------------------------------------
    const SYM_HTML = {
        a: 'a', b: 'b', c: 'c',
        al: 'α', be: 'β', ga: 'γ', alpha: 'α', beta: 'β', gamma: 'γ',
        ha: 'h<sub>a</sub>', hb: 'h<sub>b</sub>', hc: 'h<sub>c</sub>',
        perimeter: 'u', area: 'A'
    };
    const FN_NAMES = ['sin', 'cos', 'tan', 'arcsin', 'arccos', 'arctan'];
    const MARK_START = '\uE000';
    const MARK_END = '\uE001';

    function plainText(html) {
        return html.replace(/<[^>]+>/g, '');
    }

    // Klammern nur, wo sie für die Lesbarkeit von "Zähler : Nenner" nötig sind
    function needsWrap(html, isDenominator) {
        const s = plainText(html);
        let depth = 0;
        for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            if (ch === '(') depth++;
            else if (ch === ')') depth--;
            else if (depth === 0) {
                if ((ch === '+' || ch === '−') && i > 0) return true;
                if (isDenominator && (ch === '·' || ch === ':')) return true;
            }
        }
        return false;
    }

    function readGroup(s, start) {
        let depth = 0;
        for (let j = start; j < s.length; j++) {
            if (s.startsWith('{,}', j)) { j += 2; continue; }
            if (s[j] === '{') depth++;
            else if (s[j] === '}') {
                depth--;
                if (depth === 0) return [s.slice(start + 1, j), j + 1];
            }
        }
        throw new Error('Interner Fehler: Klammerung in der Formeldarstellung unvollständig.');
    }

    function splitTop(s, sep) {
        const parts = [];
        let depth = 0;
        let last = 0;
        for (let i = 0; i < s.length; i++) {
            if (s.startsWith('{,}', i)) { i += 2; continue; }
            if (s[i] === '{') depth++;
            else if (s[i] === '}') depth--;
            else if (depth === 0 && s[i] === sep) {
                parts.push(s.slice(last, i).trim());
                last = i + 1;
            }
        }
        parts.push(s.slice(last).trim());
        return parts;
    }

    function renderMarker(body, ctx) {
        const [typ, key, text] = body.split('|');
        const klasse = ctx.given.has(key) ? 'kg' : 'ks';
        const inhalt = typ === 'S' ? (SYM_HTML[key] || key) : text;
        return ctx.plain ? inhalt : `<span class="${klasse}">${inhalt}</span>`;
    }

    // Wandelt den (kleinen) LaTeX-Ausschnitt der Rechenwege samt Symbol-/Wertmarken in HTML um
    function texToHtml(tex, ctx) {
        let out = '';
        let i = 0;
        while (i < tex.length) {
            const ch = tex[i];
            if (ch === MARK_START) {
                const j = tex.indexOf(MARK_END, i);
                out += renderMarker(tex.slice(i + 1, j), ctx);
                i = j + 1;
            } else if (tex.startsWith('{,}', i)) {
                out += ',';
                i += 3;
            } else if (ch === '\\') {
                const m = /^\\([A-Za-z]+|.)/.exec(tex.slice(i));
                const cmd = m[1];
                i += m[0].length;
                if (cmd === 'frac') {
                    const [zaehler, i1] = readGroup(tex, i);
                    const [nenner, i2] = readGroup(tex, i1);
                    i = i2;
                    const n = texToHtml(zaehler, ctx);
                    const d = texToHtml(nenner, ctx);
                    if (plainText(n) === '1' && plainText(d) === '2') out += '½';
                    else out += `${needsWrap(n, false) ? `(${n})` : n} : ${needsWrap(d, true) ? `(${d})` : d}`;
                } else if (cmd === 'sqrt') {
                    const [inner, i1] = readGroup(tex, i);
                    i = i1;
                    out += `√(${texToHtml(inner, ctx)})`;
                } else if (cmd === 'text') {
                    const [inner, i1] = readGroup(tex, i);
                    i = i1;
                    out += inner;
                } else if (cmd === 'cdot') out += '·';
                else if (cmd === 'approx') out += '≈';
                else if (cmd === 'circ') out += '°';
                else if (cmd === ',') out += ' ';
                else if (FN_NAMES.includes(cmd)) out += cmd;
                else throw new Error(`Interner Fehler: unbekannter Formelbefehl \\${cmd}.`);
            } else if (ch === '^') {
                i++;
                if (tex[i] === '2') { out += '²'; i++; }
                else if (tex.startsWith('\\circ', i)) { out += '°'; i += 5; }
                else throw new Error('Interner Fehler: unbekannter Exponent in der Formeldarstellung.');
            } else {
                out += ch;
                i++;
            }
        }
        return out
            .replace(/ {2,}/g, ' ')
            .replace(/ - /g, ' − ')
            .replace(/(^|[(=\s])-(?=\d)/g, '$1−');
    }

    function explanationToHtml(text, ctx) {
        return text
            .split('$')
            .map((seg, idx) => (idx % 2 === 1 ? texToHtml(seg, { ...ctx, plain: true }) : seg))
            .join('');
    }

    function valueWithUnit(key, value, unit, dec) {
        if (['al', 'be', 'ga', 'alpha', 'beta', 'gamma'].includes(key)) return `${fmt(value, dec, ',')}°`;
        if (key === 'area') return `${fmt(value, dec, ',')}${unit ? ` ${unit}²` : ''}`;
        return `${fmt(value, dec, ',')}${unit ? ` ${unit}` : ''}`;
    }

    function abschnitt(titel, elemente) {
        return { titel, elemente };
    }

    // Markiert die letzte Zeile der letzten Gleichung eines Abschnitts als Endergebnis (wie `eq(..., true)` im Solid Solver)
    function mitErgebnis(elemente) {
        return elemente.map((el, i) => {
            if (el.typ !== 'gleichung' || i !== elemente.length - 1) return el;
            return { ...el, zeilen: el.zeilen.map((z, j, arr) => ({ ...z, ergebnis: j === arr.length - 1 })) };
        });
    }

    // Gleiche Signatur und gleiches Markup wie schritteZuHtml im Solid Solver
    function schritteZuHtml(figur, gegeben, schritte, einheit = EINHEIT_DEFAULT) {
        const name = figur === FIGUR ? BEZEICHNUNG : figur;
        const gegebenText = Object.entries(gegeben)
            .map(([k, v]) => `${SYM_HTML[k] || k} = ${valueWithUnit(k, v, einheit.laenge, INTERMEDIATE_DECIMALS)}`)
            .join(', ');
        const secHtml = schritte.map(sec => {
            const body = sec.elemente.map(el => {
                if (el.typ === 'text') return `<p class="st">${el.text}</p>`;
                const rows = el.zeilen.map((z, i) => {
                    const rhs = z.ergebnis ? `<span class="res">${z.ausdruck}</span>` : z.ausdruck;
                    return `<tr><td class="l">${i === 0 ? el.links : ''}</td><td>${z.operator}</td><td>${rhs}</td></tr>`;
                }).join('');
                return `<table class="eq">${rows}</table>`;
            }).join('');
            return `<section class="sec"><h3>${sec.titel}</h3>${body}</section>`;
        }).join('');
        return `<h2 class="lw">Lösungsweg – ${name}</h2><p class="st">Gegeben: ${gegebenText}</p>${secHtml}`;
    }

    function buildSchritte(val, givenKeys, normOpts, norm) {
        const unit = normOpts.unit;
        const dec = normOpts.decimals;
        const ctx = { given: new Set(givenKeys), plain: false };
        const zw = k => fmt(val[k], INTERMEDIATE_DECIMALS, ',');

        const rohSchritte = deriveSteps(val, givenKeys, normOpts, {
            L: k => `${MARK_START}S|${k}${MARK_END}`,
            sv: k => `${MARK_START}V|${k}|${zw(k)}${unit ? ` ${unit}` : ''}${MARK_END}`,
            av: k => `${MARK_START}V|${k}|${zw(k)}°${MARK_END}`
        });

        const conv = s => texToHtml(s, ctx);
        const zeile = (operator, ausdruck) => ({ operator, ausdruck, ergebnis: false });

        const schritte = rohSchritte.map(step => {
            const key = step.key;
            const rawValue = val[key];
            const approx = Math.abs(Number(rawValue.toFixed(dec)) - rawValue) > 1e-9;
            const ergebnisZeile = zeile(approx ? '≈' : '=', valueWithUnit(key, rawValue, unit, dec));

            const [linksF, ...rechtsF] = splitTop(step.formula, '=');
            const rhsSymbolisch = conv(rechtsF.join('='));
            const elemente = [{ typ: 'text', text: explanationToHtml(step.explanation, ctx) }];

            if (step.substituted.includes('\\implies')) {
                // Trigonometrische Gleichung: erst Wert des Verhältnisses, dann Winkel
                const [vorher, nachher] = step.substituted.split('\\implies');
                const [, rhsEingesetzt, verhaeltnis] = splitTop(vorher, '=');
                const [winkelSymbol, winkelAusdruck] = splitTop(nachher, '=');
                elemente.push({
                    typ: 'gleichung',
                    links: conv(linksF),
                    zeilen: [zeile('=', rhsSymbolisch), zeile('=', conv(rhsEingesetzt)), zeile('=', conv(verhaeltnis))]
                });
                elemente.push({
                    typ: 'gleichung',
                    links: conv(winkelSymbol),
                    zeilen: [zeile('=', conv(winkelAusdruck)), ergebnisZeile]
                });
            } else {
                const [, ...rechtsS] = splitTop(step.substituted, '=');
                elemente.push({
                    typ: 'gleichung',
                    links: conv(linksF),
                    zeilen: [zeile('=', rhsSymbolisch), zeile('=', conv(rechtsS.join('='))), ergebnisZeile]
                });
            }
            return { key, label: LABELS[key] || key, elemente };
        });

        // Ein Abschnitt je gesuchter Größe (wie im Solid Solver: Titel nennt das Formelzeichen)
        const abschnitte = [];
        const herleitung = schritte.filter(s => s.key !== 'perimeter' && s.key !== 'area');
        if (herleitung.length) {
            abschnitte.push(abschnitt('Fehlende Seiten, Winkel und Höhen', herleitung.flatMap(s => s.elemente)));
        }
        abschnitte.push(abschnitt('Umfang u', mitErgebnis(schritte.find(s => s.key === 'perimeter').elemente)));
        abschnitte.push(abschnitt('Flächeninhalt A', mitErgebnis(schritte.find(s => s.key === 'area').elemente)));

        return {
            schritte,
            abschnitte,
            html: schritteZuHtml(FIGUR, gegebenKanonisch(norm), abschnitte, { ...EINHEIT_DEFAULT, laenge: unit })
        };
    }

    // -------------------------------------------------------------------------
    // Gemeinsamer Rechenkern: Eingaben prüfen, Dreieck(e) lösen, Eindeutigkeit prüfen
    // -------------------------------------------------------------------------
    function loeseIntern(inputs, options = {}) {
        const normOpts = normalizeOptions(options);
        const norm = normalizeInputs(inputs);
        const givenKeys = Object.keys(norm);

        if (givenKeys.length < 3) {
            throw new Error('Bitte mindestens 3 Bestimmungsstücke (Seiten, Winkel oder eine Höhe) angeben.');
        }

        // Strikte Prüfung der Höhen-Einschränkungen
        validateHeightRules(norm);

        // Höhen-Beziehung auflösen (falls 1 Höhe gegeben)
        const { states: expandedStates, error: heightError } = expandHeight(norm);

        // Konnte die Höhe nicht aufgelöst werden, ist deren Fehlermeldung die aussagekräftigste
        // (sonst würde sie von der allgemeinen Meldung "Unzureichende Angaben" überschrieben).
        if (heightError && expandedStates.length === 1 && expandedStates[0] === norm) {
            throw heightError;
        }

        // Für jeden expandierten Zustand das Kerndreieck lösen
        let allSolutions = [];
        let lastError = heightError;

        for (const state of expandedStates) {
            try {
                const coreResults = solveCoreTriangle(state);
                allSolutions.push(...coreResults);
            } catch (err) {
                lastError = err;
            }
        }

        // Gegen alle ursprünglich eingegebenen Werte validieren & Duplikate entfernen
        allSolutions = deduplicateSolutions(allSolutions.filter(sol => matchesInputs(sol, norm)));

        if (allSolutions.length === 0) {
            throw lastError || new Error('Mit diesen Angaben existiert kein gültiges Dreieck (Widerspruch in den Daten).');
        }

        const isUnique = allSolutions.length === 1;

        if (!isUnique && !normOpts.allowAmbiguous) {
            throw new Error(
                `Das Dreieck ist mit diesen Angaben nicht eindeutig bestimmt (es existieren ${allSolutions.length} mögliche Lösungen, z. B. SsW-Fall).`
            );
        }

        return { normOpts, norm, givenKeys, allSolutions, isUnique };
    }

    function gegebenKanonisch(norm) {
        return Object.fromEntries(Object.entries(norm).map(([k, v]) => [KANONISCH[k] ?? k, v]));
    }

    function masseKanonisch(sol) {
        return { a: sol.a, b: sol.b, c: sol.c, alpha: sol.al, beta: sol.be, gamma: sol.ga, ha: sol.ha, hb: sol.hb, hc: sol.hc };
    }

    // -------------------------------------------------------------------------
    // Öffentliche Hauptfunktion im einheitlichen Solver-Format: berechneDreieck(masse, optionen)
    // -------------------------------------------------------------------------
    function berechneDreieck(masse, optionen = {}) {
        if (!masse || typeof masse !== 'object') {
            throw new Error('Die Dreiecksmaße müssen als Objekt mit positiven Zahlen übergeben werden.');
        }
        if (!optionen || typeof optionen !== 'object') {
            throw new Error('Die Optionen müssen als Objekt übergeben werden.');
        }
        const einheit = optionen.einheit ?? EINHEIT_DEFAULT;
        if (!einheit || typeof einheit !== 'object') {
            throw new Error('Die Einheit muss als Objekt { laenge, flaeche, volumen } übergeben werden.');
        }

        const { normOpts, norm, givenKeys, allSolutions, isUnique } = loeseIntern(masse, {
            unit: einheit.laenge ?? '',
            decimals: optionen.stellen,
            allowAmbiguous: optionen.mehrdeutigErlaubt
        });

        const gegeben = gegebenKanonisch(norm);
        const loesungen = allSolutions.map(sol => {
            const { abschnitte, html } = buildSchritte(sol, givenKeys, normOpts, norm);
            return {
                figur: FIGUR,
                bezeichnung: BEZEICHNUNG,
                einheit,
                gegeben,
                masse: masseKanonisch(sol),
                umfang: sol.perimeter,
                flaecheninhalt: sol.area,
                schritte: abschnitte,
                html
            };
        });

        return { ...loesungen[0], eindeutig: isUnique, anzahlLoesungen: loesungen.length, loesungen };
    }

    // -------------------------------------------------------------------------
    // Veraltet: solve(inputs, { unit, decimals, allowAmbiguous }) – nur für den Übergang
    // -------------------------------------------------------------------------
    function solve(inputs, options = {}) {
        const { normOpts, norm, givenKeys, allSolutions, isUnique } = loeseIntern(inputs, options);

        // Formatiere jede Lösung inkl. Lösungsweg
        const formattedSolutions = allSolutions.map(sol => {
            const steps = buildSolutionSteps(sol, givenKeys, normOpts);
            const { schritte, abschnitte, html } = buildSchritte(sol, givenKeys, normOpts, norm);
            const dec = normOpts.decimals;
            const unit = normOpts.unit;

            const values = {
                a: sol.a, b: sol.b, c: sol.c,
                al: sol.al, alpha: sol.al,
                be: sol.be, beta: sol.be,
                ga: sol.ga, gamma: sol.ga,
                ha: sol.ha, hb: sol.hb, hc: sol.hc,
                perimeter: sol.perimeter, u: sol.perimeter,
                area: sol.area, A: sol.area
            };

            const formatted = {};
            for (const [k, v] of Object.entries(values)) {
                const isAng = ['al', 'alpha', 'be', 'beta', 'ga', 'gamma'].includes(k);
                const isAr = ['area', 'A'].includes(k);
                const uStr = isAng ? '°' : (isAr ? (unit ? `${unit}²` : '') : unit);
                formatted[k] = fmt(v, dec, ',') + (uStr ? (isAng ? '°' : ` ${uStr}`) : '');
            }

            return {
                values,
                formatted,
                steps,
                schritte,
                abschnitte,
                html,
                given: givenKeys
            };
        });

        // Rückgabeobjekt kompatibel für Einzel- und Mehrfachlösungen
        const primary = formattedSolutions[0];
        return {
            unique: isUnique,
            solutionCount: formattedSolutions.length,
            ...primary,
            solutions: formattedSolutions
        };
    }

    return {
        berechneDreieck,
        schritteZuHtml,
        solve,
        normalizeInputs,
        normalizeOptions,
        buildSolutionSteps,
        buildSchritte,
        ALLOWED_UNITS,
        EINHEIT_DEFAULT,
        LABELS,
        TEX_NAMES
    };
}));
