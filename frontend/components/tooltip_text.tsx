import { cn } from "@/lib/utils";
import { TooltipContent, TooltipTrigger, TooltipPortal } from "@radix-ui/react-tooltip";
import { Tooltip } from "@radix-ui/react-tooltip";
import { TooltipProvider } from '@radix-ui/react-tooltip'
import React from 'react'

type Props = {
    text: string
    className?: string
}

const ToolTipText = ({text, className}: Props) => {
  return ( 
    <TooltipProvider>
        <Tooltip>   
            <TooltipTrigger asChild>
                <div className={cn(`truncate max-w-[25em]`, className)}>
                    {text}  
                </div>  
            </TooltipTrigger>
            <TooltipPortal>
                <TooltipContent 
                    className="relative z-50"
                    sideOffset={5}
                    side="bottom"
                    align="center"
                    >
                    <span className="text-wrap max-w-[25em] bg-black/80 text-white p-1 text-sm rounded-md text-foreground block">{text}</span>
                </TooltipContent>
            </TooltipPortal>
        </Tooltip>
    </TooltipProvider>
    )  
}

export default ToolTipText