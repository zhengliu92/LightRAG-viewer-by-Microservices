"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileIcon, Clock, MoreHorizontal, Trash, Pencil, UserCircle, Boxes } from "lucide-react"
import { Button } from "../ui/button"
import { useKnowledgeBase } from "@/contexts/knowledge-base-context"

import { useEffect, useState } from "react"
import ToolTipText from "../tooltip_text"
import { deleteKbAsync, useKb } from "@/hooks/use-kb"
import { toast } from "sonner"
import { IKb } from "@/interfaces/kb"
import { useUserContext } from "@/contexts/user-context"
import { User } from "@/interfaces/user"
import { useRouter } from "next/navigation"
import RenameDialog from "../rename-dialog"

// Types

interface KnowledgeBaseCardDropDownProps {
  kb_id: string;
  proj_id?: string;
  onSuccess?: () => void;
}

interface KnowledgeBaseCardProps {
  kb:IKb
  onSuccess?: () => void;
}

// Components


function KnowledgeBaseCardDropDown({ kb_id, proj_id, onSuccess }: KnowledgeBaseCardDropDownProps) {
  const {  renameKbAsync } = useKnowledgeBase()
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleDelete = async (event: Event) => {
    event.preventDefault()
      await deleteKbAsync(kb_id, proj_id);
      setIsOpen(false)
      onSuccess?.()
  };

  const handleRename = async (name: string) => {
      const resp = await renameKbAsync({ id: kb_id, name });
      if(resp.code === 200) {
        setIsRenameDialogOpen(false);
        setIsOpen(false)
        onSuccess?.()
      } 
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end"
          onEscapeKeyDown={() => setIsOpen(false)}
          onInteractOutside={() => setIsOpen(false)}
        >
          <DropdownMenuItem 
            onSelect={() => {
              setIsRenameDialogOpen(true)
              setIsOpen(false)
            }}
            className="cursor-pointer"
          >
            <Pencil className="mr-2 h-4 w-4" />
            <span>重命名</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
          onSelect={handleDelete}
          className="cursor-pointer">
            <Trash className="mr-2 h-4 w-4" />
            <span>删除</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameDialog
        isOpen={isRenameDialogOpen}
        title="重命名知识库"
        onOpenChange={setIsRenameDialogOpen}
        onRename={handleRename}
      />
    </div>
  )
}

function KnowledgeBaseInfo({ kb }: KnowledgeBaseCardProps) {
  const lastModified = new Date(kb.updated_at)
  const { getUserInfo } = useUserContext()
  const [owner, setOwner] = useState<User | null>(null)
  useEffect(() => {
    if(kb.owner_id) {
      getUserInfo(kb.owner_id).then(res => {
        if(res) setOwner(res.user)
      })
    }
  }, [kb.owner_id])   
  return (
    <div className="flex flex-col items-start gap-1 text-sm text-muted-foreground">
      <div className="flex items-center gap-1 text-nowrap">
        <FileIcon className="h-4 w-4" />
        <span>{kb.kb_file_count} 文档，</span>
        <span>{kb.kb_file_build_finished_count} 已构建</span>
      </div>
      <div className="flex items-center gap-1">
        <Clock className="h-4 w-4" />
        <span>{lastModified.toLocaleDateString()}</span>
      </div>
      <div className="flex items-center gap-1">
        <UserCircle className="h-4 w-4" />
        <span>创建人: {owner?.username || ''}</span>
      </div>
      {kb.is_project_kb && (
        <div className="flex items-center gap-1">
          <Boxes  className="h-4 w-4" />
          <span>项目: {kb.project_name || ''}</span>
        </div>
      )}
    </div>
  )
}

export function KnowledgeBaseCard({ kb, onSuccess }: KnowledgeBaseCardProps) {
  const router = useRouter()   
  const {all_kbs} = useKb()
  const found_kb = all_kbs.find((item: IKb) => item.id === kb.id)
  const isAccessible = found_kb !== undefined

  return (
    <div 
      onClick={() => isAccessible ? router.push(`/kb_data/${kb.id}`) : toast.error("您没有权限访问该知识库")}
      className="cursor-pointer"
    >
      <Card className="hover:bg-accent/50 transition-colors">
        <CardHeader>
          <div className="flex items-center mr-4">
            <CardTitle className="w-full">
              <ToolTipText
                text={kb.name}
              />
            </CardTitle>
            <KnowledgeBaseCardDropDown kb_id={kb.id} proj_id={kb.project_id} onSuccess={onSuccess} />
          </div>
        </CardHeader>
        <CardContent>
          <KnowledgeBaseInfo kb={kb} />
        </CardContent>
      </Card>
    </div>
  )
} 