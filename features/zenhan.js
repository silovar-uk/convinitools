import { copyToClipboard, normalizeNewlines } from '../core/ui.js';

const escapeHtml = (char) =>
    char.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const renderZenHan = (text) => {
    let html = '';

    for (const char of normalizeNewlines(text || '')) {
        if (char === '\n') {
            html += '<br>';
            continue;
        }

        const code = char.charCodeAt(0);
        if (code >= 0xFF01 && code <= 0xFF5E) {
            if (char === '？') {
                html += char;
            } else {
                const half = String.fromCharCode(code - 0xFEE0);
                html += `<span class="highlight-char">${half}</span>`;
            }
        } else if (char === '　') {
            html += '<span class="highlight-char">&nbsp;</span>';
        } else {
            html += escapeHtml(char);
        }
    }

    return html;
};

export const initZenHan = () => {
    const input = document.getElementById('inputTextZH');
    const output = document.getElementById('outputTextZH');
    const copyButton = document.getElementById('copyBtnZH');
    const clearButton = document.getElementById('clearBtnZH');

    const render = () => {
        if (output) output.innerHTML = renderZenHan(input?.value || '');
    };

    const setText = (text) => {
        if (!input) return;
        input.value = text || '';
        render();
        input.focus();
    };

    input?.addEventListener('input', render);
    copyButton?.addEventListener('click', () => {
        void copyToClipboard(output?.innerText || '', 'msgZH');
    });
    clearButton?.addEventListener('click', () => {
        if (input) input.value = '';
        if (output) output.innerHTML = '';
    });

    return { setText };
};
