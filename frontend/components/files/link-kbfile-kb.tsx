"use client"

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {  IKb, KBBrief, KBFileWithKBs } from '@/interfaces/kb'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { linkKbFileWithKB } from '@/hooks/use-kbfile'
import { useQueryClient } from '@tanstack/react-query'
import { useKnowledgeBase } from '@/contexts/knowledge-base-context'

interface LinkKbFileWithKBProps {
  file: KBFileWithKBs
  open: boolean
  setOpen: (open:boolean) => void
  onSuccess?: () => void
  kbs: IKb[]
}

export function LinkKbFileWithKB({ file, open, setOpen, onSuccess, kbs }: LinkKbFileWithKBProps) {
  const [selectedKb, setSelectedKb] = useState<KBBrief[]>(file.kbs || [])
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()
  const { isProjectKb } = useKnowledgeBase()


  const handleKbSelect = (kb: KBBrief) => {
    if (selectedKb.some(k => k.id === kb.id)) return
    setSelectedKb(prev => [...prev, kb])
  }

  const handleKbDeselect = (kb: KBBrief) => {
    if (!selectedKb.some(k => k.id === kb.id)) return
    setSelectedKb(prev => prev.filter(k => k.id !== kb.id))
  }

  const disableSubmit = useMemo(() => {
    return file.kbs?.every(kb1 => 
      selectedKb.some(kb2 => kb2.id === kb1.id)
    ) && selectedKb.every(kb1 => 
      file.kbs!.some(kb2 => kb2.id === kb1.id)
    )
  }, [file.kbs, selectedKb])

  const handleSubmit = async () => {
    if (disableSubmit) return
    const kb_ids_org = file.kbs?.map(kb => kb.id) || []
    const kb_ids_new = selectedKb.map(kb => kb.id)
    
    try {
      setIsLoading(true)
      await linkKbFileWithKB(file.id, kb_ids_org, kb_ids_new)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['getKBFilesByFolder'] })
      }, 300)
      onSuccess?.()
      setOpen(false)
    } catch (error) { 
      console.error("Failed to bind knowledge base:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>绑定知识库</DialogTitle>
          <DialogDescription>
            选择要绑定的知识库，绑定后文件将会被添加到对应的知识库中。
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 border-b pb-2">
            <h4 className="text-sm">文件：{file.name}</h4>
            <span className="text-sm text-muted-foreground">
              已选择：{selectedKb.length} 个知识库
            </span>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">可用知识库</h4>
                <span className="text-xs text-muted-foreground">
                  {file.kbs?.length || 0} 个
                </span>
              </div>
              <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto space-y-2">
                {kbs?.map((kb) => (
                  <div 
                    key={kb.id}
                    className="flex items-center p-2 hover:bg-secondary rounded-md cursor-pointer transition-colors"
                    onClick={() => handleKbSelect(kb)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      {selectedKb.some(k => k.id === kb.id) ? (
                        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                      ) : (
                        <div className="h-2.5 w-2.5 rounded-full bg-secondary" />
                      )}
                      <span className="text-sm flex-grow">{kb.name}</span>
                      <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary/50 rounded">
                        {kb.is_project_kb ? "项目库" : "个人库"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">已绑定知识库</h4>
                <span className="text-xs text-muted-foreground">
                  {file.kbs?.length || 0} 个
                </span>
              </div>
              <div className="border rounded-lg p-4 max-h-[300px] h-full overflow-y-auto space-y-2">
                {selectedKb.map((kb) => (
                  <div 
                    key={kb.id}
                    className="flex items-center justify-between p-2 bg-secondary/50 rounded-md cursor-pointer"
                  >
                    <span className="text-sm">{kb.name}</span>
                    <span className="text-xs text-muted-foreground">{isProjectKb(kb.id) ? "项目库" : "个人库"}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleKbDeselect(kb)}
                    >
                      移除
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            id="bind-kb-submit"
            onClick={handleSubmit}
            disabled={disableSubmit || isLoading}
          >
            {isLoading ? "绑定中..." : "绑定"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}