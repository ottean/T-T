const { createApp } = Vue;

const app = createApp({
    // 混合(Mixin)桌面模块的数据，这样主实例就拥有了桌面的数据
    mixins: [DesktopModule],
    
    data() {
        return {
            currentApp: 'desktop', // 当前显示的App，默认为桌面
        }
    },
    methods: {
        openApp(appId) {
            console.log("打开应用:", appId);
            // 这里以后写逻辑：如果是有界面的App，就切换 currentApp
            if (appId === '') {
                this.currentApp = appId;
            } else {
                alert("App " + appId + " 正在开发中...");
            }
        }
    },
    mounted() {
        // 启动时间更新
        this.updateTime();
        setInterval(this.updateTime, 1000);
    }
});

app.mount('#vue-app');
