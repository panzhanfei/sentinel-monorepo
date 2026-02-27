import { WujieClient } from "@/app/src/components";

const Web3Vue = () => {
  return (
    <div>
      <WujieClient
        name="vue3"
        url="http://localhost:3002"
        width="100%"
        height="100%"
        alive={true}
      />
    </div>
  );
};

export default Web3Vue;
