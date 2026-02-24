// js/chatService.js

export class ChatService {
    constructor() {
        if (ChatService.instance) return ChatService.instance;
        ChatService.instance = this;

        this.chatHistory = {};
        this.contacts = [];
        this.isTyping = false;
        this.generatingChatId = null; 
        this.eventListeners = {}; 

        this.loadData();
    }

    // === Event Bus ===
    on(event, callback) {
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        this.eventListeners[event].push(callback);
    }

    off(event, callback) {
        if (!this.eventListeners[event]) return;
        this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }

    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(cb => cb(data));
        }
    }

    // === Data Management ===
    loadData() {
        const historyStr = localStorage.getItem('zs_mark_chat_history');
        if (historyStr) {
            try { this.chatHistory = JSON.parse(historyStr); } catch (e) { console.error(e); }
        }
        
        const contactsStr = localStorage.getItem('zs_mark_messenger_contacts');
        if (contactsStr) {
            try { this.contacts = JSON.parse(contactsStr); } catch (e) {}
        }
    }

    saveHistory() {
        localStorage.setItem('zs_mark_chat_history', JSON.stringify(this.chatHistory));
        this.emit('history-updated', this.chatHistory);
    }

    getMessages(chatId) {
        return this.chatHistory[chatId] || [];
    }

    // === Message Actions ===
    
    addMessage(chatId, msg) {
        if (!this.chatHistory[chatId]) this.chatHistory[chatId] = [];
        
        // 默认字段补全
        if (!msg.id) msg.id = Date.now() + Math.random();
        if (!msg.time) msg.time = this.getCurrentTime();

        // 语音转文字状态初始化 (原逻辑)
        if (msg.type === 'voice' && msg.showTranscribed === undefined) {
            msg.showTranscribed = false; 
        }

        this.chatHistory[chatId].push(msg);
        this.saveHistory();
        
        this.emit('new-message', { chatId, message: msg });
    }

    deleteMessage(chatId, msgId) {
        if (!this.chatHistory[chatId]) return;
        this.chatHistory[chatId] = this.chatHistory[chatId].filter(m => m.id !== msgId);
        this.saveHistory();
    }

    // === AI Logic Core ===

    async receiveNextMessage(chatId, targetChar, currentUser) {
        if (this.isTyping) return;
        
        // 1. 读取 API 配置
        let config = null;
        try {
            const activeStr = localStorage.getItem('zs_mark_api_config');
            if (activeStr) config = JSON.parse(activeStr);
        } catch(e) {}

        if (!config || !config.apiKey) {
            try {
                const presetsStr = localStorage.getItem('zs_mark_api_presets');
                if (presetsStr) {
                    const presets = JSON.parse(presetsStr);
                    if (presets.length > 0) config = presets[0];
                }
            } catch(e) {}
        }

        if (!config || !config.apiKey) {
            this.emit('error', '请先在 Link App 配置 API');
            return;
        }

        this.isTyping = true;
        this.generatingChatId = chatId;
        this.emit('status-change', { isTyping: true, chatId });

        try {
            // 2. 构建上下文
            const messages = this.buildContext(chatId, targetChar, currentUser, config);

            // 3. 发送请求 (包含完整的重试逻辑)
            const responseText = await this.callLLM(messages, config);

            // 4. 解析并入库
            await this.processAIResponse(chatId, responseText);

        } catch (e) {
            console.error("LLM Error:", e);
            this.emit('error', `API Error: ${e.message}`);
            // 失败时添加一个系统提示，方便调试 (原逻辑)
            this.addMessage(chatId, {
                type: 'system',
                text: `连接失败: ${e.message}`,
                sender: 'system' 
            });
        } finally {
            this.isTyping = false;
            this.generatingChatId = null;
            this.emit('status-change', { isTyping: false, chatId: null });
            this.emit('generation-completed', { chatId });
        }
    }

    // 构建 Prompt (严格还原，并加入世界书解析)
    buildContext(chatId, char, user, config = {}) {
        const history = this.chatHistory[chatId] || [];
        
        // ✅ 修改点：动态读取上下文长度
        // 如果 config 里有 contextLimit 就用它，没有就默认 50 条
        // 50 条对于 GPT-3.5/4 来说是一个比较平衡的数字
        let limit = 50;
        if (config && config.contextLimit) {
            limit = parseInt(config.contextLimit);
        }
        // 确保至少有 1 条
        if (limit < 1) limit = 20;

        const recentMsgs = history.slice(-limit); 
        // 1. 提取世界书/破限内容
        const worldBookText = this.getWorldBookContent(char.id, recentMsgs);

        // 2. 拼接基础系统设定
        let systemContent = `你正在进行一场角色扮演 (Roleplay)。
你的角色: ${char.name}
昵称: ${char.nickname || char.name}
简介: ${char.bio || '无'}
世界观: ${char.world || '现代日常'}

你的对话对象 (User):
名字: ${user.nickname || user.name || 'User'}
简介: ${user.bio || '无'}

【高级指令协议 (Advanced Actions)】
除了回复文字，你还可以执行以下操作 (XML标签)：
1. 💸 接收/退还转账：
   - 如果 User 发了转账，你想收下，请回复：<cmd:transfer_action id="[转账消息的ID]" action="received" />
   - 如果你想退还，请回复：<cmd:transfer_action id="[转账消息的ID]" action="returned" />   
2. ↩️ 撤回你的消息：
   - 只要你觉得刚才说错了，可以回复：<cmd:recall_last />   
3. 💬 引用回复：
   - <cmd:quote text="[引用的文字]">你的回复内容</cmd:quote>

【指令协议 (Protocol)】
你可以使用以下 XML 标签来执行特殊动作 (不要在标签内包含多余解释)：
1. 发送伪语音: <cmd:voice>语音转文字的内容</cmd:voice>
2. 发送伪照片: <cmd:camera>照片的画面描述</cmd:camera>
3. 发起转账: <cmd:transfer amount="100">备注信息</cmd:transfer> (金额必须大于0)
4. 发起视频通话: <cmd:video_call>them</cmd:video_call> (仅在非常亲密或剧情需要时使用)

【回复规则】
1. 沉浸在角色中，不要暴露你是 AI。
2. 回复简短自然，口语化。
3. 如果想连续发多条消息，请用换行符分隔。`;

        // 3. 注入世界书/常驻破限 (放在核心规则之后，拥有最高优先级)
        if (worldBookText) {
            systemContent += `\n\n【世界书 / 附加设定 / 强制规则】\n${worldBookText}`;
        }

        // 4. 注入对话示例
        if (char.dialogue) {
            systemContent += `\n\n【对话示例 (参考语气)】\n${char.dialogue}`;
        }

        const messages = [
            { role: 'system', content: systemContent }
        ];

        recentMsgs.forEach(m => {
            if (m.type === 'system') return;
            let content = m.text;
            if (m.type === 'image') content = '[发送了一张图片]'; 
            if (m.type === 'voice') content = `[发送语音: ${m.text}]`;
            if (m.type === 'camera') content = `[分享照片: ${m.text}]`;
            if (m.type === 'transfer') content = `[转账 ID:${m.id} 金额:¥${m.amount} 备注:${m.text}]`;

            messages.push({
                role: m.sender === 'me' ? 'user' : 'assistant',
                content: content
            });
        });

        return messages;
    }

    // 🆕 新增：解析并匹配世界书词条
    getWorldBookContent(charId, recentMsgs) {
        let worlds = [];
        try {
            const idDataStr = localStorage.getItem('zs_mark_identity');
            if (idDataStr) {
                const idData = JSON.parse(idDataStr);
                if (idData.worlds) worlds = idData.worlds;
            }
        } catch(e) {}

        if (!worlds.length) return '';

        const folders = worlds.filter(w => w.type === 'folder');
        const cards = worlds.filter(w => w.type === 'card');
        
        // 提取最近10条聊天文本，用于触发关键词匹配
        const recentText = recentMsgs.slice(-10).map(m => m.text || '').join('\n').toLowerCase();
        
        let activatedContents = [];

        cards.forEach(card => {
            let isEnabled = false;

            // 1. 判断该词条是否启用（全局生效 / 局部绑定了当前角色）
            if (card.folderId) {
                const folder = folders.find(f => f.id === card.folderId);
                if (folder && folder.bindingType && folder.bindingType !== 'disabled') {
                    const isBound = folder.bindingType === 'global' || (folder.boundChars && folder.boundChars.includes(charId));
                    if (isBound) {
                        const isCardEnabled = folder.enabledCardsType === 'all' || (folder.enabledCards && folder.enabledCards.includes(card.id));
                        if (isCardEnabled) isEnabled = true;
                    }
                }
            } else {
                // 没有文件夹的根目录词条
                if (card.bindingType && card.bindingType !== 'disabled') {
                    const isBound = card.bindingType === 'global' || (card.boundChars && card.boundChars.includes(charId));
                    if (isBound) isEnabled = true;
                }
            }

            if (!isEnabled) return;

            // 2. 判断是否触发
            let isTriggered = false;
            const triggerType = card.triggerType || 'keyword'; // 兜底兼容旧数据

            if (triggerType === 'constant') {
                isTriggered = true; // 常驻词条无条件激活
            } else if (triggerType === 'keyword' && card.keywords) {
                // 拆分关键词（支持中/英文逗号分隔）
                const kws = card.keywords.split(/[,，]/).map(k => k.trim().toLowerCase()).filter(k => k);
                // 只要近期的聊天记录中包含任何一个关键词，即触发
                if (kws.some(kw => recentText.includes(kw))) {
                    isTriggered = true;
                }
            }

            if (isTriggered && card.content) {
                activatedContents.push(card.content.trim());
            }
        });

        // 将所有触发的内容用两个换行符拼接起来返回
        return activatedContents.join('\n\n');
    }

    // 调用 API (严格还原双重重试机制)
    async callLLM(messages, config) {
        let url = (config.apiUrl || 'https://api.openai.com').trim();
        url = url.replace(/\/+$/, '');
        if (!url.includes('/chat/completions')) {
            if (url.endsWith('/v1')) url += '/chat/completions';
            else url += '/v1/chat/completions';
        }

        const modelName = config.model || 'gpt-3.5-turbo';
        const apiKey = config.apiKey.trim();

        const payload = {
            model: modelName,
            messages: messages,
            temperature: Number(config.temperature || 1.0),
            stream: false 
        };

        const tryFetch = async (headers) => {
            console.log("🚀 Calling API with headers:", Object.keys(headers));
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...headers 
                },
                body: JSON.stringify(payload)
            });
            
            if (res.status === 401 || res.status === 403) throw new Error('401');
            
            if (!res.ok) {
                let errText = await res.text();
                try {
                    const json = JSON.parse(errText);
                    if (json.error && json.error.message) errText = json.error.message;
                } catch(e) {}
                throw new Error(`(${res.status}) ${errText}`);
            }
            return res.json();
        };

        // 1. Bearer 尝试
        try {
            const authValue = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
            const data = await tryFetch({ 'Authorization': authValue });
            return data.choices?.[0]?.message?.content || '';
        } catch (e) {
            if (e.message !== '401') throw e;
            console.warn("Bearer failed, retrying Raw Key...");
        }

        // 2. Raw Key 尝试
        try {
            const data = await tryFetch({ 'Authorization': apiKey });
            return data.choices?.[0]?.message?.content || '';
        } catch (e) {
            if (e.message !== '401') throw e;
            console.warn("Raw Key failed, retrying x-api-key...");
        }

        // 3. x-api-key / api-key 尝试 (终极方案)
        try {
            const data = await tryFetch({ 'x-api-key': apiKey, 'api-key': apiKey });
            return data.choices?.[0]?.message?.content || '';
        } catch (e) {
            throw new Error(`鉴权失败: 已尝试多种方式均被拒绝。请检查 Key。`);
        }
    }

    // 解析响应 (还原 setTimeout 逻辑)
    async processAIResponse(chatId, rawText) {
        if (!rawText) return;

        // 按换行符分割，但尝试保留空行作为段落间隔
        const lines = rawText.split('\n').filter(line => line.trim() !== '');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // 模拟人类打字延迟 (0.8s ~ 1.3s)
            await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
            this.parseAndAdd(chatId, line);
        }
    }

    parseAndAdd(chatId, text) {
        let msgData = {
            sender: 'them',
            type: 'text' // 默认为 text
        };

        // 1. Voice
        const voiceMatch = text.match(/<cmd:voice>(.*?)<\/cmd:voice>/);
        if (voiceMatch) {
            msgData.type = 'voice';
            msgData.text = voiceMatch[1];
            msgData.duration = Math.max(1, Math.ceil(msgData.text.length / 3));
            msgData.isPlaying = false;
            msgData.showTranscribed = false;
            this.addMessage(chatId, msgData);
            return;
        }

        // 2. Camera
        const cameraMatch = text.match(/<cmd:camera>(.*?)<\/cmd:camera>/);
        if (cameraMatch) {
            msgData.type = 'camera';
            msgData.text = cameraMatch[1];
            this.addMessage(chatId, msgData);
            return;
        }

        // 3. Transfer
        const transferMatch = text.match(/<cmd:transfer amount="(\d+(\.\d+)?)">(.*?)<\/cmd:transfer>/);
        if (transferMatch) {
            msgData.type = 'transfer';
            msgData.amount = transferMatch[1];
            msgData.text = transferMatch[3];
            msgData.status = 'pending';
            this.addMessage(chatId, msgData);
            return;
        }

        // 4. Video Call
        const videoMatch = text.match(/<cmd:video_call>(.*?)<\/cmd:video_call>/);
        if (videoMatch) {
            this.emit('trigger-video-call', { chatId, initiator: 'them' });
            return;
        }

        // 5. Plain Text (清洗标签)
        let cleanText = text.replace(/<cmd:.*?>.*?<\/cmd:.*?>/g, ''); 
        cleanText = cleanText.replace(/<cmd:.*?\/>/g, '').trim();

        if (cleanText) {
            msgData.text = cleanText;
            this.addMessage(chatId, msgData);
        }

        // 1. 🆕 处理转账接收/退还 <cmd:transfer_action ... />
        const txActionMatch = text.match(/<cmd:transfer_action id="([\d\.]+)" action="(received|returned)"\s*\/>/);
        if (txActionMatch) {
            const targetId = Number(txActionMatch[1]); // ID 通常是数字
            const action = txActionMatch[2];
            
            // 找到那条转账消息并修改状态
            const history = this.chatHistory[chatId];
            const targetMsg = history.find(m => m.id === targetId); // 注意类型匹配
            
            if (targetMsg && targetMsg.type === 'transfer' && targetMsg.status === 'pending') {
                targetMsg.status = action;
                this.saveHistory();
                
                // 插入一条系统提示
                this.addMessage(chatId, {
                    type: 'system',
                    text: action === 'received' ? `对方领取了你的转账` : `对方退还了你的转账`
                });
            }
            return; // 这是一个动作，不需要再发气泡
        }

        // 2. 🆕 处理撤回 <cmd:recall_last />
        if (text.includes('<cmd:recall_last')) {
            const history = this.chatHistory[chatId];
            // 从后往前找第一条 Char 发的消息
            for (let i = history.length - 1; i >= 0; i--) {
                if (history[i].sender === 'them' && history[i].type !== 'system') {
                    // 替换为撤回提示
                    history[i] = {
                        id: history[i].id,
                        type: 'system',
                        text: '对方撤回了一条消息',
                        originalText: history[i].text, 
                        time: history[i].time
                    };
                    this.saveHistory();
                    break; // 只撤一条
                }
            }
            return;
        }

        // 3. 🆕 处理引用 <cmd:quote text="...">...</cmd:quote>
        const quoteMatch = text.match(/<cmd:quote text="(.*?)">(.*?)<\/cmd:quote>/);
        if (quoteMatch) {
            const quoteContent = quoteMatch[1];
            const replyContent = quoteMatch[2];
            
            this.addMessage(chatId, {
                sender: 'them',
                type: 'text',
                text: replyContent,
                quote: {
                    name: '你', // 简单处理，或者传 User Name
                    text: quoteContent
                }
            });
            return;
        }

    }

    getCurrentTime() {
        const now = new Date();
        return `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    }
}
