import { WujieClient, AuditSkeleton } from "@/app/src/components";
import { WUJIE_SUB_APP_URL } from "@/lib/subAppOrigins";

const Audit = () => {
  return (
    <div className="relative w-full h-full">
      <WujieClient
        name="react19"
        url={WUJIE_SUB_APP_URL.react}
        width="100%"
        height="100%"
        alive={true}
        fallback={<AuditSkeleton />}
      />
    </div>
  );
};

export default Audit;
