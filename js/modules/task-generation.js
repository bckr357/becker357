window.MTGTaskGenerationModule = {
    createTaskGenerationModule({ state, createTask, selectedGrade }) {
        const buildTwoColumnTaskTable = (cells) => {
            const cellHtml = cells.map(cell =>
                `<td class="two-column-task-cell">${cell}</td>`
            ).join('');

            return `<table class="two-column-task"><tr>${cellHtml}</tr></table>`;
        };

        const twoColumnTaskTypes = new Set([
            'dezimalbrueche_addieren_subtrahieren',
            'dezimalbrueche_multiplizieren_dividieren',
            'natuerliche_zahlen_addieren_subtrahieren',
            'natuerliche_zahlen_multiplizieren_dividieren',
            'ganze_zahlen_addieren_subtrahieren',
            'ganze_zahlen_multiplizieren_dividieren',
            'zehnerpotenzen_multiplizieren_dividieren',
            'potenzen'
        ]);

        const shouldRenderTwoColumns = (type) => {
            if (twoColumnTaskTypes.has(type)) return true;
            if (type.startsWith('einmaleins_')) return true;
            if (type.startsWith('geteilt_durch_')) return true;
            if (type.startsWith('addition_bis_')) return true;
            if (type.startsWith('subtraktion_bis_')) return true;
            if (type.startsWith('kleines_1x1_')) return true;
            if (type.startsWith('addition_subtraktion_bis_')) return true;
            return false;
        };

        const generateRenderedTask = (type, options = {}) => {
            const taskMode = options?.mode === 'quiz'
                ? 'quiz'
                : (options?.mode === 'calculator' || state.taskMode.value === 'calculator')
                    ? 'calculator'
                    : 'standard';
            const effectiveOptions = { ...options, mode: taskMode };
            const isQuizMode = taskMode === 'quiz';
            const usesCentralTwoColumns = shouldRenderTwoColumns(type);
            const generated = createTask(type, getNumericGrade(), effectiveOptions);

            if (isQuizMode || !usesCentralTwoColumns) {
                return generated;
            }

            let second = createTask(type, getNumericGrade(), effectiveOptions);

            if (type === 'potenzen') {
                let attempts = 0;
                while (second.textDisplay === generated.textDisplay && attempts < 10) {
                    second = createTask(type, getNumericGrade(), effectiveOptions);
                    attempts += 1;
                }
            }

            if (type === 'zehnerpotenzen_multiplizieren_dividieren') {
                let attempts = 0;
                while (second.textDisplay === generated.textDisplay && attempts < 5) {
                    second = createTask(type, getNumericGrade(), effectiveOptions);
                    attempts += 1;
                }
            }

            return {
                ...generated,
                textDisplay: buildTwoColumnTaskTable([
                    generated.textDisplay ?? '',
                    second.textDisplay ?? ''
                ]),
                textPrint: buildTwoColumnTaskTable([
                    generated.textPrint ?? generated.textDisplay ?? '',
                    second.textPrint ?? second.textDisplay ?? ''
                ]),
                solution: buildTwoColumnTaskTable([
                    generated.solution ?? '',
                    second.solution ?? ''
                ])
            };
        };

        const getScopeConfig = (scope = 'default') => {
            if (scope === 'quiz') {
                return {
                    selectedTypes: state.quizSelectedTypes.value,
                    taskWeights: state.quizTaskWeights.value,
                    taskCounts: null,
                    weightsEnabled: false,
                    countsEnabled: false
                };
            }

            return {
                selectedTypes: state.selectedTypes.value,
                taskWeights: state.taskWeights.value,
                taskCounts: state.taskCounts?.value ?? null,
                weightsEnabled: state.weights.value,
                countsEnabled: Boolean(state.taskCounts)
            };
        };

        const getNumericGrade = () => Number.isFinite(selectedGrade?.value)
            ? selectedGrade.value
            : 5;

        const getTaskExportData = () => state.tasks.value.map(task => ({
            aufgabentyp: task.type,
            aufgabe: task.textDisplay ?? '',
            textDisplay: task.textDisplay ?? '',
            textPrint: task.textPrint ?? '',
            loesung: task.solution
        }));

        const getTaskExportDocument = () => {
            const activeTypes = state.currentView.value === 'quiz'
                ? state.quizSelectedTypes.value
                : state.selectedTypes.value;
            let pageUrl = window.location.href;
            if (state.currentView.value === 'worksheet') {
                try {
                    const url = new URL(pageUrl, window.location.href);
                    const existing = url.searchParams.get('m');
                    if (existing && existing.length >= 4) {
                        url.searchParams.set('m', existing.slice(0, 2) + '1' + existing.slice(3));
                    } else {
                        url.searchParams.set('m', '0o12');
                    }
                    pageUrl = url.href;
                } catch {
                }
            }

            const metadata = {
                grade: selectedGrade?.value ?? null,
                types: [...activeTypes],
                taskCount: state.taskCount.value,
                arrangement: state.taskArrangementMode.value,
                pages: state.worksheetA5Pages.value,
                presentationColumns: state.presentationColumns.value,
                worksheetTitle: state.worksheetTitle.value,
                weights: { ...state.taskWeights.value },
                weightsEnabled: state.weights.value,
                taskMode: state.taskMode.value
            };

            return {
                pageUrl,
                metadata,
                grade: metadata.grade,
                weights: metadata.weights,
                weightsEnabled: metadata.weightsEnabled,
                tasks: getTaskExportData()
            };
        };

        const parseTaskImportData = (data) => {
            const rawArray = Array.isArray(data)
                ? data
                : Array.isArray(data.tasks)
                    ? data.tasks
                    : [];

            const sanitize = (value) => {
                if (typeof sanitizeImportedHtml === 'function') {
                    return sanitizeImportedHtml(value ?? '');
                }
                return String(value ?? '');
            };

            const knownTypes = (typeof typeLabels === 'object' && typeLabels) ? new Set(Object.keys(typeLabels)) : null;

            return rawArray
                .filter(item => {
                    if (typeof item !== 'object' || item === null) return false;
                    const rawText = item.textDisplay ?? item.aufgabe ?? item.task ?? '';
                    if (!rawText && !(item.loesung ?? item.solution ?? '')) return false;
                    const type = item.aufgabentyp || item.type || '';
                    if (knownTypes && type && !knownTypes.has(type)) {
                        console.warn(`MTG Import: Unbekannter Aufgabentyp "${type}" – Aufgabe wird trotzdem geladen.`);
                    }
                    return true;
                })
                .map(item => ({
                    type: item.aufgabentyp || item.type || '',
                    textDisplay: sanitize(item.textDisplay ?? item.aufgabe ?? item.task ?? ''),
                    textPrint: sanitize(item.textPrint ?? item.aufgabe ?? item.task ?? ''),
                    solution: sanitize(item.loesung ?? item.solution ?? '')
                }));
        };

        const loadTasksFromJSON = (data) => {
            const tasks = parseTaskImportData(data);
            if (!Array.isArray(tasks) || tasks.length === 0) {
                return false;
            }

            state.tasks.value = tasks;
            state.showSolutions.value = false;
            state.showWorksheetSolutions.value = false;
            state.taskCount.value = tasks.length;
            return true;
        };

        const FILE_HANDLE_DB = 'mtg-file-handles';
        const FILE_HANDLE_STORE = 'handles';
        const JSON_EXPORT_HANDLE_KEY = 'json-export-handle';

        const openHandleDB = () => new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                resolve(null);
                return;
            }

            const request = indexedDB.open(FILE_HANDLE_DB, 1);
            request.onupgradeneeded = event => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(FILE_HANDLE_STORE)) {
                    db.createObjectStore(FILE_HANDLE_STORE);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        });

        const getSavedFileHandle = async () => {
            const db = await openHandleDB();
            if (!db) return null;

            return new Promise(resolve => {
                const tx = db.transaction(FILE_HANDLE_STORE, 'readonly');
                const store = tx.objectStore(FILE_HANDLE_STORE);
                const getReq = store.get(JSON_EXPORT_HANDLE_KEY);
                getReq.onsuccess = () => {
                    resolve(getReq.result ?? null);
                    db.close();
                };
                getReq.onerror = () => {
                    resolve(null);
                    db.close();
                };
            });
        };

        const saveFileHandle = async handle => {
            const db = await openHandleDB();
            if (!db) return;

            return new Promise(resolve => {
                const tx = db.transaction(FILE_HANDLE_STORE, 'readwrite');
                const store = tx.objectStore(FILE_HANDLE_STORE);
                const putReq = store.put(handle, JSON_EXPORT_HANDLE_KEY);
                putReq.onsuccess = () => {
                    resolve();
                    db.close();
                };
                putReq.onerror = () => {
                    resolve();
                    db.close();
                };
            });
        };

        const verifyPermission = async (handle, mode = 'readwrite') => {
            if (!handle || typeof handle.queryPermission !== 'function') {
                return false;
            }

            const permission = await handle.queryPermission({ mode });
            if (permission === 'granted') return true;
            const request = await handle.requestPermission({ mode });
            return request === 'granted';
        };

        const downloadJSONFile = async (filename, data) => {
            const dataStr = JSON.stringify(data, null, 2);

            if (window.showSaveFilePicker) {
                let handle = await getSavedFileHandle();
                let options = {
                    suggestedName: filename,
                    types: [{
                        description: 'JSON Datei',
                        accept: { 'application/json': ['.json'] }
                    }]
                };

                if (handle) {
                    options.startIn = handle;
                }

                try {
                    handle = await window.showSaveFilePicker(options);
                } catch (error) {
                    if (error && error.name === 'AbortError') {
                        return;
                    }

                    if (options.startIn) {
                        delete options.startIn;
                        try {
                            handle = await window.showSaveFilePicker(options);
                        } catch (retryError) {
                            if (retryError && retryError.name === 'AbortError') {
                                return;
                            }

                            if (handle && handle.name) {
                                try {
                                    if (await verifyPermission(handle)) {
                                        const writable = await handle.createWritable();
                                        await writable.write(dataStr);
                                        await writable.close();
                                        await saveFileHandle(handle);
                                        return;
                                    }
                                } catch (innerError) {
                                    // ignore and fallback
                                }
                            }

                            const blob = new Blob([dataStr], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const anchor = document.createElement('a');
                            anchor.href = url;
                            anchor.download = filename;
                            anchor.click();
                            URL.revokeObjectURL(url);
                            return;
                        }
                    } else {
                        if (handle && handle.name) {
                            try {
                                if (await verifyPermission(handle)) {
                                    const writable = await handle.createWritable();
                                    await writable.write(dataStr);
                                    await writable.close();
                                    await saveFileHandle(handle);
                                    return;
                                }
                            } catch (innerError) {
                                // ignore and fallback
                            }
                        }

                        const blob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const anchor = document.createElement('a');
                        anchor.href = url;
                        anchor.download = filename;
                        anchor.click();
                        URL.revokeObjectURL(url);
                        return;
                    }
                }

                try {
                    const writable = await handle.createWritable();
                    await writable.write(dataStr);
                    await writable.close();
                    await saveFileHandle(handle);
                    return;
                } catch (error) {
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const anchor = document.createElement('a');
                    anchor.href = url;
                    anchor.download = filename;
                    anchor.click();
                    URL.revokeObjectURL(url);
                }
                return;
            }

            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = filename;
            anchor.click();
            URL.revokeObjectURL(url);
        };

        const buildTasks = (scope = 'default', taskOptions = {}) => {
            const config = getScopeConfig(scope);
            const effectiveTaskOptions = scope === 'quiz'
                ? { ...taskOptions, mode: 'quiz' }
                : taskOptions;

            if (config.selectedTypes.length === 0) return false;

            if (config.countsEnabled && config.taskCounts) {
                const counts = Object.fromEntries(config.selectedTypes.map(type => {
                    const rawCount = Number(config.taskCounts[type]);
                    const count = Number.isFinite(rawCount)
                        ? Math.max(0, Math.floor(rawCount))
                        : 0;
                    config.taskCounts[type] = count;
                    return [type, count];
                }));

                const targetTotal = config.selectedTypes.reduce((sum, type) => sum + (counts[type] || 0), 0);
                if (targetTotal <= 0) {
                    return false;
                }

                let typePool = config.selectedTypes.flatMap(type => Array(counts[type]).fill(type));
                const arrangementMode = state.taskArrangementMode.value;

                if (arrangementMode === 'random' || arrangementMode === 'random-ordered') {
                    for (let index = typePool.length - 1; index > 0; index--) {
                        const swapIndex = Math.floor(Math.random() * (index + 1));
                        [typePool[index], typePool[swapIndex]] = [typePool[swapIndex], typePool[index]];
                    }
                }

                state.tasks.value = typePool.map(type => {
                    const generated = generateRenderedTask(type, effectiveTaskOptions);
                    return {
                        type,
                        textDisplay: generated.textDisplay ?? '',
                        textPrint: generated.textPrint ?? '',
                        solution: generated.solution
                    };
                });

                state.taskCount.value = state.tasks.value.length;
                state.showSolutions.value = false;
                state.showWorksheetSolutions.value = false;
                return true;
            }

            const normalizedWeights = Object.fromEntries(config.selectedTypes.map(type => {
                const rawWeight = Number(config.taskWeights[type]);
                const weight = config.weightsEnabled
                    ? (Number.isFinite(rawWeight)
                        ? Math.max(0, Math.floor(rawWeight))
                        : 1)
                    : 1;

                config.taskWeights[type] = weight;
                return [type, weight];
            }));

            const singleOccurrenceTypes = new Set(
                config.selectedTypes.filter(type => normalizedWeights[type] === 0)
            );

            const weightedTypes = config.selectedTypes.flatMap(type => Array(normalizedWeights[type]).fill(type));
            if (weightedTypes.length === 0 && singleOccurrenceTypes.size === 0) return false;

            const types = [...weightedTypes];
            const targetTotal = state.taskCount.value;
            let typePool = [];
            const arrangementMode = state.taskArrangementMode.value;

            const getTypeCounts = () => {
                const counts = Object.fromEntries(config.selectedTypes.map(type => [type, 0]));
                const singleTypes = config.selectedTypes.filter(type => singleOccurrenceTypes.has(type));
                const repeatTypes = config.selectedTypes.filter(type => !singleOccurrenceTypes.has(type));
                const repeatWeightedTypes = repeatTypes.flatMap(type => Array(normalizedWeights[type]).fill(type));

                let usedSlots = 0;
                for (const type of singleTypes) {
                    if (usedSlots < targetTotal) {
                        counts[type] = 1;
                        usedSlots += 1;
                    }
                }

                const remainingTarget = Math.max(0, targetTotal - usedSlots);
                if (repeatWeightedTypes.length > 0 && remainingTarget > 0) {
                    const fullSets = Math.floor(remainingTarget / repeatWeightedTypes.length);

                    repeatTypes.forEach(type => {
                        counts[type] += fullSets * normalizedWeights[type];
                    });

                    const remainingCount = remainingTarget - (fullSets * repeatWeightedTypes.length);
                    if (remainingCount > 0) {
                        const finalShuffle = fisherYatesShuffle(repeatWeightedTypes);
                        for (let index = 0; index < remainingCount; index++) {
                            counts[finalShuffle[index]] += 1;
                        }
                    }
                } else if (remainingTarget > 0 && singleTypes.length > 0) {
                    const repeatPool = [...singleTypes];
                    const finalShuffle = [];
                    while (finalShuffle.length < remainingTarget) {
                        finalShuffle.push(...fisherYatesShuffle(repeatPool));
                    }
                    for (let index = 0; index < remainingTarget; index++) {
                        counts[finalShuffle[index]] += 1;
                    }
                }

                return counts;
            };

            if (arrangementMode === 'ordered' || arrangementMode === 'random-ordered') {
                const typeCounts = getTypeCounts();
                const typeLabelMap = (typeof window !== 'undefined' && window.MTGTaskTypes?.definitions)
                    ? window.MTGTaskTypes.definitions
                    : {};
                const labelOrder = Object.keys(typeLabelMap);
                const selectedSet = new Set(config.selectedTypes);
                const orderedTypes = [
                    ...labelOrder.filter(type => selectedSet.has(type)),
                    ...config.selectedTypes.filter(type => !labelOrder.includes(type))
                ].filter(type => typeCounts[type] > 0);

                const blocks = orderedTypes.map(type => Array(typeCounts[type]).fill(type));
                if (arrangementMode === 'random-ordered') {
                    for (let index = blocks.length - 1; index > 0; index--) {
                        const swapIndex = Math.floor(Math.random() * (index + 1));
                        [blocks[index], blocks[swapIndex]] = [blocks[swapIndex], blocks[index]];
                    }
                }

                typePool = blocks.flat();
            } else {
                const singleTypes = [...new Set(config.selectedTypes.filter(type => singleOccurrenceTypes.has(type)))];
                const normalWeightedTypes = weightedTypes.filter(type => !singleOccurrenceTypes.has(type));

                const singleTypesToUse = singleTypes.slice(0, targetTotal);
                typePool = [...singleTypesToUse];

                const fillTypes = normalWeightedTypes.length > 0 ? normalWeightedTypes : singleTypesToUse;
                while (typePool.length + fillTypes.length <= targetTotal) {
                    const shuffledSet = fisherYatesShuffle(fillTypes);
                    typePool = [...typePool, ...shuffledSet];
                }

                if (typePool.length < targetTotal) {
                    const remainingCount = targetTotal - typePool.length;
                    const finalShuffle = fisherYatesShuffle(fillTypes);
                    for (let index = 0; index < remainingCount; index++) {
                        typePool.push(finalShuffle[index]);
                    }
                }

                for (let index = typePool.length - 1; index > 0; index--) {
                    const swapIndex = Math.floor(Math.random() * (index + 1));
                    [typePool[index], typePool[swapIndex]] = [typePool[swapIndex], typePool[index]];
                }
            }

            state.tasks.value = typePool.map(type => {
                const generated = generateRenderedTask(type, effectiveTaskOptions);
                return {
                    type,
                    textDisplay: generated.textDisplay ?? '',
                    textPrint: generated.textPrint ?? '',
                    solution: generated.solution
                };
            });

            state.showSolutions.value = false;
            state.showWorksheetSolutions.value = false;
            return true;
        };

        const generateTaskByType = (type, scope = 'default', options = {}) => {
            if (typeof type !== 'string' || type.trim() === '') {
                return null;
            }

            const normalizedType = type.trim();
            const generated = generateRenderedTask(normalizedType, options);

            return {
                type: normalizedType,
                textDisplay: generated.textDisplay ?? '',
                textPrint: generated.textPrint ?? '',
                solution: generated.solution
            };
        };

        return {
            getTaskExportData,
            getTaskExportDocument,
            downloadJSONFile,
            loadTasksFromJSON,
            buildTasks,
            generateTaskByType,
        };
    }
};
