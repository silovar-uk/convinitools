import {
    STORAGE_KEYS,
    createRequestId,
    getContextMenuTools,
    getToolByContextMenuId
} from './app-core.js';

const initializeContextMenus = () => {
    chrome.contextMenus.removeAll(() => {
        if (chrome.runtime.lastError) {
            console.warn('既存の右クリックメニューを初期化できませんでした:', chrome.runtime.lastError.message);
        }

        getContextMenuTools().forEach((tool) => {
            chrome.contextMenus.create({
                id: tool.contextMenu.id,
                title: tool.contextMenu.title,
                contexts: ['selection']
            }, () => {
                if (chrome.runtime.lastError) {
                    console.warn(`右クリックメニューを作成できませんでした: ${tool.contextMenu.id}`, chrome.runtime.lastError.message);
                }
            });
        });
    });
};

chrome.runtime.onInstalled.addListener(initializeContextMenus);
chrome.runtime.onStartup.addListener(initializeContextMenus);

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('サイドパネル動作を設定できませんでした:', error));

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const tool = getToolByContextMenuId(info.menuItemId);
    if (!tool) return;

    const pendingAction = {
        requestId: createRequestId(),
        tabId: tool.id,
        text: info.selectionText || '',
        createdAt: Date.now()
    };

    try {
        await chrome.storage.session.set({
            [STORAGE_KEYS.PENDING_ACTION]: pendingAction
        });

        if (Number.isInteger(tab?.windowId)) {
            await chrome.sidePanel.open({ windowId: tab.windowId });
        }
    } catch (error) {
        console.error('選択テキストをサイドパネルへ渡せませんでした:', error);
    }
});
