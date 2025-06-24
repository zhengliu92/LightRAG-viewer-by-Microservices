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
import { useProject } from "@/contexts/proj-context"
import { cn } from "@/lib/utils"


type CreateProjDialogProps = {
  className?: string
}


export function CreateProjDialog({ className }: CreateProjDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { createProjAsync } = useProject()
  const handleSubmit = async () => {
    if (!name.trim()) return
    
    try {
      setIsLoading(true)
      await createProjAsync({ name, description: "" })
      setOpen(false)
      setName("")
    } catch (error) {
      console.error("Failed to create knowledge base:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={cn("",className)} variant="outline" >
          <Plus className="h-4 w-4" />
            新建项目
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建新的项目</DialogTitle>
          <DialogDescription/>
        </DialogHeader>
        <Input
          placeholder="项目名称"
          value={name}
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