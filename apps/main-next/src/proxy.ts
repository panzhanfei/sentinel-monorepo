import type { NextRequest } from "next/server";
import { runProxy } from "./proxy/runProxy";

/** 实现见 `src/proxy/runProxy.ts`；`config` 须在本文件内字面量导出供 Next 静态解析。 */
export const proxy = (request: NextRequest) => runProxy(request);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
