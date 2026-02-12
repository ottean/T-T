// apps/messger/index.js

export default {
    name: 'MessengerApp',
    emits: ['switch-app'],
    data() {
        return {
            title: 'Dialogue'
        }
    },
    methods: {
        goBack() {
            // 触发事件，通知 main.js 切回 desktop
            this.$emit('switch-app', 'desktop');
        }
    }
}
