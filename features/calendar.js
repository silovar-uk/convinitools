import { copyToClipboard } from '../core/ui.js';

export const initCalendar = () => {
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
};
