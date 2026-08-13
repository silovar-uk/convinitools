// インストール・更新時、またはブラウザ起動時に初期化
chrome.runtime.onInstalled.addListener(() => {
    initializeContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
    initializeContextMenus();
});

// アイコンクリックでサイドパネルを開く設定
// (Chrome 114以降で利用可能)
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

function initializeContextMenus() {
    // 既存のメニューをリセット
    chrome.contextMenus.removeAll(() => {
        // 改行修正
        chrome.contextMenus.create({
            id: "open_linebreak",
            title: "✂️ サイドパネルで改行修正",
            contexts: ["selection"]
        });

        // MD変換
        chrome.contextMenus.create({
            id: "open_markdown",
            title: "📝 サイドパネルでMD変換",
            contexts: ["selection"]
        });
    });
}

// メニューがクリックされた時の処理
chrome.contextMenus.onClicked.addListener((info, tab) => {
    let targetTabId = "";

    if (info.menuItemId === "open_linebreak") {
        targetTabId = "contentLineBreak";
    } else if (info.menuItemId === "open_markdown") {
        targetTabId = "contentMarkdown";
    }

    if (targetTabId) {
        // 選択テキストを保存
        chrome.storage.local.set({
            pendingAction: {
                tabId: targetTabId,
                text: info.selectionText || ""
            }
        }, () => {
            // サイドパネルを開く
            // 注意: ユーザー操作（クリック）起因である必要があるため、
            // Context Menuからの呼び出しはChrome 116以降で動作します。
            if (tab.windowId) {
                chrome.sidePanel.open({ windowId: tab.windowId })
                    .catch((err) => console.error("サイドパネルを開けませんでした:", err));
            }
        });
    }
});