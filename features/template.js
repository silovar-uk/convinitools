import { showMsg } from '../core/ui.js';

const DEFAULT_TEMPLATE_HTML = `<span class="template-warning">※※※添付ファイルが更新後か確認※※※</span><br>吉田さん、晃さん<br><br>お疲れ様です。多比良です。<br>●●についてご確認・承認お願いいたします。<br><br>-------------------------------------<br><span class="red-section">■確認概要<br>・今回の依頼期限：<br>・ホットトピック有無：<br>・小窓画像：<br>・掲載日時→<br>・承認期限→</span>`;

export const initTemplate = () => {
    const editor = document.getElementById('templateEditor');
    const copyButton = document.getElementById('copyTemplateBtn');
    const resetButton = document.getElementById('resetTemplateBtn');

    const reset = () => {
        if (editor) editor.innerHTML = DEFAULT_TEMPLATE_HTML;
    };

    if (editor && !editor.innerHTML.trim()) reset();
    resetButton?.addEventListener('click', reset);

    copyButton?.addEventListener('click', () => {
        if (!editor) return;

        const range = document.createRange();
        range.selectNodeContents(editor);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        try {
            document.execCommand('copy');
            showMsg('msgTemplate', '書式付きでコピーしました！');
        } catch (error) {
            console.error('書式付きコピーに失敗しました:', error);
            showMsg('msgTemplate', 'コピー失敗', true);
        } finally {
            selection?.removeAllRanges();
        }
    });
};
