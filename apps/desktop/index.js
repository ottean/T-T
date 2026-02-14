// apps/desktop/index.js

export default {
    name: 'DesktopComponent',
    emits: ['switch-app'],
    data() {
        return {
            currentPage: 0, 
            // === 核心数据 ===
            widgetBg: '', 
            defaultAvatar: 'https://i.postimg.cc/dtz2dpnV/bookmark.png',
            userAvatar: 'https://i.postimg.cc/dtz2dpnV/bookmark.png',
            timeString: '12:45', dateString: '2026.02.08', dayString: 'Sunday',
            ringCircumference: 295, ringOffset: 0, batteryLevel: 100, headerText: 'Ɛ Lovely Day ⸝⋆* .〰 ★',
            
            todos: [
                { id: 1, text: '给书签喂罐头', done: false },
                { id: 2, text: '帮Sean梳毛', done: false },
                { id: 3, text: '一起在书店晒太阳', done: false }
            ],

            photoWall: [
                { id: 1, url: 'https://i.postimg.cc/zvLFnrh5/guzhang.png', x: 50, y: 50, width: 80 },
                { id: 2, url: 'https://i.postimg.cc/Cxpsf9Lc/deyi.png', x: 50, y: 50, width: 80 },
                { id: 3, url: 'https://i.postimg.cc/c1VbX9LZ/linggan.png', x: 50, y: 50, width: 80 },
                { id: 4, url: 'https://i.postimg.cc/vZySd49x/jushou.png', x: 50, y: 50, width: 80 },
            ],
            
            photoSettings: { 
                bgImage: '', bgPosX: 50, bgPosY: 50, bgSize: 100, 
                currentEditId: null, 
                title: '我们需要更多Sariel!' 
            },

            showEditor: false, showPhotoEditor: false, 
            heroSettings: { bgImage: '', bgPosX: 50, bgPosY: 50, bgSize: 100, avatarPosX: 50, avatarPosY: 50, avatarSize: 100, textColor: '#ff9a8b' },
            
            countdown: {
                title: 'ˋˏᰔᩚˎˊ˗', 
                targetDate: '2025-11-28', 
                days: 0, 
                isFuture: false, 
                showEditor: false, 
                bgImage: '', 
                bgSize: 100, 
                bgPosX: 50, 
                bgPosY: 50,
                textColor: '#ff9a8b'
            },

            isDraggingSlider: false,

            loveWidget: {
                title: '✨·Zoの恋爱日记°♡',
                subtitle: '·˶╹-╹˶ ',
                avatarL: '',
                avatarR: '',
                label: '恋爱进度值',
                days: '318'
            },
            showDeleteL: false,
            showDeleteR: false,

            fortune: {
                lastDate: '', 
                current: null, 
                isAnimating: false,
                isFlipped: false, 
                pool: [
                    { level: '猫奴', text: '溪柴火软蛮毡暖，\n我与书签不出门。' },
                    { level: '安逸', text: '偷得浮生半日闲，\n拥猫高卧不论年。' },
                    { level: '逍遥', text: '不羡鸳鸯不羡仙，\n只羡书签晒日边。' },
                    { level: '安康', text: '三花聚鼎身无恙，\n日暖风和好安眠。' },
                    { level: '贪吃', text: '书签闻香知美味，\n不辞长作守碗奴。' },
                    { level: '辟邪', text: '书签坐镇无邪事，\n岁岁平安福满堂。' },
                    { level: '懒惰', text: '日上三竿犹未起，\n书签教你慢生活。' },
                    { level: '灵感', text: '笔下生花猫添趣，\n文思泉涌若江河。' },
                    { level: '团圆', text: '月圆人圆猫亦圆，\n书签蜷作玉盘团。' },
                    { level: '自在', text: '醉卧花阴终日懒，\n不知世上几多愁。' },
                    { level: '嬉戏', text: '闲来戏扑风中絮，\n误把飞花作蝶看。' },
                    { level: '安稳', text: '风雨不动安如山，\n怀中书签梦正酣。' },
                    { level: '忠诚', text: '虽无言语能倾诉，\n长伴身旁不离分。' },
                    { level: '暖阳', text: '负暄窗下毛如雪，\n只把光阴作睡乡。' },
                    { level: '高冷', text: '任尔千呼都不理，\n尾梢轻摆自风流。' },
                    { level: '无忧', text: '饱食终日无所事，\n闲看庭前花草生。' },
                    { level: '福气', text: '家有书签多喜乐，\n从此愁绪不沾身。' },
                    { level: '撒欢', text: '追云逐月不知累，\n只有书签最解忧。' },
                    { level: '圆满', text: '事事顺心如猫意，\n一生无虑乐悠游。' },
                    { level: '春晓', text: '爪试新泥知春暖，\n扑蝶花间意未休。' },
                    { level: '夏凉', text: '竹席清凉堪入梦，\n一觉醒来日已西。' },
                    { level: '秋意', text: '金风送爽书签醉，\n闲扑黄花满地香。' },
                    { level: '冬藏', text: '围炉煮酒猫相伴，\n风雪何曾入梦寒。' },
                    { level: '感恩', text: '衔来雀鸟报亲恩，\n虽是无知亦动人。' },                    
                ]
            },

            profile: {
                bgImage: '', avatar: '', sticker1: '🎧', sticker2: '🖤', musicCover: '',
                id: '@书签大王是猫猫', sign: '✨·“你是最特别的存在”··〰··ʚɞ',
                info: 'MBTI: ACAT\n生日:11.20', bio: '掉毛量:致力于让每一本书都穿上毛衣\n捕鼠能力:见到老鼠可能会先打个招呼\n卖萌技巧:视乎对方手中冻干数量而定', tag: '性格: 腼腆\nIP: 港岛'
            },
            showDeleteProfileAvatar: false, showDeleteMusicCover: false,

            moodCheck: {
                selected: null, 
                lastTime: '', 
                options: [
                    { emoji: 'OvO',   color: '#ffeaa7', text: '美滋滋' },
                    { emoji: '-_-',   color: '#dfe6e9', text: '无语' },
                    { emoji: 'QAQ',   color: '#74b9ff', text: '想哭' },
                    { emoji: 'o_o',   color: '#81ecec', text: '发呆' },
                    { emoji: 'zzz',   color: '#a29bfe', text: '困困' },
                    { emoji: '>_<',   color: '#ff7675', text: '抓狂' },
                    { emoji: '^3^',   color: '#fab1a0', text: '亲亲' },
                    { emoji: 'T_T',   color: '#55efc4', text: '泪奔' },
                    { emoji: 'OwO',   color: '#fd79a8', text: '哇哦' }
                ] 
            },

            sideApps: [
                { id: 'messenger', name: 'Dialogue', icon: 'ri-message-3-line' }, 
                { id: 'theater',    name: 'Theater', icon: 'ri-clapperboard-line' },
            ],

            extraApps: [
                { id: 'world-book', name: 'Archive', icon: 'ri-book-read-line' }, 
                { id: 'monitor',    name: 'Trace', icon: 'ri-map-pin-line' }
            ],
            page2Apps: [
                { id: 'diary',      name: 'Diary',    icon: 'ri-book-3-line' },
                { id: 'check',      name: 'Check',    icon: 'ri-smartphone-line' },
                { id: 'shop',       name: 'Mall',     icon: 'ri-shopping-bag-3-line' },
                { id: 'music',      name: 'Music',    icon: 'ri-disc-line' },
                { id: 'forum',      name: 'Forum',    icon: 'ri-discuss-line' }
            ],
            dockApps: [
                { id: 'profile',   name: 'Identity', icon: 'ri-passport-line' },
                { id: 'appearance', name: 'Vision', icon: 'ri-paint-brush-line' }, 
                { id: 'api-set',    name: 'Link', icon: 'ri-links-line' },
                { id: 'settings',   name: 'Control', icon: 'ri-equalizer-line' }
            ],
        }
    },
    computed: { currentEditPhoto() { return this.photoWall.find(p => p.id === this.photoSettings.currentEditId); } },
    methods: {
        // ✅ 核心功能：打开其他 App
        openApp(id) { 
            console.log("Desktop requesting open:", id);
            this.$emit('switch-app', id); 
        },

        // ✅ 辅助工具：获取东八区当前日期 (YYYY-MM-DD)
        getBeijingDate() {
            const now = new Date();
            const options = { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' };
            const dateStr = new Intl.DateTimeFormat('zh-CN', options).format(now);
            // 格式化通常返回 "2023/10/27"，替换斜杠以防万一
            return dateStr.replace(/\//g, '-');
        },

        saveData() {
            const dataToSave = {
                userAvatar: this.userAvatar, headerText: this.headerText, todos: this.todos,
                heroSettings: this.heroSettings, photoWall: this.photoWall,
                photoSettings: { ...this.photoSettings, currentEditId: null },
                countdown: { ...this.countdown, showEditor: false },
                loveWidget: this.loveWidget,
                fortune: this.fortune,
                profile: this.profile,
                moodCheck: this.moodCheck
            };
            try { localStorage.setItem('ai_phone_data', JSON.stringify(dataToSave)); } catch (e) {}
        },
        loadData() {
            const saved = localStorage.getItem('ai_phone_data');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    
                    if (parsed.userAvatar) this.userAvatar = parsed.userAvatar; else this.userAvatar = this.defaultAvatar;
                    this.headerText = parsed.headerText || ''; 
                    this.todos = parsed.todos || [];
                    
                    if (parsed.heroSettings) Object.assign(this.heroSettings, parsed.heroSettings);
                    this.photoWall = parsed.photoWall || [];
                    if (parsed.photoSettings) Object.assign(this.photoSettings, parsed.photoSettings);
                    if (parsed.countdown) Object.assign(this.countdown, parsed.countdown);
                    if (parsed.loveWidget) Object.assign(this.loveWidget, parsed.loveWidget);

                    // ✅ 修复：抽签逻辑 (使用北京时间)
                    if (parsed.fortune) {
                        Object.assign(this.fortune, parsed.fortune);
                        
                        const today = this.getBeijingDate(); // 获取当前北京日期
                        
                        if (this.fortune.lastDate === today) {
                            // 是今天，保持翻转状态
                            if (this.fortune.current) this.fortune.isFlipped = true; 
                        } else {
                            // 过期了，重置
                            this.fortune.current = null;
                            this.fortune.isFlipped = false;
                        }
                    }
                
                    if (parsed.profile) Object.assign(this.profile, parsed.profile);
                    if (parsed.moodCheck) Object.assign(this.moodCheck, parsed.moodCheck);

                } catch(e) { 
                    console.error("数据解析失败", e);
                    this.userAvatar = this.defaultAvatar; 
                }
            } else { 
                this.userAvatar = this.defaultAvatar; 
            }
            this.calculateCountdown();
        },

        fileToBase64(file) { return new Promise((r, j) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => r(reader.result); reader.onerror = e => j(e); }); },

        updateTime() {
            const now = new Date();
            this.timeString = `${now.getHours().toString().padStart(2, '0')} : ${now.getMinutes().toString().padStart(2, '0')}`;
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            this.dateString = `${now.getFullYear()}.${(now.getMonth()+1).toString().padStart(2,'0')}.${now.getDate().toString().padStart(2,'0')}`;
            this.dayString = days[now.getDay()];
        },
        initBattery() {
            if ('getBattery' in navigator) { navigator.getBattery().then(b => { this.updateBattery(b); b.addEventListener('levelchange', () => this.updateBattery(b)); }); } else { this.updateBattery({ level: 1 }); }
        },
        updateBattery(battery) { 
            this.batteryLevel = Math.round(battery.level * 100);
            const percentage = this.batteryLevel / 100;
            this.ringOffset = this.ringCircumference - (this.ringCircumference * percentage);
        },
        toggleTodo(index) { this.todos[index].done = !this.todos[index].done; this.saveData(); },
        
        handleScroll(e) {
            const scrollLeft = e.target.scrollLeft;
            const width = e.target.offsetWidth;
            const page = Math.round(scrollLeft / width);
            if (this.currentPage !== page) this.currentPage = page;
        },
        scrollToPage(index) {
            const swiper = this.$refs.swiper; 
            if (swiper) swiper.scrollTo({ left: swiper.offsetWidth * index, behavior: 'smooth' });
        },        
        
        openEditor() { this.showEditor = true; },
        closeEditor() { this.showEditor = false; this.saveData(); },
        triggerHeroBgUpload() { document.getElementById('hero-bg-upload').click(); },
        async handleHeroBgUpload(e) { if(e.target.files[0]) { this.heroSettings.bgImage = await this.fileToBase64(e.target.files[0]); this.saveData(); } },
        resetTextColor() { this.heroSettings.textColor = '#ff9a8b'; },
        deleteBg() { this.heroSettings.bgImage = ''; this.saveData(); },
        triggerAvatarUpload() { document.getElementById('avatar-upload').click(); },
        async handleAvatarUpload(e) { if(e.target.files[0]) { this.userAvatar = await this.fileToBase64(e.target.files[0]); this.saveData(); } },
        deleteAvatar() { this.userAvatar = ''; this.saveData(); },

        closePhotoEditor() { this.showPhotoEditor = false; this.photoSettings.currentEditId = null; this.saveData(); },
        triggerPhotoUpload() { document.getElementById('photo-wall-upload').click(); },
        async handlePhotoUpload(event) {
            const files = event.target.files;
            if (files && files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    const base64 = await this.fileToBase64(files[i]);
                    this.photoWall.push({ id: Date.now() + i, url: base64, x: 50, y: 50, width: 80 });
                }
                this.saveData();
            }
        },
        selectPhotoToEdit(id) { this.photoSettings.currentEditId = id; },
        backToPhotoList() { this.photoSettings.currentEditId = null; },
        deleteCurrentPhoto() {
            const idx = this.photoWall.findIndex(p => p.id === this.photoSettings.currentEditId);
            if (idx !== -1) { this.photoWall.splice(idx, 1); this.backToPhotoList(); }
        },
        openPhotoEditor() { this.showPhotoEditor = true; },

        calculateCountdown() {
            const target = new Date(this.countdown.targetDate);
            const today = new Date();
            target.setHours(0,0,0,0); today.setHours(0,0,0,0);
            const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
            this.countdown.isFuture = diffDays > 0;
            this.countdown.days = Math.abs(diffDays);
        },
        openCountdownEditor() { this.countdown.showEditor = true; },
        closeCountdownEditor() { this.countdown.showEditor = false; this.calculateCountdown(); this.saveData(); },
        triggerCountdownBgUpload() { document.getElementById('countdown-bg-upload').click(); },
        async handleCountdownBgUpload(e) { if(e.target.files[0]) { this.countdown.bgImage = await this.fileToBase64(e.target.files[0]); this.saveData(); } },
        deleteCountdownBg() { this.countdown.bgImage = ''; this.saveData(); },

        onSliderStart() { this.isDraggingSlider = true; },
        onSliderEnd() { this.isDraggingSlider = false; this.saveData(); },

        triggerLoveAvatarL() { document.getElementById('love-avatar-l').click(); },
        async handleLoveAvatarL(e) { if(e.target.files[0]) { this.loveWidget.avatarL = await this.fileToBase64(e.target.files[0]); this.saveData(); } },
        triggerLoveAvatarR() { document.getElementById('love-avatar-r').click(); },
        async handleLoveAvatarR(e) { if(e.target.files[0]) { this.loveWidget.avatarR = await this.fileToBase64(e.target.files[0]); this.saveData(); } }, 
        handleAvatarClick(side) {
            if (side === 'L') {
                if (!this.loveWidget.avatarL) document.getElementById('love-avatar-l').click();
                else { this.showDeleteL = !this.showDeleteL; if(this.showDeleteL) setTimeout(() => this.showDeleteL = false, 3000); }
            } else if (side === 'R') {
                if (!this.loveWidget.avatarR) document.getElementById('love-avatar-r').click();
                else { this.showDeleteR = !this.showDeleteR; if(this.showDeleteR) setTimeout(() => this.showDeleteR = false, 3000); }
            }
        },
        deleteLoveAvatar(side) {
            if (side === 'L') { this.loveWidget.avatarL = ''; this.showDeleteL = false; }
            if (side === 'R') { this.loveWidget.avatarR = ''; this.showDeleteR = false; }
            this.saveData();
        },

        // === 修复：抽签逻辑 (使用北京时间) ===
        drawFortune() {
            if (this.fortune.isFlipped) return;

            // 获取北京时间
            const today = this.getBeijingDate();
            
            const random = Math.floor(Math.random() * this.fortune.pool.length);
            this.fortune.current = this.fortune.pool[random];
            this.fortune.lastDate = today; // 存入北京时间
            this.fortune.isFlipped = true; 
            
            this.saveData(); 
        },

        triggerUpload(key) { 
            const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
            input.onchange = async (e) => { if(e.target.files[0]) { this.profile[key] = await this.fileToBase64(e.target.files[0]); this.saveData(); } };
            input.click();
        },
        handleProfileImgClick(type) {
            if (!this.profile[type]) this.triggerUpload(type);
            else {
                if (type === 'avatar') { this.showDeleteProfileAvatar = !this.showDeleteProfileAvatar; if(this.showDeleteProfileAvatar) setTimeout(()=>this.showDeleteProfileAvatar=false, 3000); }
                if (type === 'musicCover') { this.showDeleteMusicCover = !this.showDeleteMusicCover; if(this.showDeleteMusicCover) setTimeout(()=>this.showDeleteMusicCover=false, 3000); }
            }
        },
        deleteProfileImg(type) {
            this.profile[type] = ''; 
            if (type === 'avatar') this.showDeleteProfileAvatar = false;
            if (type === 'musicCover') this.showDeleteMusicCover = false;
            this.saveData();
        },
        selectMoodCheck(index) { this.moodCheck.selected = index; this.saveData(); },        selectMoodCheck(index) {
            console.log("Selected Mood Index:", index); // 1. 看看函数跑没跑
            
            this.moodCheck.selected = index;
            
            // 2. 强制重新获取当前时间，不依赖 cached timeString
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')} : ${now.getMinutes().toString().padStart(2, '0')}`;
            
            this.moodCheck.lastTime = timeStr;
            
            console.log("Recorded Time:", this.moodCheck.lastTime); // 3. 看看时间存进去没
            
            this.saveData();
        },
       resetMoodCheck() { this.moodCheck.selected = null; this.moodCheck.lastTime = ''; this.saveData(); },
    },
    mounted() {
        this.loadData(); 
        this.updateTime(); 
        setInterval(this.updateTime, 1000); 
        this.initBattery();
        this.calculateCountdown();
    }
};
