document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // ヘルパー関数: 改行コードの正規化
    // ==========================================
    const normalizeNewlines = (str) => {
        return str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    };

    // ヘルパー関数: Dateオブジェクトを YYYY-MM-DD に変換
    const formatDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    // ==========================================
    // 共通: タブ切り替えロジック
    // ==========================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    const switchTab = (targetId) => {
        tabBtns.forEach(b => {
            if (b.getAttribute('data-target') === targetId) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
        contents.forEach(c => {
            if (c.id === targetId) {
                c.classList.add('active');
            } else {
                c.classList.remove('active');
            }
        });
    };

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            switchTab(targetId);
        });
    });

    // 共通: メッセージ表示関数
    const showMsg = (elementId, text, isError = false) => {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.textContent = text;
        el.className = isError ? 'message error show' : 'message show';
        setTimeout(() => {
            el.classList.remove('show');
        }, 2000);
    };

    // 共通: クリップボードコピー関数
    const copyToClipboard = (text, msgId) => {
        if (!text) {
            showMsg(msgId, 'テキストがありません', true);
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            showMsg(msgId, 'コピーしました！');
        }).catch(err => {
            console.error(err);
            try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                showMsg(msgId, 'コピーしました！');
            } catch (e) {
                showMsg(msgId, 'コピー失敗', true);
            }
        });
    };

    // ==========================================
    // 新機能: メールテンプレート
    // ==========================================
    const templateEditor = document.getElementById('templateEditor');
    const copyTemplateBtn = document.getElementById('copyTemplateBtn');
    const resetTemplateBtn = document.getElementById('resetTemplateBtn');

    const defaultTemplateHtml = `<span style="background-color: yellow; font-weight: bold;">※※※添付ファイルが更新後か確認※※※</span><br>吉田さん、晃さん<br><br>お疲れ様です。多比良です。<br>●●についてご確認・承認お願いいたします。<br><br>-------------------------------------<br><span class="red-section">■確認概要<br>・今回の依頼期限：<br>・ホットトピック有無：<br>・小窓画像：<br>・掲載日時→<br>・承認期限→</span>`;

    const setTemplate = () => {
        if (templateEditor) {
            templateEditor.innerHTML = defaultTemplateHtml;
        }
    };

    if (templateEditor && !templateEditor.innerHTML.trim()) {
        setTemplate();
    }

    if (resetTemplateBtn) {
        resetTemplateBtn.addEventListener('click', setTemplate);
    }

    if (copyTemplateBtn) {
        copyTemplateBtn.addEventListener('click', () => {
            if (!templateEditor) return;

            const range = document.createRange();
            range.selectNodeContents(templateEditor);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);

            try {
                document.execCommand('copy');
                selection.removeAllRanges();
                showMsg('msgTemplate', '書式付きでコピーしました！');
            } catch (err) {
                console.error(err);
                showMsg('msgTemplate', 'コピー失敗', true);
            }
        });
    }

    // ==========================================
    // 2. 改行修正
    // ==========================================
    const inputTextLB = document.getElementById('inputTextLB');
    const outputTextLB = document.getElementById('outputTextLB');
    
    const processLineBreak = (text) => {
        if (!text) return "";
        const normalized = normalizeNewlines(text);
        return normalized.replace(/\n{2,}/g, '\n');
    };

    if (inputTextLB) {
        inputTextLB.addEventListener('input', () => {
            outputTextLB.value = processLineBreak(inputTextLB.value);
        });
    }

    const copyBtnLB = document.getElementById('copyBtnLB');
    if (copyBtnLB) {
        copyBtnLB.addEventListener('click', () => {
            copyToClipboard(outputTextLB.value, 'msgLB');
        });
    }

    const clearBtnLB = document.getElementById('clearBtnLB');
    if (clearBtnLB) {
        clearBtnLB.addEventListener('click', () => {
            inputTextLB.value = '';
            outputTextLB.value = '';
        });
    }

    // ==========================================
    // 3. 全角→半角変換
    // ==========================================
    const inputTextZH = document.getElementById('inputTextZH');
    const outputTextZH = document.getElementById('outputTextZH');

    if (inputTextZH) {
        inputTextZH.addEventListener('input', () => {
            const text = normalizeNewlines(inputTextZH.value);
            let html = '';
            
            for (let char of text) {
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
                    html += `<span class="highlight-char">&nbsp;</span>`;
                } else {
                    html += char.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                }
            }
            outputTextZH.innerHTML = html;
        });
    }

    const copyBtnZH = document.getElementById('copyBtnZH');
    if (copyBtnZH) {
        copyBtnZH.addEventListener('click', () => {
            copyToClipboard(outputTextZH.innerText, 'msgZH');
        });
    }

    const clearBtnZH = document.getElementById('clearBtnZH');
    if (clearBtnZH) {
        clearBtnZH.addEventListener('click', () => {
            inputTextZH.value = '';
            outputTextZH.innerHTML = '';
        });
    }
    // ==========================================
    // 4. 調整カレンダー
    // ==========================================
    const calendarContainer = document.getElementById('calendarContainer');
    const outputCal = document.getElementById('outputCal');
    const currentDisplay = document.getElementById('calCurrentDisplay');
    const modeMonthBtn = document.getElementById('modeMonth');
    const modeWeekBtn = document.getElementById('modeWeek');
    const calPrevBtn = document.getElementById('calPrev');
    const calNextBtn = document.getElementById('calNext');
    const calSelectionRangeBtn = document.getElementById('calSelectionRange');
    const calSelectionOnwardBtn = document.getElementById('calSelectionOnward');
    const calSelectionGuide = document.getElementById('calSelectionGuide');
    const calendarTimeToolbar = document.getElementById('calendarTimeToolbar');
    const calendarDateToolbar = document.getElementById('calendarDateToolbar');
    const calDatePreset = document.getElementById('calDatePreset');
    const calWeekdayFormat = document.getElementById('calWeekdayFormat');
    const calOutputFormat = document.getElementById('calOutputFormat');
    const calMergeConsecutive = document.getElementById('calMergeConsecutive');
    const calendarConflictSummary = document.getElementById('calendarConflictSummary');
    const calendarConflictList = document.getElementById('calendarConflictList');
    const calendarSelectionList = document.getElementById('calendarSelectionList');
    const undoCalBtn = document.getElementById('undoCalBtn');
    const calendarUndoBar = document.getElementById('calendarUndoBar');
    const calendarUndoMessage = document.getElementById('calendarUndoMessage');
    const restoreCalBtn = document.getElementById('restoreCalBtn');
    const copyBtnCal = document.getElementById('copyBtnCal');
    const clearBtnCal = document.getElementById('clearBtnCal');

    const CALENDAR_WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
    const CALENDAR_SLOT_MINUTES = 30;
    const CALENDAR_START_MINUTES = 8 * 60;
    const CALENDAR_END_MINUTES = 23 * 60;
    const CALENDAR_KIND_LABELS = {
        range: '時間帯',
        onward: '以降',
        allday: '終日',
        morning: '午前',
        afternoon: '午後',
        night: '夜',
        unspecified: '時間未定'
    };
    const CALENDAR_PRESET_KINDS = new Set(['allday', 'morning', 'afternoon', 'night', 'unspecified']);
    const CALENDAR_TIMED_KINDS = new Set(['range', 'onward']);

    let currentDate = new Date();
    currentDate.setHours(12, 0, 0, 0);
    let calendarMode = 'week';
    let calendarSelectionMode = 'range';
    let calendarEntries = [];
    let calendarEntrySequence = 0;
    let calendarDrag = null;
    let calendarEditingId = null;
    let lastCalendarAction = null;
    let calendarUndoState = null;
    let calendarUndoTimer = null;

    const pad2 = (value) => String(value).padStart(2, '0');

    const formatLocalDateKey = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    };

    const dateFromKey = (key) => {
        const [year, month, day] = key.split('-').map(Number);
        return new Date(year, month - 1, day, 12, 0, 0, 0);
    };

    const addDaysToKey = (key, days) => {
        const date = dateFromKey(key);
        date.setDate(date.getDate() + days);
        return formatLocalDateKey(date);
    };

    const getSundayOfWeek = (date) => {
        const start = new Date(date);
        start.setHours(12, 0, 0, 0);
        start.setDate(start.getDate() - start.getDay());
        return start;
    };

    const formatCalendarTime = (minutes) => `${Math.floor(minutes / 60)}:${pad2(minutes % 60)}`;

    const timeStringToMinutes = (value) => {
        if (!/^\d{2}:\d{2}$/.test(value || '')) return null;
        const [hours, minutes] = value.split(':').map(Number);
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
        return hours * 60 + minutes;
    };

    const getWeekdayFormat = () => calWeekdayFormat?.value || 'plain';

    const getEffectiveWeekdayFormat = () => {
        if (calOutputFormat?.value === 'compact') return 'plain';
        return getWeekdayFormat();
    };

    const formatDateWithWeekday = (dateKey, short = false, weekdayFormat = getWeekdayFormat()) => {
        const date = dateFromKey(dateKey);
        const dayText = short ? `${date.getDate()}` : `${date.getMonth() + 1}/${date.getDate()}`;
        const weekday = CALENDAR_WEEKDAYS[date.getDay()];

        if (weekdayFormat === 'none') return dayText;
        if (weekdayFormat === 'brackets') return `${dayText}(${weekday})`;
        return `${dayText}${weekday}`;
    };

    const formatCalendarDateRange = (startDate, endDate, weekdayFormat = getWeekdayFormat()) => {
        if (startDate === endDate) return formatDateWithWeekday(startDate, false, weekdayFormat);

        const start = dateFromKey(startDate);
        const end = dateFromKey(endDate);
        const endIsSameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
        return `${formatDateWithWeekday(startDate, false, weekdayFormat)}-${formatDateWithWeekday(endDate, endIsSameMonth, weekdayFormat)}`;
    };

    const getCalendarKindOrder = (entry) => {
        const fixed = { allday: 0, morning: 1, range: 2, onward: 2, afternoon: 3, night: 4, unspecified: 5 };
        return fixed[entry.kind] ?? 99;
    };

    const sortCalendarEntries = (entries) => [...entries].sort((a, b) => {
        if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
        if (getCalendarKindOrder(a) !== getCalendarKindOrder(b)) return getCalendarKindOrder(a) - getCalendarKindOrder(b);
        if ((a.startMinutes ?? -1) !== (b.startMinutes ?? -1)) return (a.startMinutes ?? -1) - (b.startMinutes ?? -1);
        return a.id.localeCompare(b.id);
    });

    const normalizeMemo = (memo) => String(memo || '')
        .replace(/\s+/g, ' ')
        .replace(/^※\s*/, '')
        .trim();

    const createCalendarEntry = (entry) => ({
        id: `cal-${Date.now()}-${++calendarEntrySequence}`,
        kind: CALENDAR_KIND_LABELS[entry.kind] ? entry.kind : 'unspecified',
        startDate: entry.startDate,
        endDate: entry.startDate,
        startMinutes: CALENDAR_TIMED_KINDS.has(entry.kind) ? entry.startMinutes : null,
        endMinutes: entry.kind === 'range' ? entry.endMinutes : null,
        memo: normalizeMemo(entry.memo)
    });

    const entrySignature = (entry) => [
        entry.kind,
        entry.startDate,
        entry.endDate,
        entry.startMinutes ?? '',
        entry.endMinutes ?? '',
        normalizeMemo(entry.memo)
    ].join('|');

    const isTimedEntry = (entry) => CALENDAR_TIMED_KINDS.has(entry.kind);

    const getEntryConditionText = (entry) => {
        if (entry.kind === 'range') return `${formatCalendarTime(entry.startMinutes)}-${formatCalendarTime(entry.endMinutes)}`;
        if (entry.kind === 'onward') return `${formatCalendarTime(entry.startMinutes)}以降`;
        return CALENDAR_KIND_LABELS[entry.kind] || '時間未定';
    };

    const getEntryMemoText = (entry) => entry.memo ? `※${normalizeMemo(entry.memo)}` : '';

    const calendarEntryToText = (entry, weekdayFormat = getWeekdayFormat()) => {
        const dateText = formatCalendarDateRange(entry.startDate, entry.endDate, weekdayFormat);
        const conditionText = getEntryConditionText(entry);
        const memoText = getEntryMemoText(entry);
        return [dateText, conditionText, memoText].filter(Boolean).join(' ');
    };

    const getDailyCalendarRecords = () => {
        const records = [];
        const existing = new Set();

        calendarEntries.forEach((entry) => {
            const record = {
                dateKey: entry.startDate,
                kind: entry.kind,
                startMinutes: entry.startMinutes ?? null,
                endMinutes: entry.endMinutes ?? null,
                memo: normalizeMemo(entry.memo)
            };
            const signature = [record.dateKey, record.kind, record.startMinutes ?? '', record.endMinutes ?? '', record.memo].join('|');
            if (!existing.has(signature)) {
                existing.add(signature);
                records.push(record);
            }
        });

        return records.sort((a, b) => {
            if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
            const aOrder = getCalendarKindOrder(a);
            const bOrder = getCalendarKindOrder(b);
            if (aOrder !== bOrder) return aOrder - bOrder;
            return (a.startMinutes ?? -1) - (b.startMinutes ?? -1);
        });
    };

    const getCalendarOutputGroups = () => {
        const records = getDailyCalendarRecords();
        const shouldMerge = calMergeConsecutive?.checked ?? true;
        if (!shouldMerge) return records.map((record) => ({ ...record, startDate: record.dateKey, endDate: record.dateKey }));

        const groups = [];
        records.forEach((record) => {
            const signature = [record.kind, record.startMinutes ?? '', record.endMinutes ?? '', record.memo].join('|');
            let previous = null;
            for (let index = groups.length - 1; index >= 0; index -= 1) {
                const candidate = groups[index];
                const candidateSignature = [candidate.kind, candidate.startMinutes ?? '', candidate.endMinutes ?? '', candidate.memo].join('|');
                if (candidateSignature === signature) {
                    previous = candidate;
                    break;
                }
            }

            if (previous && addDaysToKey(previous.endDate, 1) === record.dateKey) {
                previous.endDate = record.dateKey;
            } else {
                groups.push({ ...record, startDate: record.dateKey, endDate: record.dateKey });
            }
        });

        return groups.sort((a, b) => {
            if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
            const aOrder = getCalendarKindOrder(a);
            const bOrder = getCalendarKindOrder(b);
            if (aOrder !== bOrder) return aOrder - bOrder;
            return (a.startMinutes ?? -1) - (b.startMinutes ?? -1);
        });
    };

    const calendarOutputGroupToText = (group) => {
        const dateText = formatCalendarDateRange(group.startDate, group.endDate, getEffectiveWeekdayFormat());
        const conditionText = getEntryConditionText(group);
        const memoText = group.memo ? `※${normalizeMemo(group.memo)}` : '';
        return [dateText, conditionText, memoText].filter(Boolean).join(' ');
    };

    const updateUndoButton = () => {
        if (!undoCalBtn) return;
        undoCalBtn.disabled = !lastCalendarAction;
    };

    const setLastCalendarAction = (action) => {
        lastCalendarAction = action;
        updateUndoButton();
    };

    const hideCalendarUndoBar = () => {
        if (calendarUndoTimer) clearTimeout(calendarUndoTimer);
        calendarUndoTimer = null;
        calendarUndoState = null;
        if (calendarUndoBar) calendarUndoBar.hidden = true;
    };

    const showCalendarUndoBar = (entry) => {
        if (!calendarUndoBar || !calendarUndoMessage) return;
        if (calendarUndoTimer) clearTimeout(calendarUndoTimer);
        calendarUndoState = { entry };
        calendarUndoMessage.textContent = `${calendarEntryToText(entry)} を削除しました`;
        calendarUndoBar.hidden = false;
        calendarUndoTimer = setTimeout(hideCalendarUndoBar, 7000);
    };

    const getCalendarConflicts = () => {
        const entriesByDate = new Map();
        calendarEntries.forEach((entry) => {
            if (!isTimedEntry(entry)) return;
            if (!entriesByDate.has(entry.startDate)) entriesByDate.set(entry.startDate, []);
            entriesByDate.get(entry.startDate).push(entry);
        });

        const ids = new Set();
        const messages = [];
        entriesByDate.forEach((entries, dateKey) => {
            for (let firstIndex = 0; firstIndex < entries.length; firstIndex += 1) {
                for (let secondIndex = firstIndex + 1; secondIndex < entries.length; secondIndex += 1) {
                    const first = entries[firstIndex];
                    const second = entries[secondIndex];
                    const firstEnd = first.kind === 'onward' ? Number.POSITIVE_INFINITY : first.endMinutes;
                    const secondEnd = second.kind === 'onward' ? Number.POSITIVE_INFINITY : second.endMinutes;
                    const overlaps = Math.max(first.startMinutes, second.startMinutes) < Math.min(firstEnd, secondEnd);
                    if (!overlaps) continue;
                    ids.add(first.id);
                    ids.add(second.id);
                    messages.push(`${formatDateWithWeekday(dateKey)}：${getEntryConditionText(first)} と ${getEntryConditionText(second)} が重なっています。`);
                }
            }
        });

        return { ids, messages };
    };

    const renderCalendarConflictSummary = (conflictData) => {
        if (!calendarConflictSummary || !calendarConflictList) return;
        calendarConflictList.innerHTML = '';
        if (conflictData.messages.length === 0) {
            calendarConflictSummary.hidden = true;
            return;
        }

        conflictData.messages.forEach((message) => {
            const item = document.createElement('p');
            item.textContent = message;
            calendarConflictList.appendChild(item);
        });
        calendarConflictSummary.hidden = false;
    };

    const updateCalOutput = () => {
        if (outputCal) {
            const groups = getCalendarOutputGroups();
            const prefix = calOutputFormat?.value === 'bullet' ? '・ ' : '';
            outputCal.value = groups.map((group) => `${prefix}${calendarOutputGroupToText(group)}`).join('\n');
        }
        renderCalendarSelectionList();
    };

    const entryCoversCell = (entry, dateKey, minutes) => {
        if (dateKey !== entry.startDate || !isTimedEntry(entry)) return false;
        if (entry.kind === 'onward') return minutes >= entry.startMinutes;
        return minutes >= entry.startMinutes && minutes < entry.endMinutes;
    };

    const getCellState = (dateKey, minutes) => {
        let hasRange = false;
        let hasOnward = false;
        let onwardStart = false;

        calendarEntries.forEach((entry) => {
            if (!entryCoversCell(entry, dateKey, minutes)) return;
            if (entry.kind === 'onward') {
                hasOnward = true;
                if (minutes === entry.startMinutes) onwardStart = true;
            } else {
                hasRange = true;
            }
        });

        return { hasRange, hasOnward, onwardStart };
    };

    const getCalendarDragPreview = () => {
        if (!calendarDrag?.start || !calendarDrag?.end || calendarMode !== 'week') return null;
        const dateKey = calendarDrag.start.dateKey;

        if (calendarSelectionMode === 'onward') {
            return {
                kind: 'onward',
                startDate: dateKey,
                startMinutes: calendarDrag.start.minutes,
                endMinutes: null,
                memo: ''
            };
        }

        const startMinutes = Math.min(calendarDrag.start.minutes, calendarDrag.end.minutes);
        const endMinutes = Math.max(calendarDrag.start.minutes, calendarDrag.end.minutes) + CALENDAR_SLOT_MINUTES;
        return { kind: 'range', startDate: dateKey, startMinutes, endMinutes, memo: '' };
    };

    const refreshCalendarPreview = () => {
        const preview = getCalendarDragPreview();
        document.querySelectorAll('.week-time-cell').forEach((cell) => {
            cell.classList.remove('selection-preview', 'selection-preview-onward');
            if (!preview) return;
            const dateKey = cell.dataset.date;
            const minutes = Number(cell.dataset.minutes);
            if (!entryCoversCell(preview, dateKey, minutes)) return;
            cell.classList.add('selection-preview');
            if (preview.kind === 'onward') cell.classList.add('selection-preview-onward');
        });
    };

    const setCalendarSelectionMode = (selectionMode) => {
        calendarSelectionMode = selectionMode;
        calSelectionRangeBtn?.classList.toggle('active', selectionMode === 'range');
        calSelectionOnwardBtn?.classList.toggle('active', selectionMode === 'onward');
        if (calSelectionGuide) {
            calSelectionGuide.textContent = selectionMode === 'onward'
                ? '開始時刻をクリック。指定した時刻から「以降」として出力します。横方向の一括反映はしません。'
                : '同じ日の列を上から下へドラッグ。30分単位で時間幅を指定できます。横方向には広がりません。';
        }
        refreshCalendarPreview();
    };

    const restoreCalendarEntry = (entry) => {
        if (!entry || calendarEntries.some((existing) => existing.id === entry.id)) return;
        calendarEntries.push(entry);
    };

    const addOrToggleCalendarEntry = (rawEntry) => {
        const entry = createCalendarEntry(rawEntry);
        const signature = entrySignature(entry);
        const duplicateIndex = calendarEntries.findIndex((existing) => entrySignature(existing) === signature);

        if (duplicateIndex >= 0) {
            const [removed] = calendarEntries.splice(duplicateIndex, 1);
            setLastCalendarAction({ type: 'remove', entry: removed });
            showCalendarUndoBar(removed);
        } else {
            calendarEntries.push(entry);
            setLastCalendarAction({ type: 'add', entry });
        }
        calendarEditingId = null;
        updateCalOutput();
        renderCalendar();
    };

    const removeCalendarEntry = (id, { showUndo = true, trackAction = true } = {}) => {
        const index = calendarEntries.findIndex((entry) => entry.id === id);
        if (index < 0) return;
        const [removed] = calendarEntries.splice(index, 1);
        if (trackAction) setLastCalendarAction({ type: 'remove', entry: removed });
        if (showUndo) showCalendarUndoBar(removed);
        if (calendarEditingId === id) calendarEditingId = null;
        updateCalOutput();
        renderCalendar();
    };

    const createEntryKindSelect = (selectedKind) => {
        const select = document.createElement('select');
        [
            ['range', '時間帯'],
            ['onward', '以降'],
            ['allday', '終日'],
            ['morning', '午前'],
            ['afternoon', '午後'],
            ['night', '夜'],
            ['unspecified', '時間未定']
        ].forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            option.selected = value === selectedKind;
            select.appendChild(option);
        });
        select.value = selectedKind;
        return select;
    };

    const createCalendarEntryEditor = (entry) => {
        const editor = document.createElement('div');
        editor.className = 'calendar-entry-editor';

        const typeField = document.createElement('label');
        typeField.className = 'calendar-editor-field';
        typeField.textContent = '条件';
        const typeSelect = createEntryKindSelect(entry.kind);
        typeField.appendChild(typeSelect);

        const timeFields = document.createElement('div');
        timeFields.className = 'calendar-editor-time-fields';

        const startField = document.createElement('label');
        startField.className = 'calendar-editor-field';
        startField.textContent = '開始';
        const startInput = document.createElement('input');
        startInput.type = 'time';
        startInput.step = '1800';
        startInput.value = formatCalendarTime(entry.startMinutes ?? (9 * 60));
        startField.appendChild(startInput);

        const endField = document.createElement('label');
        endField.className = 'calendar-editor-field';
        endField.textContent = '終了';
        const endInput = document.createElement('input');
        endInput.type = 'time';
        endInput.step = '1800';
        endInput.value = formatCalendarTime(entry.endMinutes ?? Math.min((entry.startMinutes ?? (9 * 60)) + 60, CALENDAR_END_MINUTES));
        endField.appendChild(endInput);

        timeFields.append(startField, endField);

        const memoField = document.createElement('label');
        memoField.className = 'calendar-editor-field calendar-editor-memo-field';
        memoField.textContent = 'メモ（任意）';
        const memoInput = document.createElement('input');
        memoInput.type = 'text';
        memoInput.maxLength = 80;
        memoInput.placeholder = '例：オンライン可';
        memoInput.value = entry.memo || '';
        memoField.appendChild(memoInput);

        const error = document.createElement('p');
        error.className = 'calendar-editor-error';
        error.hidden = true;

        const actions = document.createElement('div');
        actions.className = 'calendar-editor-actions';
        const save = document.createElement('button');
        save.type = 'button';
        save.className = 'calendar-editor-save';
        save.textContent = '保存';
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'calendar-editor-cancel';
        cancel.textContent = '閉じる';
        actions.append(save, cancel);

        const updateFields = () => {
            const isRange = typeSelect.value === 'range';
            const isOnward = typeSelect.value === 'onward';
            timeFields.hidden = !(isRange || isOnward);
            endField.hidden = !isRange;
        };

        typeSelect.addEventListener('change', updateFields);
        cancel.addEventListener('click', () => {
            calendarEditingId = null;
            renderCalendarSelectionList();
        });
        save.addEventListener('click', () => {
            const nextKind = typeSelect.value;
            let nextStart = null;
            let nextEnd = null;

            if (CALENDAR_TIMED_KINDS.has(nextKind)) {
                nextStart = timeStringToMinutes(startInput.value);
                if (nextStart === null || nextStart % CALENDAR_SLOT_MINUTES !== 0) {
                    error.textContent = '開始時刻は30分単位で入力してください。';
                    error.hidden = false;
                    return;
                }
            }
            if (nextKind === 'range') {
                nextEnd = timeStringToMinutes(endInput.value);
                if (nextEnd === null || nextEnd % CALENDAR_SLOT_MINUTES !== 0 || nextEnd <= nextStart) {
                    error.textContent = '終了時刻は開始時刻より後にしてください。';
                    error.hidden = false;
                    return;
                }
            }

            calendarEntries = calendarEntries.map((existing) => existing.id === entry.id ? {
                ...existing,
                kind: nextKind,
                startMinutes: nextStart,
                endMinutes: nextEnd,
                memo: normalizeMemo(memoInput.value)
            } : existing);
            calendarEditingId = null;
            hideCalendarUndoBar();
            setLastCalendarAction(null);
            updateCalOutput();
            renderCalendar();
        });

        editor.append(typeField, timeFields, memoField, error, actions);
        updateFields();
        return editor;
    };

    const renderCalendarSelectionList = () => {
        if (!calendarSelectionList) return;
        calendarSelectionList.innerHTML = '';

        const conflictData = getCalendarConflicts();
        renderCalendarConflictSummary(conflictData);
        updateUndoButton();

        if (calendarEntries.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'calendar-selection-empty';
            empty.textContent = 'まだ選択されていません。週表示で時間を選ぶか、月表示で日付の条件を追加してください。';
            calendarSelectionList.appendChild(empty);
            return;
        }

        sortCalendarEntries(calendarEntries).forEach((entry) => {
            const item = document.createElement('div');
            item.className = `calendar-selection-item ${entry.kind}`;
            if (conflictData.ids.has(entry.id)) item.classList.add('has-conflict');

            const main = document.createElement('div');
            main.className = 'calendar-selection-main';
            const date = document.createElement('span');
            date.className = 'calendar-selection-date';
            date.textContent = formatDateWithWeekday(entry.startDate);
            const condition = document.createElement('span');
            condition.className = 'calendar-selection-condition';
            condition.textContent = getEntryConditionText(entry);
            main.append(date, condition);
            if (entry.memo) {
                const memo = document.createElement('span');
                memo.className = 'calendar-selection-memo';
                memo.textContent = getEntryMemoText(entry);
                main.appendChild(memo);
            }
            if (conflictData.ids.has(entry.id)) {
                const warning = document.createElement('span');
                warning.className = 'calendar-selection-warning';
                warning.textContent = '重複';
                main.appendChild(warning);
            }

            const actions = document.createElement('div');
            actions.className = 'calendar-selection-actions';
            const edit = document.createElement('button');
            edit.type = 'button';
            edit.className = 'calendar-selection-edit';
            edit.textContent = calendarEditingId === entry.id ? '編集中' : '編集';
            edit.setAttribute('aria-label', `${calendarEntryToText(entry)}を編集`);
            edit.addEventListener('click', () => {
                calendarEditingId = calendarEditingId === entry.id ? null : entry.id;
                renderCalendarSelectionList();
            });
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'calendar-selection-remove';
            remove.title = 'この選択を削除';
            remove.setAttribute('aria-label', `${calendarEntryToText(entry)}を削除`);
            remove.textContent = '×';
            remove.addEventListener('click', () => removeCalendarEntry(entry.id));
            actions.append(edit, remove);

            item.append(main, actions);
            if (calendarEditingId === entry.id) item.appendChild(createCalendarEntryEditor(entry));
            calendarSelectionList.appendChild(item);
        });
    };

    const renderMonthCalendar = (table, year, month) => {
        const firstDay = new Date(year, month, 1, 12, 0, 0, 0);
        const startDay = new Date(firstDay);
        startDay.setDate(1 - firstDay.getDay());

        const thead = document.createElement('thead');
        thead.innerHTML = '<tr><th>日</th><th>月</th><th>火</th><th>水</th><th>木</th><th>金</th><th>土</th></tr>';
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        const todayKey = formatLocalDateKey(new Date());
        for (let row = 0; row < 6; row += 1) {
            const tr = document.createElement('tr');
            for (let column = 0; column < 7; column += 1) {
                const td = document.createElement('td');
                td.className = 'month-day-cell';
                const dateKey = formatLocalDateKey(startDay);
                const dateEntries = calendarEntries.filter((entry) => entry.startDate === dateKey);
                const hasPresetEntry = dateEntries.some((entry) => CALENDAR_PRESET_KINDS.has(entry.kind));
                const hasTimeEntry = dateEntries.some((entry) => isTimedEntry(entry));

                td.dataset.date = dateKey;
                td.title = dateEntries.length ? dateEntries.map((entry) => calendarEntryToText(entry)).join('\n') : `${formatDateWithWeekday(dateKey)}を選択`;
                td.innerHTML = `<span class="month-day-number">${startDay.getDate()}</span>${hasTimeEntry ? '<span class="month-time-marker" aria-hidden="true"></span>' : ''}${dateEntries.length ? `<span class="month-entry-count" aria-hidden="true">${dateEntries.length}</span>` : ''}`;
                if (startDay.getMonth() !== month) td.classList.add('other');
                if (dateKey === todayKey) td.classList.add('today');
                if (hasPresetEntry) td.classList.add('selected');
                if (hasTimeEntry) td.classList.add('has-time-entry');

                td.addEventListener('click', () => {
                    const kind = calDatePreset?.value || 'unspecified';
                    const existing = calendarEntries.find((entry) => entry.startDate === dateKey && entry.kind === kind && !entry.memo);
                    if (existing) {
                        removeCalendarEntry(existing.id);
                        return;
                    }
                    addOrToggleCalendarEntry({ kind, startDate: dateKey, startMinutes: null, endMinutes: null, memo: '' });
                });

                tr.appendChild(td);
                startDay.setDate(startDay.getDate() + 1);
            }
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
    };

    const renderWeekCalendar = (table) => {
        const startOfWeek = getSundayOfWeek(currentDate);
        const weekDates = [];
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const timeHeader = document.createElement('th');
        timeHeader.className = 'week-time-header';
        timeHeader.textContent = '時刻';
        headerRow.appendChild(timeHeader);

        for (let index = 0; index < 7; index += 1) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + index);
            weekDates.push(date);
            const dateKey = formatLocalDateKey(date);
            const hasEntries = calendarEntries.some((entry) => entry.startDate === dateKey);
            const th = document.createElement('th');
            th.className = index === 0 ? 'weekday-sunday' : index === 6 ? 'weekday-saturday' : '';
            th.innerHTML = `<span class="week-day-date">${date.getMonth() + 1}/${date.getDate()}</span><span class="week-day-name">${CALENDAR_WEEKDAYS[index]}${hasEntries ? '<i class="week-day-marker" aria-label="条件あり"></i>' : ''}</span>`;
            headerRow.appendChild(th);
        }
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        for (let minutes = CALENDAR_START_MINUTES; minutes < CALENDAR_END_MINUTES; minutes += CALENDAR_SLOT_MINUTES) {
            const tr = document.createElement('tr');
            const timeCell = document.createElement('th');
            timeCell.className = 'week-time-label';
            timeCell.textContent = minutes % 60 === 0 ? formatCalendarTime(minutes) : '';
            tr.appendChild(timeCell);

            for (let dayIndex = 0; dayIndex < weekDates.length; dayIndex += 1) {
                const td = document.createElement('td');
                td.className = 'week-time-cell';
                const dateKey = formatLocalDateKey(weekDates[dayIndex]);
                const state = getCellState(dateKey, minutes);
                td.dataset.date = dateKey;
                td.dataset.minutes = String(minutes);
                td.title = `${formatDateWithWeekday(dateKey)} ${formatCalendarTime(minutes)}`;

                if (state.hasRange) td.classList.add('selected-range');
                if (state.hasOnward) td.classList.add('selected-onward');
                if (state.onwardStart) td.classList.add('selected-onward-start');
                if (state.hasRange && state.hasOnward) td.classList.add('selected-overlap');

                td.addEventListener('pointerdown', (event) => {
                    if (event.button !== undefined && event.button !== 0) return;
                    event.preventDefault();
                    calendarDrag = {
                        start: { dateKey, minutes },
                        end: { dateKey, minutes }
                    };
                    refreshCalendarPreview();
                });

                td.addEventListener('pointerenter', () => {
                    if (!calendarDrag || calendarDrag.start.dateKey !== dateKey) return;
                    calendarDrag.end = { dateKey, minutes };
                    refreshCalendarPreview();
                });

                td.addEventListener('pointerup', () => commitCalendarDrag());
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
    };

    const commitCalendarDrag = () => {
        const preview = getCalendarDragPreview();
        if (!preview) return;
        calendarDrag = null;
        addOrToggleCalendarEntry(preview);
    };

    const renderCalendar = () => {
        if (!calendarContainer) return;
        calendarContainer.innerHTML = '';
        calendarContainer.classList.toggle('is-month-view', calendarMode === 'month');
        calendarContainer.classList.toggle('is-week-view', calendarMode === 'week');
        if (calendarTimeToolbar) calendarTimeToolbar.hidden = calendarMode !== 'week';
        if (calendarDateToolbar) calendarDateToolbar.hidden = calendarMode !== 'month';

        const table = document.createElement('table');
        table.className = `calendar-table ${calendarMode === 'week' ? 'calendar-week-table' : 'calendar-month-table'}`;

        if (calendarMode === 'month') {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            if (currentDisplay) currentDisplay.textContent = `${year}年${month + 1}月`;
            renderMonthCalendar(table, year, month);
        } else {
            const start = getSundayOfWeek(currentDate);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            if (currentDisplay) currentDisplay.textContent = `${start.getMonth() + 1}/${start.getDate()}-${end.getMonth() + 1}/${end.getDate()}`;
            renderWeekCalendar(table);
        }

        calendarContainer.appendChild(table);
        refreshCalendarPreview();
    };

    const undoLastCalendarAction = () => {
        if (!lastCalendarAction) return;
        const action = lastCalendarAction;
        lastCalendarAction = null;
        if (action.type === 'add') {
            removeCalendarEntry(action.entry.id, { showUndo: false, trackAction: false });
        } else if (action.type === 'remove') {
            restoreCalendarEntry(action.entry);
            hideCalendarUndoBar();
            updateCalOutput();
            renderCalendar();
        }
        updateUndoButton();
    };

    modeMonthBtn?.addEventListener('click', () => {
        calendarMode = 'month';
        modeMonthBtn.classList.add('active');
        modeWeekBtn?.classList.remove('active');
        calendarDrag = null;
        renderCalendar();
    });

    modeWeekBtn?.addEventListener('click', () => {
        calendarMode = 'week';
        modeWeekBtn.classList.add('active');
        modeMonthBtn?.classList.remove('active');
        calendarDrag = null;
        renderCalendar();
    });

    calSelectionRangeBtn?.addEventListener('click', () => setCalendarSelectionMode('range'));
    calSelectionOnwardBtn?.addEventListener('click', () => setCalendarSelectionMode('onward'));

    calPrevBtn?.addEventListener('click', () => {
        if (calendarMode === 'month') currentDate.setMonth(currentDate.getMonth() - 1);
        else currentDate.setDate(currentDate.getDate() - 7);
        renderCalendar();
    });

    calNextBtn?.addEventListener('click', () => {
        if (calendarMode === 'month') currentDate.setMonth(currentDate.getMonth() + 1);
        else currentDate.setDate(currentDate.getDate() + 7);
        renderCalendar();
    });

    calWeekdayFormat?.addEventListener('change', () => {
        updateCalOutput();
        renderCalendar();
    });

    calOutputFormat?.addEventListener('change', updateCalOutput);
    calMergeConsecutive?.addEventListener('change', updateCalOutput);
    undoCalBtn?.addEventListener('click', undoLastCalendarAction);

    restoreCalBtn?.addEventListener('click', () => {
        if (!calendarUndoState?.entry) return;
        restoreCalendarEntry(calendarUndoState.entry);
        hideCalendarUndoBar();
        setLastCalendarAction(null);
        updateCalOutput();
        renderCalendar();
    });

    copyBtnCal?.addEventListener('click', () => copyToClipboard(outputCal?.value || '', 'msgCal'));

    clearBtnCal?.addEventListener('click', () => {
        calendarEntries = [];
        calendarDrag = null;
        calendarEditingId = null;
        hideCalendarUndoBar();
        setLastCalendarAction(null);
        updateCalOutput();
        renderCalendar();
    });

    document.addEventListener('pointerup', () => {
        if (calendarDrag) commitCalendarDrag();
    });

    setCalendarSelectionMode('range');
    updateCalOutput();
    renderCalendar();



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

    // ==========================================
    // 7. レッズ検索
    // ==========================================
    const redsSearchQuery = document.getElementById('redsSearchQuery');
    const redsDateStart = document.getElementById('redsDateStart');
    const redsDateEnd = document.getElementById('redsDateEnd');
    const redsDateClear = document.getElementById('redsDateClear');
    const redsGoogleBtn = document.getElementById('redsGoogleBtn');
    const redsXBtn = document.getElementById('redsXBtn');

    // 日付クリアボタンの処理
    if (redsDateClear) {
        redsDateClear.addEventListener('click', () => {
            if (redsDateStart) redsDateStart.value = '';
            if (redsDateEnd) redsDateEnd.value = '';
        });
    }

    // クイック日付選択ボタンの処理
    const quickDateBtns = document.querySelectorAll('.quick-date-btn');
    quickDateBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const days = parseInt(btn.getAttribute('data-days'));
            if (isNaN(days)) return; // クリアボタン等は除外

            const now = new Date();
            const start = new Date();
            start.setDate(now.getDate() - days);

            if (redsDateStart) redsDateStart.value = formatDate(start);
            if (redsDateEnd) redsDateEnd.value = formatDate(now);
        });
    });

    // Googleサイト内検索の実行
    if (redsGoogleBtn) {
        redsGoogleBtn.addEventListener('click', () => {
            const query = redsSearchQuery.value.trim();
            if (!query) {
                showMsg('msgReds', 'キーワードを入力してください', true);
                return;
            }

            let fullQuery = `${query} site:urawa-reds.co.jp`;
            
            if (redsDateStart && redsDateStart.value) {
                fullQuery += ` after:${redsDateStart.value}`;
            }
            if (redsDateEnd && redsDateEnd.value) {
                fullQuery += ` before:${redsDateEnd.value}`;
            }

            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(fullQuery)}`;
            window.open(searchUrl, '_blank');
        });
    }

    // X (Twitter) 公式ポスト検索の実行
    if (redsXBtn) {
        redsXBtn.addEventListener('click', () => {
            const query = redsSearchQuery.value.trim();
            if (!query) {
                showMsg('msgReds', 'キーワードを入力してください', true);
                return;
            }

            // 公式アカウントからの投稿に限定
            let xQuery = `${query} from:REDSOFFICIAL`;
            
            if (redsDateStart && redsDateStart.value) {
                xQuery += ` since:${redsDateStart.value}`;
            }
            if (redsDateEnd && redsDateEnd.value) {
                xQuery += ` until:${redsDateEnd.value}`;
            }

            // f=live を付けることで最新タブを表示
            const xUrl = `https://x.com/search?q=${encodeURIComponent(xQuery)}&f=live`;
            window.open(xUrl, '_blank');
        });
    }

    // ==========================================
    // 8. 乱文字生成
    // ==========================================
    const chkUpper = document.getElementById('chkUpper');
    const chkLower = document.getElementById('chkLower');
    const chkNum = document.getElementById('chkNum');
    const chkSymPart = document.getElementById('chkSymPart');
    const chkSymAll = document.getElementById('chkSymAll');
    
    const randomLength = document.getElementById('randomLength');
    const randomCount = document.getElementById('randomCount');
    const outputRandom = document.getElementById('outputRandom');
    
    const generateRandomBtn = document.getElementById('generateRandomBtn');
    const copyBtnRandom = document.getElementById('copyBtnRandom');
    const clearBtnRandom = document.getElementById('clearBtnRandom');

    // 乱文字を1つ生成するヘルパー関数 (より安全な暗号論的疑似乱数を使用)
    const generateSingleRandomString = (length, chars) => {
        let result = '';
        const randomArray = new Uint32Array(length);
        window.crypto.getRandomValues(randomArray);
        for (let i = 0; i < length; i++) {
            result += chars.charAt(randomArray[i] % chars.length);
        }
        return result;
    };

    if (generateRandomBtn) {
        generateRandomBtn.addEventListener('click', () => {
            let chars = '';
            if (chkUpper.checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (chkLower.checked) chars += 'abcdefghijklmnopqrstuvwxyz';
            if (chkNum.checked) chars += '0123456789';
            if (chkSymPart.checked) chars += '-_';
            if (chkSymAll.checked) chars += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

            if (!chars) {
                showMsg('msgRandom', '文字種を1つ以上選択してください', true);
                return;
            }

            const length = parseInt(randomLength.value, 10) || 20;
            let count = parseInt(randomCount.value, 10) || 1;
            if (count > 100) count = 100; // 上限を100に制限
            if (count < 1) count = 1;

            const results = [];
            for (let i = 0; i < count; i++) {
                results.push(generateSingleRandomString(length, chars));
            }

            outputRandom.value = results.join('\n');

            if (count === 1) {
                copyToClipboard(results[0], 'msgRandom');
            } else {
                showMsg('msgRandom', '生成しました！');
            }
        });
    }

    if (copyBtnRandom) {
        copyBtnRandom.addEventListener('click', () => {
            copyToClipboard(outputRandom.value, 'msgRandom');
        });
    }

    if (clearBtnRandom) {
        clearBtnRandom.addEventListener('click', () => {
            outputRandom.value = '';
        });
    }

    // ==========================================
    // 自動実行: 右クリックメニューからの連携 (Side Panel版)
    // ==========================================
    const handlePendingAction = () => {
        chrome.storage.local.get(['pendingAction'], (result) => {
            if (result.pendingAction) {
                const { tabId, text } = result.pendingAction;
                
                switchTab(tabId);

                if (tabId === 'contentLineBreak') {
                    const el = document.getElementById('inputTextLB');
                    if (el && text) {
                        const normalized = normalizeNewlines(text);
                        el.value = normalized;
                        if (outputTextLB) {
                            outputTextLB.value = processLineBreak(normalized);
                        }
                    }
                } else if (tabId === 'contentMarkdown') {
                    const el = document.getElementById('inputMD');
                    if (el && text) {
                        el.innerText = text;
                        el.dispatchEvent(new Event('input'));
                    }
                }
                chrome.storage.local.remove('pendingAction');
            }
        });
    };

    handlePendingAction();

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes.pendingAction && changes.pendingAction.newValue) {
            handlePendingAction();
        }
    });

});