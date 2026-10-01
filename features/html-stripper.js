import { copyToClipboard, normalizeNewlines } from '../core/ui.js';

export const initHtmlStripper = () => {
    // ==========================================
    // 6. HTMLタグ除去 (＋Markdown記号除去)
    // ==========================================
    const inputHtml = document.getElementById('inputHtml');
    const outputHtml = document.getElementById('outputHtml');
    const counterHtml = document.getElementById('counterHtml');
    const copyBtnHtml = document.getElementById('copyBtnHtml');

    const updateCounter = (text) => {
        if (!counterHtml) return;
        const normalized = normalizeNewlines(text);
        const chars = normalized.length;
        const lines = normalized ? normalized.split('\n').length : 0;
        counterHtml.textContent = `${chars.toLocaleString()}文字 / ${lines.toLocaleString()}行`;
    };

    const stripMarkdown = (text) => {
        return text
            // 1. ヘッダー記号 (# ### など)
            .replace(/^#+\s+/gm, '')
            // 2. 太字・斜体 (** __ * _)
            .replace(/(\*\*|__)(.*?)\1/g, '$2')
            .replace(/(\*|_)(.*?)\1/g, '$2')
            // 3. インラインコード (`)
            .replace(/`(.*?)`/g, '$1')
            // 4. 画像 (![alt](url))
            .replace(/!\[(.*?)\]\(.*?\)/g, '')
            // 5. リンク ([text](url)) ※テキストだけ残す
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            // 6. 引用記号 (>)
            .replace(/^\s*>\s+/gm, '')
            // 7. 水平線 (---, ***, ___)
            .replace(/^\s*([-*_]){3,}\s*$/gm, '')
            // 8. 箇条書き記号 ( - or * or + )
            .replace(/^\s*[-*+]\s+/gm, '');
    };

    const convertBtnHtml = document.getElementById('convertBtnHtml');
    if (convertBtnHtml) {
        convertBtnHtml.addEventListener('click', () => {
            const html = inputHtml.value;
            if (!html) {
                outputHtml.value = '';
                return;
            }
            try {
                // HTMLタグの除去
                const doc = new DOMParser().parseFromString(html, 'text/html');
                doc.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
                const blockTags = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'];
                blockTags.forEach(tag => {
                    doc.querySelectorAll(tag).forEach(el => {
                        el.textContent += '\n';
                    });
                });

                let text = doc.body.textContent || "";
                
                // Markdown記号の除去
                text = stripMarkdown(text);

                // 整形
                text = normalizeNewlines(text);
                text = text.replace(/\n{3,}/g, '\n\n').trim();
                
                outputHtml.value = text;
                updateCounter(text);
            } catch (e) {
                console.error(e);
                outputHtml.value = '変換エラー';
            }
        });
    }

    if (outputHtml) outputHtml.addEventListener('input', () => updateCounter(outputHtml.value));
    if (copyBtnHtml) copyBtnHtml.addEventListener('click', () => copyToClipboard(outputHtml.value, 'msgHtml'));
    
    const clearBtnHtml = document.getElementById('clearBtnHtml');
    if (clearBtnHtml) {
        clearBtnHtml.addEventListener('click', () => {
            inputHtml.value = '';
            outputHtml.value = '';
            updateCounter('');
        });
    }
};
