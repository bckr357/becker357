// ============================================================
// QUIZ-AUTO-SINGLE: Vue 3 App für den Endlosmodus (Einzelfragen)
// mit Streaks, Leaderboard und Musterlösung
// ============================================================

const { createApp, ref, reactive, computed, nextTick, onMounted, onBeforeUnmount } = Vue;

const LOCAL_STORAGE_KEY = 'quiz_auto_single_leaderboard';

const app = createApp({
	components: {
		'math-key-input': window.MathKeyInputComponent
	},
	setup() {
		const grade = ref(10);
		const selectedTypes = ref([]);
		const quizStarted = ref(false);
		const showResultOverview = ref(false);
		const resultOverview = ref(null);

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

		// Leaderboard
		const leaderboard = ref([]);

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

		const loadLeaderboard = () => {
			try {
				const data = localStorage.getItem(LOCAL_STORAGE_KEY);
				if (data) {
					leaderboard.value = JSON.parse(data);
				}
			} catch (e) {
				console.warn('Leaderboard konnte nicht geladen werden:', e);
			}
		};

		const saveLeaderboard = () => {
			try {
				localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(leaderboard.value));
			} catch (e) {
				console.warn('Leaderboard konnte nicht gespeichert werden:', e);
			}
		};

		const updateLeaderboard = (streakScore) => {
			if (streakScore <= 0) return;

			const dateStr = new Date().toLocaleDateString('de-DE', {
				day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
			});

			const entry = {
				streak: streakScore,
				grade: `Klasse ${grade.value}`,
				date: dateStr
			};

			leaderboard.value.push(entry);
			leaderboard.value.sort((a, b) => b.streak - a.streak);
			leaderboard.value = leaderboard.value.slice(0, 5); // Nur Top 5 behalten
			saveLeaderboard();
		};

		const clearLeaderboard = () => {
			leaderboard.value = [];
			try {
				localStorage.removeItem(LOCAL_STORAGE_KEY);
			} catch (e) {}
		};

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

		const toChecksumString = async (value) => {
			if (!window.crypto || !window.crypto.subtle) {
				throw new Error('Web Crypto API nicht verfügbar.');
			}

			const encoder = new TextEncoder();
			const data = encoder.encode(value);
			const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
			return Array.from(new Uint8Array(hashBuffer))
				.map(byte => byte.toString(16).padStart(2, '0'))
				.join('');
		};

		const buildExportVerificationPayload = (data) => ({
			grade: Number(data.grade),
			date: String(data.date),
			totalTasks: Number(data.totalTasks),
			correct: Number(data.correct),
			tasks: (data.tasks || []).map(task => ({
				taskNumber: Number(task.taskNumber),
				typeLabel: String(task.typeLabel || task.type || ''),
				prompt: stripHtml(task.promptHtml || task.prompt || ''),
				userInput: String(task.userInput || ''),
				correct: Boolean(task.correct),
				solution: stripHtml(task.solutionHtml || task.solution || '')
			}))
		});

		const buildResultOverview = () => {
			const tasks = taskHistory.value.map((task, index) => ({
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

			return {
				quizName: 'Quiz-Auto (Einzelfragen)',
				grade: grade.value,
				date: new Date().toLocaleString('de-DE'),
				selectedTypes: [...selectedTypes.value],
				totalTasks: tasks.length,
				totalChecked: stats.totalChecked,
				correct: stats.correct,
				incorrect: Math.max(stats.totalChecked - stats.correct, 0),
				successRate: successRate.value,
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

		const typesetMathJax = async () => {
			if (window.MathJax?.typesetPromise) {
				try {
					await window.MathJax.typesetPromise();
				} catch (error) {
					console.warn('MathJax rendering failed:', error);
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
					updateLeaderboard(stats.bestStreak);
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

		const saveResultOverview = async () => {
			try {
				const data = resultOverview.value || buildResultOverview();
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

				const payloadJson = JSON.stringify(payload);
				const canonicalVerificationPayload = buildExportVerificationPayload(payload);
				const exportId = await toChecksumString(JSON.stringify(canonicalVerificationPayload));
				const payloadJsonForHtml = payloadJson.replace(/<\/script/gi, '<\\/script');

				const rows = exportRows.map(task => `
					<tr>
						<td>${task.taskNumber}</td>
						<td>${task.typeLabel}</td>
						<td>${task.promptHtml || task.prompt || ''}</td>
						<td>${task.userInput ? task.userInput.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '—'}</td>
						<td>${task.correct ? 'Richtig' : 'Falsch'}</td>
						<td>${task.solutionHtml || task.solution || '—'}</td>
					</tr>
				`).join('');

				const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-export-id" content="${exportId}">
  <title>Ergebnisübersicht</title>
  <script>
    window.MathJax = {
      tex: { inlineMath: [['\\(', '\\)']] },
      chtml: { mtextInheritFont: true, matchFontHeight: false, scale: 1 },
      svg: { fontCache: 'global' },
      startup: { typeset: false }
    };
  </script>
  <script defer src="https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml.js"></script>
  <style>
    body { font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 32px; }
    .wrap { max-width: 1100px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; box-shadow: 0 12px 32px rgba(15,23,42,0.05); padding: 28px; }
    h1 { margin-top: 0; color: #0f172a; }
    .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 20px 0; }
    .meta-item { background: #f1f5f9; border-radius: 12px; padding: 12px 14px; }
    .label { display: block; color: #475569; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    .value { font-size: 1.05rem; font-weight: 700; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; vertical-align: top; }
    th { background: #f8fafc; }
    @media (max-width: 700px) { body { padding: 16px; } .wrap { padding: 18px; } table { font-size: 0.85rem; } }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Ergebnisübersicht</h1>
    <div class="meta">
      <div class="meta-item"><span class="label">Quiz</span><div class="value">${data.quizName}</div></div>
      <div class="meta-item"><span class="label">Klasse</span><div class="value">${data.grade}</div></div>
      <div class="meta-item"><span class="label">Datum</span><div class="value">${data.date}</div></div>
      <div class="meta-item"><span class="label">Ergebnis</span><div class="value">${data.correct}/${data.totalChecked} richtig</div></div>
      <div class="meta-item"><span class="label">Quote</span><div class="value">${data.successRate}%</div></div>
      <div class="meta-item"><span class="label">Bestserie</span><div class="value">${data.bestStreak}</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Typ</th>
          <th>Aufgabe</th>
          <th>Antwort</th>
          <th>Ergebnis</th>
          <th>Musterlösung</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <script type="application/json" id="result-payload">${payloadJsonForHtml}</script>

    <script>
      window.addEventListener('load', function () {
        if (window.MathJax && window.MathJax.typesetPromise) {
          window.MathJax.typesetPromise();
        }
      });
    </script>
  </div>
</body>
</html>`;

				const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
				const url = URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `quiz-ergebnis-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.html`;
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

		// Initalisieren
		loadLeaderboard();

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
			leaderboard,
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
			clearLeaderboard,
			showResultOverview,
			resultOverview,
			saveResultOverview
		};
	}
});

app.component('math-key-input', window.MathKeyInputComponent);
app.mount('#app');
