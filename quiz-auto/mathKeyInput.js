// ============================================================
// QUIZ-AUTO-SINGLE: Eingabefeld mit optionaler virtueller Tastatur
// Vorbereitet für die spätere Erweiterung auf Exponenten (x^y)
// und visuelle Bruch-Templates (a/b-Vorlagen).
// Nutzung: <math-key-input v-model="value" @confirm="..." />
// ============================================================

(function () {
	// Standard Tasten-Layout
	const KEY_ROWS = [
		['7', '8', '9', '+', '-'],
		['4', '5', '6', '·', ':'],
		['1', '2', '3', '(', ')'],
		['0', ',', 'π', '√', '='],
		['x²', 'x³', '⌫', '←', '→']
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
				keyboardOpen: false
			};
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
				const displayKey = key === 'x²' ? '²' : key === 'x³' ? '³' : key === '√' ? '√(' : key;
				const nextDisplayValue = `${displayValue.slice(0, start)}${displayKey}${displayValue.slice(end)}`;
				this.setValue(this.toModelValue(nextDisplayValue));
				this.setCursorPosition(start + displayKey.length);
			},
			handleKey(key) {
				if (key === '⌫') {
					this.backspace();
				} else if (key === '←') {
					this.moveCursor(-1);
				} else if (key === '→') {
					this.moveCursor(1);
				} else {
					this.pressKey(key);
				}
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
				this.keyboardOpen = !this.keyboardOpen;
			},
			focusInput() {
				this.$refs.input?.focus();
			}
		},
		template: `
			<div class="math-key-input">
				<div class="math-key-input-row">
					<input
						ref="input"
						type="text"
						inputmode="text"
						class="math-key-input-field"
						:value="toDisplayValue(modelValue)"
						:disabled="disabled"
						@input="onInput"
						@keydown="onKeydown"
						placeholder="Ergebnis"
						autocomplete="off"
					>
					<button type="button" class="math-key-input-toggle" @click="toggleKeyboard" :aria-pressed="keyboardOpen" :aria-expanded="keyboardOpen" aria-controls="math-key-pad" :disabled="disabled" title="Tastatur ein-/ausblenden" aria-label="Virtuelle Tastatur ein- oder ausblenden">⌨</button>
				</div>
				<div v-if="keyboardOpen" id="math-key-pad" class="math-key-pad" role="group" aria-label="Virtuelle Mathe-Tastatur">
					<div v-for="(row, rowIndex) in $options.KEY_ROWS" :key="rowIndex" class="math-key-pad-row">
						<button v-for="key in row" :key="key" type="button" :class="['math-key-pad-btn', { 'math-key-pad-btn--backspace': key === '⌫', 'math-key-pad-btn--navigation': key === '←' || key === '→' }]" @click="handleKey(key)" :disabled="disabled" :aria-label="key === '⌫' ? 'Letztes Zeichen löschen' : key === '←' ? 'Cursor nach links' : key === '→' ? 'Cursor nach rechts' : 'Eingabe ' + key">{{ key }}</button>
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
