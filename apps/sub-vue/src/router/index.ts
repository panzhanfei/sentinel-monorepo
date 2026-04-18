import { createRouter, createWebHistory } from "vue-router";

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "monitor-home",
      component: () => import("@/views/MonitorHome"),
    },
    {
      path: "/wujie-sub-route-test",
      name: "wujie-sub-route-test",
      component: () => import("@/views/WujieSubRouteTest"),
    },
    {
      path: "/:pathMatch(.*)*",
      name: "monitor-no-match",
      component: () => import("@/views/NoSubRouteMatch"),
    },
  ],
});
