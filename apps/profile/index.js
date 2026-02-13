// apps/profile/index.js

export default {
    name: 'IdentityApp',
    emits: ['switch-app'],
    data() {
        return {
            currentTab: 'char',
            users: [],
            chars: [],
            editingId: null,
            editingData: {} 
        }
    },
    computed: {
        currentList() {
            return this.currentTab === 'user' ? this.users : this.chars;
        },
        sortedList() {
            const list = [...this.currentList];
            return list.sort((a, b) => {
                if (a.isPinned !== b.isPinned) {
                    return a.isPinned ? -1 : 1;
                }
                const nameA = (a.name || '').toUpperCase();
                const nameB = (b.name || '').toUpperCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });
        }
    },
    methods: {
        goBack() { this.$emit('switch-app', 'desktop'); },
        saveLocal() {
            const data = { users: this.users, chars: this.chars };
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
                } catch(e) {}
            }
        },
        
        switchTab(tab) {
            this.currentTab = tab;
            this.editingId = null;
        },

        editItem(item) {
            this.editingId = item.id;
            this.editingData = JSON.parse(JSON.stringify(item));
            if(!this.editingData.themeColor) this.editingData.themeColor = '#ff9a8b';
        },

        togglePin(item) {
            item.isPinned = !item.isPinned;
            this.saveLocal();
        },

        saveEdit() {
            if (!this.editingData.name || this.editingData.name.trim() === '') {
                alert('请填写姓名 (Name)！');
                return;
            }
            if (!this.editingData.themeColor) this.editingData.themeColor = '#ff9a8b';

            const list = this.currentList;
            
            // 查找逻辑修改：因为导入覆盖可能会改变 ID，所以我们不能只靠 editingId 找了
            // 但这里我们是在“保存”这一步。
            // 如果是导入覆盖，我们在 handleEditImport 里其实应该直接改 list？
            // 不，保持当前逻辑：用户导入后只改了 editingData（预览），点了保存才写入 list。
            
            // 关键：如果 ID 变了，我们需要先删掉旧的（根据 editingId），再 push 新的？
            // 或者：直接视为修改。
            
            // 让我们看看 handleEditImport 怎么改比较稳。
            // 为了防止 ID 变化导致找不到旧数据，我们在保存时，应该根据 *进入编辑时的 ID* (this.editingId) 来定位旧数据。
            
            const index = list.findIndex(i => i.id === this.editingId);

            if (index !== -1) {
                // 找到了旧坑位，把新数据填进去（包括新 ID）
                list[index] = { ...this.editingData };
                // 更新当前的 editingId，以防用户连续保存
                this.editingId = this.editingData.id;
            } else {
                // 没找到旧坑位（极其罕见），就 push
                list.push({ ...this.editingData });
            }
            
            this.saveLocal();
            this.editingId = null; 
        },

        addNew() {
            const newId = Date.now();
            const base = {
                id: newId,
                name: '',
                nickname: '',
                avatar: '',
                bio: '',
                themeColor: '#ff9a8b', 
                isPinned: false
            };

            if (this.currentTab === 'char') {
                this.editingData = { ...base, world: '', dialogue: '', greeting: '' };
            } else {
                this.editingData = { ...base };
            }
            
            this.editingId = newId; 
        },

        deleteItem() {
            if (!confirm('确定要删除这个档案吗？')) return;
            if (this.currentTab === 'user') this.users = this.users.filter(i => i.id !== this.editingId);
            else this.chars = this.chars.filter(i => i.id !== this.editingId);
            this.saveLocal();
            this.editingId = null;
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
                    const MAX_SIZE = 300;
                    let width = img.width, height = img.height;
                    if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE/width; width = MAX_SIZE; } } 
                    else { if (height > MAX_SIZE) { width *= MAX_SIZE/height; height = MAX_SIZE; } }
                    canvas.width = width; canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    this.editingData.avatar = canvas.toDataURL('image/jpeg', 0.7);
                };
            };
        },

        handleExport() {
            const dataStr = JSON.stringify(this.editingData, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${this.editingData.name || 'Untitled'}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        // 场景 A：列表页导入 (新增)
        handleListImport(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target.result);
                    if (json.name === undefined) { alert('格式错误'); return; }
                    
                    if (confirm(`确定要导入新角色 [${json.name}] 吗？`)) {
                        // 列表导入必定是新增，所以强制生成新 ID
                        json.id = Date.now(); 
                        json.isPinned = false; 
                        
                        if(!json.themeColor) json.themeColor = '#ff9a8b';
                        
                        this.currentList.push(json);
                        this.saveLocal();
                        alert('导入成功！');
                    }
                } catch (err) { alert('JSON 解析错误'); }
            };
            reader.readAsText(file);
            e.target.value = '';
        },

        // ✅ 场景 B：编辑页导入 (覆盖) - 逻辑修正
        handleEditImport(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target.result);
                    if (json.name === undefined) { alert('格式错误'); return; }

                    if (confirm(`确定用导入的数据完全覆盖当前角色吗？\n(这将替换包括 ID、名字在内的所有信息)`)) {
                        // ✅ 修正：全量覆盖，包括 ID
                        // 如果 JSON 里有 ID 就用它的，没有就生成新的
                        if (!json.id) json.id = Date.now();
                        
                        this.editingData = { ...json };
                        
                        // 兼容检查
                        if(!this.editingData.themeColor) this.editingData.themeColor = '#ff9a8b';
                        
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
