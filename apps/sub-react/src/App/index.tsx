import { BrowserRouter, Route, Routes } from "react-router-dom";
import { WujieSubRouteTest } from "@/views/WujieSubRouteTest";
import { AuditHome } from "./AuditHome";
import { NoSubRouteMatch } from "./NoSubRouteMatch";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<AuditHome />} />
      <Route path="/wujie-sub-route-test" element={<WujieSubRouteTest />} />
      <Route path="*" element={<NoSubRouteMatch />} />
    </Routes>
  </BrowserRouter>
);

export default App;
