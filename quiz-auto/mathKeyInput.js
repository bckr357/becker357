// ============================================================
// QUIZ-AUTO-SINGLE: Eingabefeld mit optionaler virtueller Tastatur
// Vorbereitet für die spätere Erweiterung auf Exponenten (x^y)
// und visuelle Bruch-Templates (a/b-Vorlagen).
// Nutzung: <math-key-input v-model="value" @confirm="..." />
// ============================================================

(function () {
	// Umschalter-Taste (ersetzt die vormals freie Taste)
	const KEY_TOGGLE = '⇄';

	// Standard Tasten-Layout (Zahlen/Operatoren)
	const KEY_ROWS = [
		['+', '–', '7', '8', '9'],
		['·', '⁄', '4', '5', '6'],
		['(', ')', '1', '2', '3'],
		['x²', 'x³', 'π', '0', ','],
		[KEY_TOGGLE, '=', '←', '⌫', '→']
	];

	// Variablen-/Einheiten-Layout (für Terme, Gleichungen und Einheiten).
	// Enthält a, b, x, y, z sowie die nötigen Einheiten ohne ² und ³.
	// Steuer- und =-Tasten bleiben unverändert.

	const KEY_ROWS_VARIABLES = [
		['€', '%', 'x²', 'x³', '⌫'],
		['a', 'b', 'c', 'd', 'f'],
		['g', 'h', 'i', 'k', 'l'],
		['m', 'n', 'r', 's', 't'],
		[KEY_TOGGLE, 'u', 'x', 'y', 'z']
	];

	const MathKeyInputComponent = {
		props: {
			modelValue: { type: String, default: '' },
			disabled: { type: Boolean, default: false },
			mode: { type: String, default: 'basic' } // 'basic' | 'advanced'
		},
		emits: ['update:modelValue', 'confirm'],
		data() {
			return {
				keyboardOpen: false,
				inputKeyboardEnabled: false,
				variableMode: false
			};
		},
		computed: {
			activeKeyRows() {
				return this.variableMode ? KEY_ROWS_VARIABLES : KEY_ROWS;
			}
		},
		mounted() {
			if (typeof document !== 'undefined' && !document.getElementById('math-key-input-styles')) {
				const style = document.createElement('style');
				style.id = 'math-key-input-styles';
				style.textContent = `
					.math-key-input { font-family: inherit; }
					.math-key-input-row { display: flex; gap: 8px; margin-bottom: 8px; }
					.math-key-input-field { flex: 1; padding: 12px 16px; font-size: 1.1rem; border: 2px solid #ddd; border-radius: 8px; background: #fafafa; color: #333; transition: border-color 0.2s, box-shadow 0.2s; }
					.math-key-input-field:focus { outline: none; border-color: #4a90d9; box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.2); background: #fff; }
					.math-key-input-field:disabled { background: #f5f5f5; color: #999; cursor: not-allowed; }
					.math-key-input-toggle { width: 48px; height: 48px; border: 2px solid #ddd; border-radius: 8px; background: #fff; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
					.math-key-input-toggle:hover:not(:disabled) { background: #f0f4f8; border-color: #4a90d9; }
					.math-key-input-toggle:focus { outline: none; border-color: #4a90d9; box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.2); }
					.math-key-input-toggle[aria-pressed="true"] { background: #e8f0fe; border-color: #4a90d9; color: #4a90d9; }
					.math-key-input-toggle:disabled { opacity: 0.5; cursor: not-allowed; }
					.math-key-pad { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 12px; padding: 12px; display: grid; grid-template-columns: repeat(5, minmax(40px, 1fr)); gap: 6px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
					.math-key-pad-row { display: contents; }
					.math-key-pad-btn { aspect-ratio: 1; min-height: 40px; border: none; border-radius: 8px; background: #fff; font-size: 0.9rem; font-weight: 500; color: #333; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); }
					.math-key-pad-btn:hover:not(:disabled) { background: #f0f4f8; transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12); }
					.math-key-pad-btn:active:not(:disabled) { transform: translateY(0); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08); }
					.math-key-pad-btn:focus { outline: none; border: 2px solid #4a90d9; box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.2); }
					.math-key-pad-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
					.math-key-pad-btn--backspace { background: #fff5f5; color: #c53030; }
					.math-key-pad-btn--backspace:hover:not(:disabled) { background: #fed7d7; }
					.math-key-pad-btn--navigation { background: #f0f4f8; color: #4a90d9; }
					.math-key-pad-btn--navigation:hover:not(:disabled) { background: #e0eaf7; }
					.math-key-pad-btn--digit { background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; }
					.math-key-pad-btn--digit:hover:not(:disabled) { background: #e0f2fe; transform: translateY(-1px); box-shadow: 0 2px 6px rgba(2, 132, 199, 0.15); }
					.math-key-pad-btn--toggle { background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; font-weight: 700; }
					.math-key-pad-btn--toggle:hover:not(:disabled) { background: #e0e7ff; }
					.math-key-pad-btn--toggle[aria-pressed="true"] { background: #4338ca; color: #fff; border-color: #4338ca; }
					@media (prefers-color-scheme: dark) {
						:root:not([data-theme="light"]) .math-key-input-field { background: #334155; color: #f8fafc; border-color: #475569; }
						:root:not([data-theme="light"]) .math-key-input-field:focus { background: #334155; border-color: #38bdf8; box-shadow: inset 0 2px 6px rgba(56, 189, 248, 0.08), 0 0 0 4px rgba(56, 189, 248, 0.16); }
						:root:not([data-theme="light"]) .math-key-input-field::placeholder { color: #94a3b8; }
						:root:not([data-theme="light"]) .math-key-input-toggle { background: #334155; color: #e2e8f0; border-color: #475569; }
						:root:not([data-theme="light"]) .math-key-input-toggle:hover:not(:disabled),
						:root:not([data-theme="light"]) .math-key-input-toggle[aria-pressed="true"] { background: #1e4976; color: #bfdbfe; border-color: #38bdf8; }
						:root:not([data-theme="light"]) .math-key-pad { background: #0f172a; border-color: #334155; box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28); }
						:root:not([data-theme="light"]) .math-key-pad-btn { background: #334155; color: #e2e8f0; border: 1px solid #475569; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.18); }
						:root:not([data-theme="light"]) .math-key-pad-btn:hover:not(:disabled) { background: #3f536b; border-color: #38bdf8; }
						:root:not([data-theme="light"]) .math-key-pad-btn--backspace { background: #4a2b30; color: #fca5a5; border-color: #7f3d45; }
						:root:not([data-theme="light"]) .math-key-pad-btn--backspace:hover:not(:disabled) { background: #61343a; border-color: #f87171; }
						:root:not([data-theme="light"]) .math-key-pad-btn--navigation { background: #253449; color: #93c5fd; border-color: #3a4f69; }
						:root:not([data-theme="light"]) .math-key-pad-btn--navigation:hover:not(:disabled) { background: #30465f; border-color: #38bdf8; }
						:root:not([data-theme="light"]) .math-key-pad-btn--digit { background: #1e3a5f; color: #7dd3fc; border-color: #285b87; }
						:root:not([data-theme="light"]) .math-key-pad-btn--digit:hover:not(:disabled) { background: #26496f; border-color: #38bdf8; box-shadow: 0 2px 6px rgba(56, 189, 248, 0.18); }
						:root:not([data-theme="light"]) .math-key-pad-btn--toggle { background: #312e81; color: #c7d2fe; border-color: #4338ca; }
						:root:not([data-theme="light"]) .math-key-pad-btn--toggle:hover:not(:disabled) { background: #3730a3; border-color: #6366f1; }
						:root:not([data-theme="light"]) .math-key-pad-btn--toggle[aria-pressed="true"] { background: #4338ca; color: #fff; border-color: #818cf8; }
					}
					:root[data-theme="dark"] .math-key-input-field { background: #334155; color: #f8fafc; border-color: #475569; }
					:root[data-theme="dark"] .math-key-input-field:focus { background: #334155; border-color: #38bdf8; box-shadow: inset 0 2px 6px rgba(56, 189, 248, 0.08), 0 0 0 4px rgba(56, 189, 248, 0.16); }
					:root[data-theme="dark"] .math-key-input-field::placeholder { color: #94a3b8; }
					:root[data-theme="dark"] .math-key-input-toggle { background: #334155; color: #e2e8f0; border-color: #475569; }
					:root[data-theme="dark"] .math-key-input-toggle:hover:not(:disabled),
					:root[data-theme="dark"] .math-key-input-toggle[aria-pressed="true"] { background: #1e4976; color: #bfdbfe; border-color: #38bdf8; }
					:root[data-theme="dark"] .math-key-pad { background: #0f172a; border-color: #334155; box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28); }
					:root[data-theme="dark"] .math-key-pad-btn { background: #334155; color: #e2e8f0; border: 1px solid #475569; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.18); }
					:root[data-theme="dark"] .math-key-pad-btn:hover:not(:disabled) { background: #3f536b; border-color: #38bdf8; }
					:root[data-theme="dark"] .math-key-pad-btn--backspace { background: #4a2b30; color: #fca5a5; border-color: #7f3d45; }
					:root[data-theme="dark"] .math-key-pad-btn--backspace:hover:not(:disabled) { background: #61343a; border-color: #f87171; }
					:root[data-theme="dark"] .math-key-pad-btn--navigation { background: #253449; color: #93c5fd; border-color: #3a4f69; }
					:root[data-theme="dark"] .math-key-pad-btn--navigation:hover:not(:disabled) { background: #30465f; border-color: #38bdf8; }
					:root[data-theme="dark"] .math-key-pad-btn--digit { background: #1e3a5f; color: #7dd3fc; border-color: #285b87; }
					:root[data-theme="dark"] .math-key-pad-btn--digit:hover:not(:disabled) { background: #26496f; border-color: #38bdf8; box-shadow: 0 2px 6px rgba(56, 189, 248, 0.18); }
					:root[data-theme="dark"] .math-key-pad-btn--toggle { background: #312e81; color: #c7d2fe; border-color: #4338ca; }
					:root[data-theme="dark"] .math-key-pad-btn--toggle:hover:not(:disabled) { background: #3730a3; border-color: #6366f1; }
					:root[data-theme="dark"] .math-key-pad-btn--toggle[aria-pressed="true"] { background: #4338ca; color: #fff; border-color: #818cf8; }
				`;
				document.head.appendChild(style);
			}
		},
		methods: {
			setValue(next) {
				this.$emit('update:modelValue', next);
			},
			onInput(event) {
				this.setValue(this.toModelValue(event.target.value));
			},
			toDisplayValue(value) {
				return String(value ?? '')
					.replace(/\^2/g, '²')
					.replace(/\^3/g, '³');
			},
			toModelValue(value) {
				return String(value ?? '')
					.replace(/²/g, '^2')
					.replace(/³/g, '^3');
			},
			pressKey(key) {
				if (this.disabled) return;
				const input = this.$refs.input;
				const displayValue = this.toDisplayValue(this.modelValue);
				const start = input?.selectionStart ?? displayValue.length;
				const end = input?.selectionEnd ?? start;
				const displayKey = key === 'x²' ? '²' : key === 'x³' ? '³' : key === '√' ? '√(' : key === '⁄' ? '/' : key;
				const nextDisplayValue = `${displayValue.slice(0, start)}${displayKey}${displayValue.slice(end)}`;
				this.setValue(this.toModelValue(nextDisplayValue));
				this.setCursorPosition(start + displayKey.length);
			},
			handleKey(key) {
				if (key === KEY_TOGGLE) {
					this.toggleVariableMode();
				} else if (key === '⌫') {
					this.backspace();
				} else if (key === '←') {
					this.moveCursor(-1);
				} else if (key === '→') {
					this.moveCursor(1);
				} else {
					this.pressKey(key);
				}
			},
			toggleVariableMode() {
				if (this.disabled) return;
				this.variableMode = !this.variableMode;
				this.focusInput();
			},
			keyLabel(key) {
				if (key === KEY_TOGGLE) return this.variableMode ? '123' : 'abc';
				return key;
			},
			keyAriaLabel(key) {
				if (key === KEY_TOGGLE) return 'Umschalter zwischen Zahlen- und Variablen-/Einheiten-Tastatur';
				if (key === '⌫') return 'Letztes Zeichen löschen';
				if (key === '←') return 'Cursor nach links';
				if (key === '→') return 'Cursor nach rechts';
				return 'Eingabe ' + key;
			},
			backspace() {
				if (this.disabled) return;
				const input = this.$refs.input;
				const displayValue = this.toDisplayValue(this.modelValue);
				const start = input?.selectionStart ?? displayValue.length;
				const end = input?.selectionEnd ?? start;
				if (start === 0 && end === 0) return;
				const nextDisplayValue = start === end
					? `${displayValue.slice(0, start - 1)}${displayValue.slice(end)}`
					: `${displayValue.slice(0, start)}${displayValue.slice(end)}`;
				this.setValue(this.toModelValue(nextDisplayValue));
				this.setCursorPosition(start === end ? start - 1 : start);
			},
			moveCursor(direction) {
				if (this.disabled) return;
				const input = this.$refs.input;
				const displayValue = this.toDisplayValue(this.modelValue);
				const start = input?.selectionStart ?? displayValue.length;
				const end = input?.selectionEnd ?? start;
				const position = direction < 0 ? start : end;
				const nextPosition = Math.max(0, Math.min(displayValue.length, position + direction));
				this.focusInput();
				this.setCursorPosition(nextPosition);
			},
			setCursorPosition(position) {
				this.$nextTick(() => {
					const input = this.$refs.input;
					if (!input) return;
					if (this.keyboardOpen) {
						input.setSelectionRange(position, position);
						return;
					}
					input.focus();
					input.setSelectionRange(position, position);
				});
			},
			clear() {
				if (this.disabled) return;
				this.setValue('');
				this.focusInput();
			},
			confirm() {
				if (this.disabled) return;
				this.$emit('confirm');
			},
			onKeydown(event) {
				if (event.key === 'Enter') {
					event.preventDefault();
					this.confirm();
				}
			},
			toggleKeyboard() {
				if (this.disabled) return;
				const shouldFocusInput = !this.keyboardOpen;
				this.keyboardOpen = shouldFocusInput;
				this.inputKeyboardEnabled = false;
				if (shouldFocusInput) {
					this.$nextTick(() => {
						const input = this.$refs.input;
						if (!input) return;
						input.focus();
						const position = this.toDisplayValue(this.modelValue).length;
						input.setSelectionRange(position, position);
					});
				}
			},
			enableSystemKeyboard(event) {
				if (this.disabled || !this.keyboardOpen) return;
				const input = event?.currentTarget || this.$refs.input;
				if (input) {
					input.removeAttribute('readonly');
					input.setAttribute('inputmode', 'text');
					input.focus();
				}
				this.inputKeyboardEnabled = true;
			},
			focusInput() {
				if (this.keyboardOpen) return;
				this.$refs.input?.focus();
			}
		},
		template: `
			<div class="math-key-input">
				<div class="math-key-input-row">
					<input
						ref="input"
						type="text"
						:inputmode="keyboardOpen && !inputKeyboardEnabled ? 'none' : 'text'"
						class="math-key-input-field"
						:value="toDisplayValue(modelValue)"
						:disabled="disabled"
						:readonly="keyboardOpen && !inputKeyboardEnabled"
						@input="onInput"
						@keydown="onKeydown"
						@pointerdown="enableSystemKeyboard"
						@touchstart="enableSystemKeyboard"
						@mousedown="enableSystemKeyboard"
						placeholder="Ergebnis"
						autocomplete="off"
					>
					<button type="button" class="math-key-input-toggle" @click="toggleKeyboard" :aria-pressed="keyboardOpen" :aria-expanded="keyboardOpen" aria-controls="math-key-pad" :disabled="disabled" title="Tastatur ein-/ausblenden" aria-label="Virtuelle Tastatur ein- oder ausblenden">⌨</button>
				</div>
				<div v-if="keyboardOpen" id="math-key-pad" class="math-key-pad" role="group" aria-label="Virtuelle Mathe-Tastatur">
					<div v-for="(row, rowIndex) in activeKeyRows" :key="rowIndex" class="math-key-pad-row">
						<button v-for="key in row" :key="key" type="button" :class="['math-key-pad-btn', { 'math-key-pad-btn--backspace': key === '⌫', 'math-key-pad-btn--navigation': key === '←' || key === '→', 'math-key-pad-btn--digit': '0123456789'.includes(key), 'math-key-pad-btn--toggle': key === '⇄' }]" @click="handleKey(key)" :disabled="disabled" :aria-label="keyAriaLabel(key)" :aria-pressed="key === '⇄' ? variableMode : null">{{ keyLabel(key) }}</button>
					</div>
				</div>
			</div>
		`,
		KEY_ROWS
	};

	if (typeof window !== 'undefined') {
		window.MathKeyInputComponent = MathKeyInputComponent;
	}
})();
