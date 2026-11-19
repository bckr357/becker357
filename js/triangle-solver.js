/**
 * TriangleSolver
 * JavaScript-Interface für alle Dreiecksberechnungen inkl. ausführlichem Lösungsweg.
 *
 * Berechnet aus mindestens 3 gegebenen Bestimmungsstücken (Seiten a, b, c; Winkel α, β, γ;
 * Höhen h_a, h_b, h_c) alle fehlenden Werte sowie Umfang und Flächeninhalt inklusive
 * didaktisch aufbereitetem Lösungsweg (inkl. Prüfung auf Eindeutigkeit).
 *
 * Wird im Browser über window.MTGTriangleSolver bereitgestellt.
 */

(function (root, factory) {
    const exported = factory();
    root.MTGTriangleSolver = exported;
}(typeof window !== 'undefined' ? window : this, function () {

    const DEG_TO_RAD = Math.PI / 180;
    const RAD_TO_DEG = 180 / Math.PI;
    const EPS = 1e-7;

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

    // Zuordnung: Höhe -> [ [Seite1, gegenüberliegender Winkel zu Höhe in diesem Teildreieck], ... ]
    // Denn h_a = b * sin(gamma) = c * sin(beta)
    const HP = {
        ha: [['b', 'ga'], ['c', 'be']],
        hb: [['a', 'ga'], ['c', 'al']],
        hc: [['a', 'be'], ['b', 'al']]
    };
    const HS = { ha: 'a', hb: 'b', hc: 'c' };

    // -------------------------------------------------------------------------
    // Eingaben normalisieren & validieren
    // -------------------------------------------------------------------------
    function normalizeInputs(inputs) {
        const norm = {};
        if (!inputs || typeof inputs !== 'object') return norm;

        for (const [rawKey, rawVal] of Object.entries(inputs)) {
            if (rawVal == null || rawVal === '') continue;
            let val;
            if (typeof rawVal === 'string') {
                const sanitized = rawVal.trim().replace(',', '.').replace(/°$/, '');
                val = Number(sanitized);
            } else {
                val = Number(rawVal);
            }
            if (!isFinite(val)) {
                throw new Error(`Ungültiger Zahlenwert für "${rawKey}".`);
            }
            if (val <= 0) {
                throw new Error(`Der Wert für "${rawKey}" muss größer als 0 sein.`);
            }

            const k = rawKey.trim().toLowerCase();
            if (['α', 'al', 'alpha'].includes(k)) norm.al = val;
            else if (['β', 'be', 'beta'].includes(k)) norm.be = val;
            else if (['γ', 'ga', 'gamma'].includes(k)) norm.ga = val;
            else if (['h_a', 'ha'].includes(k)) norm.ha = val;
            else if (['h_b', 'hb'].includes(k)) norm.hb = val;
            else if (['h_c', 'hc'].includes(k)) norm.hc = val;
            else if (['a', 'b', 'c'].includes(k)) norm[k] = val;
        }

        for (const ak of ['al', 'be', 'ga']) {
            if (norm[ak] != null && (norm[ak] <= 0 || norm[ak] >= 180)) {
                throw new Error(`Winkel ${LABELS[ak]} muss zwischen 0° und 180° liegen.`);
            }
        }

        return norm;
    }

    // -------------------------------------------------------------------------
    // Höhenbeziehungen auflösen (liefert alle möglichen Zwischenzustände)
    // -------------------------------------------------------------------------
    function expandHeights(v) {
        let list = [{ ...v }];

        for (let pass = 0; pass < 8; pass++) {
            let changed = false;
            const nextList = [];

            for (const w of list) {
                const hk = ['ha', 'hb', 'hc'].filter(k => w[k] != null);

                // Spezialfall 1: Alle 3 Höhen gegeben (keine Seiten)
                if (hk.length === 3 && w.a == null && w.b == null && w.c == null) {
                    const r = [1 / w.ha, 1 / w.hb, 1 / w.hc];
                    const S = r[0] + r[1] + r[2];
                    const P = S * (S - 2 * r[0]) * (S - 2 * r[1]) * (S - 2 * r[2]);
                    if (P <= 1e-12) {
                        throw new Error('Mit diesen drei Höhen kann kein Dreieck gebildet werden (Dreiecksungleichung für Kehrwerte verletzt).');
                    }
                    const T = 1 / Math.sqrt(P);
                    nextList.push({ ...w, a: 2 * T * r[0], b: 2 * T * r[1], c: 2 * T * r[2] });
                    changed = true;
                    continue;
                }

                // Spezialfall 2: 2 Höhen und der Winkel zwischen den zugehörigen Seiten (z. B. ha, hb, ga)
                // Dann ist ha = b * sin(ga) und hb = a * sin(ga) -> wird bereits von der allgemeinen Schleife erfasst!
                // Spezialfall 3: 2 Höhen (z. B. ha, hb) und ein anderer Winkel (z. B. al oder be):
                // Aus a * ha = b * hb folgt a / b = hb / ha => sin(al) / sin(be) = hb / ha.
                if (hk.length === 2 && w.a == null && w.b == null && w.c == null) {
                    const [h1, h2] = hk;
                    const s1 = HS[h1]; // z. B. 'a'
                    const s2 = HS[h2]; // z. B. 'b'
                    const a1 = s1 === 'a' ? 'al' : (s1 === 'b' ? 'be' : 'ga');
                    const a2 = s2 === 'a' ? 'al' : (s2 === 'b' ? 'be' : 'ga');

                    // Wenn a1 bekannt, aber a2 nicht -> sin(a2) = (h1 / h2) * sin(a1)
                    if (w[a1] != null && w[a2] == null) {
                        const q = (w[h1] / w[h2]) * Math.sin(w[a1] * DEG_TO_RAD);
                        if (q > 1 + 1e-9) {
                            throw new Error('Mit diesen Höhen und diesem Winkel existiert kein Dreieck.');
                        }
                        const ang1 = Math.asin(Math.min(1, q)) * RAD_TO_DEG;
                        if (w[a1] + ang1 < 180 - 1e-6) {
                            nextList.push({ ...w, [a2]: ang1 });
                        }
                        if (q < 1 - 1e-9) {
                            const ang2 = 180 - ang1;
                            if (w[a1] + ang2 < 180 - 1e-6) {
                                nextList.push({ ...w, [a2]: ang2 });
                            }
                        }
                        changed = true;
                        continue;
                    }
                    if (w[a2] != null && w[a1] == null) {
                        const q = (w[h2] / w[h1]) * Math.sin(w[a2] * DEG_TO_RAD);
                        if (q > 1 + 1e-9) {
                            throw new Error('Mit diesen Höhen und diesem Winkel existiert kein Dreieck.');
                        }
                        const ang1 = Math.asin(Math.min(1, q)) * RAD_TO_DEG;
                        if (w[a2] + ang1 < 180 - 1e-6) {
                            nextList.push({ ...w, [a1]: ang1 });
                        }
                        if (q < 1 - 1e-9) {
                            const ang2 = 180 - ang1;
                            if (w[a2] + ang2 < 180 - 1e-6) {
                                nextList.push({ ...w, [a1]: ang2 });
                            }
                        }
                        changed = true;
                        continue;
                    }
                }

                // Spezialfall 4: Eine Höhe (z.B. ha), die zugehörige Seite (a) und noch eine Seite (b) oder Winkel (al)
                // Falls ha, a und b bekannt: hc oder hb? Nein: Aus ha und b folgt sin(ga) = ha/b (wird unten erledigt).
                // Was wenn ha, a und al bekannt? (Höhe, Grundseite und gegenüberliegender Winkel -> 2 Lösungen möglich!)
                for (const hx of hk) {
                    const sx = HS[hx]; // z. B. 'a'
                    const ax = sx === 'a' ? 'al' : (sx === 'b' ? 'be' : 'ga'); // 'al'
                    const [otherS1, otherS2] = ['a', 'b', 'c'].filter(s => s !== sx);

                    if (w[sx] != null && w[ax] != null && w[otherS1] == null && w[otherS2] == null) {
                        // Fläche A = 0.5 * a * ha = 0.5 * b * c * sin(al) => b * c = (a * ha) / sin(al)
                        // Kosinussatz: a^2 = b^2 + c^2 - 2*b*c*cos(al) = (b + c)^2 - 2*b*c*(1 + cos(al))
                        // => (b + c)^2 = a^2 + 2*b*c*(1 + cos(al))
                        // und (b - c)^2 = a^2 - 2*b*c*(1 - cos(al))
                        const sinA = Math.sin(w[ax] * DEG_TO_RAD);
                        const cosA = Math.cos(w[ax] * DEG_TO_RAD);
                        const bc = (w[sx] * w[hx]) / sinA;
                        const sumSq = w[sx] * w[sx] + 2 * bc * (1 + cosA);
                        const diffSq = w[sx] * w[sx] - 2 * bc * (1 - cosA);

                        if (diffSq < -1e-7) {
                            throw new Error(`Mit ${LABELS[hx]}, ${LABELS[sx]} und ${LABELS[ax]} existiert kein Dreieck (Höhe ist zu groß für diesen Winkel).`);
                        }
                        const sum = Math.sqrt(Math.max(0, sumSq));
                        const diff = Math.sqrt(Math.max(0, diffSq));

                        const sVal1 = 0.5 * (sum + diff);
                        const sVal2 = 0.5 * (sum - diff);

                        if (sVal1 > 1e-7 && sVal2 > 1e-7) {
                            nextList.push({ ...w, [otherS1]: sVal1, [otherS2]: sVal2 });
                            if (diff > 1e-5) {
                                // Symmetrische zweite Lösung (b und c vertauscht)
                                nextList.push({ ...w, [otherS1]: sVal2, [otherS2]: sVal1 });
                            }
                            changed = true;
                            break;
                        }
                    }
                }
                if (changed && nextList.length > 0) continue;

                let w2 = null;
                let branched = false;

                for (const hx of hk) {
                    const sx = HS[hx];

                    // 1. Flächeninvarianz: a * ha = b * hb = c * hc
                    for (const hy of hk) {
                        if (hy === hx) continue;
                        const sy = HS[hy];
                        if (w[sx] != null && w[sy] == null) {
                            w2 = { ...w, [sy]: (w[sx] * w[hx]) / w[hy] };
                            break;
                        }
                    }
                    if (w2) break;

                    // 2. Rechtwinkliges Teildreieck: h_a = b * sin(gamma) = c * sin(beta)
                    for (const [S, A] of HP[hx]) {
                        if (w[S] != null && w[A] == null) {
                            const q = w[hx] / w[S];
                            if (q > 1 + 1e-9) {
                                throw new Error(`Mit diesen Angaben gibt es kein Dreieck (${LABELS[hx]} ist größer als ${LABELS[S]}).`);
                            }
                            const a1 = Math.asin(Math.min(1, q)) * RAD_TO_DEG;
                            nextList.push({ ...w, [A]: a1 });
                            if (q < 1 - 1e-9) {
                                nextList.push({ ...w, [A]: 180 - a1 });
                            }
                            changed = true;
                            branched = true;
                            break;
                        }
                        if (w[A] != null && w[S] == null) {
                            w2 = { ...w, [S]: w[hx] / Math.sin(w[A] * DEG_TO_RAD) };
                            break;
                        }
                    }
                    if (branched || w2) break;
                }

                if (branched) continue;
                if (w2) {
                    nextList.push(w2);
                    changed = true;
                } else {
                    nextList.push(w);
                }
            }

            list = nextList.slice(0, 16);
            if (!changed) break;
        }
        return list;
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
                throw new Error('Die Winkelsumme im Dreieck muss exakt 180° betragen.');
            }
        } else if (numAngles === 3) {
            const sum = angles[0] + angles[1] + angles[2];
            if (Math.abs(sum - 180) > 0.05) {
                throw new Error(`Die Winkelsumme der Winkel beträgt ${fmt(sum, 2)}°, muss aber 180° ergeben.`);
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
                throw new Error('Drei Winkel (WWW) allein legen die Größe des Dreiecks nicht eindeutig fest – bitte mindestens eine Seite oder Höhe angeben.');
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
            throw new Error('Unzureichende oder nicht eindeutige Angaben. Bitte mindestens 3 Bestimmungsstücke (z. B. SSS, SWS, WSW, WWS, SsW oder mit Höhen) angeben.');
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
    // -------------------------------------------------------------------------
    function buildSolutionSteps(val, givenKeys, options = {}) {
        const unit = options.unit || '';
        const dec = options.decimals != null ? options.decimals : 2;

        const known = new Set(givenKeys);
        const steps = [];

        const SK = ['a', 'b', 'c'];
        const AK = ['al', 'be', 'ga'];
        const HK = ['ha', 'hb', 'hc'];

        const L = k => TEX_NAMES[k] || k;
        const sv = k => fmtL(val[k], dec) + unitL(unit);
        const av = k => fmtL(val[k], dec) + '^\\circ';

        // 0. Sonderfall: Alle 3 Höhen gegeben, keine Seite bekannt -> Heron-Variante über Höhen
        if (HK.every(h => known.has(h)) && SK.every(s => !known.has(s))) {
            const r = [1 / val.ha, 1 / val.hb, 1 / val.hc];
            const S = r[0] + r[1] + r[2];
            const P = S * (S - 2 * r[0]) * (S - 2 * r[1]) * (S - 2 * r[2]);
            const areaVal = 1 / Math.sqrt(P);

            steps.push({
                key: 'area_from_heights',
                targetKey: 'area',
                prio: -1,
                formula: 'A = \\frac{1}{\\sqrt{\\left(\\frac{1}{h_a}+\\frac{1}{h_b}+\\frac{1}{h_c}\\right)\\left(\\frac{1}{h_b}+\\frac{1}{h_c}-\\frac{1}{h_a}\\right)\\left(\\frac{1}{h_a}+\\frac{1}{h_c}-\\frac{1}{h_b}\\right)\\left(\\frac{1}{h_a}+\\frac{1}{h_b}-\\frac{1}{h_c}\\right)}}',
                substituted: `A = \\frac{1}{\\sqrt{\\left(\\frac{1}{${sv('ha')}}+\\frac{1}{${sv('hb')}}+\\frac{1}{${sv('hc')}}\\right) \\cdots}}`,
                explanation: 'Berechnung des Flächeninhalts $A$ aus allen drei gegebenen Höhen über die verallgemeinerte Heronsche Formel.'
            });

            for (const [sKey, hKey] of [['a', 'ha'], ['b', 'hb'], ['c', 'hc']]) {
                known.add(sKey);
                steps.push({
                    key: sKey,
                    prio: 0,
                    formula: `${L(sKey)} = \\frac{2 \\cdot A}{${L(hKey)}}`,
                    substituted: `${L(sKey)} = \\frac{2 \\cdot ${fmtL(areaVal, dec)}${unit2L(unit)}}{${sv(hKey)}}`,
                    explanation: `Berechnung der Seite $${L(sKey)}$ aus dem Flächeninhalt $A$ und der zugehörigen Höhe $${L(hKey)}$.`
                });
            }
        }

        // 1. Iteratives Ableiten aller Seiten, Winkel und Höhen
        for (let round = 0; round < 16; round++) {
            const allBaseSolved = [...SK, ...AK, ...HK].every(k => known.has(k));
            if (allBaseSolved) break;

            const candidates = [];
            const rightAngleIdx = AK.findIndex(k => Math.abs(val[k] - 90) < 0.01);
            const isRightAngledKnown = rightAngleIdx >= 0 && known.has(AK[rightAngleIdx]);

            // A) Höhen-Beziehungen prüfen (Priorität 0 - 1)
            for (const hx of HK) {
                const sx = HS[hx];

                // A1: Flächeninvarianz a * ha = b * hb = c * hc
                for (const hy of HK) {
                    if (hy === hx) continue;
                    const sy = HS[hy];
                    if (known.has(hx) && known.has(hy) && known.has(sx) && !known.has(sy)) {
                        candidates.push({
                            key: sy,
                            prio: 0,
                            formula: `${L(sy)} = \\frac{${L(sx)} \\cdot ${L(hx)}}{${L(hy)}}`,
                            substituted: `${L(sy)} = \\frac{${sv(sx)} \\cdot ${sv(hx)}}{${sv(hy)}}`,
                            explanation: `Berechnung der Seite $${L(sy)}$ über die Flächengleichheit ($${L(sx)} \\cdot ${L(hx)} = ${L(sy)} \\cdot ${L(hy)}$).`
                        });
                    }
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
                        const qStr = fmtL(val[hx] / val[S], dec + 2);
                        const isObtuse = val[A] > 90.0001;
                        candidates.push({
                            key: A,
                            prio: 1,
                            formula: `\\sin(${L(A)}) = \\frac{${L(hx)}}{${L(S)}}`,
                            substituted: `\\sin(${L(A)}) = \\frac{${sv(hx)}}{${sv(S)}} = ${qStr} \\implies ${L(A)} = ${isObtuse ? '180^\\circ - ' : ''}\\arcsin(${qStr})`,
                            explanation: `Berechnung des Winkels $${L(A)}$ im rechtwinkligen Teildreieck über $\\sin(${L(A)}) = \\frac{${L(hx)}}{${L(S)}}$.`
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
                            const ratioStr = fmtL(val[opp] / val[hyp], dec + 2);
                            candidates.push({
                                key: k,
                                prio: 1,
                                formula: `\\sin(${L(k)}) = \\frac{${L(opp)}}{${L(hyp)}}`,
                                substituted: `\\sin(${L(k)}) = \\frac{${sv(opp)}}{${sv(hyp)}} = ${ratioStr} \\implies ${L(k)} = \\arcsin(${ratioStr})`,
                                explanation: `Berechnung des Winkels $${L(k)}$ mit dem Sinus im rechtwinkligen Dreieck.`
                            });
                        } else if (known.has(adj) && known.has(hyp)) {
                            const ratioStr = fmtL(val[adj] / val[hyp], dec + 2);
                            candidates.push({
                                key: k,
                                prio: 1,
                                formula: `\\cos(${L(k)}) = \\frac{${L(adj)}}{${L(hyp)}}`,
                                substituted: `\\cos(${L(k)}) = \\frac{${sv(adj)}}{${sv(hyp)}} = ${ratioStr} \\implies ${L(k)} = \\arccos(${ratioStr})`,
                                explanation: `Berechnung des Winkels $${L(k)}$ mit dem Kosinus im rechtwinkligen Dreieck.`
                            });
                        } else if (known.has(opp) && known.has(adj)) {
                            const ratioStr = fmtL(val[opp] / val[adj], dec + 2);
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
                                const qStr = fmtL(sinVal, dec + 2);
                                const isObtuse = val[k] > 90.0001;
                                candidates.push({
                                    key: k,
                                    prio: 2,
                                    formula: `\\sin(${L(k)}) = \\frac{${L(SK[i])} \\cdot \\sin(${L(AK[j])})}{${L(SK[j])}}`,
                                    substituted: `\\sin(${L(k)}) = \\frac{${sv(SK[i])} \\cdot \\sin(${av(AK[j])})}{${sv(SK[j])}} = ${qStr} \\implies ${L(k)} = ${isObtuse ? '180^\\circ - ' : ''}\\arcsin(${qStr})`,
                                    explanation: `Berechnung des Winkels $${L(k)}$ mithilfe des Sinussatzes.`
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
                        const qStr = fmtL(cosVal, dec + 2);
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

        // Fallback: Falls durch einen Spezialfall (z. B. ha, a, al) eine Seite noch nicht im Step-Protokoll ist
        for (const skKey of SK) {
            if (!known.has(skKey)) {
                known.add(skKey);
                steps.push({
                    key: skKey,
                    prio: 3,
                    formula: '',
                    substituted: `${L(skKey)} = ${sv(skKey)}`,
                    explanation: `Bestimmung der Seite $${L(skKey)}$ aus den Höhen- und Winkelbeziehungen.`
                });
            }
        }
        for (const akKey of AK) {
            if (!known.has(akKey)) {
                known.add(akKey);
                const i = AK.indexOf(akKey);
                const s1 = SK[i], s2 = SK[(i + 1) % 3], s3 = SK[(i + 2) % 3];
                const cosVal = Math.cos(val[akKey] * DEG_TO_RAD);
                const qStr = fmtL(cosVal, dec + 2);
                steps.push({
                    key: akKey,
                    prio: 3,
                    formula: `\\cos(${L(akKey)}) = \\frac{${L(s2)}^2 + ${L(s3)}^2 - ${L(s1)}^2}{2 \\cdot ${L(s2)} \\cdot ${L(s3)}}`,
                    substituted: `\\cos(${L(akKey)}) = \\frac{(${sv(s2)})^2 + (${sv(s3)})^2 - (${sv(s1)})^2}{2 \\cdot ${sv(s2)} \\cdot ${sv(s3)}} = ${qStr} \\implies ${L(akKey)} = \\arccos(${qStr})`,
                    explanation: `Berechnung des Winkels $${L(akKey)}$ mithilfe des Kosinussatzes.`
                });
            }
        }
        for (const [hKey, sKey, aKey] of [['ha', 'b', 'ga'], ['hb', 'a', 'ga'], ['hc', 'b', 'al']]) {
            if (!known.has(hKey)) {
                known.add(hKey);
                steps.push({
                    key: hKey,
                    prio: 4,
                    formula: `${L(hKey)} = ${L(sKey)} \\cdot \\sin(${L(aKey)})`,
                    substituted: `${L(hKey)} = ${sv(sKey)} \\cdot \\sin(${av(aKey)})`,
                    explanation: `Berechnung der Höhe $${L(hKey)}$ über das rechtwinklige Teildreieck.`
                });
            }
        }

        // 2. Umfang (perimeter / u)
        steps.push({
            key: 'perimeter',
            prio: 5,
            formula: 'u = a + b + c',
            substituted: `u = ${sv('a')} + ${sv('b')} + ${sv('c')}`,
            explanation: 'Der Umfang $u$ ist die Summe aller drei Seitenlängen.'
        });

        // 3. Flächeninhalt (area / A) – bevorzugt mit einer ursprünglich gegebenen Höhe oder c * hc
        let areaBase = 'c', areaHeight = 'hc';
        if (givenKeys.includes('ha')) { areaBase = 'a'; areaHeight = 'ha'; }
        else if (givenKeys.includes('hb')) { areaBase = 'b'; areaHeight = 'hb'; }

        steps.push({
            key: 'area',
            prio: 6,
            formula: `A = \\frac{1}{2} \\cdot ${areaBase} \\cdot ${TEX_NAMES[areaHeight]}`,
            substituted: `A = \\frac{1}{2} \\cdot ${sv(areaBase)} \\cdot ${sv(areaHeight)}`,
            explanation: `Der Flächeninhalt $A$ wird mit der Grundseite $${areaBase}$ und der zugehörigen Höhe $${TEX_NAMES[areaHeight]}$ berechnet.`
        });

        // Finales Aufbereiten aller Steps mit formatierter LaTeX-Ausgabe & Ergebnissen
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
    // Öffentliche Hauptfunktion: solve(inputs, options)
    // -------------------------------------------------------------------------
    function solve(inputs, options = {}) {
        const allowAmbiguous = Boolean(options.allowAmbiguous);
        const norm = normalizeInputs(inputs);
        const givenKeys = Object.keys(norm);

        if (givenKeys.length < 3) {
            throw new Error('Bitte mindestens 3 Bestimmungsstücke (Seiten, Winkel oder Höhen) angeben.');
        }

        // Höhen-Beziehungen expandieren
        const expandedStates = expandHeights(norm);

        // Für jeden expandierten Zustand das Kerndreieck lösen
        let allSolutions = [];
        let lastError = null;

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

        if (!isUnique && !allowAmbiguous) {
            throw new Error(
                `Das Dreieck ist mit diesen Angaben nicht eindeutig bestimmt (es existieren ${allSolutions.length} mögliche Lösungen, z. B. SsW-Fall).`
            );
        }

        // Formatiere jede Lösung inkl. Lösungsweg
        const formattedSolutions = allSolutions.map(sol => {
            const steps = buildSolutionSteps(sol, givenKeys, options);
            const dec = options.decimals != null ? options.decimals : 2;
            const unit = options.unit || '';

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
        solve,
        normalizeInputs,
        buildSolutionSteps,
        LABELS,
        TEX_NAMES
    };
}));
