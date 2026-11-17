window.MTGNavigationModule = {
    createNavigationModule({ state, nextTick, typesetMathJax }) {
        const openSettingsSidebar = () => {
            state.isSettingsSidebarOpen.value = true;
        };

        const closeSettingsSidebar = () => {
            state.isSettingsSidebarOpen.value = false;
        };

        const toggleSettingsSidebar = () => {
            state.isSettingsSidebarOpen.value = !state.isSettingsSidebarOpen.value;
        };

        const setCurrentView = async view => {
            state.currentView.value = view;
            await nextTick();
            await typesetMathJax();
        };

        const goHome = async () => {
            closeSettingsSidebar();
            await setCurrentView('worksheet');
        };

        const switchView = async (view, options = {}) => {
            const { autoOpenSettingsFromHome = false } = options;
            const fromHome = state.currentView.value === 'home';

            closeSettingsSidebar();

            if (view === 'home') {
                await goHome();
                return;
            }

            await setCurrentView(view);
            if (fromHome && view !== 'home' && autoOpenSettingsFromHome) {
                openSettingsSidebar();
            }
        };

        return {
            openSettingsSidebar,
            closeSettingsSidebar,
            toggleSettingsSidebar,
            goHome,
            switchView,
            setCurrentView
        };
    }
};
