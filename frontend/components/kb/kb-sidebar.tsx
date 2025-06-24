'use client'
import { Cog, FileChartColumn, MessageCircle, Waypoints } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import ToolTipText from "../tooltip_text"
import { cn } from "@/lib/utils"
import { useKBSidebar } from "./kb-sidebar-provider"
import { useUserContext } from "@/contexts/user-context"
import { useState } from "react"
import { useEffect } from "react"
import { User } from "@/interfaces/user"
import { useKnowledgeBase } from "@/contexts/knowledge-base-context"

// Menu items.
const getItems = (kb_id: string) => [
  {
    title: "数据集",
    url: `/kb_data/${kb_id}`,
    icon: FileChartColumn,
    need_build_graph: false,
  },
  {
    title: "配置",
    url: `/kb_config/${kb_id}`,
    icon: Cog,
    need_build_graph: false,
  },
  {
    title: "聊天",
    url: `/chat/${kb_id}`,
    icon: MessageCircle,
    need_build_graph: true,
  },
  {
    title: "图谱",
    url: `/graph/${kb_id}`,
    icon: Waypoints,
    need_build_graph: true,
  }
]

export function KBSidebar() {
  const pathname = usePathname()
  const path_splits = pathname.split('/')
  const kb_id = path_splits[path_splits.length - 1]
  const { getKbById } = useKnowledgeBase()
  const kb = getKbById(kb_id)
  const { isOpen,isSidebarOpen } = useKBSidebar()
  const items = getItems(kb_id)
  const { getUserInfo } = useUserContext()
  const [owner, setOwner] = useState<User | null>(null)

  useEffect(() => {
    if(kb?.owner_id) {
      getUserInfo(kb.owner_id).then(res => {
        if(res) setOwner(res.user)
      })
    }
  }, [kb?.owner_id])

  if (!kb) return null

  return (
    <aside 
      className={cn(
        "top-0 h-full border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "transition-all duration-300 ease-in-out",
        isOpen ? "w-[12rem]" : "w-0"
      )}
    >
      <div className={cn(
        "h-full flex flex-col gap-2 p-4",
        "transition-all duration-300 ease-in-out",
        isSidebarOpen ? "block" : "hidden"
      )}>
        <div className="px-2 py-2 mb-2">
          <ToolTipText
            text={kb?.name || ''}
            className="text-lg font-semibold tracking-tight truncate"
          />
          <div className="text-sm text-muted-foreground">
            创建人: {owner?.username || ''}
          </div>
        </div>
        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = pathname.includes(item.url)
            if (item.need_build_graph && Number(kb.kb_file_build_finished_count) === 0) {
              return null
            }
            return (
              <Link
                key={item.title}
                href={`${item.url}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all",
                  "hover:shadow-sm hover:-translate-y-[0.5px]",
                  isActive 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
