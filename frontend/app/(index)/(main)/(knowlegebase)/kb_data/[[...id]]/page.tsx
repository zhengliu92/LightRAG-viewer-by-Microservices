"use client"
import { usePathname } from 'next/navigation'
import React from 'react'
import { Table } from '@tanstack/react-table'
import { KBFile } from '@/interfaces/kb'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { UploadFiles } from '@/components/files/upload-files'
import { useKnowledgeBase } from '@/contexts/knowledge-base-context'
import { useGetKbWithFilesByKbId, useParseAndBuildKB } from '@/hooks/use-kb'
import { createKbFile } from '@/hooks/use-kbfile'
import { useQueryClient } from '@tanstack/react-query'
import { useInterval } from 'usehooks-ts'
import { Button } from '@/components/ui/button'
import { KBFileTable } from '@/components/kb/kbfile-table'

const KnowlegeBaseData = () => {
  const pathname = usePathname()
  const path_splits = pathname.split('/')
  const kb_id = path_splits[path_splits.length - 1]
  const {getKbById} = useKnowledgeBase()
  const kb = getKbById(kb_id)
  const kb_name = kb?.name ?? ""
  const {data: kb_files, isLoading, refetch} = useGetKbWithFilesByKbId(kb_id)
  const [tableInstance, setTableInstance] = React.useState<Table<KBFile> | null>(null)
  const [selectedRows, setSelectedRows] = React.useState<KBFile[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const queryClient = useQueryClient()
  const { parseAndBuildKBAsync } = useParseAndBuildKB()

  const hasProcessingFiles = React.useMemo(() => 
    kb_files?.kb_files?.some(file => 
      file.parse_status !== "pending" &&
      file.parse_percentage < 100 &&
      !file.is_parse_finished
    ) ?? false
  , [kb_files?.kb_files])

  const hasBuildingFiles = React.useMemo(() => 
    kb_files?.kb_files?.some(file =>
      file.build_status !== "pending" && 
      file.build_percentage < 100 &&
      !file.is_build_finished
    ) ?? false
  , [kb_files?.kb_files])

  const num_files = kb_files?.kb_files?.length ?? 0

  const refetchCallback = React.useCallback(() => {
    refetch()
  }, [refetch])

  useInterval(
    refetchCallback,
    hasBuildingFiles || hasProcessingFiles ? 3000 : null
  )
  
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  )

  if (!kb) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-muted-foreground">知识库不存在</div>
    </div>
  )

  const filteredFiles = kb_files?.kb_files?.filter(file => 
    file?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-[280px]">
            <Input
              placeholder="搜索文件"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={hasBuildingFiles || hasProcessingFiles || num_files === 0} onClick={() => parseAndBuildKBAsync({ kb_id })}>
            解析并构建全部 
          </Button>
          <UploadFiles 
            title="上传到知识库"
            currentFolder={`${kb_name}`} 
            folder_files={kb_files?.kb_files}
            onEachFileUploaded={async (file_name,file_size) => {
              await createKbFile({
                name: file_name, 
                kb_id: kb_id, 
                path: `${kb_name}/${file_name}`,
                folder: kb_name,
                size: file_size
              })
            }}
            onSuccess={() => {
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["getKbWithFilesByKbId"] });
                if (kb?.is_project_kb) {                  
                  queryClient.invalidateQueries({ queryKey: ["userProjs"] });
                  queryClient.invalidateQueries({ queryKey: ["project"] });
                } else {
                  queryClient.invalidateQueries({ queryKey: ["userKbs"] });
                }
              }, 300);
            }}
          />  
        </div>

      </div>

      {filteredFiles.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 text-center bg-background/40">
          <div className="text-muted-foreground">暂无数据</div>
        </Card>
      ) : (
        <KBFileTable
          data={filteredFiles}
          hasProcessingFiles={hasProcessingFiles}
          onSelectionChange={setSelectedRows}
          onTableInstanceChange={setTableInstance}
        />
      )}
    </div>
  )
}

export default KnowlegeBaseData
