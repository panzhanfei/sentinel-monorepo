import { WujieClient } from "@/app/src/components";

const Web3React = () => {
  return (
    <div>
      <WujieClient
        name="react19"
        url="http://localhost:3001"
        width="100%"
        height="100%"
        alive={true}
      />
    </div>
  );
};

export default Web3React;
