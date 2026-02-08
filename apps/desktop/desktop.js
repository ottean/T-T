// apps/desktop/desktop.js

const DesktopModule = {
    data() {
        return {
            // === 核心数据 ===
            widgetBg: '', 
            defaultAvatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            userAvatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            
            timeString: '12:45',
            dateString: '2026.02.08',
            dayString: 'Sunday',
            
            ringCircumference: 295, 
            ringOffset: 0,
            batteryLevel: 100,
            headerText: 'Ɛ Lovely Day ⸝⋆* .〰 ★',
            
            todos: [
                { id: 1, text: '给猫咪喂罐头', done: false },
                { id: 2, text: '回复重要邮件', done: false },
                { id: 3, text: '去便利店买冰杯', done: false }
            ],

            // === 照片墙数据 (对象数组) ===
            photoWall: [
                { id: 1, url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&q=80', x: 50, y: 50, width: 80 },
                { id: 2, url: 'https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?w=400&q=80', x: 50, y: 50, width: 80 },
                { id: 3, url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', x: 50, y: 50, width: 80 },
                { id: 4, url: 'https://images.unsplash.com/photo-1516724562728-afc824a36e84?w=400&q=80', x: 50, y: 50, width: 80 },
                { id: 5, url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80', x: 50, y: 50, width: 80 }
            ],
            
            // 照片墙设置
            photoSettings: {
                bgImage: '',
                bgPosX: 50,
                bgPosY: 50,
                bgSize: 100,
                currentEditId: null,
                title: 'MEMORIES' // 相册标题
            },

            // 侧边应用
            sideApps: [
                { id: 'messenger', name: '信使', icon: 'fa-solid fa-comment-dots' },
                { id: 'gallery', name: '相册', icon: 'fa-solid fa-image' }
            ],
            
            // 底部扩展应用
            extraApps: [
                { id: 'func-1', name: '日历', icon: 'fa-regular fa-calendar' },
                { id: 'func-2', name: '天气', icon: 'fa-solid fa-cloud-sun' },
                { id: 'func-3', name: '文件', icon: 'fa-regular fa-folder-open' },
                { id: 'func-4', name: '更多', icon: 'fa-solid fa-border-all' }
            ],

            // 底部Dock
            dockApps: [
                { id: 'theater', name: '剧场', icon: 'fa-solid fa-book-open' },
                { id: 'memo', name: '备忘录', icon: 'fa-solid fa-note-sticky' },
                { id: 'music-app', name: '音乐', icon: 'fa-solid fa-music' },
                { id: 'settings', name: '设置', icon: 'fa-solid fa-gear' }
            ],

            // 状态管理
            showEditor: false, 
            showPhotoEditor: false, 
            longPressTimer: null, 
            
            // Hero设置
            heroSettings: {
                bgImage: '', 
                bgPosX: 50,
                bgPosY: 50, 
                bgSize: 100,
                avatarPosY: 50, 
                textColor: '#ff9a8b', 
            },
        }
    },
    computed: {
        currentEditPhoto() {
            return this.photoWall.find(p => p.id === this.photoSettings.currentEditId);
        }
    },
    methods: {
        updateTime() {
            const now = new Date();
            this.timeString = `${now.getHours().toString().padStart(2, '0')} : ${now.getMinutes().toString().padStart(2, '0')}`;
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            this.dateString = `${now.getFullYear()}.${(now.getMonth()+1).toString().padStart(2,'0')}.${now.getDate().toString().padStart(2,'0')}`;
            this.dayString = days[now.getDay()];
        },
        initBattery() {
            if ('getBattery' in navigator) {
                navigator.getBattery().then(b => { this.updateBattery(b); b.addEventListener('levelchange', () => this.updateBattery(b)); });
            } else { this.updateBattery({ level: 1 }); }
        },
        updateBattery(battery) { 
            this.batteryLevel = Math.round(battery.level * 100);
            const percentage = this.batteryLevel / 100;
            this.ringOffset = this.ringCircumference - (this.ringCircumference * percentage);
        },
        toggleTodo(index) { this.todos[index].done = !this.todos[index].done; },
        
        triggerAvatarUpload() { document.getElementById('avatar-upload').click(); },
        handleAvatarUpload(e) { if(e.target.files[0]) this.userAvatar = URL.createObjectURL(e.target.files[0]); },
        openApp(id) { console.log("Open:", id); },

        // Hero Editor
        handleContextMenu() { this.openEditor(); },
        handleTouchStart() { this.longPressTimer = setTimeout(() => { this.openEditor(); }, 800); },
        handleTouchEnd() { clearTimeout(this.longPressTimer); },
        openEditor() { this.showEditor = true; },
        closeEditor() { this.showEditor = false; },
        triggerHeroBgUpload() { if(!this.showEditor) document.getElementById('hero-bg-upload').click(); },
        handleHeroBgUpload(e) { if(e.target.files[0]) this.heroSettings.bgImage = URL.createObjectURL(e.target.files[0]); },
        resetTextColor() { this.heroSettings.textColor = '#ff9a8b'; },
        deleteBg() { this.heroSettings.bgImage = ''; },
        deleteAvatar() { this.userAvatar = this.defaultAvatar; },

        // Photo Editor
        handlePhotoContextMenu() { this.showPhotoEditor = true; },
        handlePhotoTouchStart() { this.longPressTimer = setTimeout(() => { this.showPhotoEditor = true; }, 800); },
        closePhotoEditor() { this.showPhotoEditor = false; this.photoSettings.currentEditId = null; },
        
        triggerPhotoUpload() { document.getElementById('photo-wall-upload').click(); },
        handlePhotoUpload(event) {
            const files = event.target.files;
            if (files && files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    const randomWidth = Math.floor(Math.random() * 40) + 60;
                    this.photoWall.push({
                        id: Date.now() + i, 
                        url: URL.createObjectURL(files[i]),
                        x: 50, y: 50, width: randomWidth
                    });
                }
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
        handlePhotoBgUpload(e) { if(e.target.files[0]) this.photoSettings.bgImage = URL.createObjectURL(e.target.files[0]); },
        deletePhotoBg() { this.photoSettings.bgImage = ''; }
    },
    mounted() {
        this.updateTime();
        setInterval(this.updateTime, 1000);
        this.initBattery();
    }
};
