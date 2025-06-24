"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

interface ChatSidebarContextType {
  isSidebarOpen: boolean
  isOpen: boolean
  toggle: () => void
  setIsOpen: (open: boolean) => void
}

const ChatSidebarContext = createContext<ChatSidebarContextType | undefined>(undefined)

export function ChatSidebarProvider({ children, duration = 300 }: { children: React.ReactNode, duration?: number }) {
  const [isOpen, setIsOpen] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  
  useEffect(() => {
    if (!isOpen) {
      setIsSidebarOpen(isOpen)
    } else {
      setTimeout(() => {
        setIsSidebarOpen(isOpen)
      }, duration)
    }
  }, [isOpen])

 

  const toggle = () => setIsOpen(prev => !prev)

  return (
    <ChatSidebarContext.Provider value={{ isSidebarOpen, isOpen,toggle, setIsOpen }}>
      <div className="h-full w-full">
        {children}
      </div>
    </ChatSidebarContext.Provider>
  )
}

export function useChatSidebar() {
  const context = useContext(ChatSidebarContext)
  if (context === undefined) {
    throw new Error('useChatSidebar must be used within a ChatSidebarProvider')
  }
  return context
}