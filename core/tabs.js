import {
    DEFAULT_TOOL_ID,
    STORAGE_KEYS,
    isValidToolId
} from '../app-core.js';

export const createTabController = () => {
    const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
    const panels = Array.from(document.querySelectorAll('.tab-content'));

    const switchTab = (targetId, { persist = true, focus = false } = {}) => {
        if (!isValidToolId(targetId)) return false;

        const nextButton = tabButtons.find(
            button => button.getAttribute('data-target') === targetId
        );
        if (!nextButton) return false;

        tabButtons.forEach((button) => {
            const isActive = button === nextButton;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-selected', String(isActive));
            button.tabIndex = isActive ? 0 : -1;
        });

        panels.forEach((panel) => {
            const isActive = panel.id === targetId;
            panel.classList.toggle('active', isActive);
            panel.setAttribute('aria-hidden', String(!isActive));
        });

        if (focus) nextButton.focus();

        if (persist) {
            void chrome.storage.local.set({
                [STORAGE_KEYS.LAST_TOOL]: targetId
            }).catch((error) => {
                console.warn('最後に使ったツールを保存できませんでした:', error);
            });
        }

        return true;
    };

    const restoreInitialTool = async () => {
        let restoredTool = '';

        try {
            const stored = await chrome.storage.local.get(STORAGE_KEYS.LAST_TOOL);
            restoredTool = stored[STORAGE_KEYS.LAST_TOOL] || '';

            if (!restoredTool) {
                const legacyTool = localStorage.getItem('convinitools:lastTool') || '';
                if (legacyTool) {
                    restoredTool = legacyTool;
                    await chrome.storage.local.set({
                        [STORAGE_KEYS.LAST_TOOL]: legacyTool
                    });
                    localStorage.removeItem('convinitools:lastTool');
                }
            }
        } catch (error) {
            console.warn('最後に使ったツールを読み込めませんでした:', error);
        }

        if (!switchTab(restoredTool, { persist: false })) {
            switchTab(DEFAULT_TOOL_ID, { persist: false });
            await chrome.storage.local.set({
                [STORAGE_KEYS.LAST_TOOL]: DEFAULT_TOOL_ID
            }).catch(() => {});
        }
    };

    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            switchTab(button.getAttribute('data-target'));
        });

        button.addEventListener('keydown', (event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

            event.preventDefault();
            const currentIndex = tabButtons.indexOf(button);
            let nextIndex = currentIndex;

            if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabButtons.length;
            if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
            if (event.key === 'Home') nextIndex = 0;
            if (event.key === 'End') nextIndex = tabButtons.length - 1;

            const nextButton = tabButtons[nextIndex];
            switchTab(nextButton.getAttribute('data-target'), { focus: true });
        });
    });

    return {
        switchTab,
        ready: restoreInitialTool()
    };
};
