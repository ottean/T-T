// apps/desktop/index.js

export default {
    name: 'DesktopComponent', // 给组件起个名，便于调试
    emits: ['switch-app'],    // 声明组件会触发的事件
    
    data() {
        return {
            currentPage: 0, 
            // === 核心数据 (从原 desktop.js 复制过来) ===
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
                { id: 5, url: 'https://i.postimg.cc/TwBCN1fP/lini.png', x: 50, y: 50, width: 80 },
                { id: 6, url: 'https://i.postimg.cc/zfcj3vLV/niaoni.png', x: 50, y: 50, width: 80 }
            ],
            
            photoSettings: { 
                bgImage: '', bgPosX: 50, bgPosY: 50, bgSize: 100, 
                currentEditId: null, 
                title: '我们需要更多Sariel!' 
            },

            showEditor: false, showPhotoEditor: false, 
            heroSettings: { bgImage: '', bgPosX: 50, bgPosY: 50, bgSize: 100, avatarPosX: 50, avatarPosY: 50, avatarSize: 100, textColor: '#ff9a8b' },
            
            countdown: {
                title: 'ˋˏᰔᩚˎˊ˗', targetDate: '2025-11-28', days: 0, isFuture: false, showEditor: false, 
                bgImage: '', bgSize: 100, bgPosX: 50, bgPosY: 50, textColor: '#ff9a8b'
            },
            isDraggingSlider: false,

            loveWidget: {
                title: '✨·Zoの恋爱日记°♡', subtitle: '·˶╹-╹˶ ', avatarL: '', avatarR: '', label: '恋爱进度值', days: '318'
            },
            showDeleteL: false, showDeleteR: false,

            fortune: {
                lastDate: '', current: null, isAnimating: false, isFlipped: false, lastDrawDate: '',
                pool: [
                    { level: '大吉', good: '写代码一次过', bad: '喝凉水塞牙' },
                    { level: '中吉', good: '遇见修狗', bad: '忘带钥匙' },
                    { level: '小吉', good: '奶茶半价', bad: '久坐不动' }
                ]
            },

            profile: {
                bgImage: '', avatar: '', sticker1: '🎧', sticker2: '🖤', musicCover: '',
                id: '@书签大王是猫猫', sign: '✨·“你是最特别的存在”··〰··ʚɞ',
                info: 'MBTI: ACAT\n生日:11.20', bio: '每日掉毛量:致力于让每一本书都穿上毛衣\n捕鼠能力:见到老鼠可能会先打个招呼', tag: '性格: 腼腆\nIP: 港岛'
            },
            showDeleteProfileAvatar: false, showDeleteMusicCover: false,

            moodCheck: {
                selected: null, lastTime: '', 
                options: [
                    { emoji: 'OvO', color: '#ffeaa7', text: '美滋滋' },
                    { emoji: '-_-', color: '#dfe6e9', text: '无语' },
                    { emoji: 'QAQ', color: '#74b9ff', text: '想哭' },
                    { emoji: 'o_o', color: '#81ecec', text: '发呆' },
                    { emoji: 'zzz', color: '#a29bfe', text: '困困' },
                    { emoji: '>_<', color: '#ff7675', text: '抓狂' },
                    { emoji: '^3^', color: '#fab1a0', text: '亲亲' },
                    { emoji: 'T_T', color: '#55efc4', text: '泪奔' },
                    { emoji: 'OwO', color: '#fd79a8', text: '哇哦' }
                ] 
            },

            // 侧边栏应用
            sideApps: [
                { id: 'messenger', name: 'Messeger', icon: 'ri-message-3-line' }, // 这里的ID对应 apps/messenger 文件夹
                { id: 'theater',    name: 'Theater', icon: 'ri-clapperboard-line' },
            ],
            extraApps: [
                { id: 'datanase', name: 'Database', icon: 'ri-book-read-line' }, 
                { id: 'trace',    name: 'Trace', icon: 'ri-map-pin-line' }
            ],
            page2Apps: [
                { id: 'diary',      name: 'Diary',    icon: 'ri-book-3-line' },
                { id: 'check',      name: 'Check',    icon: 'ri-smartphone-line' },
                { id: 'shop',       name: 'Shop',     icon: 'ri-shopping-bag-3-line' },
                { id: 'music',      name: 'Music',    icon: 'ri-disc-line' },
                { id: 'forum',      name: 'Forum',    icon: 'ri-discuss-line' }
            ],
            dockApps: [
                { id: 'profile',   name: 'Profile', icon: 'ri-passport-line' },
                { id: 'vision', name: 'Vision', icon: 'ri-paint-brush-line' }, 
                { id: 'api-set',    name: 'Api', icon: 'ri-links-line' },
                { id: 'settings',   name: 'Settings', icon: 'ri-equalizer-line' }
            ],
        }
    },
    computed: { currentEditPhoto() { return this.photoWall.find(p => p.id === this.photoSettings.currentEditId); } },
    methods: {
        // === 关键修改：打开 App 触发事件 ===
        openApp(id) { 
            console.log("Desktop requesting open:", id);
            this.$emit('switch-app', id); 
        },

        // === 原有逻辑保持不变 (省略部分实现细节以节省篇幅，请直接把原 desktop.js 的 methods 拷进来) ===
        saveData() {
            const dataToSave = {
                userAvatar: this.userAvatar, headerText: this.headerText, todos: this.todos,
                heroSettings: this.heroSettings, photoWall: this.photoWall,
                photoSettings: { ...this.photoSettings, currentEditId: null },
                countdown: { ...this.countdown, showEditor: false },
                loveWidget: this.loveWidget, fortune: this.fortune, profile: this.profile, moodCheck: this.moodCheck
            };
            try { localStorage.setItem('ai_phone_data', JSON.stringify(dataToSave)); } catch (e) {}
        },
        loadData() {
            // ... (原逻辑)
            const saved = localStorage.getItem('ai_phone_data');
            if(saved) {
                try {
                    const parsed = JSON.parse(saved);
                    Object.assign(this, parsed); // 简写，实际请按需赋值避免覆盖默认结构
                    // 修复 moodCheck 结构丢失问题
                    if (parsed.moodCheck) Object.assign(this.moodCheck, parsed.moodCheck); 
                } catch(e){}
            }
            this.calculateCountdown();
        },
        // ... (其他所有 helper 函数：fileToBase64, updateTime, initBattery, handleScroll, handleAvatarUpload 等等)
        // 请务必把 desktop.js 中所有的 methods 完整复制到这里
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
            this.ringOffset = this.ringCircumference - (this.ringCircumference * (this.batteryLevel / 100));
        },
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
        toggleTodo(index) { this.todos[index].done = !this.todos[index].done; this.saveData(); },
        openEditor() { this.showEditor = true; },
        closeEditor() { this.showEditor = false; this.saveData(); },
        triggerHeroBgUpload() { document.getElementById('hero-bg-upload').click(); },
        async handleHeroBgUpload(e) { if(e.target.files[0]) { this.heroSettings.bgImage = await this.fileToBase64(e.target.files[0]); this.saveData(); } },
        resetTextColor() { this.heroSettings.textColor = '#ff9a8b'; },
        deleteBg() { this.heroSettings.bgImage = ''; this.saveData(); },
        triggerAvatarUpload() { document.getElementById('avatar-upload').click(); },
        async handleAvatarUpload(e) { if(e.target.files[0]) { this.userAvatar = await this.fileToBase64(e.target.files[0]); this.saveData(); } },
        deleteAvatar() { this.userAvatar = ''; this.saveData(); },
        openPhotoEditor() { this.showPhotoEditor = true; },
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
        calculateCountdown() {
            const target = new Date(this.countdown.targetDate); const today = new Date();
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
        handleAvatarClick(side) {
             if(side==='L') { if(!this.loveWidget.avatarL) document.getElementById('love-avatar-l').click(); else { this.showDeleteL = !this.showDeleteL; if(this.showDeleteL) setTimeout(()=>this.showDeleteL=false,3000); } }
             else { if(!this.loveWidget.avatarR) document.getElementById('love-avatar-r').click(); else { this.showDeleteR = !this.showDeleteR; if(this.showDeleteR) setTimeout(()=>this.showDeleteR=false,3000); } }
        },
        async handleLoveAvatarL(e) { if(e.target.files[0]) { this.loveWidget.avatarL = await this.fileToBase64(e.target.files[0]); this.saveData(); } },
        async handleLoveAvatarR(e) { if(e.target.files[0]) { this.loveWidget.avatarR = await this.fileToBase64(e.target.files[0]); this.saveData(); } },
        deleteLoveAvatar(side) { if(side==='L') this.loveWidget.avatarL=''; else this.loveWidget.avatarR=''; this.saveData(); },
        drawFortune() {
            if(this.fortune.isFlipped) return;
            const r = Math.floor(Math.random()*this.fortune.pool.length);
            this.fortune.current = this.fortune.pool[r];
            this.fortune.lastDate = new Date().toISOString().split('T')[0];
            this.fortune.isFlipped = true;
            this.saveData();
        },
        handleProfileImgClick(type) {
            if(!this.profile[type]) this.triggerUpload(type);
            else { 
                if(type==='avatar') { this.showDeleteProfileAvatar=!this.showDeleteProfileAvatar; if(this.showDeleteProfileAvatar) setTimeout(()=>this.showDeleteProfileAvatar=false,3000); }
                else { this.showDeleteMusicCover=!this.showDeleteMusicCover; if(this.showDeleteMusicCover) setTimeout(()=>this.showDeleteMusicCover=false,3000); }
            }
        },
        triggerUpload(key) {
            const input = document.createElement('input'); input.type='file'; input.accept='image/*';
            input.onchange = async(e)=>{ if(e.target.files[0]) { this.profile[key] = await this.fileToBase64(e.target.files[0]); this.saveData(); } };
            input.click();
        },
        deleteProfileImg(type) { this.profile[type]=''; this.saveData(); },
        selectMoodCheck(idx) { this.moodCheck.selected = idx; this.moodCheck.lastTime = this.timeString; this.saveData(); },
        resetMoodCheck() { this.moodCheck.selected = null; this.moodCheck.lastTime = ''; this.saveData(); }
    },
    mounted() {
        this.loadData();
        this.updateTime();
        setInterval(this.updateTime, 1000);
        this.initBattery();
    }
};
