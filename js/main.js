// =============================================
// 主入口模块 - 识字大冒险
// =============================================
// 数据模块:
// - js/data/vocabulary_grade2_2.js  (二年级下词汇)
// - js/data/vocabulary_grade3_1.js  (三年级上词汇)
// - js/data/grade-config.js         (年级配置)
// - js/data/constants.js            (常量: BADGES, ENCOURAGEMENTS 等)
// =============================================

import { fullVocabulary as vocabulary_grade2_2 } from './data/vocabulary_grade2_2.js?v=20260205';
import { fullVocabulary as vocabulary_grade3_1 } from './data/vocabulary_grade3_1.js?v=20260205';
import { GRADE_CONFIG, DEFAULT_GRADE, getGradeList } from './data/grade-config.js';
import { BADGES, ENCOURAGEMENTS, FUN_NICKNAMES, BLIND_BOX_THEMES } from './data/constants.js';

// 年级词汇映射表
const VOCABULARY_DATA = {
    'grade2_2': vocabulary_grade2_2,
    'grade3_1': vocabulary_grade3_1
};

// 当前活动词汇（由 GradeSelector 设置）
let fullVocabulary = VOCABULARY_DATA[DEFAULT_GRADE];


// 获取随机励志语句（带昵称）
function getRandomEncouragement() {
    const template = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
    const nickname = SaveSystem.data.nickname || '小朋友';
    return template.replace('{name}', nickname);
}

// 昵称系统
const NicknameSystem = {
    init: function () {
        const modal = document.getElementById('nickname-modal');
        if (!SaveSystem.data.nickname) {
            modal.style.display = 'flex';
            setTimeout(() => {
                document.getElementById('nickname-input').focus();
            }, 100);
        } else {
            modal.style.display = 'none';
            this.updateDisplay();
        }
    },
    randomNickname: function () {
        const randomName = FUN_NICKNAMES[Math.floor(Math.random() * FUN_NICKNAMES.length)];
        document.getElementById('nickname-input').value = randomName;
    },
    open: function () {
        const modal = document.getElementById('nickname-modal');
        const input = document.getElementById('nickname-input');
        const closeBtn = document.getElementById('nickname-close');
        const saveBtn = document.getElementById('nickname-save-btn');

        input.value = SaveSystem.data.nickname || '';
        closeBtn.style.display = SaveSystem.data.nickname ? 'block' : 'none';
        saveBtn.innerText = SaveSystem.data.nickname ? '确认修改' : '✨ 开始冒险';

        modal.style.display = 'flex';
        setTimeout(() => input.focus(), 100);
    },
    save: function () {
        const input = document.getElementById('nickname-input').value.trim();
        if (!input) {
            Toast.show('请输入昵称哦～ 😊');
            return;
        }
        const isFirstTime = !SaveSystem.data.nickname;
        SaveSystem.data.nickname = input;
        SaveSystem.save();
        document.getElementById('nickname-modal').style.display = 'none';
        this.updateDisplay();
        if (isFirstTime) {
            HomeDashboard.show();
            Toast.show(`🎉 欢迎你，${input}！`);
        } else {
            Toast.show(`✅ 昵称已修改为：${input}`);
            if (document.getElementById('dashboard-modal').style.display === 'flex') {
                Dashboard.open(); // 刷新 Dashboard 显示
            }
        }
    },
    updateDisplay: function () {
        const nickname = SaveSystem.data.nickname || '小朋友';
        document.getElementById('page-title').innerText = `✨ 「${nickname}」的识字大冒险 🎈`;

        const dashName = document.getElementById('user-nickname-dash');
        if (dashName) dashName.innerText = nickname;

        const welcomeName = document.getElementById('welcome-name');
        if (welcomeName) welcomeName.innerText = nickname;

        const mapTitle = document.getElementById('map-modal-title');
        if (mapTitle) mapTitle.innerText = `「${nickname}」的冒险地图`;
        const bookTitle = document.getElementById('book-modal-title');
        if (bookTitle) bookTitle.innerText = `「${nickname}」的错题本`;
    }
};

// ================= 音频引擎 =================
const AudioSys = {
    ctx: null,
    init: function () {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    playTone: function (freq, attack, decay, vol = 0.2) {
        if (!this.ctx) this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + attack);
        gain.gain.exponentialRampToValueAtTime(0.001, now + attack + decay);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(now + attack + decay);
    },
    playClick: function () { this.playTone(800, 0.01, 0.1, 0.1); },
    playMatch: function () {
        setTimeout(() => this.playTone(523.25, 0.02, 0.3, 0.15), 0);
        setTimeout(() => this.playTone(659.25, 0.02, 0.3, 0.15), 80);
        setTimeout(() => this.playTone(783.99, 0.02, 0.4, 0.15), 160);
    },
    playError: function () { this.playTone(150, 0.01, 0.2, 0.2); },
    playWin: function () {
        [523, 659, 783, 1046, 1318].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 0.05, 0.4, 0.15), i * 100);
        });
    },
    playDiceRoll: function () {
        // 摇筛子音效 - 四阶段：启动混乱→极速旋转→最后冲刺→戛然而止（缩短版）
        const melody = [
            // --- 第一阶段：启动与混乱 ---
            { freq: 220.00, time: 0, vol: 0.15 },
            { freq: 310.50, time: 70, vol: 0.12 },
            { freq: 195.00, time: 140, vol: 0.16 },
            { freq: 370.00, time: 210, vol: 0.13 },
            { freq: 240.00, time: 280, vol: 0.15 },
            { freq: 410.00, time: 350, vol: 0.14 },
            { freq: 280.00, time: 420, vol: 0.16 },
            { freq: 350.00, time: 490, vol: 0.13 },
            { freq: 440.00, time: 560, vol: 0.17 },
            { freq: 290.00, time: 630, vol: 0.14 },
            { freq: 480.00, time: 700, vol: 0.18 },

            // --- 第二阶段：极速旋转与紧张爬升 ---
            { freq: 600.00, time: 780, vol: 0.20 },
            { freq: 450.00, time: 840, vol: 0.18 },
            { freq: 650.00, time: 900, vol: 0.20 },
            { freq: 500.00, time: 960, vol: 0.19 },
            { freq: 720.00, time: 1020, vol: 0.21 },
            { freq: 550.00, time: 1080, vol: 0.20 },
            { freq: 780.00, time: 1140, vol: 0.22 },
            { freq: 600.00, time: 1200, vol: 0.20 },
            { freq: 850.00, time: 1260, vol: 0.23 },
            { freq: 680.00, time: 1320, vol: 0.21 },
            { freq: 920.00, time: 1380, vol: 0.24 },
            { freq: 750.00, time: 1440, vol: 0.22 },
            { freq: 980.00, time: 1500, vol: 0.25 },

            // --- 第三阶段：最后冲刺 ---
            { freq: 1100.00, time: 1570, vol: 0.25 },
            { freq: 900.00, time: 1630, vol: 0.24 },
            { freq: 1200.00, time: 1690, vol: 0.26 },
            { freq: 1000.00, time: 1750, vol: 0.25 },
            { freq: 1300.00, time: 1810, vol: 0.26 },
            { freq: 1150.00, time: 1870, vol: 0.26 },
            { freq: 1400.00, time: 1930, vol: 0.27 },
            { freq: 1250.00, time: 1990, vol: 0.27 },
            { freq: 1500.00, time: 2050, vol: 0.28 },

            // --- 第四阶段：戛然而止 ---
            { freq: 100.00, time: 2500, vol: 0.00 }
        ];
        melody.forEach(note => {
            setTimeout(() => this.playTone(note.freq, 0.01, 0.08, note.vol), note.time);
        });
    },
    playAdventure: function () {
        // 悦耳的冒险开启音效 - 上升的和弦
        const melody = [
            { freq: 523.25, time: 0 },     // C5
            { freq: 659.25, time: 150 },   // E5
            { freq: 783.99, time: 300 },   // G5
            { freq: 1046.50, time: 450 },  // C6
        ];
        melody.forEach(note => {
            setTimeout(() => this.playTone(note.freq, 0.05, 0.4, 0.2), note.time);
        });
    },
    playGiftBox: function () {
        // 节日礼物音效 - 三阶段：惊喜→开心→温馨余韵
        const melody = [
            // --- 第一阶段：惊喜 (0s - 0.8s) 快速上升的竖琴效果 ---
            { freq: 392.00, time: 0, vol: 0.10 },  // G4 (低音铺垫)
            { freq: 523.25, time: 100, vol: 0.12 },  // C5
            { freq: 659.25, time: 200, vol: 0.14 },  // E5
            { freq: 783.99, time: 300, vol: 0.16 },  // G5
            { freq: 987.77, time: 400, vol: 0.18 },  // B5 (大七度带来的梦幻感)
            { freq: 1174.66, time: 550, vol: 0.20 },  // D6 (九度带来的高级感)

            // --- 第二阶段：开心 (0.8s - 2.5s) 高潮主音 ---
            { freq: 1046.50, time: 750, vol: 0.22 },  // C6 (高潮，主音回归)

            // --- 第三阶段：温馨余韵 (2.5s - 5.0s) 缓慢的回声 ---
            { freq: 783.99, time: 1800, vol: 0.15 },  // G5 (轻轻的回应)
            { freq: 659.25, time: 2600, vol: 0.10 },  // E5 (温柔的过度)
            { freq: 1046.50, time: 3600, vol: 0.08 },  // C6 (极轻的结尾，像星星闪烁)
            { freq: 523.25, time: 4800, vol: 0.05 },  // C5 (落回根音，安心的感觉)
        ];
        melody.forEach(note => {
            setTimeout(() => this.playTone(note.freq, 0.03, 0.5, note.vol), note.time);
        });
    },
    playDing: function () {
        // 一锤定音的叮音效
        this.playTone(1318.51, 0.01, 0.4, 0.25);  // E6 高音，清脆明亮
    },
    speak: function (text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'zh-CN'; u.rate = 0.9;
            window.speechSynthesis.speak(u);
        } else { alert("您的设备暂不支持朗读功能"); }
    },
    tensionOsc: null,
    playTension: function () {
        if (!this.ctx) this.init();
        if (this.tensionOsc) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        // Create a low pulsing effect
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.5);

        // LFO for tension pulse
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 4; // 4Hz pulse
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 50; // Depth of modulation
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        lfo.start();
        this.tensionOsc = { osc, gain, lfo };
    },
    stopTension: function () {
        if (this.tensionOsc) {
            try {
                const now = this.ctx.currentTime;
                this.tensionOsc.gain.gain.linearRampToValueAtTime(0, now + 0.5);
                this.tensionOsc.osc.stop(now + 0.5);
                this.tensionOsc.lfo.stop(now + 0.5);
            } catch (e) { }
            this.tensionOsc = null;
        }
    }
};

// 通用关闭弹窗并返回首页检测
function closeOverlay(id) {
    document.getElementById(id).style.display = 'none';
    // 检查是否还有其它打开的弹窗
    const otherModals = Array.from(document.querySelectorAll('.modal-overlay')).some(m => m.style.display === 'flex');

    if (Game.active) {
        // 如果游戏进行中，且没有其他弹窗，则恢复计时
        if (!otherModals) {
            Game.resume();
        }
    } else {
        // 如果游戏未进行，则显示首页仪表盘
        HomeDashboard.show();
    }
}

// ================= 存档与逻辑 =================
const SaveSystem = {
    key: 'chinese_game_v11_grade', // 升级版本号
    loadError: '',
    // 默认年级数据结构
    defaultGradeData: {
        maxLevel: 1, levelStars: {}, mistakes: {}, levelRecords: {},
        historyMistakes: {},
        stats: { totalTime: 0, totalWords: [] },
        blindBox: { used: 0, success: 0, lastReset: '', bonus: 0 }
    },
    data: {
        currentGrade: DEFAULT_GRADE, // 当前选中年级
        gradeData: {},              // 各年级独立数据
        // 全局数据（跨年级共享）
        pet: { level: 1, xp: 0, form: 0 },
        globalStats: { loginDays: 1, lastLoginDate: new Date().toDateString(), bossDefeats: 0 },
        badges: [],
        nickname: ''
    },
    // 获取当前年级数据的便捷方法
    get gradeData() {
        return this.data.gradeData[this.data.currentGrade] || this.defaultGradeData;
    },
    // 确保单个年级数据结构完整
    ensureGradeData: function (gradeId) {
        if (!this.data.gradeData) this.data.gradeData = {};
        if (!this.data.gradeData[gradeId]) {
            this.data.gradeData[gradeId] = JSON.parse(JSON.stringify(this.defaultGradeData));
            return;
        }
        const gd = this.data.gradeData[gradeId];
        if (typeof gd.maxLevel !== 'number') gd.maxLevel = 1;
        if (!gd.levelStars) gd.levelStars = {};
        if (!gd.mistakes) gd.mistakes = {};
        if (!gd.levelRecords) gd.levelRecords = {};
        if (!gd.historyMistakes) gd.historyMistakes = {};
        if (!gd.stats) gd.stats = { totalTime: 0, totalWords: [] };
        if (!Array.isArray(gd.stats.totalWords)) gd.stats.totalWords = [];
        if (typeof gd.stats.totalTime !== 'number') gd.stats.totalTime = 0;
        if (!gd.blindBox) gd.blindBox = { used: 0, success: 0, lastReset: '', bonus: 0 };
        if (typeof gd.blindBox.used !== 'number') gd.blindBox.used = 0;
        if (typeof gd.blindBox.success !== 'number') gd.blindBox.success = 0;
        if (typeof gd.blindBox.lastReset !== 'string') gd.blindBox.lastReset = '';
        if (typeof gd.blindBox.bonus !== 'number') gd.blindBox.bonus = 0;
        if (!gd.review || typeof gd.review !== 'object') {
            gd.review = { lastDate: '', todayList: [], todayDone: [], streaks: {}, rewarded: false };
        }
        if (typeof gd.review.lastDate !== 'string') gd.review.lastDate = '';
        if (!Array.isArray(gd.review.todayList)) gd.review.todayList = [];
        if (!Array.isArray(gd.review.todayDone)) gd.review.todayDone = [];
        if (!gd.review.streaks || typeof gd.review.streaks !== 'object') gd.review.streaks = {};
        if (typeof gd.review.rewarded !== 'boolean') gd.review.rewarded = false;
    },
    load: function () {
        const saved = localStorage.getItem(this.key);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.data = { ...this.data, ...parsed };
            } catch (e) {
                console.warn('[SaveSystem] 本地存档损坏，已重置', e);
                this.loadError = '本地存档损坏，已重置为默认设置';
                localStorage.removeItem(this.key);
            }
        }
        // 修正非法年级
        if (!GRADE_CONFIG[this.data.currentGrade]) {
            this.data.currentGrade = DEFAULT_GRADE;
        }
        if (!this.data.gradeData || typeof this.data.gradeData !== 'object') {
            this.data.gradeData = {};
        }
        if (!this.data.globalStats || typeof this.data.globalStats !== 'object') {
            this.data.globalStats = { loginDays: 1, lastLoginDate: new Date().toDateString(), bossDefeats: 0 };
        }
        if (typeof this.data.globalStats.loginDays !== 'number') this.data.globalStats.loginDays = 1;
        if (typeof this.data.globalStats.lastLoginDate !== 'string') this.data.globalStats.lastLoginDate = new Date().toDateString();
        if (typeof this.data.globalStats.bossDefeats !== 'number') this.data.globalStats.bossDefeats = 0;
        if (!this.data.pet || typeof this.data.pet !== 'object') {
            this.data.pet = { level: 1, xp: 0, form: 0 };
        }
        if (typeof this.data.pet.level !== 'number') this.data.pet.level = 1;
        if (typeof this.data.pet.xp !== 'number') this.data.pet.xp = 0;
        if (typeof this.data.pet.form !== 'number') this.data.pet.form = 0;
        if (!Array.isArray(this.data.badges)) this.data.badges = [];
        if (typeof this.data.nickname !== 'string') this.data.nickname = '';
        // 旧版数据迁移（v10 -> v11）
        this.migrateOldData();
        // 确保所有年级数据结构完整
        if (!this.data.gradeData) this.data.gradeData = {};
        Object.keys(this.data.gradeData).forEach((id) => this.ensureGradeData(id));
        this.ensureGradeData(this.data.currentGrade);
        // 切换词汇数据到当前年级
        fullVocabulary = VOCABULARY_DATA[this.data.currentGrade] || VOCABULARY_DATA[DEFAULT_GRADE];
        this.checkDailyLogin();
        this.updateUI();
        if (this.loadError) {
            const msg = this.loadError;
            this.loadError = '';
            setTimeout(() => Toast.show(msg), 600);
        }
    },
    // 旧版数据迁移
    migrateOldData: function () {
        const oldKey = 'chinese_game_v10_final';
        const oldData = localStorage.getItem(oldKey);
        if (oldData && !this.data.gradeData[DEFAULT_GRADE]?.migrated) {
            let old = null;
            try {
                old = JSON.parse(oldData);
            } catch (e) {
                console.warn('[SaveSystem] 旧版存档损坏，跳过迁移', e);
                return;
            }
            // 迁移到默认年级
            this.data.gradeData[DEFAULT_GRADE] = {
                maxLevel: old.maxLevel || 1,
                levelStars: old.levelStars || {},
                mistakes: old.mistakes || {},
                levelRecords: old.levelRecords || {},
                historyMistakes: old.historyMistakes || {},
                stats: { totalTime: old.stats?.totalTime || 0, totalWords: old.stats?.totalWords || [] },
                blindBox: old.blindBox || { used: 0, success: 0, lastReset: '', bonus: 0 },
                migrated: true
            };
            // 迁移全局数据
            this.data.pet = old.pet || this.data.pet;
            this.data.globalStats = {
                loginDays: old.stats?.loginDays || 1,
                lastLoginDate: old.stats?.lastLoginDate || new Date().toDateString(),
                bossDefeats: old.stats?.bossDefeats || 0
            };
            this.data.badges = old.badges || [];
            this.data.nickname = old.nickname || '';
            this.save();
            console.log('[SaveSystem] 旧版数据已迁移至新格式');
        }
    },
    save: function () {
        localStorage.setItem(this.key, JSON.stringify(this.data));
        this.updateUI();
    },
    // 切换年级
    switchGrade: function (gradeId) {
        if (!GRADE_CONFIG[gradeId]) return false;
        this.data.currentGrade = gradeId;
        // 确保目标年级数据存在
        this.ensureGradeData(gradeId);
        // 切换词汇数据
        fullVocabulary = VOCABULARY_DATA[gradeId] || VOCABULARY_DATA[DEFAULT_GRADE];
        this.save();
        return true;
    },
    checkDailyLogin: function () {
        const today = new Date().toDateString();
        if (this.data.globalStats.lastLoginDate !== today) {
            this.data.globalStats.loginDays++;
            this.data.globalStats.lastLoginDate = today;
            // 重置每日盲盒次数（所有年级）
            Object.keys(this.data.gradeData).forEach(g => {
                if (this.data.gradeData[g].blindBox) {
                    this.data.gradeData[g].blindBox.used = 0;
                    this.data.gradeData[g].blindBox.success = 0;
                    this.data.gradeData[g].blindBox.lastReset = today;
                    this.data.gradeData[g].blindBox.bonus = 0;
                }
            });
            setTimeout(() => Toast.show("📅 每日打卡！能量 +20"), 1000);
            PetSystem.addXP(20, false);
        }
    },
    addMistake: function (char) {
        if (!fullVocabulary.some(v => v.char === char)) return;
        const gd = this.data.gradeData[this.data.currentGrade];
        if (!gd.historyMistakes) gd.historyMistakes = {};
        if (!gd.mistakes[char]) gd.mistakes[char] = { count: 0 };
        gd.mistakes[char].count++;
        if (!gd.historyMistakes[char]) gd.historyMistakes[char] = { count: 0 };
        gd.historyMistakes[char].count++;
        this.save();
    },
    removeMistake: function (char) {
        const gd = this.data.gradeData[this.data.currentGrade];
        if (gd.mistakes[char]) {
            delete gd.mistakes[char];
            BadgeSystem.check('cleaner');
            this.save();
        }
    },
    checkNewRecord: function (lvl, time) {
        const gd = this.data.gradeData[this.data.currentGrade];
        const best = gd.levelRecords[lvl];
        if (!best) {
            gd.levelRecords[lvl] = time;
            this.save();
            return false;
        }
        if (time < best) {
            gd.levelRecords[lvl] = time;
            this.save();
            return true;
        }
        return false;
    },
    updateUI: function () {
        const gd = this.data.gradeData[this.data.currentGrade] || this.defaultGradeData;
        const count = Object.keys(gd.mistakes || {}).length;
        const b = document.getElementById('mistake-badge');
        if (b) {
            b.innerText = count;
            b.style.display = count > 0 ? 'inline-block' : 'none';
        }
        // 更新盲盒剩余次数
        const bbRemain = document.getElementById('bb-remain-count');
        if (bbRemain && gd.blindBox) {
            const total = 15 + (gd.blindBox.bonus || 0);
            const remain = Math.max(0, total - gd.blindBox.used);
            bbRemain.innerText = remain;
            const bbTotal = document.getElementById('bb-total-count');
            if (bbTotal) bbTotal.innerText = total;
        }
        // 更新年级显示
        const gradeLabel = document.getElementById('current-grade-label');
        if (gradeLabel && GRADE_CONFIG[this.data.currentGrade]) {
            gradeLabel.innerText = GRADE_CONFIG[this.data.currentGrade].shortName;
        }
        const gradeName = document.getElementById('grade-current-name');
        if (gradeName && GRADE_CONFIG[this.data.currentGrade]) {
            gradeName.innerText = GRADE_CONFIG[this.data.currentGrade].name;
        }
        PetSystem.render();
    }
};

// 年级选择器
const GradeSelector = {
    open: function () {
        const modal = document.getElementById('grade-modal');
        if (!modal) return;
        Game.pause();
        this.render();
        modal.style.display = 'flex';
    },
    close: function (resumeGame = true) {
        const modal = document.getElementById('grade-modal');
        if (modal) modal.style.display = 'none';
        if (resumeGame && Game.active) {
            Game.resume();
        } else if (!Game.active) {
            HomeDashboard.show();
        }
    },
    render: function () {
        const list = document.getElementById('grade-list');
        if (!list) return;
        list.innerHTML = '';
        const grades = getGradeList();
        grades.forEach(g => {
            const isActive = SaveSystem.data.currentGrade === g.id;
            const item = document.createElement('div');
            item.className = `grade-option${isActive ? ' active' : ''}`;
            item.innerHTML = `
                <div class="grade-name">${g.name}</div>
                <div class="grade-tag">${g.shortName}</div>
            `;
            item.onclick = () => {
                this.switchTo(g.id);
            };
            list.appendChild(item);
        });
        const gradeName = document.getElementById('grade-current-name');
        if (gradeName && GRADE_CONFIG[SaveSystem.data.currentGrade]) {
            gradeName.innerText = GRADE_CONFIG[SaveSystem.data.currentGrade].name;
        }
    },
    switchTo: function (gradeId) {
        if (gradeId === SaveSystem.data.currentGrade) {
            this.close();
            return;
        }
        if (!SaveSystem.switchGrade(gradeId)) return;
        this.resetState();
        Game.init();
        HomeDashboard.show();
        ReviewSystem.updateHome();
        this.render();
        this.close(false);
        Toast.show(`已切换到 ${GRADE_CONFIG[gradeId].name}`);
    },
    resetState: function () {
        Game.active = false;
        Game.paused = false;
        Game.sel = null;
        Game.matched = 0;
        Game.pairs = 0;
        Game.isBossMode = false;
        Game.isBlindBoxMode = false;
        Game.blindBoxTimeLimit = null;
        Game.openingBox = false;
        clearInterval(Game.timer);
        AudioSys.stopTension();
        document.body.classList.remove(
            'game-active',
            'boss-mode',
            'blind-box-mode',
            'bb-theme-bunny',
            'bb-theme-cat',
            'bb-theme-frog',
            'bb-theme-penguin',
            'bb-theme-fox',
            'bb-theme-bear',
            'bb-theme-butterfly'
        );
        document.querySelectorAll('.modal-overlay').forEach(m => {
            if (m.id !== 'grade-modal') m.style.display = 'none';
        });
    }
};


const PetSystem = {
    forms: ["🥚", "🐣", "🐥", "🦉", "🎓"],
    addXP: function (amount, showToast = true) {
        SaveSystem.data.pet.xp += amount;
        const needed = SaveSystem.data.pet.level * 100;
        if (SaveSystem.data.pet.xp >= needed) {
            SaveSystem.data.pet.xp -= needed; SaveSystem.data.pet.level++;
            SaveSystem.data.pet.form = Math.min(SaveSystem.data.pet.level - 1, 4);
            Toast.show(`🎉 宠物升级啦！Lv.${SaveSystem.data.pet.level}`);
            BadgeSystem.check('pet_lover');
        }
        SaveSystem.save();
    },
    render: function () {
        const pet = SaveSystem.data.pet;
        const emoji = this.forms[Math.min(pet.form, 4)];
        document.getElementById('pet-avatar-mini').innerText = emoji;
        document.getElementById('pet-avatar-big').innerText = emoji;
        document.getElementById('pet-level-big').innerText = pet.level;
        document.getElementById('xp-needed').innerText = (pet.level * 100) - pet.xp;
    }
};

const BadgeSystem = {
    check: function (type, val) {
        const d = SaveSystem.data;
        const gd = SaveSystem.gradeData;
        let id = null;
        if (type === 'first_win' && gd.maxLevel > 1) id = 'first_win';
        if (type === 'speedster' && val < 1.5) id = 'speedster';
        if (type === 'scholar' && gd.stats.totalWords.length >= 50) id = 'scholar';
        if (type === 'persistent' && d.globalStats.loginDays >= 3) id = 'persistent';
        if (type === 'cleaner') id = 'cleaner';
        if (type === 'pet_lover' && d.pet.level >= 3) id = 'pet_lover';
        if (type === 'boss_killer' && d.globalStats.bossDefeats >= 1) id = 'boss_killer';
        if (id && !d.badges.includes(id)) {
            d.badges.push(id);
            const info = BADGES.find(b => b.id === id);
            setTimeout(() => Toast.show(`🏆 解锁勋章：${info.name}`), 500);
            SaveSystem.save();
        }
    }
};

const MistakeBook = {
    cur: null,
    mode: 'current', // 'current' or 'history'
    switchMode: function (m) {
        this.mode = m;
        // 更新 Tab 样式
        document.querySelectorAll('.book-tab').forEach(el => {
            if (el.dataset.mode === m) {
                el.classList.add('active');
                el.style.background = '#FF8BA7';
                el.style.color = '#fff';
            } else {
                el.classList.remove('active');
                el.style.background = '#f0f0f0';
                el.style.color = '#666';
            }
        });
        this.open();
    },
    open: function () {
        Game.pause();
        document.getElementById('book-modal').style.display = 'flex';

        // 初始化 Tab 样式（如果是第一次打开）
        if (!document.querySelector('.book-tab.active')) {
            this.switchMode('current');
            return;
        }

        const list = document.getElementById('mistake-list'); list.innerHTML = '';

        // 根据模式选择数据源
        const gd = SaveSystem.gradeData;
        const source = this.mode === 'current' ? gd.mistakes : gd.historyMistakes;
        // 兼容：如果 historyMistakes 不存在（旧存档），即为空
        const m = source || {};

        // 清理异常 key（比如误记的非汉字项）
        let cleaned = false;
        Object.keys(m).forEach(k => {
            if (!fullVocabulary.some(v => v.char === k)) {
                delete m[k];
                cleaned = true;
            }
        });
        if (cleaned) SaveSystem.save();

        const keys = Object.keys(m)
            .filter(k => fullVocabulary.some(v => v.char === k))
            .sort((a, b) => m[b].count - m[a].count);

        const emptyMsg = document.getElementById('book-empty-msg');
        if (keys.length === 0) {
            emptyMsg.style.display = 'block';
            emptyMsg.innerText = this.mode === 'current' ? '太棒了！当前没有错题哦～' : '还没有历史错题记录呢～';
        } else {
            emptyMsg.style.display = 'none';

            // 防止打开时立即误触
            let clickEnabled = false;
            setTimeout(() => { clickEnabled = true; }, 300);

            keys.forEach(k => {
                const d = document.createElement('div');
                d.className = 'mistake-card';

                // 历史模式下显示累计标记
                const countTag = this.mode === 'history' ? '累计' : '';

                d.innerHTML = `
                    <div class="mistake-inner">
                        <div class="mistake-char">${k}</div>
                        <div class="mistake-count">${countTag}错${m[k].count}次</div>
                        <div class="mistake-audio">
                            <button class="mistake-audio-btn record" data-action="record" data-char="${k}" title="录音">🎤</button>
                            <button class="mistake-audio-btn play disabled" data-action="play" data-char="${k}" title="播放">🔊</button>
                        </div>
                    </div>`;
                // 改用onclick防止滑动误触
                d.onclick = () => {
                    if (!clickEnabled) return;
                    this.detail(k);
                };
                const recordBtn = d.querySelector('.mistake-audio-btn.record');
                const playBtn = d.querySelector('.mistake-audio-btn.play');
                if (recordBtn) {
                    recordBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (!clickEnabled) return;
                        RecordSystem.toggleRecord(k);
                    };
                }
                if (playBtn) {
                    playBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (!clickEnabled) return;
                        RecordSystem.play(k);
                    };
                }
                list.appendChild(d);
                RecordSystem.ensureStatus(k);
            });
        }
    },
    detail: function (char) {
        this.cur = char;
        const d = fullVocabulary.find(v => v.char === char) || { char, pinyin: '?', words: [], desc: '暂无' };
        document.getElementById('card-char').innerText = d.char;
        document.getElementById('card-pinyin').innerText = d.pinyin;
        document.getElementById('card-words').innerText = d.words ? d.words.join('，') : '暂无';
        document.getElementById('card-desc').innerText = d.desc || '暂无';
        RecordSystem.bindDetail(d.char);

        // 根据模式调整按钮文字
        const actionBtn = document.getElementById('mistake-action-btn');
        if (this.mode === 'history') {
            actionBtn.innerText = '练习一下';
        } else {
            actionBtn.innerText = '我学会了';
        }

        document.getElementById('detail-modal').style.display = 'flex';
    },
    resolveCurrent: function () {
        if (this.cur) {
            if (this.mode === 'current') {
                MiniQuiz.open(this.cur);
                return;
            } else {
                // 历史模式下只是练习，不删除
                Toast.show('温故而知新，你真棒！');
                document.getElementById('detail-modal').style.display = 'none';
                // 刷新列表时保持当前模式
                this.open();
                AudioSys.playWin();
            }
        }
    }
};

// 录音朗读系统（IndexedDB）
const RecordSystem = {
    db: null,
    ready: null,
    cache: new Map(),
    recording: null,
    playing: null,
    init: function () {
        if (this.ready) return this.ready;
        this.ready = new Promise((resolve, reject) => {
            if (!('indexedDB' in window)) {
                reject(new Error('当前浏览器不支持录音存储'));
                return;
            }
            const req = indexedDB.open('ai_teacher_recordings', 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('recordings')) {
                    db.createObjectStore('recordings', { keyPath: 'key' });
                }
            };
            req.onsuccess = () => {
                this.db = req.result;
                resolve(this.db);
            };
            req.onerror = () => reject(req.error);
        });
        return this.ready;
    },
    makeKey: function (char) {
        const grade = SaveSystem.data.currentGrade || 'grade';
        return `${grade}:${char}`;
    },
    getStore: function (mode = 'readonly') {
        const tx = this.db.transaction('recordings', mode);
        return tx.objectStore('recordings');
    },
    getRecording: async function (char) {
        const key = this.makeKey(char);
        await this.init();
        return new Promise((resolve) => {
            const store = this.getStore('readonly');
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result?.blob || null);
            req.onerror = () => resolve(null);
        });
    },
    hasRecording: async function (char) {
        const key = this.makeKey(char);
        if (this.cache.has(key)) return this.cache.get(key);
        const blob = await this.getRecording(char);
        const exists = !!blob;
        this.cache.set(key, exists);
        return exists;
    },
    saveRecording: async function (char, blob) {
        const key = this.makeKey(char);
        await this.init();
        return new Promise((resolve) => {
            const store = this.getStore('readwrite');
            const req = store.put({ key, blob, updatedAt: Date.now() });
            req.onsuccess = () => {
                this.cache.set(key, true);
                resolve(true);
            };
            req.onerror = () => resolve(false);
        });
    },
    ensureStatus: async function (char) {
        try {
            await this.hasRecording(char);
        } catch (e) { }
        this.refreshButtons();
    },
    refreshButtons: function () {
        const recordingChar = this.recording?.char || null;
        const playingChar = this.playing?.char || null;
        document.querySelectorAll('.mistake-audio-btn').forEach(btn => {
            const char = btn.dataset.char;
            const key = this.makeKey(char);
            const exists = this.cache.get(key) || false;
            if (btn.dataset.action === 'record') {
                const isRec = recordingChar === char;
                btn.classList.toggle('recording', isRec);
                btn.classList.toggle('disabled', recordingChar && !isRec);
                btn.innerText = isRec ? '⏺️' : '🎤';
            } else if (btn.dataset.action === 'play') {
                const isPlaying = playingChar === char;
                const disabled = !exists || !!recordingChar;
                btn.classList.toggle('disabled', disabled);
                btn.classList.toggle('playing', isPlaying);
                btn.innerText = isPlaying ? '⏸️' : '🔊';
            }
        });
        const detailRecord = document.getElementById('detail-record-btn');
        const detailPlay = document.getElementById('detail-play-btn');
        const detailTimer = document.getElementById('detail-record-timer');
        if (detailRecord && detailPlay) {
            const char = detailRecord.dataset.char;
            const key = char ? this.makeKey(char) : null;
            const exists = key ? (this.cache.get(key) || false) : false;
            const isRec = recordingChar && char && recordingChar === char;
            const isPlaying = playingChar && char && playingChar === char;
            detailRecord.classList.toggle('recording', !!isRec);
            detailRecord.classList.toggle('disabled', !!recordingChar && !isRec);
            detailRecord.innerText = isRec ? '⏺️ 录音中' : '🎤 录音';
            detailPlay.classList.toggle('disabled', !exists || !!recordingChar);
            detailPlay.classList.toggle('playing', !!isPlaying);
            detailPlay.innerText = isPlaying ? '⏸️ 播放中' : '🔊 播放';
            if (detailTimer) {
                detailTimer.style.opacity = isRec ? '1' : '0.6';
            }
        }
    },
    toggleRecord: async function (char) {
        if (this.recording && this.recording.char === char) {
            this.stopRecording();
            return;
        }
        if (this.recording) {
            Toast.show('正在录音中，请稍等～');
            return;
        }
        await this.startRecording(char);
    },
    startRecording: async function (char) {
        if (!navigator.mediaDevices?.getUserMedia) {
            Toast.show('当前设备不支持录音');
            return;
        }
        try {
            await this.init();
            if (this.playing) this.stopPlaying();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];
            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
            };
            recorder.onstop = async () => {
                if (this.recording?.countTimer) clearInterval(this.recording.countTimer);
                const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
                stream.getTracks().forEach(t => t.stop());
                this.recording = null;
                await this.saveRecording(char, blob);
                Toast.show('录音完成');
                this.refreshButtons();
            };
            recorder.start();
        this.recording = {
            char,
            recorder,
            stream,
            timer: setTimeout(() => this.stopRecording(), 3000),
            countdown: 3.0
        };
        Toast.show('开始录音（3 秒）');
        this.startCountdown();
        this.refreshButtons();
        } catch (e) {
            Toast.show('录音失败，请允许麦克风权限');
            this.recording = null;
            this.refreshButtons();
        }
    },
    stopRecording: function () {
        if (!this.recording) return;
        clearTimeout(this.recording.timer);
        if (this.recording.countTimer) clearInterval(this.recording.countTimer);
        try {
            this.recording.recorder.stop();
        } catch (e) { }
    },
    play: async function (char) {
        if (this.recording) {
            Toast.show('录音中，稍后再播');
            return;
        }
        if (this.playing && this.playing.char === char) {
            this.stopPlaying();
            return;
        }
        if (this.playing) this.stopPlaying();
        const blob = await this.getRecording(char);
        if (!blob) {
            Toast.show('暂无录音');
            return;
        }
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        this.playing = { char, audio, url };
        audio.onended = () => this.stopPlaying();
        audio.onerror = () => this.stopPlaying();
        audio.play();
        this.refreshButtons();
    },
    stopPlaying: function () {
        if (!this.playing) return;
        try {
            this.playing.audio.pause();
        } catch (e) { }
        URL.revokeObjectURL(this.playing.url);
        this.playing = null;
        this.refreshButtons();
    },
    startCountdown: function () {
        if (!this.recording) return;
        const update = () => {
            if (!this.recording) return;
            const el = document.getElementById('detail-record-timer');
            if (el) el.innerText = `${this.recording.countdown.toFixed(1)}s`;
        };
        update();
        this.recording.countTimer = setInterval(() => {
            if (!this.recording) return;
            this.recording.countdown = Math.max(0, this.recording.countdown - 0.1);
            update();
        }, 100);
    },
    bindDetail: function (char) {
        const recordBtn = document.getElementById('detail-record-btn');
        const playBtn = document.getElementById('detail-play-btn');
        const timer = document.getElementById('detail-record-timer');
        if (!recordBtn || !playBtn) return;
        recordBtn.dataset.char = char;
        playBtn.dataset.char = char;
        if (timer) timer.innerText = '3.0s';
        recordBtn.onclick = () => this.toggleRecord(char);
        playBtn.onclick = () => this.play(char);
        this.ensureStatus(char);
    }
};

// 今日必练系统
const ReviewSystem = {
    getTodayKey: function () {
        return new Date().toDateString();
    },
    ensureTodayList: function () {
        const gd = SaveSystem.gradeData;
        if (!gd.review) gd.review = { lastDate: '', todayList: [], todayDone: [], streaks: {} };
        const today = this.getTodayKey();
        if (gd.review.lastDate !== today) {
            gd.review.lastDate = today;
            gd.review.todayList = this.generateTodayList(gd);
            gd.review.todayDone = [];
            gd.review.rewarded = false;
            SaveSystem.save();
        }
        return gd.review.todayList || [];
    },
    generateTodayList: function (gd) {
        const counts = {};
        Object.entries(gd.mistakes || {}).forEach(([char, info]) => {
            if (!fullVocabulary.some(v => v.char === char)) return;
            counts[char] = (counts[char] || 0) + (info.count || 1) * 3;
        });
        Object.entries(gd.historyMistakes || {}).forEach(([char, info]) => {
            if (!fullVocabulary.some(v => v.char === char)) return;
            counts[char] = (counts[char] || 0) + (info.count || 1);
        });
        const list = Object.keys(counts)
            .sort((a, b) => counts[b] - counts[a])
            .slice(0, 5);
        return list;
    },
    markDone: function (char, shouldSave = true) {
        const gd = SaveSystem.gradeData;
        if (!gd.review) return;
        if (!gd.review.todayDone.includes(char)) {
            gd.review.todayDone.push(char);
            if (shouldSave) SaveSystem.save();
        }
        this.updateHome();
    },
    updateHome: function () {
        const list = this.ensureTodayList();
        const gd = SaveSystem.gradeData;
        const container = document.getElementById('daily-review-list');
        const totalEl = document.getElementById('daily-review-total');
        const doneEl = document.getElementById('daily-review-done');
        if (totalEl) totalEl.innerText = list.length;
        if (doneEl) doneEl.innerText = (gd.review?.todayDone || []).filter(c => list.includes(c)).length;
        if (!container) return;
        container.innerHTML = '';
        if (list.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'daily-review-empty';
            empty.innerText = '今天没有错题，继续保持哦～';
            container.appendChild(empty);
            return;
        }
        list.forEach(char => {
            const chip = document.createElement('div');
            chip.className = 'daily-review-chip';
            if (gd.review?.todayDone?.includes(char)) chip.classList.add('done');
            chip.innerText = char;
            chip.onclick = () => {
                MiniQuiz.openFromDaily(char);
            };
            container.appendChild(chip);
        });
    },
    checkDailyReward: function () {
        const gd = SaveSystem.gradeData;
        if (!gd.review) return;
        const list = this.ensureTodayList();
        if (list.length === 0) return;
        const doneCount = (gd.review.todayDone || []).filter(c => list.includes(c)).length;
        if (doneCount >= list.length && !gd.review.rewarded) {
            gd.review.rewarded = true;
            SaveSystem.save();
            const modal = document.getElementById('daily-reward-modal');
            if (modal) {
                modal.style.display = 'flex';
                AudioSys.playWin();
                setTimeout(() => {
                    if (modal.style.display === 'flex') modal.style.display = 'none';
                }, 2500);
            }
        }
    }
};

// 复习小关卡：四选一拼音
const MiniQuiz = {
    active: false,
    timer: null,
    timeLimit: 8,
    startAt: 0,
    target: null,
    returnToDetail: false,
    returnToHome: false,
    retriesLeft: 0,
    open: function (char) {
        const word = fullVocabulary.find(v => v.char === char);
        if (!word) {
            Toast.show('题库中找不到这个字');
            return;
        }
        this.target = word;
        this.active = true;
        this.retriesLeft = 1;
        this.returnToDetail = document.getElementById('detail-modal').style.display === 'flex';
        if (this.returnToDetail) {
            document.getElementById('detail-modal').style.display = 'none';
        }
        this.returnToHome = false;
        Game.pause();
        this.renderOptions(word);
        const card = document.querySelector('#review-quiz-modal .review-quiz-card');
        if (card) card.classList.remove('shake', 'success');
        document.getElementById('review-char').innerText = word.char;
        document.getElementById('review-quiz-modal').style.display = 'flex';
        this.startTimer();
    },
    openFromDaily: function (char) {
        this.open(char);
        this.returnToHome = true;
        this.returnToDetail = false;
    },
    renderOptions: function (word) {
        const positions = ['top', 'right', 'bottom', 'left'];
        const correct = word.pinyin;
        const pool = fullVocabulary.filter(v => v.pinyin && v.pinyin !== correct);
        const shuffled = pool.sort(() => Math.random() - 0.5);
        const distractors = [];
        const used = new Set();
        for (const v of shuffled) {
            if (!used.has(v.pinyin)) {
                distractors.push(v.pinyin);
                used.add(v.pinyin);
            }
            if (distractors.length >= 3) break;
        }
        while (distractors.length < 3) {
            if (shuffled.length === 0) {
                distractors.push('？');
            } else {
                distractors.push(shuffled[Math.floor(Math.random() * shuffled.length)].pinyin);
            }
        }
        const options = [correct, ...distractors].sort(() => Math.random() - 0.5);
        positions.forEach((pos, idx) => {
            const el = document.getElementById(`review-opt-${pos}`);
            if (!el) return;
            el.classList.remove('correct', 'wrong', 'disabled', 'bubble-pop-active');
            el.innerText = options[idx];
            el.dataset.pinyin = options[idx];
            el.onclick = () => this.choose(el);
            el.disabled = false;
        });
        this.setOptionsDisabled(false);
    },
    startTimer: function () {
        clearInterval(this.timer);
        this.startAt = Date.now();
        this.active = true;
        const tEl = document.getElementById('review-timer');
        tEl.innerText = this.timeLimit.toFixed(1);
        this.timer = setInterval(() => {
            if (!this.active) return;
            const elapsed = (Date.now() - this.startAt) / 1000;
            const remaining = Math.max(0, this.timeLimit - elapsed);
            tEl.innerText = remaining.toFixed(1);
            if (remaining <= 0) {
                this.fail('时间到啦');
            }
        }, 100);
    },
    choose: function (el) {
        if (!this.active || !el) return;
        this.active = false;
        clearInterval(this.timer);
        this.setOptionsDisabled(true);
        el.classList.remove('bubble-pop-active');
        void el.offsetWidth;
        el.classList.add('bubble-pop-active');
        const chosen = el.dataset.pinyin;
        const correct = this.target?.pinyin;
        if (chosen === correct) {
            el.classList.add('correct');
            this.success();
        } else {
            el.classList.add('wrong');
            this.fail('还差一点点');
        }
    },
    success: function () {
        const card = document.querySelector('#review-quiz-modal .review-quiz-card');
        if (card) {
            card.classList.remove('shake');
            card.classList.add('success');
            setTimeout(() => card.classList.remove('success'), 700);
        }
        for (let i = 0; i < 4; i++) {
            setTimeout(() => Particles.spawn(window.innerWidth / 2, window.innerHeight / 2), i * 150);
        }
        setTimeout(() => {
            const gd = SaveSystem.gradeData;
            if (!gd.review) gd.review = { lastDate: '', todayList: [], todayDone: [], streaks: {} };
            const char = this.target.char;
            const prev = gd.review.streaks[char] || 0;
            gd.review.streaks[char] = prev + 1;
            ReviewSystem.markDone(char, false);

            const mastered = gd.review.streaks[char] >= 2;
            if (mastered) {
                delete gd.review.streaks[char];
                SaveSystem.removeMistake(char);
                const bb = SaveSystem.gradeData.blindBox;
                if (bb) {
                    bb.bonus = (bb.bonus || 0) + 1;
                    SaveSystem.save();
                }
                Toast.show('连续答对 2 次，真正学会啦！盲盒次数 +1');
            } else {
                SaveSystem.save();
                Toast.show(`连续正确 ${gd.review.streaks[char]}/2`);
            }
            AudioSys.playWin();
            const goHome = this.returnToHome;
            this.close(false);
            this.target = null;
            if (goHome) {
                HomeDashboard.show();
            } else {
                MistakeBook.open();
            }
            ReviewSystem.checkDailyReward();
        }, 500);
    },
    fail: function (msg) {
        const card = document.querySelector('#review-quiz-modal .review-quiz-card');
        if (card) {
            card.classList.remove('success');
            card.classList.add('shake');
            setTimeout(() => card.classList.remove('shake'), 500);
        }
        AudioSys.playError();
        clearInterval(this.timer);
        this.active = false;
        this.setOptionsDisabled(true);
        const gd = SaveSystem.gradeData;
        if (gd.review && this.target) {
            gd.review.streaks[this.target.char] = 0;
            SaveSystem.save();
        }
        if (this.retriesLeft > 0) {
            this.retriesLeft -= 1;
            Toast.show(`${msg}，再给一次机会！`);
            setTimeout(() => {
                if (!this.target) return;
                this.renderOptions(this.target);
                this.startTimer();
            }, 650);
            return;
        }
        Toast.show(`${msg}，下次再来～`);
        this.close(true);
        this.target = null;
    },
    close: function (keepDetail) {
        this.active = false;
        clearInterval(this.timer);
        const modal = document.getElementById('review-quiz-modal');
        if (modal) modal.style.display = 'none';
        if (keepDetail && this.returnToDetail) {
            document.getElementById('detail-modal').style.display = 'flex';
        }
        this.returnToDetail = false;
        this.returnToHome = false;
        const otherModals = Array.from(document.querySelectorAll('.modal-overlay')).some(m => m.style.display === 'flex');
        if (Game.active && !otherModals) {
            Game.resume();
        }
    },
    setOptionsDisabled: function (disabled) {
        document.querySelectorAll('.review-option').forEach(btn => {
            if (disabled) btn.classList.add('disabled');
            else btn.classList.remove('disabled');
            btn.disabled = disabled;
        });
    }
};

const HomeDashboard = {
    quotes: ["今天学什么呢？", "每一个字都是一个小秘密哦！", "你进步得真快！", "休息一下，喝口水吧～", "我们一起去大冒险吧！", "识字真有趣，对吧？", "你是最棒的小学生！"],
    update: function () {
        const gd = SaveSystem.gradeData;
        const s = gd.stats;
        NicknameSystem.updateDisplay();

        // 动态计算进度
        const totalLvls = Game.config.length || 1;
        const progress = Math.min(100, Math.floor(((gd.maxLevel - 1) / totalLvls) * 100));
        document.getElementById('h-stat-progress').innerText = progress + '%';

        document.getElementById('h-stat-words').innerText = s.totalWords.length;
        document.getElementById('h-stat-mistakes').innerText = Object.keys(gd.mistakes).length;
        document.getElementById('h-stat-days').innerText = SaveSystem.data.globalStats.loginDays;
        document.getElementById('h-stat-time').innerText = Math.floor(s.totalTime / 60);

        const avg = s.totalWords.length > 0 ? (s.totalTime / s.totalWords.length).toFixed(1) : '-';
        document.getElementById('h-stat-speed').innerText = avg === '-' ? '-' : avg + 's';
        document.getElementById('level-title').innerText = `第${gd.maxLevel}关`;

        // 更新首页等级显示
        const homeLvl = document.getElementById('home-lvl-num');
        if (homeLvl) homeLvl.innerText = SaveSystem.data.pet.level;

        // 更新 IP 形象（根据宠物等级/形态）
        const pet = SaveSystem.data.pet;
        document.getElementById('pet-home-avatar').innerText = PetSystem.forms[pet.form];

        ReviewSystem.updateHome();
    },
    toggleStats: function () {
        const grid = document.getElementById('home-stats-grid');
        const btn = document.getElementById('stats-toggle');
        const isExp = grid.classList.toggle('expanded');
        btn.innerText = isExp ? '🔼 收起成长纪录' : '📊 查看我的成长纪录';
        AudioSys.playClick();
    },
    interact: function () {
        const pet = document.getElementById('pet-home-avatar');
        const shadow = document.getElementById('pet-home-shadow');
        const bubble = document.getElementById('pet-speech');

        // 跳跃动作与阴影配合
        pet.classList.remove('pet-jump');
        shadow.classList.remove('pet-jumping-shadow');
        void pet.offsetWidth;
        pet.classList.add('pet-jump');
        shadow.classList.add('pet-jumping-shadow');

        // 随机说话
        bubble.innerText = this.quotes[Math.floor(Math.random() * this.quotes.length)];
        bubble.classList.add('active');

        AudioSys.playMatch();

        if (this.speechTimer) clearTimeout(this.speechTimer);
        this.speechTimer = setTimeout(() => {
            bubble.classList.remove('active');
            shadow.classList.remove('pet-jumping-shadow');
        }, 2500);
    },
    show: function () {
        this.update();
        document.getElementById('home-dashboard').style.display = 'flex';
        document.getElementById('game-board').style.display = 'none';
        document.body.classList.remove('game-active');
    },
    hide: function () {
        document.getElementById('home-dashboard').style.display = 'none';
        document.getElementById('game-board').style.display = 'grid';
    }
};

const Dashboard = {
    open: function () {
        const gd = SaveSystem.gradeData;
        const s = gd.stats;
        document.getElementById('stat-days').innerText = SaveSystem.data.globalStats.loginDays;
        document.getElementById('stat-words').innerText = s.totalWords.length;
        document.getElementById('stat-time').innerText = Math.floor(s.totalTime / 60);
        const avg = s.totalWords.length > 0 ? (s.totalTime / s.totalWords.length).toFixed(1) : '-';
        document.getElementById('stat-speed').innerText = avg;
        const badgeList = document.getElementById('badge-list'); badgeList.innerHTML = '';
        BADGES.forEach(b => {
            const unlocked = SaveSystem.data.badges.includes(b.id);
            const d = document.createElement('div');
            d.className = `badge-item ${unlocked ? 'unlocked' : ''}`;

            let iconHTML = b.icon;
            // Special display for Boss Killer badge
            if (b.id === 'boss_killer' && unlocked) {
                const kills = SaveSystem.data.globalStats.bossDefeats || 0;
                iconHTML += `<div style="font-size:0.6rem; position:absolute; bottom:-5px; right:-5px; background:#FF4757; color:#fff; border-radius:10px; padding:2px 5px; font-weight:bold;">x${kills}</div>`;
            }

            d.innerHTML = iconHTML;
            d.style.position = 'relative'; // For positioning the counter
            d.onpointerdown = () => { if (unlocked) Toast.show(`${b.icon} ${b.name} ${b.id === 'boss_killer' ? `(击败 ${SaveSystem.data.globalStats.bossDefeats} 次)` : ''}`); };
            badgeList.appendChild(d);
        });
        document.getElementById('dashboard-modal').style.display = 'flex';
    }
};

const Game = {
    curr: 1, active: false, sel: null, matched: 0, config: [], startT: 0, timer: null, pairs: 0,
    paused: false, pauseT: 0, isBossMode: false, isBlindBoxBoss: false, bossTimeLimit: 20,
    blindBoxBoardTheme: null,
    pause: function () {
        if (!this.active || this.paused) return;
        this.paused = true;
        this.pauseT = Date.now();
    },
    resume: function () {
        if (!this.active || !this.paused) return;
        this.startT += (Date.now() - this.pauseT);
        this.paused = false;
    },
    openBlindBox: function () {
        if (this.openingBox) return;

        const gd = SaveSystem.gradeData;
        // 检查次数限制
        const bonus = gd.blindBox?.bonus || 0;
        if (gd.blindBox.used >= 15 + bonus) {
            Toast.show('今日盲盒机会已用完啦，明天再来吧！🌟');
            return;
        }

        // 开发调试：暂不限制盲盒关卡解锁

        this.openingBox = true;
        AudioSys.playClick();

        // 直接进入简化的盲盒选择界面
        this.showBlindBoxChallenge();
    },

    showBlindBoxChallenge: function () {
        // 创建抽倒计时弹窗
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center; z-index: 300;';

        const card = document.createElement('div');
        card.className = 'card';
        card.style.cssText = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; text-align: center; max-width: 380px; color: #fff; animation: popIn 0.3s ease; position: relative; overflow: hidden;';

        card.innerHTML = `
                    <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); animation: float 6s ease-in-out infinite;"></div>
                    <div style="position: absolute; top: 10%; left: 10%; width: 20px; height: 20px; background: rgba(255,255,255,0.3); border-radius: 50%; animation: sparkle 2s ease-in-out infinite;"></div>
                    <div style="position: absolute; top: 20%; right: 15%; width: 15px; height: 15px; background: rgba(255,255,255,0.4); border-radius: 50%; animation: sparkle 2.5s ease-in-out infinite 0.5s;"></div>
                    <div style="position: absolute; bottom: 25%; left: 20%; width: 12px; height: 12px; background: rgba(255,255,255,0.2); border-radius: 50%; animation: sparkle 3s ease-in-out infinite 1s;"></div>
                    <div style="position: relative; z-index: 2;">
                        <div style="font-size: 4rem; margin-bottom: 20px; animation: bounce 2s infinite, rotate 4s linear infinite; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)); transform-origin: center;">🎲</div>
                        <h2 style="margin-bottom: 15px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 1.4rem; letter-spacing: 1px; animation: glow 3s ease-in-out infinite;">摇出你的挑战时间</h2>
                        <p style="color: rgba(255,255,255,0.85); margin-bottom: 25px; line-height: 1.5; font-size: 0.95rem; padding: 0 10px; animation: pulse 2s ease-in-out infinite;">
                            ✨ 看手气！系统将随机分配挑战时间 ✨
                        </p>
                        <div id="countdown-roulette" style="background: rgba(255,255,255,0.15); padding: 25px; border-radius: 20px; margin-bottom: 25px; backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.2); box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 8px 32px rgba(0,0,0,0.2); animation: breathe 3s ease-in-out infinite;">
                            <div style="font-size: 3rem; font-weight: 900; color: #fff; text-shadow: 0 3px 6px rgba(0,0,0,0.4); margin-bottom: 8px; animation: numberPulse 1.5s ease-in-out infinite;" id="roulette-display">?</div>
                            <div style="font-size: 0.9rem; color: rgba(255,255,255,0.8); font-weight: 600;" id="roulette-status">准备摇筛子</div>
                        </div>
                        <button id="draw-btn" style="width: 100%; padding: 15px; background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%); color: #667eea; border: none; border-radius: 25px; font-size: 1.2rem; font-weight: bold; cursor: pointer; box-shadow: 0 6px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8); transition: all 0.3s ease; margin-bottom: 15px; position: relative; overflow: hidden; animation: buttonGlow 4s ease-in-out infinite;">
                            <span style="position: relative; z-index: 2;">🎲 试试手气</span>
                            <div style="position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); transition: left 0.5s; animation: shimmer 3s ease-in-out infinite;"></div>
                        </button>
                        <div onclick="Game.cancelBlindBox('${modal.id = 'blind-box-modal-' + Date.now()}')" style="color: rgba(255,255,255,0.7); font-size: 0.9rem; cursor: pointer; text-decoration: underline; padding: 8px; border-radius: 15px; transition: all 0.2s; display: inline-block; animation: fadeInOut 4s ease-in-out infinite;">
                            取消
                        </div>
                    </div>
                    <style>
                        @keyframes sparkle {
                            0%, 100% { opacity: 0; transform: scale(0); }
                            50% { opacity: 1; transform: scale(1); }
                        }
                        @keyframes rotate {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        @keyframes glow {
                            0%, 100% { text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
                            50% { text-shadow: 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.5); }
                        }
                        @keyframes breathe {
                            0%, 100% { transform: scale(1); }
                            50% { transform: scale(1.02); }
                        }
                        @keyframes numberPulse {
                            0%, 100% { transform: scale(1); }
                            50% { transform: scale(1.1); }
                        }
                        @keyframes buttonGlow {
                            0%, 100% { box-shadow: 0 6px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8); }
                            50% { box-shadow: 0 6px 20px rgba(102,126,234,0.3), inset 0 1px 0 rgba(255,255,255,0.8); }
                        }
                        @keyframes shimmer {
                            0% { left: -100%; }
                            50% { left: 100%; }
                            100% { left: -100%; }
                        }
                        @keyframes fadeInOut {
                            0%, 100% { opacity: 0.7; }
                            50% { opacity: 1; }
                        }
                    </style>
                `;

        modal.appendChild(card);
        document.body.appendChild(modal);

        // 摇筛子逻辑
        document.getElementById('draw-btn').onclick = () => {
            this.startDiceRoll(modal);
        };

        // 添加按钮悬停效果（安全检查）
        const btn = document.getElementById('draw-btn');
        if (btn) {
            btn.onmouseenter = () => {
                btn.style.transform = 'translateY(-2px)';
                btn.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8)';
                const shimmer = btn.querySelector('div');
                if (shimmer) shimmer.style.left = '0%';
            };
            btn.onmouseleave = () => {
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)';
                const shimmer = btn.querySelector('div');
                if (shimmer) shimmer.style.left = '100%';
            };
        }

        this.openingBox = false;
    },

    startDiceRoll: function (modal) {
        const display = document.getElementById('roulette-display');
        const status = document.getElementById('roulette-status');
        const btn = document.getElementById('draw-btn');

        btn.disabled = true;
        btn.innerText = '手气不错中...';
        btn.style.opacity = '0.6';
        status.innerText = '筛子滚动中...';

        // 播放摇筛子音效
        AudioSys.playDiceRoll();

        // 时间选项（简化版）
        const timeOptions = [5, 6, 7, 8, 9, 10, 13, 15, 18, 20, 25, 30];
        const selectedTime = timeOptions[Math.floor(Math.random() * timeOptions.length)];
        const tips = {
            extreme: [
                '心跳加速模式！',
                '手速开挂挑战！',
                '这波是“闪电侠”级别！',
                '小手加速，冲呀！'
            ],
            hard: [
                '有点刺激，但你可以！',
                '勇者挑战，开始啦！',
                '紧张但不慌～',
                '咬咬牙就过啦！'
            ],
            normal: [
                '稳稳的节奏～',
                '刚刚好，慢慢来！',
                '今天手感不错哦～',
                '淡定出击！'
            ],
            easy: [
                '轻松小菜一碟～',
                '这波是放松模式！',
                '慢慢来就稳赢～',
                '今天好运加倍！'
            ]
        };

        // 摇筛子动画
        let rollCount = 0;
        const maxRolls = 15;
        const rollInterval = setInterval(() => {
            const randomTime = timeOptions[Math.floor(Math.random() * timeOptions.length)];
            display.innerText = randomTime + 's';
            rollCount++;

            if (rollCount >= maxRolls) {
                clearInterval(rollInterval);

                // 播放一锤定音音效
                AudioSys.playDing();

                // 显示最终结果
                display.innerText = selectedTime + 's';

                // 根据时间设置颜色和描述
                if (selectedTime <= 9) {
                    display.style.color = '#ff4757';
                    status.innerText = `😱 极限挑战！${tips.extreme[Math.floor(Math.random() * tips.extreme.length)]}`;
                } else if (selectedTime <= 13) {
                    display.style.color = '#ff7a45';
                    status.innerText = `😤 困难模式！${tips.hard[Math.floor(Math.random() * tips.hard.length)]}`;
                } else if (selectedTime <= 18) {
                    display.style.color = '#ffa726';
                    status.innerText = `😊 标准模式 ${tips.normal[Math.floor(Math.random() * tips.normal.length)]}`;
                } else if (selectedTime <= 25) {
                    display.style.color = '#26de81';
                    status.innerText = `😊 标准模式 ${tips.normal[Math.floor(Math.random() * tips.normal.length)]}`;
                } else {
                    display.style.color = '#45aaf2';
                    status.innerText = `😌 轻松模式 ${tips.easy[Math.floor(Math.random() * tips.easy.length)]}`;
                }

                btn.innerHTML = `
                            <span style="position: relative; z-index: 2; animation: bounce 1s infinite;">🚀 开始挑战</span>
                            <div style="position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent); animation: rainbow-shimmer 1.5s ease-in-out infinite;"></div>
                        `;
                btn.disabled = false;
                btn.style.cssText += `
                            opacity: 1; 
                            animation: mega-pulse 1.2s ease-in-out infinite, rainbow-glow 2s ease-in-out infinite; 
                            transform: scale(1.05); 
                            background: linear-gradient(45deg, #ff8787, #6ee7dd, #66d9ef, #b8e994, #ffd93d, #ffb8f5, #74b9ff) !important;
                            background-size: 400% 400% !important;
                            animation: mega-pulse 1.2s ease-in-out infinite, rainbow-glow 2s ease-in-out infinite, gradient-shift 3s ease-in-out infinite !important;
                        `;

                // 添加动态样式
                const style = document.createElement('style');
                style.innerHTML = `
                            @keyframes mega-pulse {
                                0%, 100% { transform: scale(1.05); box-shadow: 0 0 20px rgba(255,135,135,0.7); }
                                50% { transform: scale(1.1); box-shadow: 0 0 30px rgba(255,135,135,0.9), 0 0 40px rgba(110,231,221,0.7); }
                            }
                            @keyframes rainbow-glow {
                                0% { box-shadow: 0 0 20px #ff8787, 0 0 30px #ff8787, 0 0 40px #ff8787; }
                                25% { box-shadow: 0 0 20px #6ee7dd, 0 0 30px #6ee7dd, 0 0 40px #6ee7dd; }
                                50% { box-shadow: 0 0 20px #66d9ef, 0 0 30px #66d9ef, 0 0 40px #66d9ef; }
                                75% { box-shadow: 0 0 20px #ffd93d, 0 0 30px #ffd93d, 0 0 40px #ffd93d; }
                                100% { box-shadow: 0 0 20px #ff8787, 0 0 30px #ff8787, 0 0 40px #ff8787; }
                            }
                            @keyframes gradient-shift {
                                0% { background-position: 0% 50%; }
                                50% { background-position: 100% 50%; }
                                100% { background-position: 0% 50%; }
                            }
                            @keyframes rainbow-shimmer {
                                0% { left: -100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent); }
                                50% { left: 0%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent); }
                                100% { left: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent); }
                            }
                        `;
                document.head.appendChild(style);

                // 更新按钮事件
                btn.onclick = () => {
                    document.body.removeChild(modal);
                    this.startBlindBoxChallenge(selectedTime);
                };
            }
        }, 120);

        AudioSys.playClick();
    },

    showBlindBoxSuccess: function (emoji, message, bonus) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center; z-index: 300;';

        const card = document.createElement('div');
        card.className = 'card';
        card.style.cssText = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; text-align: center; max-width: 350px; color: #fff; animation: popIn 0.3s ease;';

        card.innerHTML = `
                    <div style="font-size: 4rem; margin-bottom: 15px; animation: bounce 1s infinite;">${emoji}</div>
                    <h2 style="margin-bottom: 10px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">盲盒挑战成功！</h2>
                    <p style="margin-bottom: 20px; line-height: 1.5; font-size: 1rem;">${message}</p>
                    <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 15px; margin-bottom: 20px;">
                        <div style="font-size: 1.1rem; margin-bottom: 5px;">🎁 奖励能量</div>
                        <div style="font-size: 2rem; font-weight: 900; color: #FFD93D;">+${bonus}</div>
                    </div>
                `;

        const btn = document.createElement('button');
        btn.innerText = '太棒了！';
        btn.style.cssText = 'width: 100%; padding: 12px; background: #fff; color: #667eea; border: none; border-radius: 20px; font-size: 1.1rem; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2);';
        btn.onclick = () => {
            document.body.removeChild(modal);
            HomeDashboard.show();
        };

        card.appendChild(btn);
        modal.appendChild(card);
        document.body.appendChild(modal);

        // 3秒后自动关闭
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
                HomeDashboard.show();
            }
        }, 3000);
    },

    closeBlindBoxSuccess: function (modalId) {
        const modal = document.getElementById(modalId);
        if (modal && document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
        // 确保返回首页
        HomeDashboard.show();
    },

    cancelBlindBox: function (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) document.body.removeChild(modal);
        this.openingBox = false;
    },

    startBlindBoxChallenge: function (timeLimit) {
        const totalLevels = this.config.length;
        const maxUnlocked = SaveSystem.gradeData.maxLevel;

        const bossDraw = Math.random() < 0.12;
        let targetId = 1;
        if (!bossDraw) {
            if (Math.random() < 0.8 || maxUnlocked >= totalLevels) {
                targetId = Math.floor(Math.random() * maxUnlocked) + 1;
            } else {
                targetId = Math.floor(Math.random() * (totalLevels - maxUnlocked)) + maxUnlocked + 1;
            }
        }

        // 直接开始盲盒挑战，无预览
        this.isBlindBoxMode = true;
        this.isBlindBoxBoss = bossDraw;
        this.isBossMode = false;
        this.blindBoxTimeLimit = timeLimit;
        if (bossDraw) {
            // 盲盒大魔王使用抽到的倒计时
            this.bossTimeLimit = timeLimit;
        }
        SaveSystem.gradeData.blindBox.used++;
        SaveSystem.save();

        // 随机选择一套可爱动物背景主题
        const animalThemes = [
            'bb-theme-bunny',      // 🐰 小兔子主题
            'bb-theme-cat',        // 🐱 小猫咪主题  
            'bb-theme-frog',       // 🐸 小青蛙主题
            'bb-theme-penguin',    // 🐧 小企鹅主题
            'bb-theme-fox',        // 🦊 小狐狸主题
            'bb-theme-bear',       // 🐻 小熊主题
            'bb-theme-butterfly'   // 🦋 小蝴蝶主题
        ];
        const randomTheme = animalThemes[Math.floor(Math.random() * animalThemes.length)];
        document.body.className = `game-active blind-box-mode ${randomTheme}`;

        // 关闭地图弹窗
        document.getElementById('map-modal').style.display = 'none';

        // 直接开始游戏
        this.curr = targetId;
        document.getElementById('level-title').innerText = bossDraw ? `👹 盲盒大魔王` : `🎁 盲盒第${targetId}关`;
        document.body.classList.add('game-active');
        HomeDashboard.hide();

        // 渲染游戏并开始计时
        if (bossDraw) {
            this.render(this.getBossPool());
            document.body.classList.add('boss-mode');
            AudioSys.playTension();
        } else {
            const baseWords = this.config[targetId - 1].words;
            const blindWords = this.getBlindBoxWords(baseWords);
            this.render(blindWords);
        }
        this.applyBlindBoxBoardTheme();
        // 注意：不在这里设置startT，等准备倒计时结束后再设置
        clearInterval(this.timer);

        const tEl = document.getElementById('timer-value');
        tEl.innerText = timeLimit.toFixed(1);
        tEl.style.color = '#2c3e50';
        tEl.style.animation = '';
        tEl.style.textShadow = '0 1px 2px rgba(255,255,255,0.8)';

        // 在 HUD 下方显示准备倒计时
        const prepareCountdown = document.createElement('div');
        prepareCountdown.id = 'prepare-countdown';
        const hud = document.querySelector('.hud');
        const hudRect = hud ? hud.getBoundingClientRect() : null;
        const top = (hudRect ? hudRect.bottom + 18 : 128);
        prepareCountdown.style.cssText = `position: fixed; left: 0; right: 0; top: ${top}px; margin: 0 auto; width: max-content; max-width: 90vw; text-align: center; background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); color: white; padding: 8px 16px; border-radius: 20px; font-size: 1.1rem; font-weight: bold; box-shadow: 0 4px 15px rgba(255,107,107,0.4); animation: countdown-pulse 1s ease-in-out infinite; z-index: 260; pointer-events: none;`;
        prepareCountdown.innerHTML = '倒计时准备: 5';
        document.body.appendChild(prepareCountdown);

        // 禁用游戏交互
        const gameBoard = document.getElementById('game-board');
        gameBoard.style.pointerEvents = 'none';
        gameBoard.style.opacity = '0.7';

        // 播放温馨的礼物音效
        AudioSys.playGiftBox();

        // 添加倒计时动画样式
        const style = document.createElement('style');
        style.innerHTML = `
                    @keyframes countdown-pulse {
                        0%, 100% { transform: translateY(-50%) scale(1); }
                        50% { transform: translateY(-50%) scale(1.1); }
                    }
                `;
        document.head.appendChild(style);

        // 5秒倒计时
        let countdown = 5;
        const countdownTimer = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                prepareCountdown.innerHTML = `倒计时准备: ${countdown}`;
            } else {
                clearInterval(countdownTimer);
                if (document.body.contains(prepareCountdown)) document.body.removeChild(prepareCountdown);

                // 优雅的边框流光动效
                gameBoard.style.position = 'relative';

                const borderGlow = document.createElement('div');
                borderGlow.style.cssText = `
                            position: absolute; 
                            top: 0; left: 0; right: 0; bottom: 0; 
                            border: 3px solid transparent;
                            border-radius: 12px;
                            background: linear-gradient(white, white) padding-box,
                                        linear-gradient(90deg, 
                                            transparent 0%, 
                                            rgba(0, 255, 136, 0.8) 25%, 
                                            rgba(0, 255, 255, 0.9) 50%, 
                                            rgba(0, 136, 255, 0.8) 75%, 
                                            transparent 100%) border-box;
                            background-size: 300% 100%;
                            background-position: 200% 0;
                            pointer-events: none;
                            z-index: 10;
                            animation: border-flow 1.2s ease-out;
                            box-shadow: 0 0 20px rgba(0, 255, 200, 0.4), inset 0 0 20px rgba(0, 255, 200, 0.2);
                        `;

                const style = document.createElement('style');
                style.innerHTML = `
                            @keyframes border-flow {
                                0% { 
                                    background-position: 200% 0;
                                    opacity: 0;
                                    box-shadow: 0 0 0 rgba(0, 255, 200, 0);
                                }
                                30% { 
                                    opacity: 1;
                                    box-shadow: 0 0 30px rgba(0, 255, 200, 0.6), inset 0 0 20px rgba(0, 255, 200, 0.3);
                                }
                                70% { 
                                    background-position: -100% 0;
                                    opacity: 1;
                                    box-shadow: 0 0 30px rgba(0, 255, 200, 0.6), inset 0 0 20px rgba(0, 255, 200, 0.3);
                                }
                                100% { 
                                    background-position: -200% 0;
                                    opacity: 0;
                                    box-shadow: 0 0 0 rgba(0, 255, 200, 0);
                                }
                            }
                        `;
                document.head.appendChild(style);

                gameBoard.appendChild(borderGlow);
                gameBoard.classList.add('board-shake');
                setTimeout(() => gameBoard.classList.remove('board-shake'), 320);

                // 1.2秒后移除动效并恢复游戏交互
                setTimeout(() => {
                    if (gameBoard.contains(borderGlow)) {
                        gameBoard.removeChild(borderGlow);
                    }
                    gameBoard.style.pointerEvents = 'auto';
                    gameBoard.style.opacity = '1';
                    gameBoard.style.transition = 'opacity 0.2s ease';
                    // 开始正式计时
                    this.startBlindBoxTimer(timeLimit);
                }, 1200);
            }
        }, 1000);
    },

    startBlindBoxTimer: function (timeLimit) {
        // 在这里设置开始时间，准备倒计时已经结束
        this.startT = Date.now();
        const tEl = document.getElementById('timer-value');
        this.timer = setInterval(() => {
            if (this.active && !this.paused) {
                const elapsed = (Date.now() - this.startT) / 1000;
                const remaining = timeLimit - elapsed;
                if (remaining <= 0) {
                    this.failBlindBoxChallenge();
                } else {
                    tEl.innerText = remaining.toFixed(1);
                    if (remaining <= 5) {
                        tEl.style.color = '#FF4757';
                        tEl.style.animation = 'pulse 0.5s infinite';
                        tEl.style.textShadow = '0 1px 2px rgba(255,255,255,0.9)';
                    } else if (remaining <= 10) {
                        tEl.style.color = '#FFA726';
                        tEl.style.textShadow = '0 1px 2px rgba(255,255,255,0.8)';
                    } else {
                        tEl.style.color = '#2c3e50';
                        tEl.style.textShadow = '0 1px 2px rgba(255,255,255,0.8)';
                    }
                }
            }
        }, 100);
    },
    init: function () {
        const ppl = 6;
        const total = Math.ceil(fullVocabulary.length / ppl);
        this.config = []; // Reset config
        for (let i = 0; i < total; i++) this.config.push({ id: i + 1, words: fullVocabulary.slice(i * ppl, (i + 1) * ppl) });
    },
    startBossLevel: function () {
        this.isBossMode = true;
        this.bossTimeLimit = 13; // Set correct time limit
        document.getElementById('boss-warning-modal').style.display = 'none';
        document.getElementById('boss-fail-modal').style.display = 'none';
        document.body.classList.add('boss-mode');

        // Generate Content: 6 words (priority: history > current > random)
        const pool = this.getBossPool();

        document.getElementById('map-modal').style.display = 'none';
        document.getElementById('win-modal').style.display = 'none';
        document.getElementById('level-title').innerText = `👹 大魔王关卡`;
        document.body.classList.add('game-active');
        HomeDashboard.hide();

        AudioSys.playTension(); // Start tension audio

        this.render(pool);
        this.active = true;
        this.startT = Date.now();
        clearInterval(this.timer);

        // Timer Logic for Boss Mode
        const tEl = document.getElementById('timer-value');
        tEl.innerText = this.bossTimeLimit.toFixed(1);

        this.timer = setInterval(() => {
            if (this.active && !this.paused) {
                const elapsed = (Date.now() - this.startT) / 1000;
                const remaining = this.bossTimeLimit - elapsed;

                if (remaining <= 0) {
                    this.failBossLevel();
                } else {
                    tEl.innerText = remaining.toFixed(1);
                }
            }
        }, 100);
    },
    getBossPool: function () {
        let pool = [];
        // 1. Add historical mistakes
        const history = Object.keys(SaveSystem.gradeData.historyMistakes || {});
        history.forEach(char => {
            const found = fullVocabulary.find(v => v.char === char);
            if (found) pool.push(found);
        });
        // 2. Add current mistakes if needed
        if (pool.length < 6) {
            const current = Object.keys(SaveSystem.gradeData.mistakes || {});
            current.forEach(char => {
                if (!pool.find(p => p.char === char)) {
                    const found = fullVocabulary.find(v => v.char === char);
                    if (found) pool.push(found);
                }
            });
        }
        // 3. Fill with random words if still < 6
        while (pool.length < 6) {
            const rand = fullVocabulary[Math.floor(Math.random() * fullVocabulary.length)];
            if (!pool.includes(rand)) pool.push(rand);
        }
        return pool.sort(() => 0.5 - Math.random()).slice(0, 6);
    },
    getMistakeCandidates: function () {
        const gd = SaveSystem.gradeData;
        const score = {};
        Object.entries(gd.mistakes || {}).forEach(([char, info]) => {
            if (!fullVocabulary.some(v => v.char === char)) return;
            score[char] = (score[char] || 0) + (info.count || 1) * 2;
        });
        Object.entries(gd.historyMistakes || {}).forEach(([char, info]) => {
            if (!fullVocabulary.some(v => v.char === char)) return;
            score[char] = (score[char] || 0) + (info.count || 1);
        });
        return Object.keys(score)
            .map(char => ({ word: fullVocabulary.find(v => v.char === char), score: score[char] }))
            .filter(item => item.word)
            .sort((a, b) => b.score - a.score)
            .map(item => item.word);
    },
    getBlindBoxWords: function (baseWords) {
        const base = Array.isArray(baseWords) ? baseWords.slice() : [];
        const total = base.length || 6;
        const mistakes = this.getMistakeCandidates();
        const maxMistakes = Math.min(4, total - 2);
        const takeMistakes = Math.min(mistakes.length, maxMistakes);
        const picked = [];
        const used = new Set();

        for (let i = 0; i < takeMistakes; i++) {
            const w = mistakes[i];
            if (w && !used.has(w.char)) {
                picked.push(w);
                used.add(w.char);
            }
        }

        base.forEach(w => {
            if (picked.length >= total) return;
            if (!used.has(w.char)) {
                picked.push(w);
                used.add(w.char);
            }
        });

        while (picked.length < total) {
            const rand = fullVocabulary[Math.floor(Math.random() * fullVocabulary.length)];
            if (!used.has(rand.char)) {
                picked.push(rand);
                used.add(rand.char);
            }
        }

        return picked.sort(() => Math.random() - 0.5);
    },
    failBossLevel: function () {
        this.active = false; clearInterval(this.timer);
        AudioSys.stopTension(); // Stop audio
        AudioSys.playError();
        document.body.classList.remove('boss-mode');
        // Shake effect on board
        const b = document.getElementById('game-board');
        b.classList.add('shake');
        setTimeout(() => b.classList.remove('shake'), 500);

        setTimeout(() => {
            document.getElementById('boss-fail-modal').style.display = 'flex';
        }, 800);
    },
    failBlindBoxChallenge: function () {
        this.active = false;
        clearInterval(this.timer);
        AudioSys.playError();
        if (this.isBlindBoxBoss) {
            AudioSys.stopTension();
            document.body.classList.remove('boss-mode');
            this.isBlindBoxBoss = false;
        }
        this.clearBlindBoxBoardTheme();

        // 重置计时器样式
        const tEl = document.getElementById('timer-value');
        tEl.style.color = '#F59E0B';
        tEl.style.animation = '';

        // 重置盲盒模式
        this.isBlindBoxMode = false;
        this.blindBoxTimeLimit = null;
        document.body.classList.remove('blind-box-mode', 'bb-theme-bunny', 'bb-theme-cat', 'bb-theme-frog', 'bb-theme-penguin', 'bb-theme-fox', 'bb-theme-bear', 'bb-theme-butterfly');

        // 震动效果
        const b = document.getElementById('game-board');
        b.classList.add('shake');
        setTimeout(() => b.classList.remove('shake'), 500);

        Toast.show('⏰ 时间到！盲盒挑战失败，再接再厉！');

        setTimeout(() => {
            HomeDashboard.show();
        }, 1500);
    },
    showLevelMap: function () {
        AudioSys.playAdventure();
        document.getElementById('map-modal').style.display = 'flex';
        document.getElementById('win-modal').style.display = 'none';
        const map = document.getElementById('level-map'); map.innerHTML = '';

        // 防止打开地图时立即误触
        let clickEnabled = false;
        setTimeout(() => { clickEnabled = true; }, 400);

        this.config.forEach((l, i) => {
            const btn = document.createElement('div');
            const levelId = i + 1;
            const maxLvl = SaveSystem.gradeData.maxLevel;
            const locked = levelId > maxLvl;
            const stars = SaveSystem.gradeData.levelStars[levelId] || 0;

            // 样式构建
            let css = `background:${locked ? '#F3F4F6' : '#fff'}; border-radius:18px; aspect-ratio:1; display:flex; flex-direction:column; justify-content:center; align-items:center; cursor:pointer; border:1px solid ${stars ? '#FFD93D' : '#eee'}; box-shadow:0 4px 0 ${stars ? '#FFE082' : '#eee'}; touch-action: manipulation;`;

            btn.style.cssText = css;
            btn.classList.add('level-node');
            btn.dataset.levelId = levelId;
            if (stars) btn.style.background = "#FFF9C4";

            // 当前最高关卡添加红色呼吸高亮
            if (levelId === maxLvl) {
                btn.classList.add('pulse-red');
            }

            btn.innerHTML = `<div style="font-weight:bold; font-family:'Nunito'; font-size:1.2rem; color:${locked ? '#ccc' : '#555'}">${levelId}</div>`;
            const record = SaveSystem.gradeData.levelRecords[levelId];
            if (!locked) {
                btn.innerHTML += stars ? `<div style="font-size:0.6rem; margin-top:2px;">⭐⭐⭐</div>` : `<div style="font-size:0.7rem; color:#aaa; margin-top:2px;">GO</div>`;
                if (record) btn.innerHTML += `<div style="font-size:0.65rem; color:#2E86C1; margin-top:4px; font-family:'Nunito'; font-weight:800;">⏱️ ${record}s</div>`;
            }

            // 防误触逻辑：改用原生 onclick。
            // 原生 click 事件在发生滚动/滑动时不会触发，天然解决了“滑动误触”问题。
            // 之前使用 onpointerdown 会导致一按就触发，改用 onclick 即可修复，
            // 同时避免了自定义位移检测阈值过严导致的点不进去的问题。
            if (!locked) {
                btn.onclick = () => {
                    if (!clickEnabled) return;
                    this.requestLevel(levelId);
                };
            }
            map.appendChild(btn);
        });
    },
    openReplayRoulette: function () {
        if (this.openingReplay) return;
        const records = SaveSystem.gradeData.levelRecords || {};
        const eligible = Object.keys(records).map(n => parseInt(n, 10)).filter(n => !Number.isNaN(n));
        if (eligible.length === 0) {
            Toast.show('先通关几关再来复盘吧～');
            return;
        }
        this.openingReplay = true;
        const map = document.getElementById('level-map');
        if (map) map.classList.add('roulette-lock', 'roulette-active');
        // 随机关进行中，先移除红色引导，避免干扰
        document.querySelectorAll('#level-map .pulse-red').forEach(node => node.classList.remove('pulse-red'));
        Toast.show('🎯 正在随机挑选挑战关卡...');
        this.animateReplayPick(eligible);
    },
    animateReplayPick: function (eligible) {
        const pick = eligible[Math.floor(Math.random() * eligible.length)];
        let steps = 0;
        let delay = 45;
        const maxSteps = 12 + Math.floor(Math.random() * 6);
        const roll = () => {
            steps++;
            const choice = steps < maxSteps ? eligible[Math.floor(Math.random() * eligible.length)] : pick;
            this.highlightReplayLevel(choice);
            this.playReplayTick(steps, maxSteps, delay);
            if (steps < maxSteps) {
                delay += Math.min(22, 4 + steps * 0.9);
                delay = Math.min(delay, 220);
                setTimeout(roll, delay);
            } else {
                setTimeout(() => {
                    AudioSys.playDing();
                    this.startReplayLevel(pick, 3000);
                }, 360);
            }
        };
        roll();
    },
    highlightReplayLevel: function (levelId) {
        const prev = document.querySelector('.roulette-highlight');
        if (prev) prev.classList.remove('roulette-highlight');
        const el = document.querySelector(`[data-level-id="${levelId}"]`);
        if (el) el.classList.add('roulette-highlight');
    },
    startReplayLevel: function (levelId, waitMs = 650) {
        const map = document.getElementById('level-map');
        const el = document.querySelector(`[data-level-id="${levelId}"]`);
        if (el) {
            el.classList.add('roulette-final');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => el.classList.remove('roulette-final'), waitMs);
        }
        const prev = document.querySelector('.roulette-highlight');
        if (prev) prev.classList.remove('roulette-highlight');
        this.openingReplay = false;
        const record = SaveSystem.gradeData.levelRecords?.[levelId];
        const recordText = record ? `纪录 ${record}s` : '暂无纪录';
        Toast.show(`🎯 命中第${levelId}关，${recordText}！`);
        this.spawnReplayEasterEgg(el);
        setTimeout(() => {
            if (map) map.classList.remove('roulette-active', 'roulette-lock');
            this.startLevel(levelId);
        }, waitMs);
    },
    spawnReplayEasterEgg: function (el) {
        if (!el) return;
        const tag = document.createElement('div');
        tag.className = 'roulette-egg';
        tag.innerText = '🎉';
        el.appendChild(tag);
        setTimeout(() => {
            if (el.contains(tag)) el.removeChild(tag);
        }, 1600);
    },
    playReplayTick: function (step, maxSteps, delay = 80) {
        if (!AudioSys) return;
        const progress = step / maxSteps;
        const freq = progress > 0.85 ? 920 : progress > 0.6 ? 780 : 660;
        const decay = Math.max(0.04, Math.min(0.12, delay / 1000 * 0.5));
        const vol = progress > 0.85 ? 0.09 : 0.08;
        AudioSys.playTone(freq, 0.004, decay, vol);
    },
    pendingLevel: null,
    requestLevel: function (id) {
        // 如果是当前正在挑战的最高关卡，直接进入
        if (id === SaveSystem.gradeData.maxLevel) {
            this.startLevel(id);
        } else {
            // 如果是旧关卡，弹出确认框
            this.pendingLevel = id;
            document.getElementById('confirm-modal').style.display = 'flex';
        }
    },
    confirmReplay: function () {
        if (this.pendingLevel) {
            closeOverlay('confirm-modal');
            this.startLevel(this.pendingLevel);
            this.pendingLevel = null;
        }
    },
    startLevel: function (id) {
        this.curr = id;
        document.getElementById('map-modal').style.display = 'none';
        document.getElementById('win-modal').style.display = 'none';

        // 设置关卡标题
        if (this.isBlindBoxMode) {
            document.getElementById('level-title').innerText = `🎁 盲盒第${id}关`;
        } else {
            document.getElementById('level-title').innerText = `第${id}关`;
        }

        document.body.classList.add('game-active');
        document.getElementById('game-container').scrollTop = 0;
        HomeDashboard.hide();
        this.render(this.config[id - 1].words);
        this.startT = Date.now();
        clearInterval(this.timer);

        const tEl = document.getElementById('timer-value');

        // 盲盒模式：倒计时
        if (this.isBlindBoxMode && this.blindBoxTimeLimit) {
            tEl.innerText = this.blindBoxTimeLimit.toFixed(1);

            this.timer = setInterval(() => {
                if (this.active && !this.paused) {
                    const elapsed = (Date.now() - this.startT) / 1000;
                    const remaining = this.blindBoxTimeLimit - elapsed;

                    if (remaining <= 0) {
                        this.failBlindBoxChallenge();
                    } else {
                        tEl.innerText = remaining.toFixed(1);

                        // 时间紧张时的视觉提示
                        if (remaining <= 5) {
                            tEl.style.color = '#FF4757';
                            tEl.style.animation = 'pulse 0.5s infinite';
                        } else if (remaining <= 10) {
                            tEl.style.color = '#FFA726';
                        }
                    }
                }
            }, 100);
        } else {
            // 普通模式：正计时
            tEl.innerText = "0.0";
            tEl.style.color = '#F59E0B';
            tEl.style.animation = '';

            this.timer = setInterval(() => {
                if (this.active && !this.paused) {
                    tEl.innerText = ((Date.now() - this.startT) / 1000).toFixed(1);
                }
            }, 100);
        }
    },
    replayLevel: function () { this.startLevel(this.curr); },
    nextLevel: function () { this.startLevel(this.curr + 1); },
    render: function (words) {
        this.active = true; this.sel = null; this.matched = 0; this.pairs = words.length;
        let items = [];
        words.forEach(w => { items.push({ t: 'c', txt: w.char, id: w.char }); items.push({ t: 'p', txt: w.pinyin, id: w.char }); });
        items.sort(() => 0.5 - Math.random());
        const b = document.getElementById('game-board');
        b.innerHTML = ''; b.className = this.pairs <= 4 ? 'grid-4' : 'grid-6';
        items.forEach(i => {
            const el = document.createElement('div');
            el.className = 'bubble'; el.innerText = i.txt; el.dataset.id = i.id;
            el.dataset.type = i.t === 'p' ? 'pinyin' : 'char';

            // 根据拼音长度动态调整字号，防止溢出
            if (i.t === 'p') {
                if (i.txt.length >= 6) {
                    el.classList.add('extra-long-txt');
                } else if (i.txt.length >= 5) {
                    el.classList.add('long-txt');
                }
            }

            // 使用 pointerdown 提升移动端响应速度
            el.onpointerdown = (e) => {
                e.preventDefault();
                this.handle(el);
            };
            el.style.animationDelay = Math.random() + 's';
            b.appendChild(el);
        });
    },
    handle: function (el) {
        if (!this.active || el.classList.contains('matched')) return;
        el.classList.remove('bubble-pop-active');
        void el.offsetWidth;
        el.classList.add('bubble-pop-active');
        setTimeout(() => el.classList.remove('bubble-pop-active'), 300);

        if (el === this.sel) {
            el.classList.remove('selected');
            this.sel = null;
            return;
        }

        AudioSys.playClick();
        el.classList.add('selected');

        if (!this.sel) this.sel = el;
        else {
            const f = this.sel;
            const b = document.getElementById('game-board');
            b.style.pointerEvents = 'none';

            // 核心匹配逻辑：支持同音字/多音字
            const isCorrect = (function () {
                // 必须是一个汉字一个拼音
                if (f.dataset.type === el.dataset.type) return false;
                // 如果是干扰项，直接返回false
                if (f.dataset.distractor === 'true' || el.dataset.distractor === 'true') return false;
                const char = f.dataset.type === 'char' ? f.innerText : el.innerText;
                const pinyin = f.dataset.type === 'pinyin' ? f.innerText : el.innerText;
                // 在词库中查找任意匹配项
                return fullVocabulary.some(v => v.char === char && v.pinyin === pinyin);
            })();

            if (isCorrect) {
                AudioSys.playMatch();
                const r = el.getBoundingClientRect();
                Particles.spawn(r.left + r.width / 2, r.top + r.height / 2);
                const charId = f.dataset.type === 'char' ? f.dataset.id : el.dataset.id;
                if (!SaveSystem.gradeData.stats.totalWords.includes(charId)) SaveSystem.gradeData.stats.totalWords.push(charId);

                setTimeout(() => {
                    f.classList.add('matched'); el.classList.add('matched');
                    f.classList.remove('selected'); el.classList.remove('selected');
                    this.matched++;

                    // 如果完成了所有配对，让所有字和拼音（含干扰项）一起消失
                    if (this.matched >= this.pairs) {
                        b.querySelectorAll('.bubble').forEach(bubble => {
                            bubble.classList.add('matched');
                            bubble.classList.remove('selected');
                        });
                    }

                    // 在匹配到倒数第二对后，添加干扰项
                    if (this.matched === this.pairs - 1 && this.pairs > 1) {
                        const remainingBubbles = Array.from(b.querySelectorAll('.bubble:not(.matched)'));
                        const charBubble = remainingBubbles.find(el => el.dataset.type === 'char');
                        if (charBubble) {
                            const targetChar = charBubble.innerText;
                            const targetWord = fullVocabulary.find(v => v.char === targetChar);
                            if (targetWord) {
                                const distractors = fullVocabulary.filter(v =>
                                    v.char !== targetChar &&
                                    v.pinyin !== targetWord.pinyin
                                );
                                if (distractors.length >= 3) {
                                    // 随机选择3个不同的干扰项
                                    const shuffled = distractors.sort(() => Math.random() - 0.5);
                                    const selectedDistractors = shuffled.slice(0, 3);

                                    const distractorElements = selectedDistractors.map(distractor => {
                                        const distractorEl = document.createElement('div');
                                        distractorEl.className = 'bubble';
                                        distractorEl.innerText = distractor.pinyin;
                                        distractorEl.dataset.id = 'distractor';
                                        distractorEl.dataset.type = 'pinyin';
                                        distractorEl.dataset.distractor = 'true';
                                        if (distractor.pinyin.length >= 6) {
                                            distractorEl.classList.add('extra-long-txt');
                                        } else if (distractor.pinyin.length >= 5) {
                                            distractorEl.classList.add('long-txt');
                                        }
                                        distractorEl.onpointerdown = (e) => {
                                            e.preventDefault();
                                            this.handle(distractorEl);
                                        };
                                        return distractorEl;
                                    });

                                    // 先淡出现有气泡（加快过渡）
                                    remainingBubbles.forEach(bubble => {
                                        bubble.style.transition = 'opacity 0.08s linear, transform 0.08s linear';
                                        bubble.style.opacity = '0';
                                        bubble.style.transform = 'scale(0.9)';
                                    });

                                    setTimeout(() => {
                                        // 收集所有气泡：1个汉字 + 1个正确拼音 + 3个干扰拼音
                                        const pinyinBubbles = remainingBubbles.filter(el => el.dataset.type === 'pinyin');
                                        const allPinyins = [...pinyinBubbles, ...distractorElements];
                                        allPinyins.sort(() => Math.random() - 0.5);

                                        // 移除原有的未匹配气泡
                                        remainingBubbles.forEach(bubble => bubble.remove());

                                        // 切换到grid-final布局（3x3）
                                        b.className = 'grid-final';

                                        // 先添加汉字（会自动居中）
                                        charBubble.style.opacity = '0';
                                        charBubble.style.transform = 'scale(0.94)';
                                        charBubble.style.transition = 'opacity 0.12s linear, transform 0.12s linear';
                                        b.appendChild(charBubble);
                                        setTimeout(() => {
                                            charBubble.style.opacity = '1';
                                            charBubble.style.transform = 'scale(1)';
                                        }, 10);

                                        // 添加4个拼音（环绕汉字）
                                        allPinyins.forEach((bubble, index) => {
                                            bubble.style.opacity = '0';
                                            bubble.style.transform = 'scale(0.94)';
                                            bubble.style.transition = 'opacity 0.12s linear, transform 0.12s linear';
                                            bubble.style.animationDelay = '0s';
                                            b.appendChild(bubble);

                                            setTimeout(() => {
                                                bubble.style.opacity = '1';
                                                bubble.style.transform = 'scale(1)';
                                            }, 10);
                                        });
                                    }, 80);
                                }
                            }
                        }
                    }

                    b.style.pointerEvents = 'auto';
                    if (this.matched >= this.pairs) this.finish();
                }, 250);
            } else {
                AudioSys.playError();
                SaveSystem.addMistake(f.dataset.id);
                setTimeout(() => {
                    f.classList.add('shake');
                    el.classList.add('shake');
                    f.classList.remove('selected');
                }, 100); // 缩短等待时间
                setTimeout(() => {
                    f.classList.remove('shake');
                    el.classList.remove('selected', 'shake');
                    document.getElementById('game-board').style.pointerEvents = 'auto';
                }, 500); // 缩短锁定时间，从 700ms 降至 500ms
            }
            this.sel = null;
        }
    },
    finish: function () {
        this.active = false; clearInterval(this.timer);
        const timerVal = parseFloat(document.getElementById('timer-value').innerText);
        let time = timerVal; // Default: Normal mode (counts up)

        // 重置计时器样式
        const tEl = document.getElementById('timer-value');
        tEl.style.color = '#F59E0B';
        tEl.style.animation = '';

        AudioSys.playWin();

        // 盲盒挑战成功逻辑
        if (this.isBlindBoxMode) {
            // 计算实际用时（倒计时模式）
            time = parseFloat((this.blindBoxTimeLimit - timerVal).toFixed(1));

            SaveSystem.gradeData.blindBox.success++;

            // 盲盒成功烟花庆祝
            Particles.fireworks(2200);

            // 根据剩余时间给予不同奖励
            let bonus = 0;
            let message = '';
            let emoji = '';
            if (timerVal > this.blindBoxTimeLimit * 0.5) {
                bonus = 50;
                emoji = '🏆';
                message = `完美完成！剩余 ${timerVal.toFixed(1)} 秒！`;
            } else if (timerVal > this.blindBoxTimeLimit * 0.2) {
                bonus = 30;
                emoji = '🎉';
                message = `挑战成功！剩余 ${timerVal.toFixed(1)} 秒！`;
            } else {
                bonus = 20;
                emoji = '✨';
                message = `惊险完成！剩余 ${timerVal.toFixed(1)} 秒！`;
            }

            // 显示成功弹窗
            this.showBlindBoxSuccess(emoji, message, bonus);

            PetSystem.addXP(bonus, false);

            // 检查是否全部成功
            if (SaveSystem.gradeData.blindBox.success >= 15) {
                setTimeout(() => {
                    document.getElementById('reward-modal').style.display = 'flex';
                    PetSystem.addXP(200);
                    AudioSys.playWin();
                }, 2000);
            }

            // 重置盲盒模式
            this.isBlindBoxMode = false;
            this.blindBoxTimeLimit = null;
            if (this.isBlindBoxBoss) {
                AudioSys.stopTension();
                document.body.classList.remove('boss-mode');
                this.isBlindBoxBoss = false;
            }
            this.clearBlindBoxBoardTheme();
            document.body.classList.remove('blind-box-mode', 'bb-theme-bunny', 'bb-theme-cat', 'bb-theme-frog', 'bb-theme-penguin', 'bb-theme-fox', 'bb-theme-bear', 'bb-theme-butterfly');

            return; // 重要：直接返回，不执行后面的普通关卡逻辑
        }

        // 普通关卡完成逻辑 (Normal Level Logic)
        if (!this.isBossMode && !this.isBlindBoxMode) {
            SaveSystem.gradeData.levelStars[this.curr] = 3;

            // Trigger Boss Battle every 5 levels (Boss Logic)
            // Configurable Trigger: Level % 5 === 0. Only on first clear (curr === maxLevel)
            if (this.curr % 5 === 0 && this.curr === SaveSystem.gradeData.maxLevel) {
                // Delay slightly to let the "match" sound finish or just for effect
                setTimeout(() => {
                    document.getElementById('boss-warning-modal').style.display = 'flex';
                    // Play a specific sound if available, or just reuse error sound as 'alarm'
                    AudioSys.playError();
                }, 500);
                return; // Stop normal win flow
            }

            if (this.curr === SaveSystem.gradeData.maxLevel) SaveSystem.gradeData.maxLevel++;
        } else if (this.isBossMode) {
            // Boss Level Complete
            // Recalculate time for Boss (Limit - Remaining)
            time = parseFloat((this.bossTimeLimit - timerVal).toFixed(1));

            AudioSys.stopTension(); // Stop tension audio
            document.body.classList.remove('boss-mode');
            this.isBossMode = false; // Reset mode
            // Advance level after boss defeat
            SaveSystem.gradeData.maxLevel++;

            // Boss Victory Stats & Badge
            if (!SaveSystem.data.globalStats.bossDefeats) SaveSystem.data.globalStats.bossDefeats = 0;
            SaveSystem.data.globalStats.bossDefeats++;
            BadgeSystem.check('boss_killer');

            Toast.show(`🎉 恭喜打败大魔王！用时 ${time} 秒`);
        }

        // 只有非盲盒模式才记录成绩和升级
        if (!this.isBlindBoxMode) {
            SaveSystem.gradeData.stats.totalTime += time;
            const isRec = SaveSystem.checkNewRecord(this.curr, time);
            const xp = isRec ? 50 : 20;
            PetSystem.addXP(xp);
            BadgeSystem.check('first_win'); BadgeSystem.check('speedster', time / this.pairs); BadgeSystem.check('scholar');
            SaveSystem.save();
            HomeDashboard.update();

            // 只有非盲盒模式才显示普通胜利弹窗
            if (!this.isBlindBoxMode) {
                setTimeout(() => {
                    document.getElementById('win-modal').style.display = 'flex';
                    document.getElementById('result-time').innerText = time + 's';
                    document.getElementById('result-best').innerText = SaveSystem.gradeData.levelRecords[this.curr] + 's';
                    document.getElementById('record-alert').style.display = isRec ? 'block' : 'none';
                    document.getElementById('encouragement-text').innerText = getRandomEncouragement();
                    for (let i = 0; i < 5; i++) setTimeout(() => Particles.spawn(window.innerWidth / 2, window.innerHeight / 2), i * 200);
                }, 500);
            }
        } else {
            // 盲盒模式完成后不显示普通胜利弹窗，直接返回首页
            setTimeout(() => {
                HomeDashboard.show();
                for (let i = 0; i < 3; i++) setTimeout(() => Particles.spawn(window.innerWidth / 2, window.innerHeight / 2), i * 200);
            }, 1000); // 缩短延迟时间
        }
    }
    ,
    applyBlindBoxBoardTheme: function () {
        const themes = [
            { bg: 'rgba(255, 240, 246, 0.8)', border: '#FF9AC5', shadow: '0 12px 30px rgba(255, 154, 197, 0.25)' },
            { bg: 'rgba(233, 245, 255, 0.85)', border: '#8EC5FF', shadow: '0 12px 30px rgba(142, 197, 255, 0.25)' },
            { bg: 'rgba(237, 250, 241, 0.85)', border: '#7FE7C4', shadow: '0 12px 30px rgba(127, 231, 196, 0.25)' },
            { bg: 'rgba(255, 248, 230, 0.85)', border: '#FFC46B', shadow: '0 12px 30px rgba(255, 196, 107, 0.25)' },
            { bg: 'rgba(240, 236, 255, 0.85)', border: '#B69CFF', shadow: '0 12px 30px rgba(182, 156, 255, 0.25)' }
        ];
        this.blindBoxBoardTheme = themes[Math.floor(Math.random() * themes.length)];
        const board = document.getElementById('game-board');
        if (!board) return;
        board.classList.add('bb-board');
        board.style.setProperty('--bb-board-bg', this.blindBoxBoardTheme.bg);
        board.style.setProperty('--bb-board-border', this.blindBoxBoardTheme.border);
        board.style.setProperty('--bb-board-shadow', this.blindBoxBoardTheme.shadow);
    },
    clearBlindBoxBoardTheme: function () {
        const board = document.getElementById('game-board');
        if (!board) return;
        board.classList.remove('bb-board');
        board.style.removeProperty('--bb-board-bg');
        board.style.removeProperty('--bb-board-border');
        board.style.removeProperty('--bb-board-shadow');
    }
};

const Toast = {
    t: null,
    show: function (m) {
        const e = document.getElementById('toast');
        if (!e) return;
        e.innerText = m;
        e.classList.add('show');
        if (this.t) clearTimeout(this.t);
        this.t = setTimeout(() => {
            e.classList.remove('show');
            this.t = null;
        }, 3000);
    }
};
const Particles = {
    canvas: document.getElementById('confetti-canvas'),
    ctx: document.getElementById('confetti-canvas').getContext('2d'),
    items: [],
    resize: function () { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight },
    spawn: function (x, y) {
        // 移动端减少粒子数量
        const count = window.innerWidth < 500 ? 15 : 30;
        for (let i = 0; i < count; i++) {
            this.items.push({ x, y, vx: (Math.random() - .5) * 15, vy: (Math.random() - .5) * 15, life: 1, decay: 0.02, size: 5, g: 0.5, color: `hsl(${Math.random() * 360},80%,60%)` });
        }
    },
    fireworkBurst: function (x, y, count = 45) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 9;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 3 + Math.random() * 3;
            this.items.push({
                x, y, vx, vy,
                life: 1,
                decay: 0.015,
                size,
                g: 0.25,
                color: `hsl(${Math.random() * 360},90%,60%)`
            });
        }
    },
    fireworks: function (duration = 2000) {
        if (this.fireworkTimer) clearTimeout(this.fireworkTimer);
        const prevZ = this.canvas.style.zIndex;
        this.canvas.style.zIndex = '350';
        const start = Date.now();
        const shoot = () => {
            const x = Math.random() * this.canvas.width * 0.8 + this.canvas.width * 0.1;
            const y = Math.random() * this.canvas.height * 0.45 + this.canvas.height * 0.1;
            const count = window.innerWidth < 500 ? 30 : 50;
            this.fireworkBurst(x, y, count);
            if (Date.now() - start < duration) {
                this.fireworkTimer = setTimeout(shoot, 260);
            }
        };
        shoot();
        setTimeout(() => {
            this.canvas.style.zIndex = prevZ || '50';
        }, duration + 600);
    },
    loop: function () {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = 0; i < this.items.length; i++) {
            let p = this.items[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += (p.g ?? 0.5);
            p.life -= (p.decay ?? 0.02);
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size ?? 5, 0, 6.28);
            this.ctx.fill();
            if (p.life <= 0) this.items.splice(i--, 1)
        }
        requestAnimationFrame(() => this.loop())
    }
};
Particles.resize(); window.onresize = () => Particles.resize(); Particles.loop();

// 关键修复：显式挂载核心对象到 window，确保 HTML onclick 能访问
// 关键修复：显式挂载核心对象到 window，确保 HTML onclick 能访问
window.Game = Game;
window.AudioSys = AudioSys;
window.MistakeBook = MistakeBook;
window.SaveSystem = SaveSystem;
window.HomeDashboard = HomeDashboard;
window.NicknameSystem = NicknameSystem;
window.Dashboard = Dashboard;
window.Toast = Toast;
window.closeOverlay = closeOverlay;
window.PetSystem = PetSystem;
window.BadgeSystem = BadgeSystem;
window.GradeSelector = GradeSelector;
window.MiniQuiz = MiniQuiz;
window.ReviewSystem = ReviewSystem;
window.RecordSystem = RecordSystem;
window.getRandomEncouragement = getRandomEncouragement;
window.addEventListener('error', (e) => {
    if (!e || !e.message) return;
    if (window.Toast) Toast.show(`⚠️ 出错：${e.message}`);
});
window.addEventListener('unhandledrejection', (e) => {
    if (!e || !e.reason) return;
    const msg = typeof e.reason === 'string' ? e.reason : (e.reason.message || '未知错误');
    if (window.Toast) Toast.show(`⚠️ 出错：${msg}`);
});

// 初始化
SaveSystem.load();
NicknameSystem.init();
Game.init();
HomeDashboard.show();
document.addEventListener('gesturestart', (e) => e.preventDefault());
