import { Header } from "@/components/main/header";
import { KnowledgeBaseProvider } from "@/contexts/knowledge-base-context";
import { UserProvider } from "@/contexts/user-context";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-screen w-screen flex flex-col">
      <header className=" top-0 z-50 h-16 w-full bg-white border-b shadow-sm">
        <Header />
      </header>
      <UserProvider>
        <KnowledgeBaseProvider>
          <main className="flex-1 min-h-0 w-full">{children}</main>
        </KnowledgeBaseProvider>
      </UserProvider>
    </div>
  );
};

export default MainLayout;
