import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { FileFigure } from "@/interfaces/kbfile-assets"
import Image from "next/image"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { DialogTitle } from "@radix-ui/react-dialog"

type QueriedFiguresProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  queriedFigures: FileFigure[]
}

export default function SheetQueriedFigures({ open, onOpenChange, queriedFigures }: QueriedFiguresProps) {
  const [selectedFigure, setSelectedFigure] = useState<FileFigure | null>(null)

  if (queriedFigures.length === 0) {
    return null
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
          <SheetHeader className="p-6 pb-2">
            <SheetTitle>查询到的图表</SheetTitle>
            <SheetDescription>
              找到 {queriedFigures.length} 个相关图表
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)] px-6">
            <div className="grid gap-4 pb-6">
              {queriedFigures.map((figure) => (
                <div 
                  key={figure.id} 
                  className={cn(
                    "relative border rounded-lg p-4 space-y-2",
                    "hover:bg-accent/50 transition-colors cursor-pointer"
                  )}
                  onClick={() => setSelectedFigure(figure)}
                >
                  <div className="relative aspect-video w-full">
                    <Image
                      src={`data:image/png;base64,${figure.img_bytes}`}
                      alt={figure.caption}
                      fill
                      className="object-contain rounded-md"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground line-clamp-2">{figure.caption}</p>
                    {/* <p className="text-xs font-medium">页码: {figure.page_number}</p> */}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Dialog open={!!selectedFigure} onOpenChange={() => setSelectedFigure(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col items-center justify-center p-0">
          <DialogTitle className="hidden"/>
          {selectedFigure && (
            <>
              <div className="relative w-full h-[70vh]">
                <Image
                  src={`data:image/png;base64,${selectedFigure.img_bytes}`}
                  alt={selectedFigure.caption}
                  fill
                  className="object-contain p-4"
                />
              </div>
              <div className="w-full space-y-2 p-4 border-t bg-background">
                <p className="text-sm">{selectedFigure.caption}</p>
                {/* <p className="text-xs font-medium">页码: {selectedFigure.page_number}</p> */}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}