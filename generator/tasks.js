// ==========================================================
// AUFGABEN-GENERATOR
// ==========================================================

const fmt = formatUtils.fmt;
const comma = formatUtils.comma;
const formatDecimal = formatUtils.formatDecimal;

/* TODO / Roadmap
 - Grafik-Modus
 - Bild für Geradenkreuzung oder IWS einbinden
 - Funktionen einbauen
 - Berechnungen an Körpern etc. auf einer Website (excel sheet ersetzen)
 - Aufgaben mit Hilfsmitteln einbauen (z. B. Berechnungen an Flächen und Körpern, Funktionen)
 - Funktionen (Fktswert, Arguemnt, Punktprobe, fehlende Koordninaten berechnen, Wertetaeblle, Graoh zeichnen, Nullstellen usw.)
 - Verschiedenes mit Bildern zum Einbinden (z. B. Geometrie, Funktionen, Statistik)
 - Zahl zwischen Brüchen
 - Bruch zwischen zwei Brüchen
*/

function createTask(type, grade = 5, options = {}) {
	const isQuizMode = options?.mode === 'quiz';
	const isCalculatorMode = options?.mode === 'calculator';
	if (typeof grade === 'string') {
		const parsed = parseInt(grade.replace(/\D/g, ''), 10);
		grade = Number.isFinite(parsed) ? parsed : 5;
	} else if (!Number.isFinite(grade)) {
		grade = 5;
	}
	
	let answer = null;
	const numericAnswer = value => ({ kind: 'number', value });
	const fractionAnswer = (num, den, requireReduced = false) => ({ kind: 'fraction', num, den, requireReduced });
	const listAnswer = values => ({ kind: 'list', values: values.map(value => Number(value)) });
	const expressionAnswer = (expr, options = {}) => ({ kind: 'expression', expr: String(expr), ...options });
	const probabilityAnswer = (value) => {
		const candidates = [value, value * 100];
		const uniqueValues = [...new Set(candidates.map(v => Number(v.toFixed(12))))];
		return { kind: 'either', options: uniqueValues };
	};
	const ensureFractionReduced = (num, den) => {
		const gcd = mathUtils.getGcd(num, den);
		return { num: num / gcd, den: den / gcd };
	};
	const maybeSimplifyFraction = (num, den) => {
		if (den === 0) return { num: 0, den: 1 };
		const normalized = ensureFractionReduced(num, den);
		return normalized;
	};

	let s = '';
	let textDisplay = '', textPrint = '';

	const blank = (cmWidth = 3) => `\\(\\underline{\\hspace{${cmWidth}cm}}\\)`;
	const space = (cmWidth = 1) => `<div style="margin-bottom: ${cmWidth}cm;"></div>`;
	const karo = (rows = 4, cols = 10, cellSizeCm = 0.5) => {
		let rowsHtml = '';
		for (let r = 0; r < rows; r++) {
			rowsHtml += '<tr>';
			for (let c = 0; c < cols; c++) {
				rowsHtml += '<td></td>';
			}
			rowsHtml += '</tr>';
		}

		return `<table class="karo-placeholder" style="--karo-rows:${rows}; --karo-cols:${cols}; --karo-size:${cellSizeCm}cm;">` +
			`<tbody>${rowsHtml}</tbody></table>`;
	};

	const pickDistinctIntegers = (min, max, count) => {
		if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(count)) {
			return [];
		}

		const allowedCount = Math.max(0, Math.min(count, Math.max(0, max - min + 1)));
		if (allowedCount === 0) {
			return [];
		}

		const values = new Set();
		const range = [];
		for (let i = min; i <= max; i++) {
			range.push(i);
		}

		while (values.size < allowedCount) {
			const candidate = range[Math.floor(Math.random() * range.length)];
			values.add(candidate);
		}
		return [...values];
	};

	const valueOrBlank = (value, isGiven, cmWidth = 1.5) => {
		// Bei alleinstehenden Kopf- oder Zellenwerten keine Klammerung;
		// nur leere Felder als Unterstreichung darstellen.
		return isGiven ? `${value}` : '';
	};

	const buildOpTableHTML = ({
		colHeaders,
		rowHeaders,
		cellValues,
		givenColHeader,
		givenRowHeader,
		givenCells,
		opSymbol
	}) => {
		const headerCells = colHeaders.map((val, index) =>
			`<th>${valueOrBlank(val, Boolean(givenColHeader[index]))}</th>`
		).join('');

		const bodyRows = rowHeaders.map((rowVal, rowIndex) => {
			const rowHeader = `<th>${valueOrBlank(rowVal, Boolean(givenRowHeader[rowIndex]))}</th>`;
			const rowCells = colHeaders.map((_, colIndex) => {
				const key = `${rowIndex}-${colIndex}`;
				const value = cellValues[rowIndex][colIndex];
				const isGiven = Boolean(givenCells[key]);
				return `<td>${valueOrBlank(value, isGiven, 1.6)}</td>`;
			}).join('');

			return `<tr>${rowHeader}${rowCells}</tr>`;
		}).join('');

		return `
			<div class="op-table-wrap">
				<table class="op-table">
					<tr><th class="op-corner">${opSymbol}</th>${headerCells}</tr>
					${bodyRows}
				</table>
			</div>
		`;
	};

	const buildEmptyRatioTable = () => formatUtils.buildSolutionTable(
		[['', ''], ['', ''], ['', '']],
		'prop-solution-table prop-solution-table--empty',
		true
	);

	const buildTriangleAreaSvg = ({
		variant = 'standard', // 'standard' (innenliegende Höhe), 'right_angle' (rechtwinklig), 'obtuse' (außenliegende Höhe)
		gVal = 8,
		hVal = 5,
		unit = 'cm',
		cVal = null, // Hypotenuse für right_angle
		splitT = 0.48 // Lage der Spitze zwischen A und B
	}) => {
		const vbW = 420;
		const vbH = 250;
		let triangleSvg = '';

		if (variant === 'standard') {
			const Ax = 65, Ay = 195;
			const Bx = 355, By = 195;
			const Hx = Ax + (Bx - Ax) * Math.max(0.25, Math.min(0.75, splitT));
			const Hy = Ay;
			const Cx = Hx;
			const Cy = 55;

			const gText = `g = ${comma(gVal)} ${unit}`;
			const hText = `h = ${comma(hVal)} ${unit}`;

			triangleSvg = `
				<polygon points="${Ax},${Ay} ${Bx},${By} ${Cx},${Cy}" fill="#f0f7ff" stroke="#1e3a8a" stroke-width="2.5" stroke-linejoin="round"/>
				<line x1="${Cx}" y1="${Cy}" x2="${Hx}" y2="${Hy}" stroke="#dc2626" stroke-width="2" stroke-dasharray="5 4"/>
				<path d="M ${Hx},${Hy - 14} L ${Hx + 14},${Hy - 14} L ${Hx + 14},${Hy}" fill="none" stroke="#dc2626" stroke-width="1.6"/>
				<circle cx="${Hx + 7}" cy="${Hy - 7}" r="2" fill="#dc2626"/>

				<g>
					<rect x="${Hx + 6}" y="${(Cy + Hy) / 2 - 11}" width="${hText.length * 8 + 14}" height="22" rx="4" fill="#ffffff" fill-opacity="0.95" stroke="#fca5a5" stroke-width="1"/>
					<text x="${Hx + 13}" y="${(Cy + Hy) / 2 + 5}" font-size="13" font-weight="700" fill="#dc2626" font-family="system-ui, -apple-system, sans-serif">${hText}</text>
				</g>

				<line x1="${Ax}" y1="${Ay + 22}" x2="${Bx}" y2="${By + 22}" stroke="#1e3a8a" stroke-width="1.5"/>
				<line x1="${Ax}" y1="${Ay + 14}" x2="${Ax}" y2="${Ay + 30}" stroke="#1e3a8a" stroke-width="1.5"/>
				<line x1="${Bx}" y1="${By + 14}" x2="${Bx}" y2="${By + 30}" stroke="#1e3a8a" stroke-width="1.5"/>
				<polygon points="${Ax},${Ay + 22} ${Ax + 7},${Ay + 19} ${Ax + 7},${Ay + 25}" fill="#1e3a8a"/>
				<polygon points="${Bx},${By + 22} ${Bx - 7},${By + 19} ${Bx - 7},${By + 25}" fill="#1e3a8a"/>

				<g>
					<rect x="${(Ax + Bx) / 2 - (gText.length * 8 + 14) / 2}" y="${Ay + 11}" width="${gText.length * 8 + 14}" height="22" rx="4" fill="#ffffff" fill-opacity="0.95" stroke="#bfdbfe" stroke-width="1"/>
					<text x="${(Ax + Bx) / 2}" y="${Ay + 27}" text-anchor="middle" font-size="13" font-weight="700" fill="#1e3a8a" font-family="system-ui, -apple-system, sans-serif">${gText}</text>
				</g>

				<text x="${Ax - 16}" y="${Ay + 4}" font-size="14" font-weight="700" fill="#475569" font-family="system-ui, -apple-system, sans-serif">A</text>
				<text x="${Bx + 8}" y="${By + 4}" font-size="14" font-weight="700" fill="#475569" font-family="system-ui, -apple-system, sans-serif">B</text>
				<text x="${Cx}" y="${Cy - 10}" text-anchor="middle" font-size="14" font-weight="700" fill="#475569" font-family="system-ui, -apple-system, sans-serif">C</text>
			`;
		} else if (variant === 'right_angle') {
			const Ax = 80, Ay = 195;
			const Bx = 345, By = 195;
			const Cx = Ax, Cy = 55;

			const aText = `a = ${comma(gVal)} ${unit}`;
			const bText = `b = ${comma(hVal)} ${unit}`;
			const cValNum = cVal || (Math.round(Math.hypot(gVal, hVal) * 10) / 10);
			const cText = `c = ${comma(cValNum)} ${unit}`;

			triangleSvg = `
				<polygon points="${Ax},${Ay} ${Bx},${By} ${Cx},${Cy}" fill="#f0fdf4" stroke="#15803d" stroke-width="2.5" stroke-linejoin="round"/>
				
				<path d="M ${Ax},${Ay - 18} L ${Ax + 18},${Ay - 18} L ${Ax + 18},${Ay}" fill="none" stroke="#15803d" stroke-width="1.8"/>
				<circle cx="${Ax + 9}" cy="${Ay - 9}" r="2.2" fill="#15803d"/>

				<g>
					<rect x="${(Ax + Bx) / 2 - (aText.length * 8 + 14) / 2}" y="${Ay + 10}" width="${aText.length * 8 + 14}" height="22" rx="4" fill="#ffffff" fill-opacity="0.95" stroke="#bbf7d0" stroke-width="1"/>
					<text x="${(Ax + Bx) / 2}" y="${Ay + 26}" text-anchor="middle" font-size="13" font-weight="700" fill="#15803d" font-family="system-ui, -apple-system, sans-serif">${aText}</text>
				</g>

				<g>
					<rect x="${Ax - (bText.length * 8 + 22)}" y="${(Ay + Cy) / 2 - 11}" width="${bText.length * 8 + 14}" height="22" rx="4" fill="#ffffff" fill-opacity="0.95" stroke="#bbf7d0" stroke-width="1"/>
					<text x="${Ax - (bText.length * 8 + 22) + (bText.length * 8 + 14) / 2}" y="${(Ay + Cy) / 2 + 5}" text-anchor="middle" font-size="13" font-weight="700" fill="#15803d" font-family="system-ui, -apple-system, sans-serif">${bText}</text>
				</g>

				<g>
					<rect x="${(Bx + Cx) / 2 + 8}" y="${(By + Cy) / 2 - 16}" width="${cText.length * 8 + 14}" height="22" rx="4" fill="#ffffff" fill-opacity="0.95" stroke="#cbd5e1" stroke-width="1"/>
					<text x="${(Bx + Cx) / 2 + 8 + (cText.length * 8 + 14) / 2}" y="${(By + Cy) / 2}" text-anchor="middle" font-size="12" font-weight="700" fill="#64748b" font-family="system-ui, -apple-system, sans-serif">${cText}</text>
				</g>

				<text x="${Ax - 18}" y="${Ay + 18}" font-size="14" font-weight="700" fill="#475569" font-family="system-ui, -apple-system, sans-serif">A</text>
				<text x="${Bx + 8}" y="${By + 6}" font-size="14" font-weight="700" fill="#475569" font-family="system-ui, -apple-system, sans-serif">B</text>
				<text x="${Cx - 18}" y="${Cy - 6}" font-size="14" font-weight="700" fill="#475569" font-family="system-ui, -apple-system, sans-serif">C</text>
			`;
		} else if (variant === 'obtuse') {
			const Ax = 175, Ay = 195;
			const Bx = 360, By = 195;
			const Cx = 75, Cy = 55;
			const Hx = Cx, Hy = Ay;

			const gText = `g = ${comma(gVal)} ${unit}`;
			const hText = `h = ${comma(hVal)} ${unit}`;

			triangleSvg = `
				<polygon points="${Ax},${Ay} ${Bx},${By} ${Cx},${Cy}" fill="#fffbeb" stroke="#b45309" stroke-width="2.5" stroke-linejoin="round"/>
				
				<line x1="${Hx}" y1="${Hy}" x2="${Ax}" y2="${Ay}" stroke="#b45309" stroke-width="1.8" stroke-dasharray="4 3"/>
				<line x1="${Cx}" y1="${Cy}" x2="${Hx}" y2="${Hy}" stroke="#dc2626" stroke-width="2" stroke-dasharray="5 4"/>
				
				<path d="M ${Hx},${Hy - 14} L ${Hx + 14},${Hy - 14} L ${Hx + 14},${Hy}" fill="none" stroke="#dc2626" stroke-width="1.6"/>
				<circle cx="${Hx + 7}" cy="${Hy - 7}" r="2" fill="#dc2626"/>

				<g>
					<rect x="${Hx - (hText.length * 8 + 18)}" y="${(Cy + Hy) / 2 - 11}" width="${hText.length * 8 + 14}" height="22" rx="4" fill="#ffffff" fill-opacity="0.95" stroke="#fca5a5" stroke-width="1"/>
					<text x="${Hx - (hText.length * 8 + 18) + (hText.length * 8 + 14) / 2}" y="${(Cy + Hy) / 2 + 5}" text-anchor="middle" font-size="13" font-weight="700" fill="#dc2626" font-family="system-ui, -apple-system, sans-serif">${hText}</text>
				</g>

				<line x1="${Ax}" y1="${Ay + 20}" x2="${Bx}" y2="${By + 20}" stroke="#b45309" stroke-width="1.5"/>
				<line x1="${Ax}" y1="${Ay + 12}" x2="${Ax}" y2="${Ay + 28}" stroke="#b45309" stroke-width="1.5"/>
				<line x1="${Bx}" y1="${By + 12}" x2="${Bx}" y2="${By + 28}" stroke="#b45309" stroke-width="1.5"/>
				<polygon points="${Ax},${Ay + 20} ${Ax + 6},${Ay + 17} ${Ax + 6},${Ay + 23}" fill="#b45309"/>
				<polygon points="${Bx},${By + 20} ${Bx - 6},${By + 17} ${Bx - 6},${By + 23}" fill="#b45309"/>

				<g>
					<rect x="${(Ax + Bx) / 2 - (gText.length * 8 + 14) / 2}" y="${Ay + 9}" width="${gText.length * 8 + 14}" height="22" rx="4" fill="#ffffff" fill-opacity="0.95" stroke="#fed7aa" stroke-width="1"/>
					<text x="${(Ax + Bx) / 2}" y="${Ay + 25}" text-anchor="middle" font-size="13" font-weight="700" fill="#b45309" font-family="system-ui, -apple-system, sans-serif">${gText}</text>
				</g>

				<text x="${Ax + 4}" y="${Ay - 8}" font-size="14" font-weight="700" fill="#475569" font-family="system-ui, -apple-system, sans-serif">A</text>
				<text x="${Bx + 8}" y="${By + 6}" font-size="14" font-weight="700" fill="#475569" font-family="system-ui, -apple-system, sans-serif">B</text>
				<text x="${Cx}" y="${Cy - 10}" text-anchor="middle" font-size="14" font-weight="700" fill="#475569" font-family="system-ui, -apple-system, sans-serif">C</text>
				<text x="${Hx - 16}" y="${Hy + 16}" font-size="13" font-weight="600" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif">H</text>
			`;
		}

		return `
			<svg viewBox="0 0 ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dreieck mit Maßen zur Flächenberechnung" style="max-width:380px;width:100%;height:auto;display:block;margin:0.5rem auto;border-radius:12px;background:#ffffff;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
				${triangleSvg}
			</svg>
		`;
	};

	const buildGeneralTriangleSvg = ({
		alphaDeg = 50,
		betaDeg = 60,
		labels = {},
		highlight = null,
		showHeight = false,
		heightText = null,
		unit = 'cm'
	}) => {
		const gammaDeg = 180 - alphaDeg - betaDeg;
		const aRad = alphaDeg * Math.PI / 180;
		const bRad = betaDeg * Math.PI / 180;
		const gRad = gammaDeg * Math.PI / 180;

		const bRaw = Math.sin(bRad) / Math.sin(gRad);
		const aRaw = Math.sin(aRad) / Math.sin(gRad);

		const Cx_raw = bRaw * Math.cos(aRad);
		const Cy_raw = bRaw * Math.sin(aRad);

		const minX = Math.min(0, 1, Cx_raw);
		const maxX = Math.max(0, 1, Cx_raw);
		const rawW = maxX - minX;
		const rawH = Cy_raw;

		const vbW = 440;
		const vbH = 260;
		const padX = 65;
		const padY = 50;

		const scale = Math.min((vbW - 2 * padX) / Math.max(0.01, rawW), (vbH - 2 * padY) / Math.max(0.01, rawH));

		const toSvg = (rx, ry) => ({
			x: padX + (rx - minX) * scale + (vbW - 2 * padX - rawW * scale) / 2,
			y: vbH - padY - ry * scale
		});

		const A = toSvg(0, 0);
		const B = toSvg(1, 0);
		const C = toSvg(Cx_raw, Cy_raw);

		const makeSideLabel = (P1, P2, text, isHighlight = false) => {
			if (!text) return '';
			const mx = (P1.x + P2.x) / 2;
			const my = (P1.y + P2.y) / 2;
			const dx = P2.x - P1.x;
			const dy = P2.y - P1.y;
			const len = Math.hypot(dx, dy) || 1;
			let nx = dy / len;
			let ny = -dx / len;
			const cx = (A.x + B.x + C.x) / 3;
			const cy = (A.y + B.y + C.y) / 3;
			if (nx * (cx - mx) + ny * (cy - my) > 0) {
				nx = -nx;
				ny = -ny;
			}
			const dist = 18;
			const lx = mx + nx * dist;
			const ly = my + ny * dist + 4;
			const pillW = Math.max(48, text.length * 8 + 14);

			const strokeCol = isHighlight ? '#dc2626' : '#cbd5e1';
			const fillCol = isHighlight ? '#fef2f2' : '#ffffff';
			const textCol = isHighlight ? '#dc2626' : '#1e293b';

			return `<g class="side-lbl">
				<rect x="${(lx - pillW / 2).toFixed(1)}" y="${(ly - 12).toFixed(1)}" width="${pillW}" height="19" rx="4" fill="${fillCol}" fill-opacity="0.95" stroke="${strokeCol}" stroke-width="${isHighlight ? 1.5 : 0.8}"/>
				<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="${textCol}" font-family="system-ui, -apple-system, sans-serif">${text}</text>
			</g>`;
		};

		const drawAngleArc = (V, P_other1, P_other2, deg, label, isHighlight = false, isRight = false) => {
			if (!label && !isRight && !isHighlight) return '';
			const r = 28;

			const v1x = P_other1.x - V.x, v1y = P_other1.y - V.y;
			const l1 = Math.hypot(v1x, v1y) || 1;
			const u1 = { x: v1x / l1, y: v1y / l1 };

			const v2x = P_other2.x - V.x, v2y = P_other2.y - V.y;
			const l2 = Math.hypot(v2x, v2y) || 1;
			const u2 = { x: v2x / l2, y: v2y / l2 };

			if (isRight) {
				const sq = 14;
				const k1 = { x: V.x + u1.x * sq, y: V.y + u1.y * sq };
				const kCorn = { x: V.x + (u1.x + u2.x) * sq, y: V.y + (u1.y + u2.y) * sq };
				const k2 = { x: V.x + u2.x * sq, y: V.y + u2.y * sq };
				const dot = { x: V.x + (u1.x + u2.x) * (sq * 0.45), y: V.y + (u1.y + u2.y) * (sq * 0.45) };
				return `<g class="right-angle">
					<path d="M ${k1.x.toFixed(1)} ${k1.y.toFixed(1)} L ${kCorn.x.toFixed(1)} ${kCorn.y.toFixed(1)} L ${k2.x.toFixed(1)} ${k2.y.toFixed(1)}" fill="rgba(37,99,235,0.06)" stroke="#2563eb" stroke-width="1.8" stroke-linejoin="round"/>
					<circle cx="${dot.x.toFixed(1)}" cy="${dot.y.toFixed(1)}" r="2.2" fill="#2563eb"/>
				</g>`;
			}

			const a1 = Math.atan2(v1y, v1x);
			const a2 = Math.atan2(v2y, v2x);
			let diff = a2 - a1;
			while (diff < 0) diff += 2 * Math.PI;
			while (diff >= 2 * Math.PI) diff -= 2 * Math.PI;

			const sweep = diff > Math.PI ? 0 : 1;
			const p1 = { x: V.x + r * Math.cos(a1), y: V.y + r * Math.sin(a1) };
			const p2 = { x: V.x + r * Math.cos(a2), y: V.y + r * Math.sin(a2) };

			let bisect = a1 + (diff < Math.PI ? diff / 2 : (diff - 2 * Math.PI) / 2);
			const labelDist = r + 16;
			const lx = V.x + labelDist * Math.cos(bisect);
			const ly = V.y + labelDist * Math.sin(bisect) + 4;

			const fillColor = isHighlight ? 'rgba(239, 68, 68, 0.15)' : 'rgba(37, 99, 235, 0.12)';
			const strokeColor = isHighlight ? '#dc2626' : '#2563eb';
			const textColor = isHighlight ? '#dc2626' : '#1e293b';

			const pillW = label ? Math.max(30, label.length * 8 + 8) : 0;
			const badge = label ? `
				<rect x="${(lx - pillW / 2).toFixed(1)}" y="${(ly - 11).toFixed(1)}" width="${pillW}" height="17" rx="3" fill="#ffffff" fill-opacity="0.92" stroke="${strokeColor}" stroke-width="0.8"/>
				<text x="${lx.toFixed(1)}" y="${(ly + 2).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${label}</text>
			` : '';

			return `<g class="angle-arc">
				<path d="M ${V.x.toFixed(1)} ${V.y.toFixed(1)} L ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${r} ${r} 0 0 ${sweep} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.6"/>
				${badge}
			</g>`;
		};

		let heightSvg = '';
		if (showHeight) {
			const Hx = C.x;
			const Hy = A.y;
			const hText = heightText || labels.h;
			const isHighlight = highlight === 'h';
			const strokeCol = isHighlight ? '#dc2626' : '#dc2626';

			const rightAtH = `<path d="M ${Hx},${Hy - 12} L ${Hx + 12},${Hy - 12} L ${Hx + 12},${Hy}" fill="none" stroke="#dc2626" stroke-width="1.5"/><circle cx="${Hx + 6}" cy="${Hy - 6}" r="1.8" fill="#dc2626"/>`;

			let baseExtSvg = '';
			if (Hx < A.x) {
				baseExtSvg = `<line x1="${Hx}" y1="${Hy}" x2="${A.x}" y2="${A.y}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 3"/>`;
			} else if (Hx > B.x) {
				baseExtSvg = `<line x1="${B.x}" y1="${Hy}" x2="${Hx}" y2="${A.y}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 3"/>`;
			}

			const pillW = hText ? Math.max(46, hText.length * 8 + 12) : 0;
			const lblPos = Hx < A.x ? (Hx - pillW / 2 - 8) : (Hx + pillW / 2 + 8);

			heightSvg = `<g class="triangle-h">
				${baseExtSvg}
				<line x1="${C.x.toFixed(1)}" y1="${C.y.toFixed(1)}" x2="${Hx.toFixed(1)}" y2="${Hy.toFixed(1)}" stroke="${strokeCol}" stroke-width="2" stroke-dasharray="5 4"/>
				${rightAtH}
				${hText ? `<g>
					<rect x="${(lblPos - pillW / 2).toFixed(1)}" y="${((C.y + Hy) / 2 - 10).toFixed(1)}" width="${pillW}" height="19" rx="4" fill="#ffffff" fill-opacity="0.95" stroke="#fca5a5" stroke-width="1"/>
					<text x="${lblPos.toFixed(1)}" y="${((C.y + Hy) / 2 + 4).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="#dc2626" font-family="system-ui, -apple-system, sans-serif">${hText}</text>
				</g>` : ''}
			</g>`;
		}

		const sideA = makeSideLabel(B, C, labels.a, highlight === 'a');
		const sideB = makeSideLabel(C, A, labels.b, highlight === 'b');
		const sideC = makeSideLabel(A, B, labels.c, highlight === 'c');

		const isRightC = Math.abs(gammaDeg - 90) < 0.5;
		const isRightA = Math.abs(alphaDeg - 90) < 0.5;
		const isRightB = Math.abs(betaDeg - 90) < 0.5;

		const angleA = drawAngleArc(A, B, C, alphaDeg, labels.alpha, highlight === 'alpha', isRightA);
		const angleB = drawAngleArc(B, C, A, betaDeg, labels.beta, highlight === 'beta', isRightB);
		const angleC = drawAngleArc(C, A, B, gammaDeg, labels.gamma, highlight === 'gamma', isRightC);

		return `
			<svg viewBox="0 0 ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dreiecks-Diagramm" style="max-width:380px;width:100%;height:auto;display:block;margin:0.5rem auto;border-radius:12px;background:#ffffff;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
				<polygon points="${A.x.toFixed(1)},${A.y.toFixed(1)} ${B.x.toFixed(1)},${B.y.toFixed(1)} ${C.x.toFixed(1)},${C.y.toFixed(1)}" fill="#f0f7ff" stroke="#1e3a8a" stroke-width="2.5" stroke-linejoin="round"/>
				${heightSvg}
				${angleA}
				${angleB}
				${angleC}
				${sideA}
				${sideB}
				${sideC}
				<text x="${(A.x - 16).toFixed(1)}" y="${(A.y + 6).toFixed(1)}" font-size="14" font-weight="700" fill="#475569" font-family="system-ui, -apple-system, sans-serif">A</text>
				<text x="${(B.x + 8).toFixed(1)}" y="${(B.y + 6).toFixed(1)}" font-size="14" font-weight="700" fill="#475569" font-family="system-ui, -apple-system, sans-serif">B</text>
				<text x="${C.x.toFixed(1)}" y="${(C.y - 10).toFixed(1)}" text-anchor="middle" font-size="14" font-weight="700" fill="#475569" font-family="system-ui, -apple-system, sans-serif">C</text>
			</svg>
		`;
	};

	let v1, v2;
	let rd;
	switch (type) {

		case 'additionstabellen':
		case 'multiplikationstabellen': {
			const isAdd = type === 'additionstabellen';
			const isPositiveOnly = grade <= 7;
			const min = isPositiveOnly ? (isAdd ? 20 : 2) : (isAdd ? -50 : -13);
			const max = isPositiveOnly ? (isAdd ? 100 : 12) : (isAdd ? 50 : 13);
			const allValues = pickDistinctIntegers(min, max, 7);
			const rowHeaders = allValues.slice(0, 2);
			const colHeaders = allValues.slice(2);

			const cellValues = rowHeaders.map(r => colHeaders.map(c => isAdd ? r + c : r * c));

			const hiddenRowIndex = 1;
			const hiddenColIndex = randInt(2, 4);
			const clueColIndex = hiddenColIndex === 0 ? 1 : 0;
			const clueRowIndex = hiddenRowIndex === 0 ? 1 : 0;

			const givenRowHeader = [true, true];
			const givenColHeader = [true, true, true, true, true];
			givenRowHeader[hiddenRowIndex] = false;
			givenColHeader[hiddenColIndex] = false;

			const givenCells = {
				[`${hiddenRowIndex}-${clueColIndex}`]: true,
				[`${clueRowIndex}-${hiddenColIndex}`]: true
			};

			const opSymbol = isAdd ? '+' : '×';

			textDisplay = buildOpTableHTML({
				colHeaders,
				rowHeaders,
				cellValues,
				givenColHeader,
				givenRowHeader,
				givenCells,
				opSymbol,
			});

			const solvedTableRows = rowHeaders.map((rowVal, rowIndex) => {
				const rowCells = colHeaders.map((colVal, colIndex) => {
					const result = cellValues[rowIndex][colIndex];
					return `<td>${result}</td>`;
				}).join('');
				return `<tr><th>${rowVal}</th>${rowCells}</tr>`;
			}).join('');

			s = `
				<div class="op-table-wrap">
					<table class="op-table op-table--solution">
						<tr><th class="op-corner">${opSymbol}</th>${colHeaders.map(c => `<th>${c}</th>`).join('')}</tr>
						${solvedTableRows}
					</table>
				</div>
			`;
			break;
		}

		case 'subtraktionstabellen': {
			const isPositiveOnly = grade <= 7;
			let rowHeaders;
			let colHeaders;

			if (isPositiveOnly) {
				const maxSubtrahend = randInt(20, 50);
				const firstRow = maxSubtrahend + randInt(10, 30);
				const secondRow = firstRow + randInt(10, 20);
				rowHeaders = [firstRow, secondRow];
				colHeaders = pickDistinctIntegers(0, maxSubtrahend, 5);
			} else {
				const min = -50, max = 50;
				const allValues = pickDistinctIntegers(min, max, 7);
				rowHeaders = allValues.slice(0, 2);
				colHeaders = allValues.slice(2);
			}

			const cellValues = rowHeaders.map(r => colHeaders.map(c => r - c));

			const hiddenRowIndex = 1;
			const hiddenColIndex = randInt(2, 4);
			const clueColIndex = hiddenColIndex === 0 ? 1 : 0;
			const clueRowIndex = hiddenRowIndex === 0 ? 1 : 0;

			const givenRowHeader = [true, true];
			const givenColHeader = [true, true, true, true, true];
			givenRowHeader[hiddenRowIndex] = false;
			givenColHeader[hiddenColIndex] = false;

			const givenCells = {
				[`${hiddenRowIndex}-${clueColIndex}`]: true,
				[`${clueRowIndex}-${hiddenColIndex}`]: true
			};

			const opSymbol = '&#8210';
			textDisplay = buildOpTableHTML({
				colHeaders,
				rowHeaders,
				cellValues,
				givenColHeader,
				givenRowHeader,
				givenCells,
				opSymbol,
			});

			const solvedTableRows = rowHeaders.map((rowVal, rowIndex) => {
				const rowCells = colHeaders.map((colVal, colIndex) => {
					const result = cellValues[rowIndex][colIndex];
					return `<td>${result}</td>`;
				}).join('');
				return `<tr><th>${rowVal}</th>${rowCells}</tr>`;
			}).join('');

			s = `
				<div class="op-table-wrap">
					<table class="op-table op-table--solution">
						<tr><th class="op-corner">${opSymbol}</th>${colHeaders.map(c => `<th>${c}</th>`).join('')}</tr>
						${solvedTableRows}
					</table>
				</div>
			`;
			break;
		}

		case 'termtabellen': {
			const useNaturalNumbers = grade <= 7;
			const formatLinearExpr = (a, b) => {
				if (b === 0) return `${a}x`;
				return `${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`;
			};
			const formatQuadraticExpr = (a, b) => {
				if (b === 0) return `${a}x^2`;
				return `${a}x^2 ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`;
			};
			const formatMixedExpr = (a, b) => {
				const termA = `${a}x`;
				const termB = `${Math.abs(b)}x^2`;
				if (b === 0) return termA;
				return `${termA} ${b >= 0 ? '+' : '-'} ${termB}`;
			};

			const createTermDescriptor = (patternIndex = null) => {
				const patterns = [
					() => {
						const a = useNaturalNumbers ? randInt(2, 6) : rnd(-6, 6);
						const b = useNaturalNumbers ? randInt(3, 20) : rnd(-20, 20);
						const expr = formatLinearExpr(a, b);
						return {
							expr,
							evalFn: x => a * x + b,
							substitute: x => b >= 0 ? `${a*x} + ${Math.abs(b)}` : `${a*x} - ${Math.abs(b)}`,
						};
					},
					() => {
						const a = useNaturalNumbers ? randInt(2, 6) : rnd(-6, 6);
						const b = useNaturalNumbers ? randInt(3, 20) : rnd(-20, 20);
						const expr = formatQuadraticExpr(a, b);
						return {
							expr,
							evalFn: x => a * x * x + b,
							substitute: x => b >= 0 ? `${a*x*x} + ${Math.abs(b)}` : `${a*x*x} - ${Math.abs(b)}`,
						};
					},
					() => {
						const a = useNaturalNumbers ? randInt(2, 6) : rnd(-6, 6);
						const b = useNaturalNumbers ? randInt(3, 20) : rnd(-20, 20);
						const expr = formatMixedExpr(a, b);
						return {
							expr,
							evalFn: x => a * x + (b >= 0 ? 1 : -1) * Math.abs(b) * x * x,
							substitute: x => b >= 0 ? `${a*x} + ${Math.abs(b)*x*x}` : `${a*x} - ${Math.abs(b)*x*x}`,
						};
					}
				];

				if (patternIndex === null) {
					patternIndex = randInt(0, patterns.length - 1);
				}

				return patterns[patternIndex]();
			};

			const term1 = createTermDescriptor(0);
			let term2 = createTermDescriptor(randInt(1, 2));
			while (term1.expr === term2.expr) {
				term2 = createTermDescriptor(randInt(1, 2));
			}

			let x1;
			let x2;
			if (useNaturalNumbers) {
				x1 = randInt(2, 5);
				x2 = randInt(2, 5);
				while (x2 === x1) {
					x2 = randInt(2, 5);
				}
			} else {
				x1 = rnd(2, 5);
				x2 = rnd(-5, -2);
			}

			const xValues = [x1, x2];
			const rawResults = [
				[term1.evalFn(xValues[0]), term2.evalFn(xValues[0])],
				[term1.evalFn(xValues[1]), term2.evalFn(xValues[1])]
			];

			if (useNaturalNumbers) {
				for (let row = 0; row < rawResults.length; row++) {
					for (let col = 0; col < rawResults[row].length; col++) {
						if (rawResults[row][col] < 0) {
							return;
						}
					}
				}
			}

			const resultTable = rawResults.map(row => row.map(val => Number.isInteger(val) ? val : Number(val.toFixed(2))));

			textDisplay = `
				<div class="op-table-wrap">
					<table class="op-table op-table--terms">
						<tr>
							<th class="op-corner">\\( x \\)</th>
							<th>\\( ${term1.expr} \\)</th>
							<th>\\( ${term2.expr} \\)</th>
						</tr>
						<tr>
							<th>${xValues[0]}</th>
							<td> </td>
							<td> </td>
						</tr>
						<tr>
							<th>${xValues[1]}</th>
							<td> </td>
							<td> </td>
						</tr>
					</table>
				</div>
			`;

			s = `
				<div class="op-table-wrap">
					<table class="op-table op-table--solution op-table--terms">
						<tr>
							<th class="op-corner">x</th>
							<th>\\( ${term1.expr} \\)</th>
							<th>\\( ${term2.expr} \\)</th>
						</tr>
						<tr>
							<th>${xValues[0]}</th>
							<td>\\( ${term1.substitute(xValues[0])} = ${resultTable[0][0]} \\)</td>
							<td>\\( ${term2.substitute(xValues[0])} = ${resultTable[0][1]} \\)</td>
						</tr>
						<tr>
							<th>${xValues[1]}</th>
							<td>\\( ${term1.substitute(xValues[1])} = ${resultTable[1][0]} \\)</td>
							<td>\\( ${term2.substitute(xValues[1])} = ${resultTable[1][1]} \\)</td>
						</tr>
					</table>
				</div>
			`;
			break;
		}

	case 'dezimalbrueche_addieren_subtrahieren': {
		const a = trueDec(0, 15);
		let b = grade >= 7 ? trueDec(0, 13) : trueDec(0, a - 0.1);
		b = Math.random() < 0.3 ? b - (b < 4 ? 0 : trueDec(b-3, b-1)) - trueDec(0, 1)/10 : b;
		const isAddition = Math.random() > 0.5;
		const result = isAddition ? a + b : a - b;
		const operator = isAddition ? '+' : '-';
		textDisplay = `\\[ ${formatDecimal(a,2)} ${operator} ${formatDecimal(b,2)} = \\]`;
		s = `\\[ ${formatDecimal(a,2)} ${operator} ${formatDecimal(b,2)} = ${formatDecimal(result,2)} \\]`;
		answer = numericAnswer(Number(result.toFixed(2)));
		break;
	}
	case 'dezimalbrueche_multiplizieren_dividieren': {
		const allowNegativeDecimals = grade >= 7;
		const rdLocal = Math.random();
		if (rdLocal > 0.7) {
			const a = allowNegativeDecimals ? trueDec(-9, 9) : trueDec(0, 9);
			const b = allowNegativeDecimals ? rnd(-7, 7) : rnd(1, 7);
			const result = a * b;
			textDisplay = `\\( ${comma(a)} \\cdot ${comma(fmt(b))} =\\)`;
			s = `\\( ${comma(a)} \\cdot ${comma(fmt(b))} = ${comma(result.toFixed(1))} \\)`;
			answer = numericAnswer(Number(result.toFixed(1)));
		} else if (rdLocal > 0.4) {
			const a = allowNegativeDecimals ? trueDec(-1.5, 1.5) : trueDec(0, 1.5);
			const b = allowNegativeDecimals ? trueDec(-1.5, 1.5) : trueDec(0, 1.5);
			const result = a * b;
			textDisplay = `\\[ ${comma(a)} \\cdot ${comma(fmt(b))} = \\]`;
			s = `\\[ ${comma(a)} \\cdot ${comma(fmt(b))} = ${comma(result.toFixed(2))} \\]`;
			answer = numericAnswer(Number(result.toFixed(2)));
		} else {
			const res = allowNegativeDecimals ? trueDec(-1.5, 1.5) : trueDec(0, 1.5);
			let b = allowNegativeDecimals ? rnd(-9, 9) : rnd(2, 9);
			while (b === 0) {
				b = allowNegativeDecimals ? rnd(-9, 9) : rnd(2, 9);
			}
			const a = res * b;
			textDisplay = `\\[ ${comma(a.toFixed(1))} : ${comma(fmt(b))} = \\]`;
			s = `\\[ ${comma(a.toFixed(1))} : ${comma(fmt(b))} = ${comma(res.toFixed(1))} \\]`;
			answer = numericAnswer(Number(res.toFixed(1)));
		}
		break;
	}
	case 'natuerliche_zahlen_addieren_subtrahieren': {
		const isAddition = Math.random() > 0.5;
		if (isAddition) {
			const v1 = randInt(20, 300);
			const v2 = randInt(20, 300);
			const sum = v1 + v2;
			textDisplay = `\\[ ${v1} + ${v2} = \\]`;
			s = `\\[ ${v1} + ${v2} = ${sum} \\]`;
			answer = numericAnswer(sum);
		} else {
			const v1 = randInt(70, 300);
			const v2 = randInt(20, v1);
			const diff = v1 - v2;
			textDisplay = `\\[ ${v1} - ${v2} = \\]`;
			s = `\\[ ${v1} - ${v2} = ${diff} \\]`;
			answer = numericAnswer(diff);
		}
		break;
	}
	case 'ganze_zahlen_addieren_subtrahieren': {
		if (Math.random() > 0.5) {
			let first, second;
			do {
				first = rnd(-20, 20);
				second = rnd(-20, 20);
			} while (!(first < 0 || second < 0 || (first + second) < 0));
			const sum = first + second;
			const solution = second < 0
				? `\\[ ${first} + ${fmt(second)} = ${first} - ${Math.abs(second)} = ${sum} \\]`
				: `\\[ ${first} + ${fmt(second)} = ${sum} \\]`;
			textDisplay = `\\[ ${first} + ${fmt(second)} = \\]`;
			s = solution;
			answer = numericAnswer(sum);
		} else {
			let first, second;
			do {
				first = rnd(-20, 20);
				second = rnd(-20, 20);
			} while (!(first < 0 || second < 0 || (first - second) < 0));
			const diff = first - second;
			const solution = second < 0
				? `\\[ ${first} - ${fmt(second)} = ${first} + ${Math.abs(second)} = ${diff} \\]`
				: `\\[ ${first} - ${fmt(second)} = ${diff} \\]`;
			textDisplay = `\\[ ${first} - ${fmt(second)} = \\]`;
			s = solution;
			answer = numericAnswer(diff);
		}
		break;
	}
	case 'natuerliche_zahlen_multiplizieren_dividieren': {
		if (Math.random() < 0.6) {
			if (Math.random() < 0.3) {
				const factorCount = Math.random() < 0.5 ? 3 : 4;
				let factors;
				let product;
				do {
					factors = Array.from({ length: factorCount }, () => Math.random() < 0.05 ? 0 : randInt(0, 10));
					product = factors.reduce((result, factor) => result * factor, 1);
				} while (product > 400);
				const factorText = factors.join(' \\cdot ');
				textDisplay = `\\[ ${factorText} = \\]`;
				s = `\\[ ${factorText} = ${product} \\]`;
				answer = numericAnswer(product);
			} else {
				const v1 = rnd(2, 10);
				const v2 = rnd(2, 9);
				const product = v1 * v2;
				textDisplay = `\\[ ${v1} \\cdot ${v2} = \\]`;
				s = `\\[ ${v1} \\cdot ${v2} = ${product} \\]`;
				answer = numericAnswer(product);
			}
		} else {
			const divisor = Math.random() < 0.5 ? randInt(1, 13) : randInt(2, 9);
			const quotient = divisor >= 11 ? rnd(2, 5) : rnd(2, 12);
			const dividend = divisor * quotient;
			textDisplay = `\\[ ${dividend} : ${divisor} = \\]`;
			s = `\\[ ${dividend} : ${divisor} = ${quotient} \\]`;
			answer = numericAnswer(quotient);
		}
		break;
	}
	case 'einmaleins_2':
	case 'einmaleins_3':
	case 'einmaleins_4':
	case 'einmaleins_5':
	case 'einmaleins_6':
	case 'einmaleins_7':
	case 'einmaleins_8':
	case 'einmaleins_9':
	case 'einmaleins_10':
	case 'geteilt_durch_2':
	case 'geteilt_durch_3':
	case 'geteilt_durch_4':
	case 'geteilt_durch_5':
	case 'geteilt_durch_6':
	case 'geteilt_durch_7':
	case 'geteilt_durch_8':
	case 'geteilt_durch_9':
	case 'geteilt_durch_10':
	case 'addition_bis_10':
	case 'addition_bis_20':
	case 'addition_bis_50':
	case 'addition_bis_100':
	case 'addition_bis_1000':
	case 'subtraktion_bis_10':
	case 'subtraktion_bis_20':
	case 'subtraktion_bis_50':
	case 'subtraktion_bis_100':
	case 'subtraktion_bis_1000':
	case 'einmaleins_2':
case 'einmaleins_3':
case 'einmaleins_4':
case 'einmaleins_5':
case 'einmaleins_6':
case 'einmaleins_7':
case 'einmaleins_8':
case 'einmaleins_9':
case 'einmaleins_10':
case 'geteilt_durch_2':
case 'geteilt_durch_3':
case 'geteilt_durch_4':
case 'geteilt_durch_5':
case 'geteilt_durch_6':
case 'geteilt_durch_7':
case 'geteilt_durch_8':
case 'geteilt_durch_9':
case 'geteilt_durch_10':
case 'addition_bis_10':
case 'addition_bis_20':
case 'addition_bis_50':
case 'addition_bis_100':
case 'addition_bis_1000':
case 'subtraktion_bis_10':
case 'subtraktion_bis_20':
case 'subtraktion_bis_50':
case 'subtraktion_bis_100':
case 'subtraktion_bis_1000':
case 'kleines_1x1_multiplikation':
case 'kleines_1x1_division':
case 'kleines_1x1_komplett':
case 'addition_subtraktion_bis_20':
case 'addition_subtraktion_bis_100':
case 'addition_subtraktion_bis_1000': {
		let expr;
		let solution;
		let answer;
		if (type.startsWith('einmaleins_')) {
			const row = Number(type.slice('einmaleins_'.length));
			const otherFactor = randInt(1, 10);
			const factorsReversed = Math.random() < 0.5;
			const firstFactor = factorsReversed ? otherFactor : row;
			const secondFactor = factorsReversed ? row : otherFactor;
			const product = firstFactor * secondFactor;
			expr = `\\[ ${firstFactor} \\cdot ${secondFactor} = \\]`;
			solution = `\\[ ${firstFactor} \\cdot ${secondFactor} = ${product} \\]`;
			answer = numericAnswer(product);
		} else if (type.startsWith('geteilt_durch_')) {
			const divisor = Number(type.slice('geteilt_durch_'.length));
			const quotient = randInt(1, 10);
			const dividend = divisor * quotient;
			expr = `\\[ ${dividend} : ${divisor} = \\]`;
			solution = `\\[ ${dividend} : ${divisor} = ${quotient} \\]`;
			answer = numericAnswer(quotient);
		} else if (type.startsWith('addition_bis_')) {
			const limit = Number(type.slice('addition_bis_'.length));
			const firstAddend = randInt(0, limit);
			const secondAddend = randInt(0, limit - firstAddend);
			const sum = firstAddend + secondAddend;
			expr = `\\[ ${firstAddend} + ${secondAddend} = \\]`;
			solution = `\\[ ${firstAddend} + ${secondAddend} = ${sum} \\]`;
			answer = numericAnswer(sum);
		} else if (type.startsWith('subtraktion_bis_')) {
			const limit = Number(type.slice('subtraktion_bis_'.length));
			const minuend = randInt(0, limit);
			const subtrahend = randInt(0, minuend);
			const difference = minuend - subtrahend;
			expr = `\\[ ${minuend} - ${subtrahend} = \\]`;
			solution = `\\[ ${minuend} - ${subtrahend} = ${difference} \\]`;
			answer = numericAnswer(difference);
		} else if (type.startsWith('kleines_1x1_')) {
			const isMultiplication = type === 'kleines_1x1_multiplikation'
				|| (type === 'kleines_1x1_komplett' && Math.random() < 0.5);
			const firstFactor = randInt(1, 10);
			const secondFactor = randInt(1, 10);
			const product = firstFactor * secondFactor;
			if (isMultiplication) {
				expr = `\\[ ${firstFactor} \\cdot ${secondFactor} = \\]`;
				solution = `\\[ ${firstFactor} \\cdot ${secondFactor} = ${product} \\]`;
				answer = numericAnswer(product);
			} else {
				expr = `\\[ ${product} : ${secondFactor} = \\]`;
				solution = `\\[ ${product} : ${secondFactor} = ${firstFactor} \\]`;
				answer = numericAnswer(firstFactor);
			}
		} else {
			const limit = Number(type.slice('addition_subtraktion_bis_'.length));
			const isAddition = Math.random() < 0.5;
			const firstNumber = randInt(0, limit);
			const secondNumber = isAddition
				? randInt(0, limit - firstNumber)
				: randInt(0, firstNumber);
			const result = isAddition
				? firstNumber + secondNumber
				: firstNumber - secondNumber;
			const operator = isAddition ? '+' : '-';
			expr = `\\[ ${firstNumber} ${operator} ${secondNumber} = \\]`;
			solution = `\\[ ${firstNumber} ${operator} ${secondNumber} = ${result} \\]`;
			answer = numericAnswer(result);
		}
		textDisplay = expr;
		s = solution;
		answer = answer;
		break;
	}
	case 'ganze_zahlen_multiplizieren_dividieren': {
		if (isQuizMode) {
			let expr;
			let solution;
			let answer;
			if (Math.random() > 0.5) {
				do {
					v1 = rnd(-15, 15);
					v2 = rnd(-9, 9);
				} while (!(v1 < 0 || v2 < 0 || (v1 * v2) < 0));
				expr = `\\[ ${v1} \\cdot ${fmt(v2)} = \\]`;
				const product = v1 * v2;
				solution = `\\[ ${v1} \\cdot ${fmt(v2)} = ${product} \\]`;
				answer = numericAnswer(product);
			} else {
				let res;
				do {
					res = rnd(-9, 9);
					v2 = rnd(1, 12);
					Math.random() < 0.5 ? v2 = -v2 : null;
				} while (!(res < 0 || v2 < 0 || (res * v2) < 0));
				v1 = res * v2;
				expr = `\\[ ${v1} : ${fmt(v2)} = \\]`;
				solution = `\\[ ${v1} : ${fmt(v2)} = ${res} \\]`;
				answer = numericAnswer(res);
			}
			textDisplay = expr;
			s = solution;
			answer = answer;
		} else {
			let expr;
			let solution;
			if (Math.random() > 0.5) {
				if (Math.random() < 0.3) {
					const factorCount = Math.random() < 0.5 ? 3 : 4;
					let factors;
					let product;
					do {
						factors = Array.from({ length: factorCount }, () => {
							const factor = Math.random() < 0.05 ? 0 : randInt(0, 10);
							return Math.random() < 0.5 ? factor : -factor;
						});
						product = factors.reduce((result, factor) => result * factor, 1);
					} while (product < -400 || product > 400 || !factors.some(factor => factor < 0));
					const factorText = factors.map(factor => fmt(factor)).join(' \\cdot ');
					expr = `\\[ ${factorText} = \\]`;
					solution = `\\[ ${factorText} = ${product} \\]`;
				} else {
					do {
						v1 = rnd(-15, 15);
						v2 = rnd(-9, 9);
					} while (!(v1 < 0 || v2 < 0 || (v1 * v2) < 0));
					expr = `\\[ ${v1} \\cdot ${fmt(v2)} = \\]`;
					solution = `\\[ ${v1} \\cdot ${fmt(v2)} = ${v1 * v2} \\]`;
				}
			} else {
				let res;
				do {
					res = rnd(-9, 9);
					v2 = rnd(1, 12);
					Math.random() < 0.5 ? v2 = -v2 : null;
				} while (!(res < 0 || v2 < 0 || (res * v2) < 0));
				v1 = res * v2;
				expr = `\\[ ${v1} : ${fmt(v2)} = \\]`;
				solution = `\\[ ${v1} : ${fmt(v2)} = ${res} \\]`;
			}
			textDisplay = expr;
			s = solution;
		}
		break;
	}
	case 'zehnerpotenzen_multiplizieren_dividieren': {
		if (isQuizMode) {
			const normalizeDecimalString = (value) => {
				let [intPart, fracPart = ''] = value.split('.');
				intPart = intPart.replace(/^0+(?=\d)/, '');
				if (intPart === '') {
					intPart = '0';
				}
				fracPart = fracPart.replace(/0+$/, '');
				return fracPart ? `${intPart}.${fracPart}` : intPart;
			};

			const fromScaledInteger = (raw, decimals) => {
				if (decimals <= 0) {
					return String(raw) + (decimals < 0 ? '0'.repeat(-decimals) : '');
				}
				const sign = raw < 0 ? '-' : '';
				const absStr = String(Math.abs(raw)).padStart(decimals + 1, '0');
				const intPart = absStr.slice(0, -decimals);
				const fracPart = absStr.slice(-decimals);
				return `${sign}${normalizeDecimalString(`${intPart}.${fracPart}`)}`;
			};

			// Stufenzahl / Zehnerpotenz mit oder ohne Vorfaktor (z. B. 0.01, 0.02, 0.5, 10, 200, 3000)
			// Vorfaktoren: 1 (reine Zehnerpotenz), 2, 3, 4 oder 5
			// In dieser Aufgabenart werden nur Vorfaktoren von 1 oder 2 verwendet.
			const integerOnly = grade <= 5;
			if (integerOnly) {
				const appendZeros = (value, count) => String(value) + '0'.repeat(count);
				const isMult = Math.random() > 0.5;
				const secondZeros = randInt(1, 2);
				let firstZeros;
				let operandStrRaw;
				let stepStrRaw;
				let resultStrRaw;

				if (isMult) {
					firstZeros = randInt(0, 2);
					const firstBase = randInt(1, 12);
					const secondBase = randInt(1, 12);
					operandStrRaw = appendZeros(firstBase, firstZeros);
					stepStrRaw = appendZeros(secondBase, secondZeros);
					resultStrRaw = String(Number(operandStrRaw) * Number(stepStrRaw));
				} else {
					// Die erste Nullanzahl darf nicht kleiner als die zweite sein,
					// damit die Division trotz angehängter Nullen ganzzahlig bleibt.
					firstZeros = randInt(secondZeros, 2);
					const quotientBase = randInt(1, 12);
					const divisorBase = randInt(1, 12);
					operandStrRaw = appendZeros(quotientBase * divisorBase, firstZeros);
					stepStrRaw = appendZeros(divisorBase, secondZeros);
					resultStrRaw = String(quotientBase * Math.pow(10, firstZeros - secondZeros));
				}

				const op = isMult ? '\\cdot' : ':';
				const operandFormatted = comma(operandStrRaw);
				const stepFormatted = comma(stepStrRaw);
				const resultFormatted = comma(resultStrRaw);
				const expr = `\\[ ${operandFormatted} ${op} ${stepFormatted} =\\]`;
				const solution = `\\[ ${operandFormatted} ${op} ${stepFormatted} = ${resultFormatted} \\]`;
				textDisplay = expr;
				s = solution;
				answer = numericAnswer(Number(resultStrRaw));
			} else {
				const coeff = [1, 2][randInt(0, 1)]; // Vorfaktor: 1 oder 2
				const exponentOptions = [-2, -1, 1, 2, 3];
				const exponent = exponentOptions[randInt(0, exponentOptions.length - 1)];

				const stepStrRaw = fromScaledInteger(coeff, -exponent);
				const isMult = Math.random() > 0.5;
				let operandStrRaw;
				let resultStrRaw;

				if (isMult) {
					// MULTIPLIKATION: operand * stepStrRaw = result
					let mOperand, dOperand;
					if (!integerOnly && Math.random() > 0.4) {
						// Dezimalbruch mit 1 oder 2 Nachkommastellen
						dOperand = (coeff === 1 && (exponent === 1 || exponent === 2) && Math.random() > 0.5) ? 2 : 1;
						mOperand = dOperand === 2 ? rnd(11, 250) : rnd(2, 95);
					} else {
						// Natürliche Zahl
						dOperand = 0;
						mOperand = rnd(2, 45);
					}

					operandStrRaw = fromScaledInteger(mOperand, dOperand);
					const rawResult = mOperand * coeff;
					const resultDecimals = dOperand - exponent;
					resultStrRaw = fromScaledInteger(rawResult, resultDecimals);
				} else {
					// DIVISION: operand : stepStrRaw = result
					// Glatten Quotienten erzeugen, damit die Aufgabe exakt aufgeht
					let mQuotient, dQuotient;
					if (!integerOnly && Math.random() > 0.4) {
						dQuotient = 1;
						mQuotient = rnd(2, 45);
					} else {
						dQuotient = 0;
						mQuotient = rnd(2, 35);
					}

					resultStrRaw = fromScaledInteger(mQuotient, dQuotient);
					const rawDividend = mQuotient * coeff;
					const dividendDecimals = dQuotient - exponent;
					operandStrRaw = fromScaledInteger(rawDividend, dividendDecimals);
				}

				const op = isMult ? '\\cdot' : ':';
				const operandFormatted = comma(operandStrRaw);
				const stepFormatted = comma(stepStrRaw);
				const resultFormatted = comma(resultStrRaw);

				// Aufgabe
				const expr = `\\[ ${operandFormatted} ${op} ${stepFormatted} =\\]`;

				// Lösung mit Hilfestellung bei Multiplikation/Division mit Dezimalbrüchen
				let solution;
				if (coeff === 1 && exponent < 0 && isMult) {
					solution = `\\[ ${operandFormatted} ${op} ${stepFormatted} = ${resultFormatted} \\quad ( : ${Math.pow(10, -exponent)} )\\]`;
				} else if (coeff === 1 && exponent < 0 && !isMult) {
					solution = `\\[ ${operandFormatted} ${op} ${stepFormatted} = ${resultFormatted} \\quad ( \\cdot ${Math.pow(10, -exponent)} )\\]`;
				} else {
					solution = `\\[ ${operandFormatted} ${op} ${stepFormatted} = ${resultFormatted} \\]`;
				}

				textDisplay = expr;
				s = solution;
				answer = numericAnswer(Number(resultStrRaw));
			}
		} else {
			const normalizeDecimalString = (value) => {
				let [intPart, fracPart = ''] = value.split('.');
				intPart = intPart.replace(/^0+(?=\d)/, '');
				if (intPart === '') {
					intPart = '0';
				}
				fracPart = fracPart.replace(/0+$/, '');
				return fracPart ? `${intPart}.${fracPart}` : intPart;
			};

			const fromScaledInteger = (raw, decimals) => {
				if (decimals <= 0) {
					return String(raw) + (decimals < 0 ? '0'.repeat(-decimals) : '');
				}
				const sign = raw < 0 ? '-' : '';
				const absStr = String(Math.abs(raw)).padStart(decimals + 1, '0');
				const intPart = absStr.slice(0, -decimals);
				const fracPart = absStr.slice(-decimals);
				return `${sign}${normalizeDecimalString(`${intPart}.${fracPart}`)}`;
			};

			// In dieser Aufgabenart werden nur Vorfaktoren von 1 oder 2 verwendet.
			const coeff = [1, 2][randInt(0, 1)];
			const integerOnly = grade <= 5;
			if (integerOnly) {
				const appendZeros = (value, count) => String(value) + '0'.repeat(count);
				const isMult = Math.random() < 0.6;
				const secondZeros = randInt(1, 2);
				let firstZeros;
				let operandStrRaw;
				let stepStrRaw;
				let resultStrRaw;

				if (isMult) {
					firstZeros = randInt(0, 2);
					const firstBase = randInt(2, 12);
					const secondBase = randInt(1, 12);
					operandStrRaw = appendZeros(firstBase, firstZeros);
					stepStrRaw = appendZeros(secondBase, secondZeros);
					resultStrRaw = String(Number(operandStrRaw) * Number(stepStrRaw));
				} else {
					// Die erste Nullanzahl darf nicht kleiner als die zweite sein,
					// damit die Division trotz angehängter Nullen ganzzahlig bleibt.
					firstZeros = randInt(secondZeros, 2);
					const quotientBase = randInt(2, 12);
					const divisorBase = randInt(1, 12);
					operandStrRaw = appendZeros(quotientBase * divisorBase, firstZeros);
					stepStrRaw = appendZeros(divisorBase, secondZeros);
					resultStrRaw = String(quotientBase * Math.pow(10, firstZeros - secondZeros));
				}

				const op = isMult ? '\\cdot' : ':';
				const operandFormatted = comma(operandStrRaw);
				const stepFormatted = comma(stepStrRaw);
				const resultFormatted = comma(resultStrRaw);
				const expr = `\\[ ${operandFormatted} ${op} ${stepFormatted} =\\]`;
				const solution = `\\[ ${operandFormatted} ${op} ${stepFormatted} = ${resultFormatted} \\]`;
				textDisplay = expr;
				s = solution;
			} else {
				const exponentOptions = [-2, -1, 1, 2, 3];
				const exponent = exponentOptions[randInt(0, exponentOptions.length - 1)];

				const stepStrRaw = fromScaledInteger(coeff, -exponent);
				const isMult = Math.random() < 0.6;
				let operandStrRaw;
				let resultStrRaw;

				if (isMult) {
					// MULTIPLIKATION: operand * stepStrRaw = result
					let mOperand, dOperand;
					if (!integerOnly && Math.random() < 0.6) {
						// Dezimalbruch mit 1 oder 2 Nachkommastellen
						dOperand = (coeff === 1 && (exponent === 1 || exponent === 2) && Math.random() > 0.5) ? 2 : 1;
						mOperand = dOperand === 2 ? rnd(11, 250) : rnd(2, 95);
					} else {
						// Natürliche Zahl
						dOperand = 0;
						mOperand = rnd(2, 12);
					}

					operandStrRaw = fromScaledInteger(mOperand, dOperand);
					const rawResult = mOperand * coeff;
					const resultDecimals = dOperand - exponent;
					resultStrRaw = fromScaledInteger(rawResult, resultDecimals);
				} else {
					// DIVISION: operand : stepStrRaw = result
					// Glatten Quotienten erzeugen, damit die Aufgabe exakt aufgeht
					let mQuotient, dQuotient;
					if (!integerOnly && Math.random() > 0.4) {
						dQuotient = 1;
						mQuotient = rnd(2, 45);
					} else {
						dQuotient = 0;
						mQuotient = rnd(2, 35);
					}

					resultStrRaw = fromScaledInteger(mQuotient, dQuotient);
					const rawDividend = mQuotient * coeff;
					const dividendDecimals = dQuotient - exponent;
					operandStrRaw = fromScaledInteger(rawDividend, dividendDecimals);
				}

				const op = isMult ? '\\cdot' : ':';
				const operandFormatted = comma(operandStrRaw);
				const stepFormatted = comma(stepStrRaw);
				const resultFormatted = comma(resultStrRaw);

				// Aufgabe
				const expr = `\\[ ${operandFormatted} ${op} ${stepFormatted} =\\]`;

				// Lösung mit Hilfestellung bei Multiplikation/Division mit Dezimalbrüchen
				let solution;
				if (coeff === 1 && exponent < 0 && isMult) {
					solution = `\\[ ${operandFormatted} ${op} ${stepFormatted} = ${resultFormatted} \\quad ( : ${Math.pow(10, -exponent)} )\\]`;
				} else if (coeff === 1 && exponent < 0 && !isMult) {
					solution = `\\[ ${operandFormatted} ${op} ${stepFormatted} = ${resultFormatted} \\quad ( \\cdot ${Math.pow(10, -exponent)} )\\]`;
				} else {
					solution = `\\[ ${operandFormatted} ${op} ${stepFormatted} = ${resultFormatted} \\]`;
				}

				textDisplay = expr;
				s = solution;
			}
		}
		break;
	}
	case 'brueche_addieren_subtrahieren': {
		if (isQuizMode) {
			const getGcd = mathUtils.getGcd;

			// Erzeugt einen vollständig gekürzten Bruch.
			// Zähler darf 1 sein, Nenner liegt bewusst bei 2..9.
			const makeCoprimeFraction = (minNum = 2, maxNum = 10, minDen = 2, maxDen = 9, forbiddenDen = null) => {
				let num, den;
				do {
					num = rnd(minNum, maxNum) - 1;   // 1 ist explizit erlaubt
					den = rnd(minDen, maxDen);
				} while (getGcd(num, den) !== 1 || den === forbiddenDen);
				return [num, den];
			};

			// Erster Bruch
			let [z1, n1] = makeCoprimeFraction();

			// Zweiter Bruch: ebenfalls teilerfremd, aber mit verschiedenem Nenner
			let [z2, n2] = makeCoprimeFraction(1, 9, 2, 9, n1);

			const isAdd = Math.random() > 0.5;

			// Bei Subtraktion sicherstellen, dass das Ergebnis positiv bleibt
			if (!isAdd && (z1 * n2 <= z2 * n1)) {
				[z1, z2] = [z2, z1];
				[n1, n2] = [n2, n1];
			}

			// Hauptnenner
			const hn = (n1 * n2) / getGcd(n1, n2);

			const f1 = hn / n1;
			const f2 = hn / n2;

			const ez1 = z1 * f1;
			const ez2 = z2 * f2;

			const op = isAdd ? '+' : '-';
			const finalZ = isAdd ? ez1 + ez2 : ez1 - ez2;
			const finalReduced = maybeSimplifyFraction(finalZ, hn);
			const answerFraction = fractionAnswer(finalReduced.num, finalReduced.den, false);

			textDisplay = `Berechne: \\( \\quad \\dfrac{${z1}}{${n1}} ${op} \\dfrac{${z2}}{${n2}} = \\)`;

			// Dynamischer Lösungsweg
			let step1 = "";
			if (f1 > 1 && f2 > 1) {
				step1 = `\\frac{${z1} \\cdot ${f1} ${op} ${z2} \\cdot ${f2}}{${n1} \\cdot ${f1}} = \\frac{${ez1} ${op} ${ez2}}{${hn}}`;
			} else if (f1 > 1) {
				step1 = `\\frac{${z1} \\cdot ${f1}}{${n1} \\cdot ${f1}} ${op} \\frac{${z2}}{${n2}} = \\frac{${ez1} ${op} ${ez2}}{${hn}}`;
			} else if (f2 > 1) {
				step1 = `\\frac{${z1}}{${n1}} ${op} \\frac{${z2} \\cdot ${f2}}{${n2} \\cdot ${f2}} = \\frac{${ez1} ${op} ${ez2}}{${hn}}`;
			} 
			let kuerzStep = "";
			if (finalReduced.num !== finalZ || finalReduced.den !== hn) {
				kuerzStep = finalReduced.den === 1 ? ` = ${finalReduced.num}` : ` = \\frac{${finalReduced.num}}{${finalReduced.den}}`;
			}
			s = `\\[ \\frac{${z1}}{${n1}} ${op} \\frac{${z2}}{${n2}} = ${step1} = \\frac{${finalZ}}{${hn}}${kuerzStep} \\]`;
			answer = answerFraction;
		} else {
			const getGcd = mathUtils.getGcd;

			// Erzeugt einen vollständig gekürzten Bruch.
			// Zähler darf 1 sein, Nenner liegt bewusst bei 2..9.
			const makeCoprimeFraction = (minNum = 2, maxNum = 10, minDen = 2, maxDen = 9, forbiddenDen = null, denominatorOptions = null) => {
				let num, den;
				do {
					num = rnd(minNum, maxNum) - 1;   // 1 ist explizit erlaubt
					den = denominatorOptions
						? denominatorOptions[randInt(0, denominatorOptions.length - 1)]
						: rnd(minDen, maxDen);
				} while (getGcd(num, den) !== 1 || den === forbiddenDen);
				return [num, den];
			};

			// Erster Bruch
			let [z1, n1] = makeCoprimeFraction();

			// In einem Teil der Aufgaben soll genau ein Bruch erweitert werden.
			// Dafür wird der zweite Nenner bevorzugt als Teiler oder Vielfaches
			// des ersten Nenners gewählt. Das ergibt eine deutlich sichtbare,
			// aber weiterhin abwechslungsreiche Quote von ungefähr einem Drittel.
			const relatedDenominators = [];
			for (let denominator = 2; denominator <= 9; denominator++) {
				if (denominator !== n1 && (denominator % n1 === 0 || n1 % denominator === 0)) {
					relatedDenominators.push(denominator);
				}
			}
			const useRelatedDenominator = relatedDenominators.length > 0 && Math.random() < 0.4;

			// Zweiter Bruch: ebenfalls teilerfremd, aber mit verschiedenem Nenner
			let [z2, n2] = useRelatedDenominator
				? makeCoprimeFraction(1, 9, 2, 9, n1, relatedDenominators)
				: makeCoprimeFraction(1, 9, 2, 9, n1);

			const isAdd = Math.random() > 0.5;

			// Bei Subtraktion sicherstellen, dass das Ergebnis positiv bleibt
			if (!isAdd && (z1 * n2 <= z2 * n1)) {
				[z1, z2] = [z2, z1];
				[n1, n2] = [n2, n1];
			}

			// Hauptnenner
			const hn = (n1 * n2) / getGcd(n1, n2);

			const f1 = hn / n1;
			const f2 = hn / n2;

			const ez1 = z1 * f1;
			const ez2 = z2 * f2;

			const op = isAdd ? '+' : '-';
			const finalZ = isAdd ? ez1 + ez2 : ez1 - ez2;

			textDisplay = `Berechne: \\( \\quad \\dfrac{${z1}}{${n1}} ${op} \\dfrac{${z2}}{${n2}} = \\)`;

			// Dynamischer Lösungsweg
			let step1 = "";
			if (f1 > 1 && f2 > 1) {
				step1 = `\\frac{${z1} \\cdot ${f1} ${op} ${z2} \\cdot ${f2}}{${n1} \\cdot ${f1}} = \\frac{${ez1} ${op} ${ez2}}{${hn}}`;
			} else if (f1 > 1) {
				step1 = `\\frac{${z1} \\cdot ${f1}}{${n1} \\cdot ${f1}} ${op} \\frac{${z2}}{${n2}} = \\frac{${ez1} ${op} ${ez2}}{${hn}}`;
			} else if (f2 > 1) {
				step1 = `\\frac{${z1}}{${n1}} ${op} \\frac{${z2} \\cdot ${f2}}{${n2} \\cdot ${f2}} = \\frac{${ez1} ${op} ${ez2}}{${hn}}`;
			} 
			s = `\\[ \\frac{${z1}}{${n1}} ${op} \\frac{${z2}}{${n2}} = ${step1} = \\frac{${finalZ}}{${hn}} \\]`;
		}
		break;
	}
	case 'brueche_multiplizieren_dividieren': {
		if (isQuizMode) {
			let Z1, N1, Z2, N2, isMult;

			const getGcd = mathUtils.getGcd;
			const useNaturalNumberVariant = Math.random() < 0.30;

			if (useNaturalNumberVariant) {
				let n;
				isMult = Math.random() > 0.5;
				let resultZ;
				let resultN;

				do {
					Z1 = rnd(2, 9);
					N1 = rnd(2, 9);
					n = rnd(2, 9);

					resultZ = isMult ? Z1 * n : Z1;
					resultN = isMult ? N1 : N1 * n;
				} while (
					getGcd(Z1, N1) > 1 ||
					getGcd(N1, n) > 1 ||
					getGcd(Z1, n) > 1 ||
					getGcd(resultZ, resultN) > 1
				);

				const op = isMult ? '\\cdot' : ':';
				const resZ = resultZ;
				const resN = resultN;
				const step1 = isMult
					? `\\frac{${Z1}}{${N1}} \\cdot \\frac{${n}}{1}`
					: `\\frac{${Z1}}{${N1}} \\cdot \\frac{1}{${n}}`;

				textDisplay = `Berechne: \\( \\quad \\dfrac{${Z1}}{${N1}} ${op} ${n} = \\)`;
				s = `\\[ \\frac{${Z1}}{${N1}} ${op} ${n} = ${step1} = \\frac{${resZ}}{${resN}} \\]`;
				answer = fractionAnswer(resZ, resN, false);
				break;
			}

			isMult = Math.random() > 0.5;
			let finalZ;
			let finalN;

			do {
				Z1 = rnd(2, 9);
				N1 = rnd(2, 9);
				Z2 = rnd(2, 9);
				N2 = rnd(2, 9);

				finalZ = isMult ? Z1 * Z2 : Z1 * N2;
				finalN = isMult ? N1 * N2 : N1 * Z2;
			} while (
				new Set([Z1, N1, Z2, N2]).size < 4 ||
				getGcd(Z1, N1) > 1 ||
				getGcd(Z2, N2) > 1 ||
				getGcd(finalZ, finalN) > 1
			);

			const op = isMult ? '\\cdot' : ':';
			const step1 = isMult ? '' : `\\frac{${Z1}}{${N1}} \\cdot \\frac{${N2}}{${Z2}} = `;

			textDisplay = `Berechne: \\( \\quad \\dfrac{${Z1}}{${N1}} ${op} \\dfrac{${Z2}}{${N2}} = \\)`;
			s = `\\[ \\frac{${Z1}}{${N1}} ${op} \\frac{${Z2}}{${N2}} = ${step1} \\frac{${finalZ}}{${finalN}} \\]`;
			answer = fractionAnswer(finalZ, finalN, false);
		} else {
			let Z1, N1, Z2, N2, z1_base, n1_base, z2_base, n2_base, isMult;

			const getGcd = mathUtils.getGcd;
			const useNaturalNumberVariant = Math.random() < 0.30;

			if (useNaturalNumberVariant) {
				let n;
				isMult = Math.random() > 0.5;
				let resultZ;
				let resultN;

				do {
					Z1 = rnd(2, 12);
					N1 = rnd(2, 12);
					n = rnd(2, 10);
					
					resultZ = isMult ? Z1 * n : Z1;
					resultN = isMult ? N1 : N1 * n;
				} while (
					getGcd(Z1, N1) > 1 ||
					getGcd(N1, n) > 1 ||
					getGcd(Z1, n) > 1 ||
					getGcd(resultZ, resultN) > 1
				);

				const op = isMult ? '\\cdot' : ':';
				const resZ = resultZ;
				const resN = resultN;
				const step1 = isMult
					? `\\frac{${Z1}}{${N1}} \\cdot \\frac{${n}}{1}`
					: `\\frac{${Z1}}{${N1}} \\cdot \\frac{1}{${n}}`;

				textDisplay = `Berechne: \\( \\quad \\dfrac{${Z1}}{${N1}} ${op} ${n} = \\)`;
				s = `\\[ \\frac{${Z1}}{${N1}} ${op} ${n} = ${step1} = \\frac{${resZ}}{${resN}} \\]`;
				
			} else {
				do {
					isMult = Math.random() > 0.5;

					// 1. Erzeuge zwei Brüche, die in sich NICHT kürzbar sind
					let ta1 = rnd(6, 27), tb1 = rnd(6, 27);
					while (getGcd(ta1, tb1) > 1) { ta1 = rnd(6, 27); tb1 = rnd(6, 27); }

					let ta2 = rnd(6, 27), tb2 = rnd(6, 27);
					while (getGcd(ta2, tb2) > 1 || (ta1 == ta2 && tb1 == tb2)) { ta2 = rnd(6, 27); tb2 = rnd(6, 27); }

					// Zuweisung der "großen" Zahlen
					Z1 = ta1; N1 = tb1; Z2 = ta2; N2 = tb2;

					// 2. Bestimme die Kürzungs-Partner basierend auf der Operation
					// Bei Mult: Z1 mit N2 und N1 mit Z2
					// Bei Div:  Z1 mit Z2 und N1 mit N2 (wegen Kehrwert)
					let g1 = isMult ? getGcd(Z1, N2) : getGcd(Z1, Z2);
					let g2 = isMult ? getGcd(N1, Z2) : getGcd(N1, N2);

					// BEDINGUNGEN:
					// - g1 und g2 müssen > 1 sein (es MUSS über Kreuz kürzbar sein)
					// - Alle 4 Zahlen verschieden
					if (g1 > 1 && g2 > 1 && new Set([Z1, N1, Z2, N2]).size === 4) {
						// Berechne die Werte für den "midStep" (die gekürzten Zahlen)
						z1_base = Z1 / g1;
						n2_base = isMult ? N2 / g1 : Z2 / g1;
						n1_base = N1 / g2;
						z2_base = isMult ? Z2 / g2 : N2 / g2;
						break;
					}
				} while (true);

				const op = isMult ? '\\cdot' : ':';
				const resZ = z1_base * z2_base;
				const resN = n1_base * n2_base;

				// Kehrwert-Schritt (nur bei Division)
				let stepKehrwert = "";
				if (!isMult) {
					stepKehrwert = `\\frac{${Z1}}{${N1}} \\cdot \\frac{${N2}}{${Z2}} = `;
				}

				// MidStep nutzt die gekürzten Werte
				const midStep = `\\frac{${z1_base}}{${n1_base}} \\cdot \\frac{${z2_base}}{${n2_base}}`;

				textDisplay = `Berechne: \\( \\quad \\dfrac{${Z1}}{${N1}} ${op} \\dfrac{${Z2}}{${N2}} = \\)`;
				s = `\\[ \\frac{${Z1}}{${N1}} ${op} \\frac{${Z2}}{${N2}} = ${stepKehrwert}${midStep} = \\frac{${resZ}}{${resN}} \\]`;				
			}
			
		}
		break;
	}
	case 'brueche_kuerzen': {
		if (isQuizMode) {
			const factors = [3, 4, 6, 8, 9, 12, 15, 20, 25];

			const getGcd = mathUtils.getGcd;
			const getPrimeFactors = mathUtils.getPrimeFactors;

			const k = factors[Math.floor(Math.random() * factors.length)];
			const pFactors = getPrimeFactors(k);

			let z_base, n_base, Z, N;

			do {
				z_base = rnd(2, 12);
				n_base = rnd(2, 12);
				Z = z_base * k;
				N = n_base * k;
			} while (Z === N || getGcd(z_base, n_base) > 1 || Z % N === 0 || N % Z === 0);

			textDisplay = `Kürze vollständig: \\( \\quad\\dfrac{${Z}}{${N}} = \\)`;
			answer = fractionAnswer(z_base, n_base, true);

			// Lösungsweg mit \underset unter dem Gleichheitszeichen
			let solutionSteps = `\\frac{${Z}}{${N}}`;
			let currentZ = Z;
			let currentN = N;

			pFactors.forEach(p => {
				currentZ /= p;
				currentN /= p;
				// Hier wird die Zahl p unter das Gleichheitszeichen gesetzt
				solutionSteps += ` \\underset{${p}}{=} \\frac{${currentZ}}{${currentN}}`;
			});

			s = `\\[ ${solutionSteps} \\]`;

		} else {
			const factors = [3, 4, 5, 6, 8, 9, 12, 15, 18, 20, 25];

			const getGcd = mathUtils.getGcd;
			const getPrimeFactors = mathUtils.getPrimeFactors;

			const k = factors[Math.floor(Math.random() * factors.length)];
			const pFactors = getPrimeFactors(k);

			let z_base, n_base, Z, N;

			do {
				z_base = rnd(2, 12);
				n_base = rnd(2, 12);
				Z = z_base * k;
				N = n_base * k;
			} while (Z === N || getGcd(z_base, n_base) > 1 || Z % N === 0 || N % Z === 0);

			textDisplay = `kürze vollständig: \\( \\quad\\dfrac{${Z}}{${N}} = \\)`;

			// Lösungsweg mit \underset unter dem Gleichheitszeichen
			let solutionSteps = `\\frac{${Z}}{${N}}`;
			let currentZ = Z;
			let currentN = N;

			pFactors.forEach(p => {
				currentZ /= p;
				currentN /= p;
				// Hier wird die Zahl p unter das Gleichheitszeichen gesetzt
				solutionSteps += ` \\underset{${p}}{=} \\frac{${currentZ}}{${currentN}}`;
			});

			s = `\\[ ${solutionSteps} \\]`;

		}
		break;
	}
	case 'brueche_ordnen': {
		if (isQuizMode) {
			const getGcd = mathUtils.getGcd;

			const mainDenominators = [12, 15, 18, 20, 24, 30, 36];

			const hn = mainDenominators[randInt(0, mainDenominators.length - 1)];

			const buildCloseExtendedSet = () => {
				const useImproper = Math.random() < 0.35;
				const maxImproperDelta = Math.max(1, Math.floor(hn * 0.10));

				let extNums;
				if (useImproper) {
					const improper = hn + randInt(1, maxImproperDelta);
					const properHigh = hn - randInt(1, 3);
					const properLow = properHigh - randInt(1, 2);
					extNums = [properLow, properHigh, improper];
				} else {
					const high = hn - randInt(1, 3);
					const mid = high - randInt(1, 2);
					const low = mid - randInt(1, 2);
					extNums = [low, mid, high];
				}

				extNums = extNums.map(value => Math.max(1, value));
				if (new Set(extNums).size !== 3) return null;
				if (Math.max(...extNums) - Math.min(...extNums) > 4) return null;

				return extNums;
			};

			const toReducedFraction = extNum => {
				const g = getGcd(extNum, hn);
				return [extNum / g, hn / g];
			};

			let fracs = null;
			let retries = 0;
			do {
				const extNums = buildCloseExtendedSet();
				if (!extNums) {
					retries += 1;
					continue;
				}

				const candidateFracs = extNums.map(extNum => ({
					orig: toReducedFraction(extNum),
					ext: extNum
				}));

				const uniqueFracCount = new Set(candidateFracs.map(f => `${f.orig[0]}/${f.orig[1]}`)).size;
				const denominatorVariety = new Set(candidateFracs.map(f => f.orig[1])).size;
				const improperFractions = candidateFracs.filter(f => f.orig[0] > f.orig[1]);
				const improperNearOne = improperFractions.every(f => (f.orig[0] / f.orig[1]) <= 1.15);

				if (
					uniqueFracCount === 3 &&
					denominatorVariety >= 2 &&
					improperFractions.length <= 1 &&
					improperNearOne
				) {
					fracs = candidateFracs;
				}

				retries += 1;
			} while (!fracs && retries < 120);

			if (!fracs) {
				const fallbackExt = [hn - 3, hn - 2, hn - 1];
				fracs = fallbackExt.map(extNum => ({
					orig: toReducedFraction(extNum),
					ext: extNum
				}));
			}

			// Zufällig mischen für die Aufgabenstellung
			const displayOrder = fisherYatesShuffle(fracs);
			// Aufsteigend sortiert für die Lösung
			const sortedAsc = [...fracs].sort((a, b) => a.ext - b.ext);
			const smallest = sortedAsc[0];

			const fmtFrac = ([n, d]) => `\\dfrac{${n}}{${d}}`;

			// Aufgabe: Brüche in zufälliger Reihenfolge, Lücken zum Eintragen
			const displayStr = displayOrder.map(f => fmtFrac(f.orig)).join(' \\quad ');

			// Nur der kleinste Bruch wird als Antwort bewertet.
			const exactSmallest = smallest.orig;
			const exactAnswer = { kind: 'fraction', num: exactSmallest[0], den: exactSmallest[1], exact: true };
			answer = exactAnswer;

			// Erweiterungsschritt in der Reihenfolge der Aufgabenstellung.
			const extStep = displayOrder.map(f => {
				const factor = hn / f.orig[1];
				if (factor === 1) return fmtFrac(f.orig);
				return `${fmtFrac(f.orig)} \\overset{${factor}}{=} \\dfrac{${f.ext}}{${hn}}`;
			}).join(' \\quad ');

			// Sortierte Lösung wie im allgemeinen Generator.
			const sortedStr = sortedAsc.map(f => fmtFrac(f.orig)).join(' < ');

			textDisplay = `Welcher Bruch ist am kleinsten? \\( \\quad ${displayStr} \\)`;
			s = `\\[ ${sortedStr} \\quad \\left(${extStep}\\right) \\]`;
		} else {
			const getGcd = mathUtils.getGcd;

			const mainDenominators = [12, 15, 18, 20, 24, 30, 36, 40, 60];

			const hn = mainDenominators[randInt(0, mainDenominators.length - 1)];

			const buildCloseExtendedSet = () => {
				const useImproper = Math.random() < 0.35;
				const maxImproperDelta = Math.max(1, Math.floor(hn * 0.10));

				let extNums;
				if (useImproper) {
					const improper = hn + randInt(1, maxImproperDelta);
					const properHigh = hn - randInt(1, 3);
					const properLow = properHigh - randInt(1, 2);
					extNums = [properLow, properHigh, improper];
				} else {
					const high = hn - randInt(1, 3);
					const mid = high - randInt(1, 2);
					const low = mid - randInt(1, 2);
					extNums = [low, mid, high];
				}

				extNums = extNums.map(value => Math.max(1, value));
				if (new Set(extNums).size !== 3) return null;
				if (Math.max(...extNums) - Math.min(...extNums) > 4) return null;

				return extNums;
			};

			const toReducedFraction = extNum => {
				const g = getGcd(extNum, hn);
				return [extNum / g, hn / g];
			};

			let fracs = null;
			let retries = 0;
			do {
				const extNums = buildCloseExtendedSet();
				if (!extNums) {
					retries += 1;
					continue;
				}

				const candidateFracs = extNums.map(extNum => ({
					orig: toReducedFraction(extNum),
					ext: extNum
				}));

				const uniqueFracCount = new Set(candidateFracs.map(f => `${f.orig[0]}/${f.orig[1]}`)).size;
				const denominatorVariety = new Set(candidateFracs.map(f => f.orig[1])).size;
				const improperFractions = candidateFracs.filter(f => f.orig[0] > f.orig[1]);
				const improperNearOne = improperFractions.every(f => (f.orig[0] / f.orig[1]) <= 1.15);

				if (
					uniqueFracCount === 3 &&
					denominatorVariety >= 2 &&
					improperFractions.length <= 1 &&
					improperNearOne
				) {
					fracs = candidateFracs;
				}

				retries += 1;
			} while (!fracs && retries < 120);

			if (!fracs) {
				const fallbackExt = [hn - 3, hn - 2, hn - 1];
				fracs = fallbackExt.map(extNum => ({
					orig: toReducedFraction(extNum),
					ext: extNum
				}));
			}

			// Zufällig mischen für die Aufgabenstellung
			const displayOrder = fisherYatesShuffle(fracs);
			// Aufsteigend sortiert für die Lösung
			const sortedAsc = [...fracs].sort((a, b) => a.ext - b.ext);

			const fmtFrac = ([n, d]) => `\\dfrac{${n}}{${d}}`;

			// Aufgabe: Brüche in zufälliger Reihenfolge, Lücken zum Eintragen
			const displayStr = displayOrder.map(f => fmtFrac(f.orig)).join(' \\quad ');

			// Erweiterungsschritt für jeden Bruch
			const extStep = displayOrder.map(f => {
				const factor = hn / f.orig[1];
				if (factor === 1) return `\\dfrac{${f.orig[0]}}{${f.orig[1]}}`;
				return `\\dfrac{${f.orig[0]}}{${f.orig[1]}} \\overset{${factor}}{=} \\dfrac{${f.ext}}{${hn}}`;
			}).join(' \\quad ');

			// Sortierte Lösung
			const sortedStr = sortedAsc.map(f => fmtFrac(f.orig)).join(' < ');

			textDisplay = `Ordne von klein nach groß: \\( \\quad ${displayStr} \\)`;
			s = `\\[ ${sortedStr} \\quad \\left(${extStep}\\right) \\]`;
		}
		break;
	}
	case 'brueche_umwandeln': {
		if (isQuizMode) {
			// Hilfsfunktionen für diesen Case
			const getGcd = mathUtils.getGcd;

			// Ermittelt den passenden Zehnerpotenz-Nenner (10 oder 100)
			const getP10 = (n) => (10 % n === 0) ? 10 : 100;

			// Erlaubte Nenner (garantieren saubere Zehnerpotenzen ohne Periode)

			let allowedDenoms = [2, 4, 5, 20, 25, 50];

			// Alle 9 expliziten Umwandlungspfade
			const paths = [
				'frac_to_dec', 'dec_to_frac',
				'frac_to_perc', 'perc_to_frac',
				'mixed_to_frac',
				'dec_to_perc', 'perc_to_dec'
			];

			// Zufälligen Pfad auswählen
			let path = paths[Math.floor(Math.random() * paths.length)];
			switch (path) {
				// ---------------------------------------------------------
				// 1. Bruch <> Dezimalbruch
				// ---------------------------------------------------------
				case 'frac_to_dec': {
					let n, z, maxZ;
					let isTooEasy = true;

					// Gesamte Wahl von n und z wiederholen, wenn es "zu oft" 1/2 ist
					while (isTooEasy) {
						n = allowedDenoms[Math.floor(Math.random() * allowedDenoms.length)];
						maxZ = n * 2;

						// Zähler teilerfremd zu n würfeln
						do {
							z = randInt(1, maxZ);
						} while (getGcd(z, n) !== 1);

						// Veto-Check: Wenn der Bruch 1/2 ist, würfle mit 75% Chance neu
						if (z === 1 && n === 2) {
							if (Math.random() > 0.25) continue; // 75% Wahrscheinlichkeit für Neustart
						}

						isTooEasy = false; // Wir haben einen akzeptablen Bruch gefunden
					}

					let p10 = getP10(n);
					let mult = p10 / n;
					let decStr = formatDecimal(z / n, 4);
					const convertedValue = z / n;

					textDisplay = `als Dezimalbruch: \\( \\quad \\dfrac{${z}}{${n}} = \\)`;

					if (n === p10) {
						s = `\\[ \\frac{${z}}{${n}} = ${decStr} \\]`;
					} else {
						s = `\\[ \\frac{${z}}{${n}} \\overset{${mult}}{=} \\frac{${z * mult}}{${p10}} = ${decStr} \\]`;
					}
					answer = numericAnswer(convertedValue);
					break;
				}

				case 'dec_to_frac': {
					let n, z;
					let isTooEasy = true;

					// 1. Exakt gleiche Generierungs-Logik wie bei frac_to_dec
					while (isTooEasy) {
						n = allowedDenoms[Math.floor(Math.random() * allowedDenoms.length)];
						let maxZ = n * 2;

						let attempts = 0;
						do {
							z = randInt(1, maxZ);
							attempts++;
							if (attempts > 50) { z = 1; break; }
						} while (getGcd(z, n) !== 1);

						// Veto-Check für 1/2
						if (z === 1 && n === 2) {
							if (Math.random() > 0.25) continue;
						}

						isTooEasy = false;
					}

					// 2. Werte für den Dezimalbruch und den Zwischenschritt berechnen
					let p10 = getP10(n);
					let mult = p10 / n; // Das ist jetzt unser Kürzungsfaktor
					let decStr = formatDecimal(z / n, 4);

					// Der Zähler des ungekürzten Zehnerbruchs (z. B. 35 bei 0,35)
					let z_p10 = z * mult;

					// 3. Aufgabenstellung
					textDisplay = `als max. gekürzter gem. Bruch: \\( \\quad ${decStr} = \\)`;

					// 4. Lösungsweg (Rückwärts: Dezimal -> Zehnerbruch -> Kürzen -> Ergebnis)
					if (n === p10) {
						// Fall: Nenner ist bereits 10 oder 100, es muss nicht gekürzt werden (z. B. 0,7 = 7/10)
						s = `\\[ ${decStr} = \\frac{${z}}{${n}} \\]`;
					} else {
						// Fall: Bruch muss gekürzt werden. Wir zeigen den Kürzungsfaktor explizit (z. B. : 5)
						s = `\\[ ${decStr} = \\frac{${z_p10}}{${p10}} \\underset{${mult}}{=} \\frac{${z}}{${n}} \\]`;
					}
					answer = fractionAnswer(z, n, true);
					break;
				}

				// ---------------------------------------------------------
				// 2. Bruch <> Prozent
				// ---------------------------------------------------------
				case 'frac_to_perc': {
					let n, z;
					let isTooEasy = true;

					while (isTooEasy) {
						n = allowedDenoms[Math.floor(Math.random() * allowedDenoms.length)];

						let maxZ = 2 * n - 1;

						let attempts = 0;
						do {
							z = randInt(1, maxZ);
							attempts++;
							// Sicherheitsnetz: Falls z.B. n=2, ist maxZ=1. Es gibt nur z=1.
							if (attempts > 50) { z = 1; break; }
						} while (getGcd(z, n) !== 1);

						// Veto-Check für 1/2 (kommt sonst bei n=2 zu 100% vor)
						if (z === 1 && n === 2) {
							if (Math.random() > 0.25) continue; // 75% Chance für Neustart
						}

						// Optionaler didaktischer Veto-Check für 1/10 (oft etwas zu leicht)
						if (z === 1 && n === 10) {
							if (Math.random() > 0.5) continue; // 50% Chance für Neustart
						}

						isTooEasy = false;
					}

					// Bei Prozent ist das Ziel für das Erweitern immer 100
					let p10 = 100;
					let mult = p10 / n; // Erweiterungsfaktor
					const percentageValue = z * mult;

					// Da wir auf 100 erweitern, ist der neue Zähler direkt die Prozentzahl
					let percStr = percentageValue.toString() + '\\,\\%';

					textDisplay = `in Prozent: \\( \\quad \\dfrac{${z}}{${n}} = \\)`;
					s = `\\[ \\frac{${z}}{${n}} \\overset{${mult}}{=} \\frac{${z * mult}}{100} = ${percStr} \\]`;
					answer = numericAnswer(percentageValue);

					break;
				}
				case 'perc_to_frac': {
					// 1. Spezialfälle: 100% und 200% (Wahrscheinlichkeit hier auf 10% = 0.1 eingestellt)
					const probSpecial = 0.3; // 30% Chance, in die Spezialfall-Logik zu gehen (kann angepasst werden)

					if (Math.random() < probSpecial) {
						// Mit 50/50 Chance entweder 100% oder 200% wählen
						let is200 = Math.random() < 0.5;
						let percVal = is200 ? 200 : 100;
						let resultVal = is200 ? 2 : 1; // Das gekürzte Ergebnis als ganze Zahl

						textDisplay = `als max. gekürzter gem. Bruch: \\( \\quad ${percVal}\\,\\% = \\)`;
						s = `\\[ ${percVal}\\,\\% = \\frac{${percVal}}{100} = ${resultVal} \\]`;
						answer = numericAnswer(resultVal);

						// Hinweis: Wenn dein System zwingend eine Bruch-Schreibweise als Lösung erwartet, 
						// müsstest du resultVal auf "2/1" bzw. "1/1" ändern.
						break;
					}

					// 2. Normale Generierung
					let n, z;
					let isTooEasy = true;

					while (isTooEasy) {
						n = allowedDenoms[Math.floor(Math.random() * allowedDenoms.length)];

						// Da bis zu 200% erlaubt sind, darf der Zähler doppelt so groß wie der Nenner werden
						let maxZ = n * 2;

						let attempts = 0;
						do {
							z = randInt(1, maxZ);
							attempts++;
							if (attempts > 50) { z = 1; break; }
						} while (getGcd(z, n) !== 1);

						// Veto-Checks für zu häufige/einfache Aufgaben
						if (z === 1 && n === 2) { // 50 %
							if (Math.random() > 0.25) continue; // 75% Chance für Neustart
						}
						if (z === 1 && n === 10) { // 10 %
							if (Math.random() > 0.5) continue; // 50% Chance für Neustart
						}
						// Verhindert, dass regulär nochmal 100% oder 200% generiert werden (sind ja schon im Spezialfall)
						if (z === n || z === n * 2) {
							continue;
						}

						isTooEasy = false;
					}

					// 3. Werte berechnen
					let p10 = 100;
					let mult = p10 / n; // Das ist der Kürzungsfaktor für den Lösungsweg

					// Die Prozentzahl berechnet sich aus Zähler mal Erweiterungsfaktor
					let percVal = z * mult;
					let percStr = percVal.toString() + '\\,\\%';

					// 4. Strings für Aufgabe und Lösung bauen
					textDisplay = `als max. gekürzter gem. Bruch: \\( \\quad ${percStr} = \\)`;

					if (n === p10) {
						s = `\\[ ${percStr} = \\frac{${z}}{100} \\]`;
					} else {
						// Didaktischer Lösungsweg: Start bei /100, dann explizit durch den Kürzungsfaktor teilen
						s = `\\[ ${percStr} = \\frac{${percVal}}{100} \\underset{${mult}}{=} \\frac{${z}}{${n}} \\]`;
					}
					answer = fractionAnswer(z, n, true);
					break;
				}

				// ---------------------------------------------------------
				// 3. Bruch <> Gemischte Schreibweise
				// ---------------------------------------------------------

				case 'mixed_to_frac': {
					let n = allowedDenoms[Math.floor(Math.random() * allowedDenoms.length)];
					let w = Math.floor(Math.random() * 3) + 2;
					let rem = Math.floor(Math.random() * (n - 1)) + 1;
					let z = w * n + rem;
					let g = getGcd(z, n); z /= g; n /= g;

					let w_simp = Math.floor(z / n);
					let rem_simp = z % n;

					textDisplay = `als gemeiner Bruch: \\( ${w_simp} \\dfrac{${rem_simp}}{${n}} = \\)`;
					s = `\\[ ${w_simp} \\frac{${rem_simp}}{${n}} = \\frac{${w_simp * n}}{${n}} + \\frac{${rem_simp}}{${n}} = \\frac{${z}}{${n}} \\]`;
					answer = fractionAnswer(z, n, false);
					break;
				}

				// ---------------------------------------------------------
				// 4. Dezimalbruch <> Prozent (Spezialfall)
				// ---------------------------------------------------------
				case 'dec_to_perc': {
					let p = (Math.floor(Math.random() * 400) + 1) / 2; // Schritte von 0,5%
					let decStr = formatDecimal(p / 100, 4);
					let percStr = p.toString().replace('.', ',') + '\\,\\%';

					textDisplay = ` in Prozent: \\( \\quad ${decStr} = \\)`;
					s = `\\( ${decStr} = ${percStr} \\)`;
					answer = numericAnswer(p);
					break;
				}
				case 'perc_to_dec': {
					let p = (Math.floor(Math.random() * 400) + 1) / 2;
					let decStr = formatDecimal(p / 100, 4);
					let percStr = p.toString().replace('.', ',') + '\\,\\%';

					textDisplay = `als Dezimalbruch: \\( \\quad ${percStr} = \\)`;
					s = `\\( ${percStr} = ${decStr} \\)`;
					answer = numericAnswer(p / 100);
					break;
				}
			}
		} else {
			// Hilfsfunktionen für diesen Case
			const getGcd = mathUtils.getGcd;

			// Ermittelt den passenden Zehnerpotenz-Nenner (10 oder 100)
			const getP10 = (n) => (10 % n === 0) ? 10 : 100;

			// Erlaubte Nenner (garantieren saubere Zehnerpotenzen ohne Periode)

			let allowedDenoms = [2, 4, 5, 20, 25, 50];

			// Alle 10 expliziten Umwandlungspfade
			const paths = [
				'frac_to_dec', 'dec_to_frac',
				'frac_to_perc', 'perc_to_frac',
				'frac_to_mixed', 'mixed_to_frac',
				'dec_to_perc', 'perc_to_dec'
			];

			// Zufälligen Pfad auswählen
			let path = paths[Math.floor(Math.random() * paths.length)];
			switch (path) {
				// ---------------------------------------------------------
				// 1. Bruch <> Dezimalbruch
				// ---------------------------------------------------------
				case 'frac_to_dec': {
					let n, z, maxZ;
					let isTooEasy = true;

					// Gesamte Wahl von n und z wiederholen, wenn es "zu oft" 1/2 ist
					while (isTooEasy) {
						n = allowedDenoms[Math.floor(Math.random() * allowedDenoms.length)];
						maxZ = n * 3;

						// Zähler teilerfremd zu n würfeln
						do {
							z = randInt(1, maxZ);
						} while (getGcd(z, n) !== 1);

						// Veto-Check: Wenn der Bruch 1/2 ist, würfle mit 75% Chance neu
						if (z === 1 && n === 2) {
							if (Math.random() > 0.25) continue; // 75% Wahrscheinlichkeit für Neustart
						}

						isTooEasy = false; // Wir haben einen akzeptablen Bruch gefunden
					}

					let p10 = getP10(n);
					let mult = p10 / n;
					let decStr = formatDecimal(z / n, 4);

					textDisplay = `als Dezimalbruch: \\( \\quad \\dfrac{${z}}{${n}} = \\)`;

					if (n === p10) {
						s = `\\[ \\frac{${z}}{${n}} = ${decStr} \\]`;
					} else {
						s = `\\[ \\frac{${z}}{${n}} \\overset{${mult}}{=} \\frac{${z * mult}}{${p10}} = ${decStr} \\]`;
					}
					break;
				}

				case 'dec_to_frac': {
					let n, z;
					let isTooEasy = true;

					// 1. Exakt gleiche Generierungs-Logik wie bei frac_to_dec
					while (isTooEasy) {
						n = allowedDenoms[Math.floor(Math.random() * allowedDenoms.length)];
						let maxZ = n * 3;

						let attempts = 0;
						do {
							z = randInt(1, maxZ);
							attempts++;
							if (attempts > 50) { z = 1; break; }
						} while (getGcd(z, n) !== 1);

						// Veto-Check für 1/2
						if (z === 1 && n === 2) {
							if (Math.random() > 0.25) continue;
						}

						isTooEasy = false;
					}

					// 2. Werte für den Dezimalbruch und den Zwischenschritt berechnen
					let p10 = getP10(n);
					let mult = p10 / n; // Das ist jetzt unser Kürzungsfaktor
					let decStr = formatDecimal(z / n, 4);

					// Der Zähler des ungekürzten Zehnerbruchs (z. B. 35 bei 0,35)
					let z_p10 = z * mult;

					// 3. Aufgabenstellung
					textDisplay = `als max. gekürzter gem. Bruch: \\( \\quad ${decStr} = \\)`;

					// 4. Lösungsweg (Rückwärts: Dezimal -> Zehnerbruch -> Kürzen -> Ergebnis)
					if (n === p10) {
						// Fall: Nenner ist bereits 10 oder 100, es muss nicht gekürzt werden (z. B. 0,7 = 7/10)
						s = `\\[ ${decStr} = \\frac{${z}}{${n}} \\]`;
					} else {
						// Fall: Bruch muss gekürzt werden. Wir zeigen den Kürzungsfaktor explizit (z. B. : 5)
						s = `\\[ ${decStr} = \\frac{${z_p10}}{${p10}} \\underset{${mult}}{=} \\frac{${z}}{${n}} \\]`;
					}
					break;
				}

				// ---------------------------------------------------------
				// 2. Bruch <> Prozent
				// ---------------------------------------------------------
				case 'frac_to_perc': {
					let n, z;
					let isTooEasy = true;

					while (isTooEasy) {
						n = allowedDenoms[Math.floor(Math.random() * allowedDenoms.length)];

						let maxZ = 2 * n - 1;

						let attempts = 0;
						do {
							z = randInt(1, maxZ);
							attempts++;
							// Sicherheitsnetz: Falls z.B. n=2, ist maxZ=1. Es gibt nur z=1.
							if (attempts > 50) { z = 1; break; }
						} while (getGcd(z, n) !== 1);

						// Veto-Check für 1/2 (kommt sonst bei n=2 zu 100% vor)
						if (z === 1 && n === 2) {
							if (Math.random() > 0.25) continue; // 75% Chance für Neustart
						}

						// Optionaler didaktischer Veto-Check für 1/10 (oft etwas zu leicht)
						if (z === 1 && n === 10) {
							if (Math.random() > 0.5) continue; // 50% Chance für Neustart
						}

						isTooEasy = false;
					}

					// Bei Prozent ist das Ziel für das Erweitern immer 100
					let p10 = 100;
					let mult = p10 / n; // Erweiterungsfaktor

					// Da wir auf 100 erweitern, ist der neue Zähler direkt die Prozentzahl
					let percStr = (z * mult).toString() + '\\,\\%';

					textDisplay = `in Prozent: \\( \\quad \\dfrac{${z}}{${n}} = \\)`;
					s = `\\[ \\frac{${z}}{${n}} \\overset{${mult}}{=} \\frac{${z * mult}}{100} = ${percStr} \\]`;

					break;
				}
				case 'perc_to_frac': {
					// 1. Spezialfälle: 100% und 200% (Wahrscheinlichkeit hier auf 10% = 0.1 eingestellt)
					const probSpecial = 0.3; // 30% Chance, in die Spezialfall-Logik zu gehen (kann angepasst werden)

					if (Math.random() < probSpecial) {
						// Mit 50/50 Chance entweder 100% oder 200% wählen
						let is200 = Math.random() < 0.5;
						let percVal = is200 ? 200 : 100;
						let resultVal = is200 ? 2 : 1; // Das gekürzte Ergebnis als ganze Zahl

						textDisplay = `als max. gekürzter gem. Bruch: \\( \\quad ${percVal}\\,\\% = \\)`;
						s = `\\[ ${percVal}\\,\\% = \\frac{${percVal}}{100} = ${resultVal} \\]`;

						// Hinweis: Wenn dein System zwingend eine Bruch-Schreibweise als Lösung erwartet, 
						// müsstest du resultVal auf "2/1" bzw. "1/1" ändern.
						break;
					}

					// 2. Normale Generierung
					let n, z;
					let isTooEasy = true;

					while (isTooEasy) {
						n = allowedDenoms[Math.floor(Math.random() * allowedDenoms.length)];

						// Da bis zu 200% erlaubt sind, darf der Zähler doppelt so groß wie der Nenner werden
						let maxZ = n * 2;

						let attempts = 0;
						do {
							z = randInt(1, maxZ);
							attempts++;
							if (attempts > 50) { z = 1; break; }
						} while (getGcd(z, n) !== 1);

						// Veto-Checks für zu häufige/einfache Aufgaben
						if (z === 1 && n === 2) { // 50 %
							if (Math.random() > 0.25) continue; // 75% Chance für Neustart
						}
						if (z === 1 && n === 10) { // 10 %
							if (Math.random() > 0.5) continue; // 50% Chance für Neustart
						}
						// Verhindert, dass regulär nochmal 100% oder 200% generiert werden (sind ja schon im Spezialfall)
						if (z === n || z === n * 2) {
							continue;
						}

						isTooEasy = false;
					}

					// 3. Werte berechnen
					let p10 = 100;
					let mult = p10 / n; // Das ist der Kürzungsfaktor für den Lösungsweg

					// Die Prozentzahl berechnet sich aus Zähler mal Erweiterungsfaktor
					let percVal = z * mult;
					let percStr = percVal.toString() + '\\,\\%';

					// 4. Strings für Aufgabe und Lösung bauen
					textDisplay = `als max. gekürzter gem. Bruch: \\( \\quad ${percStr} = \\)`;

					if (n === p10) {
						s = `\\[ ${percStr} = \\frac{${z}}{100} \\]`;
					} else {
						// Didaktischer Lösungsweg: Start bei /100, dann explizit durch den Kürzungsfaktor teilen
						s = `\\[ ${percStr} = \\frac{${percVal}}{100} \\underset{${mult}}{=} \\frac{${z}}{${n}} \\]`;
					}
					break;
				}

				// ---------------------------------------------------------
				// 3. Bruch <> Gemischte Schreibweise
				// ---------------------------------------------------------
				case 'frac_to_mixed': {
					let n = allowedDenoms[Math.floor(Math.random() * allowedDenoms.length)];
					let w = Math.floor(Math.random() * 3) + 2;
					let rem = Math.floor(Math.random() * (n - 1)) + 1;
					let z = w * n + rem; // Garantiert unechter Bruch (>1)
					let g = getGcd(z, n); z /= g; n /= g;

					let w_simp = Math.floor(z / n);
					let rem_simp = z % n;

					textDisplay = `in gemischter Schreibweise: \\( \\quad \\dfrac{${z}}{${n}} = \\)`;
					s = `\\[ \\frac{${z}}{${n}} = \\frac{${w_simp * n}}{${n}} + \\frac{${rem_simp}}{${n}} = ${w_simp} \\frac{${rem_simp}}{${n}} \\]`;
					break;
				}
				case 'mixed_to_frac': {
					let n = allowedDenoms[Math.floor(Math.random() * allowedDenoms.length)];
					let w = Math.floor(Math.random() * 3) + 2;
					let rem = Math.floor(Math.random() * (n - 1)) + 1;
					let z = w * n + rem;
					let g = getGcd(z, n); z /= g; n /= g;

					let w_simp = Math.floor(z / n);
					let rem_simp = z % n;

					textDisplay = `als gemeiner Bruch: \\( ${w_simp} \\dfrac{${rem_simp}}{${n}} = \\)`;
					s = `\\[ ${w_simp} \\frac{${rem_simp}}{${n}} = \\frac{${w_simp * n}}{${n}} + \\frac{${rem_simp}}{${n}} = \\frac{${z}}{${n}} \\]`;
					break;
				}

				// ---------------------------------------------------------
				// 4. Dezimalbruch <> Prozent (Spezialfall)
				// ---------------------------------------------------------
				case 'dec_to_perc': {
					let p = (Math.floor(Math.random() * 400) + 1) / 2; // Schritte von 0,5%
					let decStr = formatDecimal(p / 100, 4);
					let percStr = p.toString().replace('.', ',') + '\\,\\%';

					textDisplay = `in Prozent: \\( \\quad ${decStr} = \\)`;
					s = `\\( ${decStr} = ${percStr} \\)`;
					break;
				}
				case 'perc_to_dec': {
					let p = (Math.floor(Math.random() * 400) + 1) / 2;
					let decStr = formatDecimal(p / 100, 4);
					let percStr = p.toString().replace('.', ',') + '\\,\\%';

					textDisplay = `als Dezimalbruch: \\( \\quad ${percStr} = \\)`;
					s = `\\( ${percStr} = ${decStr} \\)`;
					break;
				}
			}
		}
		break;
	}
	case 'prozentrechnung': {
		let p;
		let pVal;
		let result;
		let answerUnit;
		let answerValue;
		let percentageConfig;
		switch (options?.mode) {
			case 'quiz':
				percentageConfig = {
					percentageOfBase: [3, 4, 5, 6, 7, 8, 9, 11, 12, 20, 25, 30, 35, 40, 60, 70, 80, 90],
					baseFromPercentage: [20, 25, 30, 40, 50, 60, 70, 80, 90],
					percentageFromValues: [2, 3, 5, 10, 20, 25, 50, 75, 80, 90],
					multiplierMin: 2,
					multiplierMax: 10
				};
				break;
			case 'calculator':
				percentageConfig = {
					percentageOfBase: [3, 4, 5, 6, 7, 8, 9, 11, 12, 15, 20, 25, 30, 35, 40, 60, 70, 80, 90, 95],
					baseFromPercentage: [20, 25, 30, 40, 50, 60, 70, 80, 90, 95],
					percentageFromValues: [2, 3, 4, 5, 7, 10, 12, 15, 20, 25, 40, 50, 75, 80, 90, 95],
					multiplierMin: 2,
					multiplierMax: 20
				};
				break;
			default:
				percentageConfig = {
					percentageOfBase: [3, 4, 5, 6, 7, 8, 9, 11, 12, 20, 25, 30, 35, 40, 60, 70, 80, 90],
					baseFromPercentage: [20, 25, 30, 40, 50, 60, 70, 80, 90],
					percentageFromValues: [2, 3, 5, 10, 15, 20, 25, 40, 50, 75, 80, 90, 95],
					multiplierMin: 2,
					multiplierMax: 12
				};
				break;
		}
		const einheit = ['€', 'm', 'kg', 't', 'g', 'm²', 'm³', 'ha', 's', 'h', 'l', 'cm', 'mm', 'km', 'dm'][randInt(0, 14)];
		rd = Math.random();

		if (rd > 0.5) {
			pVal = rnd(2, 11) * 100;
			p = percentageConfig.percentageOfBase[randInt(0, percentageConfig.percentageOfBase.length - 1)];
			result = (pVal / 100) * p;
			textDisplay = `${p} % von ${pVal} ${einheit} sind ${blank(3)}`;
			if (!isQuizMode) {
				textPrint = `Berechne mit dem Dreisatz: ${p} % von ${pVal} ${einheit} sind . . .<br>${buildEmptyRatioTable()}`;
			}
			s = formatUtils.buildSolutionTable([
				[`100 %`, `${comma(pVal)} ${einheit}`],
				[`1 %`, `${comma(pVal / 100)} ${einheit}`],
				[`${p} %`, `<b>${comma(result)} ${einheit}</b>`]
			]);
			answerValue = result;
			answerUnit = einheit;
		} else if (rd > 0.25) {
			p = percentageConfig.baseFromPercentage[randInt(0, percentageConfig.baseFromPercentage.length - 1)];
			pVal = rnd(2, 9) * p;
			result = (pVal / p) * 100;
			if (Math.random() < (isQuizMode ? 0.5 : 0.4)) {
				textDisplay = `${p} % sind ${pVal} ${einheit} von ${blank(3)}`;
				if (!isQuizMode) {
					textPrint = `Berechne mit dem Dreisatz: ${p} % sind ${pVal} ${einheit} von . . .<br>${buildEmptyRatioTable()}`;
				}
			} else {
				textDisplay = `${pVal} ${einheit} sind ${p} % von ${blank(3)}`;
				if (!isQuizMode) {
					textPrint = `Berechne mit dem Dreisatz: ${pVal} ${einheit} sind ${p} % von . . .<br>${buildEmptyRatioTable()}`;
				}
			}
			s = formatUtils.buildSolutionTable(isQuizMode
				? [
					[`${p} %`, `${comma(pVal)} ${einheit}`],
					[`1 %`, `${comma(pVal / p)} ${einheit}`],
					[`100 %`, `<b>${comma(result)} ${einheit}</b>`]
				]
				: [
					[`100 %`, `<b>${comma(result)} ${einheit}</b>`],
					[`1 %`, `${comma(pVal / p)} ${einheit}`],
					[`${p} %`, `${comma(pVal)} ${einheit}`]
				]);
			answerValue = result;
			answerUnit = einheit;
		} else {
			p = percentageConfig.percentageFromValues[randInt(0, percentageConfig.percentageFromValues.length - 1)];
			const multiplier = rnd(percentageConfig.multiplierMin, percentageConfig.multiplierMax);
			const percentageValue = p * multiplier;
			const baseValue = (percentageValue * 100) / p;
			result = p;

			textDisplay = `${comma(percentageValue)} ${einheit} von ${comma(baseValue)} ${einheit} sind ${blank(2)} % `;
			if (!isQuizMode) {
				textPrint = `Berechne mit dem Dreisatz: ${comma(percentageValue)} ${einheit} von ${comma(baseValue)} ${einheit} sind . . . %<br>${buildEmptyRatioTable()}`;
			}
			s = formatUtils.buildSolutionTable([
				[`100 %`, `${comma(baseValue)} ${einheit}`],
				[`1 %`, `${comma(baseValue / 100)} ${einheit}`],
				[`<b>${p} %</b>`, `${comma(percentageValue)} ${einheit}`]
			]);
			answerValue = result;
			answerUnit = '%';
		}

		if (isQuizMode) {
			answer = { kind: 'number', value: answerValue, unit: answerUnit };
		}
		break;
	}
	case 'prozentuale_veraenderung': {
		const einheit = ['€', 'm', 'kg', 't', 'g', 'm²', 'm³', 'ha', 's', 'h', 'l', 'cm', 'mm', 'km', 'dm'][randInt(0, 14)];
		let pConfig;
		switch (options?.mode) {
			case 'quiz':
				pConfig = [3, 4, 5, 6, 7, 10, 20, 25, 50];
				break;
			case 'calculator':
				pConfig = [3, 4, 5, 6, 7, 10, 15, 20, 25, 50];
				break;
			default:
				pConfig = [3, 4, 5, 6, 7, 10, 20, 25, 50];
				break;
		}
		const p = pConfig[randInt(0, pConfig.length - 1)];
		const pVal = rnd(2, 11) * 100;
		const pvType = randInt(0, 5);

		switch (pvType) {
			case 0: {
				const result = pVal + (pVal / 100 * p);
				textDisplay = `${pVal} ${einheit} um ${p} % erhöht sind ${blank(3)}`;
				s = formatUtils.buildSolutionTable([
					[`100 %`, `${comma(pVal)} ${einheit}`],
					[`1 %`, `${comma(pVal / 100)} ${einheit}`],
					[isQuizMode ? `${100 + p} %` : `100 % + ${p} % = ${100 + p} %`, `<b>${comma(result)} ${einheit}</b>`]
				]);
				if (isQuizMode) answer = { kind: 'number', value: result, unit: einheit };
				break;
			}
			case 1: {
				const result = pVal - (pVal / 100 * p);
				textDisplay = `${pVal} ${einheit} um ${p} % reduziert sind ${blank(3)}`;
				s = formatUtils.buildSolutionTable([
					[`100 %`, `${comma(pVal)} ${einheit}`],
					[`1 %`, `${comma(pVal / 100)} ${einheit}`],
					[isQuizMode ? `${100 - p} %` : `100 % - ${p} % = ${100 - p} %`, `<b>${comma(result)} ${einheit}</b>`]
				]);
				if (isQuizMode) answer = { kind: 'number', value: result, unit: einheit };
				break;
			}
			case 2: {
				const result = pVal + (pVal / 100 * p);
				textDisplay = `${pVal} ${einheit} auf ${100 + p} % erhöht sind ${blank(3)}`;
				s = formatUtils.buildSolutionTable([
					[`100 %`, `${comma(pVal)} ${einheit}`],
					[`1 %`, `${comma(pVal / 100)} ${einheit}`],
					[`${100 + p} %`, `<b>${comma(result)} ${einheit}</b>`]
				]);
				if (isQuizMode) answer = { kind: 'number', value: result, unit: einheit };
				break;
			}
			case 3: {
				const result = pVal - (pVal / 100 * p);
				textDisplay = `${pVal} ${einheit} auf ${100 - p} % reduziert sind ${blank(3)}`;
				s = formatUtils.buildSolutionTable([
					[`100 %`, `${comma(pVal)} ${einheit}`],
					[`1 %`, `${comma(pVal / 100)} ${einheit}`],
					[`${100 - p} %`, `<b>${comma(result)} ${einheit}</b>`]
				]);
				if (isQuizMode) answer = { kind: 'number', value: result, unit: einheit };
				break;
			}
			case 4: {
				const rabattConfig = [3, 4, 5, 6, 7, 10, 20, 25];
				const rabatt = rabattConfig[randInt(0, rabattConfig.length - 1)];
				const originalPrice = pVal;
				const discountedPrice = originalPrice - (originalPrice / 100 * rabatt);
				textDisplay = isQuizMode
					? `${rabatt} % Rabatt auf ${originalPrice} €. Neuer Preis: ${blank(3)}`
					: `${rabatt} % Rabatt auf ${originalPrice} €. <br>Berechne den neuen Preis.`;
				textPrint = isQuizMode ? undefined : `${rabatt} % Rabatt auf ${originalPrice} €. Neuer Preis: ${blank(3)}`;
				s = formatUtils.buildSolutionTable([
					[`100 %`, `${comma(originalPrice)} €`],
					[`1 %`, `${comma(originalPrice / 100)} €`],
					[isQuizMode ? `${100 - rabatt} %` : `100 % - ${rabatt} % = ${100 - rabatt} %`, `<b>${comma(discountedPrice)} €</b>`]
				]);
				if (isQuizMode) answer = { kind: 'number', value: discountedPrice, unit: '€' };
				break;
			}
			case 5: {
				const rabattConfig = [3, 4, 5, 6, 7, 10, 20, 25];
				const rabatt = rabattConfig[randInt(0, rabattConfig.length - 1)];
				const originalPrice = pVal;
				const discountedPrice = originalPrice - (originalPrice / 100 * rabatt);
				textDisplay = isQuizMode
					? `Preissenkung von ${originalPrice} € auf ${discountedPrice} €. Rabatt: ${blank(2)} %`
					: `Preissenkung von ${originalPrice} € auf ${discountedPrice} €. <br>Berechne den Rabatt.`;
				textPrint = isQuizMode ? undefined : `Preissenkung von ${originalPrice} € auf ${discountedPrice} €. Rabatt: ${blank(1)} %`;
				s = formatUtils.buildSolutionTable([
					[`100 %`, `${comma(originalPrice)} €`],
					[`1 %`, `${comma(originalPrice / 100)} €`],
					isQuizMode
						? [`${rabatt} %`, `<b>${comma(originalPrice - discountedPrice)} €</b>`]
						: [`<b>${rabatt} %</b>`, `${comma(originalPrice)} € - ${comma(discountedPrice)} € = ${comma(originalPrice - discountedPrice)} €`]
				]);
				if (isQuizMode) answer = { kind: 'number', value: rabatt, unit: '%' };
				break;
			}
		}
		break;
	}
	case 'zinsen': {
		const subTypeConfig = isQuizMode ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];
		const subType = subTypeConfig[randInt(0, subTypeConfig.length - 1)];
		const pList = [2, 3, 4, 5, 6, 7, 8];

		switch (subType) {
			case 0: {
				const kBase = [450, 650, 750, 850, 1200, 1400, 1500, 1750, 1800, 2400, 2500, 3200, 3500, 4200, 4500, 5400, 6500];
				const K = kBase[randInt(0, kBase.length - 1)];
				const p = pList[randInt(0, pList.length - 1)];
				const Z = (K * p) / 100;
				textDisplay = isQuizMode
					? `${comma(K)} € mit ${p} % Zinsen. Jahreszinsen Z = ${blank(3)}`
					: `Ein Kapital von ${comma(K)} € wird zu einem Zinssatz von ${p} % angelegt. <br>Berechne die Jahreszinsen.`;
				textPrint = isQuizMode ? undefined : `${comma(K)} € mit ${p} % Zinsen. Jahreszinsen Z = ${blank(3)}`;
				s = formatUtils.buildSolutionTable([
					[`100 %`, `${comma(K)} €`],
					[`1 %`, `${comma(K / 100)} €`],
					[`${p} %`, `<b>${comma(Z)} €</b>`]
				]);
				if (isQuizMode) answer = { kind: 'number', value: Z, unit: '€' };
				break;
			}
			case 1: {
				const kBase = [450, 650, 750, 850, 1200, 1400, 1500, 1600, 1800, 2400, 2500, 3200, 3500, 4200, 4500, 5400, 6500];
				const K = kBase[randInt(0, kBase.length - 1)];
				const p = pList[randInt(0, pList.length - 1)];
				const Z = (K * p) / 100;
				const K1 = K + Z;
				textDisplay = isQuizMode
					? `${comma(K)} € mit ${p} % Zinsen. Kapital am Jahresende: ${blank(3)}`
					: `Ein Kapital von ${comma(K)} € wird für 1 Jahr zu einem Zinssatz von ${p} % angelegt. <br>Berechne das Kapital nach einem Jahr.`;
				textPrint = isQuizMode ? undefined : `${comma(K)} € mit ${p} % Zinsen. Kapital am Jahresende: ${blank(3)}`;
				s = formatUtils.buildSolutionTable([
					[`100 %`, `${comma(K)} €`],
					[`1 %`, `${comma(K / 100)} €`],
					[`${100 + p} %`, `<b>${comma(K1)} €</b>${isQuizMode ? ` (${comma(K)} € + ${comma(Z)} €)` : ''}`]
				]);
				if (isQuizMode) answer = { kind: 'number', value: K1, unit: '€' };
				break;
			}
			case 2: {
				const factors = isQuizMode
					? [14, 15, 16, 18, 22, 24, 25, 28, 32, 35, 42, 45, 48, 55, 64]
					: [18, 24, 25, 28, 32, 35, 42, 45, 48, 54, 65];
				const factor = factors[randInt(0, factors.length - 1)];
				const p = pList[randInt(0, pList.length - 1)];
				const K = factor * 100;
				const Z = factor * p;
				if (isQuizMode) {
					textDisplay = `Für ${comma(K)} € Kapital gibt es ${comma(Z)} € Jahreszinsen. <br>Zinssatz p % = ${blank(2)}`;
				} else {
					textPrint = `Bei ${p} % gibt es ${comma(Z)} € Jahreszinsen. Kapital K = ${blank(3)}`;
					textDisplay = `Ein Sparguthaben bringt bei einem Zinssatz von ${p} % nach einem Jahr genau ${comma(Z)} € Zinsen. <br>Berechne das Anfangskapital.`;
				}
				s = isQuizMode
					? formatUtils.buildSolutionTable([
						[`100 %`, `${comma(K)} €`],
						[`1 %`, `${comma(factor)} €`],
						[`<b>${p} %</b>`, `${comma(Z)} €`]
					])
					: formatUtils.buildSolutionTable([
						[`100 %`, `<b>${comma(K)} €</b>`],
						[`1 %`, `${comma(factor)} €`],
						[`${p} %`, `${comma(Z)} €`]
					]);
				if (isQuizMode) answer = { kind: 'number', value: p, unit: '%' };
				break;
			}
			case 3: {
				const factors = [14, 15, 16, 18, 22, 24, 25, 28, 32, 35, 42, 45, 48, 55, 64];
				const factor = factors[randInt(0, factors.length - 1)];
				const p = pList[randInt(0, pList.length - 1)];
				const K = factor * 100;
				const Z = factor * p;
				if (isQuizMode) {
					const m = randInt(1, 11);
					const pMonat = [2, 3, 4, 5, 6, 8][randInt(0, 5)];
					let zMonat;
					if (pMonat === 5) zMonat = [5, 10, 15, 20][randInt(0, 3)];
					else if (pMonat === 8) zMonat = [4, 6, 8, 10, 12][randInt(0, 4)];
					else zMonat = randInt(3, 12);
					const zJahr = zMonat * 12;
					const KMonat = (zJahr * 100) / pMonat;
					const zTotal = zMonat * m;
					const monateWord = m === 1 ? '1 Monat' : `${m} Monate`;
					textDisplay = `${comma(KMonat)} € werden zu ${pMonat} % für ${monateWord} angelegt. <br>Zinsen Z = ${blank(3)}`;
					s = formatUtils.buildSolutionTable([
						[`100 % (12 Monate)`, `${comma(KMonat)} €`],
						[`1 %`, `${comma(KMonat / 100)} €`],
						[`${pMonat} % (Jahreszinsen)`, `${comma(zJahr)} €`],
						[`1 Monat (: 12)`, `${comma(zMonat)} €`],
						[`<b>${monateWord}</b>`, `<b>${comma(zTotal)} €</b>`]
					]);
					answer = { kind: 'number', value: zTotal, unit: '€' };
				} else {
					textDisplay = `Auf ${comma(K)} € gibt es ${comma(Z)} € Jahreszinsen. Zinssatz p % = ${blank(1)}`;
					s = formatUtils.buildSolutionTable([
						[`100 %`, `${comma(K)} €`],
						[`1 %`, `${comma(factor)} €`],
						[`<b>${p} %</b>`, `${comma(Z)} €`]
					]);
				}
				break;
			}
			case 4: {
				const factors = [18, 24, 25, 28, 32, 35, 42, 45, 48, 54, 65];
				const factor = factors[randInt(0, factors.length - 1)];
				const p = pList[randInt(0, pList.length - 1)];
				const Z = factor * p;
				const K = factor * 100;
				textDisplay = `Bei ${p} % gibt es ${comma(Z)} € Jahreszinsen. Kapital K = ${blank(3)}`;
				s = formatUtils.buildSolutionTable([
					[`${p} %`, `${comma(Z)} €`],
					[`1 %`, `${comma(factor)} €`],
					[`100 %`, `<b>${comma(K)} €</b>`]
				]);
				answer = { kind: 'number', value: K, unit: '€' };
				break;
			}
		}
		break;
	}
		case 'schriftliche_addition_subtraktion': {
			const op = randInt(0, 1); // 0: +, 1: -, 2: *, 3: /
			let v1, v2, res;
			const countDigits = (value) => Math.max(1, String(value).replace(/[^0-9]/g, '').length);
			const isGrade5 = grade <= 5;

			switch (op) {
				case 0: // ADDITION
					if (isGrade5) {
						v1 = randInt(111, 99999);
						v2 = randInt(111, 99999);
						res = v1 + v2;
						textDisplay = `Berechne schriftlich: \\( \\quad ${v1} + ${v2} \\)`;
						textPrint = `Berechne schriftlich: \\( \\quad ${v1} + ${v2} \\)<br>${karo(4, 12)}`;
						s = `\\( ${v1} + ${v2} = ${res} \\)`;
					} else {
						// v1: 1-2 Stellen, v2: 0-2 Stellen (verschieden)
						v1 = rnd(10000, 99999) / 1000;
						v2 = rnd(100, 9999) / 10;
						res = v1 + v2;
						textDisplay = `Berechne schriftlich: \\( \\quad ${comma(v1)} + ${comma(v2)} \\)`;
						textPrint = `Berechne schriftlich: \\( \\quad ${comma(v1)} + ${comma(v2)} \\)<br>${karo(4, 12)}`;
						s = `\\( ${comma(v1)} + ${comma(v2)} = ${formatDecimal(res, 2)} \\)`;
					}
					break;

				case 1: // SUBTRAKTION
					if (isGrade5) {
						const a = randInt(111, 99999);
						let b = randInt(111, 99999);
						while (b === a) {
							b = randInt(111, 99999);
						}
						v1 = Math.max(a, b);
						v2 = Math.min(a, b);
						res = v1 - v2;
						textDisplay = `Berechne schriftlich: \\( \\quad ${v1} - ${v2} \\)`;
						textPrint = `Berechne schriftlich: \\( \\quad ${v1} - ${v2} \\)<br>${karo(4, 12)}`;
						s = `\\( ${v1} - ${v2} = ${res} \\)`;
					} else {
						v1 = trueDec(200, 500);
						v2 = rnd(5555, 14444) / 100;
						res = v1 - v2;
						textDisplay = `Berechne schriftlich: \\( \\quad ${comma(v1)} - ${comma(v2)} \\)`;
						textPrint = `Berechne schriftlich: \\( \\quad ${comma(v1)} - ${comma(v2)} \\)<br>${karo(4, 12)}`;
						s = `\\( ${comma(v1)} - ${comma(v2)} = ${formatDecimal(res, 2)} \\)`;
					}
					break;
			}
			break;
		}

		case 'schriftliche_multiplikation_division': {
			const op = randInt(2, 3); // 0: +, 1: -, 2: *, 3: /
			let v1, v2, res;
			const countDigits = (value) => Math.max(1, String(value).replace(/[^0-9]/g, '').length);
			const isGrade5 = grade <= 5;

			switch (op) {

				case 2: // MULTIPLIKATION
					if (isGrade5) {
						// 1. Faktor: 3- oder 4-stellig
						v1 = randInt(100, 9999);
						// 2. Faktor: 2- oder 3-stellig, nur Ziffern 0, 1, 2, 3, 4, 5, 6
						const numDigits = randInt(2, 3);
						const firstDigit = randInt(1, 6);
						const allowedDigits = [0, 1, 2, 3, 4, 5, 6];
						let digits = [firstDigit];
						for (let i = 1; i < numDigits; i++) {
							digits.push(allowedDigits[randInt(0, allowedDigits.length - 1)]);
						}
						v2 = parseInt(digits.join(''), 10);
						res = v1 * v2;
						const factor2Digits = countDigits(v2);
						const mulRows = factor2Digits + 3;
						textDisplay = `Berechne schriftlich: \\( \\quad ${v1} \\cdot ${v2} \\)`;
						textPrint = `Berechne schriftlich: \\( \\quad ${v1} \\cdot ${v2} \\)<br>${karo(mulRows, 16)}`;
						s = `\\( ${v1} \\cdot ${v2} = ${res} \\)`;
					} else {
						// Faktor 1: 0-2 Stellen, Faktor 2: 0-2 Stellen
						do {
							const p1 = rnd(2, 4) - 1;
							const p2 = rnd(2, 4) - 2;
							v1 = rnd(11, 499) / Math.pow(10, p1);
							v2 = rnd(11, 299) / Math.pow(10, p2);
						} while (Number.isInteger(v1) && Number.isInteger(v2));
						res = v1 * v2;
						const factor2Digits = countDigits(comma(v2));
						const mulRows = factor2Digits + 3;
						textDisplay = `Berechne schriftlich: \\( \\quad ${comma(v1)} \\cdot ${comma(v2)} \\)`;
						textPrint = `Berechne schriftlich: \\( \\quad ${comma(v1)} \\cdot ${comma(v2)} \\)<br>${karo(mulRows, 16)}`;
						// Bei Multiplikation können bis zu 4 Stellen entstehen (2+2)
						s = `\\( ${comma(v1)} \\cdot ${comma(v2)} = ${formatDecimal(res, 4)} \\)`;
					}
					break;

				case 3: // DIVISION (durch ganze Zahl)
					if (isGrade5) {
						// Dividend: 4-stellig, Divisor: einstellig
						const dividend = randInt(1000, 9999);
						const divisor = randInt(2, 9);
						const quotient = Math.floor(dividend / divisor);
						const remainder = dividend % divisor;
						const quotientDigits = countDigits(quotient);
						const divRows = Math.max(4, quotientDigits * 2 + 3);

						textDisplay = `Berechne schriftlich: \\( \\quad ${dividend} : ${divisor} \\)`;
						textPrint = `Berechne schriftlich: \\( \\quad ${dividend} : ${divisor} \\)<br>${karo(divRows, 16)}`;
						if (remainder > 0) {
							s = `\\( ${dividend} : ${divisor} = ${quotient} \\text{ Rest } ${remainder} \\)`;
						} else {
							s = `\\( ${dividend} : ${divisor} = ${quotient} \\)`;
						}
					} else {
						const divisor = rnd(3, 9);
						const p3 = rnd(2, 4) - 1;
						// Wir würfeln das Ergebnis zuerst (max 2 Stellen), damit es aufgeht
						const resultValue = rnd(111, 2999) / Math.pow(10, p3);
						const dividend = (resultValue * divisor);
						const resultDigits = countDigits(comma(resultValue));
						const divRows = Math.max(4, resultDigits * 2 + 3);

						textDisplay = `Berechne schriftlich: \\( \\quad ${formatDecimal(dividend, 2)} : ${divisor} \\)`;
						textPrint = `Berechne schriftlich: \\( \\quad ${formatDecimal(dividend, 2)} : ${divisor} \\)<br>${karo(divRows, 16)}`;
						s = `\\( ${formatDecimal(dividend, 2)} : ${divisor} = ${comma(resultValue)} \\)`;
					}
					break;
			}
			break;
		}

case 'einheiten': {
		if (isQuizMode) {
			const toCleanString = formatUtils.toCleanString;

			// 1. Definition der Einheiten-Ketten (geordnet von klein nach groß)
			let unitGroups = [
				{ units: ['mm', 'cm', 'dm', 'm', 'km'], factors: [10, 10, 10, 1000], type: 'Länge' },
				{ units: ['mm²', 'cm²', 'dm²', 'm²', 'a', 'ha', 'km²'], factors: [100, 100, 100, 100, 100, 100], type: 'Fläche' },
				{ units: ['mm³', 'cm³', 'dm³', 'm³'], factors: [1000, 1000, 1000], type: 'Volumen' },
				{ units: ['mg', 'g', 'kg', 't'], factors: [1000, 1000, 1000], type: 'Masse' },
				{ units: ['s', 'min', 'h'], factors: [60, 60], type: 'Zeit' }
			];

			if (grade <= 5) {
				unitGroups = unitGroups.filter(g => g.type !== 'Fläche' && g.type !== 'Volumen');
			}
			unitGroups = unitGroups.filter(g => g.type !== 'Volumen');

			// 2. Zufällige Gruppe wählen (z.B. Zeit oder Masse)
			const group = unitGroups[randInt(0, unitGroups.length - 1)];

			// 3. Einen Index innerhalb der Gruppe wählen
			// Wir wählen so, dass wir einen Nachbarn haben (nicht den letzten Index bei 'kleiner', nicht den ersten bei 'größer')
			const unitIndex = randInt(0, group.units.length - 1);

			// 4. Richtung bestimmen: 0 = in nächstkleinere, 1 = in nächstgrößere
			let direction;
			if (unitIndex === 0) direction = 1; // Muss größer werden
			else if (unitIndex === group.units.length - 1) direction = 0; // Muss kleiner werden
			else direction = Math.random() > 0.5 ? 1 : 0;

			const fromUnit = group.units[unitIndex];
			let toUnit, startValue, result, operation;

			switch (group.type) {
				case 'Zeit':
					if (direction === 0) {
						// In nächstkleinere Einheit (Zahl wird größer)
						toUnit = group.units[unitIndex - 1];
						const f = group.factors[unitIndex - 1];
						operation = `· ${f}`;
						startValue = [0.1, 0.25, 0.5, 1.5, 2.25, 2.5, 2.75, 3.5, 4][randInt(0, 8)];
						result = (startValue * f);
					} else {
						toUnit = group.units[unitIndex + 1];
						const f = group.factors[unitIndex];
						operation = `: ${f}`;
						startValue = [0.1, 0.25, 0.5, 1.5, 2.25, 2.5, 2.75, 3.5, 4][randInt(0, 8)] * f;
						result = comma(startValue / f);
					}
					break;
				default:
					const factor = (direction === 0) ? group.factors[unitIndex - 1] : group.factors[unitIndex];
					toUnit = (direction === 0) ? group.units[unitIndex - 1] : group.units[unitIndex + 1];
					operation = (direction === 0) ? `· ${factor}` : `: ${factor}`;

					if (direction === 0) {
						// Zahl wird größer (Multiplikation)
						// Wir erzeugen einen Startwert mit 0 bis 2 Nachkommastellen
						const raw = rnd(1, 5000);
						const shift = [1, 10, 100][rnd(0, 2)]; // Teiler für 0, 1 oder 2 Stellen
						startValue = raw / shift;
						result = toCleanString(startValue * factor);
					} else {
						// Zahl wird kleiner (Division)
						// Wir bestimmen erst das Ergebnis (bis zu 3 Stellen), damit keine unendlichen Brüche entstehen
						const resRaw = rnd(1, 2000);
						const resShift = [10, 100, 1000][rnd(0, 2)];
						const resNum = resRaw / resShift;
						startValue = resNum * factor;
						result = toCleanString(resNum);
					}
					break;
			}

			const numericResult = Number(String(result).replace(',', '.'));
			textDisplay = `${toCleanString(startValue)} ${fromUnit} = ${blank(3)} ${toUnit}`;
			s = `${toCleanString(startValue)} ${fromUnit} = ${result} ${toUnit} &emsp; ( ${operation} )`;
			answer = { kind: 'number', value: numericResult };
} else {
			const toCleanString = formatUtils.toCleanString;
			const getDisplayVolumeUnits = (units) => {
				if (Math.random() < 0.5) {
					return units;
				}
				return units.map((unit) => {
					if (unit === 'cm³') return 'ml';
					if (unit === 'dm³') return 'l';
					return unit;
				});
			};

			// 1. Definition der Einheiten-Ketten (geordnet von klein nach groß)
			let unitGroups = [
				{ units: ['mm', 'cm', 'dm', 'm', 'km'], factors: [10, 10, 10, 1000], type: 'Länge' },
				{ units: ['mm²', 'cm²', 'dm²', 'm²', 'a', 'ha', 'km²'], factors: [100, 100, 100, 100, 100, 100], type: 'Fläche' },
				{ units: ['mm³', 'cm³', 'dm³', 'm³'], factors: [1000, 1000, 1000], type: 'Volumen' },
				{ units: ['mg', 'g', 'kg', 't'], factors: [1000, 1000, 1000], type: 'Masse' },
				{ units: ['s', 'min', 'h'], factors: [60, 60], type: 'Zeit' }
			];

			if (grade <= 5) {
				unitGroups = unitGroups.filter(g => g.type !== 'Fläche' && g.type !== 'Volumen');
			}

			// 2. Zufällige Gruppe wählen (z.B. Zeit oder Masse)
			const group = unitGroups[randInt(0, unitGroups.length - 1)];
			const displayUnits = group.type === 'Volumen' ? getDisplayVolumeUnits(group.units) : group.units;

			// 3. Einen Index innerhalb der Gruppe wählen
			// Wir wählen so, dass wir einen Nachbarn haben (nicht den letzten Index bei 'kleiner', nicht den ersten bei 'größer')
			const unitIndex = randInt(0, group.units.length - 1);

			// 4. Richtung bestimmen: 0 = in nächstkleinere, 1 = in nächstgrößere
			let direction;
			if (unitIndex === 0) direction = 1; // Muss größer werden
			else if (unitIndex === group.units.length - 1) direction = 0; // Muss kleiner werden
			else direction = Math.random() > 0.5 ? 1 : 0;

			const fromUnit = displayUnits[unitIndex];
			let toUnit, startValue, result, operation;

			switch (group.type) {
				case 'Zeit':
					if (direction === 0) {
						// In nächstkleinere Einheit (Zahl wird größer)
						toUnit = displayUnits[unitIndex - 1];
						const f = group.factors[unitIndex - 1];
						operation = `· ${f}`;
						startValue = [0.1, 0.25, 0.5, 1.5, 2.25, 2.5, 2.75, 3.5, 4][randInt(0, 8)];
						result = (startValue * f);
					} else {
						toUnit = displayUnits[unitIndex + 1];
						const f = group.factors[unitIndex];
						operation = `: ${f}`;
						startValue = [0.1, 0.25, 0.5, 1.5, 2.25, 2.5, 2.75, 3.5, 4][randInt(0, 8)] * f;
						result = comma(startValue / f);
					}
					break;
				default:
					const factor = (direction === 0) ? group.factors[unitIndex - 1] : group.factors[unitIndex];
					toUnit = (direction === 0) ? displayUnits[unitIndex - 1] : displayUnits[unitIndex + 1];
					operation = (direction === 0) ? `· ${factor}` : `: ${factor}`;

					if (direction === 0) {
						// Zahl wird größer (Multiplikation)
						// Wir erzeugen einen Startwert mit 0 bis 2 Nachkommastellen
						const raw = rnd(1, 5000);
						const shift = [1, 10, 100][rnd(0, 2)]; // Teiler für 0, 1 oder 2 Stellen
						startValue = raw / shift;
						result = toCleanString(startValue * factor);
					} else {
						// Zahl wird kleiner (Division)
						// Wir bestimmen erst das Ergebnis (bis zu 3 Stellen), damit keine unendlichen Brüche entstehen
						const resRaw = rnd(1, 2000);
						const resShift = [10, 100, 1000][rnd(0, 2)];
						const resNum = resRaw / resShift;
						startValue = resNum * factor;
						result = toCleanString(resNum);
					}
					break;
			}

			textDisplay = `${toCleanString(startValue)} ${fromUnit} = ${blank(3)} ${toUnit}`;
			s = `${toCleanString(startValue)} ${fromUnit} = ${result} ${toUnit} &emsp; ( ${operation} )`;
		}
		break;
	}
	case 'geometrie': {
		if (isQuizMode) {
			const shapeType = randInt(0, grade >= 7 ? 2 : 1);
			const goal = Math.random() > 0.5 ? 'A' : 'u';
			const lengthUnits = ['cm', 'dm', 'm'];
			const unit = lengthUnits[randInt(0, lengthUnits.length - 1)];
			let sideA, sideB;

			if (shapeType === 0) { // QUADRAT
				sideA = rnd(3, 12);
				if (goal === 'A') {
					textDisplay = `Berechne den Flächeninhalt eines Quadrats mit \\( a = ${sideA} \\) ${unit}.`;
					s = `\\( A = a \\cdot a = ${sideA} \\cdot ${sideA} = ${sideA * sideA} \\text{ ${unit}}^2 \\)`;
				} else {
					textDisplay = `Berechne den Umfang eines Quadrats mit \\( a = ${sideA} \\) ${unit}.`;
					s = `\\( u = 4 \\cdot a = 4 \\cdot ${sideA} = ${sideA * 4} \\text{ ${unit}} \\)`;
				}
			}
			else if (shapeType === 1) { // RECHTECK
				sideA = rnd(2, 12); sideB = rnd(3, 7);
				if (sideA === sideB) { sideB++ }
				if (goal === 'A') {
					textDisplay = `Berechne den Flächeninhalt eines Rechtecks mit <br>\\( a = ${sideA} \\) ${unit} und \\( b = ${sideB} \\) ${unit}.`;
					s = `\\( A = a \\cdot b = ${sideA} \\cdot ${sideB} = ${sideA * sideB} \\text{ ${unit}}^2 \\)`;
				} else {
					textDisplay = `Berechne den Umfang eines Rechtecks mit <br>\\( a = ${sideA} \\) ${unit} und \\( b = ${sideB} \\) ${unit}.`;
					s = `\\( u = 2 \\cdot (a+b) = 2 \\cdot (${sideA} + ${sideB}) = ${2 * (sideA + sideB)} \\text{ ${unit}} \\)`;
				}
			}
			else { // DREIECK
				sideA = rnd(2, 12); sideB = rnd(3, 7);
				textDisplay = `Berechne den Flächeninhalt eines Dreiecks mit <br>Grundseite \\( g = ${sideA} \\) ${unit} und Höhe \\( h = ${sideB} \\) ${unit}.`;
				s = `\\( A = \\frac{1}{2} \\cdot g \\cdot h = \\frac{1}{2} \\cdot ${sideA} \\cdot ${sideB} = ${(sideA * sideB) / 2} \\text{ ${unit}}^2 \\)`.replace('.', ',');
			}
			const geometryResult = shapeType === 0 ? (goal === 'A' ? sideA * sideA : sideA * 4)
				: shapeType === 1 ? (goal === 'A' ? sideA * sideB : 2 * (sideA + sideB))
				: (sideA * sideB) / 2;
			answer = { kind: 'number', value: geometryResult };
		} else {
			const shapeType = randInt(0, grade >= 7 ? 2 : 1);
			const goal = Math.random() > 0.5 ? 'A' : 'u';
			const lengthUnits = ['cm', 'dm', 'm'];
			const unit = lengthUnits[randInt(0, lengthUnits.length - 1)];
			let sideA, sideB;

			if (shapeType === 0) { // QUADRAT
				sideA = rnd(3, 12);
				if (goal === 'A') {
					textDisplay = `Berechne den Flächeninhalt eines Quadrats mit \\( a = ${sideA} \\) ${unit}.`;
					s = `\\( A = a \\cdot a = ${sideA} \\cdot ${sideA} = ${sideA * sideA} \\text{ ${unit}}^2 \\)`;
				} else {
					textDisplay = `Berechne den Umfang eines Quadrats mit \\( a = ${sideA} \\) ${unit}.`;
					s = `\\( u = 4 \\cdot a = 4 \\cdot ${sideA} = ${sideA * 4} \\text{ ${unit}} \\)`;
				}
			}
			else if (shapeType === 1) { // RECHTECK
				sideA = rnd(2, 12); sideB = rnd(3, 7);
				if (sideA === sideB) { sideB++ }
				if (goal === 'A') {
					textDisplay = `Berechne den Flächeninhalt eines Rechtecks mit <br>\\( a = ${sideA} \\) ${unit} und \\( b = ${sideB} \\) ${unit}.`;
					s = `\\( A = a \\cdot b = ${sideA} \\cdot ${sideB} = ${sideA * sideB} \\text{ ${unit}}^2 \\)`;
				} else {
					textDisplay = `Berechne den Umfang eines Rechtecks mit <br>\\( a = ${sideA} \\) ${unit} und \\( b = ${sideB} \\) ${unit}.`;
					s = `\\( u = 2 \\cdot (a+b) = 2 \\cdot (${sideA} + ${sideB}) = ${2 * (sideA + sideB)} \\text{ ${unit}} \\)`;
				}
			}
			else { // DREIECK
				sideA = rnd(2, 12); sideB = rnd(3, 7);
				textDisplay = `Berechne den Flächeninhalt eines Dreiecks mit <br>Grundseite \\( g = ${sideA} \\) ${unit} und Höhe \\( h = ${sideB} \\) ${unit}.`;
				s = `\\( A = \\frac{1}{2} \\cdot g \\cdot h = \\frac{1}{2} \\cdot ${sideA} \\cdot ${sideB} = ${(sideA * sideB) / 2} \\text{ ${unit}}^2 \\)`.replace('.', ',');
			}
		}
		break;
	}
		case 'dreiecksberechnungen_zeichnung': {
			// Umfassender Aufgabentyp: Dreiecksberechnungen anhand maßstäblicher Zeichnungen
			// Unterstützt: Flächeninhalt, Umfang, fehlende Seiten/Winkel mit Pythagoras, Trigonometrie, Sinussatz, Kosinussatz
			const unit = 'cm';
			const toRad = deg => deg * Math.PI / 180;
			const toDeg = rad => rad * 180 / Math.PI;

			// Verfügbare Methoden nach Klassenstufe
			let modePool = [];
			if (grade <= 5) {
				modePool = ['area', 'perimeter', 'angle_sum'];
			} else if (grade === 6) {
				modePool = ['area', 'perimeter', 'angle_sum'];
			} else if (grade === 7) {
				modePool = ['area', 'perimeter', 'angle_sum'];
			} else if (grade === 8) {
				modePool = ['area', 'perimeter', 'angle_sum', 'pythagoras', 'pythagoras'];
			} else if (grade === 9) {
				modePool = ['pythagoras', 'trig_right', 'sine_law', 'cosine_law_side', 'area', 'angle_sum'];
			} else {
				// Klasse 10
				modePool = ['pythagoras', 'trig_right', 'sine_law', 'cosine_law_side', 'cosine_law_angle', 'area', 'perimeter'];
			}

			const taskMode = modePool[randInt(0, modePool.length - 1)];

			switch (taskMode) {
				case 'area': {
					// 1. FLÄCHENINHALT
					const variants = grade <= 5 ? ['standard'] : (grade === 6 ? ['standard', 'right_angle'] : ['standard', 'right_angle', 'obtuse']);
					const variant = variants[randInt(0, variants.length - 1)];

					let gVal, hVal;

					gVal = randInt(5, 12) + (Math.random() < 0.3 ? 0.5 : 0);
					hVal = randInt(3, 8) + (Math.random() < 0.3 ? 0.5 : 0);

					const splitT = 0.38 + randInt(0, 4) * 0.06;
					const A = (gVal * hVal) / 2;
					const AStr = comma(Number.isInteger(A) ? A : A.toFixed(2).replace(/\.?0+$/, ''));
					const gStr = comma(gVal);
					const hStr = comma(hVal);

					if (variant === 'standard') {
						const svg = buildTriangleAreaSvg({ variant: 'standard', gVal, hVal, unit, splitT });
						textDisplay = `
							<div style="display:flex;flex-direction:column;align-items:center;gap:0.4rem;">
								<div style="font-weight:600;font-size:1.05rem;">Berechne den Flächeninhalt \\( A \\) des abgebildeten Dreiecks:</div>
								${svg}
							</div>
						`;
						textPrint = `Berechne den Flächeninhalt \\( A \\) des Dreiecks: \\( A = \\) ${blank(2)} ${unit}²<br>${svg}`;
						s = `\\[ A = \\frac{1}{2} \\cdot g \\cdot h = \\frac{1}{2} \\cdot ${gStr}\\,\\text{${unit}} \\cdot ${hStr}\\,\\text{${unit}} = ${AStr}\\,\\text{${unit}}^2 \\]`;
					} else if (variant === 'right_angle') {
						const cHyp = Math.round(Math.hypot(gVal, hVal) * 10) / 10;
						const cStr = comma(cHyp);
						const svg = buildTriangleAreaSvg({ variant: 'right_angle', gVal, hVal, unit, cVal: cHyp });
						textDisplay = `
							<div style="display:flex;flex-direction:column;align-items:center;gap:0.4rem;">
								<div style="font-weight:600;font-size:1.05rem;">Berechne den Flächeninhalt \\( A \\) des rechtwinkligen Dreiecks:</div>
								${svg}
							</div>
						`;
						textPrint = `Berechne den Flächeninhalt \\( A \\) des rechtwinkligen Dreiecks: \\( A = \\) ${blank(2)} ${unit}²<br>${svg}`;
						s = `\\[ A = \\frac{1}{2} \\cdot a \\cdot b = \\frac{1}{2} \\cdot ${gStr}\\,\\text{${unit}} \\cdot ${hStr}\\,\\text{${unit}} = ${AStr}\\,\\text{${unit}}^2 \\]
						\\(\\text{Hinweis: Beim rechtwinkligen Dreieck stehen die Katheten } a \\text{ und } b \\text{ senkrecht aufeinander } (g = a, h = b).\\text{ Die Hypotenuse } c = ${cStr}\\,\\text{${unit}} \\text{ wird nicht benötigt.}\\)`;
					} else {
						const svg = buildTriangleAreaSvg({ variant: 'obtuse', gVal, hVal, unit });
						textDisplay = `
							<div style="display:flex;flex-direction:column;align-items:center;gap:0.4rem;">
								<div style="font-weight:600;font-size:1.05rem;">Berechne den Flächeninhalt \\( A \\) des stumpfwinkligen Dreiecks:</div>
								${svg}
							</div>
						`;
						textPrint = `Berechne den Flächeninhalt \\( A \\) des stumpfwinkligen Dreiecks: \\( A = \\) ${blank(2)} ${unit}²<br>${svg}`;
						s = `\\[ A = \\frac{1}{2} \\cdot g \\cdot h = \\frac{1}{2} \\cdot ${gStr}\\,\\text{${unit}} \\cdot ${hStr}\\,\\text{${unit}} = ${AStr}\\,\\text{${unit}}^2 \\]
						\\(\\text{Hinweis: Die gestrichelte Verlängerung der Grundlinie gehört nicht zur Grundseite } g.\\)`;
					}
					break;
				}

				case 'perimeter': {
					// 2. UMFANG (u = a + b + c)
					const aVal = randInt(5, 11);
					const bVal = randInt(5, 12);
					const cVal = randInt(Math.max(5, Math.abs(aVal - bVal) + 2), aVal + bVal - 2);

					// Formgetreue Winkel mit Kosinussatz
					const cosA = (bVal*bVal + cVal*cVal - aVal*aVal) / (2 * bVal * cVal);
					const alphaDeg = Math.round(toDeg(Math.acos(Math.max(-0.95, Math.min(0.95, cosA)))));
					const cosB = (aVal*aVal + cVal*cVal - bVal*bVal) / (2 * aVal * cVal);
					const betaDeg = Math.round(toDeg(Math.acos(Math.max(-0.95, Math.min(0.95, cosB)))));

					const svg = buildGeneralTriangleSvg({
						alphaDeg,
						betaDeg,
						labels: {
							a: `a = ${aVal} ${unit}`,
							b: `b = ${bVal} ${unit}`,
							c: `c = ${cVal} ${unit}`
						},
						unit
					});

					const u = aVal + bVal + cVal;
					textDisplay = `
						<div style="display:flex;flex-direction:column;align-items:center;gap:0.4rem;">
							<div style="font-weight:600;font-size:1.05rem;">Berechne den Umfang \\( u \\) des abgebildeten Dreiecks:</div>
							${svg}
						</div>
					`;
					textPrint = `Berechne den Umfang \\( u \\) des Dreiecks: \\( u = \\) ${blank(2)} ${unit}<br>${svg}`;
					s = `\\[ u = a + b + c = ${aVal}\\,\\text{${unit}} + ${bVal}\\,\\text{${unit}} + ${cVal}\\,\\text{${unit}} = ${u}\\,\\text{${unit}} \\]`;
					break;
				}

				case 'angle_sum': {
					// 3. INNENWINKELSUMME (180° - alpha - beta)
					let alpha = 35 + randInt(0, 8) * 5;
					let beta = 35 + randInt(0, 8) * 5;
					let gamma = 180 - alpha - beta;
					while (gamma < 25 || gamma > 115) {
						alpha = 30 + randInt(0, 8) * 5;
						beta = 30 + randInt(0, 8) * 5;
						gamma = 180 - alpha - beta;
					}

					const missing = ['alpha', 'beta', 'gamma'][randInt(0, 2)];
					const labels = {
						alpha: missing === 'alpha' ? 'α = ?' : `${alpha}°`,
						beta: missing === 'beta' ? 'β = ?' : `${beta}°`,
						gamma: missing === 'gamma' ? 'γ = ?' : `${gamma}°`
					};

					const svg = buildGeneralTriangleSvg({
						alphaDeg: alpha,
						betaDeg: beta,
						labels,
						highlight: missing,
						unit
					});

					const sym = missing === 'alpha' ? '\\alpha' : (missing === 'beta' ? '\\beta' : '\\gamma');
					const sub1 = missing === 'alpha' ? beta : alpha;
					const sub2 = missing === 'gamma' ? beta : gamma;
					const res = missing === 'alpha' ? alpha : (missing === 'beta' ? beta : gamma);

					textDisplay = `
						<div style="display:flex;flex-direction:column;align-items:center;gap:0.4rem;">
							<div style="font-weight:600;font-size:1.05rem;">Berechne den fehlenden Winkel \\( ${sym} \\) des abgebildeten Dreiecks:</div>
							${svg}
						</div>
					`;
					textPrint = `Berechne den fehlenden Winkel \\( ${sym} \\): \\( ${sym} = \\) ${blank(2)}°<br>${svg}`;
					s = `\\[ ${sym} = 180^\\circ - ${sub1}^\\circ - ${sub2}^\\circ = ${res}^\\circ \\]`;
					break;
				}

				case 'pythagoras': {
					// 4. SATZ DES PYTHAGORAS (Rechtwinkliges Dreieck)
					// Fall A: Hypotenuse c gesucht; Fall B: Kathete b gesucht
					const seekHypotenuse = Math.random() < 0.5;
					const triples = [
						[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [7, 24, 25],
						[4, 7, Math.round(Math.hypot(4, 7)*10)/10],
						[5, 9, Math.round(Math.hypot(5, 9)*10)/10],
						[6, 7, Math.round(Math.hypot(6, 7)*10)/10],
						[8, 11, Math.round(Math.hypot(8, 11)*10)/10]
					];
					const [aBase, bBase, cBase] = triples[randInt(0, triples.length - 1)];
					// gamma = 90° bei C
					const alphaDeg = Math.round(toDeg(Math.asin(aBase / cBase)));
					const betaDeg = 90 - alphaDeg;

					if (seekHypotenuse) {
						const svg = buildGeneralTriangleSvg({
							alphaDeg,
							betaDeg,
							labels: {
								a: `a = ${aBase} ${unit}`,
								b: `b = ${bBase} ${unit}`,
								c: `c = ?`
							},
							highlight: 'c',
							unit
						});

						const cStr = comma(cBase);
						textDisplay = `
							<div style="display:flex;flex-direction:column;align-items:center;gap:0.4rem;">
								<div style="font-weight:600;font-size:1.05rem;">Berechne die Hypotenuse \\( c \\) mit dem Satz des Pythagoras:</div>
								${svg}
							</div>
						`;
						textPrint = `Berechne die Hypotenuse \\( c \\): \\( c = \\) ${blank(2)} ${unit}<br>${svg}`;
						s = `\\[ c = \\sqrt{a^2 + b^2} = \\sqrt{(${aBase}\\,\\text{${unit}})^2 + (${bBase}\\,\\text{${unit}})^2} = \\sqrt{${aBase*aBase + bBase*bBase}\\,\\text{${unit}}^2} \\approx ${cStr}\\,\\text{${unit}} \\]`;
					} else {
						const svg = buildGeneralTriangleSvg({
							alphaDeg,
							betaDeg,
							labels: {
								a: `a = ${aBase} ${unit}`,
								b: `b = ?`,
								c: `c = ${cBase} ${unit}`
							},
							highlight: 'b',
							unit
						});

						const bStr = comma(bBase);
						textDisplay = `
							<div style="display:flex;flex-direction:column;align-items:center;gap:0.4rem;">
								<div style="font-weight:600;font-size:1.05rem;">Berechne die Kathete \\( b \\) mit dem Satz des Pythagoras:</div>
								${svg}
							</div>
						`;
						textPrint = `Berechne die Kathete \\( b \\): \\( b = \\) ${blank(2)} ${unit}<br>${svg}`;
						s = `\\[ b = \\sqrt{c^2 - a^2} = \\sqrt{(${cBase}\\,\\text{${unit}})^2 - (${aBase}\\,\\text{${unit}})^2} = \\sqrt{${Math.round((cBase*cBase - aBase*aBase)*10)/10}\\,\\text{${unit}}^2} \\approx ${bStr}\\,\\text{${unit}} \\]`;
					}
					break;
				}

				case 'trig_right': {
					// 5. TRIGONOMETRIE AM RECHTWINKLIGEN DREIECK (sin, cos, tan)
					const sub = randInt(0, 2); // 0: Gegenkathete (sin), 1: Ankathete (cos), 2: Winkel (tan)
					const alpha = [25, 30, 35, 40, 45, 50, 55, 60, 65][randInt(0, 8)];
					const beta = 90 - alpha;
					const cVal = randInt(8, 15);
					const aVal = Math.round((cVal * Math.sin(toRad(alpha))) * 10) / 10;
					const bVal = Math.round((cVal * Math.cos(toRad(alpha))) * 10) / 10;

					if (sub === 0) {
						// Gegenkathete a gesucht: sin(alpha) = a / c
						const svg = buildGeneralTriangleSvg({
							alphaDeg: alpha,
							betaDeg: beta,
							labels: {
								alpha: `${alpha}°`,
								c: `c = ${cVal} ${unit}`,
								a: `a = ?`
							},
							highlight: 'a',
							unit
						});
						const aStr = comma(aVal);
						textDisplay = `
							<div style="display:flex;flex-direction:column;align-items:center;gap:0.4rem;">
								<div style="font-weight:600;font-size:1.05rem;">Berechne die Gegenkathete \\( a \\) mit Trigonometrie:</div>
								${svg}
							</div>
						`;
						textPrint = `Berechne die Gegenkathete \\( a \\): \\( a = \\) ${blank(2)} ${unit}<br>${svg}`;
						s = `\\[ \\sin(\\alpha) = \\frac{\\text{Gegenkathete}}{\\text{Hypotenuse}} = \\frac{a}{c} \\implies a = c \\cdot \\sin(\\alpha) = ${cVal}\\,\\text{${unit}} \\cdot \\sin(${alpha}^\\circ) \\approx ${aStr}\\,\\text{${unit}} \\]`;
					} else if (sub === 1) {
						// Ankathete b gesucht: cos(alpha) = b / c
						const svg = buildGeneralTriangleSvg({
							alphaDeg: alpha,
							betaDeg: beta,
							labels: {
								alpha: `${alpha}°`,
								c: `c = ${cVal} ${unit}`,
								b: `b = ?`
							},
							highlight: 'b',
							unit
						});
						const bStr = comma(bVal);
						textDisplay = `
							<div style="display:flex;flex-direction:column;align-items:center;gap:0.4rem;">
								<div style="font-weight:600;font-size:1.05rem;">Berechne die Ankathete \\( b \\) mit Trigonometrie:</div>
								${svg}
							</div>
						`;
						textPrint = `Berechne die Ankathete \\( b \\): \\( b = \\) ${blank(2)} ${unit}<br>${svg}`;
						s = `\\[ \\cos(\\alpha) = \\frac{\\text{Ankathete}}{\\text{Hypotenuse}} = \\frac{b}{c} \\implies b = c \\cdot \\cos(\\alpha) = ${cVal}\\,\\text{${unit}} \\cdot \\cos(${alpha}^\\circ) \\approx ${bStr}\\,\\text{${unit}} \\]`;
					} else {
						// Winkel alpha gesucht: tan(alpha) = a / b
						const svg = buildGeneralTriangleSvg({
							alphaDeg: alpha,
							betaDeg: beta,
							labels: {
								alpha: `α = ?`,
								a: `a = ${comma(aVal)} ${unit}`,
								b: `b = ${comma(bVal)} ${unit}`
							},
							highlight: 'alpha',
							unit
						});
						textDisplay = `
							<div style="display:flex;flex-direction:column;align-items:center;gap:0.4rem;">
								<div style="font-weight:600;font-size:1.05rem;">Berechne den Winkel \\( \\alpha \\) mit Trigonometrie:</div>
								${svg}
							</div>
						`;
						textPrint = `Berechne den Winkel \\( \\alpha \\): \\( \\alpha = \\) ${blank(2)}°<br>${svg}`;
						s = `\\[ \\tan(\\alpha) = \\frac{\\text{Gegenkathete}}{\\text{Ankathete}} = \\frac{a}{b} = \\frac{${comma(aVal)}}{${comma(bVal)}} \\implies \\alpha = \\arctan\\left(\\frac{${comma(aVal)}}{${comma(bVal)}}\\right) \\approx ${alpha}^\\circ \\]`;
					}
					break;
				}

				case 'sine_law': {
					// 6. SINUSSATZ (Allgemeines Dreieck: b = a * sin(beta) / sin(alpha))
					const alpha = 35 + randInt(0, 6) * 5;
					const beta = 35 + randInt(0, 6) * 5;
					const aVal = randInt(6, 14);
					const bVal = Math.round((aVal * Math.sin(toRad(beta)) / Math.sin(toRad(alpha))) * 10) / 10;

					const svg = buildGeneralTriangleSvg({
						alphaDeg: alpha,
						betaDeg: beta,
						labels: {
							alpha: `${alpha}°`,
							beta: `${beta}°`,
							a: `a = ${aVal} ${unit}`,
							b: `b = ?`
						},
						highlight: 'b',
						unit
					});

					const bStr = comma(bVal);
					textDisplay = `
						<div style="display:flex;flex-direction:column;align-items:center;gap:0.4rem;">
							<div style="font-weight:600;font-size:1.05rem;">Berechne die Seite \\( b \\) mithilfe des Sinussatzes:</div>
							${svg}
						</div>
					`;
					textPrint = `Berechne die Seite \\( b \\) mit dem Sinussatz: \\( b = \\) ${blank(2)} ${unit}<br>${svg}`;
					s = `\\[ \\frac{b}{\\sin(\\beta)} = \\frac{a}{\\sin(\\alpha)} \\implies b = a \\cdot \\frac{\\sin(\\beta)}{\\sin(\\alpha)} = ${aVal}\\,\\text{${unit}} \\cdot \\frac{\\sin(${beta}^\\circ)}{\\sin(${alpha}^\\circ)} \\approx ${bStr}\\,\\text{${unit}} \\]`;
					break;
				}

				case 'cosine_law_side': {
					// 7. KOSINUSSATZ - SEITE GESUCHT (a² = b² + c² - 2bc*cos(alpha))
					const bVal = randInt(5, 11);
					const cVal = randInt(6, 13);
					const alpha = 35 + randInt(0, 7) * 5;
					const a2 = bVal*bVal + cVal*cVal - 2*bVal*cVal*Math.cos(toRad(alpha));
					const aVal = Math.round(Math.sqrt(a2) * 10) / 10;

					// Gamma aus Kosinussatz
					const cosB = (aVal*aVal + cVal*cVal - bVal*bVal) / (2 * aVal * cVal);
					const beta = Math.round(toDeg(Math.acos(Math.max(-0.95, Math.min(0.95, cosB)))));

					const svg = buildGeneralTriangleSvg({
						alphaDeg: alpha,
						betaDeg: beta,
						labels: {
							alpha: `${alpha}°`,
							b: `b = ${bVal} ${unit}`,
							c: `c = ${cVal} ${unit}`,
							a: `a = ?`
						},
						highlight: 'a',
						unit
					});

					const aStr = comma(aVal);
					textDisplay = `
						<div style="display:flex;flex-direction:column;align-items:center;gap:0.4rem;">
							<div style="font-weight:600;font-size:1.05rem;">Berechne die Seite \\( a \\) mithilfe des Kosinussatzes:</div>
							${svg}
						</div>
					`;
					textPrint = `Berechne die Seite \\( a \\) mit dem Kosinussatz: \\( a = \\) ${blank(2)} ${unit}<br>${svg}`;
					s = `\\[ a^2 = b^2 + c^2 - 2 \\cdot b \\cdot c \\cdot \\cos(\\alpha) \\]
					\\[ a = \\sqrt{(${bVal}\\,\\text{${unit}})^2 + (${cVal}\\,\\text{${unit}})^2 - 2 \\cdot ${bVal} \\cdot ${cVal} \\cdot \\cos(${alpha}^\\circ)} \\approx ${aStr}\\,\\text{${unit}} \\]`;
					break;
				}

				case 'cosine_law_angle': {
					// 8. KOSINUSSATZ - WINKEL GESUCHT (cos(gamma) = (a² + b² - c²) / (2ab))
					const aVal = randInt(5, 10);
					const bVal = randInt(6, 11);
					const cVal = randInt(Math.max(4, Math.abs(aVal - bVal) + 2), aVal + bVal - 2);

					const cosG = (aVal*aVal + bVal*bVal - cVal*cVal) / (2 * aVal * bVal);
					const gamma = Math.round(toDeg(Math.acos(Math.max(-0.95, Math.min(0.95, cosG)))) * 10) / 10;

					const cosA = (bVal*bVal + cVal*cVal - aVal*aVal) / (2 * bVal * cVal);
					const alpha = Math.round(toDeg(Math.acos(Math.max(-0.95, Math.min(0.95, cosA)))));
					const beta = 180 - alpha - Math.round(gamma);

					const svg = buildGeneralTriangleSvg({
						alphaDeg: alpha,
						betaDeg: beta,
						labels: {
							a: `a = ${aVal} ${unit}`,
							b: `b = ${bVal} ${unit}`,
							c: `c = ${cVal} ${unit}`,
							gamma: `γ = ?`
						},
						highlight: 'gamma',
						unit
					});

					const gammaStr = comma(gamma);
					const cosGStr = comma(cosG.toFixed(3));

					textDisplay = `
						<div style="display:flex;flex-direction:column;align-items:center;gap:0.4rem;">
							<div style="font-weight:600;font-size:1.05rem;">Berechne den Winkel \\( \\gamma \\) mithilfe des Kosinussatzes:</div>
							${svg}
						</div>
					`;
					textPrint = `Berechne den Winkel \\( \\gamma \\) mit dem Kosinussatz: \\( \\gamma = \\) ${blank(2)}°<br>${svg}`;
					s = `\\[ \\cos(\\gamma) = \\frac{a^2 + b^2 - c^2}{2 \\cdot a \\cdot b} = \\frac{(${aVal})^2 + (${bVal})^2 - (${cVal})^2}{2 \\cdot ${aVal} \\cdot ${bVal}} \\approx ${cosGStr} \\]
					\\[ \\gamma = \\arccos(${cosGStr}) \\approx ${gammaStr}^\\circ \\]`;
					break;
				}
			}
			break;
		}
		
	case 'potenzen': {
		const rdLocal = Math.random() + (grade <= 7 ? 0.21 : 0);
		if (rdLocal > 0.6) {
			const value = grade <= 7 ? randInt(0, 13) : randInt(-13, 13);
			const result = value * value;
			const expr = isQuizMode
				? (value < 0 ? `\\[ (${value})^2 = \\]` : `\\[ ${value}^2 = \\]`)
				: (value < 0 ? `\\( (${value})^2 = \\)` : `\\( ${value}^2 = \\)`);
			textDisplay = expr;
			s = isQuizMode
				? (value < 0 ? `\\[ (${value})^2 = ${result} \\]` : `\\[ ${value}^2 = ${result} \\]`)
				: (value < 0 ? `\\( (${value})^2 = ${result} \\)` : `\\( ${value}^2 = ${result} \\)`);
			answer = numericAnswer(result);
		} else if (rdLocal > 0.40) {
			const value = randInt(3, 13);
			textDisplay = isQuizMode
				? `\\[ \\sqrt{${value * value}} = \\]`
				: `\\( \\sqrt{${value * value}} = \\)`;
			s = isQuizMode
				? (grade <= 7
					? `\\[ \\sqrt{${value * value}} = ${value} \\]`
					: `\\[ \\sqrt{${value * value}} = \\pm ${value} \\]`)
				: (grade <= 7
					? `\\( \\sqrt{${value * value}} = ${value} \\)`
					: `\\( \\sqrt{${value * value}} = \\pm ${value} \\)`);
			answer = grade <= 7
				? numericAnswer(value)
				: { kind: 'either', options: [value, -value] };
		} else if (rdLocal > 0.2) {
			const value = randInt(0, 9);
			const result = Math.pow(2, value);
			textDisplay = isQuizMode ? `\\[ 2^${value} = \\]` : `\\( 2^${value} = \\)`;
			s = isQuizMode
				? `\\[ 2^${value} = ${result} \\]`
				: `\\( 2^${value} = ${result} \\)`;
			answer = numericAnswer(result);
		} else {
			const staticTasks = [
				{ expr: `3^3`, result: Math.pow(3, 3) },
				{ expr: `(-3)^3`, result: Math.pow(-3, 3) },
				{ expr: `3^4`, result: Math.pow(3, 4) },
				{ expr: `(-3)^4`, result: Math.pow(-3, 4) },
				{ expr: `4^3`, result: Math.pow(4, 3) },
				{ expr: `(-4)^3`, result: Math.pow(-4, 3) },
				{ expr: `5^3`, result: Math.pow(5, 3) },
				{ expr: `(-5)^3`, result: Math.pow(-5, 3) },
				{ expr: `5^4`, result: Math.pow(5, 4) }
			];
			const randomTask = staticTasks[Math.floor(Math.random() * staticTasks.length)];
			const expr = isQuizMode
				? `\\[ ${randomTask.expr} = \\]`
				: `\\( ${randomTask.expr} = \\)`;
			const solution = isQuizMode
				? `\\[ ${randomTask.expr} = ${randomTask.result} \\]`
				: `\\( ${randomTask.expr} = ${randomTask.result} \\)`;
			textDisplay = expr;
			s = solution;
			answer = numericAnswer(randomTask.result);
		}
		break;
	}
	case 'teiler': {
		if (isQuizMode) {
			// 1. Pool an Zahlen mit interessanten Teilermengen 
			const pool = [8, 10, 12, 13, 15, 16, 18, 19, 20, 25, 27, 28, 29, 30, 33, 35];
			const n = pool[randInt(0, pool.length - 1)];
			// 2. Alle Teiler berechnen
			let teilerArray = [];
			for (let i = 1; i <= n; i++) {
				if (n % i === 0) {
					teilerArray.push(i);
				}
			}
			textDisplay = `Nenne alle Teiler der Zahl ${n}.`;
			let teilerListe = teilerArray.join(', ');
			s = `\\[ T_{${n}} = \\{ ${teilerListe} \\} \\]`;
			answer = listAnswer(teilerArray);
		} else {
			// 1. Pool an Zahlen mit interessanten Teilermengen 
			const pool = [12, 15, 16, 18, 20, 28, 30, 32, 33, 34, 35, 37, 40, 45, 50];
			const n = pool[randInt(0, pool.length - 1)];
			// 2. Alle Teiler berechnen
			let teilerArray = [];
			for (let i = 1; i <= n; i++) {
				if (n % i === 0) {
					teilerArray.push(i);
				}
			}
			textDisplay = `Nenne alle Teiler der Zahl ${n}.`;
			let teilerListe = teilerArray.join(', ');
			s = `\\[ T_{${n}} = \\{ ${teilerListe} \\} \\]`;
		}
		break;
	}
	case 'runden': {
		const useNaturalNumberRound = grade <= 5 || (grade >= 6 && Math.random() < 0.25);
		if (useNaturalNumberRound) {
			const unitNames = ['Zehner', 'Hunderter', 'Tausender'];
			const unit = unitNames[randInt(0, unitNames.length - 1)];
			const factor = unit === 'Zehner' ? 10 : unit === 'Hunderter' ? 100 : 1000;
			const value = randInt(10, 9999);
			const result = Math.round(value / factor) * factor;
			const decisionDigit = factor === 10
				? value % 10
				: factor === 100
					? Math.floor(value / 10) % 10
					: Math.floor(value / 100) % 10;
			const decisionPlace = factor === 10 ? 'Einer' : factor === 100 ? 'Zehner' : 'Hunderter';
			const roundingAction = decisionDigit >= 5 ? 'aufrunden' : 'abrunden';
			textDisplay = `Runde auf ${unit}: \\( \\quad ${comma(value)} \\approx \\) ${blank(2)}`;
			s = `\\[
				${comma(value)} \\approx ${comma(result)}
				\\quad(\\text{${decisionDigit} ${decisionPlace}}
				\\;\\rightarrow\\; \\text{${roundingAction}})
			\\]`;
			answer = { kind: 'number', value: result };
			break;
		}

		const carryBias = 0.4;
		rd = Math.random();
		const intPart = randInt(0, 9);
		let d1, d2, d3;
		const useCarryCase = Math.random() < carryBias;
		if (rd > 0.8) {
			d1 = randInt(2, 9);
			d2 = randInt(0, 9);
			d3 = randInt(0, 9);
		} else if (rd > 0.4) {
			useCarryCase ? d1 = 9 : d1 = randInt(0, 9);
			d2 = randInt(2, 9);
			d3 = randInt(1, 9);
		} else {
			d1 = randInt(0, 9);
			useCarryCase ? d2 = 9 : d2 = randInt(0, 9);
			d3 = randInt(2, 9);
		}
		const v1 = intPart + (d1 * 100 + d2 * 10 + d3) / 1000;
		let target, result, digits;
		if (rd > 0.8) {
			target = 'Ganze';
			result = Math.round(v1);
			digits = 0;
		} else if (rd > 0.4) {
			target = 'Zehntel';
			result = Math.round(v1 * 10) / 10;
			digits = 1;
	} else {
			target = 'Hundertstel';
			result = Math.round(v1 * 100) / 100;
			digits = 2;
		}
		const decisionDigit = rd > 0.8 ? d1 : rd > 0.4 ? d2 : d3;
		const decisionPlace = rd > 0.8 ? 'Zehntel' : rd > 0.4 ? 'Hundertstel' : 'Tausendstel';
		const roundingAction = decisionDigit >= 5 ? 'aufrunden' : 'abrunden';
		textDisplay = `Runde auf ${target}: \\( \\quad ${comma(v1.toFixed(3))} \\approx \\) ${blank(2)}`;
		s = `\\[
			${comma(v1.toFixed(3))} \\approx ${comma(result.toFixed(digits))}
			\\quad(\\text{${decisionDigit} ${decisionPlace}}
			\\;\\rightarrow\\; \\text{${roundingAction}})
		\\]`;
		answer = { kind: 'number', value: result };
		break;
	}
		case 'ueberschlag': {
			const trim2 = (value) => Number(value.toFixed(2));
			const isOneDecimal = (value) => Math.abs(value * 10 - Math.round(value * 10)) < 1e-9;
			const fmtNum = (value) => {
				const v = trim2(value);
				if (Number.isInteger(v)) return `${v}`;
				return comma(v.toFixed(isOneDecimal(v) ? 1 : 2));
			};
			const fmtInt = (value) => `${Math.round(value)}`;

			// Zufällige Verschiebung der Zahlen, damit die Aufgabe „ungenauber“ wirkt,
			// aber trotzdem im Kopf mit einer sinnvollen Überschlagsrechnung gelöst werden kann.
			const addOffset = (value, maxDeltaOverride) => {
				// Für die verschiedenen Teilerbereiche gilt jeweils ein anderes zulässiges Abweichungsfenster.
				const maxDelta = maxDeltaOverride ?? (value < 10 ? 0.45 : (value < 20 ? 1.9 : 4.9));
				// Kleinere Fenster bleiben fein genug für einfache Schätzungsaufgaben.
				const minDelta = maxDelta <= 1.5 ? 0.05 : (maxDelta <= 4.9 ? 0.1 : 0.5);
				// Bei größeren Zahlen werden die Werte eher auf 1 Nachkommastelle gerundet.
				const useTwoDecimals = maxDelta > 4.9 || value >= 100;

				let shifted = value;
				for (let tries = 0; tries < 30; tries++) {
					const sign = Math.random() < 0.5 ? 1 : -1;
					const rawDelta = minDelta + Math.random() * (maxDelta - minDelta);
					const delta = Number((sign * rawDelta).toFixed(useTwoDecimals ? 1 : 2));
					const next = trim2(value + delta);
					if (next > 0 && Math.abs(delta) >= minDelta) {
						shifted = next;
						break;
					}
				}
				return shifted;
			};
			// Fest vorgegebene Teiler, die für Überschlags- Divisionen gut im Kopf zu bewerten sind.
			const allowedDivisors = [5, 10, 20, 30, 50, 100, 200];
			// Die erlaubte Abweichung gilt für den Divisor; der Dividend darf zehnmal so stark abweichen.
			// 5 -> nur ±1,5, 10 bis 50 -> ca. ±4,9, 100 und 200 -> ca. ±19,9.
			const divisorDeviationLimit = (divisor) => {
				if (divisor === 5) return 1.5;
				if (divisor >= 10 && divisor <= 50) return 4.9;
				return 19.9;
			};
			const dividendDeviationLimit = (divisor) => divisorDeviationLimit(divisor) * 10;

			const mode = ['mul', 'div'][randInt(0, 1)];
			let taskExpr = '';
			let roundedExpr = '';
			let estimateResult = 0;

			if (mode === 'mul') {
				// Kleines Einmaleins mit Zehnerpotenzen (gut im Kopf rechenbar)
				const digitA = randInt(2, 9);
				const digitB = randInt(2, 9);
				const scaleOptions = [
					[10, 10], [10, 10], [1, 10], [10, 1],
					[1, 100], [100, 1], [10, 100], [100, 10]
				];
				const [scaleA, scaleB] = scaleOptions[randInt(0, scaleOptions.length - 1)];
				const baseA = digitA * scaleA;
				const baseB = digitB * scaleB;

				const taskA = addOffset(baseA);
				const taskB = addOffset(baseB);

				estimateResult = baseA * baseB;

				taskExpr = `${fmtNum(taskA)} \\cdot ${fmtNum(taskB)}`;
				roundedExpr = `${fmtNum(baseA)} \\cdot ${fmtNum(baseB)}`;
			} else {
				// Diktierte Divisoren mit passender grober Abweichung und kleinen Einmaleins-Faktoren 1, 10 oder 100
				const baseDivisor = allowedDivisors[randInt(0, allowedDivisors.length - 1)];
				const quotientDigit = randInt(2, 9);
				const factor = [1, 10, 100][randInt(0, 2)];
				const baseDividend = quotientDigit * baseDivisor * factor;
				const taskDivisor = addOffset(baseDivisor, divisorDeviationLimit(baseDivisor));
				const taskDividend = addOffset(baseDividend, dividendDeviationLimit(baseDivisor));

				estimateResult = baseDividend / baseDivisor;

				taskExpr = `${fmtNum(taskDividend)} : ${fmtNum(taskDivisor)}`;
				roundedExpr = `${fmtNum(baseDividend)} : ${fmtNum(baseDivisor)}`;
			}

			textDisplay = `Überschlage das Ergebnis: <br>\\( ${taskExpr} \\)`;
			textPrint = `Überschlage das Ergebnis: \\( ${taskExpr} \\approx \\)`;
			s = `z. B. \\( ${taskExpr} \\approx ${roundedExpr} \\approx ${fmtInt(estimateResult)} \\)`;
			break;
		}
		
	case 'lineare_gleichungen': {
		const x = rnd(-12, 12);
		const a = rnd(-12, 12);
		const b = rnd(-20, 20);
		const c = a * x + b;
		const bPart = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
		textDisplay = `Löse die Gleichung schrittweise: <br> \\( ${a}x ${bPart} = ${c} \\)`;
		textPrint = `Löse die Gleichung schrittweise: \\(\\quad ${a}x ${bPart} = ${c} \\qquad |\\)${space(1.5)}`;
		s = `\\[ \\begin{aligned}
		${a}x ${bPart} &= ${c} &&| \\, ${b >= 0 ? '-' : '+'} ${Math.abs(b)} \\\\
		${a}x &= ${c - b} &&| \\, : ${a >= 0 ? a : '(' + a + ')'} \\\\
		x &= ${comma(x)}
		\\end{aligned} \\]`;
		answer = numericAnswer(x);
		break;
	}
	case 'lineare_gleichungen_beidseitig': {
		const x = rnd(-13, 13);
		const a = rnd(-10, 10);
		let c;
		do {
			c = rnd(-10, 10);
		} while (Math.abs(a - c) < 2 || c === 0);
		const b = rnd(-30, 30);
		const d = (a - c) * x + b;
		const bPart = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
		const dPart = d >= 0 ? `+ ${d}` : `- ${Math.abs(d)}`;
		const op1 = c >= 0 ? `- ${c}x` : `+ ${Math.abs(c)}x`;
		const aMinusC = a - c;
		const op2 = b >= 0 ? `- ${b}` : `+ ${Math.abs(b)}`;
		const dMinusB = d - b;
		const divOp = fmt(aMinusC);
		textDisplay = `Löse die Gleichung schrittweise:<br>\\( ${a}x ${bPart} = ${c}x ${dPart} \\)`;
		textPrint = `Löse die Gleichung schrittweise: \\(\\quad ${a}x ${bPart} = ${c}x ${dPart} \\qquad | \\)${space(2)}`;
		s = `\\[ \\begin{aligned}
		${a}x ${bPart} &= ${c}x ${dPart} &&| \\, ${op1} \\\\
		${aMinusC}x ${bPart} &= ${d} &&| \\, ${op2} \\\\
		${aMinusC}x &= ${dMinusB} &&| \\, : ${divOp} \\\\
		x &= ${comma(x)}
		\\end{aligned} \\]`;
		answer = numericAnswer(x);
		break;
	}
	case 'lineare_gleichungen_umstellen': {
		if (isQuizMode) {
			const forms = ['ax+by=c', 'ax+c=by', 'ax=by+c', 'by=ax+c'];
			const form = forms[randInt(0, forms.length - 1)];

			const formatHalf = (val) => Number.isInteger(val) ? `${val}` : comma(val.toFixed(1));
			const cleanHalf = (val) => Math.round(val * 2) / 2;
			const varTerm = (coef, variable, withSign = false) => {
				const abs = Math.abs(coef);
				const base = abs === 1 ? variable : `${abs}${variable}`;
				if (withSign) return `${coef >= 0 ? '+' : '-'} ${base}`;
				return coef < 0 ? `-${base}` : base;
			};
			const invTermOp = (coef, variable) => coef >= 0 ? `- ${varTerm(coef, variable)}` : `+ ${varTerm(-coef, variable)}`;
			const formatLinearExpr = (m, n) => {
				const mm = cleanHalf(m);
				const nn = cleanHalf(n);
				const xPart = mm === 1 ? 'x' : (mm === -1 ? '-x' : `${formatHalf(mm)}x`);
				if (nn === 0) return xPart;
				return `${xPart} ${nn > 0 ? '+' : '-'} ${formatHalf(Math.abs(nn))}`;
			};

			const pickValidForB = (b) => {
				const absB = Math.abs(b);
				const vals = [];
				for (let n = -40; n <= 40; n++) {
					if (n === 0) continue;
					if ((n) % absB === 0) vals.push(n);
				}
				return vals;
			};

			let b_lin, a_lin, c_lin;
			do {
				b_lin = rnd(-12, 12);
				const valid = pickValidForB(b_lin);
				a_lin = valid[randInt(0, valid.length - 1)];
				c_lin = valid[randInt(0, valid.length - 1)];
			} while (!a_lin || !b_lin || !c_lin);

			const aTerm = varTerm(a_lin, 'x');
			const bTerm = varTerm(b_lin, 'y');
			const absATerm = varTerm(Math.abs(a_lin), 'x');
			const cSigned = c_lin >= 0 ? `+ ${Math.abs(c_lin)}` : `- ${Math.abs(c_lin)}`;
			const cOppSigned = c_lin >= 0 ? `- ${Math.abs(c_lin)}` : `+ ${Math.abs(c_lin)}`;

			let textEquation = '';
			let step1 = '';
			let step2 = '';
			let finalStep = '';
			let finalAnswerExpression = '';

			switch (form) {
				case 'ax+by=c': {
					textEquation = `${aTerm} ${varTerm(b_lin, 'y', true)} = ${c_lin}`;
					step1 = `${aTerm} ${varTerm(b_lin, 'y', true)} &= ${c_lin} &&| \\, ${invTermOp(a_lin, 'x')}`;
					step2 = `${bTerm} &= ${c_lin} ${a_lin >= 0 ? '-' : '+'} ${absATerm} &&| \\, : ${fmt(b_lin)}`;
					finalStep = `y &= ${formatLinearExpr(-a_lin / b_lin, c_lin / b_lin)}`;
					finalAnswerExpression = `y = ${formatLinearExpr(-a_lin / b_lin, c_lin / b_lin)}`;
					break;
				}
				case 'ax+c=by': {
					textEquation = `${aTerm} ${cSigned} = ${bTerm}`;
					step1 = `${aTerm} ${cSigned} &= ${bTerm} &&| \\, : ${fmt(b_lin)}`;
					finalStep = `y &= ${formatLinearExpr(a_lin / b_lin, c_lin / b_lin)}`;
					finalAnswerExpression = `y = ${formatLinearExpr(a_lin / b_lin, c_lin / b_lin)}`;
					break;
				}
				case 'ax=by+c': {
					textEquation = `${aTerm} = ${bTerm} ${cSigned}`;
					step1 = `${aTerm} &= ${bTerm} ${cSigned} &&| \\, ${cOppSigned}`;
					step2 = `${aTerm} ${cOppSigned} &= ${bTerm} &&| \\, : ${fmt(b_lin)}`;
					finalStep = `y &= ${formatLinearExpr(a_lin / b_lin, -c_lin / b_lin)}`;
					finalAnswerExpression = `y = ${formatLinearExpr(a_lin / b_lin, -c_lin / b_lin)}`;
					break;
				}
				default: {
					textEquation = `${bTerm} = ${aTerm} ${cSigned}`;
					step1 = `${bTerm} &= ${aTerm} ${cSigned} &&| \\, : ${fmt(b_lin)}`;
					finalStep = `y &= ${formatLinearExpr(a_lin / b_lin, c_lin / b_lin)}`;
					finalAnswerExpression = `y = ${formatLinearExpr(a_lin / b_lin, c_lin / b_lin)}`;
					break;
				}
			}

			textDisplay = `Stelle die Gleichung nach \\( y \\) um: <br>\\( ${textEquation} \\)`;
			textPrint = `Stelle nach \\( y \\) um: \\(\\quad ${textEquation} \\qquad |\\)${space(2)}`;
			s = `\\[ \\begin{aligned}
			${step1} \\\\
			${step2 ? `${step2} \\\\` : ''}
			${finalStep}
			\\end{aligned} \\]`;
			answer = expressionAnswer(finalAnswerExpression);
		} else {
			const forms = ['ax+by=c', 'ax+c=by', 'ax=by+c', 'by=ax+c'];
			const form = forms[randInt(0, forms.length - 1)];

			const formatHalf = (val) => Number.isInteger(val) ? `${val}` : comma(val.toFixed(1));
			const cleanHalf = (val) => Math.round(val * 2) / 2;
			const varTerm = (coef, variable, withSign = false) => {
				const abs = Math.abs(coef);
				const base = abs === 1 ? variable : `${abs}${variable}`;
				if (withSign) return `${coef >= 0 ? '+' : '-'} ${base}`;
				return coef < 0 ? `-${base}` : base;
			};
			const invTermOp = (coef, variable) => coef >= 0 ? `- ${varTerm(coef, variable)}` : `+ ${varTerm(-coef, variable)}`;
			const formatLinearExpr = (m, n) => {
				const mm = cleanHalf(m);
				const nn = cleanHalf(n);
				const xPart = mm === 1 ? 'x' : (mm === -1 ? '-x' : `${formatHalf(mm)}x`);
				if (nn === 0) return xPart;
				return `${xPart} ${nn > 0 ? '+' : '-'} ${formatHalf(Math.abs(nn))}`;
			};

			const pickValidForB = (b) => {
				const absB = Math.abs(b);
				const vals = [];
				for (let n = -40; n <= 40; n++) {
					if (n === 0) continue;
					if ((n) % absB === 0) vals.push(n);
				}
				return vals;
			};

			let b_lin, a_lin, c_lin;
			do {
				b_lin = rnd(-12, 12);
				const valid = pickValidForB(b_lin);
				a_lin = valid[randInt(0, valid.length - 1)];
				c_lin = valid[randInt(0, valid.length - 1)];
			} while (!a_lin || !b_lin || !c_lin);

			const aTerm = varTerm(a_lin, 'x');
			const bTerm = varTerm(b_lin, 'y');
			const absATerm = varTerm(Math.abs(a_lin), 'x');
			const cSigned = c_lin >= 0 ? `+ ${Math.abs(c_lin)}` : `- ${Math.abs(c_lin)}`;
			const cOppSigned = c_lin >= 0 ? `- ${Math.abs(c_lin)}` : `+ ${Math.abs(c_lin)}`;

			let textEquation = '';
			let step1 = '';
			let step2 = '';
			let finalStep = '';

			switch (form) {
				case 'ax+by=c': {
					textEquation = `${aTerm} ${varTerm(b_lin, 'y', true)} = ${c_lin}`;
					step1 = `${aTerm} ${varTerm(b_lin, 'y', true)} &= ${c_lin} &&| \\, ${invTermOp(a_lin, 'x')}`;
					step2 = `${bTerm} &= ${c_lin} ${a_lin >= 0 ? '-' : '+'} ${absATerm} &&| \\, : ${fmt(b_lin)}`;
					finalStep = `y &= ${formatLinearExpr(-a_lin / b_lin, c_lin / b_lin)}`;
					break;
				}
				case 'ax+c=by': {
					textEquation = `${aTerm} ${cSigned} = ${bTerm}`;
					step1 = `${aTerm} ${cSigned} &= ${bTerm} &&| \\, : ${fmt(b_lin)}`;
					finalStep = `y &= ${formatLinearExpr(a_lin / b_lin, c_lin / b_lin)}`;
					break;
				}
				case 'ax=by+c': {
					textEquation = `${aTerm} = ${bTerm} ${cSigned}`;
					step1 = `${aTerm} &= ${bTerm} ${cSigned} &&| \\, ${cOppSigned}`;
					step2 = `${aTerm} ${cOppSigned} &= ${bTerm} &&| \\, : ${fmt(b_lin)}`;
					finalStep = `y &= ${formatLinearExpr(a_lin / b_lin, -c_lin / b_lin)}`;
					break;
				}
				default: {
					textEquation = `${bTerm} = ${aTerm} ${cSigned}`;
					step1 = `${bTerm} &= ${aTerm} ${cSigned} &&| \\, : ${fmt(b_lin)}`;
					finalStep = `y &= ${formatLinearExpr(a_lin / b_lin, c_lin / b_lin)}`;
					break;
				}
			}

			textDisplay = `Stelle die Gleichung nach \\( y \\) um: <br>\\( ${textEquation} \\)`;
			textPrint = `Stelle nach \\( y \\) um: \\(\\quad ${textEquation} \\qquad |\\)${space(2)}`;
			s = `\\[ \\begin{aligned}
			${step1} \\\\
			${step2 ? `${step2} \\\\` : ''}
			${finalStep}
			\\end{aligned} \\]`;
		}
		break;
	}
			case 'formel_umstellen': {
				const formeln = [
				// --- FLÄCHENINHALT DREIECK ---
				{
					textPrint: `Stelle nach \\( g \\) um: \\( \\quad A = \\frac{1}{2} \\, g \\, h \\quad | \\) ${space(1.5)}`,
					textDisplay: `Stelle nach \\( g \\) um: \\( \\quad A = \\frac{1}{2} \\, g \\, h \\)`,
					steps: [
						{ eq: `A &= \\tfrac{1}{2} \\, g \\, h`,   op: `\\cdot 2` },
						{ eq: `2\\,A &= g \\, h`,               op: `: h` },
						{ eq: `2\\,A : h &= g`,            op: null }
					]
				},
				{
					textPrint: `Stelle nach \\( h \\) um: \\( \\quad A = \\frac{1}{2} \\, g \\, h \\quad |\\) ${space(1.5)}`,
					textDisplay: `Stelle nach \\( h \\) um: \\( \\quad A = \\frac{1}{2} \\, g \\, h \\)`,
					steps: [
						{ eq: `A &= \\tfrac{1}{2} \\, g \\, h`,   op: `\\cdot 2` },
						{ eq: `2\\,A &= g \\, h`,               op: `: g` },
						{ eq: `2\\,A : g &= h`,            op: null }
					]
				},
				// --- KREISFLÄCHE ---
				{
					textPrint: `Stelle nach \\( r \\) um: \\( \\quad A = \\pi \\cdot r^2 \\quad | \\) ${space(1.5)}`,
					textDisplay: `Stelle nach \\( r \\) um: \\( \\quad A = \\pi \\cdot r^2 \\)`,
					steps: [
						{ eq: `A &= \\pi \\cdot r^2`,            op: `: \\pi` },
						{ eq: `A : \\pi &= r^2`,         op: `\\sqrt{\\phantom{0}}` },
						{ eq: `\\sqrt{A : \\pi} &= r`,   op: null }
					]
				},
				// --- KREISUMFANG ---
				{
					textPrint: `Stelle nach \\( r \\) um: \\( \\quad u = 2 \\cdot \\pi \\cdot r \\quad | \\) ${space(1.5)}`,
					textDisplay: `Stelle nach \\( r \\) um: \\( \\quad u = 2 \\cdot \\pi \\cdot r \\)`,
					steps: [
						{ eq: `u &= 2 \\cdot \\pi \\cdot r`,    op: `: 2` },
						{ eq: `\\dfrac{u}{2} &= \\pi \\cdot r`, op: `: \\pi` },
						{ eq: `\\dfrac{u}{2\\pi} &= r`,          op: null }
					]
				},
				// --- TRAPEZ ---
				{
					textPrint: `Stelle nach \\( a \\) um: \\( \\quad A = \\frac{1}{2} (a+c) \\cdot h \\quad | \\) ${space(2)}`,
					textDisplay: `Stelle nach \\( a \\) um: \\( \\quad A = \\frac{1}{2} (a+c) \\cdot h \\)`,
					steps: [
						{ eq: `A &= \\tfrac{1}{2} (a+c) \\cdot h`, op: `\\cdot 2` },
						{ eq: `2 \\, A &= (a + c) \\cdot h`,             op: `: h` },
						{ eq: `2 \\, A : h &= a + c`,            op: `- c` },
						{ eq: `2 \\, A : h - c &= a`,            op: null }
					]
				},
				{
					textPrint: `Stelle nach \\( h \\) um: \\( \\quad A = \\frac{1}{2} (a+c) \\cdot h \\quad | \\) ${space(1.5)}`,
					textDisplay: `Stelle nach \\( h \\) um: \\( \\quad A = \\frac{1}{2} (a+c) \\cdot h \\)`,
					steps: [
						{ eq: `A &= \\tfrac{1}{2} (a+c) \\cdot h`, op: `\\cdot 2` },
						{ eq: `2 \\, A &= (a + c) \\cdot h`,       op: `: (a+c)` },
						{ eq: `\\dfrac{2 \\, A}{a+c} &= h`,              op: null }
					]
				},
				// --- RECHTECKUMFANG ---
				{
					textPrint: `Stelle nach \\( a \\) um: \\( \\quad u = 2 \\, (a + b) \\quad | \\) ${space(1.5)}`,
					textDisplay: `Stelle nach \\( a \\) um: \\( \\quad u = 2 \\, (a + b) \\)`,
					steps: [
						{ eq: `u &= 2 \\, (a + b)`,           op: `: 2` },
						{ eq: `u : 2 &= a + b`,          op: `- b` },
						{ eq: `u : 2 - b &= a`,          op: null }
					]
				},
				// --- KUGELOBERFLÄCHE ---
				{
					textPrint: `Stelle nach \\( r \\) um: \\( \\quad A_O = 4 \\, \\pi \\, r^2 \\quad | \\) ${space(1.5)}`,
					textDisplay: `Stelle nach \\( r \\) um: \\( \\quad A_O = 4 \\, \\pi \\, r^2 \\)`,
					steps: [
						{ eq: `A_O &= 4 \\, \\pi \\, r^2`,       op: `: (4\\,\\pi)` },
						{ eq: `A_O : (4\\,\\pi) &= r^2`,             op: `\\sqrt{\\phantom{0}}` },
						{ eq: `\\sqrt{A_O : (4\\,\\pi)} &= r`,       op: null }
					]
				},
				// --- QUADERVOLUMEN ---
				{
					textPrint: `Stelle nach \\( a \\) um: \\( \\quad V = a \\cdot b \\cdot c \\quad | \\) ${space(1.5)}`,
					textDisplay: `Stelle nach \\( a \\) um: \\( \\quad V = a \\cdot b \\cdot c \\)`,
					steps: [
						{ eq: `V &= a \\cdot b \\cdot c`,            op: `: b` },
						{ eq: `V : b &= a \\cdot c`,         op: `: c` },
						{ eq: `V : b : c &= a`,         op: null }
					]
				},
				// --- ZYLINDERVOLUMEN nach h ---
				{
					textPrint: `Stelle nach \\( h \\) um: \\( \\quad V = \\pi \\cdot r^2 \\cdot h \\quad | \\) ${space(1.5)}`,
					textDisplay: `Stelle nach \\( h \\) um: \\( \\quad V = \\pi \\cdot r^2 \\cdot h \\)`,
					steps: [
						{ eq: `V &= \\pi \\cdot r^2 \\cdot h`,       op: `: r^2` },
						{ eq: `\\dfrac{V}{r^2} &= \\pi \\cdot h`,    op: `: \\pi` },
						{ eq: `\\dfrac{V}{\\pi r^2} &= h`,            op: null }
					]
				},
				// --- KEGELVOLUMEN nach r ---
				{
					textPrint: `Stelle nach \\( r \\) um: \\( \\quad V = \\tfrac{1}{3} \\, \\pi \\, r^2 \\, h \\quad | \\) ${space(2)}`,
					textDisplay: `Stelle nach \\( r \\) um: \\( \\quad V = \\tfrac{1}{3} \\, \\pi \\, r^2 \\, h \\)`,
					steps: [
						{ eq: `V &= \\tfrac{1}{3} \\, \\pi \\, r^2 \\, h`, op: `\\cdot 3` },
						{ eq: `3 \\, V &= \\pi \\, r^2 \\, h`,             op: `: (\\pi \\, h)` },
						{ eq: `3 \\, V : (\\pi \\, h) &= r^2`,                 op: `\\sqrt{\\phantom{0}}` },
						{ eq: `\\sqrt{3 \\, V : (\\pi \\, h)} &= r`,           op: null }
					]
				},
				// --- PYTHAGORAS ---
				{
					textPrint: `Stelle nach \\( a \\) um: \\( \\quad a^2 + b^2 = c^2 \\quad |\\) ${space(1.4)}`,
					textDisplay: `Stelle nach \\( a \\) um: \\( \\quad a^2 + b^2 = c^2 \\)`,
					steps: [
						{ eq: `a^2 + b^2 &= c^2`,                 op: `- b^2` },
						{ eq: `a^2 &= c^2 - b^2`,                  op: `\\sqrt{\\phantom{0}}` },
						{ eq: `a &= \\sqrt{c^2 - b^2}`,            op: null }
					]
				},
				// --- GESCHWINDIGKEIT ---
				{
					textPrint: `Stelle nach \\( t \\) um: \\( \\quad v = \\frac{s}{t} \\quad | \\) ${space(1.4)}`,
					textDisplay: `Stelle nach \\( t \\) um: \\( \\quad v = \\frac{s}{t} \\)`,
					steps: [
						{ eq: `v &= \\dfrac{s}{t}`,                op: `\\cdot t` },
						{ eq: `v \\cdot t &= s`,                    op: `: v` },
						{ eq: `\\dfrac{s}{v} &= t`,                 op: null }
					]
				},
				// --- WEG-ZEIT-BESCHLEUNIGUNG ---
				{
					textPrint: `Stelle nach \\( a \\) um: \\( \\quad s = \\frac{1}{2} \\cdot a \\cdot t^2 \\quad | \\) ${space(1.4)}`,
					textDisplay: `Stelle nach \\( a \\) um: \\( \\quad s = \\frac{1}{2} \\cdot a \\cdot t^2 \\)`,
					steps: [
						{ eq: `s &= \\tfrac{1}{2} \\cdot a \\cdot t^2`, op: `\\cdot 2` },
						{ eq: `2\\,s &= a \\cdot t^2`,                       op: `: t^2` },
						{ eq: `2\\,s : t^2 &= a`,                    op: null }
					]
				},
				// --- Sinus ---
				{
					textPrint: `Stelle nach \\( \\beta \\) um: \\( \\quad a = \\dfrac{b}{\\sin \\beta} \\quad | \\) ${space(2)}`,
					textDisplay: `Stelle nach \\( \\beta \\) um: \\( \\quad a = \\dfrac{b}{\\sin \\beta} \\)`,
					steps: [
						{ eq: `a &= \\dfrac{b}{\\sin \\beta}`,          op: `\\cdot \\sin \\beta` },
						{ eq: `a \\cdot \\sin \\beta &= b`,             op: `: a` },
						{ eq: `\\sin \\beta &= \\dfrac{b}{a}`,          op: `\\sin^{-1}` },
						{ eq: `\\sin^{-1} \\left( \\dfrac{b}{a} \\right) &= \\beta`, op: null }
					]
				}
				// --- Kosinussatz ---
				// {
				// 	textPrint: `Stelle nach \\( \\gamma \\) um: \\( \\quad c^2 = a^2 + b^2 - 2 \\, a \\, b \\, \\cos \\gamma \\quad | \\) ${space(2)}`,
				// 	textDisplay: `Stelle nach \\( \\gamma \\) um: \\( \\quad c^2 = a^2 + b^2 - 2 \\, a \\, b \\, \\cos \\gamma \\)`,
				// 	steps: [
				// 		{ eq: `c^2 &= a^2 + b^2 - 2 \\, a \\, b \\, \\cos \\gamma`, op: `- a^2 -b^2` },
				// 		{ eq: `c^2 -a^2 - b^2 &= - 2 \\, a \\, b \\, \\cos \\gamma`, op: `: - (2 \\, a \\, b)` },
				// 		{ eq: `\\dfrac{c^2 -a^2 - b^2}{- (2 \\, a \\, b)} &= \\cos \\gamma`, op: `\\cos^{-1}` },
				// 		{ eq: `\\cos^{-1} \\left( \\dfrac{c^2 -a^2 - b^2}{- (2 \\, a \\, b)} \\right) &= \\gamma`, op: null }
				// 	]
				// }
			];

			const f = formeln[randInt(0, formeln.length - 1)];
			const alignLines = f.steps.map(step =>
				step.op !== null
					? `${step.eq} &&| \\, ${step.op}`
					: step.eq
			).join(' \\\\\n\t\t\t\t');

			textDisplay = f.textDisplay;
			textPrint = f.textPrint;
			
			s = `\\[ \\begin{aligned}\n\t\t\t\t${alignLines}\n\t\t\t\\end{aligned} \\]`;
			break;
		}
		
	case 'terme_zusammenfassen':
	case 'terme_umformen':
	case 'terme': {
		if (isQuizMode) {
			const vars = ['x', 'y', 'z', 'a', 'b'];
			let selectedVars = fisherYatesShuffle(vars).slice(0, 2);
			if (Math.random() < 0.5) selectedVars[1] = '';
			
			const isSummaryTask = type === 'terme_zusammenfassen';
			const isLegacyTask = type === 'terme';
			let mode = isSummaryTask
				? 0
				: isLegacyTask
					? (grade >= 9 ? randInt(0, 3) : 0)
					: randInt(1, 3);
			let taskStr, resStr;
			let expandedStep = '';
			
			if (mode === 0) {
				// --- TYP: ZUSAMMENFASSEN ---
				const useThreeTermTypes = Math.random() < 0.35;
				const termTypes = useThreeTermTypes
					? [selectedVars[0], selectedVars[1] || fisherYatesShuffle(vars.filter(v => v !== selectedVars[0]))[0], '']
					: [selectedVars[0], selectedVars[1]];
				const numGlieder = useThreeTermTypes ? 5 : randInt(4, 5);
				const typeSequence = useThreeTermTypes
					? [0, 0, 1, 1, 2]
					: numGlieder === 4 ? [0, 0, 1, 1] : [0, 0, 1, 1, 0];
				let glieder = [];
				let usedCombinations = new Set();
				let counts = Object.fromEntries(termTypes.map(v => [v, 0]));

				for (let i = 0; i < numGlieder; i++) {
					const v = termTypes[typeSequence[i]];
					
					let val, combo;
					do {
						let coef = randInt(1, 12);
						let sign = Math.random() < 0.5 ? 1 : -1;
						val = coef * sign;
						combo = `${val}${v}`;
					} while (usedCombinations.has(combo));

					usedCombinations.add(combo);
					counts[v] += val;
					let absCoef = Math.abs(val);
					let coefStr = (absCoef === 1 && v !== '') ? '' : absCoef;
					glieder.push({ val: val, v: v, text: `${coefStr}${v}` });
				}

				for (let i = glieder.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[glieder[i], glieder[j]] = [glieder[j], glieder[i]];
				}

				taskStr = glieder.map((g, idx) => {
					let sStr = g.val > 0 ? '+ ' : '- ';
					if (idx === 0) sStr = g.val > 0 ? '' : '-';
					return `${sStr}${g.text}`;
				}).join(' ').trim();

				let resParts = [];
				termTypes.forEach(v => {
					let total = counts[v];
					if (total !== 0) {
						let sStr = total > 0 ? (resParts.length === 0 ? '' : '+ ') : '- ';
						if (resParts.length === 0 && total < 0) sStr = '-';
						let absT = Math.abs(total);
						let cStr = (absT === 1 && v !== '') ? '' : absT;
						resParts.push(`${sStr}${cStr}${v}`);
					}
				});
				resStr = resParts.length === 0 ? '0' : resParts.join(' ').trim();
				answer = expressionAnswer(resStr, { termMode: 'collect' });
				textDisplay = `Fasse zusammen: <br>\\( ${taskStr} \\)`;
				textPrint = `Fasse zusammen: \\(\\quad ${taskStr} = \\) ${space(0.5)}`;

			} else if (mode === 1) {
				// --- TYP: KLAMMER AUFLÖSEN ---
				let v = selectedVars[0] || 'x';
				let cVarCoef = rnd(-9, 9);
				let cNum = rnd(-12, 12);

				const useVarFactor = v !== '' && Math.random() < 0.5;
				const fmtFactorVar = (coef, variable) => {
					if (coef === 1) return variable;
					if (coef === -1) return fmt(`-${variable}`);
					return fmt(`${coef}${variable}`);
				};
				const fmtProductFactor = (factorText, termText) => `${fmt(factorText)} \\cdot ${fmt(termText)}`;

				let factorCoef, fDisplay;
				if (useVarFactor) {
					factorCoef = rnd(-5, 5);
					while (factorCoef === 0) factorCoef = rnd(-5, 5);
					fDisplay = fmtFactorVar(factorCoef, v);
				} else {
					factorCoef = rnd(-7, 7);
					while (factorCoef === 0) factorCoef = rnd(-7, 7);
					fDisplay = fmt(factorCoef);
				}

				taskStr = `${fDisplay} (${cVarCoef}${v} ${cNum > 0 ? '+' : '-'} ${Math.abs(cNum)})`;

				if (useVarFactor) {
					const resVV = factorCoef * cVarCoef;
					const resV  = factorCoef * cNum;
					const term1 = fmtProductFactor(fDisplay, `${cVarCoef}${v}`);
					const term2 = fmtProductFactor(fDisplay, Math.abs(cNum));

					let p1 = resVV === 1  ? `${v}^2`
					       : resVV === -1 ? `-${v}^2`
					       :               `${resVV}${v}^2`;
					let p2 = resV === 0   ? ''
					       : resV > 0     ? ` + ${resV}${v}`
					       :               ` - ${Math.abs(resV)}${v}`;
					const step = cNum > 0 ? `${term1} + ${term2}` : `${term1} - ${term2}`;
					const finalRes = `${p1}${p2}`.trim();
					resStr = `${step} = ${finalRes}`;
					answer = expressionAnswer(finalRes, { termMode: 'expand' });
				} else {
					const resV = factorCoef * cVarCoef;
					const resN = factorCoef * cNum;
					const term1 = fmtProductFactor(fDisplay, `${cVarCoef}${v}`);
					const term2 = fmtProductFactor(fDisplay, Math.abs(cNum));
					let p1 = resV === 1  ? v
					       : resV === -1 ? `-${v}`
					       :              `${resV}${v}`;
					let p2 = resN > 0 ? `+ ${resN}` : `- ${Math.abs(resN)}`;
					const step = cNum > 0 ? `${term1} + ${term2}` : `${term1} - ${term2}`;
					const finalRes = `${p1} ${p2}`.trim();
					resStr = `${step} = ${finalRes}`;
					answer = expressionAnswer(finalRes, { termMode: 'expand' });
				}

				textDisplay = `Löse die Klammer auf: <br>\\( ${taskStr} \\)`;
				textPrint = `Löse die Klammer auf: \\(\\quad ${taskStr} = \\)`;
			} else if (mode === 2) {
				// --- TYP: AUSKLAMMERN ---
				let v = selectedVars[0] || 'x';
				let w = selectedVars[1] || '';
				const getGcd = mathUtils.getGcd;
				const commonCoef = rnd(2, 6);
				let a, b;
				do {
					a = rnd(2, 9);
					b = rnd(2, 9);
				} while (getGcd(a, b) !== 1);
				const sign = Math.random() < 0.5 ? 1 : -1;
				const commonFactorHasVar = w !== '' && Math.random() < 0.5;
				const extraInFirst = w !== '' && Math.random() < 0.5;
				let term1Vars, term2Vars;

				if (w === '') {
					term1Vars = v;
					term2Vars = '';
				} else if (commonFactorHasVar) {
					term1Vars = v + (extraInFirst ? w : '');
					term2Vars = v + (!extraInFirst ? w : '');
				} else {
					term1Vars = extraInFirst ? w : v;
					term2Vars = !extraInFirst ? w : v;
				}
				const term1Coef = commonCoef * a;
				const term2Coef = commonCoef * b;

				const fmtInner = (coef, variable) => {
					if (variable === '') return `${coef}`;
					if (coef === 1) return variable;
					return `${coef}${variable}`;
				};

				const term1Text = `${fmt(term1Coef)}${term1Vars}`;
				const term2Text = `${fmt(term2Coef)}${term2Vars}`;
				taskStr = `${term1Text} ${sign === 1 ? '+' : '-'} ${term2Text}`;

				const commonFactorText = commonFactorHasVar ? `${fmt(commonCoef)}${v}` : fmt(commonCoef);
				const inner1 = fmtInner(a, commonFactorHasVar ? (extraInFirst ? w : '') : term1Vars);
				const inner2 = fmtInner(b, commonFactorHasVar ? (!extraInFirst ? w : '') : term2Vars);
				const innerSign = sign === 1 ? '+' : '-';
				resStr = `${commonFactorText}(${inner1} ${innerSign} ${inner2})`;
				answer = expressionAnswer(resStr, { termMode: 'factor' });

				textDisplay = `Klammere vollständig aus: <br>\\( ${taskStr} \\)`;
				textPrint = `Klammere vollständig aus: \\(\\quad ${taskStr} = \\)`;
			} else if (mode === 3) {
				// --- TYP: MINUSKLAMMER AUFLÖSEN ---
				let v = selectedVars[0] || 'x';
				const termText = (coef, variable) => {
					if (variable === '') return `${coef}`;
					if (coef === 1) return variable;
					if (coef === -1) return `-${variable}`;
					return `${coef}${variable}`;
				};

				const plusInside = Math.random() < 0.5;
				const a = rnd(2, 9);
				const b = rnd(2, 9);

				const rightTerm = termText(b, v);
				taskStr = `-(${a} ${plusInside ? '+' : '-'} ${rightTerm})`;
				resStr = `-${a} ${plusInside ? '-' : '+'} ${rightTerm}`;
				answer = expressionAnswer(resStr, { termMode: 'expand' });

				textDisplay = `Löse die Minusklammer auf: <br>\\( ${taskStr} \\)`;
				textPrint = `Löse die Minusklammer auf: \\(\\quad ${taskStr} = \\)`;
			}
			s = `\\[ ${taskStr} = ${resStr} \\]`;

		} else {
			const vars = ['x', 'y', 'z', 'a', 'b'];
			let selectedVars = fisherYatesShuffle(vars).slice(0, 2);
			if (Math.random() < 0.5) selectedVars[1] = '';
			
			const isSummaryTask = type === 'terme_zusammenfassen';
			const isLegacyTask = type === 'terme';
			let mode = isSummaryTask
				? 0
				: isLegacyTask
					? (grade >= 9 ? randInt(0, 4) : 0)
					: randInt(1, 4);
			let taskStr, resStr;
			
			if (mode === 0) {
				// --- TYP: ZUSAMMENFASSEN ---
				const useThreeTermTypes = Math.random() < 0.35;
				const termTypes = useThreeTermTypes
					? [selectedVars[0], selectedVars[1] || fisherYatesShuffle(vars.filter(v => v !== selectedVars[0]))[0], '']
					: [selectedVars[0], selectedVars[1]];
				const numGlieder = useThreeTermTypes ? 5 : randInt(4, 5); // Drei Typen müssen jeweils vorkommen
				const typeSequence = useThreeTermTypes
					? [0, 0, 1, 1, 2]
					: numGlieder === 4 ? [0, 0, 1, 1] : [0, 0, 1, 1, 0];
				let glieder = [];
				let usedCombinations = new Set();
				let counts = Object.fromEntries(termTypes.map(v => [v, 0]));

				for (let i = 0; i < numGlieder; i++) {
					const v = termTypes[typeSequence[i]];
					
					let val, combo;
					do {
						let coef = randInt(1, 12);
						let sign = Math.random() < 0.5 ? 1 : -1;
						val = coef * sign;
						combo = `${val}${v}`;
					} while (usedCombinations.has(combo));

					usedCombinations.add(combo);
					counts[v] += val;
					
					// Wir speichern hier nur die Rohdaten, das Vorzeichen-Handling 
					// machen wir nach dem Mischen für das erste Glied neu.
					let absCoef = Math.abs(val);
					let coefStr = (absCoef === 1 && v !== '') ? '' : absCoef;
					glieder.push({ val: val, v: v, text: `${coefStr}${v}` });
				}

				// Glieder mischen
				for (let i = glieder.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[glieder[i], glieder[j]] = [glieder[j], glieder[i]];
				}

				// TaskString bauen mit korrektem Vorzeichen-Handling
				taskStr = glieder.map((g, idx) => {
					let sStr = g.val > 0 ? '+ ' : '- ';
					if (idx === 0) sStr = g.val > 0 ? '' : '-';
					return `${sStr}${g.text}`;
				}).join(' ').trim();

				// Ergebnis berechnen
				let resParts = [];
				termTypes.forEach(v => {
					let total = counts[v];
					if (total !== 0) {
						let sStr = total > 0 ? (resParts.length === 0 ? '' : '+ ') : '- ';
						if (resParts.length === 0 && total < 0) sStr = '-';
						let absT = Math.abs(total);
						let cStr = (absT === 1 && v !== '') ? '' : absT;
						resParts.push(`${sStr}${cStr}${v}`);
					}
				});
				resStr = resParts.length === 0 ? '0' : resParts.join(' ').trim();
				textDisplay = `Fasse zusammen: <br>\\( ${taskStr} \\)`;
				textPrint = `Fasse zusammen: \\(\\quad ${taskStr} = \\)`;

			} else if (mode === 1) {
				// --- TYP: KLAMMER AUFLÖSEN ---
				let v = selectedVars[0] || 'x';
				let cVarCoef = rnd(-9, 9);
				let cNum = rnd(-12, 12);

				// Mit 50% Chance ist der Faktor selbst eine Variable (z.B. 3x), sonst eine Zahl
				const useVarFactor = v !== '' && Math.random() < 0.5;
				const fmtFactorVar = (coef, variable) => {
					if (coef === 1) return variable;
					if (coef === -1) return fmt(`-${variable}`);
					return fmt(`${coef}${variable}`);
				};
				const fmtProductFactor = (factorText, termText) => `${fmt(factorText)} \\cdot ${fmt(termText)}`;

				let factorCoef, fDisplay;
				if (useVarFactor) {
					factorCoef = rnd(-5, 5);
					while (factorCoef === 0) factorCoef = rnd(-5, 5);
					fDisplay = fmtFactorVar(factorCoef, v);
				} else {
					factorCoef = rnd(-7, 7);
					while (factorCoef === 0) factorCoef = rnd(-7, 7);
					fDisplay = fmt(factorCoef);
				}

				taskStr = `${fDisplay} (${cVarCoef}${v} ${cNum > 0 ? '+' : '-'} ${Math.abs(cNum)})`;

				if (useVarFactor) {
					// Ergebnis enthält v² und v
					const resVV = factorCoef * cVarCoef;
					const resV  = factorCoef * cNum;
					const term1 = fmtProductFactor(fDisplay, `${cVarCoef}${v}`);
					const term2 = fmtProductFactor(fDisplay, Math.abs(cNum));

					let p1 = resVV === 1  ? `${v}^2`
					       : resVV === -1 ? `-${v}^2`
					       :               `${resVV}${v}^2`;
					let p2 = resV === 0   ? ''
					       : resV > 0     ? ` + ${resV}${v}`
					       :               ` - ${Math.abs(resV)}${v}`;
					const step = cNum > 0 ? `${term1} + ${term2}` : `${term1} - ${term2}`;
					resStr = `\\begin{aligned} ${taskStr} &= ${step} \\\\ &= ${p1}${p2} \\end{aligned}`;
				} else {
					const resV = factorCoef * cVarCoef;
					const resN = factorCoef * cNum;
					const term1 = fmtProductFactor(fDisplay, `${cVarCoef}${v}`);
					const term2 = fmtProductFactor(fDisplay, Math.abs(cNum));
					let p1 = resV === 1  ? v
					       : resV === -1 ? `-${v}`
					       :              `${resV}${v}`;
					let p2 = resN > 0 ? `+ ${resN}` : `- ${Math.abs(resN)}`;
					const step = cNum > 0 ? `${term1} + ${term2}` : `${term1} - ${term2}`;
					resStr = `\\begin{aligned} ${taskStr} &= ${step} \\\\ &= ${p1} ${p2} \\end{aligned}`;
				}

				textDisplay = `Löse die Klammer auf: <br>\\( ${taskStr} \\)`;
				textPrint = `Löse die Klammer auf: \\(\\quad ${taskStr} = \\)`;
			} else if (mode === 2) {
				// --- TYP: AUSKLAMMERN ---
				let v = selectedVars[0] || 'x';
				let w = selectedVars[1] || '';
				const getGcd = mathUtils.getGcd;
				const commonCoef = rnd(2, 6);
				let a, b;
				do {
					a = rnd(2, 9);
					b = rnd(2, 9);
				} while (getGcd(a, b) !== 1);
				const sign = Math.random() < 0.5 ? 1 : -1;
				const commonFactorHasVar = w !== '' && Math.random() < 0.5;
				const extraInFirst = w !== '' && Math.random() < 0.5;
				let term1Vars, term2Vars;

				if (w === '') {
					term1Vars = v;
					term2Vars = '';
				} else if (commonFactorHasVar) {
					term1Vars = v + (extraInFirst ? w : '');
					term2Vars = v + (!extraInFirst ? w : '');
				} else {
					term1Vars = extraInFirst ? w : v;
					term2Vars = !extraInFirst ? w : v;
				}
				const term1Coef = commonCoef * a;
				const term2Coef = commonCoef * b;

				const fmtInner = (coef, variable) => {
					if (variable === '') return `${coef}`;
					if (coef === 1) return variable;
					return `${coef}${variable}`;
				};

				const term1Text = `${fmt(term1Coef)}${term1Vars}`;
				const term2Text = `${fmt(term2Coef)}${term2Vars}`;
				taskStr = `${term1Text} ${sign === 1 ? '+' : '-'} ${term2Text}`;

				const commonFactorText = commonFactorHasVar ? `${fmt(commonCoef)}${v}` : fmt(commonCoef);
				const inner1 = fmtInner(a, commonFactorHasVar ? (extraInFirst ? w : '') : term1Vars);
				const inner2 = fmtInner(b, commonFactorHasVar ? (!extraInFirst ? w : '') : term2Vars);
				const innerSign = sign === 1 ? '+' : '-';
				resStr = `${commonFactorText}(${inner1} ${innerSign} ${inner2})`;

				textDisplay = `Klammere vollständig aus: <br>\\( ${taskStr} \\)`;
				textPrint = `Klammere vollständig aus: \\(\\quad ${taskStr} = \\) ${space(0.5)}`;
			} else if (mode === 3) {
				// --- TYP: KLAMMER AUFLÖSEN UND ZUSAMMENFASSEN ---
				let v = selectedVars[0] || 'x';
				const useMinusBracket = Math.random() < 0.5;
				let factor, a, b, c, d;
				let coeff, constTerm;
				let expandedStr;
				const formatTerms = (terms) => terms.map(({ sign, text }, index) => {
					if (index === 0) return sign < 0 ? `-${text}` : text;
					return `${sign < 0 ? '-' : '+'} ${text}`;
				}).join(' ');
				if (useMinusBracket) {
					do {
						a = rnd(2, 9);
						b = rnd(-8, 8);
						while (b === 0) b = rnd(-8, 8);
						c = rnd(-9, 9);
						while (c === 0) c = rnd(-9, 9);
						d = rnd(-9, 9);
						while (d === 0) d = rnd(-9, 9);
						coeff = -a + c;
						constTerm = -b + d;
					} while (coeff === 0 || constTerm === 0);

					const termB = Math.abs(b);
					const termC = Math.abs(c);
					const termD = Math.abs(d);
					const terms = [
						{
							sign: -1,
							text: `(${a}${v} ${b >= 0 ? '+' : '-'} ${termB})`,
							expanded: [
								{ sign: -1, text: `${a}${v}` },
								{ sign: b >= 0 ? -1 : 1, text: `${termB}` }
							]
						},
						{
							sign: Math.sign(c),
							text: `${termC}${v}`,
							expanded: [{ sign: Math.sign(c), text: `${termC}${v}` }]
						},
						{
							sign: Math.sign(d),
							text: `${termD}`,
							expanded: [{ sign: Math.sign(d), text: `${termD}` }]
						}
					];
					const bracketTerm = terms.shift();
					terms.splice(randInt(0, terms.length), 0, bracketTerm);
					taskStr = formatTerms(terms);
					expandedStr = formatTerms(terms.flatMap(term => term.expanded));
				} else {
					do {
						factor = rnd(2, 6) * (Math.random() < 0.7 ? -1 : 1);
						a = rnd(2, 9);
						b = rnd(-8, 8);
						while (b === 0) b = rnd(-8, 8);
						c = rnd(-9, 9);
						while (c === 0) c = rnd(-9, 9);
						d = rnd(-9, 9);
						while (d === 0) d = rnd(-9, 9);
						coeff = factor * a + c;
						constTerm = factor * b + d;
					} while (coeff === 0 || constTerm === 0);

					const termB = Math.abs(b);
					const termC = Math.abs(c);
					const termD = Math.abs(d);
					const terms = [
						{
							sign: Math.sign(factor),
							text: `${Math.abs(factor)}(${a}${v} ${b >= 0 ? '+' : '-'} ${termB})`,
							expanded: [
								{ sign: Math.sign(factor), text: `${Math.abs(factor) * a}${v}` },
								{ sign: Math.sign(factor) * (b >= 0 ? 1 : -1), text: `${Math.abs(factor) * termB}` }
							]
						},
						{
							sign: Math.sign(c),
							text: `${termC}${v}`,
							expanded: [{ sign: Math.sign(c), text: `${termC}${v}` }]
						},
						{
							sign: Math.sign(d),
							text: `${termD}`,
							expanded: [{ sign: Math.sign(d), text: `${termD}` }]
						}
					];
					const bracketTerm = terms.shift();
					terms.splice(randInt(0, terms.length), 0, bracketTerm);
					taskStr = formatTerms(terms);
					expandedStr = formatTerms(terms.flatMap(term => term.expanded));
				}

				let resParts = [];
				if (coeff !== 0) {
					let sStr = coeff > 0 ? (resParts.length === 0 ? '' : '+ ') : '- ';
					if (resParts.length === 0 && coeff < 0) sStr = '-';
					const absCoeff = Math.abs(coeff);
					const cStr = (absCoeff === 1 && v !== '') ? '' : absCoeff;
					resParts.push(`${sStr}${cStr}${v}`);
				}
				if (constTerm !== 0) {
					let sStr = constTerm > 0 ? (resParts.length === 0 ? '' : '+ ') : '- ';
					if (resParts.length === 0 && constTerm < 0) sStr = '-';
					resParts.push(`${sStr}${Math.abs(constTerm)}`);
				}
				const combinedStr = resParts.length === 0 ? '0' : resParts.join(' ').trim();
				resStr = `\\begin{aligned} ${taskStr} &= ${expandedStr} \\\\ &= ${combinedStr} \\end{aligned}`;

				textDisplay = `Löse die Klammer auf und fasse zusammen: <br>\\( ${taskStr} \\)`;
				textPrint = `Vereinfache maximal: \\(\\quad ${taskStr} = \\) ${space(0.5)}`;
			} else if (mode === 4) {
				// --- TYP: MINUSKLAMMER AUFLÖSEN ---
				let v = selectedVars[0] || 'x';
				const termText = (coef, variable) => {
					if (variable === '') return `${coef}`;
					if (coef === 1) return variable;
					if (coef === -1) return `-${variable}`;
					return `${coef}${variable}`;
				};

				const plusInside = Math.random() < 0.5;
				const a = rnd(2, 9);
				const b = rnd(2, 9);

				const rightTerm = termText(b, v);
				taskStr = `-(${a} ${plusInside ? '+' : '-'} ${rightTerm})`;
				resStr = `-${a} ${plusInside ? '-' : '+'} ${rightTerm}`;

				textDisplay = `Löse die Minusklammer auf: <br>\\( ${taskStr} \\)`;
				textPrint = `Löse die Minusklammer auf: \\(\\quad ${taskStr} = \\)`;
			}

			s = `\\[ ${mode === 1 || mode === 3 ? resStr : `${taskStr} = ${resStr}`} \\]`;
		}
		break;
	}
	case 'wortterme': {
		if (isQuizMode) {
			const templates = [
				{ text: (a, b) => `Addiere ${a} und ${b}.`, symbol: '+' },
				{ text: (a, b) => `Subtrahiere ${b} von ${a}.`, symbol: '-' },
				{ text: (a, b) => `Multipliziere ${a} und ${b}.`, symbol: '\\cdot' },
				{ text: (a, b) => `Dividiere ${a} durch ${b}.`, symbol: ':' },
				{ text: (a, b) => `Berechne die Summe von ${a} und ${b}.`, symbol: '+' },
				{ text: (a, b) => `Berechne die Differenz von ${a} und ${b}.`, symbol: '-' },
				{ text: (a, b) => `Berechne das Produkt von ${a} und ${b}.`, symbol: '\\cdot' },
				{ text: (a, b) => `Berechne den Quotienten von ${a} und ${b}.`, symbol: ':' }
			];

			const template = templates[randInt(0, templates.length - 1)];
			const allowNegative = grade >= 8;

			let a = allowNegative ? rnd(-15, 15) : rnd(1, 15);
			let b = allowNegative ? rnd(-15, 15) : rnd(1, 15);
			if (template.symbol === ':') {
				b = 0;
				while (b === 0) {
					b = allowNegative ? rnd(-12, 12) : rnd(1, 12);
				}
				const q = allowNegative ? rnd(-12, 12) : rnd(1, 12);
				a = b * q;
			}

			const result = template.symbol === '+'
				? a + b
				: template.symbol === '-'
					? a - b
					: template.symbol === '\\cdot'
						? a * b
						: a / b;

			textDisplay = template.text(a, b);
			textPrint = template.text(a, b);
			s = `\\[ ${fmt(a)} ${template.symbol} ${fmt(b)} = ${result} \\]`;
			answer = numericAnswer(result);
		} else {
			const templates = [
				{ text: (a, b) => `Addiere ${a} und ${b}.`, symbol: '+' },
				{ text: (a, b) => `Subtrahiere ${b} von ${a}.`, symbol: '-' },
				{ text: (a, b) => `Multipliziere ${a} und ${b}.`, symbol: '\\cdot' },
				{ text: (a, b) => `Dividiere ${a} durch ${b}.`, symbol: ':' },
				{ text: (a, b) => `Berechne die Summe von ${a} und ${b}.`, symbol: '+' },
				{ text: (a, b) => `Berechne die Differenz von ${a} und ${b}.`, symbol: '-' },
				{ text: (a, b) => `Berechne das Produkt von ${a} und ${b}.`, symbol: '\\cdot' },
				{ text: (a, b) => `Berechne den Quotienten von ${a} und ${b}.`, symbol: ':' }
			];

			const template = templates[randInt(0, templates.length - 1)];
			const allowNegative = grade >= 8;

			let a = allowNegative ? rnd(-15, 15) : rnd(1, 15);
			let b = allowNegative ? rnd(-15, 15) : rnd(1, 15);
			if (template.symbol === ':') {
				b = 0;
				while (b === 0) {
					b = allowNegative ? rnd(-12, 12) : rnd(1, 12);
				}
				const q = allowNegative ? rnd(-12, 12) : rnd(1, 12);
				a = b * q;
			}

			const result = template.symbol === '+'
				? a + b
				: template.symbol === '-'
					? a - b
					: template.symbol === '\\cdot'
						? a * b
						: a / b;

			textDisplay = template.text(a, b);
			textPrint = template.text(a, b);
			s = `\\[ ${fmt(a)} ${template.symbol} ${fmt(b)} = ${result} \\]`;
		}
		break;
	}
	case 'primzahlen': {
		const isPrim = mathUtils.isPrime;
		const start = randInt(0, 8) * 5;
		const prims = [];
		for (let i = start; i <= start + 10; i++) {
			if (isPrim(i)) prims.push(i);
		}
		textDisplay = `Nenne alle Primzahlen von ${start} bis ${start + 10}.`;
		s = `Primzahlen ${start} - ${start + 10}: \\( \\quad ${prims.join(', ')}\\)`;
		answer = listAnswer(prims);
		break;
	}
	case 'lineare_funktionen_zeichnen': {
		if (isQuizMode) {
			// Generiere eine zufällige lineare Funktion
			let m;
			let b = randInt(-8, 8) / 2; 
			if (b >= 2) m = randInt(-6, -2) / 2;
			else if (b <= -2) m = randInt(2, 6) / 2;
			else m = randInt(-6, 6) / 2; 

			// Funktion
			const f = (x) => m * x + b;
			
			// Markante Punkte
			const yIntercept = b;
			const xIntercept = b !== 0 ? -b / m : 0; // Nullstelle
			
			// SVG-Grafik für Koordinatensystem
			const svgWidth = 345;
			const svgHeight = 285;
			const centerX = 360 / 2 - 15; 
			const centerY = 300 / 2;
			const scale = 30; // Pixel pro Einheit
			
			// Konvertiere Koordinaten von mathematisch zu SVG
			const toSVG = (x, y) => ({
				x: centerX + x * scale,
				y: centerY - y * scale  // SVG y ist invertiert
			});
			
			// Erstelle SVG
			let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="border: 1px solid #ccc; background: white;">`;
			
			// Gitter: kariertes Papier mit 2 Kästchen pro Einheit
			for (let i = -11; i <= 12; i++) {
				const posX = toSVG(i / 2, 0);
				svgContent += `<line x1="${posX.x}" y1="${centerY - 150}" x2="${posX.x}" y2="${centerY + 150}" stroke="${i % 2 === 0 ? '#bbb' : '#bbb'}" stroke-width="0.5"/>`;
			}
			for (let i = -9; i <= 10; i++) {
				const posY = toSVG(0, i / 2);
				svgContent += `<line x1="0" y1="${posY.y}" x2="${svgWidth}" y2="${posY.y}" stroke="${i % 2 === 0 ? '#bbb' : '#bbb'}" stroke-width="0.5"/>`;
			}
			
			// Achsen
			// Zeichne die x-Achse als horizontale Linie
			svgContent += `<line x1="0" y1="${centerY}" x2="${svgWidth}" y2="${centerY}" stroke="black" stroke-width="2"/>`;
			// Zeichne die y-Achse als vertikale Linie
			svgContent += `<line x1="${centerX}" y1="0" x2="${centerX}" y2="${svgHeight}" stroke="black" stroke-width="2"/>`;
			// Pfeilspitze für die x-Achse nach rechts
			svgContent += `<polygon points="${svgWidth - 10},${centerY - 6} ${svgWidth},${centerY} ${svgWidth - 10},${centerY + 6}" fill="black"/>`;
			// Pfeilspitze für die y-Achse nach oben
			svgContent += `<polygon points="${centerX - 6},10 ${centerX},0 ${centerX + 6},10" fill="black"/>`;
			// Beschriftung für die x-Achse im Quadranten IV
			svgContent += `<text x="${svgWidth - 5}" y="${centerY + 16}" text-anchor="end" font-size="14" fill="black">x</text>`;
			// Beschriftung für die y-Achse im Quadranten II
			svgContent += `<text x="${centerX - 10}" y="10" text-anchor="end" font-size="14" fill="black">y</text>`;
			
			// Achsenticks für ganze Zahlen auf x- und y-Achse
			for (let i = -5; i <= 5; i++) {
				if (i !== 0) {
					const xPos = toSVG(i, 0);
					svgContent += `<line x1="${xPos.x}" y1="${centerY - 4}" x2="${xPos.x}" y2="${centerY + 4}" stroke="black" stroke-width="1"/>`;
				}
			}
			for (let i = -4; i <= 4; i++) {
				if (i !== 0) {
					const yPos = toSVG(0, i);
					svgContent += `<line x1="${centerX - 4}" y1="${yPos.y}" x2="${centerX + 4}" y2="${yPos.y}" stroke="black" stroke-width="1"/>`;
				}
			}
			
			// Achsen-Beschriftungen (ganze Zahlen)
			for (let i = -5; i <= 5; i++) {
				if (i !== 0) {
					const xPos = toSVG(i, 0);
					svgContent += `<text x="${xPos.x}" y="${centerY + 15}" text-anchor="middle" font-size="11" fill="black">${i}</text>`;
				}
			}
			for (let i = -4; i <= 4; i++) {
				if (i !== 0) {
					const yPos = toSVG(0, i);
					svgContent += `<text x="${centerX - 15}" y="${yPos.y + 4}" text-anchor="end" font-size="11" fill="black">${i}</text>`;
				}
			}
			
			// Gerade zeichnen
			const leftPoint = toSVG(-6, f(-6));
			const rightPoint = toSVG(6, f(6));
			svgContent += `<line x1="${leftPoint.x}" y1="${leftPoint.y}" x2="${rightPoint.x}" y2="${rightPoint.y}" stroke="#e74c3c" stroke-width="2.5"/>`;
			
			// y-Achsenabschnitt markieren
			const yIntPos = toSVG(0, yIntercept);
			svgContent += `<circle cx="${yIntPos.x}" cy="${yIntPos.y}" r="3" fill="#3498db" stroke="#2980b9" stroke-width="2"/>`;
			
			// Horizontale Strecke von (0,b) nach (1,b)
			const rightFromYAxis = toSVG(1, yIntercept);
			svgContent += `<line x1="${yIntPos.x}" y1="${yIntPos.y}" x2="${rightFromYAxis.x}" y2="${rightFromYAxis.y}" stroke="#2980b9" stroke-width="2"/>`;
			svgContent += `<polygon points="${rightFromYAxis.x - 6},${rightFromYAxis.y - 4} ${rightFromYAxis.x},${rightFromYAxis.y} ${rightFromYAxis.x - 6},${rightFromYAxis.y + 4}" fill="#2980b9"/>`;
			svgContent += `<text x="${(yIntPos.x + rightFromYAxis.x) / 2}" y="${yIntPos.y - 6}" text-anchor="middle" font-size="16" fill="#2980b9">1</text>`;
			
			// Vertikale Strecke von (1,b) nach (1,b+m)
			const upFromPoint = toSVG(1, yIntercept + m);
			svgContent += `<line x1="${rightFromYAxis.x}" y1="${rightFromYAxis.y}" x2="${upFromPoint.x}" y2="${upFromPoint.y}" stroke="#2980b9" stroke-width="2"/>`;
			if (m >= 0) {
				svgContent += `<polygon points="${upFromPoint.x - 4},${upFromPoint.y + 6} ${upFromPoint.x},${upFromPoint.y} ${upFromPoint.x + 4},${upFromPoint.y + 6}" fill="#2980b9"/>`;
				svgContent += `<text x="${upFromPoint.x + 12}" y="${(rightFromYAxis.y + upFromPoint.y) / 2 + 6}" text-anchor="start" font-size="16" fill="#2980b9">${m}</text>`;
			} else {
				svgContent += `<polygon points="${upFromPoint.x - 4},${upFromPoint.y - 6} ${upFromPoint.x},${upFromPoint.y} ${upFromPoint.x + 4},${upFromPoint.y - 6}" fill="#2980b9"/>`;
				svgContent += `<text x="${upFromPoint.x + 12}" y="${(rightFromYAxis.y + upFromPoint.y) / 2 + 6}" text-anchor="start" font-size="16" fill="#2980b9">${m}</text>`;
			}
			
			// Punkt bei x = 1 markieren (1, b + m)
			const highlightPos = toSVG(1, f(1));
			svgContent += `<circle cx="${highlightPos.x}" cy="${highlightPos.y}" r="3" fill="#27ae60" stroke="#229954" stroke-width="2"/>`;
			
			// Ursprung
			svgContent += `<circle cx="${centerX}" cy="${centerY}" r="3" fill="black"/>`;
			
			svgContent += `</svg>`;
			
			// Funktionsgleichung
			const mStr = m === 1 ? 'x' : (m === -1 ? '-x' : `${m}x`);
			const funcStr = b === 0
				? `f(x) = ${comma(mStr)}`
				: b > 0
					? `f(x) = ${comma(mStr)} + ${comma(b)}`
					: `f(x) = ${comma(mStr)} - ${comma(Math.abs(b))}`;

			textDisplay = `Zeichne den Graphen und gib die Nullstelle an: \\( ${funcStr} \\)`;
			textPrint = `Zeichne und gib die Nullstelle an: \\( \\; ${funcStr} \\) ${karo(11, 20)}` ;

			const x0 = comma(formatDecimal(xIntercept, 2));
			s = `<div style="display:flex; justify-content: center; align-items:center; gap:20px;">
				<div style="min-width:180px;">
					<span>\\( ${funcStr} \\)</span><br><br>
					<span>Nst. \\( \\; x_0 = ${x0} \\)</span>
				</div>
				<div>${svgContent}</div>
			</div>`;
		} else {
			// Generiere eine zufällige lineare Funktion
			let m;
			let b = randInt(-8, 8) / 2; 
			if (b >= 2) m = randInt(-6, -2) / 2;
			else if (b <= -2) m = randInt(2, 6) / 2;
			else m = randInt(-6, 6) / 2; 

			// Funktion
			const f = (x) => m * x + b;
			
			// Markante Punkte
			const yIntercept = b;
			const xIntercept = b !== 0 ? -b / m : 0; // Nullstelle
			
			// SVG-Grafik für Koordinatensystem
			const svgWidth = 345;
			const svgHeight = 285;
			const centerX = 360 / 2 - 15; 
			const centerY = 300 / 2;
			const scale = 30; // Pixel pro Einheit
			
			// Konvertiere Koordinaten von mathematisch zu SVG
			const toSVG = (x, y) => ({
				x: centerX + x * scale,
				y: centerY - y * scale  // SVG y ist invertiert
			});
			
			// Erstelle SVG
			let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="border: 1px solid #ccc; background: white;">`;
			
			// Gitter: kariertes Papier mit 2 Kästchen pro Einheit
			for (let i = -11; i <= 12; i++) {
				const posX = toSVG(i / 2, 0);
				svgContent += `<line x1="${posX.x}" y1="${centerY - 150}" x2="${posX.x}" y2="${centerY + 150}" stroke="${i % 2 === 0 ? '#bbb' : '#bbb'}" stroke-width="0.5"/>`;
			}
			for (let i = -9; i <= 10; i++) {
				const posY = toSVG(0, i / 2);
				svgContent += `<line x1="0" y1="${posY.y}" x2="${svgWidth}" y2="${posY.y}" stroke="${i % 2 === 0 ? '#bbb' : '#bbb'}" stroke-width="0.5"/>`;
			}
			
			// Achsen
			// Zeichne die x-Achse als horizontale Linie
			svgContent += `<line x1="0" y1="${centerY}" x2="${svgWidth}" y2="${centerY}" stroke="black" stroke-width="2"/>`;
			// Zeichne die y-Achse als vertikale Linie
			svgContent += `<line x1="${centerX}" y1="0" x2="${centerX}" y2="${svgHeight}" stroke="black" stroke-width="2"/>`;
			// Pfeilspitze für die x-Achse nach rechts
			svgContent += `<polygon points="${svgWidth - 10},${centerY - 6} ${svgWidth},${centerY} ${svgWidth - 10},${centerY + 6}" fill="black"/>`;
			// Pfeilspitze für die y-Achse nach oben
			svgContent += `<polygon points="${centerX - 6},10 ${centerX},0 ${centerX + 6},10" fill="black"/>`;
			// Beschriftung für die x-Achse im Quadranten IV
			svgContent += `<text x="${svgWidth - 5}" y="${centerY + 16}" text-anchor="end" font-size="14" fill="black">x</text>`;
			// Beschriftung für die y-Achse im Quadranten II
			svgContent += `<text x="${centerX - 10}" y="10" text-anchor="end" font-size="14" fill="black">y</text>`;
			
			// Achsenticks für ganze Zahlen auf x- und y-Achse
			for (let i = -5; i <= 5; i++) {
				if (i !== 0) {
					const xPos = toSVG(i, 0);
					svgContent += `<line x1="${xPos.x}" y1="${centerY - 4}" x2="${xPos.x}" y2="${centerY + 4}" stroke="black" stroke-width="1"/>`;
				}
			}
			for (let i = -4; i <= 4; i++) {
				if (i !== 0) {
					const yPos = toSVG(0, i);
					svgContent += `<line x1="${centerX - 4}" y1="${yPos.y}" x2="${centerX + 4}" y2="${yPos.y}" stroke="black" stroke-width="1"/>`;
				}
			}
			
			// Achsen-Beschriftungen (ganze Zahlen)
			for (let i = -5; i <= 5; i++) {
				if (i !== 0) {
					const xPos = toSVG(i, 0);
					svgContent += `<text x="${xPos.x}" y="${centerY + 15}" text-anchor="middle" font-size="11" fill="black">${i}</text>`;
				}
			}
			for (let i = -4; i <= 4; i++) {
				if (i !== 0) {
					const yPos = toSVG(0, i);
					svgContent += `<text x="${centerX - 15}" y="${yPos.y + 4}" text-anchor="end" font-size="11" fill="black">${i}</text>`;
				}
			}
			
			// Gerade zeichnen
			const leftPoint = toSVG(-6, f(-6));
			const rightPoint = toSVG(6, f(6));
			svgContent += `<line x1="${leftPoint.x}" y1="${leftPoint.y}" x2="${rightPoint.x}" y2="${rightPoint.y}" stroke="#e74c3c" stroke-width="2.5"/>`;
			
			// y-Achsenabschnitt markieren
			const yIntPos = toSVG(0, yIntercept);
			svgContent += `<circle cx="${yIntPos.x}" cy="${yIntPos.y}" r="3" fill="#3498db" stroke="#2980b9" stroke-width="2"/>`;
			
			// Horizontale Strecke von (0,b) nach (1,b)
			const rightFromYAxis = toSVG(1, yIntercept);
			svgContent += `<line x1="${yIntPos.x}" y1="${yIntPos.y}" x2="${rightFromYAxis.x}" y2="${rightFromYAxis.y}" stroke="#2980b9" stroke-width="2"/>`;
			svgContent += `<polygon points="${rightFromYAxis.x - 6},${rightFromYAxis.y - 4} ${rightFromYAxis.x},${rightFromYAxis.y} ${rightFromYAxis.x - 6},${rightFromYAxis.y + 4}" fill="#2980b9"/>`;
			svgContent += `<text x="${(yIntPos.x + rightFromYAxis.x) / 2}" y="${yIntPos.y - 6}" text-anchor="middle" font-size="16" fill="#2980b9">1</text>`;
			
			// Vertikale Strecke von (1,b) nach (1,b+m)
			const upFromPoint = toSVG(1, yIntercept + m);
			svgContent += `<line x1="${rightFromYAxis.x}" y1="${rightFromYAxis.y}" x2="${upFromPoint.x}" y2="${upFromPoint.y}" stroke="#2980b9" stroke-width="2"/>`;
			if (m >= 0) {
				svgContent += `<polygon points="${upFromPoint.x - 4},${upFromPoint.y + 6} ${upFromPoint.x},${upFromPoint.y} ${upFromPoint.x + 4},${upFromPoint.y + 6}" fill="#2980b9"/>`;
				svgContent += `<text x="${upFromPoint.x + 12}" y="${(rightFromYAxis.y + upFromPoint.y) / 2 + 6}" text-anchor="start" font-size="16" fill="#2980b9">${m}</text>`;
			} else {
				svgContent += `<polygon points="${upFromPoint.x - 4},${upFromPoint.y - 6} ${upFromPoint.x},${upFromPoint.y} ${upFromPoint.x + 4},${upFromPoint.y - 6}" fill="#2980b9"/>`;
				svgContent += `<text x="${upFromPoint.x + 12}" y="${(rightFromYAxis.y + upFromPoint.y) / 2 + 6}" text-anchor="start" font-size="16" fill="#2980b9">${m}</text>`;
			}
			
			// Punkt bei x = 1 markieren (1, b + m)
			const highlightPos = toSVG(1, f(1));
			svgContent += `<circle cx="${highlightPos.x}" cy="${highlightPos.y}" r="3" fill="#27ae60" stroke="#229954" stroke-width="2"/>`;
			
			// Ursprung
			svgContent += `<circle cx="${centerX}" cy="${centerY}" r="3" fill="black"/>`;
			
			svgContent += `</svg>`;
			
			// Funktionsgleichung
			const mStr = m === 1 ? 'x' : (m === -1 ? '-x' : `${m}x`);
			const funcStr = b === 0
				? `f(x) = ${comma(mStr)}`
				: b > 0
					? `f(x) = ${comma(mStr)} + ${comma(b)}`
					: `f(x) = ${comma(mStr)} - ${comma(Math.abs(b))}`;

			textDisplay = `Zeichne den Graphen und gib die Nullstelle an: \\( ${funcStr} \\)`;
			textPrint = `Zeichne und gib die Nullstelle an: \\( \\; ${funcStr} \\) ${karo(11, 20)}` ;

			const x0 = comma(formatDecimal(xIntercept, 2));
			s = `<div style="display:flex; justify-content: center; align-items:center; gap:20px;">
				<div style="min-width:180px;">
					<span>\\( ${funcStr} \\)</span><br><br>
					<span>Nst. \\( \\; x_0 = ${x0} \\)</span>
				</div>
				<div>${svgContent}</div>
			</div>`;
		}
		break;
	}
	case 'zahlengerade': {
		if (isQuizMode) {
			const allowDecimals = grade >= 6;
			const cleanFloat = (value) => Number(value.toFixed(6));
			let lineVariant;
			if (grade <= 6) {
				lineVariant = 'zero';
			} else if (grade === 7) {
				lineVariant = Math.random() < 0.5 ? 'zero' : 'section';
			} else {
				lineVariant = ['zero', 'section', 'negative'][randInt(0, 2)];
			}
			const isZeroBasedLine = lineVariant === 'zero';
			const isNegativeLine = lineVariant === 'negative';
			const variantAllowsDecimals = allowDecimals && !(grade === 8 && isNegativeLine);
			const tickBases = variantAllowsDecimals ? [2, 3, 4, 5] : [2, 3, 5];
			const tickFactors = variantAllowsDecimals
				? [0.01, 0.05, 0.1, 0.5, 1, 5, 10, 50, 100]
				: [1, 5, 10, 50, 100];
			const tickDistance = cleanFloat(tickBases[randInt(0, tickBases.length - 1)] * tickFactors[randInt(0, tickFactors.length - 1)]);
			const tickCount = randInt(5, 7);
			const startValue = cleanFloat(isZeroBasedLine ? 0 : (isNegativeLine ? randInt(-3, -1) * tickDistance : randInt(1, 4) * tickDistance));
			const endValue = cleanFloat(startValue + tickDistance * (tickCount - 1));
			const formatValue = (value) => formatDecimal(cleanFloat(value), 4);
			const getValueAt = (position) => cleanFloat(startValue + position * tickDistance);
			const svgWidth = 520;
			const svgHeight = 100;
			const svgRenderWidthCm = 10;
			const svgRenderHeightCm = 2.2;
			const margin = 10;
			const axisY = 56;
			const arrowSize = 10;
			const lineStart = margin;
			const lineEnd = svgWidth - margin - arrowSize;
			const tickLineEnd = isZeroBasedLine ? lineEnd - 12 : lineEnd;
			const unitPx = (tickLineEnd - lineStart) / (isZeroBasedLine ? tickCount - 1 : tickCount);
			const tickOffset = isZeroBasedLine ? 0 : unitPx / 2;
			const getX = (position) => lineStart + tickOffset + position * unitPx;
			const renderNumberLine = ({ labels = {}, labelColors = {}, labelWeights = {}, arrowPos = null, scale = 1, widthCm } = {}) => {
				const renderWidth = `${(widthCm ?? (svgRenderWidthCm * scale))}cm`;
				const renderHeight = `${svgRenderHeightCm * scale}cm`;
				let content = `<svg class="number-line-svg" width="${renderWidth}" height="${renderHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="display:block; color:#111827;">`;
				content += `<line x1="${lineStart}" y1="${axisY}" x2="${lineEnd}" y2="${axisY}" stroke="currentColor" stroke-width="2"/>`;
				content += `<polygon points="${svgWidth - margin},${axisY} ${lineEnd},${axisY - 6} ${lineEnd},${axisY + 6}" fill="currentColor"/>`;
				for (let i = 0; i < tickCount; i++) {
					const x = getX(i);
					content += `<line x1="${x}" y1="${axisY - 8}" x2="${x}" y2="${axisY + 8}" stroke="currentColor" stroke-width="1"/>`;
					const label = labels[i];
					if (label !== undefined) {
						const labelColor = labelColors[i] || 'currentColor';
						const labelWeight = labelWeights[i] || '400';
						content += `<text x="${x}" y="${axisY + 27}" text-anchor="middle" font-size="17" font-weight="${labelWeight}" fill="${labelColor}">${label}</text>`;
					}
				}
				if (arrowPos !== null && arrowPos !== undefined) {
					const arrowX = getX(arrowPos);
					content += `<line x1="${arrowX}" y1="${axisY - 36}" x2="${arrowX}" y2="${axisY - 14}" stroke="#d32f2f" stroke-width="3"/>`;
					content += `<polygon points="${arrowX - 6},${axisY - 17} ${arrowX},${axisY - 9} ${arrowX + 6},${axisY - 17}" fill="#d32f2f"/>`;
				}
				content += `</svg>`;
				return content;
			};

			const givenPosA = isZeroBasedLine ? 0 : randInt(0, tickCount - 1);
			let givenPosB;
			if (isZeroBasedLine) {
				givenPosB = randInt(2, tickCount - 1);
			} else {
				do {
					givenPosB = randInt(0, tickCount - 1);
				} while (Math.abs(givenPosA - givenPosB) <= 1);
			}

			// Aus den verbleibenden Positionen eine Zielposition für den Pfeil wählen
			const availableTargetPositions = [];
			for (let i = 0; i < tickCount; i++) {
				if (i !== givenPosA && i !== givenPosB) {
					availableTargetPositions.push(i);
				}
			}
			const targetPos = availableTargetPositions[randInt(0, availableTargetPositions.length - 1)];
			const targetValue = getValueAt(targetPos);

			const taskLabels = {
				[givenPosA]: formatValue(getValueAt(givenPosA)),
				[givenPosB]: formatValue(getValueAt(givenPosB))
			};
			const solutionLabels = {};
			for (let i = 0; i < tickCount; i++) {
				solutionLabels[i] = formatValue(getValueAt(i));
			}

			const lineTitle = isZeroBasedLine ? 'dem Zahlenstrahl' : (isNegativeLine ? 'der Zahlengeraden' : 'dem Zahlenstrahl-Abschnitt');
			const taskInstruction = `Welche Zahl ist durch den Pfeil auf ${lineTitle} markiert?`;
			const taskSvgDisplay = renderNumberLine({ labels: taskLabels, arrowPos: targetPos, scale: 1.7 });
			const taskSvgPrint = renderNumberLine({ labels: taskLabels, arrowPos: targetPos, scale: 1, widthCm: 11 });

			const solutionOptions = {
				labels: solutionLabels,
				labelColors: {
					[targetPos]: '#2e7d32'
				},
				labelWeights: {
					[targetPos]: '700'
				},
				arrowPos: targetPos
			};
			const solutionSvgDisplay = renderNumberLine({ ...solutionOptions, scale: 1.7 });
			const solutionSvgPrint = renderNumberLine({ ...solutionOptions, scale: 1, widthCm: 11 });

			textDisplay = `${taskInstruction}<br>${taskSvgDisplay}`;
			textPrint = `${taskInstruction} ${blank(2)}<br>${taskSvgPrint}`;
			s = `<span class="number-line-solution-display">Gesuchte Zahl: \\( \\mathbf{${formatValue(targetValue)}} \\)<br>${solutionSvgDisplay}</span><span class="number-line-solution-print">Gesuchte Zahl: \\( \\mathbf{${formatValue(targetValue)}} \\)<br>${solutionSvgPrint}</span>`;
			answer = numericAnswer(targetValue);
		} else {
		const allowDecimals = grade >= 6;
		const cleanFloat = (value) => Number(value.toFixed(6));
		let lineVariant;
		if (grade <= 6) {
			lineVariant = 'zero';
		} else if (grade === 7) {
			lineVariant = Math.random() < 0.5 ? 'zero' : 'section';
		} else {
			lineVariant = ['zero', 'section', 'negative'][randInt(0, 2)];
		}
		const isZeroBasedLine = lineVariant === 'zero';
		const isNegativeLine = lineVariant === 'negative';
		const variantAllowsDecimals = allowDecimals && !(grade === 8 && isNegativeLine);
		const tickBases = variantAllowsDecimals ? [1, 2, 3, 4, 5] : [2, 3, 5];
		const tickFactors = variantAllowsDecimals
			? [0.01, 0.1, 0.5, 1, 5, 10, 50, 100]
			: [1, 5, 10, 50, 100];
		const tickDistance = cleanFloat(tickBases[randInt(0, tickBases.length - 1)] * tickFactors[randInt(0, tickFactors.length - 1)]);
		const tickCount = randInt(5, 7);
		const startValue = cleanFloat(isZeroBasedLine ? 0 : (isNegativeLine ? randInt(-3, -1) * tickDistance : randInt(1, 4) * tickDistance));
		const endValue = cleanFloat(startValue + tickDistance * (tickCount - 1));
		const getValueAt = (position) => cleanFloat(startValue + position * tickDistance);
		const formatValue = (value) => formatDecimal(cleanFloat(value), 4);
		const svgWidth = 480;
		const svgHeight = 96;
		const svgRenderWidthCm = 10;
		const svgRenderHeightCm = 2;
		const margin = 10;
		const axisY = 52;
		const arrowSize = 10;
		const lineStart = margin;
		const lineEnd = svgWidth - margin - arrowSize;
		const tickLineEnd = isZeroBasedLine ? lineEnd - 12 : lineEnd;
		const unitPx = (tickLineEnd - lineStart) / (isZeroBasedLine ? tickCount - 1 : tickCount);
		const tickOffset = isZeroBasedLine ? 0 : unitPx / 2;
		const getX = (position) => lineStart + tickOffset + position * unitPx;
		const renderNumberLine = ({ labels = {}, labelColors = {}, labelWeights = {}, markerRatio = null, markerLabel = null, showIntermediateTicks = true, scale = 1, widthCm } = {}) => {
			const renderWidth = `${(widthCm ?? (svgRenderWidthCm * scale))}cm`;
			const renderHeight = `${svgRenderHeightCm * scale}cm`;
			let content = `<svg class="number-line-svg" width="${renderWidth}" height="${renderHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="display:block; color:#111827;">`;
			content += `<line x1="${lineStart}" y1="${axisY}" x2="${lineEnd}" y2="${axisY}" stroke="currentColor" stroke-width="2"/>`;
			content += `<polygon points="${svgWidth - margin},${axisY} ${lineEnd},${axisY - 6} ${lineEnd},${axisY + 6}" fill="currentColor"/>`;
			for (let i = 0; i < tickCount; i++) {
				if (!showIntermediateTicks && i !== 0 && i !== tickCount - 1) continue;
				const x = getX(i);
				content += `<line x1="${x}" y1="${axisY - 8}" x2="${x}" y2="${axisY + 8}" stroke="currentColor" stroke-width="1"/>`;
				const label = labels[i];
				if (label !== undefined) {
					const labelColor = labelColors[i] || 'currentColor';
					const labelWeight = labelWeights[i] || '400';
					content += `<text x="${x}" y="${axisY + 27}" text-anchor="middle" font-size="17" font-weight="${labelWeight}" fill="${labelColor}">${label}</text>`;
				}
			}
			if (markerRatio !== null) {
				const markerX = lineStart + markerRatio * (tickLineEnd - lineStart);
				content += `<line x1="${markerX}" y1="${axisY - 30}" x2="${markerX}" y2="${axisY - 10}" stroke="#2e7d32" stroke-width="3"/>`;
				content += `<polygon points="${markerX - 6},${axisY - 13} ${markerX},${axisY - 5} ${markerX + 6},${axisY - 13}" fill="#2e7d32"/>`;
				if (markerLabel !== null) {
					content += `<text x="${markerX}" y="${axisY - 36}" text-anchor="middle" font-size="15" font-weight="700" fill="#2e7d32">${markerLabel}</text>`;
				}
			}
			content += `</svg>`;
			return content;
		};

		const isEmptyZeroLine = isZeroBasedLine && Math.random() < 0.3;
		let targetValue = null;
		if (isEmptyZeroLine) {
			const targetCanHaveDecimal = endValue < 10 && !Number.isInteger(tickDistance);
			const targetDecimals = targetCanHaveDecimal ? 1 : 0;
			let attempts = 0;
			do {
				targetValue = Number((endValue * (0.05 + Math.random() * 0.9)).toFixed(targetDecimals));
				attempts++;
			} while ((targetValue <= endValue * 0.05 || targetValue >= endValue * 0.95) && attempts < 100);
			if (targetValue <= endValue * 0.05 || targetValue >= endValue * 0.95) {
				targetValue = cleanFloat(endValue / 2);
			}
		}
		const targetRatio = targetValue === null ? null : targetValue / endValue;
		let givenPosA = isZeroBasedLine ? 0 : randInt(0, tickCount - 1);
		let givenPosB;
		if (isEmptyZeroLine) {
			givenPosA = 0;
			givenPosB = tickCount - 1;
		} else if (isZeroBasedLine) {
			givenPosB = randInt(2, tickCount - 1);
		} else {
			do {
				givenPosB = randInt(0, tickCount - 1);
			} while (Math.abs(givenPosA - givenPosB) <= 1);
		}

		const taskLabels = {
			[givenPosA]: formatValue(getValueAt(givenPosA)),
			[givenPosB]: formatValue(getValueAt(givenPosB))
		};
		const solutionLabels = {};
		const missingPositions = [];
		for (let i = 0; i < tickCount; i++) {
			solutionLabels[i] = formatValue(getValueAt(i));
			if (i !== givenPosA && i !== givenPosB) {
				missingPositions.push(i);
			}
		}

		const lineTitle = isZeroBasedLine ? 'den Zahlenstrahl' : (isNegativeLine ? 'die Zahlengerade' : 'den Zahlenstrahl-Abschnitt');
		const taskInstruction = isEmptyZeroLine
			? `Markiere die Zahl \\( ${formatValue(targetValue)} \\) auf dem Zahlenstrahl:`
			: `Vervollständige ${lineTitle}:`;
		const taskSvgDisplay = renderNumberLine({ labels: taskLabels, showIntermediateTicks: !isEmptyZeroLine, scale: 1.7 });
		const taskSvgPrint = renderNumberLine({ labels: taskLabels, showIntermediateTicks: !isEmptyZeroLine, scale: 1, widthCm: 11 });

		const solutionOptions = {
			labels: solutionLabels,
			labelColors: missingPositions.reduce((acc, pos) => {
				acc[pos] = '#2e7d32';
				return acc;
			}, {}),
			labelWeights: missingPositions.reduce((acc, pos) => {
				acc[pos] = '700';
				return acc;
			}, {}),
			markerRatio: targetRatio,
			markerLabel: targetValue === null ? null : formatValue(targetValue)
		};
		const solutionSvgDisplay = renderNumberLine({ ...solutionOptions, scale: 1.7 });
		const solutionSvgPrint = renderNumberLine({ ...solutionOptions, scale: 1, widthCm: 11 });

		textDisplay = `${taskInstruction}<br>${taskSvgDisplay}`;
		textPrint = `${taskInstruction}<br>${taskSvgPrint}`;
		s = `<span class="number-line-solution-display">${solutionSvgDisplay}</span><span class="number-line-solution-print">${solutionSvgPrint}</span>`;
		}
		break;
	}
	case 'wahrscheinlichkeiten': {
		if (isQuizMode) {
			let mode = randInt(0, 4); // 0: Urne (3 Farben), 1: Rel. Häufigkeit, 2: 12-seitiger Würfel, 3: Glücksrad, 4: Würfel 
			let taskStr, resStr, answerValue;
			
			if (mode === 0) {
				// --- TYP: LAPLACE URNE (3 FARBEN) ---
				const farben = ['rote', 'blaue', 'grüne', 'gelbe'];
				let w = fisherYatesShuffle(farben);
				let n1 = randInt(3, 9);
				let n2 = randInt(3, 9);
				let n3 = randInt(3, 9);
				let gesamt = n1 + n2 + n3;
				answerValue = n1 / gesamt;
				
				// Grammatik-Fix: "rote" -> "Rot", "grüne" -> "Grün"
				let farbeSubst = w[0].charAt(0).toUpperCase() + w[0].slice(1, -1);
				
				taskStr = `Eine Urne enthält ${n1} ${w[0]}, ${n2} ${w[1]} und ${n3} ${w[2]} Kugeln. Nenne die Wahrscheinlichkeit, eine ${w[0]} Kugel zu ziehen?`;
				
				// In der Lösung nutzen wir jetzt die substantivierte Form
				resStr = `P(${farbeSubst}) = \\( \\dfrac{${n1}}{${gesamt}} \\)`;
			} else if (mode === 1) {
				// --- TYP: RELATIVE HÄUFIGKEIT (KONTEXT-SPEZIFISCH) ---
				const szenarien = [
					{ txt: 'Basketball: Von', einheit: 'Würfen wurden', e: 'getroffen' },
					{ txt: 'Qualitätskontrolle: Von', einheit: 'Bauteilen sind', e: 'defekt' },
					{ txt: 'Umfrage: Von', einheit: 'Personen antworten', e: 'mit "Ja"' },
					{ txt: 'Torwart: Von', einheit: 'Schüssen wurden', e: 'gehalten' }
				];
				const sz = szenarien[randInt(0, szenarien.length - 1)];
				let gesamt = [10, 20, 25, 40, 50][randInt(0, 4)];
				let treffer = Math.floor(gesamt * (randInt(2, 9) / 10));
				answerValue = treffer / gesamt;
				
				taskStr = `${sz.txt} ${gesamt} ${sz.einheit} ${treffer} ${sz.e}.<br>Nenne die relative Häufigkeit in %.`;
				let prozent = (treffer / gesamt) * 100;
				resStr = `h = \\( \\dfrac{${treffer}}{${gesamt}} \\) = ${prozent.toFixed(0).replace('.', ',')} %`;
				
			} else if (mode === 2) {
				// --- TYP: 12-SEITIGER WÜRFEL (D12) ---
				let subMode = randInt(0, 2);
				let ereignis, guenstige;
				
				if (subMode === 0) {
					ereignis = "eine Primzahl";
					taskStr = `Nenne die Wahrscheinlichkeit für ${ereignis} bei einem 12-seitigen Spielwürfel?`;
					answerValue = 5 / 12;
					resStr = `P(Primzahl) = \\( \\dfrac{5}{12} \\)`;
				} else if (subMode === 1) {
					let limit = randInt(7, 10);
					ereignis = `eine Zahl größer als ${limit}`;
					let count = 12 - limit;
					taskStr = `Nenne die Wahrscheinlichkeit für ${ereignis} bei einem 12-seitigen Spielwürfel?`;
					answerValue = count / 12;
					resStr = `P(x > ${limit}) = \\( \\dfrac{${count}}{12} \\)`;
				} else {
					// Würfeln: Teilbarkeit durch 3, 4 oder 5
					let auswahl = [3, 4, 5][randInt(0, 2)];
					let treffer, gekuerzt;
					
					if (auswahl === 3) {
						treffer = 4; // {3, 6, 9, 12}
						gekuerzt = "\\dfrac{1}{3}";
					} else if (auswahl === 4) {
						treffer = 3; // {4, 8, 12}
						gekuerzt = "\\dfrac{1}{4}";
					} else {
						treffer = 2; // {5, 10}
						gekuerzt = "\\dfrac{1}{6}";
					}

					let ereignis = `eine durch ${auswahl} teilbare Zahl`;
					taskStr = `Nenne die Wahrscheinlichkeit für ${ereignis} bei einem 12-seitigen Spielwürfel?`;
					answerValue = treffer / 12;
					resStr = `P(durch ${auswahl} teilbar) = \\( \\dfrac{${treffer}}{12} = ${gekuerzt}\\) `;
				}

			} else if (mode === 3) {
				// --- TYP: GLÜCKSRAD (2 Farben, zweimal drehen) ---
				const farben = ['rote', 'blaue', 'grüne', 'gelbe'];
				let w = fisherYatesShuffle(farben);
				let f1 = w[0]; // Die gesuchte Farbe (z.B. "rote")
				let f2 = w[1]; // Die andere Farbe
				
				let n1 = randInt(2, 5); // Felder Farbe 1
				let n2 = randInt(2, 5); // Felder Farbe 2
				let gesamt = n1 + n2;
				answerValue = (n1 / gesamt) * (n1 / gesamt);
				
				// Grammatik-Anpassung für die Farbe im Satz (Substantiviert)
				let f1Subst = f1.charAt(0).toUpperCase() + f1.slice(1, -1); // "rote" -> "Rot"
				
				taskStr = `Ein Glücksrad hat ${n1} ${f1} und ${n2} ${f2} gleich große Felder. Nenne die Wahrscheinlichkeit, dass 2-mal in Folge ${f1Subst} gedreht wird.`;
				
				// Berechnung: (n1/gesamt) * (n1/gesamt)
				let zaehler = n1 * n1;
				let nenner = gesamt * gesamt;
				
				// Lösungsweg mit Pfadregel
				resStr = `P(${f1Subst}, ${f1Subst}) = \\( \\dfrac{${n1}}{${gesamt}} \\cdot \\dfrac{${n1}}{${gesamt}} = \\dfrac{${zaehler}}{${nenner}} \\)`;
				
			} else if (mode === 4) {
				// --- TYP: 2 WÜRFEL - AUGENSUMME ---
				const target = randInt(2, 12);
				let count = 0;
				for (let a = 1; a <= 6; a++) {
					for (let b = 1; b <= 6; b++) {
						if (a + b === target) count++;
					}
				}

				const num = count;
				const den = 36;
				answerValue = num / den;
				const frac = den === 1 ? `${num}` : `\\dfrac{${num}}{${den}}`;
				taskStr = `Zwei Würfel werden geworfen.<br>Nenne die Wahrscheinlichkeit für die Augensumme ${target}.`;
				resStr = `P(Summe = ${target}) = \\( ${frac} \\)`;
			} 
			textDisplay = taskStr;
			s = `${resStr}`;
			answer = probabilityAnswer(answerValue);
		} else {
			let mode = randInt(0, 4); // 0: Urne (3 Farben), 1: Rel. Häufigkeit, 2: 12-seitiger Würfel, 3: Glücksrad, 4: Würfel 
			let taskStr, resStr;
			
			if (mode === 0) {
				// --- TYP: LAPLACE URNE (3 FARBEN) ---
				const farben = ['rote', 'blaue', 'grüne', 'gelbe'];
				let w = fisherYatesShuffle(farben);
				let n1 = randInt(3, 9);
				let n2 = randInt(3, 9);
				let n3 = randInt(3, 9);
				let gesamt = n1 + n2 + n3;
				
				// Grammatik-Fix: "rote" -> "Rot", "grüne" -> "Grün"
				let farbeSubst = w[0].charAt(0).toUpperCase() + w[0].slice(1, -1);
				
				taskStr = `Eine Urne enthält ${n1} ${w[0]}, ${n2} ${w[1]} und ${n3} ${w[2]} Kugeln. Nenne die Wahrscheinlichkeit, eine ${w[0]} Kugel zu ziehen?`;
				
				// In der Lösung nutzen wir jetzt die substantivierte Form
				resStr = `P(${farbeSubst}) = \\( \\dfrac{${n1}}{${gesamt}} \\)`;
			} else if (mode === 1) {
				// --- TYP: RELATIVE HÄUFIGKEIT (KONTEXT-SPEZIFISCH) ---
				const szenarien = [
					{ txt: 'Basketball: Von', einheit: 'Würfen wurden', e: 'getroffen' },
					{ txt: 'Qualitätskontrolle: Von', einheit: 'Bauteilen sind', e: 'defekt' },
					{ txt: 'Umfrage: Von', einheit: 'Personen antworten', e: 'mit "Ja"' },
					{ txt: 'Torwart: Von', einheit: 'Schüssen wurden', e: 'gehalten' }
				];
				const sz = szenarien[randInt(0, szenarien.length - 1)];
				let gesamt = [10, 20, 25, 40, 50][randInt(0, 4)];
				let treffer = Math.floor(gesamt * (randInt(2, 9) / 10));
				
				taskStr = `${sz.txt} ${gesamt} ${sz.einheit} ${treffer} ${sz.e}.<br>Nenne die relative Häufigkeit in %.`;
				let prozent = (treffer / gesamt) * 100;
				resStr = `h = \\( \\dfrac{${treffer}}{${gesamt}} \\) = ${prozent.toFixed(0).replace('.', ',')} %`;
				
			} else if (mode === 2) {
				// --- TYP: 12-SEITIGER WÜRFEL (D12) ---
				let subMode = randInt(0, 2);
				let ereignis, guenstige;
				
				if (subMode === 0) {
					ereignis = "eine Primzahl";
					taskStr = `Nenne die Wahrscheinlichkeit für ${ereignis} bei einem 12-seitigen Spielwürfel?`;
					resStr = `P(Primzahl) = \\( \\dfrac{5}{12} \\)`;
				} else if (subMode === 1) {
					let limit = randInt(7, 10);
					ereignis = `eine Zahl größer als ${limit}`;
					let count = 12 - limit;
					taskStr = `Nenne die Wahrscheinlichkeit für ${ereignis} bei einem 12-seitigen Spielwürfel?`;
					resStr = `P(x > ${limit}) = \\( \\dfrac{${count}}{12} \\)`;
				} else {
					// Würfeln: Teilbarkeit durch 3, 4 oder 5
					let auswahl = [3, 4, 5][randInt(0, 2)];
					let treffer, gekuerzt;
					
					if (auswahl === 3) {
						treffer = 4; // {3, 6, 9, 12}
						gekuerzt = "\\dfrac{1}{3}";
					} else if (auswahl === 4) {
						treffer = 3; // {4, 8, 12}
						gekuerzt = "\\dfrac{1}{4}";
					} else {
						treffer = 2; // {5, 10}
						gekuerzt = "\\dfrac{1}{6}";
					}

					let ereignis = `eine durch ${auswahl} teilbare Zahl`;
					taskStr = `Nenne die Wahrscheinlichkeit für ${ereignis} bei einem 12-seitigen Spielwürfel?`;
					resStr = `P(durch ${auswahl} teilbar) = \\( \\dfrac{${treffer}}{12} = ${gekuerzt}\\) `;
				}

			} else if (mode === 3) {
				// --- TYP: GLÜCKSRAD (2 Farben, zweimal drehen) ---
				const farben = ['rote', 'blaue', 'grüne', 'gelbe'];
				let w = fisherYatesShuffle(farben);
				let f1 = w[0]; // Die gesuchte Farbe (z.B. "rote")
				let f2 = w[1]; // Die andere Farbe
				
				let n1 = randInt(2, 5); // Felder Farbe 1
				let n2 = randInt(2, 5); // Felder Farbe 2
				let gesamt = n1 + n2;
				
				// Grammatik-Anpassung für die Farbe im Satz (Substantiviert)
				let f1Subst = f1.charAt(0).toUpperCase() + f1.slice(1, -1); // "rote" -> "Rot"
				
				taskStr = `Ein Glücksrad hat ${n1} ${f1} und ${n2} ${f2} gleich große Felder. Nenne die Wahrscheinlichkeit, dass 2-mal in Folge ${f1Subst} gedreht wird.`;
				
				// Berechnung: (n1/gesamt) * (n1/gesamt)
				let zaehler = n1 * n1;
				let nenner = gesamt * gesamt;
				
				// Lösungsweg mit Pfadregel
				resStr = `P(${f1Subst}, ${f1Subst}) = \\( \\dfrac{${n1}}{${gesamt}} \\cdot \\dfrac{${n1}}{${gesamt}} = \\dfrac{${zaehler}}{${nenner}} \\)`;
				
			} else if (mode === 4) {
				// --- TYP: 2 WÜRFEL - AUGENSUMME ---
				const target = randInt(2, 12);
				let count = 0;
				for (let a = 1; a <= 6; a++) {
					for (let b = 1; b <= 6; b++) {
						if (a + b === target) count++;
					}
				}

				const num = count;
				const den = 36;
				const frac = den === 1 ? `${num}` : `\\dfrac{${num}}{${den}}`;
				taskStr = `Zwei Würfel werden geworfen.<br>Nenne die Wahrscheinlichkeit für die Augensumme ${target}.`;
				resStr = `P(Summe = ${target}) = \\( ${frac} \\)`;
			} 
			textDisplay = taskStr;
			s = `${resStr}`;
		}
		break;
	}
	case 'funktionen': {
		const subType = randInt(0, 2);
		const isLinear = randInt(0, 1) === 0;
		const m = rnd(-8, 8) / 2;
		const b = rnd(-5, 5);
		const fmtFunctionNumber = value => comma(value);
		let funcStr;
		let calcF;
		if (isLinear) {
			calcF = x => m * x + b;
			const mStr = m === 1 ? '' : (m === -1 ? '-' : fmtFunctionNumber(m));
			const bStr = b > 0 ? ` + ${fmtFunctionNumber(b)}` : (b < 0 ? ` - ${fmtFunctionNumber(Math.abs(b))}` : '');
			funcStr = `f(x) = ${mStr}x${bStr}`;
		} else {
			const quadType = randInt(0, 1);
			if (quadType === 0) {
				calcF = x => x * x + b;
				const bStr = b > 0 ? ` + ${fmtFunctionNumber(b)}` : (b < 0 ? ` - ${fmtFunctionNumber(Math.abs(b))}` : '');
				funcStr = `f(x) = x^2${bStr}`;
			} else {
				const a = randInt(2, 4) * (randInt(0, 1) === 0 ? 1 : -1);
				calcF = x => a * x * x;
				funcStr = `f(x) = ${fmtFunctionNumber(a)}x^2`;
			}
		}
		switch (subType) {
			case 0: {
				const xVal = randInt(-4, 4);
				const rhs = funcStr.replace('f(x) = ', '');
				textDisplay = `Berechne bei der Funktion \\( ${funcStr} \\) den Funktionswert zum Argument \\( ${fmtFunctionNumber(xVal)} \\).`;
				s = `\\( f(${fmtFunctionNumber(xVal)}) = ${rhs.replace(/x/g, `(${fmtFunctionNumber(xVal)})`)} = ${fmtFunctionNumber(calcF(xVal))} \\)`;
				break;
			}
			case 1: {
				const px = randInt(-4, 4);
				const py = calcF(px);
				const rhs = funcStr.replace('f(x) = ', '');
				textDisplay = `\\( P(\\;${fmtFunctionNumber(px)} \\;|\\; y\\;) \\) liegt auf \\( ${funcStr} \\).<br>Bestimme \\( y \\).`;
				s = `\\( y = f(${fmtFunctionNumber(px)}) = ${rhs.replace(/x/g, `(${fmtFunctionNumber(px)})`)} = ${fmtFunctionNumber(py)} \\)`;
				break;
			}
			default: {
				const xValues = [-2, -1, 0, 1, 2];
				const buildValueTable = (isFilled, isCentered = true) => {
					const xRow = xValues.map((x, idx) =>
						`<td style="padding:6px 10px; text-align:center; min-width:40px; border-bottom:1px solid #333; ${idx < xValues.length - 1 ? 'border-right:1px solid #333;' : ''}">${fmtFunctionNumber(x)}</td>`
					).join('');
					const yRow = xValues.map(x => {
						const value = isFilled ? `${fmtFunctionNumber(calcF(x))}` : '&nbsp;';
						return `<td style="padding:6px 10px; text-align:center; min-width:34px; ${x < xValues[xValues.length - 1] ? 'border-right:1px solid #333;' : ''}">${value}</td>`;
					}).join('');
					return `<table style="border-collapse:separate; border-spacing:0; margin:${isCentered ? '8px auto 0 auto' : '8px 0 0 0'};">`
						+ `<tr><th style="padding:6px 10px; min-width:30px; font-weight:400; border-right:1px solid #333; border-bottom:1px solid #333;">x</th>${xRow}</tr>`
						+ `<tr><th style="padding:6px 10px; min-width:30px; font-weight:400; border-right:1px solid #333;">y</th>${yRow}</tr>`
						+ `</table>`;
				};
				textDisplay = `Fülle die Wertetabelle für \\( ${funcStr} \\) aus.<br>${buildValueTable(false)}`;
				textPrint = `Fülle die Wertetabelle für \\( ${funcStr} \\) aus.<br>${buildValueTable(false, false)}`;
				s = `${buildValueTable(true)}<br>Kontrolle: Trage z. B. die Punkte \\( P(-1|${fmtFunctionNumber(calcF(-1))}) \\), \\( Q(0|${fmtFunctionNumber(calcF(0))}) \\) und \\( R(1|${fmtFunctionNumber(calcF(1))}) \\) in das Koordinatensystem ein.`;
				break;
			}
		}
		break;
	}
	case 'statistik': {
		let n = randInt(5, 6);
		let data, sum, mean, modeVal;
		do {
			data = [];
			const used = new Set();
			modeVal = randInt(1, 9);
			data.push(modeVal, modeVal);
			used.add(modeVal);
			while (data.length < n - 1) {
				const num = randInt(1, 12);
				if (!used.has(num)) {
					data.push(num);
					used.add(num);
				}
			}
			const currentSum = data.reduce((a, b) => a + b, 0);
			const targetRemainder = (n === 6 && Math.random() < 0.5) ? 3 : 0;
			const diff = (targetRemainder - (currentSum % n) + n) % n;
			let lastVal = diff;
			while (used.has(lastVal) || lastVal === 0) {
				lastVal += n;
			}
			data.push(lastVal);
			sum = currentSum + lastVal;
			mean = (sum / n).toString().replace('.', ',');
			if (lastVal <= 13 && (sum % n === 0 || (n === 6 && sum % n === 3))) {
				break;
			}
		} while (true);
		for (let i = data.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[data[i], data[j]] = [data[j], data[i]];
		}
		const sortedData = [...data].sort((a, b) => a - b);
		if (data.every((value, index) => value === sortedData[index])) {
			const swapIndex = sortedData.findIndex((value, index) => index > 0 && value !== sortedData[index - 1]);
			[data[swapIndex - 1], data[swapIndex]] = [data[swapIndex], data[swapIndex - 1]];
		}
		const displayData = data;
		const taskType = randInt(0, 3);
		let taskName, loesung, resultValue;
		switch (taskType) {
			case 0:
				taskName = "das arithmetische Mittel";
				resultValue = sum / n;
				loesung = isQuizMode
					? `Summe = ${sum}<br>arithmetisches Mittel = ${sum} : ${n} = ${mean}`
					: `${sortedData.join(' + ')} = ${sum}<br>arithmetische Mittel = ${sum} : ${n} = ${mean}`;
				break;
			case 1:
				taskName = "den Zentralwert (Median)";
				if (n === 5) {
					resultValue = sortedData[2];
					loesung = `geordnete Liste: ${sortedData.join(', ')}<br>Zentralwert (Median) = ${resultValue}`;
				} else {
					resultValue = (sortedData[2] + sortedData[3]) / 2;
					loesung = `geordnete Liste: ${sortedData.join(', ')}<br>Zentralwert = (${sortedData[2]} + ${sortedData[3]}) : 2 = ${resultValue.toString().replace('.', ',')}`;
				}
				break;
			case 2:
				taskName = "den Modalwert";
				resultValue = modeVal;
				loesung = isQuizMode
					? `Modalwert = ${modeVal}`
					: `${displayData.join(', ')}<br>Modalwert = ${modeVal}`;
				break;
			default:
				taskName = "die Spannweite";
				resultValue = sortedData[n - 1] - sortedData[0];
				loesung = isQuizMode
					? `Spannweite = ${sortedData[n - 1]} - ${sortedData[0]} = ${resultValue}`
					: `${displayData.join(', ')}<br>Spannweite = ${sortedData[n - 1]} - ${sortedData[0]} = ${resultValue}`;
				break;
		}
		textPrint = `Bestimme ${taskName}: \\( \\quad ${displayData.join(', ')} \\)`;
		textDisplay = `Bestimme ${taskName}: <br>${displayData.join(', ')}`;
		s = loesung;
		answer = { kind: 'number', value: resultValue };
		break;
	}
	case 'winkel': {
		if (isQuizMode) {
			let mode = randInt(0, 2); // 0: Uhrzeit, 1: Kreisdiagramm, 2: Winkel zeichnen (versch. Typen), 3: Winkel zeichnen (10°-350°), 4: Dreieckswinkel berechnen, 5: Dreieckstyp zeichnen
			
			if (mode === 0) {
				// --- Uhrzeit ---
				let displayHour = randInt(0, 23);
				let hourOnClock = displayHour % 12;
				let stepCount = Math.min(hourOnClock, 12 - hourOnClock);
				let smallerAngle = stepCount * 30;
				let largerAngle = 360 - smallerAngle;
				
				textDisplay = `Welche Winkel bilden die Uhr-Zeiger um ${String(displayHour)}:00 Uhr?`;
				s = `${String(displayHour)}:00 Uhr ➝ ${smallerAngle}° und ${largerAngle}°`;
				answer = { kind: 'either', options: [smallerAngle, largerAngle] };
				
			} else if (mode === 1) {
				// --- Kreisdiagramm ---
				const prozentListe = [5, 10, 20, 25, 30, 40, 50, 60, 75, 80];
				let p = prozentListe[randInt(0, prozentListe.length - 1)];
				let result = (p / 100) * 360;
				
				textDisplay = `Welchen Winkel haben ${p} % in einem Kreisdiagramm?`;
				s = `10 % ≙ 36° &#x2192; ${p} % ≙ ${result}°`;
				answer = numericAnswer(result);
				
			}  else  {
				let a = rnd(25, 45), b = rnd(61, 129);
				textPrint = `Dreieck mit Winkeln \\( \\alpha = ${a}° \\) und \\( \\beta = ${b}°. \\quad \\gamma = \\) ${blank(1.5)} `;
				textDisplay = `Dreieck mit Winkeln \\( \\alpha = ${a}° \\) und \\( \\beta = ${b}°\\). Winkel \\(\\gamma \\)?`;
				s = `\\( \\gamma = 180° - ${a}° - ${b}° = ${180 - a - b}° \\)`;
				answer = numericAnswer(180 - a - b);

			} 
		} else {
			let mode = randInt(0, 5); // 0: Uhrzeit, 1: Kreisdiagramm, 2: Winkel zeichnen (versch. Typen), 3: Winkel zeichnen (10°-350°), 4: Dreieckswinkel berechnen, 5: Dreieckstyp zeichnen
			
			if (mode === 0) {
				// --- Uhrzeit ---
				let displayHour = randInt(0, 23);
				let hourOnClock = displayHour % 12;
				let stepCount = Math.min(hourOnClock, 12 - hourOnClock);
				let smallerAngle = stepCount * 30;
				let largerAngle = 360 - smallerAngle;
				
				textDisplay = `Welche Winkel bilden die Uhr-Zeiger um ${String(displayHour)}:00 Uhr?`;
				s = `${String(displayHour)}:00 Uhr ➝ ${smallerAngle}° und ${largerAngle}°`;
				
			} else if (mode === 1) {
				// --- Kreisdiagramm ---
				const prozentListe = [5, 10, 20, 25, 30, 40, 50, 60, 75, 80];
				let p = prozentListe[randInt(0, prozentListe.length - 1)];
				let result = (p / 100) * 360;
				
				textDisplay = `Welchen Winkel haben ${p} % in einem Kreisdiagramm?`;
				s = `10 % ≙ 36° &#x2192; ${p} % ≙ ${result}°`;
				
			} else if (mode === 2) {
				// --- Winkel zeichnen ---
				// Wir wählen gezielt Werte aus verschiedenen Bereichen
				const pools = [
					{ min: 1, max: 89, name: "spitzen Winkel" },
					{ val: 90, name: "rechten Winkel" },
					{ min: 91, max: 179, name: "stumpfen Winkel" },
					{ val: 180, name: "gestreckten Winkel" },
					{ min: 181, max: 359, name: "überstumpfen Winkel" }
				];
				let pick = pools[randInt(0, pools.length - 1)];
				
				textDisplay = `Zeichne einen ${pick.name}.`;
				textPrint = `Zeichne einen ${pick.name}.${space(2.5)}`;
				s = pick.val !== undefined ? `${pick.name.replace('en', 'er')}: ${pick.val}°` : `${pick.name.replace('en', 'er')}: ${pick.min}° bis ${pick.max}°`;
				
			} else if (mode === 3) {
				let grad = Math.random() < 0.5 ? randInt(15, 50) : randInt(130, 230);
				textDisplay = `Zeichne den Winkel \\(\\alpha\\) = ${grad}°.`;
				textPrint = `Zeichne den Winkel \\(\\alpha\\) = ${grad}°.${space(2.5)}`;
				s = `Zeichne den Winkel \\(\\alpha\\) = ${grad}°.`;

			} else if (mode === 4) {
				let a = rnd(25, 45), b = rnd(61, 129);
				textPrint = `Dreieck mit Winkeln \\( \\alpha = ${a}° \\) und \\( \\beta = ${b}°. \\quad \\gamma = \\) ${blank(1.5)} `;
				textDisplay = `Dreieck mit Winkeln \\( \\alpha = ${a}° \\) und \\( \\beta = ${b}°\\). Winkel \\(\\gamma \\)?`;
				s = `\\( \\gamma \\) = 180° - ${a}° - ${b}\° = ${180 - a - b}°`;

			} else {
				const triangleTypes = ['spitzwinkliges', 'stumpfwinkliges', 'gleichschenkliges', 'gleichseitiges'];
				const type = triangleTypes[randInt(0, triangleTypes.length - 1)];
				textDisplay = `Zeichne ein ${type} Dreieck.`;
				textPrint = `Zeichne ein ${type} Dreieck.${space(2.5)}`;
				let definition;
				switch (type) {
					case 'spitzwinkliges':
						definition = 'Alle Winkel kleiner als 90°.';
						break;
					case 'stumpfwinkliges':
						definition = 'Ein Winkel größer als 90°.';
						break;
					case 'gleichschenkliges':
						definition = 'Zwei Seiten gleich lang.';
						break;
					case 'gleichseitiges':
						definition = 'Alle Seiten gleich lang.';
						break;
				}
				s = `Kontrolle: ${definition}`;
			}
		}
		break;
	}
		case 'kongruenz': {
			// Permutation bleibt: Zuordnung von Seiten-/Winkelnamen wird zufaellig gemischt.
			let p = [0, 1, 2];
			for (let i = 2; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[p[i], p[j]] = [p[j], p[i]];
			}
			
			const type = randInt(0, 3); // 0: SSS, 1: SWS, 2: WSW, 3: SsW
			const kongruenzsatz = ['SSS', 'SWS', 'WSW', 'SsW'][type];
			const cm = (x) => formatDecimal(x, 1);
			const pickDecNoZeroTenth = (minTenths, maxTenths) => {
				let n;
				do {
					n = randInt(minTenths, maxTenths);
				} while (n % 10 === 0);
				return n / 10;
			};

			let givenStr = '';
			let givenSides = [false, false, false];
			let givenAngles = [false, false, false];
			let s1, s2, s3, a1, a2, a3;
			const deg = Math.PI / 180;
			const computeTriangleHeight = (sides, angles, given) => {
				const givenSideIndexes = [0, 1, 2].filter((i) => given[i]);
				if (!givenSideIndexes.length) return 0;
				const baseIndex = givenSideIndexes.reduce((maxIdx, idx) =>
					sides[idx] > sides[maxIdx] ? idx : maxIdx,
					givenSideIndexes[0]
				);
				if (baseIndex === 0) return sides[1] * Math.sin(angles[2] * deg);
				if (baseIndex === 1) return sides[0] * Math.sin(angles[2] * deg);
				if (baseIndex === 2) return sides[0] * Math.sin(angles[1] * deg);
				return 0;
			};
			const buildGivenStr = () => {
				const parts = [];
				if (givenSides[0]) parts.push(`a=${cm(resS[0])}\\,\\text{cm}`);
				if (givenSides[1]) parts.push(`b=${cm(resS[1])}\\,\\text{cm}`);
				if (givenSides[2]) parts.push(`c=${cm(resS[2])}\\,\\text{cm}`);
				if (givenAngles[0]) parts.push(`\\alpha=${resA[0]}^\\circ`);
				if (givenAngles[1]) parts.push(`\\beta=${resA[1]}^\\circ`);
				if (givenAngles[2]) parts.push(`\\gamma=${resA[2]}^\\circ`);
				return parts.length ? `\\( \\; ${parts.join('; \\; ')} \\)` : '';
			};

			if (type === 0) {
				// SSS
				do {
					s1 = pickDecNoZeroTenth(31, 69);
					s2 = pickDecNoZeroTenth(31, 69);
					const minS3 = Math.abs(s1 - s2) + 1.5;
					const maxS3 = Math.min(s1 + s2 - 1.5, 10);
					const minS3Tenths = Math.ceil(minS3 * 10);
					const maxS3Tenths = Math.floor(maxS3 * 10);
					if (minS3Tenths > maxS3Tenths) continue;
					
					s3 = pickDecNoZeroTenth(minS3Tenths, maxS3Tenths);
					
					a1 = Math.round(Math.acos((s2 * s2 + s3 * s3 - s1 * s1) / (2 * s2 * s3)) * 180 / Math.PI);
					a2 = Math.round(Math.acos((s1 * s1 + s3 * s3 - s2 * s2) / (2 * s1 * s3)) * 180 / Math.PI);
					a3 = 180 - a1 - a2;
					givenSides = [true, true, true];
					triangleHeight = computeTriangleHeight([s1, s2, s3], [a1, a2, a3], givenSides);
				} while (Math.max(s1, s2, s3) > 9 || triangleHeight > 4 || triangleHeight < 2);

			} else if (type === 1) {
				// SWS
				do {
					givenSides = [false, false, false];
					givenAngles = [false, false, false];
					s1 = pickDecNoZeroTenth(31, 69);
					s2 = pickDecNoZeroTenth(31, 69);
					a3 = randInt(25, 125);
					
					s3 = Math.sqrt(s1 * s1 + s2 * s2 - 2 * s1 * s2 * Math.cos(a3 * Math.PI / 180));
					a1 = Math.round(Math.acos((s2 * s2 + s3 * s3 - s1 * s1) / (2 * s2 * s3)) * 180 / Math.PI);
					s3 = Math.round(s3 * 10) / 10;
					a2 = 180 - a3 - a1;
					givenSides[p[0]] = true;
					givenSides[p[1]] = true;
					givenAngles[p[2]] = true;
					triangleHeight = computeTriangleHeight([s1, s2, s3], [a1, a2, a3], givenSides);
				} while (Math.max(s1, s2, s3) > 9 || a2 <= 0 || triangleHeight > 4 || triangleHeight < 2);
			} else if (type === 2) {
				// WSW
				do {
					givenSides = [false, false, false];
					givenAngles = [false, false, false];
					s3 = pickDecNoZeroTenth(31, 69);
					a1 = randInt(25, 50);
					a2 = randInt(90, 120);
					a3 = 180 - a1 - a2;
					
					s1 = Math.round((s3 * Math.sin(a1 * Math.PI / 180) / Math.sin(a3 * Math.PI / 180)) * 10) / 10;
					s2 = Math.round((s3 * Math.sin(a2 * Math.PI / 180) / Math.sin(a3 * Math.PI / 180)) * 10) / 10;
					givenSides[p[2]] = true;
					givenAngles[p[0]] = true;
					givenAngles[p[1]] = true;
					triangleHeight = computeTriangleHeight([s1, s2, s3], [a1, a2, a3], givenSides);
				} while (a3 < 10 || Math.max(s1, s2, s3) > 9 || triangleHeight > 4 || triangleHeight < 2);

			} else {
				// SsW
				do {
					givenSides = [false, false, false];
					givenAngles = [false, false, false];
					s1 = pickDecNoZeroTenth(51, 69);
					s2 = pickDecNoZeroTenth(31, 49);
					a1 = randInt(25, 110);
					
					const sinA2 = (s2 * Math.sin(a1 * Math.PI / 180)) / s1;
					if (sinA2 >= 1 || sinA2 <= -1) {
						a2 = NaN;
						a3 = NaN;
						s3 = NaN;
						continue;
					}

					a2 = Math.round(Math.asin(sinA2) * 180 / Math.PI);
					a3 = 180 - a1 - a2;
					s3 = Math.round((s1 * Math.sin(a3 * Math.PI / 180) / Math.sin(a1 * Math.PI / 180)) * 10) / 10;
					givenSides[p[0]] = true;
					givenSides[p[1]] = true;
					givenAngles[p[0]] = true;
					triangleHeight = computeTriangleHeight([s1, s2, s3], [a1, a2, a3], givenSides);
				} while (!Number.isFinite(s3) || a3 < 10 || Math.max(s1, s2, s3) > 9 || triangleHeight > 4 || triangleHeight < 2);

			}

			const resS = [], resA = [];
			resS[p[0]] = s1; resS[p[1]] = s2; resS[p[2]] = s3;
			resA[p[0]] = a1; resA[p[1]] = a2; resA[p[2]] = a3;

			givenStr = buildGivenStr();

			// Höhe des zu zeichnenden Dreiecks berechnen (bei längster gegebener Seite als Grundseite).
			// Über Heron: A = sqrt(u(u-a)(u-b)(u-c)), dann h = 2A/g.
			const sideA = resS[0], sideB = resS[1], sideC = resS[2];
			const givenSideValues = [];
			if (givenSides[0]) givenSideValues.push(sideA);
			if (givenSides[1]) givenSideValues.push(sideB);
			if (givenSides[2]) givenSideValues.push(sideC);
			const base = givenSideValues.length ? Math.max(...givenSideValues) : Math.max(sideA, sideB, sideC);
			const semi = (sideA + sideB + sideC) / 2;
			const areaSq = semi * (semi - sideA) * (semi - sideB) * (semi - sideC);
			const area = Math.sqrt(Math.max(0, areaSq));
			const computedHeight = base > 0 ? (2 * area) / base : 0;
			const reservedHeight = Number(computedHeight + 0.5).toFixed(1);
			
			textDisplay = `Skizziere eine Planfigur, zeichne und beschrifte das Dreieck und miss alle Größen: <br>${givenStr}`;
			textPrint = `Skizziere eine Planfigur, zeichne und beschrifte das Dreieck und miss alle Größen: ${givenStr}${space(reservedHeight)}`;
			s = `Kongruenzsatz ${kongruenzsatz}, alle Maße:<br>\\[ \\begin{aligned}
				a &= ${cm(resS[0])}\\,\\text{cm}; &\\quad b &= ${cm(resS[1])}\\,\\text{cm}; &\\quad c &= ${cm(resS[2])}\\,\\text{cm} \\\\ \\alpha &= ${resA[0]}^\\circ; &\\quad \\beta &= ${resA[1]}^\\circ; &\\quad \\gamma &= ${resA[2]}^\\circ
			\\end{aligned} \\]`;
			break;
		}

		case 'schraegbild': {
			let type = randInt(0, 3); // 0: Quader, 1: Pyramide, 2: Zylinder, 3: Kegel 

			if (type === 0) {
				// --- QUADER ---
				let a = randInt(2, 5);
				let b = randInt(2, 4); 
				let c = randInt(2, 6);
				textDisplay = `Zeichne das Schrägbild eines Quaders mit<br> a = ${a} cm, b = ${b} cm, c = ${c} cm.`;
				textPrint = `Zeichne das Schrägbild eines Quaders mit a = ${a} cm, b = ${b} cm, c = ${c} cm. ${space(a + 1)}`;
				s = `<img src="../img/schraegbild_quader.png" alt="Quader" style="max-width:40%; height:auto;">`;
				//s = `${space(5)}`;
				
			} else if (type === 1) {
				// --- PYRAMIDE ---
				let a = randInt(2, 5);
				let b = randInt(2, 6); 
				let h = randInt(3, 6);
				textDisplay = `Zeichne das Schrägbild einer Pyramide mit<br> a = ${a} cm, b = ${b} cm, h = ${h} cm.`;
				textPrint = `Zeichne das Schrägbild einer Pyramide mit a = ${a} cm, b = ${b} cm, h = ${h} cm. ${space(b / 2 + h + 1)}`;
				s = `${space(5)}`;

			} else if (type === 2) {
				// --- ZYLINDER ---
				let r = randInt(1, 2);
				let h = randInt(3, 5);
				textDisplay = `Zeichne das Schrägbild eines Zylinders mit<br> r = ${r} cm, h = ${h} cm.`;
				textPrint = `Zeichne das Schrägbild eines Zylinders mit r = ${r} cm, h = ${h} cm. ${space(r + 1)}`;
				s = `${space(5)}`;
				
			} else if (type === 3) {
				// --- KREISKEGEL ---
				let r = randInt(1, 3);
				let h = randInt(2, 4);
				textDisplay = `Zeichne das Schrägbild eines Kegels mit<br> r = ${r} cm, h = ${h} cm.`;
				textPrint = `Zeichne das Schrägbild eines Kegels mit r = ${r} cm, h = ${h} cm. ${space(r + h)}`;
				s = `${space(5)}`;
			} 
			break;
		}

	case 'anteile': {
		if (isQuizMode) {
			let einheit = ['€', 'm', 'kg', 't', 'g', 'm²', 'm³', 'ha', 's', 'h', 'l', 'cm', 'mm', 'km', 'dm'][randInt(0, 14)];
			let rd = Math.random();

			// 1. Definition "schöner" Brüche (Zähler z, Nenner n)
			const fractions = [
				{ z: 2, n: 3 }, { z: 3, n: 4 }, { z: 2, n: 5 }, { z: 3, n: 5 }, { z: 4, n: 5 },
				{ z: 5, n: 6 }, { z: 3, n: 8 }, { z: 3, n: 10 }, { z: 7, n: 10 }, { z: 9, n: 10 }
			];
			
			// Wähle einen zufälligen Bruch aus dem Pool
			let frac = fractions[randInt(0, fractions.length - 1)];
			let z = frac.z;
			let n = frac.n;
			
			if (rd > 0.6) {
				// TYP 1: Anteil berechnen (Bruch von Ganzem)
				// Damit es glatt aufgeht, muss das Ganze ein Vielfaches des Nenners sein.
				let scale = Math.random() > 0.5 ? 10 : 1; // Sorgt manchmal für Hunderter/Zehner-Werte
				let multiplier = rnd(2, 9);
				let G = n * multiplier * scale; // Das Ganze (Grundwert)
				let W = (G / n) * z;            // Der Anteil (Prozentwert)
				answer = { kind: 'number', value: W, unit: einheit };

				textDisplay = `\\( \\dfrac{${z}}{${n}} \\) von ${comma(G)} ${einheit} sind ${blank(3)}`;
				s = `\\( \\dfrac{${z}}{${n}} \\) von ${comma(G)}  ${einheit} sind <b>${comma(W)} ${einheit}</b><br>
				\\((${comma(G)} : ${n} \\cdot ${z} = ${comma(W)})\\)`;

			} else if (rd > 0.25) {
				// TYP 2: Ganzes berechnen (Bruch sind Anteil von...)
				// Damit es glatt aufgeht, muss der Anteil ein Vielfaches des Zählers sein.
				let scale = Math.random() > 0.5 ? 10 : 1;
				let multiplier = rnd(2, 9);
				let W = z * multiplier * scale; // Der Anteil
				let G = (W / z) * n;            // Das Ganze
				answer = { kind: 'number', value: G, unit: einheit };
				
				if (Math.random() < 0.5) {textDisplay = `\\( \\frac{${z}}{${n}} \\)  sind ${comma(W)} ${einheit} von ${blank(3)}`;} 
				else {textDisplay = `${comma(W)} ${einheit} sind \\( \\frac{${z}}{${n}} \\) von ${blank(3)}`;}
				s = `\\( \\dfrac{${z}}{${n}} \\) sind ${comma(W)} ${einheit} von <b>${comma(G)} ${einheit}</b><br>
				\\((${comma(W)} : ${z} \\cdot ${n} = ${comma(G)})\\)`;

			} else {
				// TYP 3: Bruch berechnen (Anteil von Ganzem sind...)
				// Wir nehmen den generierten Bruch und erzeugen dazu passende glatte Werte.
				let multiplier = rnd(2, 9);
				
				let W = z * multiplier;
				let G = n * multiplier;
				answer = { kind: 'fraction', num: z, den: n, requireReduced: true };
				
				textDisplay = `${comma(W)} ${einheit} von ${comma(G)}  ${einheit} sind ${blank(3)} (als gekürzter Bruch)`;
				s = `${comma(W)}  ${einheit} von  ${comma(G)}  ${einheit} sind  \\(\\dfrac{${comma(W)}}{${comma(G)}} \\underset{${multiplier}}{=} \\mathbf{\\dfrac{${z}}{${n}}} \\)`;
			}
		} else {
			let einheit = ['€', 'm', 'kg', 't', 'g', 'm²', 'm³', 'ha', 's', 'h', 'l', 'cm', 'mm', 'km', 'dm'][randInt(0, 14)];
			let rd = Math.random();

			// 1. Definition "schöner" Brüche (Zähler z, Nenner n)
			const fractions = [
				{ z: 2, n: 3 }, { z: 3, n: 4 }, { z: 2, n: 5 }, { z: 3, n: 5 }, { z: 4, n: 5 },
				{ z: 5, n: 6 }, { z: 3, n: 8 }, { z: 3, n: 10 }, { z: 7, n: 10 }, { z: 9, n: 10 }
			];
			
			// Wähle einen zufälligen Bruch aus dem Pool
			let frac = fractions[randInt(0, fractions.length - 1)];
			let z = frac.z;
			let n = frac.n;
			
			if (rd > 0.6) {
				// TYP 1: Anteil berechnen (Bruch von Ganzem)
				// Damit es glatt aufgeht, muss das Ganze ein Vielfaches des Nenners sein.
				let scale = Math.random() > 0.5 ? 10 : 1; // Sorgt manchmal für Hunderter/Zehner-Werte
				let multiplier = rnd(3, 13);
				let G = n * multiplier * scale; // Das Ganze (Grundwert)
				let W = (G / n) * z;            // Der Anteil (Prozentwert)

				textDisplay = `\\( \\frac{${z}}{${n}} \\) von ${comma(G)} ${einheit} sind ${blank(3)}`;
				s = `\\( \\frac{${z}}{${n}} \\) von ${comma(G)}  ${einheit} sind <b>${comma(W)} ${einheit}</b><br>
				\\((${comma(G)} : ${n} \\cdot ${z} = ${comma(W)})\\)`;

			} else if (rd > 0.25) {
				// TYP 2: Ganzes berechnen (Bruch sind Anteil von...)
				// Damit es glatt aufgeht, muss der Anteil ein Vielfaches des Zählers sein.
				let scale = Math.random() > 0.5 ? 10 : 1;
				let multiplier = rnd(3, 13);
				let W = z * multiplier * scale; // Der Anteil
				let G = (W / z) * n;            // Das Ganze
				if (Math.random() < 0.5) {textDisplay = `\\( \\frac{${z}}{${n}} \\)  sind ${comma(W)} ${einheit} von ${blank(3)}`;} 
				else {textDisplay = `${comma(W)} ${einheit} sind \\( \\frac{${z}}{${n}} \\) von ${blank(3)}`;}
				
				s = `\\( \\frac{${z}}{${n}} \\) sind ${comma(W)} ${einheit} von <b>${comma(G)} ${einheit}</b><br>
				\\((${comma(W)} : ${z} \\cdot ${n} = ${comma(G)})\\)`;

			} else {
				// TYP 3: Bruch berechnen (Anteil von Ganzem sind...)
				// Wir nehmen den generierten Bruch und erzeugen dazu passende glatte Werte.
				let multiplier = rnd(2, 10);
				
				let W = z * multiplier;
				let G = n * multiplier;
				
				textDisplay = `${comma(W)} ${einheit} von ${comma(G)}  ${einheit} sind ${blank(3)} (als gekürzter Bruch)`;
				s = `${comma(W)}  ${einheit} von  ${comma(G)}  ${einheit} sind  \\(\\dfrac{${comma(W)}}{${comma(G)}} \\underset{${multiplier}}{=} \\mathbf{\\dfrac{${z}}{${n}}}\\)`;
				
			}
		}
		break;
	}
	case 'proportionalitaet': {
		const szenarien = [
			{ einheit1: 'kg Äpfel', einheit2: '€', objekt: 'Äpfel', type: 'food' },
			{ einheit1: 'Brötchen', einheit2: '€', objekt: 'Brötchen', type: 'food' },
			{ einheit1: 'Liter Saft', einheit2: '€', objekt: 'Saft', type: 'food' },
			{ einheit1: 'Stunden', einheit2: '€', objekt: 'ein Azubi', type: 'job' },
			{ einheit1: 'Minuten', einheit2: 'Seiten', objekt: 'ein Drucker', type: 'print' }
		];
		const sz = szenarien[randInt(0, szenarien.length - 1)];
		const de = num => {
			if (sz.type === 'food' || sz.type === 'job') return comma(num.toFixed(2));
			return Math.round(num).toString();
		};

		const menge1 = randInt(3, 6);
		let menge2;
		do {
			menge2 = menge1 + randInt(1, 6);
		} while (menge2 % menge1 === 0);

		let einzelwert;
		if (sz.type === 'print') {
			einzelwert = isQuizMode ? randInt(5, 15) : randInt(5, 20);
		} else if (sz.type === 'job') {
			einzelwert = isQuizMode
				? randInt(5, 9)
				: randInt(5, 9) + (Math.random() < 0.5 ? 0.5 : 0);
		} else {
			einzelwert = isQuizMode
				? randInt(1, 6) * 0.5
				: randInt(1, 7) * 0.2;
		}

		const wert1 = menge1 * einzelwert;
		const wert2 = menge2 * einzelwert;
		const reverseQuestion = Math.random() < 0.3;
		const einheitSingular = sz.einheit1 === 'Brötchen'
			? 'Brötchen'
			: sz.einheit1.replace('en', 'e');
		let s1, sFrage;

		if (!reverseQuestion) {
			if (sz.type === 'job') {
				s1 = `${de(wert1)} ${sz.einheit2} verdient ${sz.objekt} in ${menge1} ${sz.einheit1}`;
				sFrage = `Wie viel verdient er in ${menge2} ${sz.einheit1}?`;
			} else if (sz.type === 'print') {
				s1 = `${de(wert1)} ${sz.einheit2} schafft ${sz.objekt} in ${menge1} ${sz.einheit1}`;
				sFrage = `Wie viele ${sz.einheit2} schafft er in ${menge2} ${sz.einheit1}?`;
			} else {
				s1 = `${menge1} ${sz.einheit1} kosten ${de(wert1)} ${sz.einheit2}`;
				sFrage = `Wie viel kosten ${menge2} ${sz.einheit1}?`;
			}
		} else if (sz.type === 'job') {
			s1 = `${de(wert1)} ${sz.einheit2} verdient ${sz.objekt} in ${menge1} ${sz.einheit1}`;
			sFrage = `Wie viele ${sz.einheit1} muss er für ${de(wert2)} ${sz.einheit2} arbeiten?`;
		} else if (sz.type === 'print') {
			s1 = `${de(wert1)} ${sz.einheit2} schafft ${sz.objekt} in ${menge1} ${sz.einheit1}`;
			sFrage = `Wie viele ${sz.einheit1} braucht er für ${de(wert2)} ${sz.einheit2}?`;
		} else {
			s1 = `${menge1} ${sz.einheit1} kosten ${de(wert1)} ${sz.einheit2}`;
			sFrage = `Wie viele ${sz.einheit1} bekommt man für ${de(wert2)} ${sz.einheit2}?`;
		}

		textDisplay = `${s1}.<br> ${sFrage}`;
		s = formatUtils.buildSolutionTable([
			[`${menge1} ${sz.einheit1}`, `${de(wert1)} ${sz.einheit2}`],
			[`1 ${einheitSingular}`, `${de(einzelwert)} ${sz.einheit2}`],
			[`${menge2} ${sz.einheit1}`, `${de(wert2)} ${sz.einheit2}`]
		]);
		if (isQuizMode) {
			answer = { kind: 'number', value: reverseQuestion ? menge2 : wert2 };
		}
		break;
	}
	case 'vorrang': {
		if (isQuizMode) {
			// 1. Vier eindeutige Zahlen generieren und aufsteigend sortieren
			let nums = [];
			while (nums.length < 4) {
				let r = randInt(2, 13); // Etwas größerer Bereich für schönere Differenzen
				if (!nums.includes(r)) nums.push(r);
			}
			nums.sort((x, y) => x - y);
			// Jetzt gilt: n[0] < n[1] < n[2] < n[3]
			const n = nums;
			
			const f = fmt;
			let vorrangType = randInt(0, 4);
			let taskStr, step1, res;
			
			switch (vorrangType) {
				case 0:
					// Typ: Klein - (Mittel * Groß) 
					taskStr = `${n[0]} - ${n[1]} \\cdot ${n[2]}`;
					step1 = `${n[0]} - ${n[1] * n[2]}`;
					res = n[0] - (n[1] * n[2]);
					break;
					
				case 1:
					// Typ: Mittel^2 - (Klein * Groß)
					taskStr = `${n[1]}^2 - ${n[0]} \\cdot ${n[2]}`;
					step1 = `${n[1] * n[1]} - ${n[0] * n[2]}`;
					res = (n[1] * n[1]) - (n[0] * n[2]);
					break;

				case 2:
					// Typ: Klein * (Mittel^2 - Groß)
					taskStr = `${n[0]} \\cdot (${n[1]}^2 - ${n[2]})`;
					step1 = `${n[0]} \\cdot ${f(n[1] * n[1] - n[2])}`;
					res = n[0] * (n[1] * n[1] - n[2]);
					break;

				case 3:
					// Typ: (Klein * Mittel) - (Groß * Extra)
					taskStr = `${n[0]} \\cdot ${n[1]} - ${n[2]} \\cdot ${n[3]}`;
					step1 = `${n[0] * n[1]} - ${n[2] * n[3]}`;
					res = (n[0] * n[1]) - (n[2] * n[3]);
					break;

				case 4:
					// Typ: Mittel * (Klein + Groß) - Extra
					taskStr = `${n[1]} \\cdot (${n[0]} + ${n[2]}) - ${n[3]}`;
					step1 = `${n[1]} \\cdot ${n[0] + n[2]} - ${n[3]}`;
					res = n[1] * (n[0] + n[2]) - n[3];
					break;
			}

			textDisplay = `\\( ${taskStr} = \\)`;
			s = `\\[ ${taskStr} = ${step1} = ${res} \\]`;
			answer = numericAnswer(res);

		} else {
			// 1. Vier eindeutige Zahlen generieren und aufsteigend sortieren
			let nums = [];
			while (nums.length < 4) {
				let r = randInt(0, 13); // Etwas größerer Bereich für schönere Differenzen
				if (!nums.includes(r)) nums.push(r);
			}
			nums.sort((x, y) => x - y);
			// Jetzt gilt: n[0] < n[1] < n[2] < n[3]
			const n = nums;
			
			const f = fmt;
			let vorrangType = randInt(0, 4);
			let taskStr, step1, res;
			
			switch (vorrangType) {
				case 0:
					// Typ: Klein - (Mittel * Groß) 
					taskStr = `${n[0]} - ${n[1]} \\cdot ${n[2]}`;
					step1 = `${n[0]} - ${n[1] * n[2]}`;
					res = n[0] - (n[1] * n[2]);
					break;
					
				case 1:
					// Typ: Mittel^2 - (Klein * Groß)
					taskStr = `${n[1]}^2 - ${n[0]} \\cdot ${n[2]}`;
					step1 = `${n[1] * n[1]} - ${n[0] * n[2]}`;
					res = (n[1] * n[1]) - (n[0] * n[2]);
					break;

				case 2:
					// Typ: Klein * (Mittel^2 - Groß)
					taskStr = `${n[0]} \\cdot (${n[1]}^2 - ${n[2]})`;
					step1 = `${n[0]} \\cdot ${f(n[1] * n[1] - n[2])}`;
					res = n[0] * (n[1] * n[1] - n[2]);
					break;

				case 3:
					// Typ: (Klein * Mittel) - (Groß * Extra)
					taskStr = `${n[0]} \\cdot ${n[1]} - ${n[2]} \\cdot ${n[3]}`;
					step1 = `${n[0] * n[1]} - ${n[2] * n[3]}`;
					res = (n[0] * n[1]) - (n[2] * n[3]);
					break;

				case 4:
					// Typ: Mittel * (Klein + Groß) - Extra
					taskStr = `${n[1]} \\cdot (${n[0]} + ${n[2]}) - ${n[3]}`;
					step1 = `${n[1]} \\cdot ${n[0] + n[2]} - ${n[3]}`;
					res = n[1] * (n[0] + n[2]) - n[3];
					break;
			}

			textDisplay = `\\( ${taskStr} = \\)`;
			s = `\\[ ${taskStr} = ${step1} = ${res} \\]`;

		}
		break;
	}

	/*
	case 'einheiten_umrechnen': {
		if (isQuizMode) {
			const groups = [
				{ units: ['mm', 'cm', 'dm', 'm', 'km'], factors: [10, 10, 10, 1000] },
				{ units: ['mm²', 'cm²', 'dm²', 'm²', 'a', 'ha', 'km²'], factors: [100, 100, 100, 100, 100, 100] },
				{ units: ['mm³', 'cm³', 'dm³', 'm³'], factors: [1000, 1000, 1000] },
				{ units: ['mg', 'g', 'kg', 't'], factors: [1000, 1000, 1000] },
				{ units: ['s', 'min', 'h'], factors: [60, 60] }
			];
		
			const g = groups[randInt(0, groups.length - 1)];
			const isTimeGroup = g.units[0] === 's';
			const is1000Group = g.units[0] === 'mm³' || g.units[0] === 'mg';
			const termCount = is1000Group ? 2 : 3; // Bei 1000er-Faktoren nur 2 Summanden
		
			let termUnitIdx;
			if (termCount === 2) {
				const start = randInt(0, g.units.length - 2);
				termUnitIdx = [start, start + 1];
			} else {
				const mid = randInt(1, g.units.length - 2);
				termUnitIdx = [mid - 1, mid, mid + 1];
			}
		
			// Ziel-Einheit vorgeben: immer die kleinste Einheit im Term-Set.
			// Ausnahme: bei Zeit mit 3 Summanden (s/min/h) ist 'min' das Ziel,
			// damit s÷60 und h×60 sinnvolle Werte ergeben.
			let targetIdx;
			if (termCount === 3) {
				const sortedIdx = [...termUnitIdx].sort((a, b) => a - b);
				targetIdx = isTimeGroup ? sortedIdx[1] : sortedIdx[0];
			} else {
				targetIdx = Math.min(...termUnitIdx);
			}
			const targetUnit = g.units[targetIdx];
		
			// Skalenfaktoren auf kleinste Einheit der Gruppe
			const scales = [1];
			for (let i = 1; i < g.units.length; i++) {
				scales[i] = scales[i - 1] * g.factors[i - 1];
			}
		
			const timeTargetLimits = { s: 300, min: 150, h: 3 };
			const timeValuePools = {
				s: Array.from({ length: 20 }, (_, i) => (i + 1) * 15),
				min: [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10, 15, 20, 30, 45, 60, 90, 120, 150],
				h: [0.5, 1, 1.5, 2, 2.5, 3]
			};
		
			const fmtNum = (num) => {
				const rounded = Number((Math.round(num * 10) / 10).toFixed(1).replace(/\.0$/, ''));
				return comma(rounded);
			};
		
			const pickSimpleValue = () => {
				if (Math.random() < 0.8) {
					return randInt(1, 12); // bevorzugt ganze Zahlen
				}
				return randInt(2, 20) / 2; // sonst 0,5-Schritte
			};
		
			const pickTimeValue = (idx) => {
				const unit = g.units[idx];
				const factorToTarget = scales[idx] / scales[targetIdx];
				const maxSourceValue = timeTargetLimits[targetUnit] / factorToTarget;
				const candidates = timeValuePools[unit].filter((value) => value <= maxSourceValue);
				if (candidates.length === 0) {
					return null;
				}
				return candidates[randInt(0, candidates.length - 1)];
			};
		
			let terms;
			let ops;
			let converted;
			let resultInTarget;
			const maxTargetValue = isTimeGroup ? timeTargetLimits[targetUnit] : Infinity;
		
			for (let attempts = 0; attempts < 200; attempts++) {
				const values = termUnitIdx.map((idx) => isTimeGroup ? pickTimeValue(idx) : pickSimpleValue());
				if (values.some((value) => value === null)) {
					continue;
				}
		
				terms = termUnitIdx.map((idx, index) => ({
					idx,
					unit: g.units[idx],
					value: values[index]
				}));
		
				// Mindestens ein Summand als ganze Zahl (ohne Nachkommastelle)
				if (!isTimeGroup && !terms.some((t) => Number.isInteger(t.value))) {
					continue;
				}
		
				if (termCount === 2) {
					ops = [Math.random() < 0.5 ? '+' : '-'];
				} else {
					const patterns = [['+', '+'], ['+', '-'], ['-', '+'], ['-', '-']];
					ops = patterns[randInt(0, patterns.length - 1)];
				}
		
				converted = terms.map((t) => t.value * (scales[t.idx] / scales[targetIdx]));
				if (converted.some((value) => value > maxTargetValue)) {
					continue;
				}
				// Alle umgerechneten Summanden müssen max. 1 Nachkommastelle haben
				if (converted.some((v) => Math.abs(v * 10 - Math.round(v * 10)) > 1e-9)) {
					continue;
				}
		
				resultInTarget = converted[0];
				let hasNegativeIntermediate = resultInTarget < 0;
				for (let i = 0; i < ops.length; i++) {
					resultInTarget = ops[i] === '+' ? resultInTarget + converted[i + 1] : resultInTarget - converted[i + 1];
					if (resultInTarget < 0) {
						hasNegativeIntermediate = true;
						break;
					}
				}
		
				// Keine negativen Zwischenergebnisse und positives Endergebnis
				if (!hasNegativeIntermediate && resultInTarget > 0 && resultInTarget <= maxTargetValue) {
					break;
				}
			}
		
			const displayExprParts = [`${fmtNum(terms[0].value)} ${terms[0].unit}`];
			for (let i = 1; i < terms.length; i++) {
				displayExprParts.push(`${ops[i - 1]} ${fmtNum(terms[i].value)} ${terms[i].unit}`);
			}
		
			const targetExprParts = [`${fmtNum(converted[0])} ${targetUnit}`];
			for (let i = 1; i < converted.length; i++) {
				targetExprParts.push(`${ops[i - 1]} ${fmtNum(converted[i])} ${targetUnit}`);
			}
		
			const displayExpr = displayExprParts.join(' ');
			const targetExpr = targetExprParts.join(' ');
		
			textDisplay = `${displayExpr} = ${blank(3)} ${targetUnit}`;
			s = `${displayExpr} <br>= ${targetExpr} = ${fmtNum(resultInTarget)} ${targetUnit}`;
			answer = { kind: 'number', value: resultInTarget };
		} else {
			textDisplay = '';
			textPrint = '';
			s = '';
		}
		break;
	} 
	*/


	case 'terme_einsetzen': {
		if (isQuizMode) {
			// Ein Term aus den Vorrangregeln mit einer Variablen anstelle einer Zahl.
			let nums = [];
			while (nums.length < 4) {
				const value = randInt(2, 13);
				if (!nums.includes(value)) nums.push(value);
			}
			nums.sort((x, y) => x - y);

			const n = nums;
			const xValue = randInt(-5, 5);
			const xSubstitution = xValue < 0 ? `(${xValue})` : `${xValue}`;
			const f = fmt;
			const coefficientTerm = (number) => grade >= 8 ? `${number}x` : `${number} \\cdot x`;
			let termStr, substitutedTermStr, step1, result;

			switch (randInt(0, 4)) {
				case 0:
					termStr = `${n[0]} - ${coefficientTerm(n[2])}`;
					substitutedTermStr = `${n[0]} - ${xSubstitution} \\cdot ${n[2]}`;
					step1 = `${n[0]} - ${xValue * n[2]}`;
					result = n[0] - xValue * n[2];
					break;
				case 1:
					termStr = `x^2 - ${n[0]} \\cdot ${n[2]}`;
					substitutedTermStr = `${xSubstitution}^2 - ${n[0]} \\cdot ${n[2]}`;
					step1 = `${xValue * xValue} - ${n[0] * n[2]}`;
					result = xValue * xValue - n[0] * n[2];
					break;
				case 2:
					termStr = `${n[0]} \\cdot (x^2 - ${n[2]})`;
					substitutedTermStr = `${n[0]} \\cdot (${xSubstitution}^2 - ${n[2]})`;
					step1 = `${n[0]} \\cdot ${f(xValue * xValue - n[2])}`;
					result = n[0] * (xValue * xValue - n[2]);
					break;
				case 3:
					termStr = `${coefficientTerm(n[1])} - ${n[2]} \\cdot ${n[3]}`;
					substitutedTermStr = `${xSubstitution} \\cdot ${n[1]} - ${n[2]} \\cdot ${n[3]}`;
					step1 = `${xValue * n[1]} - ${n[2] * n[3]}`;
					result = xValue * n[1] - n[2] * n[3];
					break;
				default:
					termStr = `${n[1]} \\cdot (${n[0]} + x) - ${n[2]}`;
					substitutedTermStr = `${n[1]} \\cdot (${n[0]} + ${xSubstitution}) - ${n[2]}`;
					step1 = `${n[1]} \\cdot ${n[0] + xValue} - ${n[2]}`;
					result = (n[0] + xValue) * n[1] - n[2];
					break;
			}

			textDisplay = `Berechne \\( ${termStr} \\; \\) mit \\( \\; x = ${xValue}\\).`;
			s = `\\[ ${substitutedTermStr} = ${step1} = ${result} \\]`;
			answer = numericAnswer(result);
		} else {
			console.warn(`MTG: Aufgabentyp "terme_einsetzen" ist im Arbeitsblatt-Modus nicht implementiert.`);
		}
		break;
	}
		default:
			console.warn(`MTG: Unbekannter Aufgabentyp "${type}" – keine Aufgabe generiert.`);
	}
	
	if (!textPrint) {
		textPrint = textDisplay;
	}
	if (!textDisplay) {
		textDisplay = textPrint;
	}

	const taskResult = { textDisplay, textPrint, solution: s };
	if (isQuizMode) taskResult.answer = answer;
	return taskResult;
};

if (typeof window !== 'undefined' && window.MTGTaskTypes?.validateCases) {
	const taskCases = new Set(
		[...createTask.toString().matchAll(/\bcase\s+(['"])([^'"]+)\1\s*:/g)]
			.map(match => match[2])
	);
	window.MTGTaskTypes.validateCases(taskCases);
}
