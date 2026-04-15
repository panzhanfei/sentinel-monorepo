import { Web3Providers } from "@/app/src/components";

import "./index.css";

const RootLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <html lang="zh-CN">
      <body className="bg-[#fafafa]">
        <Web3Providers>{children}</Web3Providers>
      </body>
    </html>
  );
};
export default RootLayout
