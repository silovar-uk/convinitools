import { copyToClipboard, showMsg } from '../core/ui.js';

export const initRandom = () => {
    // ==========================================
    // 7. 乱文字生成
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
};
