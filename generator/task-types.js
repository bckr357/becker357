// ==============================================================
// AUFGABEN-TYP-DEFINITIONEN
// ==============================================================

const QUIZ_AUTO_TYPES = [
	'natuerliche_zahlen_addieren_subtrahieren', 'natuerliche_zahlen_multiplizieren_dividieren', 'ganze_zahlen_addieren_subtrahieren', 'ganze_zahlen_multiplizieren_dividieren', 'dezimalbrueche_addieren_subtrahieren', 'dezimalbrueche_multiplizieren_dividieren', 'zehnerpotenzen_multiplizieren_dividieren',
	'prozentrechnung', 'prozentuale_veraenderung', 'zinsen', 'terme_zusammenfassen', 'terme_umformen', 'terme_einsetzen', 'lineare_gleichungen', 'lineare_gleichungen_beidseitig', 'vorrang', 'runden',
	'potenzen', 'einheiten', 'statistik', 'zahlengerade',
	'brueche_addieren_subtrahieren', 'brueche_multiplizieren_dividieren', 'brueche_kuerzen', 'brueche_umwandeln', 'anteile', 'wahrscheinlichkeiten',
	'geometrie', 'proportionalitaet', 'einheiten_umrechnen',
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
];

const quizAutoTypeOrderIndex = Object.fromEntries(["teiler","primzahlen","einheiten","einheiten_umrechnen","potenzen","natuerliche_zahlen_addieren_subtrahieren","natuerliche_zahlen_multiplizieren_dividieren","ganze_zahlen_addieren_subtrahieren","ganze_zahlen_multiplizieren_dividieren","dezimalbrueche_addieren_subtrahieren","dezimalbrueche_multiplizieren_dividieren","zehnerpotenzen_multiplizieren_dividieren","vorrang","brueche_kuerzen","brueche_umwandeln","brueche_addieren_subtrahieren","brueche_multiplizieren_dividieren","brueche_ordnen","runden","zahlengerade","anteile","proportionalitaet","prozentrechnung","prozentuale_veraenderung","zinsen","terme_zusammenfassen","terme_umformen","terme_einsetzen","wortterme","lineare_gleichungen","lineare_gleichungen_beidseitig","lineare_gleichungen_umstellen","formel_umstellen","geometrie","winkel","schraegbild","wahrscheinlichkeiten","lineare_funktionen_zeichnen","funktionen","statistik","einmaleins_2","geteilt_durch_2","einmaleins_3","geteilt_durch_3","einmaleins_4","geteilt_durch_4","einmaleins_5","geteilt_durch_5","einmaleins_6","geteilt_durch_6","einmaleins_7","geteilt_durch_7","einmaleins_8","geteilt_durch_8","einmaleins_9","geteilt_durch_9","einmaleins_10","geteilt_durch_10","addition_bis_10","subtraktion_bis_10","addition_bis_20","subtraktion_bis_20","addition_bis_50","subtraktion_bis_50","addition_bis_100","subtraktion_bis_100","addition_bis_1000","subtraktion_bis_1000","kleines_1x1_multiplikation","kleines_1x1_division","kleines_1x1_komplett","addition_subtraktion_bis_20","addition_subtraktion_bis_100","addition_subtraktion_bis_1000"].map((key, index) => [key, index]));

const taskCategories = {
	arithmetic: ['natuerliche_zahlen_addieren_subtrahieren', 'natuerliche_zahlen_multiplizieren_dividieren', 'ganze_zahlen_addieren_subtrahieren', 'ganze_zahlen_multiplizieren_dividieren', 'potenzen', 'schriftliche_addition_subtraktion', 'schriftliche_multiplikation_division', 'dezimalbrueche_addieren_subtrahieren', 'dezimalbrueche_multiplizieren_dividieren', 'zehnerpotenzen_multiplizieren_dividieren', 'runden', 'ueberschlag', 'zahlengerade', 'vorrang'],
	tables: ['additionstabellen', 'multiplikationstabellen', 'subtraktionstabellen', 'termtabellen'],
	fractions: ['brueche_addieren_subtrahieren', 'brueche_multiplizieren_dividieren', 'brueche_kuerzen', 'brueche_umwandeln', 'brueche_ordnen'],
	percent: ['anteile', 'proportionalitaet', 'prozentrechnung', 'prozentuale_veraenderung', 'zinsen', 'einheiten'],
	algebra: ['terme_zusammenfassen', 'terme_umformen', 'lineare_gleichungen', 'lineare_gleichungen_beidseitig', 'formel_umstellen'],
	geometry: ['geometrie', 'dreiecksberechnungen_zeichnung', 'winkel', 'schraegbild', 'kongruenz'],
	functions: ['funktionen'],
	statistics: ['statistik', 'wahrscheinlichkeiten'],
	advanced: ['teiler', 'primzahlen']
};

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


// Dreiteilige Typ-Definition: [key, Label fuer Einstellungen, Beschreibung fuer Training]

const quizTaskTypesByGrade = {
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
		'teiler', 'primzahlen', 'einheiten', 'potenzen', 'natuerliche_zahlen_addieren_subtrahieren', 'natuerliche_zahlen_multiplizieren_dividieren', 'schriftliche_addition_subtraktion', 'schriftliche_multiplikation_division', 'dezimalbrueche_addieren_subtrahieren', 'dezimalbrueche_multiplizieren_dividieren', 'zehnerpotenzen_multiplizieren_dividieren', 'vorrang',
		'additionstabellen',  'subtraktionstabellen', 'multiplikationstabellen','termtabellen',
		'brueche_kuerzen', 'brueche_umwandeln', 'brueche_addieren_subtrahieren', 'brueche_multiplizieren_dividieren', 'brueche_ordnen', 'runden', 'ueberschlag', 'zahlengerade',
		'geometrie', 'dreiecksberechnungen_zeichnung', 'winkel', 'schraegbild', 'statistik'
	],
	klasse6: [
		'teiler', 'primzahlen', 'einheiten', 'potenzen', 'natuerliche_zahlen_addieren_subtrahieren', 'natuerliche_zahlen_multiplizieren_dividieren', 'schriftliche_addition_subtraktion', 'schriftliche_multiplikation_division', 'dezimalbrueche_addieren_subtrahieren', 'dezimalbrueche_multiplizieren_dividieren', 'zehnerpotenzen_multiplizieren_dividieren', 'vorrang',
		'additionstabellen',  'subtraktionstabellen', 'multiplikationstabellen','termtabellen',
		'brueche_kuerzen', 'brueche_umwandeln', 'brueche_addieren_subtrahieren', 'brueche_multiplizieren_dividieren', 'brueche_ordnen', 'runden', 'ueberschlag', 'zahlengerade',
		'anteile', 'prozentrechnung', 'geometrie', 'dreiecksberechnungen_zeichnung', 'winkel', 'schraegbild', 'statistik', 'wahrscheinlichkeiten'
	],
	klasse7: [
		'teiler', 'primzahlen', 'einheiten', 'potenzen', 'natuerliche_zahlen_addieren_subtrahieren', 'natuerliche_zahlen_multiplizieren_dividieren', 'schriftliche_addition_subtraktion', 'schriftliche_multiplikation_division', 'dezimalbrueche_addieren_subtrahieren', 'dezimalbrueche_multiplizieren_dividieren', 'zehnerpotenzen_multiplizieren_dividieren', 'vorrang',
		'additionstabellen', 'subtraktionstabellen', 'multiplikationstabellen', 'termtabellen',
		'brueche_kuerzen', 'brueche_umwandeln', 'brueche_addieren_subtrahieren', 'brueche_multiplizieren_dividieren', 'brueche_ordnen',
		'anteile', 'proportionalitaet', 'prozentrechnung', 'prozentuale_veraenderung', 'zinsen',
		'lineare_gleichungen', 'lineare_gleichungen_umstellen', 'formel_umstellen',
		'runden', 'ueberschlag', 'zahlengerade', 'geometrie', 'dreiecksberechnungen_zeichnung', 'winkel', 'schraegbild', 'kongruenz', 'statistik', 'wahrscheinlichkeiten'
	],
	klasse8: [
		'teiler', 'primzahlen', 'einheiten', 'potenzen', 'natuerliche_zahlen_addieren_subtrahieren', 'natuerliche_zahlen_multiplizieren_dividieren', 'schriftliche_addition_subtraktion', 'schriftliche_multiplikation_division', 'ganze_zahlen_addieren_subtrahieren', 'ganze_zahlen_multiplizieren_dividieren', 'dezimalbrueche_addieren_subtrahieren', 'dezimalbrueche_multiplizieren_dividieren', 'zehnerpotenzen_multiplizieren_dividieren', 'vorrang',
		'additionstabellen', 'subtraktionstabellen', 'multiplikationstabellen', 'termtabellen',
		'brueche_kuerzen', 'brueche_umwandeln', 'brueche_addieren_subtrahieren', 'brueche_multiplizieren_dividieren', 'brueche_ordnen', 'runden', 'ueberschlag', 'zahlengerade',
		'anteile', 'proportionalitaet', 'prozentrechnung', 'prozentuale_veraenderung', 'zinsen',
		'lineare_gleichungen', 'lineare_gleichungen_beidseitig', 'lineare_gleichungen_umstellen', 'formel_umstellen',
		'geometrie', 'dreiecksberechnungen_zeichnung', 'winkel', 'schraegbild', 'kongruenz', 'statistik', 'wahrscheinlichkeiten'
	],
	klasse9: [
		'teiler', 'primzahlen', 'einheiten', 'potenzen', 'natuerliche_zahlen_addieren_subtrahieren', 'natuerliche_zahlen_multiplizieren_dividieren', 'schriftliche_addition_subtraktion', 'schriftliche_multiplikation_division', 'ganze_zahlen_addieren_subtrahieren', 'ganze_zahlen_multiplizieren_dividieren', 'dezimalbrueche_addieren_subtrahieren', 'dezimalbrueche_multiplizieren_dividieren', 'zehnerpotenzen_multiplizieren_dividieren', 'vorrang',
		'additionstabellen', 'subtraktionstabellen', 'multiplikationstabellen', 'termtabellen',
		'brueche_kuerzen', 'brueche_umwandeln', 'brueche_addieren_subtrahieren', 'brueche_multiplizieren_dividieren', 'brueche_ordnen', 'runden', 'ueberschlag', 'zahlengerade',
		'anteile', 'proportionalitaet', 'prozentrechnung', 'prozentuale_veraenderung', 'zinsen',
		'lineare_gleichungen', 'lineare_gleichungen_beidseitig', 'lineare_gleichungen_umstellen', 'formel_umstellen',
		'geometrie', 'dreiecksberechnungen_zeichnung', 'winkel', 'schraegbild', 'kongruenz', 'statistik', 'wahrscheinlichkeiten'
	],
	klasse10: [
		'teiler', 'einheiten', 'potenzen', 'natuerliche_zahlen_addieren_subtrahieren', 'natuerliche_zahlen_multiplizieren_dividieren', 'ganze_zahlen_addieren_subtrahieren', 'ganze_zahlen_multiplizieren_dividieren', 'dezimalbrueche_addieren_subtrahieren', 'dezimalbrueche_multiplizieren_dividieren', 'zehnerpotenzen_multiplizieren_dividieren', 'vorrang', 'primzahlen',
		'brueche_kuerzen', 'brueche_umwandeln', 'brueche_addieren_subtrahieren', 'brueche_multiplizieren_dividieren', 'brueche_ordnen', 'runden', 'ueberschlag', 'zahlengerade',
		'anteile', 'proportionalitaet', 'prozentrechnung', 'prozentuale_veraenderung', 'zinsen', 'wortterme',
		'lineare_gleichungen', 'geometrie', 'dreiecksberechnungen_zeichnung', 'winkel', 'statistik', 'wahrscheinlichkeiten'
	]
};

// Dreiteilige Typ-Definition: [key, Label fuer Einstellungen, Beschreibung fuer Training]
const typeDefinitions = [
	// Zahlentheorie / fortgeschrittene Themen
	['teiler', 'Teiler', 'Teiler einer Zahl bestimmen'],
	['primzahlen', 'Primzahlen', 'Primzahlen finden'], 
	['einheiten', 'Einheiten', 'Größen in verschiedene Einheiten umrechnen'],
	['runden', 'Zahlen runden', 'Zahlen runden'],
	
	// Arithmetik: Ganze Zahlen, Dezimalbrüche, Stellenwerte
	['natuerliche_zahlen_addieren_subtrahieren', 'Natürliche Zahlen +/-', 'Natürliche Zahlen addieren und subtrahieren'],
	['natuerliche_zahlen_multiplizieren_dividieren', 'Natürliche Zahlen ×/÷', 'Natürliche Zahlen multiplizieren und dividieren'],
	['ganze_zahlen_addieren_subtrahieren', 'Ganze Zahlen +/-', 'Ganze Zahlen addieren und subtrahieren'],
	['ganze_zahlen_multiplizieren_dividieren', 'Ganze Zahlen ×/÷', 'Ganze Zahlen multiplizieren und dividieren'],
	['dezimalbrueche_addieren_subtrahieren', 'Dezimalbrüche +/-', 'Dezimalbrüche addieren und subtrahieren'],
	['dezimalbrueche_multiplizieren_dividieren', 'Dezimalbrüche ×/÷', 'Dezimalbrüche multiplizieren und dividieren'],
	['schriftliche_addition_subtraktion', 'schriftlich rechnen +/-', 'Schriftliche Addition und Subtraktion'],
	['schriftliche_multiplikation_division', 'schriftlich rechnen ×/÷', 'Schriftliche Multiplikation und Division'],
	['potenzen', 'Potenzen und Wurzeln', 'Potenzen und Wurzeln berechnen'],
	['zehnerpotenzen_multiplizieren_dividieren', 'Zehnerpotenzen ×/÷', 'Multiplikation und Division mit Zehnerpotenzen und Stufenzahlen'],
	['vorrang', 'Vorrangregeln', 'Terme mit Vorrangregeln berechnen'],
	['ueberschlag', 'Überschlag', 'Sinnvolle Überschläge für Grundrechenaufgaben bilden'],
	
	// Tabellen / Kopfrechnen
	['additionstabellen', 'Additionstabelle', 'Tabellenaufgaben mit Summen'],
	['subtraktionstabellen', 'Subtraktionstabelle', 'Tabellenaufgaben mit Differenzen'],
	['multiplikationstabellen', 'Multiplikationstabelle', 'Tabellenaufgaben mit Produkten'],
	['termtabellen', 'Termtabelle', 'Terme mit Variablen'],
	
	// Brüche
	['brueche_umwandeln', 'Brüche umwandeln', 'Brüche, Dezimalzahlen und Prozentwerte umwandeln'],
	['brueche_kuerzen', 'Brüche kürzen', 'Brüche vollständig kürzen'],
	['brueche_addieren_subtrahieren', 'Brüche +/-', 'Brüche addieren und subtrahieren'],
	['brueche_multiplizieren_dividieren', 'Brüche ×/÷', 'Brüche multiplizieren und dividieren'],
	['brueche_ordnen', 'Brüche ordnen', 'Brüche der Größe nach sortieren'],
	['zahlengerade', 'Zahlenstrahl', 'Zahlenstrahl-Aufgaben lesen, eintragen und zeichnen'],
	
	// Prozent / Proportionalität / Maßeinheiten
	['anteile', 'Anteile berechnen', 'Anteile berechnen'],
	['proportionalitaet', 'Proportionalitäten', 'Aufgaben zur direkten Proportionalität'],
	['prozentrechnung', 'Prozentrechnung', 'Prozentwert, Grundwert und Prozentsatz berechnen'],
	['prozentuale_veraenderung', 'Prozentuale Veränderung', 'Prozentuale Zu- und Abnahmen berechnen'],
	['zinsen', 'Zinsrechnung', 'Zinsen, Kapital und Zinssatz berechnen'],
	
	// Algebra / Terme / Gleichungen
	['terme_zusammenfassen', 'Terme zusammenfassen', 'Gleichartige Terme zusammenfassen'],
	['terme_umformen', 'Terme umformen', 'Terme durch Klammerregeln umformen und vereinfachen'],
	['terme_einsetzen', 'Terme einsetzen', 'Terme mit einer Variablen und gegebenem Einsetzungswert berechnen'],
	['wortterme', 'Wortterme', 'Wortterme in mathematische Symbole übersetzen und berechnen'],
	['lineare_gleichungen', 'lin. Gl. ax+b = c', 'Lineare Gleichung der Form ax + b = c lösen'],
	['lineare_gleichungen_beidseitig', 'lin. Gl. ax+b = cx+d', 'Lineare Gleichung der Form ax + b = cx + d lösen'],
	['lineare_gleichungen_umstellen', 'lin. Gl. umstellen', 'Lineare Gleichungen nach y umstellen'],
	['formel_umstellen', 'Formeln umstellen', 'Formeln nach einer anderen Variablen umstellen'],
	
	// Geometrie
	['geometrie', 'A und u ebener Figuren', 'Flächeninhalte und Umfänge berechnen'],
	['dreiecksberechnungen_zeichnung', 'Dreiecksberechnungen (Zeichnung)', 'Flächeninhalt, Umfang, Seiten und Winkel mit Pythagoras, Sinus-/Kosinussatz berechnen'],
	['winkel', 'Winkel', 'Winkel zeichnen und berechnen'],
	['schraegbild', 'Schrägbilder', 'Schrägbilder von Körpern zeichnen'],
	['kongruenz', 'Kongruenzsätze', 'Dreiecke mit Kongruenzsätzen konstruieren'],
	
	// Funktionen, Statistik & Wahrscheinlichkeiten
	['wahrscheinlichkeiten', 'Wahrscheinlichkeiten', 'Wahrscheinlichkeiten bestimmen'],
	['lineare_funktionen_zeichnen', 'Lineare Funktionen zeichnen', 'Lineare Funktionen grafisch darstellen'],
	['funktionen', 'Funktionen', 'Funktionswerte, Argumente und Eigenschaften von Funktionen bestimmen'],
	['statistik', 'Statistik', 'Kenngrößen der Statistik bestimmen'],
	
	// Grundschule: Kopfrechenaufgaben aus dem Quiz Auto Single
	['einmaleins_2', '2er-Reihe', 'Aufgaben aus der 2er-Reihe des kleinen Einmaleins'],
	['geteilt_durch_2', 'Geteilt durch 2', 'Divisionsaufgaben mit 2 aus dem kleinen Einmaleins'],
	['einmaleins_3', '3er-Reihe', 'Aufgaben aus der 3er-Reihe des kleinen Einmaleins'],
	['geteilt_durch_3', 'Geteilt durch 3', 'Divisionsaufgaben mit 3 aus dem kleinen Einmaleins'],
	['einmaleins_4', '4er-Reihe', 'Aufgaben aus der 4er-Reihe des kleinen Einmaleins'],
	['geteilt_durch_4', 'Geteilt durch 4', 'Divisionsaufgaben mit 4 aus dem kleinen Einmaleins'],
	['einmaleins_5', '5er-Reihe', 'Aufgaben aus der 5er-Reihe des kleinen Einmaleins'],
	['geteilt_durch_5', 'Geteilt durch 5', 'Divisionsaufgaben mit 5 aus dem kleinen Einmaleins'],
	['einmaleins_6', '6er-Reihe', 'Aufgaben aus der 6er-Reihe des kleinen Einmaleins'],
	['geteilt_durch_6', 'Geteilt durch 6', 'Divisionsaufgaben mit 6 aus dem kleinen Einmaleins'],
	['einmaleins_7', '7er-Reihe', 'Aufgaben aus der 7er-Reihe des kleinen Einmaleins'],
	['geteilt_durch_7', 'Geteilt durch 7', 'Divisionsaufgaben mit 7 aus dem kleinen Einmaleins'],
	['einmaleins_8', '8er-Reihe', 'Aufgaben aus der 8er-Reihe des kleinen Einmaleins'],
	['geteilt_durch_8', 'Geteilt durch 8', 'Divisionsaufgaben mit 8 aus dem kleinen Einmaleins'],
	['einmaleins_9', '9er-Reihe', 'Aufgaben aus der 9er-Reihe des kleinen Einmaleins'],
	['geteilt_durch_9', 'Geteilt durch 9', 'Divisionsaufgaben mit 9 aus dem kleinen Einmaleins'],
	['einmaleins_10', '10er-Reihe', 'Aufgaben aus der 10er-Reihe des kleinen Einmaleins'],
	['geteilt_durch_10', 'Geteilt durch 10', 'Divisionsaufgaben mit 10 aus dem kleinen Einmaleins'],
	['addition_bis_10', 'Addition bis 10', 'Additionsaufgaben mit Zahlen bis 10'],
	['subtraktion_bis_10', 'Subtraktion bis 10', 'Subtraktionsaufgaben mit Zahlen bis 10'],
	['addition_bis_20', 'Addition bis 20', 'Additionsaufgaben mit Zahlen bis 20'],
	['subtraktion_bis_20', 'Subtraktion bis 20', 'Subtraktionsaufgaben mit Zahlen bis 20'],
	['addition_bis_50', 'Addition bis 50', 'Additionsaufgaben mit Zahlen bis 50'],
	['subtraktion_bis_50', 'Subtraktion bis 50', 'Subtraktionsaufgaben mit Zahlen bis 50'],
	['addition_bis_100', 'Addition bis 100', 'Additionsaufgaben mit Zahlen bis 100'],
	['subtraktion_bis_100', 'Subtraktion bis 100', 'Subtraktionsaufgaben mit Zahlen bis 100'],
	['addition_bis_1000', 'Addition bis 1000', 'Additionsaufgaben mit Zahlen bis 1000'],
	['subtraktion_bis_1000', 'Subtraktion bis 1000', 'Subtraktionsaufgaben mit Zahlen bis 1000'],
	['kleines_1x1_multiplikation', 'Kleines 1×1 Multiplikation', 'Alle Multiplikationsaufgaben des kleinen Einmaleins'],
	['kleines_1x1_division', 'Kleines 1×1 Division', 'Alle Divisionsaufgaben des kleinen Einmaleins'],
	['kleines_1x1_komplett', 'Kleines 1×1 komplett', 'Multiplikations- und Divisionsaufgaben des kleinen Einmaleins'],
	['addition_subtraktion_bis_20', 'Addition und Subtraktion bis 20', 'Gemischte Additions- und Subtraktionsaufgaben bis 20'],
	['addition_subtraktion_bis_100', 'Addition und Subtraktion bis 100', 'Gemischte Additions- und Subtraktionsaufgaben bis 100'],
	['addition_subtraktion_bis_1000', 'Addition und Subtraktion bis 1000', 'Gemischte Additions- und Subtraktionsaufgaben bis 1000']
];

const typeLabels = Object.fromEntries(typeDefinitions.map(([key, label]) => [key, label]));
const typeDescriptions = Object.fromEntries(typeDefinitions.map(([key, , description]) => [key, description]));
const quizAutoTypeLabels = {
	einheiten_umrechnen: 'Einheiten umrechnen',
	geteilt_durch_2: 'geteilt durch 2',
	geteilt_durch_3: 'geteilt durch 3',
	geteilt_durch_4: 'geteilt durch 4',
	geteilt_durch_5: 'geteilt durch 5',
	geteilt_durch_6: 'geteilt durch 6',
	geteilt_durch_7: 'geteilt durch 7',
	geteilt_durch_8: 'geteilt durch 8',
	geteilt_durch_9: 'geteilt durch 9',
	geteilt_durch_10: 'geteilt durch 10',
	addition_subtraktion_bis_20: '+ und - bis 20',
	addition_subtraktion_bis_100: '+ und - bis 100',
	addition_subtraktion_bis_1000: '+ und - bis 1000'
};

const shareLinkTypeRegistry = [...new Set([
	...typeDefinitions.map(([key]) => key),
	...QUIZ_AUTO_TYPES
])];

if (typeof window !== 'undefined') {
	window.typeLabels = typeLabels;
	window.QUIZ_AUTO_TYPE_LABELS = quizAutoTypeLabels;
	window.MTGShareLinkTypeRegistry = shareLinkTypeRegistry;
	window.QUIZ_AUTO_TYPES = QUIZ_AUTO_TYPES;
	window.QUIZ_AUTO_TYPE_ORDER_INDEX = quizAutoTypeOrderIndex;
}

const typeOrderIndex = Object.fromEntries(typeDefinitions.map(([key], index) => [key, index]));
function sortByTypeDefinitions(types) {
	return [...types].sort((a, b) => {
		const indexA = typeOrderIndex[a] ?? Number.MAX_SAFE_INTEGER;
		const indexB = typeOrderIndex[b] ?? Number.MAX_SAFE_INTEGER;
		if (indexA !== indexB) {
			return indexA - indexB;
		}
		return a.localeCompare(b);
	});
}
