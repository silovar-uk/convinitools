export const APP_VERSION = '2.3.0';

export const DEFAULT_TOOL_ID = 'contentTemplate';

export const STORAGE_KEYS = Object.freeze({
    LAST_TOOL: 'ui.lastTool',
    PENDING_ACTION: 'handoff.pendingAction'
});

export const PENDING_ACTION_TTL_MS = 60_000;

export const TOOL_REGISTRY = Object.freeze([
    {
        id: 'contentTemplate',
        label: 'テンプレ'
    },
    {
        id: 'contentLineBreak',
        label: '改行',
        contextMenu: {
            id: 'open_linebreak',
            title: '✂️ 選択テキストを改行修正'
        }
    },
    {
        id: 'contentZenHan',
        label: '全半',
        contextMenu: {
            id: 'open_zenhan',
            title: 'Ａa 選択テキストを全角→半角変換'
        }
    },
    {
        id: 'contentCalendar',
        label: 'カレンダー'
    },
    {
        id: 'contentMarkdown',
        label: 'MD変換'
    },
    {
        id: 'contentHtmlStripper',
        label: 'タグ除去'
    },
    {
        id: 'contentRandom',
        label: '乱文字生成'
    }
]);

const TOOL_ID_SET = new Set(TOOL_REGISTRY.map(tool => tool.id));

export const isValidToolId = (toolId) => TOOL_ID_SET.has(toolId);

export const getToolByContextMenuId = (menuId) =>
    TOOL_REGISTRY.find(tool => tool.contextMenu?.id === menuId) || null;

export const getContextMenuTools = () =>
    TOOL_REGISTRY.filter(tool => tool.contextMenu);

export const createRequestId = () => {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const isFreshPendingAction = (action, now = Date.now()) => {
    if (!action || typeof action !== 'object') return false;
    if (!isValidToolId(action.tabId)) return false;
    if (typeof action.createdAt !== 'number') return false;
    return now - action.createdAt >= 0 && now - action.createdAt <= PENDING_ACTION_TTL_MS;
};
