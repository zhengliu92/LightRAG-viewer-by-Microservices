"use client"

import { Button } from "@/components/ui/button"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { cn } from "@/lib/utils"
import { useChatSidebar } from "./chat-sidebar-provider"
  
export function ChatSidebarToggle() {
  const { isOpen, toggle } = useChatSidebar()

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "absolute top-0 z-50",
        "h-8 w-8 rounded-full",
        "transition-all duration-300 ease-in-out",
        "hover:bg-accent hover:shadow-sm active:scale-95",
        // isOpen ? "translate-x-[15.5rem]" : "translate-x-4"
      )}
      onClick={toggle}
    >
      {isOpen ? (
        <PanelLeftClose className="h-4 w-4 transition-transform duration-200" />
      ) : (
        <PanelLeftOpen className="h-4 w-4 transition-transform duration-200" />
      )}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
} 