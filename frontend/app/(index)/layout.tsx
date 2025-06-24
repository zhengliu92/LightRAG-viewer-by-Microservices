"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";

const queryClient = new QueryClient();

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <main className="flex-1 h-screen">{children}</main>
      <Toaster position={"top-center"} duration={1000} />
      {/* <ReactQueryDevtools buttonPosition={"bottom-left"} /> */}
    </QueryClientProvider>
  );
};
export default MainLayout;
