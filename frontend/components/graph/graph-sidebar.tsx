'use client'

import { cn } from "@/lib/utils"
import ToolTipText from "../tooltip_text"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useGraphSidebar } from "./graph-sidebar-provider"
import { useKnowledgeBase } from "@/contexts/knowledge-base-context"
import { IKb } from "@/interfaces/kb"
import { useQueryClient } from "@tanstack/react-query"

interface KnowledgeBaseListProps {
  kbs: IKb[] | undefined
  title: string
  activeKbId: string | null
  onKbSelect: (kbId: string) => void
}

function KnowledgeBaseList({ kbs, title, activeKbId, onKbSelect }: KnowledgeBaseListProps) {
  
  if (!kbs || kbs?.length === 0) return null

  const queryClient = useQueryClient()

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold px-2">
            {title}
          </h2>
          <button
            className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            onClick={(e) => {
              e.stopPropagation()
              queryClient.invalidateQueries({ queryKey: ['userProjs'] })
              queryClient.invalidateQueries({ queryKey: ['userKbs'] })
            }}
            aria-label="Refresh project knowledge bases"
          >
            刷新
          </button>
      </div>
      {kbs.map((kb) => (
        kb.kb_file_build_finished_count > 0 && <button
          key={kb.id}
          onClick={() => onKbSelect(kb.id)}
          className={cn(
            "w-full flex items-center px-2 py-2 text-sm rounded-lg transition-colors hover:bg-accent",
            activeKbId === kb.id 
              ? "bg-primary/85 text-primary-foreground hover:bg-primary/90" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <ToolTipText
              text={kb.name}
              className="text-left"
            />
            <span className="text-right text-nowrap text-xs text-muted-foreground">
              {kb.kb_file_build_finished_count} build
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}

export function GraphSidebar() {
  const { all_kbs:kbs, activeKbId, setActiveKbId } = useKnowledgeBase()
  const { isOpen ,isSidebarOpen} = useGraphSidebar()
  const all_kb_ids = kbs?.map((kb) => kb.id)
  const pathname = usePathname()
  const path_splits = pathname.split('/')
  const kb_id = path_splits[path_splits.length - 1]
  const router = useRouter()
  const kbWithBuild = kbs?.filter((kb) => kb.kb_file_build_finished_count>0)
  const project_kbs = kbWithBuild?.filter((kb) => kb.is_project_kb)
  const user_kbs = kbWithBuild?.filter((kb) => !kb.is_project_kb)
  
  useEffect(() => {
    if (all_kb_ids?.includes(kb_id)) {
      setActiveKbId(kb_id)
    } else {
      router.push(`/graph`)
    }
  }, [kb_id])

  const handleKbSelect = (kbId: string) => {
    setActiveKbId(kbId)
    router.push(`/graph`)
  }

  if (!kbs) return null

  return (
    <aside 
      className={cn(
        " absolute z-10 top-0 h-full border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "transition-all duration-300 ease-in-out",
        isOpen ? "w-[12rem]" : "w-0"
      )}
    >
      <div className={cn(
        "h-full flex flex-col gap-2 p-4",
        "transition-all duration-300 ease-in-out",
        isSidebarOpen ? "block" : "hidden"
      )}>
        <div className="space-y-4">
          <KnowledgeBaseList
            kbs={user_kbs}
            title="个人知识库"
            activeKbId={activeKbId}
            onKbSelect={handleKbSelect}
          />

          <KnowledgeBaseList
            kbs={project_kbs}
            title="项目知识库"
            activeKbId={activeKbId}
            onKbSelect={handleKbSelect}
          />
        </div>
      </div> 
    </aside>
  )
}
