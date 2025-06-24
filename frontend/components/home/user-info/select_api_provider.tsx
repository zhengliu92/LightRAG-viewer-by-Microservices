"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { useApiKey } from "@/hooks/use-api"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { SelectValue } from "@radix-ui/react-select"

interface SelectAPIProviderProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function SelectAPIProvider({ isOpen, onOpenChange }: SelectAPIProviderProps) {

  const { apiProvider,setApiProvider} = useApiKey()
  const [inputApiProvider,setInputApiProvider] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = () => {
    setIsLoading(true)
    setApiProvider(inputApiProvider)
    onOpenChange(false)
    setIsLoading(false)
    toast.success("API 设置成功")
  }



  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>API 设置</DialogTitle>
          <DialogDescription>
            设置您的 API Provider。
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label>API Provider</Label>
          <Select
          value={inputApiProvider}
          onValueChange={(value) => setInputApiProvider(value)}
          defaultValue={apiProvider || "openai"}
          >
            <SelectTrigger>
              <SelectValue placeholder={ "选择API提供商"} />
            </SelectTrigger>
            <SelectContent >
              <SelectItem value="openai" className="hover:cursor-pointer">OpenAI</SelectItem>
              <SelectItem value="deepseek_v3" className="hover:cursor-pointer">DeepSeekV3</SelectItem>
            </SelectContent>
          </Select> 
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            onClick={handleSubmit} 
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit()
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 