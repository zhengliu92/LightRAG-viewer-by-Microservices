"use client"

import * as React from "react"
import { BreadcrumbComp } from "@/components/breadcrumb_comp"
import { Table } from "@tanstack/react-table"
import { CreateFolder } from "@/components/files/create-folder"
import { BatchOperation } from "@/components/files/batch-operation"
import { UploadFiles } from "@/components/files/upload-files"
import { FileTable } from "@/components/files/file-table"
import { SearchInput } from "@/components/files/search-input"
import { KBFileWithKBs } from "@/interfaces/kb"
import { useFolder } from "@/contexts/folder-context"
import { createKbFile } from "@/hooks/use-kbfile"
import { useQueryClient } from "@tanstack/react-query"


export default function FilesPage() {
    const [mounted, setMounted] = React.useState(false)
    const { files, currentFolder, invalidateListUserFiles, setCurrentFolder } = useFolder()
    const [tableInstance, setTableInstance] = React.useState<Table<KBFileWithKBs> | null>(null)
    const [selectedRows, setSelectedRows] = React.useState<KBFileWithKBs[]>([])
    const queryClient = useQueryClient()    

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div>Loading...</div>
    }

    
    return (
        <div className="w-full px-5 ">
            <div className="flex items-center justify-between py-4">
                <BreadcrumbComp folder={currentFolder} setCurrentFolder={setCurrentFolder} />
                <div className="flex items-center gap-2">
                    {selectedRows.length > 0 && (
                        <BatchOperation 
                            table={tableInstance}
                            selectedRows={selectedRows}
                            onSuccess={() => {
                              queryClient.invalidateQueries({ queryKey: ['getKBFilesByFolder'] })
                            }}
                        />
                    )}
                    <CreateFolder 
                        currentPath={currentFolder} 
                        folder_files={files}
                        onSuccess={async () => {
                            await invalidateListUserFiles();
                        }}
                    />
                    <UploadFiles 
                        currentFolder={currentFolder} 
                        folder_files={files}
                        onSuccess={async () => {
                            await new Promise(resolve => setTimeout(resolve, 300));
                            await invalidateListUserFiles();
                        }}
                        onEachFileUploaded={
                            async (file_name,file_size) => {
                                await createKbFile({
                                  name: file_name,
                                  path: currentFolder===""?file_name:[currentFolder, file_name].join("/"),
                                  folder: currentFolder,
                                  size: file_size,
                                })
                            }   
                        }
                    />
                    {tableInstance && <SearchInput table={tableInstance} placeholder="过滤文件名" />}
                </div>
            </div>
            <FileTable 
                data={files || []} 
                folderName={currentFolder}
                setCurrentFolder={setCurrentFolder}
                onTableInstanceChange={setTableInstance}
                onSelectionChange={setSelectedRows}
            />
        </div>
    )
}
