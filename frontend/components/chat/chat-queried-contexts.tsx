import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { QueryKBContextResponse } from "@/interfaces/kbfile-assets"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useMemo, useState } from "react"

type QueriedContextsProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  queriedContexts: QueryKBContextResponse | null
}

type ParsedEntity = {
  id: string
  entity: string
  type: string
  description: string
  rank: number
}

type ParsedTextUnit = {
  id: string
  content: string
}

type ParsedRelation = {
  id: string
  source: string
  target: string
  description: string
  keywords: string[]
  weight: number
  rank: number
  createdAt: string
}

function TextContent({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = content.length > 200;
  
  const displayContent = shouldTruncate && !isExpanded
    ? content.slice(0, 200) + '...'
    : content;

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground whitespace-pre-wrap">
        {displayContent}
      </div>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-primary hover:underline focus:outline-none"
        >
          {isExpanded ? '收起' : '显示更多'}
        </button>
      )}
    </div>
  );
}

export default function SheetQueriedContexts({ open, onOpenChange, queriedContexts }: QueriedContextsProps) {
  if (!queriedContexts) {
    return null
  }

  const parsedEntities = useMemo(() => {
    return queriedContexts.entities_context.map((context) => {
      if (context === "id|entity|type|description|rank") return null;
      const [id, entity, type, description, rank] = context.split("|")
      return {
        id,
        entity,
        type,
        description,
        rank: parseInt(rank)
      } as ParsedEntity
    })
    .filter((entity): entity is ParsedEntity => entity !== null)
    .sort((a, b) => b.rank - a.rank)
  }, [queriedContexts.entities_context])

  const parsedTextUnits = useMemo(() => {
    return queriedContexts.text_units_context.map((context) => {
      if (context === "id|content") return null;
      const [id, content] = context.split("|")
      return {
        id,
        content
      } as ParsedTextUnit
    })
    .filter((unit): unit is ParsedTextUnit => unit !== null)
  }, [queriedContexts.text_units_context])

  const parsedRelations = useMemo(() => {
    return queriedContexts.relations_context.map((context) => {
      if (context === "id|source|target|description|keywords|weight|rank|created_at") return null;
      const [id, source, target, description, keywords, weight, rank, createdAt] = context.split("|")
      return {
        id,
        source,
        target,
        description,
        keywords: keywords.split('，'),
        weight: parseFloat(weight),
        rank: parseInt(rank),
        createdAt
      } as ParsedRelation
    }).filter((relation): relation is ParsedRelation => relation !== null)
  }, [queriedContexts.relations_context])

  const totalContexts = (
    parsedEntities.length + parsedTextUnits.length + parsedRelations.length
  )

  if (totalContexts === 0) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[600px] sm:w-[540px] p-0">
        <SheetHeader className="p-6 pb-2"> 
          <SheetTitle>查询到的引用</SheetTitle>
          <SheetDescription>
            找到 {totalContexts} 个相关引用
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] px-6">
          <Accordion type="multiple" className="pb-6">
            {parsedEntities.length > 0 && (
              <AccordionItem value="entities">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span>实体</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {parsedEntities.length} 个结果
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-3 pt-2">
                    {parsedEntities.map((entity) => (
                      <div 
                        key={entity.id}
                        className={cn(
                          "relative border rounded-lg p-4 space-y-2",
                          "hover:bg-accent/50 transition-colors"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="font-medium max-w-[100px] truncate block">
                                    {entity.entity}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{entity.entity}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Badge 
                              variant="secondary" 
                              className="font-normal"
                            >
                              {entity.type}
                            </Badge>
                          </div>
                          <Badge 
                            variant="outline"
                            className="shrink-0"
                          >
                            Rank {entity.rank}
                          </Badge>
                        </div>  
                        <p className="text-xs text-muted-foreground">
                          {entity.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {parsedRelations.length > 0 && (
              <AccordionItem value="relations">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span>关系</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {parsedRelations.length} 个结果
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-2 pt-2">
                    {parsedRelations.map((relation) => (
                      <div 
                        key={relation.id}
                        className={cn(
                          "relative border rounded-lg p-4 space-y-3",
                          "hover:bg-accent/50 transition-colors"
                        )}
                      >
                        <div className="flex flex-col gap-2">
                          <div className=" text-sm flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="font-medium max-w-[100px] truncate block">
                                      {relation.source}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{relation.source}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <span className="text-muted-foreground">→</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="font-medium max-w-[100px] truncate block">
                                      {relation.target}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{relation.target}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              </div>
                              <Badge variant="outline" className="font-mono">
                              {relation.weight.toFixed(1)}
                              </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {relation.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {relation.keywords.map((keyword, idx) => (
                              <Badge 
                                key={idx}
                                variant="secondary"
                                className="text-xs"
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {parsedTextUnits.length > 0 && (
              <AccordionItem value="text-units">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span>文本</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {parsedTextUnits.length} 个结果
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-3 pt-2">
                    {parsedTextUnits.map((unit) => (
                      <div 
                        key={unit.id}
                        className={cn(
                          "relative border rounded-lg p-4",
                          "hover:bg-accent/50 transition-colors"
                        )}
                      >
                        <TextContent content={unit.content} />
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}    
          </Accordion>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}