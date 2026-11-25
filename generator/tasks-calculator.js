// ==========================================================
// AUFGABEN-GENERATOR (TASCHENRECHNERMODUS)
// ==========================================================

const fmt = formatUtils.fmt;
const comma = formatUtils.comma;
const formatDecimal = formatUtils.formatDecimal;

function createCalculatorTask(type, grade = 5, options = {}) {
	if (typeof grade === 'string') {
		const parsed = parseInt(grade.replace(/\D/g, ''), 10);
		grade = Number.isFinite(parsed) ? parsed : 5;
	} else if (!Number.isFinite(grade)) {
		grade = 5;
	}

	let answer = null;
	const numericAnswer = value => ({ kind: 'number', value });

	let s = '';
	let textDisplay = '', textPrint = '';

	const blank = (cmWidth = 3) => `\\(\\underline{\\hspace{${cmWidth}cm}}\\)`;

	switch (type) {
		// Grundgerüst – noch keine Aufgaben implementiert.
		default:
			return null;
	}

	return {
		type,
		textDisplay,
		textPrint,
		solution: s,
		answer
	};
}
