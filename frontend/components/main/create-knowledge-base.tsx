"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useKnowledgeBase } from "@/contexts/knowledge-base-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Select,SelectTrigger,SelectContent,SelectItem,SelectValue } from "../ui/select"
import { IProjKb } from "@/interfaces/kb"

interface CreateKnowledgeBaseProps {
  isProjKb: boolean;
  project_id?: string;
  onSuccess?: () => void;
  disabled?: boolean;
  projects?: IProjKb[];
}

export function CreateKnowledgeBase({ isProjKb, project_id, onSuccess, disabled, projects }: CreateKnowledgeBaseProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [projectId, setProjectId] = useState<string | undefined>(project_id)
  const { createKbAsync } = useKnowledgeBase()

  const handleSubmit = async () => {
    if (!name.trim()) return
    
    try {
      setIsLoading(true)
      await createKbAsync({ name, project_id: projectId })
      setOpen(false)
      setName("")
      onSuccess?.()
    } catch (error) {
      toast.error("创建知识库失败")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit()
    }
  }
  const is_disabled = disabled || (isProjKb && !projectId && !projects?.length);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={cn("gap-2")} disabled={is_disabled}>
          <Plus className="h-4 w-4" />
          {isProjKb ? "创建项目知识库" : "创建个人知识库"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建新的{isProjKb ? "项目知识库" : "个人知识库"}</DialogTitle>
          <DialogDescription>
            为知识库起一个名字，创建后可以开始上传文档。
          </DialogDescription>
        </DialogHeader>
        {isProjKb && !project_id && 
        <Select onValueChange={(value) => setProjectId(value)}>
          <SelectTrigger disabled={projects?.length === 0}>
            <SelectValue placeholder="选择项目" />
          </SelectTrigger>
          <SelectContent>
            {projects?.map(project => (
              <SelectItem className="cursor-pointer hover:bg-muted" key={project.id} value={project.id}>{project.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        }
        <Input
          placeholder="知识库名称"
          value={name}
          disabled={is_disabled}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || isLoading}
          >
            {isLoading ? "创建中..." : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 