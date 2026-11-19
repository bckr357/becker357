// ==============================================================
// AUFGABEN-TYP-DEFINITIONEN
// ==============================================================

// Sichtbare Aufgabentypen je Klassenstufe (wird vom UI-Dropdown genutzt)
const taskTypesByGrade = {
	grundschule: [
		'einmaleins_2', 'geteilt_durch_2', 'einmaleins_3', 'geteilt_durch_3',
		'einmaleins_4', 'geteilt_durch_4', 'einmaleins_5', 'geteilt_durch_5',
		'einmaleins_6', 'geteilt_durch_6', 'einmaleins_7', 'geteilt_durch_7',
		'einmaleins_8', 'geteilt_durch_8', 'einmaleins_9', 'geteilt_durch_9',
		'einmaleins_10', 'geteilt_durch_10',
		'addition_bis_10', 'subtraktion_bis_10', 'addition_bis_20', 'subtraktion_bis_20',
		'addition_bis_50', 'subtraktion_bis_50', 'addition_bis_100', 'subtraktion_bis_100',
		'addition_bis_1000', 'subtraktion_bis_1000',
		'kleines_1x1_multiplikation', 'kleines_1x1_division', 'kleines_1x1_komplett',
		'addition_subtraktion_bis_20', 'addition_subtraktion_bis_100', 'addition_subtraktion_bis_1000'
	],
	klasse5: [
		'teiler', 'primzahlen', 'einheiten', 'potenzen', 'natuerliche_zahlen_addieren_subtrahieren', 'natuerliche_zahlen_multiplizieren_dividieren', 'schriftliche_addition_subtraktion', 'schriftliche_multiplikation_division', 'dezimalbrueche_addieren_subtrahieren', 'dezimalbrueche_multiplizieren_dividieren', 'zehnerpotenzen_multiplizieren_dividieren', 'vorrang',
		'additionstabellen', 'subtraktionstabellen', 'multiplikationstabellen',
		'runden', 'ueberschlag', 'zahlengerade',
		'wortterme',
		'geometrie', 'winkel'
	],
	klasse6: [
		'teiler', 'primzahlen', 'einheiten', 'potenzen', 'natuerliche_zahlen_addieren_subtrahieren', 'natuerliche_zahlen_multiplizieren_dividieren', 'schriftliche_addition_subtraktion', 'schriftliche_multiplikation_division', 'dezimalbrueche_addieren_subtrahieren', 'dezimalbrueche_multiplizieren_dividieren', 'zehnerpotenzen_multiplizieren_dividieren', 'vorrang',
		'additionstabellen', 'subtraktionstabellen', 'multiplikationstabellen',
		'brueche_kuerzen', 'brueche_umwandeln', 'brueche_addieren_subtrahieren', 'brueche_multiplizieren_dividieren', 'brueche_ordnen', 'runden', 'ueberschlag', 'zahlengerade',
		'wortterme',
		'geometrie', 'winkel'
	],
	klasse7: [
		'teiler', 'primzahlen', 'einheiten', 'potenzen', 'natuerliche_zahlen_addieren_subtrahieren', 'natuerliche_zahlen_multiplizieren_dividieren', 'schriftliche_addition_subtraktion', 'schriftliche_multiplikation_division', 'dezimalbrueche_addieren_subtrahieren', 'dezimalbrueche_multiplizieren_dividieren', 'zehnerpotenzen_multiplizieren_dividieren', 'vorrang',
		'additionstabellen', 'subtraktionstabellen', 'multiplikationstabellen', 'termtabellen',
		'brueche_kuerzen', 'brueche_umwandeln', 'brueche_addieren_subtrahieren', 'brueche_multiplizieren_dividieren', 'brueche_ordnen', 'runden', 'ueberschlag', 'zahlengerade',
		'anteile', 'proportionalitaet',
		'wortterme',
		'geometrie', 'winkel', 'kongruenz'
	],
	klasse8: [
		'teiler', 'primzahlen', 'einheiten', 'potenzen', 'natuerliche_zahlen_addieren_subtrahieren', 'natuerliche_zahlen_multiplizieren_dividieren', 'schriftliche_addition_subtraktion', 'schriftliche_multiplikation_division', 'ganze_zahlen_addieren_subtrahieren', 'ganze_zahlen_multiplizieren_dividieren', 'dezimalbrueche_addieren_subtrahieren', 'dezimalbrueche_multiplizieren_dividieren', 'zehnerpotenzen_multiplizieren_dividieren', 'vorrang',
		'additionstabellen', 'subtraktionstabellen', 'multiplikationstabellen', 'termtabellen',
		'brueche_kuerzen', 'brueche_umwandeln', 'brueche_addieren_subtrahieren', 'brueche_multiplizieren_dividieren', 'brueche_ordnen', 'runden', 'ueberschlag', 'zahlengerade',
		'anteile', 'proportionalitaet', 'prozentrechnung', 'prozentuale_veraenderung', 'zinsen',
		'terme_zusammenfassen', 'terme_umformen', 'wortterme',
		'geometrie', 'winkel', 'kongruenz'
	],
	klasse9: [
		'teiler', 'primzahlen', 'einheiten', 'potenzen', 'natuerliche_zahlen_addieren_subtrahieren', 'natuerliche_zahlen_multiplizieren_dividieren', 'schriftliche_addition_subtraktion', 'schriftliche_multiplikation_division', 'ganze_zahlen_addieren_subtrahieren', 'ganze_zahlen_multiplizieren_dividieren', 'dezimalbrueche_addieren_subtrahieren', 'dezimalbrueche_multiplizieren_dividieren', 'zehnerpotenzen_multiplizieren_dividieren', 'vorrang',
		'additionstabellen', 'subtraktionstabellen', 'multiplikationstabellen', 'termtabellen',
		'brueche_kuerzen', 'brueche_umwandeln', 'brueche_addieren_subtrahieren', 'brueche_multiplizieren_dividieren', 'brueche_ordnen', 'runden', 'ueberschlag', 'zahlengerade',
		'anteile', 'proportionalitaet', 'prozentrechnung', 'prozentuale_veraenderung', 'zinsen',
		'terme_zusammenfassen', 'terme_umformen', 'wortterme', 'lineare_gleichungen', 'lineare_gleichungen_beidseitig', 'lineare_gleichungen_umstellen', 'formel_umstellen',
		'geometrie', 'winkel', 'kongruenz',
		'wahrscheinlichkeiten', 'lineare_funktionen_zeichnen', 'funktionen'
	],
	klasse10: [
		'teiler', 'primzahlen', 'einheiten', 'potenzen', 'natuerliche_zahlen_addieren_subtrahieren', 'natuerliche_zahlen_multiplizieren_dividieren', 'schriftliche_addition_subtraktion', 'schriftliche_multiplikation_division', 'ganze_zahlen_addieren_subtrahieren', 'ganze_zahlen_multiplizieren_dividieren', 'dezimalbrueche_addieren_subtrahieren', 'dezimalbrueche_multiplizieren_dividieren', 'zehnerpotenzen_multiplizieren_dividieren', 'vorrang',
		'additionstabellen', 'subtraktionstabellen', 'multiplikationstabellen', 'termtabellen',
		'brueche_kuerzen', 'brueche_umwandeln', 'brueche_addieren_subtrahieren', 'brueche_multiplizieren_dividieren', 'brueche_ordnen', 'runden', 'ueberschlag', 'zahlengerade',
		'anteile', 'proportionalitaet', 'prozentrechnung', 'prozentuale_veraenderung', 'zinsen',
		'terme_zusammenfassen', 'terme_umformen', 'wortterme', 'lineare_gleichungen', 'lineare_gleichungen_beidseitig', 'lineare_gleichungen_umstellen', 'formel_umstellen',
		'geometrie', 'winkel', 'kongruenz',
		'statistik', 'wahrscheinlichkeiten', 'lineare_funktionen_zeichnen', 'funktionen'
	]
};

const quizAutoTaskTypesByGrade = {
	grundschule: [
		'einmaleins_2', 'einmaleins_3', 'einmaleins_4', 'einmaleins_5', 'einmaleins_6',
		'einmaleins_7', 'einmaleins_8', 'einmaleins_9', 'einmaleins_10',
		'geteilt_durch_2', 'geteilt_durch_3', 'geteilt_durch_4', 'geteilt_durch_5',
		'geteilt_durch_6', 'geteilt_durch_7', 'geteilt_durch_8', 'geteilt_durch_9', 'geteilt_durch_10',
		'addition_bis_10', 'addition_bis_20', 'addition_bis_50', 'addition_bis_100', 'addition_bis_1000',
		'subtraktion_bis_10', 'subtraktion_bis_20', 'subtraktion_bis_50', 'subtraktion_bis_100', 'subtraktion_bis_1000',
		'kleines_1x1_multiplikation', 'kleines_1x1_division', 'kleines_1x1_komplett',
		'addition_subtraktion_bis_20', 'addition_subtraktion_bis_100', 'addition_subtraktion_bis_1000'
	],
	klasse5: [
		'einheiten', 'potenzen', 'natuerliche_zahlen_addieren_subtrahieren', 'natuerliche_zahlen_multiplizieren_dividieren', 'dezimalbrueche_addieren_subtrahieren', 'dezimalbrueche_multiplizieren_dividieren', 'zehnerpotenzen_multiplizieren_dividieren', 'vorrang',
		'brueche_kuerzen', 'brueche_umwandeln', 'brueche_addieren_subtrahieren', 'brueche_multiplizieren_dividieren', 'brueche_ordnen', 'runden', 'zahlengerade',
		'geometrie', 'statistik'
	],
	klasse6: [
		'einheiten', 'potenzen', 'natuerliche_zahlen_addieren_subtrahieren', 'natuerliche_zahlen_multiplizieren_dividieren', 'dezimalbrueche_addieren_subtrahieren', 'dezimalbrueche_multiplizieren_dividieren', 'zehnerpotenzen_multiplizieren_dividieren', 'vorrang',
		'brueche_kuerzen', 'brueche_umwandeln', 'brueche_addieren_subtrahieren', 'brueche_multiplizieren_dividieren', 'brueche_ordnen', 'runden', 'zahlengerade',
		'anteile', 'prozentrechnung', 'geometrie', 'statistik', 'wahrscheinlichkeiten'
	],
	klasse7: [
		'einheiten', 'potenzen', 'natuerliche_zahlen_addieren_subtrahieren', 'natuerliche_zahlen_multiplizieren_dividieren', 'dezimalbrueche_addieren_subtrahieren', 'dezimalbrueche_multiplizieren_dividieren', 'zehnerpotenzen_multiplizieren_dividieren', 'vorrang',
		'brueche_kuerzen', 'brueche_umwandeln', 'brueche_addieren_subtrahieren', 'brueche_multiplizieren_dividieren', 'brueche_ordnen',
		'anteile', 'proportionalitaet', 'prozentrechnung', 'prozentuale_veraenderung', 'zinsen',
		'terme_zusammenfassen', 'terme_umformen', 'terme_einsetzen', 'lineare_gleichungen',
		'runden', 'zahlengerade', 'geometrie', 'statistik', 'wahrscheinlichkeiten'
	],
	klasse8: [
		'einheiten', 'potenzen', 'natuerliche_zahlen_addieren_subtrahieren', 'natuerliche_zahlen_multiplizieren_dividieren', 'ganze_zahlen_addieren_subtrahieren', 'ganze_zahlen_multiplizieren_dividieren', 'dezimalbrueche_addieren_subtrahieren', 'dezimalbrueche_multiplizieren_dividieren', 'zehnerpotenzen_multiplizieren_dividieren', 'vorrang',
		'brueche_kuerzen', 'brueche_umwandeln', 'brueche_addieren_subtrahieren', 'brueche_multiplizieren_dividieren', 'brueche_ordnen',
		'anteile', 'proportionalitaet', 'prozentrechnung', 'prozentuale_veraenderung', 'zinsen',
		'terme_zusammenfassen', 'terme_umformen', 'terme_einsetzen', 'lineare_gleichungen', 'lineare_gleichungen_beidseitig',
		'runden', 'zahlengerade', 'geometrie', 'statistik', 'wahrscheinlichkeiten'
	],
	klasse9: [
		'einheiten', 'potenzen', 'natuerliche_zahlen_addieren_subtrahieren', 'natuerliche_zahlen_multiplizieren_dividieren', 'ganze_zahlen_addieren_subtrahieren', 'ganze_zahlen_multiplizieren_dividieren', 'dezimalbrueche_addieren_subtrahieren', 'dezimalbrueche_multiplizieren_dividieren', 'zehnerpotenzen_multiplizieren_dividieren', 'vorrang',
		'brueche_kuerzen', 'brueche_umwandeln', 'brueche_addieren_subtrahieren', 'brueche_multiplizieren_dividieren', 'brueche_ordnen',
		'anteile', 'proportionalitaet', 'prozentrechnung', 'prozentuale_veraenderung', 'zinsen',
		'terme_zusammenfassen', 'terme_umformen', 'terme_einsetzen', 'lineare_gleichungen', 'lineare_gleichungen_beidseitig',
		'runden', 'zahlengerade', 'geometrie', 'statistik', 'wahrscheinlichkeiten'
	],
	klasse10: [
		'einheiten', 'potenzen', 'natuerliche_zahlen_addieren_subtrahieren', 'natuerliche_zahlen_multiplizieren_dividieren', 'ganze_zahlen_addieren_subtrahieren', 'ganze_zahlen_multiplizieren_dividieren', 'dezimalbrueche_addieren_subtrahieren', 'dezimalbrueche_multiplizieren_dividieren', 'zehnerpotenzen_multiplizieren_dividieren', 'vorrang',
		'brueche_kuerzen', 'brueche_umwandeln', 'brueche_addieren_subtrahieren', 'brueche_multiplizieren_dividieren', 'brueche_ordnen',
		'anteile', 'proportionalitaet', 'prozentrechnung', 'prozentuale_veraenderung', 'zinsen',
		'terme_zusammenfassen', 'terme_umformen', 'terme_einsetzen', 'lineare_gleichungen',
		'runden', 'zahlengerade', 'geometrie', 'statistik', 'wahrscheinlichkeiten'
	]
};

const QUIZ_AUTO_TYPES = [...new Set(
	Object.values(quizAutoTaskTypesByGrade).flat()
)];

const taskTypeDefinitions = {
	teiler: { shareLinkId: 0, label: 'Teiler' },
	primzahlen: { shareLinkId: 1, label: 'Primzahlen' },
	einheiten: { shareLinkId: 2, label: 'Einheiten' },
	runden: { shareLinkId: 3, label: 'Zahlen runden' },
	natuerliche_zahlen_addieren_subtrahieren: { shareLinkId: 4, label: 'Natürliche Zahlen +/-' },
	natuerliche_zahlen_multiplizieren_dividieren: { shareLinkId: 5, label: 'Natürliche Zahlen ×/÷' },
	ganze_zahlen_addieren_subtrahieren: { shareLinkId: 6, label: 'Ganze Zahlen +/-' },
	ganze_zahlen_multiplizieren_dividieren: { shareLinkId: 7, label: 'Ganze Zahlen ×/÷' },
	dezimalbrueche_addieren_subtrahieren: { shareLinkId: 8, label: 'Dezimalbrüche +/-' },
	dezimalbrueche_multiplizieren_dividieren: { shareLinkId: 9, label: 'Dezimalbrüche ×/÷' },
	schriftliche_addition_subtraktion: { shareLinkId: 10, label: 'schriftlich rechnen +/-' },
	schriftliche_multiplikation_division: { shareLinkId: 11, label: 'schriftlich rechnen ×/÷' },
	potenzen: { shareLinkId: 12, label: 'Potenzen und Wurzeln' },
	zehnerpotenzen_multiplizieren_dividieren: { shareLinkId: 13, label: 'Zehnerpotenzen ×/÷' },
	vorrang: { shareLinkId: 14, label: 'Vorrangregeln' },
	ueberschlag: { shareLinkId: 15, label: 'Überschlag' },
	additionstabellen: { shareLinkId: 16, label: 'Additionstabelle' },
	subtraktionstabellen: { shareLinkId: 17, label: 'Subtraktionstabelle' },
	multiplikationstabellen: { shareLinkId: 18, label: 'Multiplikationstabelle' },
	termtabellen: { shareLinkId: 19, label: 'Termtabelle' },
	brueche_umwandeln: { shareLinkId: 20, label: 'Brüche umwandeln' },
	brueche_kuerzen: { shareLinkId: 21, label: 'Brüche kürzen' },
	brueche_addieren_subtrahieren: { shareLinkId: 22, label: 'Brüche +/-' },
	brueche_multiplizieren_dividieren: { shareLinkId: 23, label: 'Brüche ×/÷' },
	brueche_ordnen: { shareLinkId: 24, label: 'Brüche ordnen' },
	zahlengerade: { shareLinkId: 25, label: 'Zahlenstrahl' },
	anteile: { shareLinkId: 26, label: 'Anteile berechnen' },
	proportionalitaet: { shareLinkId: 27, label: 'Proportionalitäten' },
	prozentrechnung: { shareLinkId: 28, label: 'Prozentrechnung' },
	prozentuale_veraenderung: { shareLinkId: 29, label: 'Prozentuale Veränderung' },
	zinsen: { shareLinkId: 30, label: 'Zinsrechnung' },
	terme_zusammenfassen: { shareLinkId: 81, label: 'Terme zusammenfassen' },
	terme_umformen: { shareLinkId: 82, label: 'Terme umformen' },
	terme_einsetzen: { shareLinkId: 84, label: 'Terme einsetzen' },
	wortterme: { shareLinkId: 32, label: 'Wortterme' },
	lineare_gleichungen: { shareLinkId: 33, label: 'lin. Gl. ax+b = c' },
	lineare_gleichungen_beidseitig: { shareLinkId: 34, label: 'lin. Gl. ax+b = cx+d' },
	lineare_gleichungen_umstellen: { shareLinkId: 35, label: 'lin. Gl. umstellen' },
	formel_umstellen: { shareLinkId: 36, label: 'Formeln umstellen' },
	geometrie: { shareLinkId: 37, label: 'A und u ebener Figuren' },
	dreiecksberechnungen_zeichnung: { shareLinkId: 38, label: 'Dreiecksberechnungen (Zeichnung)' },
	winkel: { shareLinkId: 39, label: 'Winkel' },
	schraegbild: { shareLinkId: 40, label: 'Schrägbilder' },
	kongruenz: { shareLinkId: 41, label: 'Kongruenzsätze' },
	wahrscheinlichkeiten: { shareLinkId: 42, label: 'Wahrscheinlichkeiten' },
	lineare_funktionen_zeichnen: { shareLinkId: 43, label: 'Lineare Funktionen zeichnen' },
	funktionen: { shareLinkId: 44, label: 'Funktionen' },
	statistik: { shareLinkId: 45, label: 'Statistik' },
	einmaleins_2: { shareLinkId: 46, label: '2er-Reihe' },
	geteilt_durch_2: { shareLinkId: 56, label: 'Geteilt durch 2', quizLabel: 'geteilt durch 2' },
	einmaleins_3: { shareLinkId: 47, label: '3er-Reihe' },
	geteilt_durch_3: { shareLinkId: 57, label: 'Geteilt durch 3', quizLabel: 'geteilt durch 3' },
	einmaleins_4: { shareLinkId: 48, label: '4er-Reihe' },
	geteilt_durch_4: { shareLinkId: 58, label: 'Geteilt durch 4', quizLabel: 'geteilt durch 4' },
	einmaleins_5: { shareLinkId: 49, label: '5er-Reihe' },
	geteilt_durch_5: { shareLinkId: 59, label: 'Geteilt durch 5', quizLabel: 'geteilt durch 5' },
	einmaleins_6: { shareLinkId: 50, label: '6er-Reihe' },
	geteilt_durch_6: { shareLinkId: 60, label: 'Geteilt durch 6', quizLabel: 'geteilt durch 6' },
	einmaleins_7: { shareLinkId: 51, label: '7er-Reihe' },
	geteilt_durch_7: { shareLinkId: 61, label: 'Geteilt durch 7', quizLabel: 'geteilt durch 7' },
	einmaleins_8: { shareLinkId: 52, label: '8er-Reihe' },
	geteilt_durch_8: { shareLinkId: 62, label: 'Geteilt durch 8', quizLabel: 'geteilt durch 8' },
	einmaleins_9: { shareLinkId: 53, label: '9er-Reihe' },
	geteilt_durch_9: { shareLinkId: 63, label: 'Geteilt durch 9', quizLabel: 'geteilt durch 9' },
	einmaleins_10: { shareLinkId: 54, label: '10er-Reihe' },
	geteilt_durch_10: { shareLinkId: 64, label: 'Geteilt durch 10', quizLabel: 'geteilt durch 10' },
	addition_bis_10: { shareLinkId: 65, label: 'Addition bis 10' },
	subtraktion_bis_10: { shareLinkId: 70, label: 'Subtraktion bis 10' },
	addition_bis_20: { shareLinkId: 66, label: 'Addition bis 20' },
	subtraktion_bis_20: { shareLinkId: 71, label: 'Subtraktion bis 20' },
	addition_bis_50: { shareLinkId: 67, label: 'Addition bis 50' },
	subtraktion_bis_50: { shareLinkId: 72, label: 'Subtraktion bis 50' },
	addition_bis_100: { shareLinkId: 68, label: 'Addition bis 100' },
	subtraktion_bis_100: { shareLinkId: 73, label: 'Subtraktion bis 100' },
	addition_bis_1000: { shareLinkId: 69, label: 'Addition bis 1000' },
	subtraktion_bis_1000: { shareLinkId: 74, label: 'Subtraktion bis 1000' },
	kleines_1x1_multiplikation: { shareLinkId: 75, label: 'Kleines 1×1 Multiplikation' },
	kleines_1x1_division: { shareLinkId: 76, label: 'Kleines 1×1 Division' },
	kleines_1x1_komplett: { shareLinkId: 77, label: 'Kleines 1×1 komplett' },
	addition_subtraktion_bis_20: { shareLinkId: 78, label: 'Addition und Subtraktion bis 20', quizLabel: '+ und - bis 20' },
	addition_subtraktion_bis_100: { shareLinkId: 79, label: 'Addition und Subtraktion bis 100', quizLabel: '+ und - bis 100' },
	addition_subtraktion_bis_1000: { shareLinkId: 80, label: 'Addition und Subtraktion bis 1000', quizLabel: '+ und - bis 1000' },
	terme: { shareLinkId: 31, label: 'Terme' },
};

const typeLabels = Object.fromEntries(
	Object.entries(taskTypeDefinitions).map(([key, definition]) => [key, definition.label])
);

// Neue Typen erhalten eine neue shareLinkId. Bestehende IDs nie aendern oder wiederverwenden.
const shareLinkTypeRegistry = Object.fromEntries(
	Object.entries(taskTypeDefinitions).map(([key, definition]) => [key, definition.shareLinkId])
);

if (typeof window !== 'undefined') {
	window.taskTypeDefinitions = taskTypeDefinitions;
	window.typeLabels = typeLabels;
	window.MTGShareLinkTypeRegistry = shareLinkTypeRegistry;
	window.QUIZ_AUTO_TYPES = QUIZ_AUTO_TYPES;
}
