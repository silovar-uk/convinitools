import { copyToClipboard, normalizeNewlines } from '../core/ui.js';

export const initMarkdown = () => {
    // ==========================================
    // 5. リッチテキスト→MD
    // ==========================================
    const inputMD = document.getElementById('inputMD');
    const outputMD = document.getElementById('outputMD');
    const mdCharModeInputs = document.querySelectorAll('input[name="md-char-mode"]');
    const mdShowSanitizeSummary = document.getElementById('mdShowSanitizeSummary');
    const mdSanitizeStatus = document.getElementById('mdSanitizeStatus');
    const mdSanitizeDetails = document.getElementById('mdSanitizeDetails');
    const mdSanitizeDetailsSummary = document.getElementById('mdSanitizeDetailsSummary');
    const mdSanitizeList = document.getElementById('mdSanitizeList');

    // Windows系のShift_JIS（WHATWGのshift_jis）で使える文字を、ブラウザ標準の
    // TextDecoderから逆引きで生成する。外部ライブラリなしで、実際のChromeの文字コード表に合わせる。
    let shiftJisCharacterSet = null;
    const buildShiftJisCharacterSet = () => {
        if (shiftJisCharacterSet) return shiftJisCharacterSet;

        const supported = new Set(['\n', '\r', '\t']);
        const decoder = new TextDecoder('shift_jis', { fatal: true });
        const addDecoded = (bytes) => {
            try {
                const decoded = decoder.decode(Uint8Array.from(bytes));
                if (!decoded || decoded.includes('\uFFFD')) return;
                for (const char of decoded) supported.add(char);
            } catch (_) {
                // 不正なバイト列は対象外
            }
        };

        // ASCII と半角カタカナ
        for (let byte = 0x20; byte <= 0x7E; byte++) addDecoded([byte]);
        for (let byte = 0xA1; byte <= 0xDF; byte++) addDecoded([byte]);

        // Shift_JISの2バイト領域
        const leadBytes = [];
        for (let byte = 0x81; byte <= 0x9F; byte++) leadBytes.push(byte);
        for (let byte = 0xE0; byte <= 0xFC; byte++) leadBytes.push(byte);

        for (const lead of leadBytes) {
            for (let trail = 0x40; trail <= 0xFC; trail++) {
                if (trail === 0x7F) continue;
                addDecoded([lead, trail]);
            }
        }

        shiftJisCharacterSet = supported;
        return shiftJisCharacterSet;
    };

    // Sakura EditorのSJIS保存で警告になりやすい文字を、意味を極力保つ形で置換する。
    const sjisReplacementMap = new Map([
        ['〜', '～'], // U+301C → U+FF5E（波ダッシュ問題）
        ['‐', '-'], ['‑', '-'], ['‒', '-'], ['–', '-'], ['—', '-'], ['−', '-'],
        ['‘', "'"], ['’', "'"], ['‚', "'"], ['‛', "'"],
        ['“', '"'], ['”', '"'], ['„', '"'], ['‟', '"'],
        ['′', "'"], ['″', '"'],
        ['•', '・'], ['·', '・'],
        [' ', ' '], ['　', '　'],
        ['¥', '￥'],
        ['©', '(C)'], ['®', '(R)'], ['™', 'TM'],
        ['≠', '!='], ['≤', '<='], ['≥', '>='],
        ['\u200B', ''], ['\u200C', ''], ['\u200D', ''], ['\u2060', ''], ['\uFEFF', ''],
        ['\uFE0E', ''], ['\uFE0F', ''], ['\u20E3', '']
    ]);

    // UTF-8では保存できる文字でも、コピー元に混ざる不可視文字・方向制御文字・
    // 補助面文字はSakuraの保存時警告や見た目の崩れの原因になりやすい。
    // 通常の日本語や一般的な記号は残し、意味を持たない書式文字だけを整理する。
    const utf8SakuraReplacementMap = new Map([
        ['\u00AD', ' '], // ソフトハイフン: 見えない改行候補を通常スペースへ
        ['\u034F', ''],  // Combining Grapheme Joiner
        ['\u061C', ''],  // Arabic Letter Mark
        ['\u180E', ''],  // Mongolian Vowel Separator
        ['\u200B', ''], ['\u200C', ''], ['\u200D', ''],
        ['\u200E', ''], ['\u200F', ''],
        ['\u2028', '\n'], ['\u2029', '\n'],
        ['\u202A', ''], ['\u202B', ''], ['\u202C', ''], ['\u202D', ''], ['\u202E', ''],
        ['\u202F', ' '], ['\u205F', ' '], ['\u2060', ''],
        ['\u2066', ''], ['\u2067', ''], ['\u2068', ''], ['\u2069', ''],
        ['\uFE00', ''], ['\uFE01', ''], ['\uFE02', ''], ['\uFE03', ''],
        ['\uFE04', ''], ['\uFE05', ''], ['\uFE06', ''], ['\uFE07', ''],
        ['\uFE08', ''], ['\uFE09', ''], ['\uFE0A', ''], ['\uFE0B', ''],
        ['\uFE0C', ''], ['\uFE0D', ''], ['\uFE0E', ''], ['\uFE0F', ''],
        ['\uFEFF', ''], ['\uFFF9', ''], ['\uFFFA', ''], ['\uFFFB', '']
    ]);

    const emojiPictographPattern = /\p{Extended_Pictographic}/u;
    const regionalIndicatorPattern = /\p{Regional_Indicator}/u;
    const keycapPattern = /^[#*0-9]\uFE0F?\u20E3$/u;
    const emojiModifierPattern = /\p{Emoji_Modifier}/u;
    const graphemeSegmenter = (typeof Intl !== 'undefined' && Intl.Segmenter)
        ? new Intl.Segmenter('ja', { granularity: 'grapheme' })
        : null;

    const splitGraphemes = (text) => {
        if (graphemeSegmenter) {
            return Array.from(graphemeSegmenter.segment(text), item => item.segment);
        }
        return Array.from(text);
    };

    const isEmojiGrapheme = (segment) => {
        // © / ® / ™ は文字として使われるケースも多いため、単体なら記号変換に回す。
        if (segment.length === 1 && sjisReplacementMap.has(segment)) return false;
        return keycapPattern.test(segment)
            || regionalIndicatorPattern.test(segment)
            || emojiModifierPattern.test(segment)
            || segment.includes('\uFE0F')
            || segment.includes('\u200D')
            || emojiPictographPattern.test(segment);
    };

    const isShiftJisSafe = (text, characterSet) => {
        for (const char of text) {
            if (!characterSet.has(char)) return false;
        }
        return true;
    };

    const countEmojiPlaceholder = '[絵文字]';

    const createSanitizeStats = () => ({
        totalChanged: 0,
        symbolChanged: 0,
        emojiChanged: 0,
        emojiKept: 0,
        supplementaryChanged: 0,
        supplementaryKept: 0,
        removed: 0,
        unknown: 0,
        changes: new Map()
    });

    const recordSanitizeChange = (stats, from, to, reason) => {
        const key = `${from}\u0000${to}\u0000${reason}`;
        const existing = stats.changes.get(key);
        if (existing) {
            existing.count += 1;
            return;
        }
        stats.changes.set(key, { from, to, reason, count: 1 });
    };

    const invisibleCharacterNames = new Map([
        ['\u200B', 'ゼロ幅スペース'],
        ['\u200C', 'ゼロ幅非接合子'],
        ['\u200D', 'ゼロ幅接合子'],
        ['\u2060', 'ワード結合子'],
        ['\uFEFF', 'ゼロ幅ノーブレークスペース'],
        ['\uFE0E', 'テキスト用異体字セレクタ'],
        ['\uFE0F', '絵文字用異体字セレクタ'],
        ['\u20E3', 'キーキャップ結合文字']
    ]);

    const formatCodePoints = (text) => Array.from(text)
        .map(char => `U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`)
        .join(' ');

    const formatSanitizeValue = (text) => {
        if (!text) return '削除';
        if (invisibleCharacterNames.has(text)) return invisibleCharacterNames.get(text);
        if (text === '\n') return '改行';
        if (text === '\t') return 'タブ';
        return text;
    };

    const sanitizeMarkdownForSjis = (text, emojiPolicy) => {
        const characterSet = buildShiftJisCharacterSet();
        const stats = createSanitizeStats();
        let result = '';

        // 改行を揃えた後、合成できる文字はNFCで安定化する。
        const normalized = normalizeNewlines(text).normalize('NFC');

        for (const grapheme of splitGraphemes(normalized)) {
            if (isEmojiGrapheme(grapheme)) {
                if (emojiPolicy === 'keep') {
                    result += grapheme;
                    stats.emojiKept += 1;
                } else if (emojiPolicy === 'placeholder') {
                    result += countEmojiPlaceholder;
                    stats.totalChanged += 1;
                    stats.emojiChanged += 1;
                    recordSanitizeChange(stats, grapheme, countEmojiPlaceholder, '絵文字を文字列へ置換');
                } else {
                    stats.totalChanged += 1;
                    stats.emojiChanged += 1;
                    stats.removed += 1;
                    recordSanitizeChange(stats, grapheme, '', '絵文字を削除');
                }
                continue;
            }

            for (const char of grapheme) {
                if (char === '\n' || char === '\t') {
                    result += char;
                    continue;
                }

                const codePoint = char.codePointAt(0);
                // 制御文字、単独サロゲート、Unicode非文字は保存対象から除く。
                const isControl = (codePoint < 0x20) || (codePoint >= 0x7F && codePoint <= 0x9F);
                const isSurrogate = codePoint >= 0xD800 && codePoint <= 0xDFFF;
                const isNonCharacter = (codePoint >= 0xFDD0 && codePoint <= 0xFDEF)
                    || (codePoint & 0xFFFF) === 0xFFFE
                    || (codePoint & 0xFFFF) === 0xFFFF;
                if (isControl || isSurrogate || isNonCharacter) {
                    stats.totalChanged += 1;
                    stats.removed += 1;
                    recordSanitizeChange(stats, char, '', '制御文字または無効文字を削除');
                    continue;
                }

                const directReplacement = sjisReplacementMap.has(char)
                    ? sjisReplacementMap.get(char)
                    : char;
                if (directReplacement !== char) {
                    stats.totalChanged += 1;
                    stats.symbolChanged += 1;
                    recordSanitizeChange(
                        stats,
                        char,
                        directReplacement,
                        directReplacement ? 'SJIS向けの表記へ置換' : '不可視文字を削除'
                    );
                    if (!directReplacement) {
                        stats.removed += 1;
                        continue;
                    }
                }

                if (isShiftJisSafe(directReplacement, characterSet)) {
                    result += directReplacement;
                    continue;
                }

                // 丸数字、ローマ数字、単位記号などはNFKCで一般的な文字列に直せることがある。
                const compatibilityForm = directReplacement.normalize('NFKC');
                if (compatibilityForm !== directReplacement && isShiftJisSafe(compatibilityForm, characterSet)) {
                    result += compatibilityForm;
                    stats.totalChanged += 1;
                    stats.symbolChanged += 1;
                    recordSanitizeChange(stats, directReplacement, compatibilityForm, '互換文字を一般的な表記へ置換');
                    continue;
                }

                // それでもSJISに存在しない文字は、見落としなく ? に置換する。
                result += '?';
                stats.totalChanged += 1;
                stats.unknown += 1;
                recordSanitizeChange(stats, directReplacement, '?', 'Shift_JIS非対応のため置換');
            }
        }

        return { text: result, stats };
    };

    const sanitizeMarkdownForUtf8 = (text, emojiPolicy) => {
        const stats = createSanitizeStats();
        let result = '';

        // NFCで合成できる文字を安定化し、改行コードも揃える。
        const normalized = normalizeNewlines(text).normalize('NFC');

        for (const grapheme of splitGraphemes(normalized)) {
            const chars = Array.from(grapheme);
            const hasSupplementaryCharacter = chars.some(char => char.codePointAt(0) > 0xFFFF);

            // 絵文字は、Sakura互換を最優先する設定では文字列に置換する。
            // 残す設定では絵文字の合成（ZWJ・異体字セレクタ）を壊さず、そのまま保持する。
            if (isEmojiGrapheme(grapheme)) {
                if (emojiPolicy === 'keep') {
                    result += grapheme;
                    stats.emojiKept += 1;
                } else {
                    result += countEmojiPlaceholder;
                    stats.totalChanged += 1;
                    stats.emojiChanged += 1;
                    recordSanitizeChange(stats, grapheme, countEmojiPlaceholder, 'UTF-8/Sakura互換のため絵文字を文字列へ置換');
                }
                continue;
            }

            // 補助面（U+10000以上）は標準UTF-8では有効でも、環境によって保存時警告の原因になる。
            // 安全整形では置換、絵文字を残す設定では保持して警告文で知らせる。
            if (hasSupplementaryCharacter) {
                if (emojiPolicy === 'keep') {
                    result += grapheme;
                    stats.supplementaryKept += 1;
                } else {
                    const placeholder = '[補助面文字]';
                    result += placeholder;
                    stats.totalChanged += 1;
                    stats.supplementaryChanged += 1;
                    recordSanitizeChange(stats, grapheme, placeholder, 'UTF-8/Sakura互換のため補助面文字を文字列へ置換');
                }
                continue;
            }

            for (const char of chars) {
                if (char === '\n' || char === '\t') {
                    result += char;
                    continue;
                }

                const codePoint = char.codePointAt(0);
                const isControl = (codePoint < 0x20) || (codePoint >= 0x7F && codePoint <= 0x9F);
                const isSurrogate = codePoint >= 0xD800 && codePoint <= 0xDFFF;
                const isNonCharacter = (codePoint >= 0xFDD0 && codePoint <= 0xFDEF)
                    || (codePoint & 0xFFFF) === 0xFFFE
                    || (codePoint & 0xFFFF) === 0xFFFF;
                if (isControl || isSurrogate || isNonCharacter) {
                    stats.totalChanged += 1;
                    stats.removed += 1;
                    recordSanitizeChange(stats, char, '', 'UTF-8に不適切な制御文字または無効文字を削除');
                    continue;
                }

                const replacement = utf8SakuraReplacementMap.has(char)
                    ? utf8SakuraReplacementMap.get(char)
                    : char;
                if (replacement !== char) {
                    stats.totalChanged += 1;
                    stats.symbolChanged += 1;
                    if (!replacement) stats.removed += 1;
                    recordSanitizeChange(
                        stats,
                        char,
                        replacement,
                        replacement ? '不可視・方向制御・特殊改行を安全な表記へ整形' : '不可視・方向制御文字を削除'
                    );
                }
                result += replacement;
            }
        }

        return { text: result, stats };
    };

    const getMarkdownCharMode = () => {
        const checked = document.querySelector('input[name="md-char-mode"]:checked');
        return checked ? checked.value : 'sjis-replace-emoji';
    };

    const shouldShowSanitizeReport = () => !mdShowSanitizeSummary || mdShowSanitizeSummary.checked;

    const describeMarkdownConversion = (mode, stats) => {
        if (mode === 'utf8-raw') {
            return { text: 'UTF-8・そのまま：文字は整形していません。Sakuraで保存時に警告が出る場合は「UTF-8・Sakura向け安全整形」を選んでください。', warning: true };
        }

        const parts = [];
        if (stats.symbolChanged) parts.push(`記号・不可視文字 ${stats.symbolChanged}件`);
        if (stats.emojiChanged) {
            const label = mode === 'sjis-remove-emoji' ? '絵文字を削除' : '絵文字を文字列へ置換';
            parts.push(`${label} ${stats.emojiChanged}件`);
        }
        if (stats.supplementaryChanged) parts.push(`補助面文字を文字列へ置換 ${stats.supplementaryChanged}件`);
        if (stats.unknown) parts.push(`未対応文字を ? へ置換 ${stats.unknown}件`);
        if (stats.removed && !stats.emojiChanged) parts.push(`不可視文字などを削除 ${stats.removed}件`);
        const changedSummary = parts.length ? parts.join('／') : '置換対象なし';

        if (mode === 'utf8-sakura-safe') {
            return { text: `UTF-8・Sakura向け安全整形：${changedSummary}。`, warning: false };
        }

        if (mode === 'utf8-sakura-keep-emoji') {
            const keptParts = [];
            if (stats.emojiKept) keptParts.push(`絵文字 ${stats.emojiKept}件`);
            if (stats.supplementaryKept) keptParts.push(`補助面文字 ${stats.supplementaryKept}件`);
            const kept = keptParts.length ? ` ${keptParts.join('／')}は残しています。` : '';
            return {
                text: `UTF-8・Sakura向け整形：${changedSummary}。${kept}${kept ? ' 保存時に警告が出る場合は「安全整形」を選んでください。' : ''}`,
                warning: keptParts.length > 0
            };
        }

        if (mode === 'sjis-keep-emoji') {
            const kept = stats.emojiKept ? ` 絵文字 ${stats.emojiKept}件は残しています。` : '';
            return {
                text: `記号だけSJIS向けに整形：${changedSummary}。${kept} 絵文字を含むため、SJIS保存時は警告が出ます。`,
                warning: stats.emojiKept > 0
            };
        }

        return { text: `SJIS向け：${changedSummary}。`, warning: false };
    };

    const clearMarkdownSanitizeReport = () => {
        if (mdSanitizeStatus) {
            mdSanitizeStatus.textContent = '';
            mdSanitizeStatus.className = 'compatibility-status is-hidden';
        }
        if (mdSanitizeDetails) {
            mdSanitizeDetails.classList.add('is-hidden');
            mdSanitizeDetails.open = false;
        }
        if (mdSanitizeDetailsSummary) mdSanitizeDetailsSummary.textContent = '変換・削除した文字の一覧';
        if (mdSanitizeList) mdSanitizeList.replaceChildren();
    };

    const updateMarkdownStatus = (mode, stats) => {
        if (!mdSanitizeStatus) return;
        if (!shouldShowSanitizeReport()) {
            mdSanitizeStatus.textContent = '';
            mdSanitizeStatus.className = 'compatibility-status is-hidden';
            return;
        }
        const description = describeMarkdownConversion(mode, stats);
        mdSanitizeStatus.textContent = description.text;
        mdSanitizeStatus.className = `compatibility-status${description.warning ? ' warning' : ''}`;
    };

    const renderMarkdownSanitizeDetails = (mode, stats) => {
        if (!mdSanitizeDetails || !mdSanitizeDetailsSummary || !mdSanitizeList) return;
        mdSanitizeList.replaceChildren();

        const changes = Array.from(stats.changes.values());
        if (!shouldShowSanitizeReport() || mode === 'utf8-raw' || !changes.length) {
            mdSanitizeDetails.classList.add('is-hidden');
            mdSanitizeDetails.open = false;
            return;
        }

        mdSanitizeDetailsSummary.textContent = `変換・削除した文字：${stats.totalChanged}件／${changes.length}種類`;
        changes.forEach(change => {
            const row = document.createElement('div');
            row.className = 'sanitize-item';

            const values = document.createElement('div');
            values.className = 'sanitize-values';

            const from = document.createElement('code');
            from.textContent = formatSanitizeValue(change.from);
            from.title = formatCodePoints(change.from);

            const arrow = document.createElement('span');
            arrow.className = 'sanitize-arrow';
            arrow.textContent = '→';

            const to = document.createElement('code');
            to.textContent = formatSanitizeValue(change.to);
            if (change.to) to.title = formatCodePoints(change.to);

            values.append(from, arrow, to);

            const meta = document.createElement('div');
            meta.className = 'sanitize-meta';
            const pointInfo = formatCodePoints(change.from);
            meta.textContent = `${change.reason} ・ ${change.count}件${pointInfo ? ` ・ ${pointInfo}` : ''}`;

            row.append(values, meta);
            mdSanitizeList.appendChild(row);
        });

        mdSanitizeDetails.classList.remove('is-hidden');
        mdSanitizeDetails.open = true;
    };

    const simpleHtmlToMarkdown = (html, charMode = getMarkdownCharMode()) => {
        const div = document.createElement('div');
        div.innerHTML = html;

        const walk = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent;
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return '';

            const tag = node.tagName.toLowerCase();
            let childrenMd = '';
            node.childNodes.forEach(child => childrenMd += walk(child));

            switch (tag) {
                case 'h1': return `# ${childrenMd}\n`;
                case 'h2': return `## ${childrenMd}\n`;
                case 'h3': return `### ${childrenMd}\n`;
                case 'p': return `${childrenMd}\n`;
                case 'br': return `\n`;
                case 'b':
                case 'strong': return `**${childrenMd}**`;
                case 'i':
                case 'em': return `*${childrenMd}*`;
                case 'ul': return `${childrenMd}\n`;
                case 'ol': return `${childrenMd}\n`;
                case 'li': return `- ${childrenMd.trim()}\n`;
                case 'a': return `[${childrenMd}](${node.getAttribute('href')})`;
                case 'div': return `${childrenMd}\n`;
                default: return childrenMd;
            }
        };

        let markdown = walk(div);
        markdown = normalizeNewlines(markdown);
        markdown = markdown.replace(/\n+/g, '\n');
        markdown = markdown.replace(/\n(#+\s)/g, '\n\n$1');
        markdown = markdown.trim();

        if (charMode === 'utf8-raw') {
            return {
                text: markdown,
                stats: createSanitizeStats()
            };
        }

        if (charMode === 'utf8-sakura-safe') {
            return sanitizeMarkdownForUtf8(markdown, 'placeholder');
        }

        if (charMode === 'utf8-sakura-keep-emoji') {
            return sanitizeMarkdownForUtf8(markdown, 'keep');
        }

        const emojiPolicy = charMode === 'sjis-remove-emoji'
            ? 'remove'
            : charMode === 'sjis-keep-emoji'
                ? 'keep'
                : 'placeholder';
        return sanitizeMarkdownForSjis(markdown, emojiPolicy);
    };

    const refreshMarkdownOutput = () => {
        if (!inputMD || !outputMD) return;
        const mode = getMarkdownCharMode();
        const result = simpleHtmlToMarkdown(inputMD.innerHTML, mode);
        outputMD.value = result.text;
        renderMarkdownSanitizeDetails(mode, result.stats);
        updateMarkdownStatus(mode, result.stats);
    };

    if (inputMD) {
        inputMD.addEventListener('input', refreshMarkdownOutput);
    }
    mdCharModeInputs.forEach(input => input.addEventListener('change', refreshMarkdownOutput));
    if (mdShowSanitizeSummary) {
        mdShowSanitizeSummary.addEventListener('change', refreshMarkdownOutput);
    }

    const copyBtnMD = document.getElementById('copyBtnMD');
    if (copyBtnMD) copyBtnMD.addEventListener('click', () => copyToClipboard(outputMD.value, 'msgMD'));

    const clearBtnMD = document.getElementById('clearBtnMD');
    if (clearBtnMD) {
        clearBtnMD.addEventListener('click', () => {
            inputMD.innerHTML = '';
            outputMD.value = '';
            clearMarkdownSanitizeReport();
        });
    }
};
