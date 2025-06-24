"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

interface ManageSidebarContextType {
  isSidebarOpen: boolean
  isOpen: boolean
  toggle: () => void
  setIsOpen: (open: boolean) => void
}

const ManageSidebarContext = createContext<ManageSidebarContextType | undefined>(undefined)

export function ManageSidebarProvider({ children, duration = 300 }: { children: React.ReactNode, duration?: number }) {
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
    <ManageSidebarContext.Provider value={{ isSidebarOpen, isOpen,toggle, setIsOpen }}>
      <div className="h-full w-full">
        {children}
      </div>
    </ManageSidebarContext.Provider>
  )
}

export function useManageSidebar() {
  const context = useContext(ManageSidebarContext)
  if (context === undefined) {
    throw new Error('useManageSidebar must be used within a ManageSidebarProvider')
  }
  return context
}