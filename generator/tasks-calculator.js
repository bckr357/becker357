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

	switch (type) {
		// Grundgerüst – noch keine Aufgaben implementiert.

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
