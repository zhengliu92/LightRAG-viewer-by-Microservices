import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
  } from "@/components/ui/sheet"
  import { QueryTableResult } from "@/interfaces/kbfile-assets"
  import { ScrollArea } from "@/components/ui/scroll-area"
  import { cn } from "@/lib/utils"
  import { useState } from "react"
  import { Dialog, DialogContent } from "@/components/ui/dialog"
  import { DialogTitle } from "@radix-ui/react-dialog"
  
  type QueriedTablesProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    queriedTables: QueryTableResult[]
  }

  export default function SheetQueriedTables({ open, onOpenChange, queriedTables }: QueriedTablesProps) {
    const [selectedTable, setSelectedTable] = useState<QueryTableResult | null>(null)

    if (queriedTables.length === 0) {
      return null
    }

    return (
      <>
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
            <SheetHeader className="p-6 pb-2">
              <SheetTitle>查询到的表格</SheetTitle>
              <SheetDescription>
                找到 {queriedTables.length} 个相关表格
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-8rem)] px-6">
              <div className="grid gap-4 pb-6">
                {queriedTables.map((table) => (
                  <div 
                    key={table.id} 
                    className={cn(
                      "relative border rounded-lg p-4 space-y-2",
                      "hover:bg-accent/50 transition-colors cursor-pointer"
                    )}
                    onClick={() => setSelectedTable(table)}
                  >
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground line-clamp-2">{table.content}</p>
                      <p className="text-xs font-medium">相关度: {Math.round(table.score * 100)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <Dialog open={!!selectedTable} onOpenChange={() => setSelectedTable(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6">
            <DialogTitle className="hidden"/>
            {selectedTable && (
              <>
                <div 
                  className="prose max-w-none dark:prose-invert overflow-auto"
                  dangerouslySetInnerHTML={{ __html: selectedTable.table_html }} 
                />
                <div className="w-full space-y-2 pt-4 border-t mt-4">
                  <p className="text-sm">{selectedTable.content}</p>
                  <p className="text-xs font-medium">相关度: {Math.round(selectedTable.score * 100)}%</p>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </>
    )
  }