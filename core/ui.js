const messageTimers = new WeakMap();

export const normalizeNewlines = (value = '') =>
    String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');

export const showMsg = (elementId, text, isError = false) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const previousTimer = messageTimers.get(element);
    if (previousTimer) clearTimeout(previousTimer);

    element.textContent = text;
    element.className = isError ? 'message error show' : 'message show';

    const timer = setTimeout(() => {
        element.classList.remove('show');
        messageTimers.delete(element);
    }, 2000);

    messageTimers.set(element, timer);
};

export const copyToClipboard = async (text, messageId) => {
    if (!text) {
        showMsg(messageId, 'テキストがありません', true);
        return false;
    }

    try {
        await navigator.clipboard.writeText(text);
        showMsg(messageId, 'コピーしました！');
        return true;
    } catch (error) {
        console.warn('Clipboard APIでコピーできなかったためフォールバックします:', error);
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        const copied = document.execCommand('copy');
        showMsg(messageId, copied ? 'コピーしました！' : 'コピー失敗', !copied);
        return copied;
    } catch (error) {
        console.error('コピーに失敗しました:', error);
        showMsg(messageId, 'コピー失敗', true);
        return false;
    } finally {
        textarea.remove();
    }
};
