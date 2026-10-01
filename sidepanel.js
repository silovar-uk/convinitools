import {
    STORAGE_KEYS,
    isFreshPendingAction
} from './app-core.js';
import { createTabController } from './core/tabs.js';
import { initTemplate } from './features/template.js';
import { initLineBreak } from './features/linebreak.js';
import { initZenHan } from './features/zenhan.js';
import { initCalendar } from './features/calendar.js';
import { initMarkdown } from './features/markdown.js';
import { initHtmlStripper } from './features/html-stripper.js';
import { initRandom } from './features/random.js';

document.addEventListener('DOMContentLoaded', () => {
    const tabs = createTabController();

    initTemplate();
    const lineBreak = initLineBreak();
    const zenHan = initZenHan();
    initCalendar();
    initMarkdown();
    initHtmlStripper();
    initRandom();

    let lastHandledRequestId = '';

    const handlePendingAction = async () => {
        await tabs.ready;

        try {
            const result = await chrome.storage.session.get(STORAGE_KEYS.PENDING_ACTION);
            const pendingAction = result[STORAGE_KEYS.PENDING_ACTION];
            if (!pendingAction) return;

            if (!isFreshPendingAction(pendingAction)) {
                await chrome.storage.session.remove(STORAGE_KEYS.PENDING_ACTION);
                return;
            }

            if (
                pendingAction.requestId &&
                pendingAction.requestId === lastHandledRequestId
            ) {
                return;
            }

            const { requestId, tabId, text } = pendingAction;
            if (!tabs.switchTab(tabId)) {
                await chrome.storage.session.remove(STORAGE_KEYS.PENDING_ACTION);
                return;
            }

            if (tabId === 'contentLineBreak') {
                lineBreak.setText(text || '');
            } else if (tabId === 'contentZenHan') {
                zenHan.setText(text || '');
            }

            lastHandledRequestId =
                requestId || `${tabId}:${pendingAction.createdAt}`;

            await chrome.storage.session.remove(STORAGE_KEYS.PENDING_ACTION);
        } catch (error) {
            console.error('右クリック連携を処理できませんでした:', error);
        }
    };

    // v2.1以前の一時データは永続領域から削除する。
    void chrome.storage.local.remove('pendingAction').catch(() => {});
    void handlePendingAction();

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (
            areaName === 'session' &&
            changes[STORAGE_KEYS.PENDING_ACTION]?.newValue
        ) {
            void handlePendingAction();
        }
    });
});
