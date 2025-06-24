import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, Folder, Link, LucideIcon, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { getIconByExt } from "@/utils/getIcon"
import { ToolTipButton } from "@/components/tooltip_button"
import * as React from "react"
import {  getFileContent } from "@/hooks/use-file"
import ToolTipText from "@/components/tooltip_text"
import { KBFileWithKBs } from "@/interfaces/kb"
import { useState } from "react"
import { useDeleteKbFiles } from "@/hooks/use-kb"
import { LinkKbFileWithKB } from "./link-kbfile-kb"
import DisplayKbNames from "./display-kb-names"
import { useKnowledgeBase } from "@/contexts/knowledge-base-context"


interface FileColumnsProps {
  folderName: string
  setCurrentFolder: (folder: string) => void
}

export const useFileColumns = ({ folderName, setCurrentFolder }: FileColumnsProps) => {
  const [isBindKbOpen, setIsBindKbOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<KBFileWithKBs | null>(null)
  const { mutate: deleteKbFiles } = useDeleteKbFiles()
  const { all_kbs: kbs } = useKnowledgeBase()
  
  const columns: ColumnDef<KBFileWithKBs>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: ({ column }) => (
            <Button
                className="text-left "
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                文件名
                <ArrowUpDown />
            </Button>
        ), 
        cell: ({ row }) => {
            const fileName = row.getValue("name") as string
            const isFolder = fileName.endsWith('/')
            let icon: LucideIcon
            if (!isFolder) {
                const fileExt = fileName.split('.').pop() || ''
                icon = getIconByExt(fileExt)
                return (
                    <div className="capitalize flex items-center gap-2 max-w-[15em] ">
                        <div className="flex-center w-5 h-5 text-primary">
                            {React.createElement(icon)}
                        </div>
                        <ToolTipText text={fileName}  />
                    </div>
                )
            } else {
                icon = Folder
                const fileNameNoSlash = fileName.endsWith('/') ? fileName.slice(0, -1) : fileName
                return (
                    <div className="capitalize flex items-center gap-2 max-w-[15em]">
                       <div className="flex-center w-5 h-5 text-primary">
                            {React.createElement(icon)}
                        </div>                       
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="px-1 w-fit" 
                            onClick={() => setCurrentFolder(folderName==="" ? fileNameNoSlash : folderName + "/" + fileNameNoSlash)}
                        >
                            <ToolTipText text={fileName} className="max-w-[15em]" />
                        </Button>
                    </div>
                )
            }
        },
    },
    {
        accessorKey: "size",
        header: () => (
            <span>
                大小
            </span>
        ),
        cell: ({ row }) => {
            const size = Number(row.getValue("size"))
            const classname = "text-left font-medium"
            if (size < 1024) {
                return <div className={classname}>{size.toFixed(2)} B</div>
            }
            if (size < 1024 * 1024) {
                return <div className={classname}>{(size / 1024).toFixed(2)} KB</div>
            }
            if (size < 1024 * 1024 * 1024) {
                return <div className={classname}>{(size / 1024 / 1024).toFixed(2)} MB</div>
            }
            return <div className={classname}>{(size / 1024 / 1024 / 1024).toFixed(2)} GB</div>
        },
    },
    {
        accessorKey: "created_at",
        header: ({ column }) => (
            <Button
                className="text-left"
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                创建时间
                <ArrowUpDown />
            </Button>
        ),         cell: ({ row }) => {
            const date = row.getValue("created_at") as string
            const date_time = new Date(date)
            const classname = "text-left font-medium"
            if (date_time.getFullYear() < 1999) return <div className={classname} />
            return <div className={classname}>{date_time.toLocaleString()}</div>
        },
    },
    {
        accessorKey: "kbs",
        header: ({ column }) => (
            <Button
                className="text-left"
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                知识库
                <ArrowUpDown />
            </Button>
        ), 
        cell: ({ row }) => {
            return <DisplayKbNames row={row} />
        },
    },
    {
        id: "actions",
        enableHiding: false,
        header: () => <div className="text-left pl-4">操作</div>,
        cell: ({ row }) => {
            const file = row.original
            const isFolder = file.name.endsWith('/') 
            const menuItems = [
                {
                    name: "绑定知识库",
                    icon: <Link />,
                    onClick: async () => {
                        setSelectedFile(file)
                        setIsBindKbOpen(true)
                    },
                    disabled: isFolder || kbs?.length === 0
                },
                {
                    name: "查看", 
                    icon: <Eye />,
                    onClick: async () => {
                        await getFileContent({ file_id: file.id });
                    },
                    disabled: isFolder
                },
                {
                    name: "删除",
                    icon: <Trash />,
                    onClick: async () => {
                        deleteKbFiles({ file_ids: [file.id] });
                    }
                }
            ]

            return (
                <>
                     <div className="flex items-center justify-start gap-0">
                        {menuItems.map(item => {
                            return (
                                <ToolTipButton 
                                    key={item.name}
                                    tooltip={item.name} 
                                    onClick={item.onClick} 
                                    icon={item.icon} 
                                    disabled={item.disabled}
                                />
                            );
                        })}
                     </div>
       
                    {selectedFile && (
                        <LinkKbFileWithKB
                            file={selectedFile}
                            open={isBindKbOpen}
                            kbs={kbs || []}
                            setOpen={setIsBindKbOpen}
                            onSuccess={() => {
                                setSelectedFile(null)
                            }}
                        />
                    )}
                </>
            )
        },
    },
]

  return columns
} 