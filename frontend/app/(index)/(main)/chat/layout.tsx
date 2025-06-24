"use client"

import { ChatSidebarProvider } from "@/components/chat/chat-sidebar-provider"
import { ChatSidebarToggle } from "@/components/chat/chat-sidebar-toggle"
import ChatInput from "@/components/chat/chat-input"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatContextProvider } from "@/contexts/chat-context"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <ChatContextProvider>
        <ChatSidebarProvider>
          <div className="relative h-full flex w-full">
            <ChatSidebar />
            <div className="flex-1 flex flex-col">
              <div className="relative flex-1 overflow-auto">
                <ChatSidebarToggle />
                <div className="h-full py-6">
                  {children}
                </div>
              </div>
              <ChatInput />
            </div>
          </div>
        </ChatSidebarProvider>
      </ChatContextProvider>
  )
}

