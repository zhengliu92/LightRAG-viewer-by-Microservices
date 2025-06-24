import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "./ui/button";

interface RenameDialogProps {
    isOpen: boolean;
    title: string;
    onOpenChange: (open: boolean) => void;
    onRename: (name: string) => Promise<void>;
  }
  

export default function RenameDialog({ isOpen, title, onOpenChange, onRename }: RenameDialogProps) {
    const [newName, setNewName] = useState("")
  
    const handleSubmit = async () => {
      await onRename(newName);
      setNewName("");
    };
  
    // Add keyboard handler
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && newName.trim()) {
        handleSubmit();
      }
    };
  
    return (
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          onOpenChange(open);
          if (!open) setNewName("");
        }}
      >
        <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="输入新名称"
            onKeyDown={handleKeyDown}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={!newName.trim()}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ) 
  }