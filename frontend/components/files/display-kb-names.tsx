import React, { useState } from 'react'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {  KBFileWithKBs } from '@/interfaces/kb'
import { Row } from '@tanstack/react-table'
import { useKnowledgeBase } from '@/contexts/knowledge-base-context'

type Props = {
    row: Row<KBFileWithKBs>
}
    
const DisplayKbNames = ({row}: Props) => {
    const kb_count = row.original.kbs?.length || 0
    const [showKbDialog, setShowKbDialog] = useState(false)
    const { isProjectKb } = useKnowledgeBase()
    return (
        <>
          <div 
            className="text-left font-medium min-w-[6em] cursor-pointer hover:text-primary"
            onClick={() => kb_count > 0 && setShowKbDialog(true)}
          >
            {kb_count > 0 && `${kb_count} 个知识库`}
          </div>

          <Dialog open={showKbDialog} onOpenChange={setShowKbDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>已绑定知识库</DialogTitle>
                <DialogDescription>
                  {row.original.name} 
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                {row.original.kbs?.map(kb => (
                  <div 
                    key={kb.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <span className="font-medium">{kb.name}</span>
                    <span className="text-xs text-muted-foreground">{isProjectKb(kb.id) ? "项目知识库" : "个人知识库"}</span>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )
}

export default DisplayKbNames