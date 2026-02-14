// apps/messenger/index.js

export default {
    name: 'MessengerApp',
    emits: ['switch-app'],

    data() {
        return {
            view: 'list', 
            showImporter: false,
            importerStep: 1, 
            selectedCharForSession: null, 
            showToast: false,
            toastMessage: '',
            showToolbar: false,
            menuVisible: false,
            menuType: '', 
            menuTarget: null, 
            showDialog: false,
            dialogMode: '', 
            dialogText: '',
            dialogSender: 'me', 
            dialogTargetMsg: null, 
            currentSession: null, 
            targetChar: null,     
            currentUser: null,    
            allUsers: [],
            allChars: [],
            contacts: [], 
            chatHistory: {}, 
            inputText: '',
            isTyping: false, 
            longPressTimer: null,
            quotingMsg: null,
            isMultiSelectMode: false,
            selectedMsgIds: [] 
        }
    },
    computed: {
        activeSessions() {
            const list = this.contacts.map(session => {
                const charData = this.allChars.find(c => c.id === session.charId) || { name: 'Unknown', avatar: '' };
                // ✅ 修正：找不到 User 时返回空对象，不给默认名
                const userData = this.allUsers.find(u => u.id === session.userId) || { id: 'default', name: '', avatar: '' };
                return { ...session, charData, userData };
            });
            return list.sort((a, b) => {
                const timeA = this.getLastMsgTimestamp(a.chatId) || a.chatId;
                const timeB = this.getLastMsgTimestamp(b.chatId) || b.chatId;
                return timeB - timeA;
            });
        },
        availableToImport() {
            return [...this.allChars].sort((a, b) => {
                if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
                const nameA = (a.name || '').toUpperCase();
                const nameB = (b.name || '').toUpperCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });
        },
        availableUsers() { 
            return [...this.allUsers].sort((a, b) => {
                if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
                const nameA = (a.name || '').toUpperCase();
                const nameB = (b.name || '').toUpperCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });
        },
        currentMessages() {
            if (!this.currentSession) return [];
            return this.chatHistory[this.currentSession.chatId] || [];
        }
    },
    watch: {
        view(newVal) { if (newVal === 'chat') this.$nextTick(this.scrollToBottom); },
        currentMessages: { handler() { this.$nextTick(this.scrollToBottom); }, deep: true }
    },
    methods: {
        goToIdentity() { this.$emit('switch-app', 'profile'); },
        goBack() {
            if (this.view === 'chat') {
                if (this.isMultiSelectMode) {
                    this.exitMultiSelect();
                } else {
                    this.view = 'list';
                    this.currentSession = null;
                    this.targetChar = null;
                    this.currentUser = null;
                    this.showToolbar = false;
                    this.quotingMsg = null;
                }
            } else {
                this.$emit('switch-app', 'desktop');
            }
        },

        loadData() {
            const identityStr = localStorage.getItem('zs_mark_identity');
            if (identityStr) {
                try {
                    const data = JSON.parse(identityStr);
                    this.allUsers = data.users || [];
                    this.allChars = data.chars || [];
                } catch (e) {}
            }
            const historyStr = localStorage.getItem('zs_mark_chat_history');
            if (historyStr) { try { this.chatHistory = JSON.parse(historyStr); } catch (e) {} }
            const contactsStr = localStorage.getItem('zs_mark_messenger_contacts');
            if (contactsStr) {
                try { 
                    const raw = JSON.parse(contactsStr);
                    // ✅ 修正：默认 User ID 为 'default'
                    const defaultUserId = this.allUsers.length > 0 ? this.allUsers[0].id : 'default';
                    if (raw.length > 0) {
                        this.contacts = raw.map(item => {
                            if (typeof item !== 'object') return { chatId: item, charId: item, userId: defaultUserId };
                            return { ...item, userId: item.userId || defaultUserId };
                        });
                    } else { this.contacts = []; }
                } catch (e) { this.contacts = []; }
            }
        },

        handleContextMenu(e, type, item) { 
            if (this.isMultiSelectMode) return;
            this.openMenu(type, item); 
        },
        handleTouchStart(type, item) {
            if (this.isMultiSelectMode) return;
            this.longPressTimer = setTimeout(() => {
                this.openMenu(type, item);
                if (navigator.vibrate) navigator.vibrate(50);
            }, 600);
        },
        handleTouchEnd() { clearTimeout(this.longPressTimer); },

        openMenu(type, item) {
            if (type === 'message' && item.type === 'system') {
                this.menuType = 'system-msg';
            } else {
                this.menuType = type;
            }
            this.menuTarget = item;
            this.menuVisible = true;
        },
        closeMenu() { this.menuVisible = false; this.menuTarget = null; },

        handleSystemClick(msg) {
            if (this.isMultiSelectMode) {
                this.toggleSelection(msg);
                return;
            }
            if (msg.originalText) {
                alert(`撤回的内容是：\n\n${msg.originalText}`);
            }
        },

        handleMenuAction(action) {
            if (action === 'cancel') { this.closeMenu(); return; }

            if (this.menuType === 'session') {
                if (action === 'delete') {
                    if (confirm('确定删除该会话吗？')) {
                        this.contacts = this.contacts.filter(c => c.chatId !== this.menuTarget.chatId);
                        this.saveContactList();
                        delete this.chatHistory[this.menuTarget.chatId];
                        localStorage.setItem('zs_mark_chat_history', JSON.stringify(this.chatHistory));
                        this.triggerToast('会话已删除');
                    }
                }
            }
            
            if (this.menuType === 'message' || this.menuType === 'system-msg') {
                const chatId = this.currentSession.chatId;
                const msgIndex = this.chatHistory[chatId].findIndex(m => m.id === this.menuTarget.id);
                
                if (msgIndex !== -1) {
                    if (action === 'delete') {
                        this.chatHistory[chatId].splice(msgIndex, 1);
                        this.triggerToast('已删除');
                    } else if (action === 'recall') {
                        const senderName = this.menuTarget.sender === 'me' 
                            ? (this.currentUser.nickname || this.currentUser.name || '我') 
                            : (this.targetChar.nickname || this.targetChar.name);
                        
                        this.chatHistory[chatId][msgIndex] = {
                            id: this.menuTarget.id,
                            type: 'system', 
                            text: `"${senderName}" 撤回了一条消息`,
                            originalText: this.menuTarget.text,
                            time: this.menuTarget.time
                        };
                        this.triggerToast('消息已撤回');
                    } else if (action === 'copy') {
                        navigator.clipboard.writeText(this.menuTarget.text).then(() => {
                            this.triggerToast('已复制');
                        });
                    } else if (action === 'edit') {
                        this.dialogMode = 'edit';
                        this.dialogText = this.menuTarget.text;
                        this.dialogTargetMsg = this.menuTarget;
                        this.showDialog = true;
                    } else if (action === 'quote') {
                        this.quotingMsg = this.menuTarget;
                    } else if (action === 'insert-up') {
                        this.dialogMode = 'insert-up';
                        this.dialogText = '';
                        this.dialogSender = this.menuTarget.sender;
                        this.dialogTargetMsg = this.menuTarget;
                        this.showDialog = true;
                    } else if (action === 'insert-down') {
                        this.dialogMode = 'insert-down';
                        this.dialogText = '';
                        this.dialogSender = this.menuTarget.sender;
                        this.dialogTargetMsg = this.menuTarget;
                        this.showDialog = true;
                    } else if (action === 'multi') {
                        this.isMultiSelectMode = true;
                        this.selectedMsgIds = [this.menuTarget.id];
                        this.showToolbar = false; 
                    }
                    localStorage.setItem('zs_mark_chat_history', JSON.stringify(this.chatHistory));
                }
            }
            this.closeMenu();
        },

        toggleSelection(msg) {
            if (!this.isMultiSelectMode) return;
            const idx = this.selectedMsgIds.indexOf(msg.id);
            if (idx > -1) {
                this.selectedMsgIds.splice(idx, 1);
            } else {
                this.selectedMsgIds.push(msg.id);
            }
        },
        
        exitMultiSelect() {
            this.isMultiSelectMode = false;
            this.selectedMsgIds = [];
        },

        deleteSelectedMessages() {
            if (this.selectedMsgIds.length === 0) return;
            if (confirm(`确定删除选中的 ${this.selectedMsgIds.length} 条消息吗？`)) {
                const chatId = this.currentSession.chatId;
                this.chatHistory[chatId] = this.chatHistory[chatId].filter(m => !this.selectedMsgIds.includes(m.id));
                localStorage.setItem('zs_mark_chat_history', JSON.stringify(this.chatHistory));
                this.exitMultiSelect();
                this.triggerToast('批量删除成功');
            }
        },

        handleDialogConfirm() {
            if (!this.dialogText.trim()) return;
            const chatId = this.currentSession.chatId;
            const history = this.chatHistory[chatId];
            const targetIndex = history.findIndex(m => m.id === this.dialogTargetMsg.id);
            
            if (targetIndex === -1) {
                this.triggerToast('原消息不存在');
                this.showDialog = false;
                return;
            }

            if (this.dialogMode === 'edit') {
                history[targetIndex].text = this.dialogText;
                this.triggerToast('修改成功');
            } else {
                const newMsg = {
                    id: Date.now(),
                    sender: this.dialogSender,
                    text: this.dialogText,
                    type: 'text',
                    time: this.dialogTargetMsg.time 
                };
                
                if (this.dialogMode === 'insert-up') {
                    history.splice(targetIndex, 0, newMsg);
                } else {
                    history.splice(targetIndex + 1, 0, newMsg);
                }
                this.triggerToast('插入成功');
            }

            localStorage.setItem('zs_mark_chat_history', JSON.stringify(this.chatHistory));
            this.showDialog = false;
        },

        toggleDialogSender() {
            this.dialogSender = this.dialogSender === 'me' ? 'them' : 'me';
        },

        cancelQuote() {
            this.quotingMsg = null;
        },

        openImporter() { this.showImporter = true; this.importerStep = 1; this.selectedCharForSession = null; },
        selectCharAndNext(char) {
            this.selectedCharForSession = char;
            if (this.allUsers.length <= 1) {
                // ✅ 修正：没有用户时，使用 'default' ID，且不给名字，防止界面出现奇怪的 "Guest"
                const defaultUser = this.allUsers.length > 0 ? this.allUsers[0] : { id: 'default', name: '', avatar: '' };
                this.createChatSession(defaultUser);
                // 只有真的有用户时才 Toast
                if (defaultUser.id !== 'default') {
                    this.triggerToast(`已自动使用身份: ${defaultUser.nickname || defaultUser.name}`);
                }
            } else { this.importerStep = 2; }
        },
        createChatSession(user) {
            const char = this.selectedCharForSession;
            const newSession = { chatId: Date.now(), charId: char.id, userId: user.id, createTime: Date.now() };
            this.contacts.unshift(newSession);
            this.saveContactList();
            this.showImporter = false;
            this.startChat(newSession);
        },
        saveContactList() { localStorage.setItem('zs_mark_messenger_contacts', JSON.stringify(this.contacts)); },

        startChat(session) {
            if (this.menuVisible) return;
            this.currentSession = session;
            this.targetChar = this.allChars.find(c => c.id === session.charId) || { name: 'Unknown', themeColor: '#ff9a8b' };
            // ✅ 修正：如果 ID 是 default，给空对象
            this.currentUser = this.allUsers.find(u => u.id === session.userId) || { id: 'default', name: '', avatar: '' };
            this.view = 'chat';
            if ((!this.chatHistory[session.chatId] || this.chatHistory[session.chatId].length === 0) && this.targetChar.greeting) {
                if (this.targetChar.greeting) {
                    const lines = this.targetChar.greeting.split('\n');
                    lines.forEach((line, index) => {
                        if (line.trim()) {
                            this.addMessage({ id: Date.now() + index, sender: 'them', text: line, type: 'text', time: this.getCurrentTime() });
                        }
                    });
                }
            }
        },

        handleEnterKey() { if (this.inputText.trim()) this.sendMessage(); },
        handleSendOrReceive() {
            if (this.isTyping) return;
            if (this.inputText.trim()) this.sendMessage();
            else this.receiveNextMessage();
        },
        sendMessage() {
            const text = this.inputText.trim();
            if (!text) return;
            
            const msgData = { 
                id: Date.now(), 
                sender: 'me', 
                text: text, 
                type: 'text', 
                time: this.getCurrentTime() 
            };

            if (this.quotingMsg) {
                const quoteName = this.quotingMsg.sender === 'me' 
                    ? (this.currentUser.nickname || this.currentUser.name || '我')
                    : (this.targetChar.nickname || this.targetChar.name);
                
                msgData.quote = {
                    name: quoteName,
                    text: this.quotingMsg.text
                };
                this.quotingMsg = null; 
            }

            this.addMessage(msgData);
            this.inputText = '';
            
            this.$nextTick(() => {
                const textarea = document.querySelector('.input-capsule-glass textarea');
                if (textarea) textarea.style.height = 'auto';
            });
        },
        receiveNextMessage() {
            if (this.isTyping) return;
            this.isTyping = true;
            setTimeout(() => {
                let replyText = "Interesting...";
                const char = this.targetChar;
                if (char.dialogue) {
                    const lines = char.dialogue.split('\n').filter(l => l.trim() !== '');
                    if (lines.length > 0) replyText = lines[Math.floor(Math.random() * lines.length)];
                }
                this.receiveMessage(replyText);
                this.isTyping = false; 
                this.$nextTick(this.scrollToBottom);
            }, 1000);
        },
        addMessage(msg) {
            if (!this.currentSession) return;
            const chatId = this.currentSession.chatId;
            if (!this.chatHistory[chatId]) this.chatHistory[chatId] = [];
            this.chatHistory[chatId].push(msg);
            localStorage.setItem('zs_mark_chat_history', JSON.stringify(this.chatHistory));
        },
        receiveMessage(text) {
            this.addMessage({ id: Date.now(), sender: 'them', text, type: 'text', time: this.getCurrentTime() });
        },
        triggerToast(message) {
            this.toastMessage = message;
            this.showToast = true;
            setTimeout(() => { this.showToast = false; }, 3000);
        },
        toggleToolbar() { this.showToolbar = !this.showToolbar; },
        getCurrentTime() {
            const now = new Date();
            return `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
        },
        scrollToBottom() {
            const container = this.$refs.chatBody;
            if (container) container.scrollTop = container.scrollHeight;
        },
        adjustTextarea(e) {
            const el = e.target;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 100) + 'px';
        },
        getLastMsgPreview(chatId) {
            const msgs = this.chatHistory[chatId];
            if (!msgs || msgs.length === 0) return 'New Chat';
            const last = msgs[msgs.length - 1];
            if (last.type === 'system') return '[系统消息]';
            return last.text;
        },
        getLastMsgTime(chatId) {
            const msgs = this.chatHistory[chatId];
            if (!msgs || msgs.length === 0) return '';
            return msgs[msgs.length - 1].time;
        },
        getLastMsgTimestamp(chatId) {
            const msgs = this.chatHistory[chatId];
            if (!msgs || msgs.length === 0) return 0;
            return msgs[msgs.length - 1].id;
        }
    },
    mounted() {
        this.loadData();
    }
}
