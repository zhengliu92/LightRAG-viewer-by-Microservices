'use client'

import { cn } from "@/lib/utils"
import { useChatSidebar } from "./chat-sidebar-provider"
import ToolTipText from "../tooltip_text"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useChatContext } from "@/contexts/chat-context"
import { Trash2, Loader2 } from "lucide-react"
import { useKnowledgeBase } from "@/contexts/knowledge-base-context"
import { IKb } from "@/interfaces/kb"
import { useQueryClient } from "@tanstack/react-query"

interface KbListItemProps {
  kb: IKb
  activeKbId: string | null
  setActiveKbId: (kb_id: string) => void
  clearMessages: (kb_id: string) => void
  router: any
}

const KbListItem = ({ kb, activeKbId, setActiveKbId, clearMessages, router }: KbListItemProps) => (
  <div key={kb.id} className="grid gap-1 w-full grid-cols-6">
    <button
      onClick={() => {
        setActiveKbId(kb.id)
        router.push(`/chat`)
      }}
      className={cn(
        " col-span-5 flex items-center px-2 py-2 text-sm rounded-lg transition-colors hover:bg-accent",
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
        <span className="text-nowrap text-xs text-muted-foreground">
          {kb.kb_file_build_finished_count} build
        </span> 
      </div>
    </button>
    <button
      className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
      disabled={activeKbId !== kb.id}
      onClick={(e) => {
        e.stopPropagation()
        clearMessages(kb.id)
      }}
      aria-label="Clear messages"
    >
      <Trash2 className="w-4 h-4"/>
    </button>
  </div>
)

type renderKbListProps = {
  kbs: IKb[] | undefined
  title: string
  queryClient: any
  activeKbId: string | null
  setActiveKbId: (kb_id: string) => void
  clearMessages: (kb_id: string) => void
  router: any
}


const RenderKbList = ({ kbs, queryClient, activeKbId, setActiveKbId, clearMessages, router, title }: renderKbListProps) => {
  
  
  return  (
    kbs && kbs.length > 0 && (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold px-2">
          {title}
        </h2>
        <button
          className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          disabled={!kbs || kbs.length === 0}
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
        <KbListItem
          key={kb.id}
          kb={kb}
          activeKbId={activeKbId}
          setActiveKbId={setActiveKbId}
          clearMessages={clearMessages}
          router={router}
        />
      ))}
    </div>
  )
)
}




export function ChatSidebar() {
  const { all_kbs:kbs, activeKbId, setActiveKbId } = useKnowledgeBase()
  const { isOpen, isSidebarOpen } = useChatSidebar()
  const { clearMessages } = useChatContext()
  const all_kb_ids = kbs?.map((kb) => kb.id)
  const pathname = usePathname()
  const path_splits = pathname.split('/')
  const kb_id = path_splits[path_splits.length - 1]
  const router = useRouter()
  const kbWithBuild = kbs?.filter((kb) => kb.kb_file_build_finished_count>0)
  const proj_kbs = kbWithBuild?.filter((kb) => kb.is_project_kb)
  const user_kbs = kbWithBuild?.filter((kb) => !kb.is_project_kb)
  
  const queryClient = useQueryClient()

  useEffect(() => {
    if (all_kb_ids?.includes(kb_id)) {
      setActiveKbId(kb_id)
    } else {
      router.push(`/chat`)
    }
  }, [kb_id, all_kb_ids, setActiveKbId, router])

  if (!kbWithBuild) {
    return null
  }

  return (
    <aside 
      className={cn(
        "top-0 h-full border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "transition-all duration-300 ease-in-out",
        isOpen ? "w-[14rem]" : "w-0"
      )}
    >
      <div className={cn(
        "h-full flex flex-col gap-2 p-4",
        "transition-all duration-300 ease-in-out",
        isSidebarOpen ? "block" : "hidden"
      )}>
        <div className="space-y-4">
          <RenderKbList
            kbs={user_kbs}
            title="个人知识库"
            queryClient={queryClient}
            activeKbId={activeKbId}
            setActiveKbId={setActiveKbId}
            clearMessages={clearMessages}
            router={router}
          />
          <RenderKbList
            kbs={proj_kbs}
            title="项目知识库"
            queryClient={queryClient}
            activeKbId={activeKbId}
            setActiveKbId={setActiveKbId}
            clearMessages={clearMessages}
            router={router}
          />
          {(!proj_kbs?.length && !user_kbs?.length) && (
            <div className="text-sm text-muted-foreground text-center">
              暂无知识库
            </div>
          )}
        </div>
      </div> 
    </aside>
  )
}
