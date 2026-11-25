window.MTGStateModule = {
    createState(Vue, typeLabels) {
        const { ref, computed } = Vue;

        const tasks = ref([]);
        const showSolutions = ref(false);
        const currentView = ref('worksheet');
        const isSettingsSidebarOpen = ref(false);
        const showWorksheetSolutions = ref(false);
        const worksheetLayoutMode = ref('worksheet');
        const isDarkMode = ref(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        const selectedTypes = ref([]);
        const taskWeights = ref(
            Object.fromEntries(Object.keys(typeLabels).map(type => [type, 1]))
        );
        const taskCount = ref(20);
        const taskArrangementMode = ref('ordered');
        const presentationColumns = ref(2);
        const presentationFullWindow = ref(false);
        const worksheetTitle = ref('');
        const gtNumber = ref(1);
        const worksheetA5Pages = ref(2);
        const weights = ref(false);
        const quizSelectedTypes = ref([]);
        const quizTaskWeights = ref(
            Object.fromEntries(Object.keys(typeLabels).map(type => [type, 1]))
        );
        const quizNumber = ref('1');
        const taskMode = ref('standard');

        const rowWiseFirstColumnTasks = computed(() => tasks.value.filter((_, index) => index % 2 === 0));
        const rowWiseSecondColumnTasks = computed(() => tasks.value.filter((_, index) => index % 2 === 1));
        const presentationTaskColumns = computed(() => {
            if (presentationColumns.value === 1) {
                return [[...tasks.value].map((task, index) => ({ task, number: index + 1 }))];
            }

            return [
                rowWiseFirstColumnTasks.value.map((task, index) => ({ task, number: (index * 2) + 1 })),
                rowWiseSecondColumnTasks.value.map((task, index) => ({ task, number: (index * 2) + 2 }))
            ];
        });
        const worksheetTaskColumns = computed(() => {
            if (worksheetA5Pages.value === 2) {
                return {
                    left: tasks.value.map((task, index) => ({ task, number: index + 1, key: `left-${index}` })),
                    right: tasks.value.map((task, index) => ({ task, number: index + 1, key: `right-${index}` }))
                };
            }

            return {
                left: tasks.value.map((task, index) => ({
                    task,
                    number: index + 1,
                    key: `single-${index}`
                })),
                right: []
            };
        });
        const hasGeneratedTasks = computed(() => tasks.value.length > 0);
        const hasSelectedTypes = computed(() => {
            if (currentView.value === 'quiz') {
                return quizSelectedTypes.value.length > 0;
            }

            return selectedTypes.value.length > 0;
        });
        const viewTabs = [
            { key: 'worksheet', label: 'Arbeitsblatt' },
            { key: 'presentation', label: 'Präsentation' },
            { key: 'worksheet-builder', label: 'Customizer' },
            { key: 'quiz', label: 'Quiz generieren' }
        ];

        return {
            tasks,
            showSolutions,
            currentView,
            isSettingsSidebarOpen,
            showWorksheetSolutions,
            worksheetLayoutMode,
            isDarkMode,
            selectedTypes,
            taskWeights,
            taskCount,
            taskArrangementMode,
            presentationColumns,
            presentationFullWindow,
            worksheetTitle,
            gtNumber,
            worksheetA5Pages,
            weights,
            quizSelectedTypes,
            quizTaskWeights,
            quizNumber,
            taskMode,
            rowWiseFirstColumnTasks,
            rowWiseSecondColumnTasks,
            presentationTaskColumns,
            worksheetTaskColumns,
            hasGeneratedTasks,
            hasSelectedTypes,
            viewTabs
        };
    }
};
