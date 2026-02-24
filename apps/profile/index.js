// apps/profile/index.js

export default {
    name: 'IdentityApp',
    emits: ['switch-app'],
    data() {
        return {
            currentTab: 'char',
            users: [],
            chars: [],
            worlds: [], 
            currentFolderId: null, 
            editingId: null,
            editingData: {},
            showAvatarDelete: false
        }
    },
    computed: {
        folders() {
            return this.worlds.filter(w => w.type === 'folder');
        },
        displayList() {
            let list = [];
            if (this.currentTab === 'user') list = this.users;
            else if (this.currentTab === 'char') list = this.chars;
            else if (this.currentTab === 'world') {
                list = this.worlds.filter(w => w.folderId === this.currentFolderId);
            }
            
            return [...list].sort((a, b) => {
                if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
                const nameA = (a.name || a.title || '').toUpperCase();
                const nameB = (b.name || b.title || '').toUpperCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });
        },
        currentFolderCards() {
            if (this.currentTab === 'world' && this.editingData.type === 'folder') {
                return this.worlds.filter(w => w.folderId === this.editingId && w.type === 'card');
            }
            return [];
        }
    },
    methods: {
        getSourceList() {
            if (this.currentTab === 'user') return this.users;
            if (this.currentTab === 'char') return this.chars;
            return this.worlds;
        },
        
        getFolderItemCount(folderId) {
            return this.worlds.filter(w => w.folderId === folderId && w.type === 'card').length;
        },
        
        getFolderName(id) {
            const f = this.worlds.find(w => w.id === id);
            return f ? f.title : '未分类';
        },

        goBack() { 
            if (this.currentTab === 'world' && this.currentFolderId !== null && !this.editingId) {
                this.currentFolderId = null;
            } else {
                this.$emit('switch-app', 'desktop'); 
            }
        },

        saveLocal() {
            const data = { users: this.users, chars: this.chars, worlds: this.worlds };
            try {
                localStorage.setItem('zs_mark_identity', JSON.stringify(data));
            } catch (e) {
                alert('保存失败：数据量过大。');
            }
        },

        loadLocal() {
            const saved = localStorage.getItem('zs_mark_identity');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if(parsed.users) this.users = parsed.users;
                    if(parsed.chars) this.chars = parsed.chars;
                    if(parsed.worlds) this.worlds = parsed.worlds;
                } catch(e) {}
            }
        },
        
        switchTab(tab) {
            if (this.currentTab === tab && !this.editingId) {
                this.addNew();
                return;
            }
            this.currentTab = tab;
            this.editingId = null;
            if (tab === 'world') this.currentFolderId = null;
        },

        toggleBoundChar(charId) {
            if (!this.editingData.boundChars) this.editingData.boundChars = [];
            const index = this.editingData.boundChars.indexOf(charId);
            if (index > -1) {
                this.editingData.boundChars.splice(index, 1);
            } else {
                this.editingData.boundChars.push(charId);
            }
        },

        toggleEnabledCard(cardId) {
            if (!this.editingData.enabledCards) this.editingData.enabledCards = [];
            const index = this.editingData.enabledCards.indexOf(cardId);
            if (index > -1) {
                this.editingData.enabledCards.splice(index, 1);
            } else {
                this.editingData.enabledCards.push(cardId);
            }
        },

        editItem(item) {
            this.showAvatarDelete = false;
            if (this.currentTab === 'world' && item.type === 'folder') {
                this.currentFolderId = item.id;
            } else {
                this.editingId = item.id;
                this.editingData = JSON.parse(JSON.stringify(item));
                if(!this.editingData.themeColor) this.editingData.themeColor = '#ff9a8b';
                
                if (this.currentTab === 'world') {
                    if (this.editingData.type === 'card') {
                        // 旧数据兼容：如果没有 triggerType，默认回退到 keyword (因为旧卡片可能有关键词)
                        if (!this.editingData.triggerType) this.editingData.triggerType = 'keyword';
                    } else {
                        if (!this.editingData.bindingType) this.editingData.bindingType = 'disabled';
                        if (!this.editingData.boundChars) this.editingData.boundChars = [];
                        if (!this.editingData.enabledCardsType) this.editingData.enabledCardsType = 'all';
                        if (!this.editingData.enabledCards) this.editingData.enabledCards = [];
                    }
                }
            }
        },

        editCurrentFolder() {
            this.showAvatarDelete = false;
            const folder = this.worlds.find(w => w.id === this.currentFolderId);
            if (folder) {
                this.editingId = folder.id;
                this.editingData = JSON.parse(JSON.stringify(folder));
                
                if (!this.editingData.bindingType) this.editingData.bindingType = 'disabled';
                if (!this.editingData.boundChars) this.editingData.boundChars = [];
                if (!this.editingData.enabledCardsType) this.editingData.enabledCardsType = 'all';
                if (!this.editingData.enabledCards) this.editingData.enabledCards = [];
            }
        },

        togglePin(item) {
            item.isPinned = !item.isPinned;
            this.saveLocal();
        },

        addNew() {
            this.showAvatarDelete = false;
            const newId = Date.now();
            const base = { id: newId, themeColor: '#ff9a8b', isPinned: false };

            if (this.currentTab === 'char') {
                this.editingData = { ...base, name: '', nickname: '', avatar: '', bio: '', world: '', dialogue: '', greeting: '' };
            } else if (this.currentTab === 'user') {
                this.editingData = { ...base, name: '', nickname: '', avatar: '', bio: '' };
            } else {
                const isInsideFolder = !!this.currentFolderId;
                this.editingData = { 
                    ...base, 
                    title: '', 
                    type: 'card', 
                    folderId: this.currentFolderId, 
                    triggerType: 'constant', // ✅ 修改：新建时默认是常驻
                    keywords: '', 
                    content: '',
                    bindingType: 'disabled',
                    boundChars: [],
                    enabledCardsType: 'all',
                    enabledCards: []
                };
            }
            
            this.editingId = newId; 
        },

        handleAvatarClick() {
            if (this.editingData.avatar) {
                this.showAvatarDelete = !this.showAvatarDelete;
            } else {
                this.triggerUpload();
            }
        },

        removeAvatar() {
            this.editingData.avatar = '';
            this.showAvatarDelete = false;
        },

        saveEdit() {
            if (this.currentTab === 'world') {
                if (!this.editingData.title || this.editingData.title.trim() === '') { alert('请填写名称 (Title)！'); return; }
                if (this.editingData.type === 'folder') this.editingData.folderId = null; 
            } else {
                if (!this.editingData.name || this.editingData.name.trim() === '') { alert('请填写姓名 (Name)！'); return; }
            }
            if (!this.editingData.themeColor) this.editingData.themeColor = '#ff9a8b';

            const list = this.getSourceList();
            const index = list.findIndex(i => i.id === this.editingId);

            if (index !== -1) {
                list[index] = { ...this.editingData };
                this.editingId = this.editingData.id;
            } else {
                list.push({ ...this.editingData });
            }
            
            this.saveLocal();
            this.editingId = null; 
        },

        deleteItem() {
            if (this.currentTab === 'world' && this.editingData.type === 'folder') {
                const hasChildren = this.worlds.some(w => w.folderId === this.editingId);
                if (hasChildren && !confirm('此操作将同时删除该文件夹下的所有词条，确定吗？')) return;
                this.worlds = this.worlds.filter(w => w.folderId !== this.editingId && w.id !== this.editingId);
            } else {
                if (!confirm('确定要删除这个档案吗？')) return;
                const list = this.getSourceList();
                const index = list.findIndex(i => i.id === this.editingId);
                if (index !== -1) list.splice(index, 1);
            }
            
            this.saveLocal();
            this.editingId = null;
            if (this.currentFolderId === this.editingId) this.currentFolderId = null;
        },

        triggerUpload() { this.$refs.fileInput.click(); },
        
        handleUpload(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let width = img.width, height = img.height;
                    if (width > height) { if (width > 300) { height *= 300/width; width = 300; } } 
                    else { if (height > 300) { width *= 300/height; height = 300; } }
                    canvas.width = width; canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    this.editingData.avatar = canvas.toDataURL('image/jpeg', 0.7);
                    this.showAvatarDelete = false;
                };
            };
            e.target.value = '';
        },

        downloadJSON(data, filename) {
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${filename}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        exportCurrentFolder() {
            const folder = this.worlds.find(w => w.id === this.currentFolderId);
            if (!folder) return;

            const exportData = {
                isWorldFolder: true,
                folder: folder,
                cards: this.worlds.filter(w => w.folderId === this.currentFolderId)
            };
            this.downloadJSON(exportData, folder.title);
        },

        handleExport() {
            let exportData = this.editingData;
            
            if (this.currentTab === 'world' && this.editingData.type === 'folder') {
                exportData = {
                    isWorldFolder: true,
                    folder: this.editingData,
                    cards: this.worlds.filter(w => w.folderId === this.editingData.id)
                };
            }
            
            this.downloadJSON(exportData, this.editingData.name || this.editingData.title || 'Untitled');
        },

        handleListImport(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target.result);
                    
                    if (json.isWorldFolder) {
                        if (confirm(`确定要导入文件夹 [${json.folder.title}] 及其 ${json.cards.length} 个词条吗？`)) {
                            const newId = Date.now();
                            if (!json.folder.bindingType) json.folder.bindingType = 'disabled';
                            if (!json.folder.boundChars) json.folder.boundChars = [];
                            if (!json.folder.enabledCardsType) json.folder.enabledCardsType = 'all';
                            if (!json.folder.enabledCards) json.folder.enabledCards = [];
                            
                            json.folder.id = newId;
                            json.folder.isPinned = false;
                            this.worlds.push(json.folder);
                            
                            json.cards.forEach((c, idx) => {
                                c.id = newId + idx + 1;
                                c.folderId = newId;
                                if (c.type === 'card' && !c.triggerType) c.triggerType = 'keyword'; 
                                this.worlds.push(c);
                            });
                            this.saveLocal();
                            alert('文件夹及内容导入成功！');
                        }
                        return;
                    }
                    
                    if (!json.name && !json.title) { alert('格式错误'); return; }
                    const displayName = json.name || json.title;
                    if (confirm(`确定要导入 [${displayName}] 吗？`)) {
                        json.id = Date.now(); 
                        json.isPinned = false; 
                        if(!json.themeColor) json.themeColor = '#ff9a8b';
                        
                        if (this.currentTab === 'world') {
                            json.folderId = this.currentFolderId;
                            if (json.type === 'card' && !json.triggerType) json.triggerType = 'keyword';
                            if (json.type === 'folder') {
                                if (!json.bindingType) json.bindingType = 'disabled';
                                if (!json.boundChars) json.boundChars = [];
                            }
                        }
                        
                        this.getSourceList().push(json);
                        this.saveLocal();
                        alert('导入成功！');
                    }
                } catch (err) { alert('JSON 解析错误'); }
            };
            reader.readAsText(file);
            e.target.value = '';
        },

        handleEditImport(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target.result);

                    if (json.isWorldFolder && this.editingData.type === 'folder') {
                        if (confirm(`确定用导入的数据完全覆盖当前文件夹及里面的所有词条吗？`)) {
                            this.worlds = this.worlds.filter(w => w.folderId !== this.editingId);
                            
                            if (!json.folder.bindingType) json.folder.bindingType = 'disabled';
                            if (!json.folder.boundChars) json.folder.boundChars = [];
                            if (!json.folder.enabledCardsType) json.folder.enabledCardsType = 'all';
                            if (!json.folder.enabledCards) json.folder.enabledCards = [];
                            
                            json.folder.id = this.editingId;
                            this.editingData = { ...json.folder };
                            
                            json.cards.forEach((c, idx) => {
                                c.id = Date.now() + idx + 1;
                                c.folderId = this.editingId;
                                if (c.type === 'card' && !c.triggerType) c.triggerType = 'keyword';
                                this.worlds.push(c);
                            });
                            alert('覆盖成功！请点击保存档案。');
                        }
                        return;
                    }

                    if (!json.name && !json.title) { alert('格式错误'); return; }
                    if (confirm(`确定用导入的数据完全覆盖当前档案吗？`)) {
                        if (!json.id) json.id = Date.now();
                        this.editingData = { ...json };
                        if(!this.editingData.themeColor) this.editingData.themeColor = '#ff9a8b';
                        
                        if (this.currentTab === 'world') {
                            if (this.editingData.type === 'card' && !this.editingData.triggerType) this.editingData.triggerType = 'keyword';
                            if (this.editingData.type === 'folder') {
                                if (!this.editingData.bindingType) this.editingData.bindingType = 'disabled';
                                if (!this.editingData.boundChars) this.editingData.boundChars = [];
                            }
                        }
                        alert('覆盖成功!ID 已更新，请点击保存档案。');
                    }
                } catch (err) { alert('JSON 解析错误'); }
            };
            reader.readAsText(file);
            e.target.value = '';
        }
    },
    mounted() {
        this.loadLocal();
    }
}
