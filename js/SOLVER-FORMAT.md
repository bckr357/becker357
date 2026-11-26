# Solver-Format (MTG)

Referenz: `solid-solver.js`. Alle Solver (Körper, Dreieck, weitere) halten sich daran.

## Modul
- Eine Datei pro Solver, API-Objekt `MTG<Name>Solver`; dasselbe Objekt über `globalThis`/`window` **und** `module.exports`.
- Abhängigkeiten nur über `globalThis.MTG<Name>Solver` (vorher die Datei laden / `require`n).

## Einstieg
`berechne<Gegenstand>(masse, optionen)`; bei mehreren Typen steht die Typkennung vorn: `berechneKoerper(koerper, masse, optionen)`.
- `masse`: flaches Objekt, Längen > 0, Winkel in Grad (`alpha`, `beta`, `gamma`).
- `optionen`: `einheit: { laenge, flaeche, volumen }` (Standard cm / cm² / cm³), weitere Optionen deutsch benannt (`stellen`, `mehrdeutigErlaubt`, …).
- Ungültige Eingaben: `throw new Error('<deutsche, schülertaugliche Meldung>')`, nie `null`/stilles Ignorieren.

## Ergebnis
```
{ <typ>, bezeichnung, einheit, gegeben, masse, <kennzahlen…>, schritte, html }
```
| Feld | Inhalt |
|---|---|
| `<typ>` | Typkennung, benannt nach der Domäne (`koerper: 'kegel'`, `figur: 'dreieck'`) |
| `gegeben` | tatsächlich verwendete Eingaben, kanonische Schlüssel |
| `masse` | alle Maße (gegeben + berechnet), keine doppelten Schlüssel (kein `al`/`alpha`) |
| `<kennzahlen>` | Hauptergebnisse als Zahlen, ungerundet (Körper: `volumen`, `oberflaecheninhalt`; Dreieck: `umfang`, `flaecheninhalt`) |
| `schritte` | Lösungsweg als Abschnitte (s. u.) |
| `html` | `schritteZuHtml(typ, gegeben, schritte, …)`, ebenfalls exportiert |

Mehrere mögliche Lösungen: zusätzlich `eindeutig`, `anzahlLoesungen`, `loesungen` (jede im selben Format).

## Lösungsweg
```
schritte = [ { titel, elemente: [ Element, … ] }, … ]
Element  = { typ: 'text', text }                                   // HTML
         | { typ: 'gleichung', links, zeilen: [ { operator, ausdruck, ergebnis } ] }
```
- `operator` ist `'='` oder `'≈'` (gerundet); `links`/`ausdruck`/`text` sind HTML.
- Ein Abschnitt je gesuchter Größe, der Titel nennt das Formelzeichen (`Volumen V`, `Umfang u`).
- Zeilen je Gleichung: Formel → eingesetzt → (Zwischenschritte) → Ergebnis.
- `ergebnis: true` nur auf der letzten Zeile der Endergebnisse, nie bei Zwischenwerten.
- CSS-Klassen: `lw`, `sec`, `st`, `eq`, `l`, `res`, Farbklassen `kg`/`ks`/`kh`.

## Renderer
Referenz: `triangle-renderer.js`. Ein Renderer zeichnet das Ergebnis eines Solvers; er rechnet nichts selbst.
- Datei `<name>-renderer.js`, API-Objekt `MTG<Name>Renderer`, gleiche UMD-Hülle und gleicher Export wie die Solver. Keine Abhängigkeit zum Solver, kein Zugriff beim Laden.
- Einstieg: `zeichne<Gegenstand>(ziel, ergebnis, optionen)` gibt `Promise<Element>` zurück. Es wird erfüllt, nachdem MathJax gesetzt hat. Ohne MathJax (ca. 2 s Wartezeit) erscheinen Klartext-Beschriftungen. Dazu `zeichne<Gegenstand>AlsSvg(ergebnis, optionen)` → SVG-String, synchron und ohne DOM.
- Eingabe: das Solver-Ergebnis. Gelesen werden `<typ>`, `masse`, `gegeben` und `einheit`. Ist die Typkennung falsch, wird ein Fehler geworfen.
- Optionen deutsch, gemeinsame Namen: `ansicht { breite, hoehe, rand }`, `stellen`, `einheit` (überschreibt die des Ergebnisses), `formelsatz`, `zeige { … }`, `hervorhebung` (`'rolle' | 'eigen' | 'keine'`), `hervorhebungen`, `farben`, `stil`. Unbekannte oder ungültige Optionen werfen einen Fehler mit deutscher Meldung.
- CSS: nur Klassen `mtg-<kürzel>-…` und Variablen `--mtg-…`, definiert in `:where(:root)` (die Seite kann sie überschreiben), mit Dark-Mode-Werten. Seitenvariablen (`--txt`, `--acc`, `--fill`, `--surf`) werden nur gelesen, jeweils mit `--mtg-…` als Fallback. Keine globalen Variablen definieren.
- Farben: `'rolle'` färbt gegebene (`--mtg-gegeben`) und berechnete (`--mtg-berechnet`) Größen.
- Beschriftungslänge für das Layout wird aus dem Klartext geschätzt, nie aus dem TeX-Quelltext.

## Neuer Solver – Checkliste
1. UMD-Hülle und Export wie oben, Name `MTG<Name>Solver`.
2. Einstieg `berechne<Gegenstand>`, Optionen pro Aufruf (kein globaler Zustand).
3. Ergebnis mit den Pflichtfeldern, `schritte` als Abschnitte, `html` über `schritteZuHtml`.
4. Kurztest: ein Standardfall, ein Fehlerfall.

## Noch nicht vereinheitlicht
- `solid-solver.js` hält die Einheit global (`setEinheit`); das Dreieck bekommt sie pro Aufruf.
- Farbsemantik: Körper-HTML färbt nach Rolle (Grundkante/Seite/Höhe), Dreieck-HTML und Dreieck-Renderer nach gegeben/berechnet. Ein Körper-Renderer braucht vorher eine Entscheidung.
- `triangle-solver.js`: `solve()` (alte Optionsnamen, `values`, `steps` als LaTeX) bleibt vorerst als veraltete Hülle bestehen.
