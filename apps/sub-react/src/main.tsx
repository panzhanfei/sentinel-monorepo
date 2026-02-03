import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "@/App.tsx";
import { BusProvider } from "@/utils/BusProvider";
import "./index.css";

const queryClient = new QueryClient();
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <QueryClientProvider client={queryClient}>
    <BusProvider>
      <App />
    </BusProvider>
  </QueryClientProvider>,
);
