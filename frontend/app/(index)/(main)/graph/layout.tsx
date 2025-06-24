"use client"

import { GraphSidebarProvider } from "@/components/graph/graph-sidebar-provider"
import { GraphSidebar } from "@/components/graph/graph-sidebar"
import { GraphSidebarToggle } from "@/components/graph/graph-sidebar-toggle"
import { KBGraphContextProvider } from "@/contexts/kb-graph-context"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // <KBContextProvider>
      <KBGraphContextProvider>
      <GraphSidebarProvider>
        <div className="relative h-full flex w-full">
          <GraphSidebar />
          <div className="flex-1 flex flex-col">
            <div className="relative flex-1 overflow-auto">
              <GraphSidebarToggle />
              <div className="h-full py-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      </GraphSidebarProvider>
      </KBGraphContextProvider>
    // </KBContextProvider>
  )
}

