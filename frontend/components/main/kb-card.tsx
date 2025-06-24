import React, { useState } from 'react'
import { KnowledgeBaseCard } from '@/components/main/knowledge-base-card'
import { IKb } from '@/interfaces/kb'
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQueryClient } from '@tanstack/react-query'

type KBCardListProps = {
    kbs: IKb[]
    onSuccess?: () => void
    itemsPerPage?: number
    enableSearch?: boolean
}

const KBCardList = ({ kbs, onSuccess, itemsPerPage: defaultItemsPerPage = 6, enableSearch = true }: KBCardListProps) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage)
  const queryClient = useQueryClient()
  const filteredKbs = kbs.filter(kb => 
    kb?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const totalPages = Math.ceil(filteredKbs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentKbs = filteredKbs.slice(startIndex, endIndex)

  // Reset to first page when search query changes or items per page changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, itemsPerPage])

  return (
    <div className="space-y-4">
      { enableSearch && <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索知识库..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={() => {
          setSearchQuery("")
          setCurrentPage(1)
          queryClient.invalidateQueries({ queryKey: ["userProjs"] });
          queryClient.invalidateQueries({ queryKey: ["projectKbs"] });
          queryClient.invalidateQueries({ queryKey: ["userKbs"] });
          queryClient.invalidateQueries({ queryKey: ["projects"] });
        }}>
          刷新
        </Button>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => setItemsPerPage(Number(value))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="每页显示" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 条/页</SelectItem>
            <SelectItem value="6">6 条/页</SelectItem>
            <SelectItem value="12">12 条/页</SelectItem>
            <SelectItem value="24">24 条/页</SelectItem>
          </SelectContent>
        </Select>
      </div>}

     <div className="grid grid-cols-1  md:grid-cols-2 lg:grid-cols-3 gap-4 my-4 ">
        {currentKbs?.map((kb) => (
          <KnowledgeBaseCard 
            key={kb.id}
            kb={kb}
            onSuccess={onSuccess}
          />
        ))}
      </div> 

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">
              {currentPage}
            </span>
            <span className="text-sm text-muted-foreground">/ {totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default KBCardList