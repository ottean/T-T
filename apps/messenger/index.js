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
            
            // Refactor: Local copy sync with Service
            localChatHistory: {}, 

            inputText: '',
            isTyping: false, 
            longPressTimer: null,
            quotingMsg: null,
            isMultiSelectMode: false,
            selectedMsgIds: [],

            // === Feature Dialog State ===
            showFeatureDialog: false,
            featureType: '',
            featureInputText: '',
            featureAmount: '', 
            featureSender: 'me',
            defaultCameraImg: 'https://i.postimg.cc/MHKmwm1N/tu-pian-yi-bei-xiao-mao-chi-diao.jpg',
            
            // === Transfer Dialog State ===
            showTransferDialog: false,
            currentTransferMsg: null,

            // === Preview State ===
            previewMsg: null,

            // === Video Call State ===
            videoCall: {
                active: false,
                isMinimized: false,
                status: 'idle',
                initiator: 'me',
                startTime: 0,
                durationStr: '00:00',
                timer: null,
                isPipSwapped: false,
                sessionId: null // [新增] 用于区分不同次通话，做聊天隔离
            },
            videoEditState: {
                visible: false,
                msgId: null,
                text: ''
            },
            // [新增] 视频设置状态
            videoSettings: {
                visible: false,
                bgImage: null, // 用户自定义背景，默认 null
                subtitleColorMe: '#ffeaa7', // 默认淡黄
                subtitleColorThem: '#ffffff', // 默认纯白
                blurAmount: 0 // 背景模糊度
            },

            // [修改] 视频编辑状态 (增加长按逻辑)
            videoEditState: {
                visible: false,
                msgId: null,
                text: ''
            },
            longPressTimer: null, // 复用长按计时器

        }
    },
    computed: {
        chatService() {
            return window.chatService; 
        },
        activeSessions() {
            const list = this.contacts.map(session => {
                const charData = this.allChars.find(c => c.id === session.charId) || { name: 'Unknown', avatar: '' };
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
        // [修改] 主界面聊天记录：过滤掉 isVideo=true 的消息
        currentMessages() {
            if (!this.currentSession) return [];
            const allMsgs = this.localChatHistory[this.currentSession.chatId] || [];
            return allMsgs.filter(m => !m.isVideo);
        },

        // [新增] 视频界面专用记录：只显示属于当前 Session 的视频消息
        currentVideoMessages() {
            if (!this.currentSession || !this.videoCall.active) return [];
            const allMsgs = this.localChatHistory[this.currentSession.chatId] || [];
            return allMsgs.filter(m => m.isVideo && m.videoSessionId === this.videoCall.sessionId);
        },

        featureTitle() {
            switch(this.featureType) {
                case 'voice': return 'Send Voice (Fake)';
                case 'camera': return 'Send Camera (Fake)';
                case 'transfer': return 'Send Transfer';
                default: return 'Feature';
            }
        },
        featureDesc() {
            switch(this.featureType) {
                case 'voice': return '输入文字，系统将自动根据字数生成语音条时长。';
                case 'camera': return '输入图片描述，系统将发送一张"被猫吃掉"的图片占位符。';
                default: return '';
            }
        },
        featurePlaceholder() {
            switch(this.featureType) {
                case 'voice': return '语音内容...';
                case 'camera': return '图片描述 (点击图片时显示)...';
                case 'transfer': return '备注 (选填)...';
                default: return 'Type here...';
            }
        }
    },
    watch: {
        view(newVal) { if (newVal === 'chat') this.$nextTick(this.scrollToBottom); },
        // [新增] 视频消息增加时，自动滚动字幕层到底部
        currentVideoMessages: {
            deep: true,
            handler() {
                this.$nextTick(() => {
                    const el = this.$refs.videoSubtitleArea;
                    if (el) el.scrollTop = el.scrollHeight;
                });
            }
        }
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
            
            if (this.chatService) {
                this.localChatHistory = this.chatService.chatHistory;
            }

            const contactsStr = localStorage.getItem('zs_mark_messenger_contacts');
            if (contactsStr) {
                try { 
                    const raw = JSON.parse(contactsStr);
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

        // === Service Event Handlers ===
        setupServiceListeners() {
            if (!this.chatService) return;

            // 1. 历史更新 (插入/删除/撤回)
            this.chatService.on('history-updated', () => {
                // 记录当前滚动位置距离底部的距离
                const container = this.$refs.chatBody;
                const oldScrollBottom = container ? container.scrollHeight - container.scrollTop : 0;

                // 刷新数据
                this.localChatHistory = JSON.parse(JSON.stringify(this.chatService.chatHistory));
                this.contacts = [...this.contacts];

                // 恢复滚动位置 (保持距离底部不变，视觉上就是“不动”)
                this.$nextTick(() => {
                    if (container) {
                        container.scrollTop = container.scrollHeight - oldScrollBottom;
                    }
                });
            });

            // 2. 新消息 (只有这个才强制滚到底部)
            this.chatService.on('new-message', ({ chatId, message }) => {
                this.localChatHistory = JSON.parse(JSON.stringify(this.chatService.chatHistory));
                this.contacts = [...this.contacts];

                if (this.currentSession && this.currentSession.chatId === chatId) {
                    // 如果是视频消息，watch 会处理滚动；如果是普通消息，这里处理
                    if (!message.isVideo) {
                        this.$nextTick(() => {
                            const container = this.$refs.chatBody;
                            if (container) container.scrollTop = container.scrollHeight;
                        });
                    }
                    if (navigator.vibrate && message.sender !== 'me') navigator.vibrate(10);
                }
            });

            this.chatService.on('generation-completed', ({ chatId }) => {
                const isBackground = this.view !== 'chat' || document.hidden || (this.currentSession && this.currentSession.chatId !== chatId);
                
                if (isBackground) {
                    const session = this.contacts.find(c => c.chatId === chatId);
                    if (!session) return;
                    
                    const char = this.allChars.find(c => c.id === session.charId);
                    const name = char ? (char.nickname || char.name) : 'Unknown';
                    const avatar = char ? char.avatar : '';
                    
                    const msgs = this.chatService.getMessages(chatId);
                    const lastMsg = msgs[msgs.length - 1];
                    let preview = '新消息';
                    if (lastMsg) {
                        if (lastMsg.type === 'voice') preview = '[语音]';
                        else if (lastMsg.type === 'image') preview = '[图片]';
                        else preview = lastMsg.text;
                    }

                    if (window.zsSystemNotify) {
                        window.zsSystemNotify({
                            title: name,
                            text: preview,
                            avatar: avatar,
                            chatId: chatId
                        });
                    }
                }
            });
            
            this.chatService.on('jump-to-chat', (chatId) => {
                const session = this.contacts.find(c => c.chatId === chatId);
                if (session) this.startChat(session);
            });

            this.chatService.on('status-change', ({ isTyping, chatId }) => {
                if (this.currentSession && this.currentSession.chatId === chatId) {
                    this.isTyping = isTyping;
                } else if (!chatId) {
                    this.isTyping = false;
                }
            });

            this.chatService.on('error', (msg) => {
                this.triggerToast(msg);
                this.isTyping = false;
            });

            this.chatService.on('trigger-video-call', ({ chatId, initiator }) => {
                if (this.currentSession && this.currentSession.chatId === chatId) {
                    this.startVideoCall(initiator);
                }
            });
        },
        removeServiceListeners() {
             if (!this.chatService) return;
        },

        // === Feature Dialog Logic ===
        openFeatureDialog(type) {
            if (type === 'video') {
                this.startVideoCall('me');
                return;
            }
            this.featureType = type;
            this.featureInputText = '';
            this.featureAmount = '';
            this.featureSender = 'me'; 
            this.showFeatureDialog = true;
            this.showToolbar = false; 
        },

        // === Video Call Logic (Updated) ===
        startVideoCall(initiator) {
            this.videoCall.active = true;
            this.videoCall.isMinimized = false;
            this.videoCall.initiator = initiator;
            this.videoCall.durationStr = '00:00';
            this.videoCall.sessionId = Date.now(); // [新增] 生成唯一通话ID
            this.showToolbar = false;

            if (initiator === 'me') {
                this.videoCall.status = 'calling_me'; 
                // 模拟3秒后自动接听
                setTimeout(() => {
                    if (this.videoCall.active && this.videoCall.status === 'calling_me') {
                        this.acceptVideoCall();
                        this.triggerToast('对方已接通');
                    }
                }, 3000);
            } else {
                this.videoCall.status = 'calling_them'; 
            }
        },

        acceptVideoCall() {
            this.videoCall.status = 'connected';
            this.videoCall.startTime = Date.now();
            if (this.videoCall.timer) clearInterval(this.videoCall.timer);
            this.videoCall.timer = setInterval(this.updateVideoTimer, 1000);
            
            // [新增] 接通后先发一句开场白（存为视频消息）
            if (this.videoCall.initiator === 'me') {
                setTimeout(() => {
                    this.sendVideoGhostMessage('them', '喂？看得到我吗？');
                }, 500);
            }
        },

        endVideoCall(reason) {
            clearInterval(this.videoCall.timer);
            let msgText = this.videoCall.durationStr; 
            let msgStatus = 'ended';

            if (reason === 'canceled') { msgText = '已取消'; msgStatus = 'canceled'; }
            if (reason === 'rejected') { msgText = '已拒绝'; msgStatus = 'rejected'; }
            
            // 往主聊天界面插入一条“通话记录”存根
            this.chatService.addMessage(this.currentSession.chatId, {
                type: 'video_call',
                sender: this.videoCall.initiator, 
                text: msgText,     
                status: msgStatus,
                videoSessionId: this.videoCall.sessionId // 关联ID
            });

            this.videoCall.active = false;
            this.videoCall.status = 'idle';
            this.videoCall.isMinimized = false;
        },

        // [新增] 辅助方法：发送“幽灵消息” (isVideo=true)
        sendVideoGhostMessage(sender, text) {
            this.chatService.addMessage(this.currentSession.chatId, {
                sender: sender,
                type: 'text',
                text: text,
                isVideo: true, // 标记为视频消息
                videoSessionId: this.videoCall.sessionId // 归档用
            });
        },

        updateVideoTimer() {
            const now = Date.now();
            const diff = Math.floor((now - this.videoCall.startTime) / 1000);
            const m = Math.floor(diff / 60).toString().padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');
            this.videoCall.durationStr = `${m}:${s}`;
        },
        
        toggleFeatureSender() {
            this.featureSender = this.featureSender === 'me' ? 'them' : 'me';
        },

        confirmFeatureSend() {
            if (this.featureType !== 'transfer' && !this.featureInputText.trim()) {
                this.triggerToast('内容不能为空');
                return;
            }

            if (this.featureType === 'transfer') {
                if (!this.featureAmount) { this.triggerToast('请输入金额'); return; }
                const amountVal = parseFloat(this.featureAmount);
                if (isNaN(amountVal) || amountVal <= 0) { this.triggerToast('金额必须大于 0'); return; }
            }

            const msgData = {
                sender: this.featureSender,
                text: this.featureInputText, 
                type: this.featureType
            };

            if (this.featureType === 'voice') {
                const len = this.featureInputText.length;
                let duration = Math.ceil(len / 3);
                if (duration < 1) duration = 1;
                if (duration > 60) duration = 60;
                msgData.duration = duration;
                msgData.isPlaying = false;
                msgData.showTranscribed = false;
            } 
            else if (this.featureType === 'transfer') {
                msgData.amount = parseFloat(this.featureAmount).toFixed(2);
                msgData.status = 'pending';
            }

            this.chatService.addMessage(this.currentSession.chatId, msgData);
            
            this.showFeatureDialog = false;
            this.$nextTick(this.scrollToBottom);
        },

        // === Image Upload Logic ===
        handleImageUpload(e) {
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
                    const MAX_SIZE = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
                    } else {
                        if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    const base64 = canvas.toDataURL('image/jpeg', 0.7);
                    
                    this.chatService.addMessage(this.currentSession.chatId, {
                        sender: 'me',
                        text: base64, 
                        type: 'image'
                    });
                    this.showToolbar = false;
                    this.$nextTick(this.scrollToBottom);
                };
            };
            e.target.value = ''; 
        },

        // === Interaction Logic ===
        toggleVoiceText(msg) {
            if (this.isMultiSelectMode) return;
            if (msg.showTranscribed === undefined) {
                msg.showTranscribed = true;
            } else {
                msg.showTranscribed = !msg.showTranscribed;
            }
            if (!msg.showTranscribed && navigator.vibrate) navigator.vibrate(20);
            
            if (msg.showTranscribed && !msg.isPlaying) {
                msg.isPlaying = true;
                setTimeout(() => { msg.isPlaying = false; }, 1000);
            }
            
        },

        openPreview(msg) { this.previewMsg = msg; },
        closePreview() { this.previewMsg = null; },

        handleTransferClick(msg) {
            this.currentTransferMsg = msg;
            this.showTransferDialog = true;
        },

        processTransfer(action) {
            if (!this.currentTransferMsg) return;
            // 1. 关键修复：同步更新 Service 中的原始数据
            const chatId = this.currentSession.chatId;
            const msgId = this.currentTransferMsg.id;
            
            // 确保 chatService 有数据
            if (this.chatService.chatHistory[chatId]) {
                const realMsg = this.chatService.chatHistory[chatId].find(m => m.id === msgId);
                if (realMsg) {
                    realMsg.status = action; // 修改源数据
                }
            }

            // 2. 修改本地视图副本（为了立即反馈）
            this.currentTransferMsg.status = action;
            
            // 3. 保存并广播
            this.chatService.saveHistory();
            const sysText = action === 'received' 
                ? `你领取了 ${this.targetChar.nickname || this.targetChar.name} 的转账`
                : `你退还了转账`;
            
            this.chatService.addMessage(this.currentSession.chatId, {
                type: 'system',
                text: sysText
            });

            this.showTransferDialog = false;
            this.triggerToast(action === 'received' ? '已收款' : '已退还');
        },

        // === Reroll Logic ===
        handleReroll() {
            if (this.isTyping) return;
            const chatId = this.currentSession.chatId;
            const msgs = this.chatService.getMessages(chatId);
            
            if (!msgs || msgs.length === 0) {
                this.triggerToast('没有消息可以重来');
                return;
            }

            const lastMsg = msgs[msgs.length - 1];
            
            if (lastMsg.sender === 'me') {
                this.triggerToast('重新生成回复中...');
                this.receiveNextMessage();
            } else {
                let deletedCount = 0;
                for (let i = msgs.length - 1; i >= 0; i--) {
                    if (msgs[i].sender !== 'me') { deletedCount++; } else { break; }
                }

                if (deletedCount > 0) {
                    // Service 删除数据
                    const newHistory = msgs.slice(0, msgs.length - deletedCount);
                    this.chatService.chatHistory[chatId] = newHistory; // 直接改 Service 内存
                    this.chatService.saveHistory(); // 触发保存
                    
                    // 🚨 关键修复：强制同步回本地
                    // 以前这里没更新 this.localChatHistory，所以界面没变
                    this.localChatHistory = { ...this.chatService.chatHistory }; 
                    
                    this.triggerToast(`已撤销 ${deletedCount} 条回复，重新生成中...`);
                    this.receiveNextMessage();
                } else {
                    this.receiveNextMessage();
                }
            }
            this.showToolbar = false;
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

            const chatId = this.currentSession ? this.currentSession.chatId : null;

            if (this.menuType === 'session') {
                if (action === 'delete') {
                    if (confirm('确定删除该会话吗？')) {
                        this.contacts = this.contacts.filter(c => c.chatId !== this.menuTarget.chatId);
                        this.saveContactList();
                        delete this.chatService.chatHistory[this.menuTarget.chatId];
                        this.chatService.saveHistory();
                        this.triggerToast('会话已删除');
                    }
                }
            }
            
            if ((this.menuType === 'message' || this.menuType === 'system-msg') && chatId) {
                const history = this.chatService.getMessages(chatId);
                const msgIndex = history.findIndex(m => m.id === this.menuTarget.id);
                
                if (msgIndex !== -1) {
                    if (action === 'delete') {
                        this.chatService.deleteMessage(chatId, this.menuTarget.id);
                        this.triggerToast('已删除');
                    } else if (action === 'recall') {
                        const senderName = this.menuTarget.sender === 'me' 
                            ? (this.currentUser.nickname || this.currentUser.name || '我') 
                            : (this.targetChar.nickname || this.targetChar.name);
                        
                        history[msgIndex] = {
                            id: this.menuTarget.id,
                            type: 'system', 
                            text: `"${senderName}" 撤回了一条消息`,
                            originalText: this.menuTarget.text,
                            time: this.menuTarget.time
                        };
                        this.chatService.saveHistory();
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
                this.chatService.chatHistory[chatId] = this.chatService.chatHistory[chatId].filter(m => !this.selectedMsgIds.includes(m.id));
                this.chatService.saveHistory();
                this.exitMultiSelect();
                this.triggerToast('批量删除成功');
            }
        },

        handleDialogConfirm() {
            if (!this.dialogText.trim()) return;
            const chatId = this.currentSession.chatId;
            const history = this.chatService.chatHistory[chatId];
            const targetIndex = history.findIndex(m => m.id === this.dialogTargetMsg.id);
            
            if (targetIndex === -1) {
                this.triggerToast('原消息不存在');
                this.showDialog = false;
                return;
            }

            if (this.dialogMode === 'edit') {
                const msg = history[targetIndex];
                msg.text = this.dialogText;
                
                if (msg.type === 'voice') {
                    const len = this.dialogText.length;
                    let duration = Math.ceil(len / 3);
                    if (duration < 1) duration = 1;
                    if (duration > 60) duration = 60;
                    msg.duration = duration;
                }
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

            this.chatService.saveHistory();
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
                const defaultUser = this.allUsers.length > 0 ? this.allUsers[0] : { id: 'default', name: '', avatar: '' };
                this.createChatSession(defaultUser);
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
            this.currentUser = this.allUsers.find(u => u.id === session.userId) || { id: 'default', name: '', avatar: '' };
            this.view = 'chat';
            
            const history = this.chatService.getMessages(session.chatId);

            if (this.chatService.isTyping && this.chatService.generatingChatId === session.chatId) {
                this.isTyping = true;
            } else {
                this.isTyping = false;
            }

            if ((!history || history.length === 0) && this.targetChar.greeting) {
                const lines = this.targetChar.greeting.split('\n');
                lines.forEach((line, index) => {
                    if (line.trim()) {
                        this.chatService.addMessage(session.chatId, { 
                            id: Date.now() + index, 
                            sender: 'them', 
                            text: line, 
                            type: 'text' 
                        });
                    }
                });
            }
        },

        handleEnterKey() { if (this.inputText.trim()) this.sendMessage(); },
        handleSendOrReceive() {
            if (this.isTyping) return;
            if (this.inputText.trim()) this.sendMessage();
            else this.receiveNextMessage();
        },
        
        // [修改] 发送逻辑：区分视频消息和普通消息
        sendMessage() {
            const text = this.inputText.trim();
            if (!text) return;
            
            // 判断：如果是视频通话中，发送视频消息
            if (this.videoCall.active && this.videoCall.status === 'connected') {
                this.sendVideoGhostMessage('me', text);
                this.inputText = '';
                this.receiveNextVideoMessage(); // 触发视频回复
            } else {
                // 普通聊天
                const msgData = { 
                    sender: 'me', 
                    text: text, 
                    type: 'text' 
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
                
                this.chatService.addMessage(this.currentSession.chatId, msgData);
                this.inputText = '';
                this.$nextTick(() => {
                    const textarea = document.querySelector('.input-capsule-glass textarea');
                    if (textarea) textarea.style.height = 'auto';
                });
            }
        },

        // [新增] 专门处理视频回复（生成后打上 Video 标记）
        async receiveNextVideoMessage() {
            const history = this.chatService.getMessages(this.currentSession.chatId);
            const lastMsgId = history.length > 0 ? history[history.length-1].id : 0;

            this.isTyping = true; 

            const onGenComplete = ({ chatId }) => {
                if (chatId !== this.currentSession.chatId) return;
                
                const msgs = this.chatService.getMessages(chatId);
                let changed = false;
                msgs.forEach(m => {
                    // 找到刚刚生成的新消息，强制标记为视频消息
                    if (m.id > lastMsgId && m.sender === 'them' && !m.isVideo) {
                        m.isVideo = true;
                        m.videoSessionId = this.videoCall.sessionId;
                        changed = true;
                    }
                });
                
                if (changed) {
                    this.chatService.saveHistory();
                    this.localChatHistory = JSON.parse(JSON.stringify(this.chatService.chatHistory));
                }
                
                this.chatService.off('generation-completed', onGenComplete);
                this.isTyping = false;
            };

            this.chatService.on('generation-completed', onGenComplete);
            
            this.chatService.receiveNextMessage(this.currentSession.chatId, this.targetChar, this.currentUser);
        },

        // [新增] 视频内的 Reroll
        handleVideoReroll() {
            if (this.isTyping) return;
            const msgs = this.chatService.getMessages(this.currentSession.chatId);
            // 倒序查找本 Session 的最后一条 AI 消息并删除
            for (let i = msgs.length - 1; i >= 0; i--) {
                const m = msgs[i];
                if (m.videoSessionId === this.videoCall.sessionId && m.sender === 'them') {
                    msgs.splice(i, 1);
                    this.chatService.saveHistory();
                    this.localChatHistory = JSON.parse(JSON.stringify(this.chatService.chatHistory));
                    this.triggerToast('重来中...');
                    this.receiveNextVideoMessage();
                    return;
                }
            }
            this.triggerToast('没有可重来的消息');
        },

        async receiveNextMessage() {
            this.chatService.receiveNextMessage(
                this.currentSession.chatId, 
                this.targetChar, 
                this.currentUser
            );
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
            const msgs = this.localChatHistory[chatId];
            if (!msgs || msgs.length === 0) return 'New Chat';
            const last = msgs[msgs.length - 1];
            if (last.isVideo) return '[视频通话]'; // 如果是视频消息，列表预览显示这个
            if (last.type === 'system') return '[系统消息]';
            if (last.type === 'voice') return '[语音]';
            if (last.type === 'camera') return '[图片]';
            if (last.type === 'image') return '[图片]';
            if (last.type === 'transfer') return `[转账] ¥${last.amount}`;
            return last.text;
        },
        getLastMsgTime(chatId) {
            const msgs = this.localChatHistory[chatId];
            if (!msgs || msgs.length === 0) return '';
            return msgs[msgs.length - 1].time;
        },
        getLastMsgTimestamp(chatId) {
            const msgs = this.localChatHistory[chatId];
            if (!msgs || msgs.length === 0) return 0;
            return msgs[msgs.length - 1].id;
        },

        // [新增] Video 操作辅助方法
        minimizeVideo() { 
            this.videoCall.isMinimized = true; 
        },
        restoreVideo() { 
            this.videoCall.isMinimized = false; 
            // 恢复时自动滚到底部
            this.$nextTick(() => {
                const el = this.$refs.videoSubtitleArea;
                if (el) el.scrollTop = el.scrollHeight;
            });
        },

        // [重写] 打开编辑面板
        openVideoEdit(msg) {
            this.videoEditState.msgId = msg.id;
            this.videoEditState.text = msg.text;
            this.videoEditState.visible = true;
        },
        
        saveVideoEdit() {
            if (!this.videoEditState.text.trim()) return;
            const history = this.chatService.chatHistory[this.currentSession.chatId];
            const targetMsg = history.find(m => m.id === this.videoEditState.msgId);
            if (targetMsg) {
                targetMsg.text = this.videoEditState.text;
                this.chatService.saveHistory();
                this.localChatHistory = JSON.parse(JSON.stringify(this.chatService.chatHistory));
            }
            this.videoEditState.visible = false;
        },

        // [新增] 关闭编辑面板
        closeVideoEdit() {
            this.videoEditState.visible = false;
        },
        // [新增] 视频设置相关
        openVideoSettings() { this.videoSettings.visible = true; },
        closeVideoSettings() { this.videoSettings.visible = false; },
        
        handleVideoBgUpload(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                this.videoSettings.bgImage = evt.target.result;
            };
            reader.readAsDataURL(file);
        },
        
        setSubtitleColor(type, color) {
            if (type === 'me') this.videoSettings.subtitleColorMe = color;
            else this.videoSettings.subtitleColorThem = color;
        },

        // [重写] 字幕长按编辑逻辑 (防误触)
        handleSubtitleTouchStart(msg) {
            this.longPressTimer = setTimeout(() => {
                if (navigator.vibrate) navigator.vibrate(50);
                this.openVideoEdit(msg);
            }, 600); // 600ms 长按触发
        },
        handleSubtitleTouchEnd() {
            clearTimeout(this.longPressTimer);
        },
    },
    mounted() {
        this.loadData();
        this.setupServiceListeners();
    },
    beforeUnmount() {
        this.removeServiceListeners();
    }
}
