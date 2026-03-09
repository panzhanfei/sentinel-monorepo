import { WujieClient, AuditSkeleton } from "@/app/src/components";

const Audit = () => {
  return (
    <div className="relative w-full h-full">
      <WujieClient
        name="react19"
        url="http://localhost:3001"
        width="100%"
        height="100%"
        alive={true}
        fallback={<AuditSkeleton />}
      />
    </div>
  );
};

export default Audit;
