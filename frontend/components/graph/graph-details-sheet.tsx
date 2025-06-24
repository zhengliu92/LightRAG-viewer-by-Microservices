"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LinkWithSourceAndTarget } from "@/app/(index)/(main)/graph/[[...id]]/page"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface GraphDetailsSheetProps {
  showDetails: boolean
  setShowDetails: (show: boolean) => void
  centerNode: any
  linksWithSourceAndTarget: LinkWithSourceAndTarget[]
}

export function GraphDetailsSheet({
  showDetails,
  setShowDetails,
  centerNode,
  linksWithSourceAndTarget,
}: GraphDetailsSheetProps) {
  return (
    <Sheet open={showDetails} onOpenChange={setShowDetails}>
      <SheetContent side="right" className="w-[380px] max-sm:max-w-[90vw]">
        <SheetHeader className="border-b pb-2">
          <SheetTitle className="text-xs">
            {centerNode?.name}
            </SheetTitle>
          <SheetDescription className="text-xs">
            Type: {centerNode?.entity_type}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
          <div className="space-y-3 mb-[50px] pr-3">
            {linksWithSourceAndTarget.map((link: LinkWithSourceAndTarget) => {
              const sourceNode = link.source;
              const targetNode = link.target;

              return (
                <div key={link.index} className="p-3 rounded-lg border hover:border-primary/50 transition-colors group">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 p-2 bg-muted/50 rounded ">
                      <div className="text-xs text-muted-foreground text-center">{sourceNode.entity_type}</div>
                      < div className="text-xs text-center  rounded-m font-semibold text-muted-foreground">{sourceNode.id}</div>
                      <div className="text-xs">{sourceNode.name}</div>
                      </div>
                      <div className="w-8 flex justify-center">
                        <ArrowRight className={cn(
                          "h-3 w-3 text-muted-foreground transition-transform duration-300",
                          "group-hover:translate-x-0.5"
                        )} />
                      </div>
                      <div className="flex-1 p-2 bg-muted/50 rounded">
                        <div className="text-xs text-muted-foreground text-center">{targetNode.entity_type}</div>
                        <div className="text-xs text-center  rounded-m font-semibold text-muted-foreground">{targetNode.id}</div>
                        <div className="text-xs">{targetNode.name}</div>
                      </div>
                    </div>
                    <div className="border-t pt-1.5">
                      <div className="text-xs text-primary">{link.description}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Weight: {link.weight}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
} 