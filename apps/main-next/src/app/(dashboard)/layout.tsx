import { DashboardShell } from "./DashboardShell";

const DashboardLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <DashboardShell>{children}</DashboardShell>;
};
export default DashboardLayout
