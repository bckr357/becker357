// ==============================================================
// AUFGABEN-TYP-DEFINITIONEN
// ==============================================================
//
// Einzige Quelle der Wahrheit für alle Aufgabentypen.
//
// - Die Reihenfolge der Einträge ist die Anzeigereihenfolge (Dropdown usw.).
// - shareLinkId: eindeutige Nummer für Share-Links. Neue Typen bekommen eine
//   neue, unbenutzte ID. Bestehende IDs nie ändern oder wiederverwenden.
// - label: Anzeigename.
// - from: erste Klassenstufe, ab der der Typ angeboten wird (gilt für alle
//   Modi, bis einschließlich Klasse 10).
// - modes: Modi, in denen der Typ angeboten wird.
//     default    = ohne Taschenrechner
//     calculator = mit Taschenrechner
//     quiz       = automatisches Quiz
//   Leeres modes = Typ ist (noch) nirgends registriert; from darf dann null sein.
// - 'grundschule' ist eine eigene Stufe vor Klasse 5: Ein Typ mit
//   from: 'grundschule' gilt nur dort, und Typen mit from: 'klasse5' oder höher
//   erscheinen nie in der Grundschule.

const TASK_GRADES = Object.freeze(['grundschule', 'klasse5', 'klasse6', 'klasse7', 'klasse8', 'klasse9', 'klasse10']);
const TASK_MODES = Object.freeze(['default', 'calculator', 'quiz']);

const taskTypeDefinitions = {
	einmaleins_2: { shareLinkId: 0, label: '2er-Reihe', from: 'grundschule', modes: ['default', 'quiz'] },
	geteilt_durch_2: { shareLinkId: 1, label: 'geteilt durch 2', from: 'grundschule', modes: ['default', 'quiz'] },
	einmaleins_3: { shareLinkId: 2, label: '3er-Reihe', from: 'grundschule', modes: ['default', 'quiz'] },
	geteilt_durch_3: { shareLinkId: 3, label: 'geteilt durch 3', from: 'grundschule', modes: ['default', 'quiz'] },
	einmaleins_4: { shareLinkId: 4, label: '4er-Reihe', from: 'grundschule', modes: ['default', 'quiz'] },
	geteilt_durch_4: { shareLinkId: 5, label: 'geteilt durch 4', from: 'grundschule', modes: ['default', 'quiz'] },
	einmaleins_5: { shareLinkId: 6, label: '5er-Reihe', from: 'grundschule', modes: ['default', 'quiz'] },
	geteilt_durch_5: { shareLinkId: 7, label: 'geteilt durch 5', from: 'grundschule', modes: ['default', 'quiz'] },
	einmaleins_6: { shareLinkId: 8, label: '6er-Reihe', from: 'grundschule', modes: ['default', 'quiz'] },
	geteilt_durch_6: { shareLinkId: 9, label: 'geteilt durch 6', from: 'grundschule', modes: ['default', 'quiz'] },
	einmaleins_7: { shareLinkId: 10, label: '7er-Reihe', from: 'grundschule', modes: ['default', 'quiz'] },
	geteilt_durch_7: { shareLinkId: 11, label: 'geteilt durch 7', from: 'grundschule', modes: ['default', 'quiz'] },
	einmaleins_8: { shareLinkId: 12, label: '8er-Reihe', from: 'grundschule', modes: ['default', 'quiz'] },
	geteilt_durch_8: { shareLinkId: 13, label: 'geteilt durch 8', from: 'grundschule', modes: ['default', 'quiz'] },
	einmaleins_9: { shareLinkId: 14, label: '9er-Reihe', from: 'grundschule', modes: ['default', 'quiz'] },
	geteilt_durch_9: { shareLinkId: 15, label: 'geteilt durch 9', from: 'grundschule', modes: ['default', 'quiz'] },
	einmaleins_10: { shareLinkId: 16, label: '10er-Reihe', from: 'grundschule', modes: ['default', 'quiz'] },
	geteilt_durch_10: { shareLinkId: 17, label: 'geteilt durch 10', from: 'grundschule', modes: ['default', 'quiz'] },
	addition_bis_10: { shareLinkId: 18, label: 'Addition bis 10', from: 'grundschule', modes: ['default', 'quiz'] },
	subtraktion_bis_10: { shareLinkId: 19, label: 'Subtraktion bis 10', from: 'grundschule', modes: ['default', 'quiz'] },
	addition_bis_20: { shareLinkId: 20, label: 'Addition bis 20', from: 'grundschule', modes: ['default', 'quiz'] },
	subtraktion_bis_20: { shareLinkId: 21, label: 'Subtraktion bis 20', from: 'grundschule', modes: ['default', 'quiz'] },
	addition_bis_50: { shareLinkId: 22, label: 'Addition bis 50', from: 'grundschule', modes: ['default', 'quiz'] },
	subtraktion_bis_50: { shareLinkId: 23, label: 'Subtraktion bis 50', from: 'grundschule', modes: ['default', 'quiz'] },
	addition_bis_100: { shareLinkId: 24, label: 'Addition bis 100', from: 'grundschule', modes: ['default', 'quiz'] },
	subtraktion_bis_100: { shareLinkId: 25, label: 'Subtraktion bis 100', from: 'grundschule', modes: ['default', 'quiz'] },
	addition_bis_1000: { shareLinkId: 26, label: 'Addition bis 1000', from: 'grundschule', modes: ['default', 'quiz'] },
	subtraktion_bis_1000: { shareLinkId: 27, label: 'Subtraktion bis 1000', from: 'grundschule', modes: ['default', 'quiz'] },
	kleines_1x1_multiplikation: { shareLinkId: 28, label: 'Kleines 1×1 Multiplikation', from: 'grundschule', modes: ['default', 'quiz'] },
	kleines_1x1_division: { shareLinkId: 29, label: 'Kleines 1×1 Division', from: 'grundschule', modes: ['default', 'quiz'] },
	kleines_1x1_komplett: { shareLinkId: 30, label: 'Kleines 1×1 komplett', from: 'grundschule', modes: ['default', 'quiz'] },
	addition_subtraktion_bis_20: { shareLinkId: 31, label: '+ und - bis 20', from: 'grundschule', modes: ['default', 'quiz'] },
	addition_subtraktion_bis_100: { shareLinkId: 32, label: '+ und - bis 100', from: 'grundschule', modes: ['default', 'quiz'] },
	addition_subtraktion_bis_1000: { shareLinkId: 33, label: '+ und - bis 1000', from: 'grundschule', modes: ['default', 'quiz'] },
	runden: { shareLinkId: 57, label: 'Zahlen runden', from: 'klasse5', modes: ['default', 'calculator', 'quiz'] },
	ueberschlag: { shareLinkId: 58, label: 'Überschlag', from: 'klasse5', modes: ['default', 'calculator'] },
	teiler: { shareLinkId: 34, label: 'Teiler', from: 'klasse5', modes: ['default'] },
	primzahlen: { shareLinkId: 35, label: 'Primzahlen', from: 'klasse5', modes: ['default'] },
	einheiten: { shareLinkId: 36, label: 'Einheiten', from: 'klasse5', modes: ['default', 'calculator', 'quiz'] },
	wortterme: { shareLinkId: 69, label: 'Wortterme', from: 'klasse5', modes: ['default'] },
	schriftliche_addition_subtraktion: { shareLinkId: 40, label: 'schriftlich rechnen +/-', from: 'klasse5', modes: ['default'] },
	schriftliche_multiplikation_division: { shareLinkId: 41, label: 'schriftlich rechnen ×/÷', from: 'klasse5', modes: ['default'] },
	natuerliche_zahlen_addieren_subtrahieren: { shareLinkId: 38, label: 'Natürliche Zahlen +/-', from: 'klasse5', modes: ['default', 'quiz'] },
	natuerliche_zahlen_multiplizieren_dividieren: { shareLinkId: 39, label: 'Natürliche Zahlen ×/÷', from: 'klasse5', modes: ['default', 'quiz'] },
	ganze_zahlen_addieren_subtrahieren: { shareLinkId: 42, label: 'Ganze Zahlen +/-', from: 'klasse7', modes: ['default', 'quiz'] },
	ganze_zahlen_multiplizieren_dividieren: { shareLinkId: 43, label: 'Ganze Zahlen ×/÷', from: 'klasse7', modes: ['default', 'quiz'] },
	dezimalbrueche_addieren_subtrahieren: { shareLinkId: 44, label: 'Dezimalbrüche +/-', from: 'klasse5', modes: ['default', 'quiz'] },
	dezimalbrueche_multiplizieren_dividieren: { shareLinkId: 45, label: 'Dezimalbrüche ×/÷', from: 'klasse5', modes: ['default', 'quiz'] },
	potenzen: { shareLinkId: 37, label: 'Potenzen und Wurzeln', from: 'klasse5', modes: ['default', 'quiz'] },
	zehnerpotenzen_multiplizieren_dividieren: { shareLinkId: 46, label: 'Zehnerpotenzen ×/÷', from: 'klasse5', modes: ['default', 'quiz'] },
	vorrang: { shareLinkId: 47, label: 'Vorrangregeln', from: 'klasse5', modes: ['default', 'quiz'] },
	zahlengerade: { shareLinkId: 59, label: 'Zahlenstrahl', from: 'klasse5', modes: ['default', 'quiz'] },
	additionstabellen: { shareLinkId: 48, label: 'Additionstabelle', from: 'klasse5', modes: ['default'] },
	subtraktionstabellen: { shareLinkId: 49, label: 'Subtraktionstabelle', from: 'klasse5', modes: ['default'] },
	multiplikationstabellen: { shareLinkId: 50, label: 'Multiplikationstabelle', from: 'klasse5', modes: ['default'] },
	termtabellen: { shareLinkId: 51, label: 'Termtabelle', from: 'klasse7', modes: ['default'] },
	brueche_kuerzen: { shareLinkId: 52, label: 'Brüche kürzen', from: 'klasse6', modes: ['default', 'quiz'] },
	brueche_umwandeln: { shareLinkId: 53, label: 'Brüche umwandeln', from: 'klasse6', modes: ['default', 'quiz'] },
	brueche_addieren_subtrahieren: { shareLinkId: 54, label: 'Brüche +/-', from: 'klasse6', modes: ['default', 'quiz'] },
	brueche_multiplizieren_dividieren: { shareLinkId: 55, label: 'Brüche ×/÷', from: 'klasse6', modes: ['default', 'quiz'] },
	brueche_ordnen: { shareLinkId: 56, label: 'Brüche ordnen', from: 'klasse6', modes: ['default', 'quiz'] },
	anteile: { shareLinkId: 60, label: 'Anteile berechnen', from: 'klasse6', modes: ['default', 'calculator', 'quiz'] },
	proportionalitaet: { shareLinkId: 61, label: 'Proportionalitäten', from: 'klasse6', modes: ['default', 'calculator', 'quiz'] },
	prozentrechnung: { shareLinkId: 62, label: 'Prozentrechnung', from: 'klasse7', modes: ['default', 'calculator', 'quiz'] },
	prozentuale_veraenderung: { shareLinkId: 63, label: 'Prozentuale Veränderung', from: 'klasse7', modes: ['default', 'calculator', 'quiz'] },
	zinsen: { shareLinkId: 64, label: 'Zinsrechnung', from: 'klasse7', modes: ['default', 'calculator', 'quiz'] },
	terme: { shareLinkId: 65, label: 'Terme', from: null, modes: [] },
	terme_zusammenfassen: { shareLinkId: 66, label: 'Terme zusammenfassen', from: 'klasse7', modes: ['default', 'quiz'] },
	terme_umformen: { shareLinkId: 67, label: 'Terme umformen', from: 'klasse8', modes: ['default', 'quiz'] },
	terme_einsetzen: { shareLinkId: 68, label: 'Terme einsetzen', from: 'klasse7', modes: ['quiz'] },
	lineare_gleichungen: { shareLinkId: 70, label: 'lin. Gl. ax+b = c', from: 'klasse7', modes: ['default', 'calculator', 'quiz'] },
	lineare_gleichungen_beidseitig: { shareLinkId: 71, label: 'lin. Gl. ax+b = cx+d', from: 'klasse8', modes: ['default', 'calculator', 'quiz'] },
	lineare_gleichungen_umstellen: { shareLinkId: 72, label: 'lin. Gl. umstellen', from: 'klasse9', modes: ['default', 'calculator'] },
	formel_umstellen: { shareLinkId: 73, label: 'Formeln umstellen', from: 'klasse8', modes: ['default', 'calculator'] },
	geometrie: { shareLinkId: 74, label: 'A und u ebener Figuren', from: 'klasse5', modes: ['default', 'calculator', 'quiz'] },
	dreiecksberechnungen_zeichnung: { shareLinkId: 75, label: 'Dreiecksberechnungen (Zeichnung)', from: 'klasse5', modes: ['calculator'] },
	winkel: { shareLinkId: 76, label: 'Winkel', from: 'klasse5', modes: ['default'] },
	schraegbild: { shareLinkId: 77, label: 'Schrägbilder', from: null, modes: [] },
	kongruenz: { shareLinkId: 78, label: 'Kongruenzsätze', from: 'klasse6', modes: ['default', 'calculator'] },
	statistik: { shareLinkId: 79, label: 'Statistik', from: 'klasse9', modes: ['default', 'calculator', 'quiz'] },
	wahrscheinlichkeiten: { shareLinkId: 80, label: 'Wahrscheinlichkeiten', from: 'klasse7', modes: ['default', 'calculator', 'quiz'] },
	lineare_funktionen_zeichnen: { shareLinkId: 81, label: 'Lineare Funktionen zeichnen', from: 'klasse8', modes: ['default', 'calculator'] },
	funktionen: { shareLinkId: 82, label: 'Funktionen', from: 'klasse8', modes: ['default', 'calculator'] },
};

// --------------------------------------------------------------
// Validierung (schlägt beim Laden fehl, wenn die Daten inkonsistent sind)
// --------------------------------------------------------------
(function validateTaskTypeDefinitions() {
	const seenIds = new Map();
	for (const [typeId, definition] of Object.entries(taskTypeDefinitions)) {
		if (!Number.isInteger(definition.shareLinkId)) {
			throw new Error(`taskTypeDefinitions.${typeId}: shareLinkId fehlt oder ist keine ganze Zahl`);
		}
		if (seenIds.has(definition.shareLinkId)) {
			throw new Error(`taskTypeDefinitions: shareLinkId ${definition.shareLinkId} doppelt vergeben (${seenIds.get(definition.shareLinkId)}, ${typeId})`);
		}
		seenIds.set(definition.shareLinkId, typeId);
		if (typeof definition.label !== 'string' || !definition.label) {
			throw new Error(`taskTypeDefinitions.${typeId}: label fehlt`);
		}
		if (!Array.isArray(definition.modes)) {
			throw new Error(`taskTypeDefinitions.${typeId}: modes muss ein Array sein`);
		}
		const seenModes = new Set();
		for (const mode of definition.modes) {
			if (!TASK_MODES.includes(mode)) {
				throw new Error(`taskTypeDefinitions.${typeId}: unbekannter Modus '${mode}'`);
			}
			if (seenModes.has(mode)) {
				throw new Error(`taskTypeDefinitions.${typeId}: Modus '${mode}' doppelt vergeben`);
			}
			seenModes.add(mode);
		}
		if (definition.modes.length > 0) {
			if (!TASK_GRADES.includes(definition.from)) {
				throw new Error(`taskTypeDefinitions.${typeId}: ungültiges from '${definition.from}'`);
			}
		} else if (definition.from !== null) {
			throw new Error(`taskTypeDefinitions.${typeId}: from muss bei leeren modes null sein`);
		}
	}
})();

function validateTaskCases(taskCases) {
	const cases = taskCases instanceof Set ? taskCases : new Set(taskCases);
	const missing = Object.keys(taskTypeDefinitions).filter(typeId => {
		const definition = taskTypeDefinitions[typeId];
		return definition.modes.length > 0 && !cases.has(typeId);
	});
	if (missing.length > 0) {
		throw new Error(`taskTypeDefinitions: keine createTask-Faelle fuer ${missing.join(', ')}`);
	}
}

// --------------------------------------------------------------
// Abfragefunktionen
// --------------------------------------------------------------

// Ist der Typ im Modus für die Klassenstufe verfügbar?
function isTaskTypeAvailable(typeId, mode, grade) {
	const definition = taskTypeDefinitions[typeId];
	if (!definition || !definition.modes.includes(mode)) return false;
	const gradeIndex = TASK_GRADES.indexOf(grade);
	const fromIndex = TASK_GRADES.indexOf(definition.from);
	if (gradeIndex < 0 || fromIndex < 0) return false;
	if (fromIndex === 0) return gradeIndex === 0; // Grundschule: eigene Stufe
	return gradeIndex >= fromIndex;               // Klasse 5+: Grundschule zählt nie mit
}

// Typ-IDs für Modus + Klassenstufe, in Definitionsreihenfolge
function getTaskTypesForGrade(mode, grade) {
	return Object.keys(taskTypeDefinitions).filter(typeId => isTaskTypeAvailable(typeId, mode, grade));
}

// Typ-IDs, die in einem Modus in mindestens einer Klassenstufe vorkommen
function getTaskTypesForMode(mode) {
	return Object.keys(taskTypeDefinitions).filter(typeId => taskTypeDefinitions[typeId].modes.includes(mode));
}

function getTaskTypeLabel(typeId) {
	return taskTypeDefinitions[typeId]?.label ?? typeId;
}

function getShareLinkId(typeId) {
	return taskTypeDefinitions[typeId]?.shareLinkId;
}

function getTaskTypeByShareLinkId(shareLinkId) {
	return Object.keys(taskTypeDefinitions).find(typeId => taskTypeDefinitions[typeId].shareLinkId === shareLinkId);
}

for (const definition of Object.values(taskTypeDefinitions)) {
	Object.freeze(definition.modes);
	Object.freeze(definition);
}
Object.freeze(taskTypeDefinitions);

const MTGTaskTypes = {
	GRADES: TASK_GRADES,
	MODES: TASK_MODES,
	definitions: taskTypeDefinitions,
	isAvailable: isTaskTypeAvailable,
	forGrade: getTaskTypesForGrade,
	forMode: getTaskTypesForMode,
	label: getTaskTypeLabel,
	shareLinkId: getShareLinkId,
	byShareLinkId: getTaskTypeByShareLinkId,
	validateCases: validateTaskCases
};
Object.freeze(MTGTaskTypes);

if (typeof window !== 'undefined') {
	window.MTGTaskTypes = MTGTaskTypes;
	window.MTGShareLinkTypeRegistry = Object.freeze(Object.fromEntries(
		Object.entries(taskTypeDefinitions).map(([typeId, definition]) => [typeId, definition.shareLinkId])
	));
}
if (typeof module !== 'undefined' && module.exports) {
	module.exports = MTGTaskTypes;
}