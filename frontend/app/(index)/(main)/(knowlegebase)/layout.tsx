import { KBSidebar } from "@/components/kb/kb-sidebar"
import { KBSidebarProvider } from "@/components/kb/kb-sidebar-provider"
import { KBSidebarToggle } from "@/components/kb/kb-sidebar-toggle"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <KBSidebarProvider>
      <div className="relative h-full flex bg-background w-full">
        <KBSidebar />
        <div className="flex-1 overflow-x-hidden">
          <div className="relative">
            <KBSidebarToggle />
            <div className="container mx-auto max-w-6xl p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
      </KBSidebarProvider>

  )
}
