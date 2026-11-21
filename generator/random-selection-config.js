window.MTG_RANDOM_SELECTION_CONFIG = {
    default: {
        default: {
            taskCount: 17,
            targetTypeCount: 16,
            atMostOnePickChance: 0.1,
            requiredTypes: [
                'einheiten',
                'prozentrechnung',
                'zehnerpotenzen_multiplizieren_dividieren',
                'kongruenz',
                'termtabellen',
                'natuerliche_zahlen_addieren_subtrahieren',
                'natuerliche_zahlen_multiplizieren_dividieren'
            ],
            exactOneGroups: [
                [
                    'ganze_zahlen_addieren_subtrahieren',
                    'ganze_zahlen_multiplizieren_dividieren'
                ],
                [
                    'dezimalbrueche_addieren_subtrahieren',
                    'dezimalbrueche_multiplizieren_dividieren'
                ],
                [
                    'schriftliche_addition_subtraktion',
                    'schriftliche_multiplikation_division'
                ]
            ],
            atMostOneGroups: [
                [
                    'additionstabellen',
                    'subtraktionstabellen',
                    'multiplikationstabellen'
                ]
            ],
            defaultWeight: 1,
            weights: {
                einheiten: 2,
                schriftliche_addition_subtraktion: 0,
                schriftliche_multiplikation_division: 0,
                additionstabellen: 0,
                subtraktionstabellen: 0,
                multiplikationstabellen: 0,
                termtabellen: 0,
                kongruenz: 0
            }
        },
        grades: {
            '5': {},
            '6': {},
            '7': {},
            '8': {},
            '9': {},
            '10': {}
        }
    },
    calculator: {
        default: {
            taskCount: 17,
            targetTypeCount: 16,
            atMostOnePickChance: 0.1,
            requiredTypes: [
                'einheiten',
                'prozentrechnung',
                'zehnerpotenzen_multiplizieren_dividieren',
                'kongruenz',
                'termtabellen',
                'natuerliche_zahlen_addieren_subtrahieren',
                'natuerliche_zahlen_multiplizieren_dividieren'
            ],
            exactOneGroups: [
                [
                    'ganze_zahlen_addieren_subtrahieren',
                    'ganze_zahlen_multiplizieren_dividieren'
                ],
                [
                    'dezimalbrueche_addieren_subtrahieren',
                    'dezimalbrueche_multiplizieren_dividieren'
                ],
                [
                    'schriftliche_addition_subtraktion',
                    'schriftliche_multiplikation_division'
                ]
            ],
            atMostOneGroups: [
                [
                    'additionstabellen',
                    'subtraktionstabellen',
                    'multiplikationstabellen'
                ]
            ],
            defaultWeight: 1,
            weights: {
                einheiten: 2,
                schriftliche_addition_subtraktion: 0,
                schriftliche_multiplikation_division: 0,
                additionstabellen: 0,
                subtraktionstabellen: 0,
                multiplikationstabellen: 0,
                termtabellen: 0,
                kongruenz: 0
            }
        },
        grades: {
            '5': {},
            '6': {},
            '7': {},
            '8': {},
            '9': {},
            '10': {}
        }
    },
    quiz: {
        default: {
            targetTypeCount: 7,
            atMostOnePickChance: 0.1,
            requiredTypes: [],
            exactOneGroups: [],
            atMostOneGroups: [],
            defaultWeight: 1,
            weights: {}
        },
        grades: {
            '5': {},
            '6': {},
            '7': {},
            '8': {},
            '9': {},
            '10': {}
        }
    }
};

window.MTGRandomSelection = {
    resolve(mode, grade) {
        const root = window.MTG_RANDOM_SELECTION_CONFIG;
        if (!root || typeof root !== 'object') {
            return null;
        }

        const normalizedMode = mode === 'calculator' || mode === 'quiz' ? mode : 'default';
        let modeConfig = root[normalizedMode];

        if (normalizedMode === 'default' && modeConfig && !modeConfig.default) {
            modeConfig = {
                default: modeConfig,
                grades: root.grades ?? {}
            };
        }

        if (!modeConfig?.default || typeof modeConfig.default !== 'object') {
            return null;
        }

        const gradeConfig = modeConfig.grades?.[String(grade)] ?? {};
        return {
            ...modeConfig.default,
            ...gradeConfig,
            requiredTypes: gradeConfig.requiredTypes ?? modeConfig.default.requiredTypes ?? [],
            exactOneGroups: gradeConfig.exactOneGroups ?? modeConfig.default.exactOneGroups ?? [],
            atMostOneGroups: gradeConfig.atMostOneGroups ?? modeConfig.default.atMostOneGroups ?? [],
            weights: {
                ...(modeConfig.default.weights ?? {}),
                ...(gradeConfig.weights ?? {})
            }
        };
    },

    select({ mode, grade, availableTypes, taskCount }) {
        const config = this.resolve(mode, grade);
        const classTypes = [...new Set((availableTypes ?? []).filter(type => typeof type === 'string'))];
        if (!config) {
            return null;
        }

        const available = new Set(classTypes);
        const targetTypeCount = Math.min(
            Math.max(0, Math.floor(Number(config.targetTypeCount) || 0)),
            classTypes.length
        );
        const selected = new Set();

        const pickOneFrom = keys => {
            const candidates = keys.filter(type => available.has(type));
            return candidates.length === 0
                ? []
                : [candidates[Math.floor(Math.random() * candidates.length)]];
        };

        const pickAtMostOneFrom = keys => {
            const candidates = keys.filter(type => available.has(type));
            const chance = Number(config.atMostOnePickChance);
            if (candidates.length === 0 || Math.random() >= (Number.isFinite(chance) ? chance : 0.5)) {
                return [];
            }
            return [candidates[Math.floor(Math.random() * candidates.length)]];
        };

        for (const type of config.requiredTypes ?? []) {
            if (available.has(type)) {
                selected.add(type);
            }
        }
        for (const group of config.exactOneGroups ?? []) {
            for (const type of pickOneFrom(group)) {
                selected.add(type);
            }
        }
        for (const group of config.atMostOneGroups ?? []) {
            for (const type of pickAtMostOneFrom(group)) {
                selected.add(type);
            }
        }

        const restrictedGroupTypes = new Set([
            ...(config.exactOneGroups ?? []).flat(),
            ...(config.atMostOneGroups ?? []).flat()
        ]);
        const isConflictingWithGroup = type => (
            (config.exactOneGroups ?? []).some(group =>
                group.includes(type) && group.some(member => selected.has(member) && member !== type)
            ) ||
            (config.atMostOneGroups ?? []).some(group =>
                group.includes(type) && group.some(member => selected.has(member) && member !== type)
            )
        );

        const addableTypes = classTypes.filter(type =>
            !selected.has(type) &&
            !isConflictingWithGroup(type) &&
            !restrictedGroupTypes.has(type)
        );
        for (let i = addableTypes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [addableTypes[i], addableTypes[j]] = [addableTypes[j], addableTypes[i]];
        }
        while (selected.size < targetTypeCount && addableTypes.length > 0) {
            selected.add(addableTypes.shift());
        }

        if (selected.size < targetTypeCount) {
            const backupPool = classTypes.filter(type =>
                !selected.has(type) && !restrictedGroupTypes.has(type)
            );
            for (let i = backupPool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [backupPool[i], backupPool[j]] = [backupPool[j], backupPool[i]];
            }
            for (const type of backupPool) {
                if (selected.size >= targetTypeCount) {
                    break;
                }
                selected.add(type);
            }
        }

        const weights = {};
        for (const type of classTypes) {
            const configuredWeight = Number(config.weights[type]);
            const defaultWeight = Number(config.defaultWeight);
            weights[type] = Math.max(0, Math.floor(
                Number.isFinite(configuredWeight)
                    ? configuredWeight
                    : (Number.isFinite(defaultWeight) ? defaultWeight : 1)
            ));
        }

        const configuredTaskCount = Number(taskCount ?? config.taskCount);
        return {
            selectedTypes: classTypes.filter(type => selected.has(type)),
            weights,
            taskCount: Number.isFinite(configuredTaskCount)
                ? Math.min(200, Math.max(1, Math.floor(configuredTaskCount)))
                : null
        };
    }
};
