import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateFolder } from "@/hooks/use-file"
import { useState } from "react"
import { toast } from "sonner"
import { FolderPlus } from "lucide-react"

type FolderFile = {
  name: string;
}

interface CreateFolderProps {
  currentPath: string;
  onSuccess?: () => void;
  folder_files?: FolderFile[];
}

export function CreateFolder({ currentPath, onSuccess,folder_files }: CreateFolderProps) {
  const [folderName, setFolderName] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const { mutateAsync, isPending } = useCreateFolder()

  const handleCreate = async () => {
    if (!folderName.trim()) {
      toast.error("请输入文件夹名称");
      return;
    }
    // check if the folder name is valid using regex
    const folderNameRegex = /^[^\/\\:*?"<>|]+$/;
    if (!folderNameRegex.test(folderName)) {
      toast.error("文件夹名称不能包含特殊字符: / \\ : * ? \" < > |");
      return;
    }

    if (folder_files?.some(file => file.name === folderName+"/")) {
      toast.error(`文件夹 ${folderName} 已存在, 请勿重复创建`);
      return;
    }

    try {
      const fullPath = currentPath === "" ? folderName : `${currentPath}/${folderName}`;
      await mutateAsync({ folder_name: fullPath });
      toast.success("文件夹创建成功");
      setFolderName("");
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error("文件夹创建失败");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FolderPlus className="h-4 w-4" />
          新建文件夹 
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新建文件夹</DialogTitle>
          <DialogDescription>
            {currentPath===""?"在根目录下创建文件夹":`在${currentPath}下创建文件夹`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="folder-name" className="text-right">
              文件夹名称
            </Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="col-span-3"
              placeholder="请输入文件夹名称"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isPending) {
                  handleCreate();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isPending}>
              取消
            </Button>
          </DialogClose>
          <Button 
            type="submit" 
            onClick={handleCreate}
            disabled={isPending || !folderName.trim()}
          >
            {isPending ? "创建中..." : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
