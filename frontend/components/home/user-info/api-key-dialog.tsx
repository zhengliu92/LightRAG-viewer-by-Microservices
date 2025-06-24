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
import { Input } from "@/components/ui/input"
import { useApiKey } from "@/hooks/use-api"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { SelectValue } from "@radix-ui/react-select"
import encrypt from "@/utils/encrypt"

interface ApiKeyDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ApiKeyDialog({ isOpen, onOpenChange }: ApiKeyDialogProps) {

  const { apiProvider, setApiKey,setProjectApiKey,setApiProvider,clearAllKeys} = useApiKey()
  const [inputOpenaiApiKey,setInputOpenaiApiKey] = useState("")
  const [inputProjectApiKey,setInputProjectApiKey] = useState("")
  const [inputApiProvider,setInputApiProvider] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = () => {
    setIsLoading(true)
    if (inputOpenaiApiKey !== "" && inputOpenaiApiKey !== "************") {
      const encryptOpenaiApiKey = encrypt(inputOpenaiApiKey)
      setApiKey(encryptOpenaiApiKey)
    }

    if (inputProjectApiKey !== "" && inputProjectApiKey !== "************") {
      const encryptProjectApiKey = encrypt(inputProjectApiKey)
      setProjectApiKey(encryptProjectApiKey)
    }

    setApiProvider(inputApiProvider)
    onOpenChange(false)
    setIsLoading(false)
    setInputOpenaiApiKey("************")
    setInputProjectApiKey("************")
    toast.success("API Key 设置成功")
  }

  const handleClear = () => {
    setInputOpenaiApiKey("")
    setInputProjectApiKey("")
    clearAllKeys()
    setInputApiProvider("openai")
    onOpenChange(false)
    toast.success("API Key 清除成功")
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
          <DialogTitle>API Key 设置</DialogTitle>
          <DialogDescription>
            设置您的 API Key 以使用 AI 功能。我们会使用加密方式安全地存储您的密钥。国内用户推荐使用DeepSeekV3。
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label>API Key</Label> 
          <Input
            type="text"
            placeholder="sk-..."
            value={inputOpenaiApiKey}
            onChange={(e) => setInputOpenaiApiKey(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>项目ID（可选）</Label>
          <Input
          type="text"
          placeholder="proj..."
          value={inputProjectApiKey}
          onChange={(e) => setInputProjectApiKey(e.target.value)}
          />
        </div> 
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
          <Button variant="outline" onClick={handleClear}>
            清除
          </Button>
          <Button 
            onClick={handleSubmit} 
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit()
              }
            }}
            disabled={!inputOpenaiApiKey  || isLoading}
          >
            {isLoading ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 