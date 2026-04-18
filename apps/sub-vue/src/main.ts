Object.defineProperty(Document.prototype, "adoptedStyleSheets", {
  get: () => {
        return [];
      },
  set: () => {
        // noop
      },
});

import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { initWujieBusListener } from "@/utils/wujie-bus-listener";
import App from "./App";
import router from "./router";
import "./style.css";

const app = createApp(App);

app.use(createPinia().use(piniaPluginPersistedstate));
app.use(router);
app.mount("#app");
initWujieBusListener();
