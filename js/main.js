// js/main.js
const { createApp, defineAsyncComponent, shallowRef } = Vue;

// === 核心工具：组件加载器 ===
// 能够读取指定目录下的 template.html, style.css 和 index.js 并组装成 Vue 组件
async function loadComponent(appRelativePath) {

    // 1. 获取当前 index.html 所在的 URL 路径前缀
    // 这样无论你在什么子目录下运行，都能找到正确位置
    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    
    const cssUrl = `${baseUrl}/${appRelativePath}/style.css`;
    const htmlUrl = `${baseUrl}/${appRelativePath}/template.html`;
    const jsUrl = `${baseUrl}/${appRelativePath}/index.js`;

    console.log(`Loading App from: ${baseUrl}/${appRelativePath}`); // 打开控制台看这个路径对不对！

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
    const htmlResponse = await fetch(htmlUrl);
    if (!htmlResponse.ok) {
        throw new Error(`Failed to load template: ${htmlUrl} (Status: ${htmlResponse.status})`);
    }
    const template = await htmlResponse.text();

    // 3. JS
    // import() 必须接受完整 URL 才能最稳定地工作
    const module = await import(jsUrl);

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
            appCache: {} // 简单的缓存，防止重复 fetch
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
                this.currentView = component; // 这里的 component 包含 { template, data, methods... }
                
            } catch (error) {
                console.error(`Failed to load app: ${appName}`, error);
                alert(`App [${appName}] 无法加载或不存在。`);
            }
        }
    },
    mounted() {
        // 默认启动加载 Desktop
        this.handleAppSwitch('desktop');
    }
});

app.mount('#vue-app');
