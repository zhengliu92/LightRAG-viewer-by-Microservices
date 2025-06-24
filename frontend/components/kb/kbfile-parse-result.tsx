"use client"

import React, { useMemo, useState } from 'react'
import { FileAssets, FileText, FileFigure } from '@/interfaces/kbfile-assets'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Image from "next/image"
import ToolTipText from '@/components/tooltip_text'

type Props = {
  assets: FileAssets | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ImagePreview = ({ 
  figure, 
  isOpen, 
  onClose 
}: { 
  figure: FileFigure | null, 
  isOpen: boolean, 
  onClose: () => void 
}) => {
  if (!figure) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="sr-only">图片预览</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-[80vh]">
          <Image
            src={`data:image/png;base64,${figure.img_bytes}`}
            alt={figure.caption}
            fill
            className="object-contain"
          />
        </div>
        <div className="space-y-2 text-center">
          <ToolTipText text={figure.caption} />
          <p className="text-sm font-medium">页码: {figure.page_number}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const KbFileParseResult = ({ assets, open, onOpenChange }: Props) => {
  const [selectedFigure, setSelectedFigure] = useState<FileFigure | null>(null);

  if (!assets) return null    

  const { figures, tables, texts } = assets

  // Group texts by section
  const textsBySection = useMemo(() => {
    const sections: { [key: string]: FileText[] } = {}
    texts.forEach(text => {
      if (!sections[text.section]) {
        sections[text.section] = []
      }
      sections[text.section].push(text)
    })
    return sections
  }, [texts])

  // Group figures by section
  const figuresBySection = useMemo(() => {
    const sections: { [key: string]: typeof figures } = {}
    figures.forEach(figure => {
      if (!sections[figure.section]) {
        sections[figure.section] = []
      }
      sections[figure.section].push(figure)
    })
    return sections
  }, [figures])

  // Group tables by section
  const tablesBySection = useMemo(() => {
    const sections: { [key: string]: typeof tables } = {}
    tables.forEach(table => {
      if (!sections[table.section]) {
        sections[table.section] = []
      }
      sections[table.section].push(table)
    })
    return sections
  }, [tables])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
          <div className="flex flex-col gap-2">
            <DialogHeader className="pb-0 mb-2">
              <DialogTitle>文件解析结果</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="texts" className="w-full h-full">
              <TabsList className="mb-2">
                <TabsTrigger value="texts">文本 ({texts.length})</TabsTrigger>
                <TabsTrigger value="figures">图片 ({figures.length})</TabsTrigger>
                <TabsTrigger value="tables">表格 ({tables.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="figures" className="h-full">
                <ScrollArea className="h-full pr-4">
                  <Accordion type="multiple" className="space-y-4">
                    {Object.entries(figuresBySection).map(([section, sectionFigures]) => (
                      <AccordionItem value={section} key={section}>
                        <AccordionTrigger className="text-base hover:no-underline">
                          {section}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-2 gap-4 pt-4 max-md:grid-cols-1">
                            {sectionFigures.map((figure) => (
                              <div key={figure.id} className="border rounded-lg p-4 space-y-2">
                                <div 
                                  className="relative aspect-video w-full cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setSelectedFigure(figure)}
                                >
                                  <Image
                                    src={`data:image/png;base64,${figure.img_bytes}`}
                                    alt={figure.caption}
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm text-muted-foreground">{figure.caption}</p>
                                  <p className="text-sm font-medium">页码: {figure.page_number}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="tables" className="h-[calc(100%-2.5rem)]">
                <ScrollArea className="h-full pr-4">
                  <Accordion type="multiple" className="space-y-4">
                    {Object.entries(tablesBySection).map(([section, sectionTables]) => (
                      <AccordionItem value={section} key={section}>
                        <AccordionTrigger className="text-base hover:no-underline">
                          {section}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-4">
                            {sectionTables.map((table) => (
                              <div key={table.id} className="border rounded-lg p-4 space-y-2">
                                <div 
                                  className="prose max-w-none dark:prose-invert"
                                  dangerouslySetInnerHTML={{ __html: table.table_html }} 
                                />
                                <div className="space-y-1">
                                  <p className="text-sm text-muted-foreground">{table.caption}</p>
                                  <p className="text-sm font-medium">页码: {table.page_number}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="texts" className="h-[calc(100%-2.5rem)]">
                <ScrollArea className="h-full pr-4">
                  <Accordion type="multiple" className="space-y-2">
                    {Object.entries(textsBySection).map(([section, sectionTexts]) => (
                      <AccordionItem value={section} key={section}>
                        <AccordionTrigger className="text-base hover:no-underline">
                          {section}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-4">
                            {sectionTexts.map((text) => (
                              <div key={text.id} className="border rounded-lg p-4 space-y-2">
                                <p className="whitespace-pre-wrap text-sm">{text.text}</p>
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">页码: {text.page_number}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <ImagePreview 
        figure={selectedFigure} 
        isOpen={!!selectedFigure} 
        onClose={() => setSelectedFigure(null)} 
      />
    </>
  )
}

export default KbFileParseResult