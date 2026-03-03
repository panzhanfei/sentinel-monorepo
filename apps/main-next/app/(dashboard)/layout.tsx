import { HomeNav, Web3ConnectKitButton } from "@/app/src/components";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-8 pb-4">
          <span className="text-xl font-extrabold tracking-tighter text-gray-900">
            SENTINEL
          </span>
        </div>

        <HomeNav />

        <div className="p-4 border-t border-gray-50">
          <div className="px-4 py-2 text-xs text-gray-400 font-medium">
            v1.0.0-alpha
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-full">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-end px-8 items-center z-10">
          <Web3ConnectKitButton />
        </header>
        <div className="flex-1 overflow-hidden bg-white/50 p-8">{children}</div>
      </main>
    </div>
  );
}
