// ============================================================
// QUIZ-AUTO-SINGLE: Vue 3 App für den Endlosmodus (Einzelfragen)
// mit Streaks und Musterlösung
// ============================================================

const { createApp, ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } = Vue;

const app = createApp({
	components: {
		'math-key-input': window.MathKeyInputComponent
	},
	setup() {
		const grade = ref(10);
		const selectedTypes = ref([]);
		const shareLink = window.MTGShareLinkModule.createCodec(window.MTGShareLinkTypeRegistry);
		const initialShareConfig = shareLink.read(window.location.href);
		if (initialShareConfig.grade !== null) {
			grade.value = initialShareConfig.grade;
		}
		const quizStarted = ref(false);
		const showResultOverview = ref(false);
		const resultOverview = ref(null);
		const studentName = ref('');

		// Aktuelle Einzelfrage
		const currentTask = ref(null);
		const taskHistory = ref([]);
		const currentTaskIndex = ref(0);
		const taskCounter = ref(0);
		const taskInputRef = ref(null);

		// Laufende Statistiken
		const stats = reactive({
			correct: 0,
			totalChecked: 0,
			streak: 0,
			bestStreak: 0
		});

		// Verfügbare Typen je nach Stufe: alle für die Klasse definierten Aufgabentypen anzeigen
		const availableTypes = computed(() => {
			const configured = taskTypesByGrade[`klasse${grade.value}`] || [];
			return [...new Set(configured)].sort((a, b) => {
				const orderA = typeOrderIndex[a] ?? Number.MAX_SAFE_INTEGER;
				const orderB = typeOrderIndex[b] ?? Number.MAX_SAFE_INTEGER;
				if (orderA !== orderB) return orderA - orderB;
				return a.localeCompare(b);
			});
		});

		if (initialShareConfig.types && initialShareConfig.types.length > 0) {
			const allowed = new Set(availableTypes.value);
			selectedTypes.value = initialShareConfig.types.filter(type => allowed.has(type));
		}

		const stripHtml = (value = '') => String(value)
			.replace(/<br\s*\/?>/gi, '\n')
			.replace(/<[^>]*>/g, '')
			.replace(/&nbsp;/gi, ' ')
			.replace(/&amp;/gi, '&')
			.replace(/&lt;/gi, '<')
			.replace(/&gt;/gi, '>')
			.replace(/&quot;/gi, '"')
			.replace(/&#039;/gi, "'")
			.replace(/\s+/g, ' ')
			.trim();

		const buildResultOverview = () => {
			const checkedTasks = taskHistory.value.filter(task => !!task.checked);
			const tasks = checkedTasks.map((task, index) => ({
				taskNumber: index + 1,
				type: task.type,
				typeLabel: window.typeLabels?.[task.type] || task.type,
				prompt: stripHtml(task.textDisplay),
				promptHtml: task.textDisplay || '',
				userInput: task.userInput || '',
				status: task.checked ? (task.correct ? 'richtig' : 'falsch') : 'nicht geprüft',
				correct: !!task.correct,
				solution: stripHtml(task.solution || ''),
				solutionHtml: task.solution || ''
			}));
			const currentStudentName = (studentName.value || '').trim();
			const totalChecked = checkedTasks.length;
			const correctCount = checkedTasks.filter(task => task.correct).length;

			return {
				studentName: currentStudentName,
				quizName: currentStudentName,
				grade: grade.value,
				date: new Date().toLocaleDateString('de-DE'),
				selectedTypes: [...selectedTypes.value],
				totalTasks: tasks.length,
				totalChecked,
				correct: correctCount,
				incorrect: Math.max(totalChecked - correctCount, 0),
				successRate: totalChecked === 0 ? 0 : Math.round((correctCount / totalChecked) * 100),
				bestStreak: stats.bestStreak,
				tasks
			};
		};

		const selectRandomTypes = () => {
			const pool = [...availableTypes.value];
			const selected = [...pool];
			for (let i = selected.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[selected[i], selected[j]] = [selected[j], selected[i]];
			}
			selectedTypes.value = selected.slice(0, Math.min(7, selected.length));
			if (selectedTypes.value.length === 0) {
				selectedTypes.value = [...availableTypes.value];
			}
		};

		const selectAllTypes = () => {
			selectedTypes.value = [...availableTypes.value];
		};

		const clearTypes = () => {
			selectedTypes.value = [];
		};

		const onGradeChange = () => {
			const allowed = new Set(availableTypes.value);
			selectedTypes.value = selectedTypes.value.filter(type => allowed.has(type));
		};

		const syncShareUrl = () => {
			const allowed = new Set(availableTypes.value);
			const types = selectedTypes.value.filter(type => allowed.has(type));
			const url = shareLink.write(window.location.href, {
				grade: grade.value,
				types
			});
			const nextUrl = `${url.pathname}${url.search}${url.hash}`;
			const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
			if (nextUrl !== currentUrl) {
				try {
					window.history.replaceState({}, '', url);
				} catch (e) {
					// Ignore on restrictive file:// environments
				}
			}
		};

		watch([grade, selectedTypes], syncShareUrl, { deep: true });

		const typesetMathJax = async () => {
			const waitForMathJax = async (maxAttempts = 30) => {
				for (let attempt = 0; attempt < maxAttempts; attempt++) {
					if (window.MathJax?.typesetPromise) return true;
					await new Promise(resolve => setTimeout(resolve, 150));
				}
				return !!window.MathJax?.typesetPromise;
			};

			if (await waitForMathJax()) {
				try {
					await window.MathJax.typesetPromise();
				} catch (error) {
					console.warn('MathJax rendering failed:', error);
					try {
						window.MathJax.typeset();
					} catch (fallbackError) {
						console.warn('MathJax fallback rendering failed:', fallbackError);
					}
				}
			}
		};

		const renderMathInSummary = async () => {
			await nextTick();
			await new Promise(resolve => setTimeout(resolve, 0));
			await typesetMathJax();
		};

		const generateSingleTask = () => {
			if (selectedTypes.value.length === 0) return null;

			const type = selectedTypes.value[randInt(0, selectedTypes.value.length - 1)];
			const generated = createTask(type, grade.value, { training: true });

			return reactive({
				type,
				textDisplay: generated.textDisplay,
				solution: generated.solution,
				answer: generated.answer,
				userInput: '',
				checked: false,
				correct: false
			});
		};

		const focusCurrentInput = async () => {
			await nextTick();
			taskInputRef.value?.focusInput?.();
		};

		const startQuiz = async () => {
			if (selectedTypes.value.length === 0) return;

			showResultOverview.value = false;
			resultOverview.value = null;

			const firstTask = generateSingleTask();
			if (!firstTask) return;

			quizStarted.value = true;
			taskHistory.value = [firstTask];
			currentTaskIndex.value = 0;
			taskCounter.value = 1;
			currentTask.value = firstTask;

			await nextTick();
			await typesetMathJax();
			await focusCurrentInput();
		};

		const checkCurrentTask = async () => {
			if (!currentTask.value || currentTask.value.checked) return;

			const task = currentTask.value;
			task.checked = true;
			task.correct = quizAutoGrading.isCorrect(task.answer, task.userInput);

			stats.totalChecked++;

			if (task.correct) {
				stats.correct++;
				stats.streak++;
				if (stats.streak > stats.bestStreak) {
					stats.bestStreak = stats.streak;
				}
			} else {
				stats.streak = 0;
			}

			await nextTick();
			await typesetMathJax();
		};

		const goToPreviousTask = async () => {
			if (currentTaskIndex.value <= 0) return;

			currentTaskIndex.value -= 1;
			currentTask.value = taskHistory.value[currentTaskIndex.value];
			taskCounter.value = currentTaskIndex.value + 1;

			await nextTick();
			await typesetMathJax();
			await focusCurrentInput();
		};

		const goToNextTask = async () => {
			if (!currentTask.value) return;
			if (currentTaskIndex.value >= taskHistory.value.length - 1) return;

			currentTaskIndex.value += 1;
			currentTask.value = taskHistory.value[currentTaskIndex.value];
			taskCounter.value = currentTaskIndex.value + 1;

			await nextTick();
			await typesetMathJax();
			await focusCurrentInput();
		};

		const nextTask = async () => {
			if (!currentTask.value) return;
			if (!currentTask.value.checked) {
				const lastIndex = taskHistory.value.length - 1;
				if (lastIndex >= 0 && currentTaskIndex.value !== lastIndex) {
					currentTaskIndex.value = lastIndex;
					currentTask.value = taskHistory.value[lastIndex];
					taskCounter.value = lastIndex + 1;
				}
				return;
			}

			const nextGeneratedTask = generateSingleTask();
			if (!nextGeneratedTask) return;

			taskHistory.value.push(nextGeneratedTask);
			currentTaskIndex.value = taskHistory.value.length - 1;
			currentTask.value = nextGeneratedTask;
			taskCounter.value = taskHistory.value.length;

			await nextTick();
			await typesetMathJax();
			await focusCurrentInput();
		};

		const handleGlobalKeydown = async (event) => {
			if (event.key !== 'Enter') return;
			if (!currentTask.value || !currentTask.value.checked) return;
			if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
				return;
			}
			event.preventDefault();
			await nextTask();
		};

		onMounted(() => {
			window.addEventListener('keydown', handleGlobalKeydown);
		});

		onBeforeUnmount(() => {
			window.removeEventListener('keydown', handleGlobalKeydown);
		});

		const resetCurrentStats = () => {
			stats.correct = 0;
			stats.totalChecked = 0;
			stats.streak = 0;
		};

		const exitQuiz = async () => {
			const snapshot = buildResultOverview();
			resultOverview.value = snapshot;
			showResultOverview.value = true;
			quizStarted.value = false;
			taskHistory.value = [];
			currentTaskIndex.value = 0;
			taskCounter.value = 0;
			currentTask.value = null;
			await renderMathInSummary();
		};

		const returnToSetup = () => {
			showResultOverview.value = false;
			quizStarted.value = false;
			resultOverview.value = null;
			taskHistory.value = [];
			currentTaskIndex.value = 0;
			taskCounter.value = 0;
			currentTask.value = null;
			stats.correct = 0;
			stats.totalChecked = 0;
			stats.streak = 0;
		};

		const sanitizeFileNamePart = (value = '') => {
			const normalized = (value == null ? '' : String(value))
				.trim()
				.replace(/[\\/:*?"<>|]+/g, '')
				.replace(/\s+/g, ' ')
				.replace(/^\.+/, '')
				.slice(0, 40);
			return normalized || 'Schueler';
		};

		const isValidStudentNameWithClass = (value = '') => {
			const normalized = String(value || '').replace(/\s+/g, '').toLowerCase();
			if (!normalized) return false;
			if (!/[a-z]{2,}/.test(normalized)) return false;
			return /(?:[5-9]|10)[a-c]/.test(normalized);
		};

		const AUTH_SECRET = 'PythagorasThalesLaplace';

		const encryptJsonAesGcm = async (jsonString, password) => {
			const enc = new TextEncoder();
			const keyHash = await crypto.subtle.digest('SHA-256', enc.encode(password));
			const cryptoKey = await crypto.subtle.importKey(
				'raw',
				keyHash,
				{ name: 'AES-GCM' },
				false,
				['encrypt']
			);
			const iv = crypto.getRandomValues(new Uint8Array(12));
			const encryptedBuffer = await crypto.subtle.encrypt(
				{ name: 'AES-GCM', iv },
				cryptoKey,
				enc.encode(jsonString)
			);
			const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
			combined.set(iv, 0);
			combined.set(new Uint8Array(encryptedBuffer), iv.length);

			let binary = '';
			const chunkSize = 0x8000;
			for (let i = 0; i < combined.length; i += chunkSize) {
				binary += String.fromCharCode.apply(null, combined.subarray(i, i + chunkSize));
			}
			return btoa(binary);
		};

		const saveResultOverview = async () => {
			try {
				let enteredStudentName = '';
				while (true) {
					enteredStudentName = window.prompt('Gib für die richtige Zuordnung der Datei deinen Namen und deine Klasse ein:', studentName.value || '');
					if (enteredStudentName === null) return;
					const trimmedName = enteredStudentName.trim();
					if (isValidStudentNameWithClass(trimmedName)) {
						studentName.value = trimmedName;
						break;
					}
					alert('Gib einen gültigen Namen mit Klassenangabe ein, z. B. "Bernd 8b".');
				}
				const data = resultOverview.value || buildResultOverview();
				const resolvedStudentName = studentName.value || data.studentName || 'Schüler';
				const exportRows = data.tasks.map(task => ({
					taskNumber: task.taskNumber,
					typeLabel: task.typeLabel,
					prompt: task.prompt,
					promptHtml: task.promptHtml || task.prompt || '',
					userInput: task.userInput,
					correct: !!task.correct,
					solution: task.solution,
					solutionHtml: task.solutionHtml || task.solution || ''
				}));

				const payload = {
					quizName: data.quizName,
					studentName: resolvedStudentName,
					grade: data.grade,
					date: data.date,
					selectedTypes: data.selectedTypes,
					totalTasks: data.totalTasks,
					totalChecked: data.totalChecked,
					correct: data.correct,
					incorrect: data.incorrect,
					successRate: data.successRate,
					bestStreak: data.bestStreak,
					tasks: exportRows
				};

				const plainJson = JSON.stringify(payload, null, 2);
				const encryptedAuthor = await encryptJsonAesGcm(plainJson, AUTH_SECRET);
				const safePlainJson = plainJson.replace(/<\/script/gi, '<\\/script');

				const safeName = sanitizeFileNamePart(resolvedStudentName || data.studentName || 'Schueler');
				const exportDate = new Date().toISOString().slice(0, 10);
				const exportFileName = `Mathe-Training_${exportDate}_${safeName}.html`;

				const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="author" content="${encryptedAuthor}">
  <title>Ergebnisübersicht</title>
  <script>
    window.MathJax = {
      tex: {
        inlineMath: [['\\\\(', '\\\\)']],
        displayMath: [['\\\\[', '\\\\]']]
      },
      chtml: { mtextInheritFont: true, matchFontHeight: false, scale: 1 },
      svg: { fontCache: 'global' }
    };
  </script>
  <script defer src="https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml.js"></script>
  <style>
    body { font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 32px; }
    .wrap { max-width: 1100px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; box-shadow: 0 12px 32px rgba(15,23,42,0.05); padding: 28px; }
    h1 { margin-top: 0; color: #0f172a; }
    .meta {
      display: flex;
      flex-wrap: nowrap;
      gap: 12px;
      margin: 20px 0;
      overflow-x: auto;
      padding-bottom: 6px;
    }
    .meta-item {
      flex: 1 1 160px;
      min-width: 140px;
      background: #f1f5f9;
      border-radius: 12px;
      padding: 10px 12px;
      white-space: nowrap;
    }
    .label { display: block; color: #475569; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    .value { font-size: 1rem; font-weight: 700; margin-top: 5px; line-height: 1.2; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: center; vertical-align: top; }
    th { background: #f8fafc; text-align: center; }
    .result-cell { font-weight: 700; text-align: center; }
    .result-cell--correct { color: #15803d; }
    .result-cell--incorrect { color: #b91c1c; }
    .number-line-svg { width: 50%; height: auto; display: block; margin: 0 auto; }
    @media (max-width: 700px) { body { padding: 16px; } .wrap { padding: 18px; } table { font-size: 0.85rem; } }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Ergebnisübersicht</h1>
    <div id="result-meta" class="meta">
      <!-- Wird beim Öffnen zur Laufzeit aus dem Klartext-JSON generiert -->
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Typ</th>
          <th>Aufgabe</th>
          <th>Antwort</th>
          <th>R/F</th>
          <th>Lösung</th>
        </tr>
      </thead>
      <tbody id="result-rows">
        <!-- Wird beim Öffnen zur Laufzeit aus dem Klartext-JSON generiert -->
      </tbody>
    </table>
  </div>

  <script type="application/json" id="quiz-result-data">
${safePlainJson}
  </script>

  <script>
    (function () {
      function escapeHtml(text) {
        if (!text) return '';
        return String(text)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }

      function renderOverview() {
        var dataElement = document.getElementById('quiz-result-data');
        if (!dataElement) return;

        var payload;
        try {
          payload = JSON.parse(dataElement.textContent || '{}');
        } catch (e) {
          console.error('Ungültiges Datenformat im Dokument:', e);
          return;
        }

        var metaEl = document.getElementById('result-meta');
        if (metaEl) {
          var studentName = payload.studentName || payload.quizName || 'Schüler';
          var grade = payload.grade !== undefined ? payload.grade : '—';
          var date = payload.date || '—';
          var correct = payload.correct != null ? payload.correct : 0;
          var totalChecked = payload.totalChecked != null ? payload.totalChecked : 0;
          var successRate = payload.successRate != null ? payload.successRate : (totalChecked > 0 ? Math.round((correct / totalChecked) * 100) : 0);
          var bestStreak = payload.bestStreak != null ? payload.bestStreak : 0;

          metaEl.innerHTML = [
            '<div class="meta-item"><span class="label">Name / Klasse</span><div class="value">' + escapeHtml(studentName) + '</div></div>',
            '<div class="meta-item"><span class="label">Stufe</span><div class="value">' + escapeHtml(grade) + '</div></div>',
            '<div class="meta-item"><span class="label">Datum</span><div class="value">' + escapeHtml(date) + '</div></div>',
            '<div class="meta-item"><span class="label">Ergebnis</span><div class="value">' + correct + '/' + totalChecked + ' richtig</div></div>',
            '<div class="meta-item"><span class="label">Quote</span><div class="value">' + successRate + '%</div></div>',
            '<div class="meta-item"><span class="label">Bestserie</span><div class="value">' + bestStreak + '</div></div>'
          ].join('');
        }

        var rowsEl = document.getElementById('result-rows');
        if (rowsEl && Array.isArray(payload.tasks)) {
          var rowsHtml = payload.tasks.map(function (task) {
            var num = task.taskNumber != null ? task.taskNumber : '';
            var type = escapeHtml(task.typeLabel || task.type || '');
            var prompt = task.promptHtml || escapeHtml(task.prompt || '');
            var answer = task.userInput ? escapeHtml(task.userInput) : '—';
            var isCorrect = !!task.correct;
            var resClass = isCorrect ? 'result-cell--correct' : 'result-cell--incorrect';
            var resText = isCorrect ? 'R' : 'F';
            var solution = task.solutionHtml || escapeHtml(task.solution || '—');

            return '<tr>' +
              '<td>' + num + '</td>' +
              '<td>' + type + '</td>' +
              '<td>' + prompt + '</td>' +
              '<td>' + answer + '</td>' +
              '<td class="result-cell ' + resClass + '">' + resText + '</td>' +
              '<td>' + solution + '</td>' +
            '</tr>';
          }).join('');

          rowsEl.innerHTML = rowsHtml;
        }
      }

      function waitForMathJax() {
        return new Promise(function (resolve) {
          var startedAt = Date.now();

          function check() {
            if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
              if (window.MathJax.startup && window.MathJax.startup.promise && typeof window.MathJax.startup.promise.then === 'function') {
                window.MathJax.startup.promise.then(resolve, resolve);
                return;
              }
              resolve();
              return;
            }

            if (Date.now() - startedAt > 5000) {
              resolve();
              return;
            }

            setTimeout(check, 50);
          }

          check();
        });
      }

      async function renderMath() {
        await waitForMathJax();
        if (!window.MathJax || typeof window.MathJax.typesetPromise !== 'function') {
          return;
        }
        try {
          await window.MathJax.typesetPromise();
        } catch (error) {
          try {
            window.MathJax.typeset();
          } catch (fallbackError) {
            console.warn('MathJax export render failed:', fallbackError);
          }
        }
      }

      async function init() {
        renderOverview();
        await renderMath();
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    })();
  </script>
</body>
</html>`;

				const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
				const url = URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = exportFileName;
				document.body.appendChild(link);
				link.click();
				link.remove();
				URL.revokeObjectURL(url);
			} catch (error) {
				console.error('Ergebnis konnte nicht exportiert werden:', error);
				alert('Das Ergebnis konnte nicht gespeichert werden.');
			}
		};

		const successRate = computed(() => {
			if (stats.totalChecked === 0) return 0;
			return Math.round((stats.correct / stats.totalChecked) * 100);
		});

		return {
			grade,
			selectedTypes,
			quizStarted,
			currentTask,
			taskHistory,
			currentTaskIndex,
			taskCounter,
			taskInputRef,
			stats,
			availableTypes,
			typeLabels: window.typeLabels,
			successRate,
			selectRandomTypes,
			selectAllTypes,
			clearTypes,
			onGradeChange,
			startQuiz,
			checkCurrentTask,
			goToPreviousTask,
			goToNextTask,
			nextTask,
			resetCurrentStats,
			exitQuiz,
			returnToSetup,
			showResultOverview,
			resultOverview,
			saveResultOverview
		};
	}
});

app.component('math-key-input', window.MathKeyInputComponent);
app.mount('#app');
