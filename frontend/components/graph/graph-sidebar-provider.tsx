"use client"

import { useIsMobile } from '@/hooks/use-mobile'
import React, { createContext, useContext, useEffect, useState } from 'react'

interface GraphSidebarContextType {
  isSidebarOpen: boolean
  isOpen: boolean
  toggle: () => void
  setIsOpen: (open: boolean) => void
}

const GraphSidebarContext = createContext<GraphSidebarContextType | undefined>(undefined)

export function GraphSidebarProvider({ children, duration = 300 }: { children: React.ReactNode, duration?: number }) {
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
    <GraphSidebarContext.Provider value={{ isSidebarOpen, isOpen,toggle, setIsOpen }}>
      <div className="h-full w-full">
        {children}
      </div>
    </GraphSidebarContext.Provider>
  )
}

export function useGraphSidebar() {
  const context = useContext(GraphSidebarContext)
  if (context === undefined) {
    throw new Error('useGraphSidebar must be used within a GraphSidebarProvider')
  }
  return context
}