/**
 * 生产环境用 PM2 一次拉起 API + Next + 两个 Vite 子应用。
 * 使用前：根目录 pnpm run build，Docker 已起 Postgres/Redis，各 app 已配置 .env.production。
 *
 * 启动：pnpm run pm2:start
 * 查看：pm2 logs
 * 停止：pnpm run pm2:stop
 */
const path = require("path");

const root = __dirname;

module.exports = {
  apps: [
    {
      name: "sentinel-api",
      cwd: path.join(root, "apps/server"),
      script: "node",
      args: "-r module-alias/register dist/index.js",
      env: { NODE_ENV: "production" },
    },
    {
      name: "sentinel-next",
      cwd: path.join(root, "apps/main-next"),
      script: "pnpm",
      args: "start",
      interpreter: "none",
      env: { NODE_ENV: "production" },
    },
    {
      name: "sentinel-sub-react",
      cwd: path.join(root, "apps/sub-react"),
      script: "pnpm",
      args: "run preview:host",
      interpreter: "none",
      env: { NODE_ENV: "production" },
    },
    {
      name: "sentinel-sub-vue",
      cwd: path.join(root, "apps/sub-vue"),
      script: "pnpm",
      args: "run preview:host",
      interpreter: "none",
      env: { NODE_ENV: "production" },
    },
  ],
};
