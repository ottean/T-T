// apps/desktop/desktop.js

const DesktopModule = {
    data() {
        return {
            // ... (核心数据保持不变，省略以节省空间，但请保留) ...
            widgetBg: '', 
            defaultAvatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            userAvatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            timeString: '12:45', dateString: '2026.02.08', dayString: 'Sunday',
            ringCircumference: 295, ringOffset: 0, batteryLevel: 100, headerText: 'Ɛ Lovely Day ⸝⋆* .〰 ★',
            todos: [
                { id: 1, text: '给猫咪喂罐头', done: false },
                { id: 2, text: '回复重要邮件', done: false },
                { id: 3, text: '去便利店买冰杯', done: false }
            ],
            // 照片墙数据
            photoWall: [
                { id: 1, url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&q=80', x: 50, y: 50, width: 80 },
                { id: 2, url: 'https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?w=400&q=80', x: 50, y: 50, width: 80 },
                { id: 3, url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', x: 50, y: 50, width: 80 },
                { id: 4, url: 'https://images.unsplash.com/photo-1516724562728-afc824a36e84?w=400&q=80', x: 50, y: 50, width: 80 },
                { id: 5, url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80', x: 50, y: 50, width: 80 }
            ],
            photoSettings: { bgImage: '', bgPosX: 50, bgPosY: 50, bgSize: 100, currentEditId: null, title: 'MEMORIES' },
            showEditor: false, showPhotoEditor: false, longPressTimer: null, 
            heroSettings: { bgImage: '', bgPosX: 50, bgPosY: 50, bgSize: 100, avatarPosX: 50, avatarPosY: 50, avatarSize: 100, textColor: '#ff9a8b' },

            // 全新 Remix 图标配置
            sideApps: [
                { id: 'messenger', name: 'Dialogue', icon: 'ri-message-3-line' }, 
                { id: 'profile',   name: 'Identity', icon: 'ri-passport-line' },
            ],

            extraApps: [
                { id: 'placeholder-1', name: 'Reserved', icon: 'ri-checkbox-blank-circle-line' },
                { id: 'placeholder-2', name: 'Reserved', icon: 'ri-checkbox-blank-circle-line' },
                { id: 'world-book', name: 'Archive', icon: 'ri-book-read-line' }, 
                { id: 'monitor',    name: 'Trace', icon: 'ri-map-pin-line' }
            ],

            dockApps: [
                { id: 'theater',    name: 'Theater', icon: 'ri-clapperboard-line' },
                { id: 'appearance', name: 'Vision', icon: 'ri-paint-brush-line' }, 
                { id: 'api-set',    name: 'Link', icon: 'ri-links-line' },
                { id: 'settings',   name: 'Control', icon: 'ri-equalizer-line' }
            ],
        }
    },
    computed: { currentEditPhoto() { return this.photoWall.find(p => p.id === this.photoSettings.currentEditId); } },
    methods: {
        saveData() {
            const dataToSave = {
                userAvatar: this.userAvatar, headerText: this.headerText, todos: this.todos,
                heroSettings: this.heroSettings, photoWall: this.photoWall,
                photoSettings: { ...this.photoSettings, currentEditId: null }
            };
            try { localStorage.setItem('ai_phone_data', JSON.stringify(dataToSave)); } catch (e) {}
        },
        loadData() {
            const saved = localStorage.getItem('ai_phone_data');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    this.userAvatar = parsed.userAvatar || this.defaultAvatar;
                    this.headerText = parsed.headerText; this.todos = parsed.todos;
                    Object.assign(this.heroSettings, parsed.heroSettings);
                    this.photoWall = parsed.photoWall || [];
                    Object.assign(this.photoSettings, parsed.photoSettings);
                } catch(e) { this.userAvatar = this.defaultAvatar; }
            } else { this.userAvatar = this.defaultAvatar; }
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
            this.ringOffset = this.ringCircumference - (this.ringCircumference * (this.batteryLevel / 100));
        },
        toggleTodo(index) { this.todos[index].done = !this.todos[index].done; this.saveData(); },
        triggerAvatarUpload() { document.getElementById('avatar-upload').click(); },
        async handleAvatarUpload(e) { if(e.target.files[0]) { this.userAvatar = await this.fileToBase64(e.target.files[0]); this.saveData(); } },
        openApp(id) { console.log("Open:", id); this.currentApp = id; }, // 简单的路由切换
        handleContextMenu() { this.openEditor(); },
        handleTouchStart() { this.longPressTimer = setTimeout(() => { this.openEditor(); }, 800); },
        handleTouchEnd() { clearTimeout(this.longPressTimer); },
        openEditor() { this.showEditor = true; },
        closeEditor() { this.showEditor = false; this.saveData(); },
        triggerHeroBgUpload() { if(!this.showEditor) document.getElementById('hero-bg-upload').click(); },
        async handleHeroBgUpload(e) { if(e.target.files[0]) { this.heroSettings.bgImage = await this.fileToBase64(e.target.files[0]); this.saveData(); } },
        resetTextColor() { this.heroSettings.textColor = '#ff9a8b'; },
        deleteBg() { 
            this.heroSettings.bgImage = ''; 
            // 重置滑块参数
            this.heroSettings.bgPosX = 50;
            this.heroSettings.bgPosY = 50;
            this.heroSettings.bgSize = 100;
            this.saveData(); 
        },
        deleteAvatar() { 
            this.userAvatar = ''; 
            this.heroSettings.avatarPosX = 50;
            this.heroSettings.avatarPosY = 50;
            this.heroSettings.avatarSize = 100;
            
            this.saveData(); 
        },
        handlePhotoContextMenu() { this.showPhotoEditor = true; },
        handlePhotoTouchStart() { this.longPressTimer = setTimeout(() => { this.showPhotoEditor = true; }, 800); },
        closePhotoEditor() { this.showPhotoEditor = false; this.photoSettings.currentEditId = null; this.saveData(); },
        triggerPhotoUpload() { document.getElementById('photo-wall-upload').click(); },
        async handlePhotoUpload(event) {
            const files = event.target.files;
            if (files && files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    const base64 = await this.fileToBase64(files[i]);
                    const randomWidth = Math.floor(Math.random() * 40) + 60;
                    this.photoWall.push({ id: Date.now() + i, url: base64, x: 50, y: 50, width: randomWidth });
                }
                this.saveData();
            }
        },
        selectPhotoToEdit(id) { this.photoSettings.currentEditId = id; },
        backToPhotoList() { this.photoSettings.currentEditId = null; },
        deletePhoto(index) { this.photoWall.splice(index, 1); },
        deleteCurrentPhoto() {
            const idx = this.photoWall.findIndex(p => p.id === this.photoSettings.currentEditId);
            if (idx !== -1) { this.photoWall.splice(idx, 1); this.backToPhotoList(); }
        },
        triggerPhotoBgUpload() { document.getElementById('photo-bg-upload').click(); },
        async handlePhotoBgUpload(e) { if(e.target.files[0]) { this.photoSettings.bgImage = await this.fileToBase64(e.target.files[0]); this.saveData(); } },
        deletePhotoBg() { this.photoSettings.bgImage = ''; }
    },
    mounted() {
        this.loadData(); this.updateTime(); setInterval(this.updateTime, 1000); this.initBattery();
    }
};
