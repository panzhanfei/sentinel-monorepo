// main.js / main.ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { initWujieBusListener } from "@/utils/wujie-bus-listener";
import App from "./App";
import "./style.css";

const app = createApp(App);
app.use(createPinia().use(piniaPluginPersistedstate));
app.mount("#app");
initWujieBusListener();
