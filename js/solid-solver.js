/**
 * Geschlossenes Berechnungsmodul für geometrische Körper:
 * - Würfel (`wuerfel`)
 * - Quader (`quader`)
 * - Pyramide mit rechteckiger Grundfläche (`pyramide`)
 * - Kreiskegel (`kegel`)
 * - Kreiszylinder (`zylinder`)
 * - Prisma (`prisma`) mit Grundflächen: `dg`, `dr`, `al`, `pa`, `tr`, `ra`, `dk`, `se`
 * - Kugel (`kugel`)
 */

const GRUNDFLAECHEN_NAMEN = {
  dg: 'Gleichschenkliges Dreieck',
  dr: 'Rechtwinkliges Dreieck',
  al: 'Allgemeines Dreieck',
  pa: 'Parallelogramm',
  tr: 'Gleichschenkliges Trapez',
  ra: 'Raute',
  dk: 'Drachenviereck',
  se: 'Regelmäßiges Sechseck'
};

const KOERPER_META = {
  wuerfel: { name: 'Würfel', genitiv: 'des Würfels' },
  quader: { name: 'Quader', genitiv: 'des Quaders' },
  pyramide: { name: 'Pyramide', genitiv: 'der Pyramide' },
  kegel: { name: 'Kreiskegel', genitiv: 'des Kreiskegels' },
  zylinder: { name: 'Kreiszylinder', genitiv: 'des Kreiszylinders' },
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

function fmtWert(x, einheit, stellen = 2) {
  const istApprox = Math.abs(runde(x, stellen) - x) > 1e-9;
  return `${istApprox ? '≈ ' : ''}${fmtZahl(x, stellen)} ${einheit}`;
}

function fmtCm(x, stellen = 2) {
  return `${fmtZahl(x, stellen)} cm`;
}

function pruefePositiv(werte) {
  for (const [k, v] of Object.entries(werte)) {
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) {
      throw new Error(`Ungültiger Wert für "${k}": Erwartet wird eine positive Zahl.`);
    }
  }
}

function span(klasse, inhalt) {
  return `<span class="${klasse}">${inhalt}</span>`;
}

const gVar = (s) => span('kg', s);
const gVal = (x) => span('kg', fmtCm(x));
const sVar = (s) => span('ks', s);
const sVal = (x) => span('ks', fmtCm(x));
const hVar = (s) => span('kh', s);
const hVal = (x) => span('kh', fmtCm(x));

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
    html: schritteZuHtml(koerper, gegeben, schritte, extra.grundflaeche)
  };
}

function schritteZuHtml(koerper, gegeben, schritte, grundflaeche = null) {
  const meta = KOERPER_META[koerper] ?? { name: koerper };
  const titelZusatz =
    koerper === 'prisma' && grundflaeche
      ? ` (${GRUNDFLAECHEN_NAMEN[grundflaeche] ?? grundflaeche})`
      : '';

  const gegebenText = Object.entries(gegeben)
    .map(([k, v]) => `${k} = ${fmtCm(v)}`)
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
function berechneWuerfel({ a }) {
  pruefePositiv({ a });

  const grundflaecheFlaeche = a * a;
  const mantelflaeche = 4 * a * a;
  const oberflaecheninhalt = 6 * a * a;
  const volumen = a ** 3;
  const flaechendiagonale = a * Math.SQRT2;
  const raumdiagonale = a * Math.sqrt(3);

  const schritte = [
    abschnitt('Weitere Maße des Würfels', [
      textSchritt('Grundfläche, Mantelfläche und Diagonalen aus der Kantenlänge a'),
      eq(gVar('A<sub>G</sub>'), [gVar('a²'), `(${gVal(a)})²`, fmtWert(grundflaecheFlaeche, 'cm²')]),
      eq(sVar('A<sub>M</sub>'), [`4 · ${gVar('a²')}`, `4 · (${gVal(a)})²`, fmtWert(mantelflaeche, 'cm²')]),
      eq('d<sub>F</sub>', [`${gVar('a')} · √2`, `${gVal(a)} · √2`, fmtWert(flaechendiagonale, 'cm')]),
      eq('d<sub>R</sub>', [`${gVar('a')} · √3`, `${gVal(a)} · √3`, fmtWert(raumdiagonale, 'cm')])
    ]),
    abschnitt('Volumen V', [
      eq(
        'V',
        [
          gVar('a³'),
          `(${gVal(a)})³`,
          `${gVal(a)} · ${gVal(a)} · ${gVal(a)}`,
          fmtWert(volumen, 'cm³')
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
          `6 · ${fmtZahl(grundflaecheFlaeche)} cm²`,
          fmtWert(oberflaecheninhalt, 'cm²')
        ],
        true
      )
    ])
  ];

  return baueErgebnis(
    'wuerfel',
    { a },
    {
      a,
      grundflaeche: grundflaecheFlaeche,
      mantelflaeche,
      flaechendiagonale,
      raumdiagonale
    },
    volumen,
    oberflaecheninhalt,
    schritte
  );
}

/**
 * 2. Quader
 * Gegeben: { a, b, c }
 */
function berechneQuader({ a, b, c }) {
  pruefePositiv({ a, b, c });

  const grundflaecheFlaeche = a * b;
  const umfangGrundflaeche = 2 * (a + b);
  const mantelflaeche = umfangGrundflaeche * c;
  const oberflaecheninhalt = 2 * (a * b + a * c + b * c);
  const volumen = a * b * c;
  const raumdiagonale = Math.hypot(a, b, c);

  const schritte = [
    abschnitt('Weitere Maße des Quaders', [
      textSchritt('Grundfläche, Umfang der Grundfläche, Mantelfläche und Raumdiagonale'),
      eq(gVar('A<sub>G</sub>'), [`${gVar('a')} · ${gVar('b')}`, `${gVal(a)} · ${gVal(b)}`, fmtWert(grundflaecheFlaeche, 'cm²')]),
      eq(sVar('A<sub>M</sub>'), [
        `2 · (${gVar('a')} + ${gVar('b')}) · ${hVar('c')}`,
        `2 · (${gVal(a)} + ${gVal(b)}) · ${hVal(c)}`,
        fmtWert(mantelflaeche, 'cm²')
      ]),
      eq('d', [
        `√(${gVar('a²')} + ${gVar('b²')} + ${hVar('c²')})`,
        `√(${fmtZahl(a * a)} cm² + ${fmtZahl(b * b)} cm² + ${fmtZahl(c * c)} cm²)`,
        fmtWert(raumdiagonale, 'cm')
      ])
    ]),
    abschnitt('Volumen V', [
      eq('V', [`${gVar('a')} · ${gVar('b')} · ${hVar('c')}`, `${gVal(a)} · ${gVal(b)} · ${hVal(c)}`, fmtWert(volumen, 'cm³')], true)
    ]),
    abschnitt('Oberflächeninhalt A<sub>O</sub>', [
      textSchritt('Der Quader hat drei Paare gleich großer Rechtecke.'),
      eq(
        'A<sub>O</sub>',
        [
          `2 · (${gVar('a')}·${gVar('b')} + ${gVar('a')}·${hVar('c')} + ${gVar('b')}·${hVar('c')})`,
          `2 · (${gVal(a)}·${gVal(b)} + ${gVal(a)}·${hVal(c)} + ${gVal(b)}·${hVal(c)})`,
          `2 · (${fmtZahl(a * b)} cm² + ${fmtZahl(a * c)} cm² + ${fmtZahl(b * c)} cm²)`,
          `2 · ${fmtZahl(a * b + a * c + b * c)} cm²`,
          fmtWert(oberflaecheninhalt, 'cm²')
        ],
        true
      )
    ])
  ];

  return baueErgebnis(
    'quader',
    { a, b, c },
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
    schritte
  );
}

/**
 * 3. Pyramide (rechteckige Grundfläche a × b, Höhe h)
 * Gegeben: { a, b, h }
 */
function berechnePyramide({ a, b, h }) {
  pruefePositiv({ a, b, h });

  const grundflaecheFlaeche = a * b;
  const ha = Math.hypot(h, b / 2);
  const hb = Math.hypot(h, a / 2);
  const seitenkante = Math.hypot(h, Math.hypot(a, b) / 2);
  const mantelflaeche = a * ha + b * hb;
  const oberflaecheninhalt = grundflaecheFlaeche + mantelflaeche;
  const volumen = (grundflaecheFlaeche * h) / 3;

  const schritte = [
    abschnitt('Volumen V', [
      textSchritt('Grundfläche (Rechteck)'),
      eq(gVar('A<sub>G</sub>'), [`${gVar('a')} · ${gVar('b')}`, `${gVal(a)} · ${gVal(b)}`, fmtWert(grundflaecheFlaeche, 'cm²')]),
      textSchritt('Volumen der Pyramide'),
      eq('V', [`⅓ · ${gVar('A<sub>G</sub>')} · ${hVar('h')}`, `⅓ · ${fmtZahl(grundflaecheFlaeche)} cm² · ${hVal(h)}`, fmtWert(volumen, 'cm³')], true)
    ]),
    abschnitt('Seitenhöhen, Seitenkanten und Oberflächeninhalt A<sub>O</sub>', [
      textSchritt('Höhe der Seitenflächen über der Kante a'),
      eq(sVar('h<sub>a</sub>'), [
        `√(${hVar('h²')} + (${gVar('b')}/2)²)`,
        `√((${hVal(h)})² + (${gVal(b / 2)})²)`,
        `√(${fmtZahl(h * h)} cm² + ${fmtZahl((b * b) / 4)} cm²)`,
        fmtWert(ha, 'cm')
      ]),
      textSchritt('Höhe der Seitenflächen über der Kante b'),
      eq(sVar('h<sub>b</sub>'), [
        `√(${hVar('h²')} + (${gVar('a')}/2)²)`,
        `√((${hVal(h)})² + (${gVal(a / 2)})²)`,
        `√(${fmtZahl(h * h)} cm² + ${fmtZahl((a * a) / 4)} cm²)`,
        fmtWert(hb, 'cm')
      ]),
      textSchritt('Seitenkante s'),
      eq(sVar('s'), [
        `√(${hVar('h²')} + (${gVar('a')}/2)² + (${gVar('b')}/2)²)`,
        fmtWert(seitenkante, 'cm')
      ]),
      textSchritt('Mantel: zwei Paare gleicher Dreiecke'),
      eq(sVar('A<sub>M</sub>'), [
        `2 · ½ · ${gVar('a')} · ${sVar('h<sub>a</sub>')} + 2 · ½ · ${gVar('b')} · ${sVar('h<sub>b</sub>')}`,
        `${gVar('a')} · ${sVar('h<sub>a</sub>')} + ${gVar('b')} · ${sVar('h<sub>b</sub>')}`,
        `${gVal(a)} · ${sVal(ha)} + ${gVal(b)} · ${sVal(hb)}`,
        fmtWert(mantelflaeche, 'cm²')
      ]),
      textSchritt('Oberflächeninhalt'),
      eq(
        'A<sub>O</sub>',
        [`${gVar('A<sub>G</sub>')} + ${sVar('A<sub>M</sub>')}`, `${fmtZahl(grundflaecheFlaeche)} cm² + ${fmtZahl(mantelflaeche)} cm²`, fmtWert(oberflaecheninhalt, 'cm²')],
        true
      )
    ])
  ];

  return baueErgebnis(
    'pyramide',
    { a, b, h },
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
    schritte
  );
}

/**
 * 4. Kreiskegel
 * Gegeben: { r, h }
 */
function berechneKegel({ r, h }) {
  pruefePositiv({ r, h });

  const durchmesser = 2 * r;
  const umfangGrundkreis = 2 * Math.PI * r;
  const mantellinie = Math.hypot(r, h);
  const sektorwinkelGrad = (360 * r) / mantellinie;
  const grundflaecheFlaeche = Math.PI * r * r;
  const mantelflaeche = Math.PI * r * mantellinie;
  const oberflaecheninhalt = grundflaecheFlaeche + mantelflaeche;
  const volumen = (grundflaecheFlaeche * h) / 3;

  const schritte = [
    abschnitt('Volumen V', [
      eq(
        'V',
        [
          `⅓ · π · ${gVar('r²')} · ${hVar('h')}`,
          `⅓ · π · (${gVal(r)})² · ${hVal(h)}`,
          `⅓ · π · ${fmtZahl(r * r)} cm² · ${hVal(h)}`,
          fmtWert(volumen, 'cm³')
        ],
        true
      )
    ]),
    abschnitt('Mantellinie, weitere Maße und Oberflächeninhalt A<sub>O</sub>', [
      textSchritt('Mantellinie s'),
      eq(sVar('s'), [
        `√(${gVar('r²')} + ${hVar('h²')})`,
        `√((${gVal(r)})² + (${hVal(h)})²)`,
        `√(${fmtZahl(r * r)} cm² + ${fmtZahl(h * h)} cm²)`,
        fmtWert(mantellinie, 'cm')
      ]),
      textSchritt('Durchmesser, Grundkreisumfang und Mittelpunktswinkel des Netzes'),
      eq(gVar('d'), [`2 · ${gVar('r')}`, `2 · ${gVal(r)}`, fmtWert(durchmesser, 'cm')]),
      eq(gVar('u'), [`2 · π · ${gVar('r')}`, `2 · π · ${gVal(r)}`, fmtWert(umfangGrundkreis, 'cm')]),
      eq(sVar('α'), [`360° · ${gVar('r')} : ${sVar('s')}`, `360° · ${fmtZahl(r)} : ${fmtZahl(mantellinie)}`, fmtWert(sektorwinkelGrad, '°')]),
      textSchritt('Grundfläche'),
      eq(gVar('A<sub>G</sub>'), [`π · ${gVar('r²')}`, `π · (${gVal(r)})²`, fmtWert(grundflaecheFlaeche, 'cm²')]),
      textSchritt('Mantelfläche'),
      eq(sVar('A<sub>M</sub>'), [`π · ${gVar('r')} · ${sVar('s')}`, `π · ${gVal(r)} · ${sVal(mantellinie)}`, fmtWert(mantelflaeche, 'cm²')]),
      textSchritt('Oberflächeninhalt'),
      eq(
        'A<sub>O</sub>',
        [`${gVar('A<sub>G</sub>')} + ${sVar('A<sub>M</sub>')}`, `${fmtZahl(grundflaecheFlaeche)} cm² + ${fmtZahl(mantelflaeche)} cm²`, fmtWert(oberflaecheninhalt, 'cm²')],
        true
      )
    ])
  ];

  return baueErgebnis(
    'kegel',
    { r, h },
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
    schritte
  );
}

/**
 * 5. Kreiszylinder
 * Gegeben: { r, h }
 */
function berechneZylinder({ r, h }) {
  pruefePositiv({ r, h });

  const durchmesser = 2 * r;
  const umfangGrundkreis = 2 * Math.PI * r;
  const grundflaecheFlaeche = Math.PI * r * r;
  const mantelflaeche = 2 * Math.PI * r * h;
  const oberflaecheninhalt = 2 * grundflaecheFlaeche + mantelflaeche;
  const volumen = grundflaecheFlaeche * h;

  const schritte = [
    abschnitt('Volumen V', [
      eq(
        'V',
        [
          `π · ${gVar('r²')} · ${hVar('h')}`,
          `π · (${gVal(r)})² · ${hVal(h)}`,
          `π · ${fmtZahl(r * r)} cm² · ${hVal(h)}`,
          fmtWert(volumen, 'cm³')
        ],
        true
      )
    ]),
    abschnitt('Weitere Maße und Oberflächeninhalt A<sub>O</sub>', [
      textSchritt('Durchmesser und Grundkreisumfang'),
      eq(gVar('d'), [`2 · ${gVar('r')}`, `2 · ${gVal(r)}`, fmtWert(durchmesser, 'cm')]),
      eq(gVar('u'), [`2 · π · ${gVar('r')}`, `2 · π · ${gVal(r)}`, fmtWert(umfangGrundkreis, 'cm')]),
      textSchritt('Grund- und Deckfläche (zwei gleiche Kreise)'),
      eq(gVar('A<sub>G</sub>'), [`π · ${gVar('r²')}`, `π · (${gVal(r)})²`, fmtWert(grundflaecheFlaeche, 'cm²')]),
      textSchritt('Mantelfläche (Rechteck mit Umfang 2πr und Höhe h)'),
      eq(sVar('A<sub>M</sub>'), [`2 · π · ${gVar('r')} · ${hVar('h')}`, `2 · π · ${gVal(r)} · ${hVal(h)}`, fmtWert(mantelflaeche, 'cm²')]),
      textSchritt('Oberflächeninhalt'),
      eq(
        'A<sub>O</sub>',
        [`2 · ${gVar('A<sub>G</sub>')} + ${sVar('A<sub>M</sub>')}`, `2 · ${fmtZahl(grundflaecheFlaeche)} cm² + ${fmtZahl(mantelflaeche)} cm²`, fmtWert(oberflaecheninhalt, 'cm²')],
        true
      )
    ])
  ];

  return baueErgebnis(
    'zylinder',
    { r, h },
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
    schritte
  );
}

/**
 * 6. Prisma
 * grundflaeche: 'dg' | 'dr' | 'al' | 'pa' | 'tr' | 'ra' | 'dk' | 'se'
 */
function berechnePrisma(grundflaeche, masseEingabe) {
  if (!GRUNDFLAECHEN_NAMEN[grundflaeche]) {
    throw new Error(`Unbekannte Grundfläche für Prisma: "${grundflaeche}".`);
  }
  if (!masseEingabe || typeof masseEingabe !== 'object') {
    throw new Error('Für das Prisma werden positive Maße als Objekt erwartet.');
  }

  const erforderlicheMasse = {
    dg: ['a', 'ha', 'h'],
    dr: ['a', 'b', 'h'],
    al: ['a', 'ha', 'p', 'h'],
    pa: ['a', 'b', 'ha', 'h'],
    tr: ['a', 'c', 'ha', 'h'],
    ra: ['e', 'f', 'h'],
    dk: ['e', 'f', 'm', 'h'],
    se: ['a', 'h']
  };

  const gefordert = {};
  for (const key of erforderlicheMasse[grundflaeche]) {
    gefordert[key] = masseEingabe[key];
  }
  pruefePositiv(gefordert);

  const { a, b, c, ha, e, f, p, m, h } = masseEingabe;
  const grundText = GRUNDFLAECHEN_NAMEN[grundflaeche];

  let grundSchritte = [];
  let grundflaecheFlaeche = 0;
  let umfangGrundflaeche = 0;
  let formelGrund = [];
  let formelUmfang = [];
  let weitereMasse = { h };

  if (grundflaeche === 'dg') {
    const s = Math.hypot(a / 2, ha);
    grundflaecheFlaeche = (a * ha) / 2;
    umfangGrundflaeche = a + 2 * s;
    weitereMasse = { ...weitereMasse, a, ha, s };
    grundSchritte = [
      textSchritt('Länge der Schenkel s'),
      eq(gVar('s'), [
        `√((${gVar('a')}/2)² + ${gVar('h<sub>a</sub>²')})`,
        `√((${gVal(a / 2)})² + (${gVal(ha)})²)`,
        `√(${fmtZahl((a * a) / 4)} cm² + ${fmtZahl(ha * ha)} cm²)`,
        fmtWert(s, 'cm')
      ])
    ];
    formelGrund = [`½ · ${gVar('a')} · ${gVar('h<sub>a</sub>')}`, `½ · ${gVal(a)} · ${gVal(ha)}`, fmtWert(grundflaecheFlaeche, 'cm²')];
    formelUmfang = [`${gVar('a')} + 2 · ${gVar('s')}`, `${gVal(a)} + 2 · ${gVal(s)}`, fmtWert(umfangGrundflaeche, 'cm')];
  } else if (grundflaeche === 'dr') {
    const hyp = Math.hypot(a, b);
    grundflaecheFlaeche = (a * b) / 2;
    umfangGrundflaeche = a + b + hyp;
    weitereMasse = { ...weitereMasse, a, b, c: hyp };
    grundSchritte = [
      textSchritt('Hypotenuse c'),
      eq(gVar('c'), [
        `√(${gVar('a²')} + ${gVar('b²')})`,
        `√((${gVal(a)})² + (${gVal(b)})²)`,
        `√(${fmtZahl(a * a)} cm² + ${fmtZahl(b * b)} cm²)`,
        fmtWert(hyp, 'cm')
      ])
    ];
    formelGrund = [`½ · ${gVar('a')} · ${gVar('b')}`, `½ · ${gVal(a)} · ${gVal(b)}`, fmtWert(grundflaecheFlaeche, 'cm²')];
    formelUmfang = [`${gVar('a')} + ${gVar('b')} + ${gVar('c')}`, `${gVal(a)} + ${gVal(b)} + ${gVal(hyp)}`, fmtWert(umfangGrundflaeche, 'cm')];
  } else if (grundflaeche === 'al') {
    const sb = Math.hypot(a - p, ha);
    const sc = Math.hypot(p, ha);
    grundflaecheFlaeche = (a * ha) / 2;
    umfangGrundflaeche = a + sb + sc;
    weitereMasse = { ...weitereMasse, a, ha, p, b: sb, c: sc };
    grundSchritte = [
      textSchritt('Länge der Seiten b und c'),
      eq(gVar('b'), [
        `√((${gVar('a')} − ${gVar('p')})² + ${gVar('h<sub>a</sub>²')})`,
        `√((${gVal(a - p)})² + (${gVal(ha)})²)`,
        `√(${fmtZahl((a - p) ** 2)} cm² + ${fmtZahl(ha * ha)} cm²)`,
        fmtWert(sb, 'cm')
      ]),
      eq(gVar('c'), [
        `√(${gVar('p²')} + ${gVar('h<sub>a</sub>²')})`,
        `√((${gVal(p)})² + (${gVal(ha)})²)`,
        `√(${fmtZahl(p * p)} cm² + ${fmtZahl(ha * ha)} cm²)`,
        fmtWert(sc, 'cm')
      ])
    ];
    formelGrund = [`½ · ${gVar('a')} · ${gVar('h<sub>a</sub>')}`, `½ · ${gVal(a)} · ${gVal(ha)}`, fmtWert(grundflaecheFlaeche, 'cm²')];
    formelUmfang = [`${gVar('a')} + ${gVar('b')} + ${gVar('c')}`, `${gVal(a)} + ${gVal(sb)} + ${gVal(sc)}`, fmtWert(umfangGrundflaeche, 'cm')];
  } else if (grundflaeche === 'pa') {
    if (b <= ha) {
      throw new Error('Beim Parallelogramm muss die Seite b größer sein als die Höhe ha.');
    }
    const versatz = Math.sqrt(b * b - ha * ha);
    grundflaecheFlaeche = a * ha;
    umfangGrundflaeche = 2 * (a + b);
    weitereMasse = { ...weitereMasse, a, b, ha, versatz };
    grundSchritte = [
      textSchritt('Horizontale Verschiebung aus Seite b und Höhe h<sub>a</sub>'),
      eq(gVar('p'), [`√(${gVar('b²')} − ${gVar('h<sub>a</sub>²')})`, fmtWert(versatz, 'cm')])
    ];
    formelGrund = [`${gVar('a')} · ${gVar('h<sub>a</sub>')}`, `${gVal(a)} · ${gVal(ha)}`, fmtWert(grundflaecheFlaeche, 'cm²')];
    formelUmfang = [`2 · (${gVar('a')} + ${gVar('b')})`, `2 · (${gVal(a)} + ${gVal(b)})`, fmtWert(umfangGrundflaeche, 'cm')];
  } else if (grundflaeche === 'tr') {
    const d = Math.hypot((a - c) / 2, ha);
    grundflaecheFlaeche = ((a + c) / 2) * ha;
    umfangGrundflaeche = a + c + 2 * d;
    weitereMasse = { ...weitereMasse, a, c, ha, d };
    grundSchritte = [
      textSchritt('Länge der Schenkel d'),
      eq(gVar('d'), [
        `√(((${gVar('a')} − ${gVar('c')})/2)² + ${gVar('h<sub>a</sub>²')})`,
        `√((${gVal((a - c) / 2)})² + (${gVal(ha)})²)`,
        `√(${fmtZahl(((a - c) / 2) ** 2)} cm² + ${fmtZahl(ha * ha)} cm²)`,
        fmtWert(d, 'cm')
      ])
    ];
    formelGrund = [
      `½ · (${gVar('a')} + ${gVar('c')}) · ${gVar('h<sub>a</sub>')}`,
      `½ · (${gVal(a)} + ${gVal(c)}) · ${gVal(ha)}`,
      fmtWert(grundflaecheFlaeche, 'cm²')
    ];
    formelUmfang = [`${gVar('a')} + ${gVar('c')} + 2 · ${gVar('d')}`, `${gVal(a)} + ${gVal(c)} + 2 · ${gVal(d)}`, fmtWert(umfangGrundflaeche, 'cm')];
  } else if (grundflaeche === 'ra') {
    const kante = Math.hypot(e / 2, f / 2);
    grundflaecheFlaeche = (e * f) / 2;
    umfangGrundflaeche = 4 * kante;
    weitereMasse = { ...weitereMasse, e, f, a: kante };
    grundSchritte = [
      textSchritt('Seitenlänge a der Raute'),
      eq(gVar('a'), [
        `√((${gVar('e')}/2)² + (${gVar('f')}/2)²)`,
        `√((${gVal(e / 2)})² + (${gVal(f / 2)})²)`,
        `√(${fmtZahl((e * e) / 4)} cm² + ${fmtZahl((f * f) / 4)} cm²)`,
        fmtWert(kante, 'cm')
      ])
    ];
    formelGrund = [`½ · ${gVar('e')} · ${gVar('f')}`, `½ · ${gVal(e)} · ${gVal(f)}`, fmtWert(grundflaecheFlaeche, 'cm²')];
    formelUmfang = [`4 · ${gVar('a')}`, `4 · ${gVal(kante)}`, fmtWert(umfangGrundflaeche, 'cm')];
  } else if (grundflaeche === 'dk') {
    if (m >= e) {
      throw new Error('Beim Drachenviereck muss der Abschnitt m kleiner sein als die Diagonale e.');
    }
    const sa = Math.hypot(f / 2, m);
    const sb = Math.hypot(f / 2, e - m);
    grundflaecheFlaeche = (e * f) / 2;
    umfangGrundflaeche = 2 * (sa + sb);
    weitereMasse = { ...weitereMasse, e, f, m, a: sa, b: sb };
    grundSchritte = [
      textSchritt('Länge der Seiten a und b'),
      eq(gVar('a'), [
        `√((${gVar('f')}/2)² + ${gVar('m²')})`,
        `√((${gVal(f / 2)})² + (${gVal(m)})²)`,
        `√(${fmtZahl((f * f) / 4)} cm² + ${fmtZahl(m * m)} cm²)`,
        fmtWert(sa, 'cm')
      ]),
      eq(gVar('b'), [
        `√((${gVar('f')}/2)² + (${gVar('e')} − ${gVar('m')})²)`,
        `√((${gVal(f / 2)})² + (${gVal(e - m)})²)`,
        `√(${fmtZahl((f * f) / 4)} cm² + ${fmtZahl((e - m) ** 2)} cm²)`,
        fmtWert(sb, 'cm')
      ])
    ];
    formelGrund = [`½ · ${gVar('e')} · ${gVar('f')}`, `½ · ${gVal(e)} · ${gVal(f)}`, fmtWert(grundflaecheFlaeche, 'cm²')];
    formelUmfang = [`2 · (${gVar('a')} + ${gVar('b')})`, `2 · (${gVal(sa)} + ${gVal(sb)})`, fmtWert(umfangGrundflaeche, 'cm')];
  } else if (grundflaeche === 'se') {
    grundflaecheFlaeche = 1.5 * Math.sqrt(3) * a * a;
    umfangGrundflaeche = 6 * a;
    weitereMasse = { ...weitereMasse, a };
    formelGrund = [`(3/2) · √3 · ${gVar('a²')}`, `(3/2) · √3 · (${gVal(a)})²`, fmtWert(grundflaecheFlaeche, 'cm²')];
    formelUmfang = [`6 · ${gVar('a')}`, `6 · ${gVal(a)}`, fmtWert(umfangGrundflaeche, 'cm')];
  }

  const mantelflaeche = umfangGrundflaeche * h;
  const oberflaecheninhalt = 2 * grundflaecheFlaeche + mantelflaeche;
  const volumen = grundflaecheFlaeche * h;

  const schritte = [
    abschnitt(`Grundfläche A<sub>G</sub> (${grundText})`, [...grundSchritte, eq(gVar('A<sub>G</sub>'), formelGrund)]),
    abschnitt('Volumen V', [
      eq('V', [`${gVar('A<sub>G</sub>')} · ${hVar('h')}`, `${fmtZahl(grundflaecheFlaeche)} cm² · ${hVal(h)}`, fmtWert(volumen, 'cm³')], true)
    ]),
    abschnitt('Oberflächeninhalt A<sub>O</sub>', [
      textSchritt('Umfang der Grundfläche'),
      eq(gVar('U'), formelUmfang),
      textSchritt('Mantelfläche (Rechtecke nebeneinander)'),
      eq(sVar('A<sub>M</sub>'), [`${gVar('U')} · ${hVar('h')}`, `${fmtZahl(umfangGrundflaeche)} cm · ${hVal(h)}`, fmtWert(mantelflaeche, 'cm²')]),
      textSchritt('Oberflächeninhalt'),
      eq(
        'A<sub>O</sub>',
        [
          `2 · ${gVar('A<sub>G</sub>')} + ${sVar('A<sub>M</sub>')}`,
          `2 · ${fmtZahl(grundflaecheFlaeche)} cm² + ${fmtZahl(mantelflaeche)} cm²`,
          fmtWert(oberflaecheninhalt, 'cm²')
        ],
        true
      )
    ])
  ];

  return baueErgebnis(
    'prisma',
    masseEingabe,
    {
      ...weitereMasse,
      grundflaeche: grundflaecheFlaeche,
      umfangGrundflaeche,
      mantelflaeche
    },
    volumen,
    oberflaecheninhalt,
    schritte,
    { grundflaeche }
  );
}

/**
 * 7. Kugel
 * Gegeben: { r }
 */
function berechneKugel({ r }) {
  pruefePositiv({ r });

  const durchmesser = 2 * r;
  const grosskreisUmfang = 2 * Math.PI * r;
  const grosskreisFlaeche = Math.PI * r * r;
  const volumen = (4 / 3) * Math.PI * r ** 3;
  const oberflaecheninhalt = 4 * Math.PI * r * r;

  const schritte = [
    abschnitt('Weitere Maße der Kugel', [
      textSchritt('Durchmesser, Großkreisumfang und Großkreisfläche'),
      eq(gVar('d'), [`2 · ${gVar('r')}`, `2 · ${gVal(r)}`, fmtWert(durchmesser, 'cm')]),
      eq(gVar('u'), [`2 · π · ${gVar('r')}`, `2 · π · ${gVal(r)}`, fmtWert(grosskreisUmfang, 'cm')]),
      eq(gVar('A<sub>K</sub>'), [`π · ${gVar('r²')}`, `π · (${gVal(r)})²`, fmtWert(grosskreisFlaeche, 'cm²')])
    ]),
    abschnitt('Volumen V', [
      eq(
        'V',
        [
          `(4/3) · π · ${gVar('r³')}`,
          `(4/3) · π · (${gVal(r)})³`,
          `(4/3) · π · ${fmtZahl(r ** 3)} cm³`,
          fmtWert(volumen, 'cm³')
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
          `4 · π · ${fmtZahl(r * r)} cm²`,
          fmtWert(oberflaecheninhalt, 'cm²')
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
    schritte
  );
}

/**
 * Zentrale Einstiegsfunktion:
 * berechneKoerper('prisma', { a: 4, ha: 3, h: 5 }, { grundflaeche: 'dg' })
 */
function berechneKoerper(koerper, masse, optionen = {}) {
  if (!masse || typeof masse !== 'object') {
    throw new Error('Die Körpermaße müssen als Objekt mit positiven Zahlen übergeben werden.');
  }
  if (!optionen || typeof optionen !== 'object') {
    throw new Error('Die Körperoptionen müssen als Objekt übergeben werden.');
  }

  switch (koerper) {
    case 'wuerfel':
      return berechneWuerfel(masse);
    case 'quader':
      return berechneQuader(masse);
    case 'pyramide':
      return berechnePyramide(masse);
    case 'kegel':
      return berechneKegel(masse);
    case 'zylinder':
      return berechneZylinder(masse);
    case 'prisma': {
      const gf = optionen.grundflaeche ?? masse.grundflaeche ?? 'dg';
      return berechnePrisma(gf, masse);
    }
    case 'kugel':
      return berechneKugel(masse);
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
    berechnePrisma,
    berechneKugel,
    schritteZuHtml
  };

  window.MTGSolidSolver = api;
}