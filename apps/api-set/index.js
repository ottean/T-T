// apps/api-set/index.js

export default {
    name: 'ApiSetApp',
    emits: ['switch-app'],
    data() {
        return {
            form: {
                id: null,
                name: '',
                apiUrl: '',
                apiKey: '',
                model: '',
                streamEnabled: false,
                temperature: 1.0,
                contextLimit: 50 // ✅ 新增：上下文条数，默认50
            },
            presets: [],
            
            showPresetList: false,
            availableModels: [],
            showModelSelector: false,
            isLoadingModels: false,
            isValidating: false,
            showToast: false,
            toastMsg: '',
            toastType: 'info'
        }
    },
    computed: {
        // 温度滑块样式 (0 ~ 2)
        sliderBackground() {
            const val = this.form.temperature;
            const percentage = (val / 2) * 100;
            return {
                backgroundImage: `linear-gradient(to right, #ff9a8b 0%, #ff9a8b ${percentage}%, #e0e0e0 ${percentage}%, #e0e0e0 100%)`
            };
        },
    },
    methods: {
        goBack() { 
            this.$emit('switch-app', 'desktop'); 
        },
        
        loadData() {
            const savedPresets = localStorage.getItem('zs_mark_api_presets');
            if (savedPresets) {
                try { this.presets = JSON.parse(savedPresets); } catch(e) {}
            }
            const activeConfig = localStorage.getItem('zs_mark_api_config');
            if (activeConfig) {
                try { 
                    const parsed = JSON.parse(activeConfig);
                    this.form = { ...this.form, ...parsed };
                    // 兼容旧数据：如果没有 contextLimit，补上默认值
                    if (this.form.contextLimit === undefined) this.form.contextLimit = 50;
                } catch(e) {}
            }
        },

        // === 核心：连接验证 (回归 /models，支持强制通过) ===
        async validateConnection(isSilent = false) {
            if (!this.form.apiKey.trim()) {
                if (!isSilent) this.triggerToast('错误：API Key 不能为空', 'error');
                return false;
            }
            if (!this.form.apiUrl.trim()) {
                if (!isSilent) this.triggerToast('错误：API URL 不能为空', 'error');
                return false;
            }

            this.isValidating = true;
            
            let endpoint = this.getCleanUrl(this.form.apiUrl); 
            let modelsUrl = endpoint.replace('/chat/completions', '/models');

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); 

            try {
                const res = await fetch(modelsUrl, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${this.form.apiKey.trim()}` },
                    signal: controller.signal 
                });
                
                clearTimeout(timeoutId);

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }

                const data = await res.json();
                if (!data) throw new Error('空响应');

                if (!isSilent) this.triggerToast('连接成功', 'success');
                return true;

            } catch (e) {
                clearTimeout(timeoutId);
                let errMsg = e.message;
                if (e.name === 'AbortError') errMsg = '请求超时';
                
                console.warn("Validate Fail:", e);
                
                if (isSilent) {
                    const allowForce = confirm(`连接测试失败 (${errMsg})。\n\n但这可能是因为服务商关闭了查询接口，不代表 Key 无效。\n\n是否强制保存/应用？`);
                    return allowForce;
                } else {
                    this.triggerToast(`测试未通过: ${errMsg}`, 'error');
                    return false;
                }
            } finally {
                this.isValidating = false;
            }
        },

        // === Apply: 仅应用当前配置 ===
        async applyConfig() {
            const isValid = await this.validateConnection(true);
            if (!isValid) return; 

            localStorage.setItem('zs_mark_api_config', JSON.stringify(this.form));
            this.triggerToast('已应用临时配置', 'success');
        },

        // === Save: 保存为预设 ===
        async savePreset() {
            if (!this.form.name || !this.form.name.trim()) {
                this.triggerToast('请填写“配置名”', 'error');
                return;
            }

            // 1. 判重逻辑 (增加 contextLimit 判断)
            const isDuplicate = this.presets.some(p => 
                p.name === this.form.name &&
                p.apiUrl === this.form.apiUrl &&
                p.apiKey === this.form.apiKey &&
                p.model === this.form.model &&
                p.streamEnabled === this.form.streamEnabled &&
                p.temperature === this.form.temperature &&
                p.contextLimit === this.form.contextLimit // ✅
            );

            if (isDuplicate) {
                this.triggerToast('该配置已存在 (无需重复保存)', 'info');
                return;
            }

            // 2. 验证
            const isValid = await this.validateConnection(true);
            if (!isValid) return;

            // 3. 保存
            const newPreset = { ...this.form, id: Date.now() };
            
            const idx = this.presets.findIndex(p => p.id === this.form.id);
            if (idx !== -1) {
                this.presets[idx] = newPreset;
                this.triggerToast(`预设 "${this.form.name}" 已更新`, 'success');
            } else {
                this.presets.push(newPreset);
                this.form.id = newPreset.id;
                this.triggerToast(`预设 "${this.form.name}" 已保存`, 'success');
            }

            this.persistPresets();
        },

        // === Switch: 切换预设 ===
        async switchPreset(preset) {
            this.form = { ...preset };
            // 兼容旧预设
            if (this.form.contextLimit === undefined) this.form.contextLimit = 50;
            
            this.showPresetList = false;
            this.triggerToast(`已加载 "${preset.name}"，正在测试...`, 'info');
            await this.validateConnection(false); 
        },

        // === Fetch Models ===
        async fetchModels() {
            if (!this.form.apiKey) {
                this.triggerToast('请先填写 API Key', 'error');
                return;
            }
            this.isLoadingModels = true;
            
            let endpoint = this.getCleanUrl(this.form.apiUrl); 
            let modelsUrl = endpoint.replace('/chat/completions', '/models');

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            try {
                const res = await fetch(modelsUrl, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${this.form.apiKey}` },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!res.ok) throw new Error('Failed');
                const data = await res.json();
                const list = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
                
                if (list.length > 0) {
                    this.availableModels = list.map(m => m.id || m).sort();
                    this.showModelSelector = true;
                    this.triggerToast(`获取成功: ${this.availableModels.length} 个模型`, 'success');
                } else {
                    throw new Error('列表为空');
                }
            } catch (e) {
                clearTimeout(timeoutId);
                let errMsg = '获取失败';
                if (e.name === 'AbortError') errMsg = '请求超时';
                this.triggerToast(errMsg, 'error');
            } finally {
                this.isLoadingModels = false;
            }
        },

        getCleanUrl(inputUrl) {
            let url = (inputUrl || '').trim();
            url = url.replace(/\/+$/, '');
            if (url.endsWith('/chat/completions')) return url;
            if (url.endsWith('/v1')) return `${url}/chat/completions`;
            return `${url}/v1/chat/completions`;
        },

        persistPresets() { localStorage.setItem('zs_mark_api_presets', JSON.stringify(this.presets)); },
        
        deletePreset(id) {
            this.presets = this.presets.filter(p => p.id !== id);
            if (this.form.id === id) this.form.id = null;
            this.persistPresets();
        },
        
        createNew() {
            // ✅ 修改：新建时 contextLimit 默认为 50
            this.form = { 
                id: null, 
                name: '', 
                apiUrl: '', 
                apiKey: '', 
                model: '', 
                streamEnabled: false, 
                temperature: 1.0, 
                contextLimit: 50 
            };
            this.showPresetList = false;
        },
        
        selectModel(m) { this.form.model = m; this.showModelSelector = false; },
        
        triggerToast(msg, type = 'info') {
            this.toastMsg = msg;
            this.toastType = type;
            this.showToast = true;
            setTimeout(() => this.showToast = false, 2500);
        }
    },
    mounted() {
        this.loadData();
    }
}
