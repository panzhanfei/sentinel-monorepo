import 'module-alias/register';
import './bootstrap';

export * from './utils';
export * from './config';
export * from './client';
export * from './middlewares';
export * from './controllers';
export * from './services';
export * from './lib';
export * from './modules';
/** Worker 与 Controller 均含 `startScan` 等命名，避免根导出冲突；请使用 `@/workers`（见 `workers/index.ts`）。 */
export { default as router } from './routes';
