import { copyToClipboard, normalizeNewlines } from '../core/ui.js';

export const processLineBreak = (text) => {
    if (!text) return '';
    return normalizeNewlines(text).replace(/\n{2,}/g, '\n');
};

export const initLineBreak = () => {
    const input = document.getElementById('inputTextLB');
    const output = document.getElementById('outputTextLB');
    const copyButton = document.getElementById('copyBtnLB');
    const clearButton = document.getElementById('clearBtnLB');

    const render = () => {
        if (!output) return;
        output.value = processLineBreak(input?.value || '');
    };

    const setText = (text) => {
        if (!input) return;
        input.value = normalizeNewlines(text || '');
        render();
        input.focus();
    };

    input?.addEventListener('input', render);
    copyButton?.addEventListener('click', () => {
        void copyToClipboard(output?.value || '', 'msgLB');
    });
    clearButton?.addEventListener('click', () => {
        if (input) input.value = '';
        if (output) output.value = '';
    });

    return { setText };
};
