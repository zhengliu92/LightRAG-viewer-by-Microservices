import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "./ui/button"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type ToolTipButtonProps = {
    tooltip: string
    onClick?: () => Promise<void>
    icon?: React.ReactNode
    disabled?: boolean
    className?: string
    side?: "top" | "bottom" | "left" | "right"
    sideOffset?: number
    contentClassName?: string
}
export const ToolTipButton = ({ tooltip, onClick, icon, disabled, className, side, sideOffset, contentClassName}: ToolTipButtonProps) => {
    const [isExecuting, setIsExecuting] = useState(false);
    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation
        if (disabled) return;
        if (!onClick) return;
        setIsExecuting(true);
        await onClick();
        setIsExecuting(false);
    }

    return <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button 
                    className={cn("text-sm flex flex-col items-center gap-1 p-3 w-5 h-5", className)} 
                    variant="ghost" 
                    onClick={handleClick} 
                    disabled={disabled || isExecuting}
                >
                    {icon}
                    {isExecuting && (
                        <div className="flex gap-1">
                            <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1 h-1 bg-current rounded-full animate-bounce" />
                        </div>
                    )}
                </Button>
            </TooltipTrigger>
            <TooltipContent
                className={cn("bg-black/80 text-white border-none", contentClassName)}
                sideOffset={sideOffset}
                side={side}>
                {tooltip}
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
}   