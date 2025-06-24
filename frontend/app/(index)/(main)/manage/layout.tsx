// 管理页面

import { ManageSidebar } from "@/components/manage-user/manage-sidebar";
import { ManageSidebarProvider } from "@/components/manage-user/manage-sidebar-provider";
import { ManageSidebarToggle } from "@/components/manage-user/manage-sidebar-toggle";
import { ProjectContextProvider } from "@/contexts/proj-context";


export default function ManageLayout({ children }: { children: React.ReactNode }) {
    return (<ManageSidebarProvider>
              <ProjectContextProvider>
            <div className="relative h-full flex w-full">
              <ManageSidebar />
                <div className="relative flex-1 overflow-auto">
                  <ManageSidebarToggle />
                  <div className="h-full py-6">
                    {children}
                  </div>
                </div>
            </div>
          </ProjectContextProvider>
        </ManageSidebarProvider>
    );
}
