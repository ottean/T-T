// js/main.js
const { createApp, defineAsyncComponent, shallowRef } = Vue;

// === 🆕 引入 ChatService ===
// 注意路径要正确，假设你把 chatService.js 放在 js/ 目录下
import { ChatService } from './chatService.js';

// === 🆕 初始化全局服务 ===
// 这行代码保证了 Service 在 App 启动前就绪，并且是单例
window.chatService = new ChatService();
console.log('✅ ChatService initialized globally');

// === 核心工具：组件加载器 ===
// 能够读取指定目录下的 template.html, style.css 和 index.js 并组装成 Vue 组件
async function loadComponent(appRelativePath) {
    // 1. 获取当前 index.html 所在的 URL 路径前缀
    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    
    // 构造 CSS/HTML/JS 的完整路径
    // 注意：这里需要根据 appRelativePath (如 apps/desktop) 拼接
    const cssUrl = `${baseUrl}/${appRelativePath}/style.css`;
    const htmlUrl = `${baseUrl}/${appRelativePath}/template.html`;
    const jsUrl = `${baseUrl}/${appRelativePath}/index.js`;

    console.log(`Loading App from: ${baseUrl}/${appRelativePath}`); 

    // 1. CSS
    const cssId = `css-${appRelativePath.replace(/\//g, '-')}`;
    if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = cssUrl;
        document.head.appendChild(link);
    }

    // 2. HTML
    // 必须确保 fetch 成功
    let template = '';
    try {
        const htmlResponse = await fetch(htmlUrl);
        if (!htmlResponse.ok) {
            throw new Error(`Failed to load template: ${htmlUrl} (Status: ${htmlResponse.status})`);
        }
        template = await htmlResponse.text();
    } catch (e) {
        console.error(e);
        return { template: '<div style="color:red">Load Error</div>' };
    }

    // 3. JS
    let module = {};
    try {
        module = await import(jsUrl);
    } catch (e) {
        console.error(`Failed to import JS from ${jsUrl}`, e);
    }

    // 返回组装好的 Vue 组件对象
    return {
        template: template,
        ...module.default
    };
}


// === 主应用逻辑 ===
const app = createApp({
    data() {
        return {
            // 使用 shallowRef 避免组件对象被深度响应式代理（提升性能）
            currentView: null, 
            appCache: {} ,// 简单的缓存，防止重复 fetch
            notification: {
                show: false,
                title: '',
                text: '',
                avatar: '',
                chatId: null
            },
            notifyTimer: null
        };
    },
    methods: {
        async handleAppSwitch(appName) {
            console.log(`System: Switching to [${appName}]`);
            
            // 简单的路由映射
            const appPath = `apps/${appName}`;
            
            // 检查缓存
            if (this.appCache[appName]) {
                this.currentView = this.appCache[appName];
                return;
            }

            try {
                // 动态加载组件
                const component = await loadComponent(appPath);
                
                // 存入缓存并显示
                this.appCache[appName] = component;
                this.currentView = component; 
                
            } catch (error) {
                console.error(`Failed to load app: ${appName}`, error);
                alert(`App [${appName}] 无法加载或不存在。`);
            }
        },

        showSystemNotification(data) {
            // data: { title, text, avatar, chatId }
            this.notification = { ...data, show: true };
            
            // 震动一下
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

            // 3秒后自动收起
            if (this.notifyTimer) clearTimeout(this.notifyTimer);
            this.notifyTimer = setTimeout(() => {
                this.notification.show = false;
            }, 3500);
        },

        // 点击横幅：跳转到 Messenger 并打开对应会话
        handleBannerClick() {
            const chatId = this.notification.chatId;
            this.notification.show = false;
            
            // 切换到 Messenger
            // 注意：这里需要 Messenger 支持通过 Props 或 Event 接收 "jumpToChatId"
            // 为了简单，我们先只切换 App，具体的跳转逻辑可以在 Messenger 的 mounted 里读参数
            // 或者：直接调用 window.chatService 发个事件
            
            this.handleAppSwitch('messenger');
            // 延时一下等组件挂载
            setTimeout(() => {
                window.chatService.emit('jump-to-chat', chatId);
            }, 100);
        }
    },
    mounted() {
        window.zsSystemNotify = this.showSystemNotification;
        // 默认启动加载 Desktop
        this.handleAppSwitch('desktop');
    }
});

app.mount('#vue-app');
