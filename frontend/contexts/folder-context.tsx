"use client"

import { createContext, useContext } from "react"
import { useCurrentFolderData } from "@/hooks/use-file"
import { KBFileWithKBs } from "@/interfaces/kb"

interface FolderContextType {
  currentFolder: string
  setCurrentFolder: (folder: string) => void
  files: KBFileWithKBs[] | undefined
  isLoading: boolean
  refetchFiles: () => Promise<any>
  invalidateListUserFiles: () => Promise<any>
}

const FolderContext = createContext<FolderContextType | undefined>(undefined)

export function FolderProvider({ 
  children,
  initialFolder = ""
}: { 
  children: React.ReactNode
  initialFolder?: string
}) {
  const { data: files, isPending: isLoading, refetch: refetchFiles, currentFolder, setCurrentFolder, invalidateListUserFiles } = useCurrentFolderData(initialFolder)

  return (
    <FolderContext.Provider value={{
      currentFolder,
      setCurrentFolder,
      files,
      isLoading,
      refetchFiles,
      invalidateListUserFiles,
    }}>
      {children}
    </FolderContext.Provider>
  )
}

export function useFolder() {
  const context = useContext(FolderContext)
  if (context === undefined) {
    throw new Error("useFolder must be used within a FolderProvider")
  }
  return context
} 