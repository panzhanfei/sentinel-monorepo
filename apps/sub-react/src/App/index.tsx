import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { WujieAuditPathSync } from "./WujieAuditPathSync";

const AuditHome = lazy(() => import("./AuditHome"));
const WujieSubRouteTest = lazy(
  () => import("@/views/WujieSubRouteTest"),
);
const NoSubRouteMatch = lazy(() => import("./NoSubRouteMatch"));

const RouteLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-zinc-950 font-mono text-sm text-zinc-500">
    加载中…
  </div>
);

const App = () => (
  <BrowserRouter>
    <WujieAuditPathSync />
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/" element={<AuditHome />} />
        <Route path="/wujie-sub-route-test" element={<WujieSubRouteTest />} />
        <Route path="*" element={<NoSubRouteMatch />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
