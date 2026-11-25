/**
 * Geschlossenes Berechnungsmodul für geometrische Körper.
 *
 * Eingaben (Längen positiv, Winkel alpha in Grad; es muss genau EINE Variante vollständig angegeben werden):
 * - Würfel (`wuerfel`):        { a }  |  { V }
 * - Quader (`quader`):         { a, b, c }  |  { a, b, V }  (V -> c)
 * - Pyramide (`pyramide`):     { a, b, h }  |  { a, b, ha }  |  { a, b, hb }  |  { a, b, s }  |  { a, b, V }
 *                              ha/hb = Höhe der Seitenfläche über Kante a/b, s = Seitenkante, V -> h
 * - Kreiskegel (`kegel`):      { r, h }  |  { r, s }  |  { r, V }   (s = Mantellinie, V -> h)
 * - Kreiszylinder (`zylinder`):{ r, h }  |  { r, V }                (V -> h)
 * - Hohlzylinder (`hohlzylinder`):       { r, R, h }
 * - Kreiskegelstumpf (`kegelstumpf`):    { r, R, h }
 * - Pyramidenstumpf (`pyramidenstumpf`): { a1, b1, a2, b2, h } | { a1, a2, h } | { A1, A2, h }
 * - Prisma (`prisma`) mit Grundflächen (Höhe h immer zusätzlich):
 *     `al` Allgemeines Dreieck (folgt über dreieck_solver, noch nicht implementiert)
 *     `pa` Parallelogramm { a, b, ha } | { a, b, alpha }
 *     `tr` Gleichschenkliges Trapez { a, c, ha } | { a, c, alpha }
 *     `ra` Raute { e, f } | { a, alpha }
 * - Kugel (`kugel`):           { r }
 */

const GRUNDFLAECHEN_NAMEN = {
  al: 'Allgemeines Dreieck',
  pa: 'Parallelogramm',
  tr: 'Gleichschenkliges Trapez',
  ra: 'Raute'
};

const KOERPER_META = {
  wuerfel: { name: 'Würfel', genitiv: 'des Würfels' },
  quader: { name: 'Quader', genitiv: 'des Quaders' },
  pyramide: { name: 'Pyramide', genitiv: 'der Pyramide' },
  kegel: { name: 'Kreiskegel', genitiv: 'des Kreiskegels' },
  zylinder: { name: 'Kreiszylinder', genitiv: 'des Kreiszylinders' },
  hohlzylinder: { name: 'Hohlzylinder', genitiv: 'des Hohlzylinders' },
  kegelstumpf: { name: 'Kreiskegelstumpf', genitiv: 'des Kreiskegelstumpfes' },
  pyramidenstumpf: { name: 'Pyramidenstumpf', genitiv: 'des Pyramidenstumpfes' },
  prisma: { name: 'Prisma', genitiv: 'des Prismas' },
  kugel: { name: 'Kugel', genitiv: 'der Kugel' }
};

function runde(x, stellen = 2) {
  const f = 10 ** stellen;
  return Math.round(x * f) / f;
}

function fmtZahl(x, stellen = 2) {
  return runde(x, stellen).toLocaleString('de-DE', { maximumFractionDigits: stellen });
}

const EINHEIT_DEFAULT = { laenge: 'cm', flaeche: 'cm²', volumen: 'cm³' };

let AKTUELE_EINHEIT = EINHEIT_DEFAULT;

let MTGTriangleSolver;
if (typeof window !== 'undefined') {
  MTGTriangleSolver = window.MTGTriangleSolver;
} else if (typeof require === 'function') {
  try {
    MTGTriangleSolver = require('./triangle-solver').MTGTriangleSolver;
  } catch {
    MTGTriangleSolver = undefined;
  }
}

function setEinheit(einheit) {
  AKTUELE_EINHEIT = einheit;
}

function fmtLaenge(x, stellen = 2) {
  return fmtWert(x, AKTUELE_EINHEIT.laenge, stellen);
}

function fmtFlaeche(x, stellen = 2) {
  return fmtWert(x, AKTUELE_EINHEIT.flaeche, stellen);
}

function fmtVolumen(x, stellen = 2) {
  return fmtWert(x, AKTUELE_EINHEIT.volumen, stellen);
}

function fmtWert(x, einheit, stellen = 2) {
  const istApprox = Math.abs(runde(x,stellen) - x) > 1e-9;
  return `${istApprox ? '≈ ' : ''}${fmtZahl(x, stellen)} ${einheit}`;
}

function pruefePositiv(werte) {
  for (const [k, v] of Object.entries(werte)) {
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) {
      throw new Error(`Ungültiger Wert für "${k}": Erwartet wird eine positive Zahl.`);
    }
  }
}

const hatWert = (v) => v !== undefined && v !== null;
const rad = (g) => (g * Math.PI) / 180;
const grad = (r) => (r * 180) / Math.PI;

/**
 * Wählt anhand der vorhandenen Angaben genau eine Eingabevariante (Liste von Schlüsseln).
 * Fehler bei unvollständigen oder überbestimmten Angaben; prüft die gewählten Werte auf > 0.
 */
function waehleVariante(masse, varianten) {
  const passend = varianten.filter((v) => v.every((k) => hatWert(masse[k])));
  const liste = varianten.map((v) => v.join(', ')).join('  oder  ');
  if (passend.length === 0) {
    throw new Error(`Unvollständige Angaben. Erlaubt sind: ${liste}.`);
  }
  if (passend.length > 1) {
    throw new Error(`Die Angaben sind überbestimmt. Bitte genau eine Variante verwenden: ${liste}.`);
  }
  const variante = passend[0];
  pruefePositiv(Object.fromEntries(variante.map((k) => [k, masse[k]])));
  return variante;
}

function gegebenAus(masse, variante) {
  return Object.fromEntries(variante.map((k) => [k, masse[k]]));
}

function pruefeWinkel(name, w, max = 180) {
  if (!(w > 0 && w < max)) {
    throw new Error(`Ungültiger Wert für "${name}": Der Winkel muss zwischen 0° und ${max}° liegen.`);
  }
}

function span(klasse, inhalt) {
  return `<span class="${klasse}">${inhalt}</span>`;
}

const gVar = (s) => span('kg', s);
const gVal = (x) => span('kg', fmtLaenge(x));
const sVar = (s) => span('ks', s);
const sVal = (x) => span('ks', fmtLaenge(x));
const hVar = (s) => span('kh', s);
const hVal = (x) => span('kh', fmtLaenge(x));
const vVal = (x) => span('kg', fmtVolumen(x));

function eq(links, zeilen, ergebnisHervorheben = false) {
  return {
    typ: 'gleichung',
    links,
    zeilen: zeilen.map((roh, idx) => {
      const approx = /^≈/.test(roh);
      const ausdruck = approx ? roh.slice(1).trim() : roh;
      const istLetzte = idx === zeilen.length - 1;
      return {
        operator: approx ? '≈' : '=',
        ausdruck,
        ergebnis: Boolean(ergebnisHervorheben && istLetzte)
      };
    })
  };
}

function textSchritt(text) {
  return { typ: 'text', text };
}

function abschnitt(titel, elemente) {
  return { titel, elemente };
}

function baueErgebnis(koerper, gegeben, masse, volumen, oberflaecheninhalt, schritte, extra = {}) {
  return {
    koerper,
    bezeichnung: KOERPER_META[koerper]?.name ?? koerper,
    ...extra,
    gegeben,
    masse,
    volumen,
    oberflaecheninhalt,
    schritte,
    html: schritteZuHtml(koerper, gegeben, schritte, extra.grundflaeche, extra.einheit)
  };
}

function schritteZuHtml(koerper, gegeben, schritte, grundflaeche = null, einheit = EINHEIT_DEFAULT) {
  const meta = KOERPER_META[koerper] ?? { name: koerper };
  const titelZusatz =
    koerper === 'prisma' && grundflaeche
      ? ` (${GRUNDFLAECHEN_NAMEN[grundflaeche] ?? grundflaeche})`
      : '';

  const gegebenText = Object.entries(gegeben)
    .map(([k, v]) => {
      const name = {
        alpha: 'α', beta: 'β', gamma: 'γ',
        al: 'α', be: 'β', ga: 'γ',
        ha: 'h<sub>a</sub>', hb: 'h<sub>b</sub>', hc: 'h<sub>c</sub>'
      }[k] ?? k;
      const WINKEL_KEYS = ['alpha', 'beta', 'gamma', 'al', 'be', 'ga'];
      const u = k === 'V' ? einheit.volumen : WINKEL_KEYS.includes(k) ? '°' : einheit.laenge; 
      return `${name} = ${fmtWert(v, u)}`;
    })
    .join(', ');

  const secHtml = schritte
    .map((sec) => {
      const body = sec.elemente
        .map((el) => {
          if (el.typ === 'text') {
            return `<p class="st">${el.text}</p>`;
          }
          const rows = el.zeilen
            .map((z, i) => {
              const rhs = z.ergebnis ? `<span class="res">${z.ausdruck}</span>` : z.ausdruck;
              return `<tr><td class="l">${i === 0 ? el.links : ''}</td><td>${z.operator}</td><td>${rhs}</td></tr>`;
            })
            .join('');
          return `<table class="eq">${rows}</table>`;
        })
        .join('');
      return `<section class="sec"><h3>${sec.titel}</h3>${body}</section>`;
    })
    .join('');

  return `<h2 class="lw">Lösungsweg – ${meta.name}${titelZusatz}</h2><p class="st">Gegeben: ${gegebenText}</p>${secHtml}`;
}

/**
 * 1. Würfel
 * Gegeben: { a }
 */
function berechneWuerfel(masse, extra = {}) {
  const variante = waehleVariante(masse, [['a'], ['V']]);
  const ausVolumen = variante.includes('V');
  const a = ausVolumen ? Math.cbrt(masse.V) : masse.a;
  const herleitung = ausVolumen
    ? [
        abschnitt('Kantenlänge a aus dem Volumen', [
          eq(gVar('a'), [`∛${gVar('V')}`, `∛(${vVal(masse.V)})`, fmtLaenge(a)])
        ])
      ]
    : [];

  const grundflaecheFlaeche = a * a;
  const mantelflaeche = 4 * a * a;
  const oberflaecheninhalt = 6 * a * a;
  const volumen = ausVolumen ? masse.V : a ** 3;
  const flaechendiagonale = a * Math.SQRT2;
  const raumdiagonale = a * Math.sqrt(3);

  const schritte = [
    ...herleitung,
    abschnitt('Weitere Maße des Würfels', [
      textSchritt('Grundfläche, Mantelfläche und Diagonalen aus der Kantenlänge a'),
      eq(gVar('A<sub>G</sub>'), [gVar('a²'), `(${gVal(a)})²`, fmtFlaeche(grundflaecheFlaeche)]),
      eq(sVar('A<sub>M</sub>'), [`4 · ${gVar('a²')}`, `4 · (${gVal(a)})²`, fmtFlaeche(mantelflaeche)]),
      eq('d<sub>F</sub>', [`${gVar('a')} · √2`, `${gVal(a)} · √2`, fmtLaenge(flaechendiagonale)]),
      eq('d<sub>R</sub>', [`${gVar('a')} · √3`, `${gVal(a)} · √3`, fmtLaenge(raumdiagonale)])
    ]),
    abschnitt('Volumen V', [
      eq(
        'V',
        [
          gVar('a³'),
          `(${gVal(a)})³`,
          `${gVal(a)} · ${gVal(a)} · ${gVal(a)}`,
          fmtVolumen(volumen)
        ],
        true
      )
    ]),
    abschnitt('Oberflächeninhalt A<sub>O</sub>', [
      textSchritt('Der Würfel wird von 6 gleich großen Quadraten begrenzt.'),
      eq(
        'A<sub>O</sub>',
        [
          `6 · ${gVar('a²')}`,
          `6 · (${gVal(a)})²`,
          `6 · ${fmtZahl(grundflaecheFlaeche)} ${AKTUELE_EINHEIT.flaeche}`,
          fmtFlaeche(oberflaecheninhalt)
        ],
        true
      )
    ])
  ];

  return baueErgebnis(
    'wuerfel',
    gegebenAus(masse, variante),
    {
      a,
      grundflaeche: grundflaecheFlaeche,
      mantelflaeche,
      flaechendiagonale,
      raumdiagonale
    },
    volumen,
    oberflaecheninhalt,
    ausVolumen ? schritte.filter((s) => s.titel !== 'Volumen V') : schritte,
    extra
  );
}

/**
 * 2. Quader
 * Gegeben: { a, b, c }
 */
function berechneQuader(masse, extra = {}) {
  const variante = waehleVariante(masse, [['a', 'b', 'c'], ['a', 'b', 'V']]);
  const ausVolumen = variante.includes('V');
  const { a, b } = masse;
  const c = ausVolumen ? masse.V / (a * b) : masse.c;
  const herleitung = ausVolumen
    ? [
        abschnitt('Kantenlänge c aus dem Volumen', [
          textSchritt('Grundfläche'),
          eq(gVar('A<sub>G</sub>'), [`${gVar('a')} · ${gVar('b')}`, `${gVal(a)} · ${gVal(b)}`, fmtFlaeche(a * b)]),
          textSchritt('Aus V = A<sub>G</sub> · c folgt'),
          eq(hVar('c'), [
            `${gVar('V')} : ${gVar('A<sub>G</sub>')}`,
            `${vVal(masse.V)} : ${fmtFlaeche(a * b)}`,
            fmtLaenge(c)
          ])
        ])
      ]
    : [];

  const grundflaecheFlaeche = a * b;
  const umfangGrundflaeche = 2 * (a + b);
  const mantelflaeche = umfangGrundflaeche * c;
  const oberflaecheninhalt = 2 * (a * b + a * c + b * c);
  const volumen = ausVolumen ? masse.V : a * b * c;
  const raumdiagonale = Math.hypot(a, b, c);

  const schritte = [
    ...herleitung,
    abschnitt('Weitere Maße des Quaders', [
      textSchritt('Grundfläche, Umfang der Grundfläche, Mantelfläche und Raumdiagonale'),
      eq(gVar('A<sub>G</sub>'), [`${gVar('a')} · ${gVar('b')}`, `${gVal(a)} · ${gVal(b)}`, fmtFlaeche(grundflaecheFlaeche)]),
      eq(sVar('A<sub>M</sub>'), [
        `2 · (${gVar('a')} + ${gVar('b')}) · ${hVar('c')}`,
        `2 · (${gVal(a)} + ${gVal(b)}) · ${gVal(c)}`,
        fmtFlaeche(mantelflaeche)
      ]),
      eq('d', [
        `√(${gVar('a²')} + ${gVar('b²')} + ${hVar('c²')})`,
        `√(${fmtZahl(a * a)} ${AKTUELE_EINHEIT.flaeche} + ${fmtZahl(b * b)} ${AKTUELE_EINHEIT.flaeche} + ${fmtZahl(c * c)} ${AKTUELE_EINHEIT.flaeche})`,
        fmtLaenge(raumdiagonale)
      ])
    ]),
    abschnitt('Volumen V', [
      eq('V', [`${gVar('a')} · ${gVar('b')} · ${hVar('c')}`, `${gVal(a)} · ${gVal(b)} · ${gVal(c)}`, fmtVolumen(volumen)], true)
    ]),
    abschnitt('Oberflächeninhalt A<sub>O</sub>', [
      textSchritt('Der Quader hat drei Paare gleich großer Rechtecke.'),
      eq(
        'A<sub>O</sub>',
        [
          `2 · (${gVar('a')}·${gVar('b')} + ${gVar('a')}·${hVar('c')} + ${gVar('b')}·${hVar('c')})`,
          `2 · (${gVal(a)}·${gVal(b)} + ${gVal(a)}·${gVal(c)} + ${gVal(b)}·${gVal(c)})`,
          `2 · (${fmtZahl(a * b)} ${AKTUELE_EINHEIT.flaeche} + ${fmtZahl(a * c)} ${AKTUELE_EINHEIT.flaeche} + ${fmtZahl(b * c)} ${AKTUELE_EINHEIT.flaeche})`,
          `2 · ${fmtZahl(a * b + a * c + b * c)} ${AKTUELE_EINHEIT.flaeche}`,
          fmtFlaeche(oberflaecheninhalt)
        ],
        true
      )
    ])
  ];

  return baueErgebnis(
    'quader',
    gegebenAus(masse, variante),
    {
      a,
      b,
      c,
      grundflaeche: grundflaecheFlaeche,
      umfangGrundflaeche,
      mantelflaeche,
      raumdiagonale
    },
    volumen,
    oberflaecheninhalt,
    ausVolumen ? schritte.filter((s) => s.titel !== 'Volumen V') : schritte,
    extra
  );
}

/**
 * 3. Pyramide (rechteckige Grundfläche a × b, Höhe h)
 * Gegeben: { a, b, h }
 */
function berechnePyramide(masse, extra = {}) {
  const variante = waehleVariante(masse, [
    ['a', 'b', 'h'],
    ['a', 'b', 'ha'],
    ['a', 'b', 'hb'],
    ['a', 'b', 's'],
    ['a', 'b', 'V']
  ]);
  const { a, b } = masse;
  const ausVolumen = variante.includes('V');
  const FL = AKTUELE_EINHEIT.flaeche;
  let h;
  let herleitung = [];
  if (variante.includes('h')) {
    h = masse.h;
  } else if (variante.includes('ha')) {
    if (masse.ha <= b / 2) {
      throw new Error('Die Seitenhöhe ha muss größer sein als b/2.');
    }
    h = Math.sqrt(masse.ha * masse.ha - (b * b) / 4);
    herleitung = [
      abschnitt('Höhe h aus der Seitenhöhe h<sub>a</sub>', [
        textSchritt('Satz des Pythagoras im Dreieck aus h, b/2 und h<sub>a</sub>'),
        eq(hVar('h'), [
          `√(${sVar('h<sub>a</sub>²')} − (${gVar('b')}/2)²)`,
          `√((${sVal(masse.ha)})² − (${gVal(b / 2)})²)`,
          `√(${fmtZahl(masse.ha * masse.ha)} ${FL} − ${fmtZahl((b * b) / 4)} ${FL})`,
          fmtLaenge(h)
        ])
      ])
    ];
  } else if (variante.includes('hb')) {
    if (masse.hb <= a / 2) {
      throw new Error('Die Seitenhöhe hb muss größer sein als a/2.');
    }
    h = Math.sqrt(masse.hb * masse.hb - (a * a) / 4);
    herleitung = [
      abschnitt('Höhe h aus der Seitenhöhe h<sub>b</sub>', [
        textSchritt('Satz des Pythagoras im Dreieck aus h, a/2 und h<sub>b</sub>'),
        eq(hVar('h'), [
          `√(${sVar('h<sub>b</sub>²')} − (${gVar('a')}/2)²)`,
          `√((${sVal(masse.hb)})² − (${gVal(a / 2)})²)`,
          `√(${fmtZahl(masse.hb * masse.hb)} ${FL} − ${fmtZahl((a * a) / 4)} ${FL})`,
          fmtLaenge(h)
        ])
      ])
    ];
  } else if (variante.includes('s')) {
    if (masse.s <= Math.hypot(a, b) / 2) {
      throw new Error('Die Seitenkante s muss größer sein als die halbe Diagonale der Grundfläche.');
    }
    h = Math.sqrt(masse.s * masse.s - (a * a + b * b) / 4);
    herleitung = [
      abschnitt('Höhe h aus der Seitenkante s', [
        textSchritt('Satz des Pythagoras im Dreieck aus h, halber Grundflächendiagonale und s'),
        eq(hVar('h'), [
          `√(${sVar('s²')} − (${gVar('a')}/2)² − (${gVar('b')}/2)²)`,
          `√((${sVal(masse.s)})² − (${gVal(a / 2)})² − (${gVal(b / 2)})²)`,
          `√(${fmtZahl(masse.s * masse.s)} ${FL} − ${fmtZahl((a * a) / 4)} ${FL} − ${fmtZahl((b * b) / 4)} ${FL})`,
          fmtLaenge(h)
        ])
      ])
    ];
  } else {
    h = (3 * masse.V) / (a * b);
    herleitung = [
      abschnitt('Höhe h aus dem Volumen', [
        textSchritt('Grundfläche (Rechteck)'),
        eq(gVar('A<sub>G</sub>'), [`${gVar('a')} · ${gVar('b')}`, `${gVal(a)} · ${gVal(b)}`, fmtFlaeche(a * b)]),
        textSchritt('Aus V = ⅓ · A<sub>G</sub> · h folgt'),
        eq(hVar('h'), [
          `3 · ${gVar('V')} : ${gVar('A<sub>G</sub>')}`,
          `3 · ${vVal(masse.V)} : ${fmtFlaeche(a * b)}`,
          fmtLaenge(h)
        ])
      ])
    ];
  }

  const grundflaecheFlaeche = a * b;
  const ha = Math.hypot(h, b / 2);
  const hb = Math.hypot(h, a / 2);
  const seitenkante = Math.hypot(h, Math.hypot(a, b) / 2);
  const mantelflaeche = a * ha + b * hb;
  const oberflaecheninhalt = grundflaecheFlaeche + mantelflaeche;
  const volumen = ausVolumen ? masse.V : (grundflaecheFlaeche * h) / 3;

  const schritte = [
    ...herleitung,
    abschnitt('Volumen V', [
      textSchritt('Grundfläche (Rechteck)'),
      eq(gVar('A<sub>G</sub>'), [`${gVar('a')} · ${gVar('b')}`, `${gVal(a)} · ${gVal(b)}`, fmtFlaeche(grundflaecheFlaeche)]),
      textSchritt('Volumen der Pyramide'),
      eq('V', [`⅓ · ${gVar('A<sub>G</sub>')} · ${hVar('h')}`, `⅓ · ${fmtZahl(grundflaecheFlaeche)} ${AKTUELE_EINHEIT.flaeche} · ${hVal(h)}`, fmtVolumen(volumen)], true)
    ]),
    abschnitt('Seitenhöhen, Seitenkanten und Oberflächeninhalt A<sub>O</sub>', [
      textSchritt('Höhe der Seitenflächen über der Kante a'),
      eq(sVar('h<sub>a</sub>'), [
        `√(${hVar('h²')} + (${gVar('b')}/2)²)`,
        `√((${hVal(h)})² + (${gVal(b / 2)})²)`,
        `√(${fmtZahl(h * h)} ${AKTUELE_EINHEIT.flaeche} + ${fmtZahl((b * b) / 4)} ${AKTUELE_EINHEIT.flaeche})`,
        fmtLaenge(ha)
      ]),
      textSchritt('Höhe der Seitenflächen über der Kante b'),
      eq(sVar('h<sub>b</sub>'), [
        `√(${hVar('h²')} + (${gVar('a')}/2)²)`,
        `√((${hVal(h)})² + (${gVal(a / 2)})²)`,
        `√(${fmtZahl(h * h)} ${AKTUELE_EINHEIT.flaeche} + ${fmtZahl((a * a) / 4)} ${AKTUELE_EINHEIT.flaeche})`,
        fmtLaenge(hb)
      ]),
      textSchritt('Seitenkante s'),
      eq(sVar('s'), [
        `√(${hVar('h²')} + (${gVar('a')}/2)² + (${gVar('b')}/2)²)`,
        `√((${hVal(h)})² + (${gVal(a / 2)})² + (${gVal(b / 2)})²)`,
        fmtLaenge(seitenkante)
      ]),
      textSchritt('Mantel: zwei Paare gleicher Dreiecke'),
      eq(sVar('A<sub>M</sub>'), [
        `2 · ½ · ${gVar('a')} · ${sVar('h<sub>a</sub>')} + 2 · ½ · ${gVar('b')} · ${sVar('h<sub>b</sub>')}`,
        `${gVar('a')} · ${sVar('h<sub>a</sub>')} + ${gVar('b')} · ${sVar('h<sub>b</sub>')}`,
        `${gVal(a)} · ${sVal(ha)} + ${gVal(b)} · ${sVal(hb)}`,
        fmtFlaeche(mantelflaeche)
      ]),
      textSchritt('Oberflächeninhalt'),
      eq(
        'A<sub>O</sub>',
        [`${gVar('A<sub>G</sub>')} + ${sVar('A<sub>M</sub>')}`, `${fmtZahl(grundflaecheFlaeche)} ${AKTUELE_EINHEIT.flaeche} + ${fmtZahl(mantelflaeche)} ${AKTUELE_EINHEIT.flaeche}`, fmtFlaeche(oberflaecheninhalt)],
        true
      )
    ])
  ];

  return baueErgebnis(
    'pyramide',
    gegebenAus(masse, variante),
    {
      a,
      b,
      h,
      grundflaeche: grundflaecheFlaeche,
      ha,
      hb,
      seitenkante,
      mantelflaeche
    },
    volumen,
    oberflaecheninhalt,
    ausVolumen ? schritte.filter((s) => s.titel !== 'Volumen V') : schritte,
    extra
  );
}

/**
 * 4. Kreiskegel
 * Gegeben: { r, h }
 */
function berechneKegel(masse, extra = {}) {
  const variante = waehleVariante(masse, [['r', 'h'], ['r', 's'], ['r', 'V']]);
  const { r } = masse;
  const ausVolumen = variante.includes('V');
  let h;
  let herleitung = [];
  if (variante.includes('h')) {
    h = masse.h;
  } else if (variante.includes('s')) {
    if (masse.s <= r) {
      throw new Error('Die Mantellinie s muss größer sein als der Radius r.');
    }
    h = Math.sqrt(masse.s * masse.s - r * r);
    herleitung = [
      abschnitt('Höhe h aus der Mantellinie s', [
        textSchritt('Satz des Pythagoras im Achsenschnitt (r, h, s)'),
        eq(hVar('h'), [
          `√(${sVar('s²')} − ${gVar('r²')})`,
          `√((${sVal(masse.s)})² − (${gVal(r)})²)`,
          `√(${fmtZahl(masse.s * masse.s)} ${AKTUELE_EINHEIT.flaeche} − ${fmtZahl(r * r)} ${AKTUELE_EINHEIT.flaeche})`,
          fmtLaenge(h)
        ])
      ])
    ];
  } else {
    h = (3 * masse.V) / (Math.PI * r * r);
    herleitung = [
      abschnitt('Höhe h aus dem Volumen', [
        textSchritt('Grundfläche'),
        eq(gVar('A<sub>G</sub>'), [`π · ${gVar('r²')}`, `π · (${gVal(r)})²`, fmtFlaeche(Math.PI * r * r)]),
        textSchritt('Aus V = ⅓ · A<sub>G</sub> · h folgt'),
        eq(hVar('h'), [
          `3 · ${gVar('V')} : ${gVar('A<sub>G</sub>')}`,
          `3 · ${vVal(masse.V)} : ${fmtFlaeche(Math.PI * r * r)}`,
          fmtLaenge(h)
        ])
      ])
    ];
  }

  const durchmesser = 2 * r;
  const umfangGrundkreis = 2 * Math.PI * r;
  const mantellinie = Math.hypot(r, h);
  const sektorwinkelGrad = (360 * r) / mantellinie;
  const grundflaecheFlaeche = Math.PI * r * r;
  const mantelflaeche = Math.PI * r * mantellinie;
  const oberflaecheninhalt = grundflaecheFlaeche + mantelflaeche;
  const volumen = ausVolumen ? masse.V : (grundflaecheFlaeche * h) / 3;

  const schritte = [
    ...herleitung,
    abschnitt('Volumen V', [
      eq(
        'V',
        [
          `⅓ · π · ${gVar('r²')} · ${hVar('h')}`,
          `⅓ · π · (${gVal(r)})² · ${hVal(h)}`,
          `⅓ · π · ${fmtZahl(r * r)} ${AKTUELE_EINHEIT.flaeche} · ${hVal(h)}`,
          fmtVolumen(volumen)
        ],
        true
      )
    ]),
    abschnitt('Mantellinie, weitere Maße und Oberflächeninhalt A<sub>O</sub>', [
      textSchritt('Mantellinie s'),
      eq(sVar('s'), [
        `√(${gVar('r²')} + ${hVar('h²')})`,
        `√((${gVal(r)})² + (${hVal(h)})²)`,
        `√(${fmtZahl(r * r)} ${AKTUELE_EINHEIT.flaeche} + ${fmtZahl(h * h)} ${AKTUELE_EINHEIT.flaeche})`,
        fmtLaenge(mantellinie)
      ]),
      textSchritt('Durchmesser, Grundkreisumfang und Mittelpunktswinkel des Netzes'),
      eq(gVar('d'), [`2 · ${gVar('r')}`, `2 · ${gVal(r)}`, fmtLaenge(durchmesser)]),
      eq(gVar('u'), [`2 · π · ${gVar('r')}`, `2 · π · ${gVal(r)}`, fmtLaenge(umfangGrundkreis)]),
      eq(sVar('α'), [`360° · ${gVar('r')} : ${sVar('s')}`, `360° · ${fmtZahl(r)} : ${fmtZahl(mantellinie)}`, fmtWert(sektorwinkelGrad, '°')]),
      textSchritt('Grundfläche'),
      eq(gVar('A<sub>G</sub>'), [`π · ${gVar('r²')}`, `π · (${gVal(r)})²`, fmtFlaeche(grundflaecheFlaeche)]),
      textSchritt('Mantelfläche'),
      eq(sVar('A<sub>M</sub>'), [`π · ${gVar('r')} · ${sVar('s')}`, `π · ${gVal(r)} · ${sVal(mantellinie)}`, fmtFlaeche(mantelflaeche)]),
      textSchritt('Oberflächeninhalt'),
      eq(
        'A<sub>O</sub>',
        [`${gVar('A<sub>G</sub>')} + ${sVar('A<sub>M</sub>')}`, `${fmtZahl(grundflaecheFlaeche)} ${AKTUELE_EINHEIT.flaeche} + ${fmtZahl(mantelflaeche)} ${AKTUELE_EINHEIT.flaeche}`, fmtFlaeche(oberflaecheninhalt)],
        true
      )
    ])
  ];

  return baueErgebnis(
    'kegel',
    gegebenAus(masse, variante),
    {
      r,
      h,
      durchmesser,
      umfangGrundkreis,
      mantellinie,
      sektorwinkelGrad,
      grundflaeche: grundflaecheFlaeche,
      mantelflaeche
    },
    volumen,
    oberflaecheninhalt,
    ausVolumen ? schritte.filter((s) => s.titel !== 'Volumen V') : schritte,
    extra
  );
}

/**
 * 5. Kreiszylinder
 * Gegeben: { r, h }
 */
function berechneZylinder(masse, extra = {}) {
  const variante = waehleVariante(masse, [['r', 'h'], ['r', 'V']]);
  const { r } = masse;
  const ausVolumen = variante.includes('V');
  const h = ausVolumen ? masse.V / (Math.PI * r * r) : masse.h;
  const herleitung = ausVolumen
    ? [
        abschnitt('Höhe h aus dem Volumen', [
          textSchritt('Grundfläche'),
          eq(gVar('A<sub>G</sub>'), [`π · ${gVar('r²')}`, `π · (${gVal(r)})²`, fmtFlaeche(Math.PI * r * r)]),
          textSchritt('Aus V = A<sub>G</sub> · h folgt'),
          eq(hVar('h'), [
            `${gVar('V')} : ${gVar('A<sub>G</sub>')}`,
            `${vVal(masse.V)} : ${fmtFlaeche(Math.PI * r * r)}`,
            fmtLaenge(h)
          ])
        ])
      ]
    : [];

  const durchmesser = 2 * r;
  const umfangGrundkreis = 2 * Math.PI * r;
  const grundflaecheFlaeche = Math.PI * r * r;
  const mantelflaeche = 2 * Math.PI * r * h;
  const oberflaecheninhalt = 2 * grundflaecheFlaeche + mantelflaeche;
  const volumen = ausVolumen ? masse.V : grundflaecheFlaeche * h;

  const schritte = [
    ...herleitung,
    abschnitt('Volumen V', [
      eq(
        'V',
        [
          `π · ${gVar('r²')} · ${hVar('h')}`,
          `π · (${gVal(r)})² · ${hVal(h)}`,
          `π · ${fmtZahl(r * r)} ${AKTUELE_EINHEIT.flaeche} · ${hVal(h)}`,
          fmtVolumen(volumen)
        ],
        true
      )
    ]),
    abschnitt('Weitere Maße und Oberflächeninhalt A<sub>O</sub>', [
      textSchritt('Durchmesser und Grundkreisumfang'),
      eq(gVar('d'), [`2 · ${gVar('r')}`, `2 · ${gVal(r)}`, fmtLaenge(durchmesser)]),
      eq(gVar('u'), [`2 · π · ${gVar('r')}`, `2 · π · ${gVal(r)}`, fmtLaenge(umfangGrundkreis)]),
      textSchritt('Grund- und Deckfläche (zwei gleiche Kreise)'),
      eq(gVar('A<sub>G</sub>'), [`π · ${gVar('r²')}`, `π · (${gVal(r)})²`, fmtFlaeche(grundflaecheFlaeche)]),
      textSchritt('Mantelfläche (Rechteck mit Umfang 2πr und Höhe h)'),
      eq(sVar('A<sub>M</sub>'), [`2 · π · ${gVar('r')} · ${hVar('h')}`, `2 · π · ${gVal(r)} · ${hVal(h)}`, fmtFlaeche(mantelflaeche)]),
      textSchritt('Oberflächeninhalt'),
      eq(
        'A<sub>O</sub>',
        [`2 · ${gVar('A<sub>G</sub>')} + ${sVar('A<sub>M</sub>')}`, `2 · ${fmtZahl(grundflaecheFlaeche)} ${AKTUELE_EINHEIT.flaeche} + ${fmtZahl(mantelflaeche)} ${AKTUELE_EINHEIT.flaeche}`, fmtFlaeche(oberflaecheninhalt)],
        true
      )
    ])
  ];

  return baueErgebnis(
    'zylinder',
    gegebenAus(masse, variante),
    {
      r,
      h,
      durchmesser,
      umfangGrundkreis,
      grundflaeche: grundflaecheFlaeche,
      mantelflaeche
    },
    volumen,
    oberflaecheninhalt,
    ausVolumen ? schritte.filter((s) => s.titel !== 'Volumen V') : schritte,
    extra
  );
}

/**
 * 6. Hohlzylinder (Zylinder mit Wanddicke)
 * Gegeben: { r, R, h }   (r = Innenradius, R = Außenradius, h = Höhe)
 */
function berechneHohlzylinder({ r, R, h }, extra = {}) {
  pruefePositiv({ r, R, h });
  if (R <= r) {
    throw new Error('Beim Hohlzylinder muss der Außenradius R größer sein als der Innenradius r.');
  }

  const durchmesser = 2 * R;
  const umfangGrundkreisAussen = 2 * Math.PI * R;
  const umfangGrundkreisInnen = 2 * Math.PI * r;
  const grundflaecheAussen = Math.PI * R * R;
  const grundflaecheInnen = Math.PI * r * r;
  const ringflaeche = grundflaecheAussen - grundflaecheInnen;
  const mantelflaecheAussen = 2 * Math.PI * R * h;
  const mantelflaecheInnen = 2 * Math.PI * r * h;
  const mantelflaeche = mantelflaecheAussen + mantelflaecheInnen;
  const oberflaecheninhalt = 2 * ringflaeche + mantelflaeche;
  const volumen = ringflaeche * h;

const schritte = [
    abschnitt('Volumen V', [
      textSchritt('Grundfläche des Ringes (Außenkreis minus Innenkreis)'),
      eq(gVar('A<sub>R</sub>'), [
        `${gVar('A<sub>A</sub>')} − ${gVar('A<sub>I</sub>')}`,
        `π · ${gVar('R²')} − π · ${gVar('r²')}`,
        `π · (${gVal(R)})² − π · (${gVal(r)})²`,
        `π · ${fmtZahl(R * R)} ${AKTUELE_EINHEIT.flaeche} − π · ${fmtZahl(r * r)} ${AKTUELE_EINHEIT.flaeche}`,
        fmtFlaeche(ringflaeche)
      ]),
      textSchritt('Volumen des Hohlzylinders'),
      eq(
        'V',
        [
          `${gVar('A<sub>R</sub>')} · ${hVar('h')}`,
          `${fmtWert(ringflaeche, AKTUELE_EINHEIT.flaeche, 4)} · ${hVal(h)}`,
          fmtVolumen(volumen)
        ],
        true
      )
    ]),
    abschnitt('Weitere Maße und Oberflächeninhalt A<sub>O</sub>', [
      textSchritt('Durchmesser, Umfänge der Grundkreise'),
      eq(gVar('d'), [`2 · ${gVar('R')}`, `2 · ${gVal(R)}`, fmtLaenge(durchmesser)]),
      eq(gVar('u<sub>A</sub>'), [`2 · π · ${gVar('R')}`, `2 · π · ${gVal(R)}`, fmtLaenge(umfangGrundkreisAussen)]),
      eq(gVar('u<sub>I</sub>'), [`2 · π · ${gVar('r')}`, `2 · π · ${gVal(r)}`, fmtLaenge(umfangGrundkreisInnen)]),
      textSchritt('Außen- und Innenmantelfläche'),
      eq(sVar('A<sub>MA</sub>'), [`2 · π · ${gVar('R')} · ${hVar('h')}`, `2 · π · ${gVal(R)} · ${gVal(h)}`, fmtFlaeche(mantelflaecheAussen)]),
      eq(sVar('A<sub>MI</sub>'), [`2 · π · ${gVar('r')} · ${hVar('h')}`, `2 · π · ${gVal(r)} · ${gVal(h)}`, fmtFlaeche(mantelflaecheInnen)]),
      textSchritt('Oberflächeninhalt'),
      eq(
        'A<sub>O</sub>',
        [
          `2 · ${gVar('A<sub>R</sub>')} + ${sVar('A<sub>MA</sub>')} + ${sVar('A<sub>MI</sub>')}`,
          `2 · ${fmtZahl(ringflaeche)} ${AKTUELE_EINHEIT.flaeche} + ${fmtZahl(mantelflaecheAussen)} ${AKTUELE_EINHEIT.flaeche} + ${fmtZahl(mantelflaecheInnen)} ${AKTUELE_EINHEIT.flaeche}`,
          fmtFlaeche(oberflaecheninhalt)
        ],
        true
      )
    ])
  ];

  return baueErgebnis(
    'hohlzylinder',
    { r, R, h },
    {
      r,
      R,
      h,
      durchmesser,
      umfangGrundkreisAussen,
      umfangGrundkreisInnen,
      grundflaecheAussen,
      grundflaecheInnen,
      ringflaeche,
      mantelflaecheAussen,
      mantelflaecheInnen,
      mantelflaeche
    },
    volumen,
    oberflaecheninhalt,
    schritte,
    extra
  );
}

/**
 * 7. Kreiskegelstumpf (Kegel mit abgeschnittener Spitze)
 * Gegeben: { r, R, h }   (r = Radius des oberen Kreises, R = Radius des unteren Kreises, h = Höhe)
 */
function berechneKegelstumpf({ r, R, h }, extra = {}) {
  pruefePositiv({ r, R, h });
  if (R <= r) {
    throw new Error('Beim Kreiskegelstumpf muss der untere Radius R größer sein als der obere Radius r.');
  }

  const grundflaecheOben = Math.PI * r * r;
  const grundflaecheUnten = Math.PI * R * R;
  const mantellinie = Math.hypot(R - r, h);
  const mantelflaeche = Math.PI * (r + R) * mantellinie;
  const oberflaecheninhalt = grundflaecheOben + grundflaecheUnten + mantelflaeche;
  const volumen = (Math.PI * h / 3) * (R * R + R * r + r * r);

  const schritte = [
    abschnitt('Volumen V', [
      textSchritt('Grundflächen'),
      eq(gVar('A<sub>o</sub>'), [`π · ${gVar('r²')}`, `π · (${gVal(r)})²`, fmtFlaeche(grundflaecheOben)]),
      eq(gVar('A<sub>u</sub>'), [`π · ${gVar('R²')}`, `π · (${gVal(R)})²`, fmtFlaeche(grundflaecheUnten)]),
      textSchritt('Mantellinie s'),
      eq(sVar('s'), [
        `√((${gVar('R')} − ${gVar('r')})² + ${hVar('h²')})`,
        `√((${gVal(R - r)})² + (${gVal(h)})²)`,
        `√(${fmtZahl((R - r) ** 2)} ${AKTUELE_EINHEIT.flaeche} + ${fmtZahl(h * h)} ${AKTUELE_EINHEIT.flaeche})`,
        fmtLaenge(mantellinie)
      ]),
      textSchritt('Volumen des Kegelstumpfes'),
      eq(
        'V',
        [
          `⅓ · π · ${hVar('h')} · (${gVar('R²')} + ${gVar('R')}·${gVar('r')} + ${gVar('r²')})`,
          `⅓ · π · ${hVal(h)} · (${fmtZahl(R * R)} ${AKTUELE_EINHEIT.flaeche} + ${fmtZahl(R * r)} ${AKTUELE_EINHEIT.flaeche} + ${fmtZahl(r * r)} ${AKTUELE_EINHEIT.flaeche})`,
          fmtVolumen(volumen)
        ],
        true
      )
    ]),
    abschnitt('Mantelfläche und Oberflächeninhalt A<sub>O</sub>', [
      textSchritt('Mantelfläche (Ableitung aus dem Kegelstumpf-Mantel)'),
      eq(sVar('A<sub>M</sub>'), [
        `π · (${gVar('r')} + ${gVar('R')}) · ${sVar('s')}`,
        `π · (${gVal(r)} + ${gVal(R)}) · ${sVal(mantellinie)}`,
        fmtFlaeche(mantelflaeche)
      ]),
      textSchritt('Oberflächeninhalt'),
      eq(
        'A<sub>O</sub>',
        [
          `${gVar('A<sub>o</sub>')} + ${gVar('A<sub>u</sub>')} + ${sVar('A<sub>M</sub>')}`,
          `${fmtZahl(grundflaecheOben)} ${AKTUELE_EINHEIT.flaeche} + ${fmtZahl(grundflaecheUnten)} ${AKTUELE_EINHEIT.flaeche} + ${fmtZahl(mantelflaeche)} ${AKTUELE_EINHEIT.flaeche}`,
          fmtFlaeche(oberflaecheninhalt)
        ],
        true
      )
    ])
  ];

  return baueErgebnis(
    'kegelstumpf',
    { r, R, h },
    {
      r,
      R,
      h,
      grundflaecheOben,
      grundflaecheUnten,
      mantellinie,
      mantelflaeche
    },
    volumen,
    oberflaecheninhalt,
    schritte,
    extra
  );
}

/**
 * 8. Pyramidenstumpf (Pyramide mit abgeschnittener Spitze, rechteckige Grundflächen)
 * Gegeben (vollständig):  { a1, b1, a2, b2, h }
 *   a1, b1 = Seiten der unteren Grundfläche, a2, b2 = Seiten der oberen Grundfläche, h = Höhe
 *   Quadratisch: { a1, a2, h }  (b1 = a1, b2 = a2)
 *   Die obere Fläche muss zur unteren ähnlich sein (a2 : a1 = b2 : b1).
 * Nur Volumen: { A1, A2, h }  (ohne Seitenlängen sind Mantel und Oberfläche nicht berechenbar)
 */
function berechnePyramidenstumpf({ A1, A2, h, a1, b1, a2, b2 }, extra = {}) {
  const hatSeiten = a1 !== undefined || a2 !== undefined;

  if (!hatSeiten) {
    pruefePositiv({ A1, A2, h });
    if (A2 >= A1) {
      throw new Error('Beim Pyramidenstumpf muss die obere Grundfläche A2 kleiner sein als die untere Grundfläche A1.');
    }
    const mittel = Math.sqrt(A1 * A2);
    const volumen = (h / 3) * (A1 + mittel + A2);
    const schritte = [
      abschnitt('Volumen V', [
        textSchritt('Geometrisches Mittel der Grundflächen'),
        eq('√(A<sub>1</sub> · A<sub>2</sub>)', [
          `√(${fmtZahl(A1)} ${AKTUELE_EINHEIT.flaeche} · ${fmtZahl(A2)} ${AKTUELE_EINHEIT.flaeche})`,
          fmtFlaeche(mittel)
        ]),
        textSchritt('Volumen des Pyramidenstumpfes'),
        eq('V', [
          `⅓ · ${hVar('h')} · (A<sub>1</sub> + √(A<sub>1</sub> · A<sub>2</sub>) + A<sub>2</sub>)`,
          `⅓ · ${hVal(h)} · (${fmtZahl(A1)} ${AKTUELE_EINHEIT.flaeche} + ${fmtFlaeche(mittel, 4)} + ${fmtZahl(A2)} ${AKTUELE_EINHEIT.flaeche})`,
          fmtVolumen(volumen)
        ], true)
      ])
    ];
    return baueErgebnis('pyramidenstumpf', { h }, { A1, A2, h, geometrischesMittel: mittel }, volumen, null, schritte, extra);
  }

  b1 = b1 ?? a1;
  b2 = b2 ?? a2;
  pruefePositiv({ a1, b1, a2, b2, h });
  if (a2 >= a1 || b2 >= b1) {
    throw new Error('Beim Pyramidenstumpf muss die obere Grundfläche kleiner sein als die untere (a2 < a1 und b2 < b1).');
  }
  if (Math.abs(a2 * b1 - a1 * b2) > 1e-9 * a1 * b1) {
    throw new Error('Die obere Grundfläche muss zur unteren ähnlich sein (a2 : a1 = b2 : b1).');
  }

  const A1g = a1 * b1;
  const A2g = a2 * b2;
  const mittel = Math.sqrt(A1g * A2g);
  const volumen = (h / 3) * (A1g + mittel + A2g);
  const hsa = Math.hypot(h, (b1 - b2) / 2); // Höhe des Trapezes über Kante a
  const hsb = Math.hypot(h, (a1 - a2) / 2); // Höhe des Trapezes über Kante b
  const seitenkante = Math.hypot(h, Math.hypot(a1 - a2, b1 - b2) / 2);
  const mantelflaeche = (a1 + a2) * hsa + (b1 + b2) * hsb;
  const oberflaecheninhalt = A1g + A2g + mantelflaeche;
  const U = AKTUELE_EINHEIT.flaeche;

  const schritte = [
    abschnitt('Volumen V', [
      textSchritt('Untere und obere Grundfläche (Rechtecke)'),
      eq(gVar('A<sub>1</sub>'), [`${gVar('a<sub>1</sub>')} · ${gVar('b<sub>1</sub>')}`, `${gVal(a1)} · ${gVal(b1)}`, fmtFlaeche(A1g)]),
      eq(gVar('A<sub>2</sub>'), [`${gVar('a<sub>2</sub>')} · ${gVar('b<sub>2</sub>')}`, `${gVal(a2)} · ${gVal(b2)}`, fmtFlaeche(A2g)]),
      textSchritt('Volumen des Pyramidenstumpfes'),
      eq('V', [
        `⅓ · ${hVar('h')} · (A<sub>1</sub> + √(A<sub>1</sub> · A<sub>2</sub>) + A<sub>2</sub>)`,
        `⅓ · ${hVal(h)} · (${fmtZahl(A1g)} ${U} + √(${fmtZahl(A1g)} ${U} · ${fmtZahl(A2g)} ${U}) + ${fmtZahl(A2g)} ${U})`,
        `⅓ · ${hVal(h)} · (${fmtZahl(A1g)} ${U} + ${fmtFlaeche(mittel, 4)} + ${fmtZahl(A2g)} ${U})`,
        fmtVolumen(volumen)
      ], true)
    ]),
    abschnitt('Seitenhöhen, Seitenkante und Oberflächeninhalt A<sub>O</sub>', [
      textSchritt('Höhe der Trapeze über den Kanten a (h<sub>a</sub>) und b (h<sub>b</sub>)'),
      eq(sVar('h<sub>a</sub>'), [
        `√(${hVar('h²')} + ((${gVar('b<sub>1</sub>')} − ${gVar('b<sub>2</sub>')})/2)²)`,
        `√((${hVal(h)})² + (${gVal((b1 - b2) / 2)})²)`,
        fmtLaenge(hsa)
      ]),
      eq(sVar('h<sub>b</sub>'), [
        `√(${hVar('h²')} + ((${gVar('a<sub>1</sub>')} − ${gVar('a<sub>2</sub>')})/2)²)`,
        `√((${hVal(h)})² + (${gVal((a1 - a2) / 2)})²)`,
        fmtLaenge(hsb)
      ]),
      textSchritt('Seitenkante s'),
      eq(sVar('s'), [
        `√(${hVar('h²')} + ((${gVar('a<sub>1</sub>')} − ${gVar('a<sub>2</sub>')})/2)² + ((${gVar('b<sub>1</sub>')} − ${gVar('b<sub>2</sub>')})/2)²)`,
        fmtLaenge(seitenkante)
      ]),
      textSchritt('Mantel: zwei Paare gleicher Trapeze'),
      eq(sVar('A<sub>M</sub>'), [
        `(${gVar('a<sub>1</sub>')} + ${gVar('a<sub>2</sub>')}) · ${sVar('h<sub>a</sub>')} + (${gVar('b<sub>1</sub>')} + ${gVar('b<sub>2</sub>')}) · ${sVar('h<sub>b</sub>')}`,
        `(${gVal(a1)} + ${gVal(a2)}) · ${sVal(hsa)} + (${gVal(b1)} + ${gVal(b2)}) · ${sVal(hsb)}`,
        fmtFlaeche(mantelflaeche)
      ]),
      textSchritt('Oberflächeninhalt'),
      eq('A<sub>O</sub>', [
        `${gVar('A<sub>1</sub>')} + ${gVar('A<sub>2</sub>')} + ${sVar('A<sub>M</sub>')}`,
        `${fmtZahl(A1g)} ${U} + ${fmtZahl(A2g)} ${U} + ${fmtZahl(mantelflaeche)} ${U}`,
        fmtFlaeche(oberflaecheninhalt)
      ], true)
    ])
  ];

  return baueErgebnis(
    'pyramidenstumpf',
    { a1, b1, a2, b2, h },
    { a1, b1, a2, b2, h, grundflaecheUnten: A1g, grundflaecheOben: A2g, hsa, hsb, seitenkante, mantelflaeche },
    volumen,
    oberflaecheninhalt,
    schritte,
    extra
  );
}

/**
 * 9. Prisma
 * grundflaeche: 'al' | 'pa' | 'tr' | 'ra'  (Höhe h immer zusätzlich)
 *   al  Allgemeines Dreieck      – Berechnung folgt über den dreieck_solver (noch nicht eingebunden)
 *   pa  Parallelogramm           – { a, b, ha, h } oder { a, b, alpha, h }
 *   tr  Gleichschenkliges Trapez – { a, c, ha, h } oder { a, c, alpha, h }   (a > c, alpha = Basiswinkel an a)
 *   ra  Raute                    – { e, f, h } oder { a, alpha, h }          (e halbiert den Winkel alpha)
 * Winkel alpha in Grad.
 */
function berechnePrisma(grundflaeche, masse, extra = {}) {
  if (!GRUNDFLAECHEN_NAMEN[grundflaeche]) {
    throw new Error(`Unbekannte Grundfläche für Prisma: "${grundflaeche}".`);
  }
  if (!masse || typeof masse !== 'object') {
    throw new Error('Für das Prisma werden positive Maße als Objekt erwartet.');
  }
  pruefePositiv({ h: masse.h });
  const h = masse.h;

  let variante;
  let grundText;
  let grundflaecheFlaeche;
  let umfangGrundflaeche;
  let weitereMasse;
  const grundSchritte = [];
  let formelGrund;
  let formelUmfang;
  const D = '°';

  if (grundflaeche === 'pa') {
    variante = waehleVariante(masse, [['a', 'b', 'ha'], ['a', 'b', 'alpha']]);
    const { a, b } = masse;
    let ha;
    let alpha;
    if (variante.includes('ha')) {
      ha = masse.ha;
      if (ha > b * (1 + 1e-12)) {
        throw new Error('Beim Parallelogramm darf die Höhe ha nicht größer sein als die Seite b.');
      }
      alpha = grad(Math.asin(Math.min(1, ha / b)));
      grundSchritte.push(
        textSchritt('Spitzer Winkel α zwischen den Seiten a und b'),
        eq(sVar('α'), [
          `sin⁻¹(${gVar('h<sub>a</sub>')} : ${gVar('b')})`,
          `sin⁻¹(${gVal(ha)} : ${gVal(b)})`,
          fmtWert(alpha, D)
        ])
      );
    } else {
      alpha = masse.alpha;
      pruefeWinkel('alpha', alpha);
      ha = b * Math.sin(rad(alpha));
      grundSchritte.push(
        textSchritt('Höhe h<sub>a</sub> aus Seite b und Winkel α'),
        eq(gVar('h<sub>a</sub>'), [
          `${gVar('b')} · sin(${sVar('α')})`,
          `${gVal(b)} · sin(${fmtZahl(alpha)}${D})`,
          fmtLaenge(ha)
        ])
      );
    }
    const beta = 180 - alpha;
    grundSchritte.push(
      textSchritt('Gegenwinkel β'),
      eq(sVar('β'), [`180${D} − ${sVar('α')}`, `180${D} − ${fmtZahl(alpha)}${D}`, fmtWert(beta, D)])
    );
    grundText = 'Parallelogramm';
    grundflaecheFlaeche = a * ha;
    umfangGrundflaeche = 2 * (a + b);
    formelGrund = [`${gVar('a')} · ${gVar('h<sub>a</sub>')}`, `${gVal(a)} · ${gVal(ha)}`, fmtFlaeche(grundflaecheFlaeche)];
    formelUmfang = [`2 · (${gVar('a')} + ${gVar('b')})`, `2 · (${gVal(a)} + ${gVal(b)})`, fmtLaenge(umfangGrundflaeche)];
    weitereMasse = { a, b, ha, alpha, beta };
  } else if (grundflaeche === 'tr') {
    variante = waehleVariante(masse, [['a', 'c', 'ha'], ['a', 'c', 'alpha']]);
    const { a, c } = masse;
    if (a <= c) {
      throw new Error('Beim gleichschenkligen Trapez muss a die längere (untere) Grundseite sein: a > c.');
    }
    const halbDiff = (a - c) / 2;
    let ha;
    let alpha;
    if (variante.includes('ha')) {
      ha = masse.ha;
      alpha = grad(Math.atan2(ha, halbDiff));
      grundSchritte.push(
        textSchritt('Basiswinkel α an der Grundseite a'),
        eq(sVar('α'), [
          `tan⁻¹(${gVar('h<sub>a</sub>')} : ((${gVar('a')} − ${gVar('c')})/2))`,
          `tan⁻¹(${gVal(ha)} : ${gVal(halbDiff)})`,
          fmtWert(alpha, D)
        ])
      );
    } else {
      alpha = masse.alpha;
      pruefeWinkel('alpha', alpha, 90);
      ha = halbDiff * Math.tan(rad(alpha));
      grundSchritte.push(
        textSchritt('Höhe h<sub>a</sub> aus dem Basiswinkel α'),
        eq(gVar('h<sub>a</sub>'), [
          `((${gVar('a')} − ${gVar('c')})/2) · tan(${sVar('α')})`,
          `${gVal(halbDiff)} · tan(${fmtZahl(alpha)}${D})`,
          fmtLaenge(ha)
        ])
      );
    }
    const d = Math.hypot(halbDiff, ha);
    const beta = 180 - alpha;
    grundSchritte.push(
      textSchritt('Schenkel d'),
      eq(sVar('d'), [
        `√(((${gVar('a')} − ${gVar('c')})/2)² + ${gVar('h<sub>a</sub>²')})`,
        `√((${gVal(halbDiff)})² + (${gVal(ha)})²)`,
        fmtLaenge(d)
      ]),
      textSchritt('Winkel β an der Grundseite c'),
      eq(sVar('β'), [`180${D} − ${sVar('α')}`, `180${D} − ${fmtZahl(alpha)}${D}`, fmtWert(beta, D)])
    );
    grundText = 'Gleichschenkliges Trapez';
    grundflaecheFlaeche = ((a + c) / 2) * ha;
    umfangGrundflaeche = a + c + 2 * d;
    formelGrund = [
      `½ · (${gVar('a')} + ${gVar('c')}) · ${gVar('h<sub>a</sub>')}`,
      `½ · (${gVal(a)} + ${gVal(c)}) · ${gVal(ha)}`,
      fmtFlaeche(grundflaecheFlaeche)
    ];
    formelUmfang = [
      `${gVar('a')} + ${gVar('c')} + 2 · ${sVar('d')}`,
      `${gVal(a)} + ${gVal(c)} + 2 · ${sVal(d)}`,
      fmtLaenge(umfangGrundflaeche)
    ];
    weitereMasse = { a, c, ha, d, alpha, beta };
  } else if (grundflaeche === 'al') {
  const TriangleSolver = globalThis.MTGTriangleSolver;
  if (!TriangleSolver) {
    throw new Error(
      'Der TriangleSolver (triangle-solver.js) ist nicht verfügbar. Bitte laden Sie triangle-solver.js vor solid-solver.js.'
    );
  }
  const DREIECK_KEYS = ['a', 'b', 'c', 'al', 'be', 'ga', 'alpha', 'beta', 'gamma', 'ha', 'hb', 'hc'];
  const triangleInputs = {};
  for (const key of DREIECK_KEYS) {
    if (hatWert(masse[key])) triangleInputs[key] = masse[key];
  }
  variante = Object.keys(triangleInputs);

  const triangleSolution = TriangleSolver.solve(triangleInputs, {
    unit: ['mm', 'cm', 'dm', 'm', 'km'].includes(AKTUELE_EINHEIT.laenge) ? AKTUELE_EINHEIT.laenge : '',
    decimals: 2,
    allowAmbiguous: false
  });
  const sol = triangleSolution.values;
  if (!(Number.isFinite(sol.area) && sol.area > 0 && Number.isFinite(sol.perimeter))) {
    throw new Error('Das Dreieck konnte nicht berechnet werden.');
  }
  grundflaecheFlaeche = sol.area;
  umfangGrundflaeche = sol.perimeter;

  for (const s of triangleSolution.schritte) {
    if (s.key === 'perimeter') continue;   // Umfang steht unten im Oberflächen-Abschnitt
    grundSchritte.push(...s.elemente);
  }

  grundText = 'Allgemeines Dreieck';
  formelGrund = [fmtFlaeche(grundflaecheFlaeche)];
  formelUmfang = [fmtLaenge(umfangGrundflaeche)];
  if ([sol.a, sol.b, sol.c].every(Number.isFinite)) {
    formelUmfang = [
      `${gVar('a')} + ${gVar('b')} + ${gVar('c')}`,
      `${gVal(sol.a)} + ${gVal(sol.b)} + ${gVal(sol.c)}`,
      fmtLaenge(umfangGrundflaeche)
    ];
  }
  weitereMasse = { ...sol };
  } else {
    // 'ra' Raute
    variante = waehleVariante(masse, [['e', 'f'], ['a', 'alpha']]);
    let e;
    let f;
    let a;
    let alpha;
    if (variante.includes('e')) {
      e = masse.e;
      f = masse.f;
      a = Math.hypot(e / 2, f / 2);
      alpha = 2 * grad(Math.atan2(f, e));
      grundSchritte.push(
        textSchritt('Seitenlänge a'),
        eq(gVar('a'), [
          `√((${gVar('e')}/2)² + (${gVar('f')}/2)²)`,
          `√((${gVal(e / 2)})² + (${gVal(f / 2)})²)`,
          fmtLaenge(a)
        ]),
        textSchritt('Winkel α (wird von der Diagonale e halbiert)'),
        eq(sVar('α'), [
          `2 · tan⁻¹(${gVar('f')} : ${gVar('e')})`,
          `2 · tan⁻¹(${gVal(f)} : ${gVal(e)})`,
          fmtWert(alpha, D)
        ])
      );
    } else {
      a = masse.a;
      alpha = masse.alpha;
      pruefeWinkel('alpha', alpha);
      e = 2 * a * Math.cos(rad(alpha / 2));
      f = 2 * a * Math.sin(rad(alpha / 2));
      grundSchritte.push(
        textSchritt('Diagonalen e (halbiert den Winkel α) und f'),
        eq(gVar('e'), [
          `2 · ${gVar('a')} · cos(${sVar('α')}/2)`,
          `2 · ${gVal(a)} · cos(${fmtZahl(alpha / 2)}${D})`,
          fmtLaenge(e)
        ]),
        eq(gVar('f'), [
          `2 · ${gVar('a')} · sin(${sVar('α')}/2)`,
          `2 · ${gVal(a)} · sin(${fmtZahl(alpha / 2)}${D})`,
          fmtLaenge(f)
        ])
      );
    }
    const beta = 180 - alpha;
    grundSchritte.push(
      textSchritt('Gegenwinkel β'),
      eq(sVar('β'), [`180${D} − ${sVar('α')}`, `180${D} − ${fmtZahl(alpha)}${D}`, fmtWert(beta, D)])
    );
    grundText = 'Raute';
    grundflaecheFlaeche = (e * f) / 2;
    umfangGrundflaeche = 4 * a;
    formelGrund = [`½ · ${gVar('e')} · ${gVar('f')}`, `½ · ${gVal(e)} · ${gVal(f)}`, fmtFlaeche(grundflaecheFlaeche)];
    formelUmfang = [`4 · ${gVar('a')}`, `4 · ${gVal(a)}`, fmtLaenge(umfangGrundflaeche)];
    weitereMasse = { a, e, f, alpha, beta };
  }

  const mantelflaeche = umfangGrundflaeche * h;
  const oberflaecheninhalt = 2 * grundflaecheFlaeche + mantelflaeche;
  const volumen = grundflaecheFlaeche * h;

  const schritte = [
    abschnitt(`Grundfläche A<sub>G</sub> (${grundText})`, [...grundSchritte, eq(gVar('A<sub>G</sub>'), formelGrund)]),
    abschnitt('Volumen V', [
      eq('V', [`${gVar('A<sub>G</sub>')} · ${hVar('h')}`, `${fmtZahl(grundflaecheFlaeche)} ${AKTUELE_EINHEIT.flaeche} · ${hVal(h)}`, fmtVolumen(volumen)], true)
    ]),
    abschnitt('Oberflächeninhalt A<sub>O</sub>', [
      textSchritt('Umfang der Grundfläche'),
      eq(gVar('U'), formelUmfang),
      textSchritt('Mantelfläche (Rechtecke nebeneinander)'),
      eq(sVar('A<sub>M</sub>'), [`${gVar('U')} · ${hVar('h')}`, `${fmtZahl(umfangGrundflaeche)} ${AKTUELE_EINHEIT.laenge} · ${hVal(h)}`, fmtFlaeche(mantelflaeche)]),
      textSchritt('Oberflächeninhalt'),
      eq(
        'A<sub>O</sub>',
        [
          `2 · ${gVar('A<sub>G</sub>')} + ${sVar('A<sub>M</sub>')}`,
          `2 · ${fmtZahl(grundflaecheFlaeche)} ${AKTUELE_EINHEIT.flaeche} + ${fmtZahl(mantelflaeche)} ${AKTUELE_EINHEIT.flaeche}`,
          fmtFlaeche(oberflaecheninhalt)
        ],
        true
      )
    ])
  ];

  return baueErgebnis(
    'prisma',
    { ...gegebenAus(masse, variante), h },
    {
      ...weitereMasse,
      h,
      grundflaeche: grundflaecheFlaeche,
      umfangGrundflaeche,
      mantelflaeche
    },
    volumen,
    oberflaecheninhalt,
    schritte,
    { grundflaeche, ...extra }
  );
}

/**
 * 10. Kugel
 * Gegeben: { r }
 */
function berechneKugel({ r }, extra = {}) {
  pruefePositiv({ r });

  const durchmesser = 2 * r;
  const grosskreisUmfang = 2 * Math.PI * r;
  const grosskreisFlaeche = Math.PI * r * r;
  const volumen = (4 / 3) * Math.PI * r ** 3;
  const oberflaecheninhalt = 4 * Math.PI * r * r;

  const schritte = [
    abschnitt('Weitere Maße der Kugel', [
      textSchritt('Durchmesser, Großkreisumfang und Großkreisfläche'),
      eq(gVar('d'), [`2 · ${gVar('r')}`, `2 · ${gVal(r)}`, fmtLaenge(durchmesser)]),
      eq(gVar('u'), [`2 · π · ${gVar('r')}`, `2 · π · ${gVal(r)}`, fmtLaenge(grosskreisUmfang)]),
      eq(gVar('A<sub>K</sub>'), [`π · ${gVar('r²')}`, `π · (${gVal(r)})²`, fmtFlaeche(grosskreisFlaeche)])
    ]),
    abschnitt('Volumen V', [
      eq(
        'V',
        [
          `(4/3) · π · ${gVar('r³')}`,
          `(4/3) · π · (${gVal(r)})³`,
          `(4/3) · π · ${fmtZahl(r ** 3)} ${AKTUELE_EINHEIT.volumen}`,
          fmtVolumen(volumen)
        ],
        true
      )
    ]),
    abschnitt('Oberflächeninhalt A<sub>O</sub>', [
      eq(
        'A<sub>O</sub>',
        [
          `4 · π · ${gVar('r²')}`,
          `4 · π · (${gVal(r)})²`,
          `4 · π · ${fmtZahl(r * r)} ${AKTUELE_EINHEIT.flaeche}`,
          fmtFlaeche(oberflaecheninhalt)
        ],
        true
      )
    ])
  ];

  return baueErgebnis(
    'kugel',
    { r },
    {
      r,
      durchmesser,
      grosskreisUmfang,
      grosskreisFlaeche
    },
    volumen,
    oberflaecheninhalt,
    schritte,
    extra
  );
}

/**
 * Zentrale Einstiegsfunktion:
 * berechneKoerper('prisma', { a: 4, ha: 3, h: 5 }, { grundflaeche: 'dg' })
 * Optionen: { grundflaeche, einheit: { laenge, flaeche, volumen } }
 */
function berechneKoerper(koerper, masse, optionen = {}) {
  if (!masse || typeof masse !== 'object') {
    throw new Error('Die Körpermaße müssen als Objekt mit positiven Zahlen übergeben werden.');
  }
  if (!optionen || typeof optionen !== 'object') {
    throw new Error('Die Körperoptionen müssen als Objekt übergeben werden.');
  }

  const einheit = optionen.einheit ?? EINHEIT_DEFAULT;
  setEinheit(einheit);

  switch (koerper) {
    case 'wuerfel':
      return berechneWuerfel(masse, { einheit });
    case 'quader':
      return berechneQuader(masse, { einheit });
    case 'pyramide':
      return berechnePyramide(masse, { einheit });
    case 'kegel':
      return berechneKegel(masse, { einheit });
    case 'zylinder':
      return berechneZylinder(masse, { einheit });
    case 'hohlzylinder':
      return berechneHohlzylinder(masse, { einheit });
    case 'kegelstumpf':
      return berechneKegelstumpf(masse, { einheit });
    case 'pyramidenstumpf':
      return berechnePyramidenstumpf(masse, { einheit });
    case 'prisma': {
      const gf = optionen.grundflaeche ?? masse.grundflaeche;
      if (!gf) {
        throw new Error(`Bitte eine Grundfläche für das Prisma wählen: ${Object.keys(GRUNDFLAECHEN_NAMEN).join(', ')}.`);
      }
      return berechnePrisma(gf, masse, { einheit });
    }
    case 'kugel':
      return berechneKugel(masse, { einheit });
    default:
      throw new Error(`Unbekannter Körper: "${koerper}".`);
  }
}

if (typeof window !== 'undefined') {
  const api = {
    berechneKoerper,
    berechneWuerfel,
    berechneQuader,
    berechnePyramide,
    berechneKegel,
    berechneZylinder,
    berechneHohlzylinder,
    berechneKegelstumpf,
    berechnePyramidenstumpf,
    berechnePrisma,
    berechneKugel,
    setEinheit,
    schritteZuHtml
  };

  window.MTGSolidSolver = api;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { berechneKoerper, berechnePyramidenstumpf, berechneKegelstumpf, berechneHohlzylinder, setEinheit };
}