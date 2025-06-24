"use client"

import { FolderProvider } from "@/contexts/folder-context"

export default function FilesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <FolderProvider initialFolder="">
      {children}
    </FolderProvider>
  )
}
