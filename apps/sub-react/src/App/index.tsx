import { AuditDashboard } from "@/views/AuditDashboard";
import { useAppData } from "./useData";

const App = () => {
  const props = useAppData();
  return <AuditDashboard {...props} />;
};

export default App;
