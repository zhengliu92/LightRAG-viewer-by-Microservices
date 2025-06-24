import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, ListVideo, LucideIcon,ScanEye,StopCircle,Unlink, Waypoints } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getIconByExt } from "@/utils/getIcon"
import * as React from "react"
import ToolTipText from "@/components/tooltip_text"
import { KBFile } from "@/interfaces/kb"
import { ToolTipButton } from "@/components/tooltip_button"
import { useRemoveFileFromKb, useStartBuildKbFile, useStartParseKBFile, useStopBuildKbFile } from "@/hooks/use-kbfile"
import { usePathname } from "next/navigation"
import { getFileContent } from "@/hooks/use-file"
import { cn } from "@/lib/utils"
import { useGetKbFileAssets } from "@/hooks/use-kbfile-assets"
import { FileAssets } from "@/interfaces/kbfile-assets"
import { useState, useEffect } from "react"
import KbFileParseResult from "./kbfile-parse-result"
import { useUserContext } from "@/contexts/user-context"

const userNameCache = new Map<string, string>();

export const useKBFileColumns = (hasProcessingFiles: boolean) => {
    const pathname = usePathname()
    const path_splits = pathname.split('/')
    const kb_id = path_splits[path_splits.length - 1]
    const {  AsyncRemoveFileFromKb } = useRemoveFileFromKb()
    const { getUserInfo } = useUserContext()
    const { AsyncStartParseKBFile } = useStartParseKBFile()
    const { getKbFileAssetsAsync } = useGetKbFileAssets()
    const { AsyncStartBuildKbFile } = useStartBuildKbFile()
    const { AsyncStopBuildKbFile } = useStopBuildKbFile()
    const [assets, setAssets] = useState<FileAssets | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const columns: ColumnDef<KBFile>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => (
            <Button
                className="text-left"
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                文件名
                <ArrowUpDown />
            </Button>
        ), 
        cell: ({ row }) => {
            const fileName = row.getValue("name") as string
            let icon: LucideIcon
            const fileExt = fileName.split('.').pop() || ''
            icon = getIconByExt(fileExt)
            return (
                <div className="capitalize flex items-center gap-2 ">
                    <div className="flex-center w-5 h-5 text-primary">
                        {React.createElement(icon)}
                    </div>
                    <ToolTipText text={fileName} />
                </div>
            )
        },
    },
    {
        accessorKey: "owner_username",
        header: () => (
            <span className="text-nowrap">
                创建人
            </span>
        ),
        cell: ({ row }) => {
            const classname = "text-left font-medium text-nowrap w-[4em]"
            const [username, setUsername] = useState(() => userNameCache.get(row.original.owner_id) || "")
            
            useEffect(() => {
                const owner_id = row.original.owner_id;
                if (!username && owner_id) {
                    getUserInfo(owner_id).then(res => {
                        if (res?.user) {
                            const newUsername = res.user.username;
                            userNameCache.set(owner_id, newUsername);
                            setUsername(newUsername);
                        }
                    })
                }
            }, [row.original.owner_id, username])
            
            return <div className={classname}>{username}</div>
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
            const classname = "text-left font-medium text-nowrap"
            if (date_time.getFullYear() < 1999) return <div className={classname} />
            return <div className={classname}>{date_time.toLocaleString()}</div>
        },
    },

    {
        accessorKey: "parse_status",
        header: () => (
            <span className="text-nowrap">
                解析状态
            </span>
        ),
        cell: ({ row }) => {
            const r = row.original
            const status = r.parse_status
            const pp = r.parse_percentage
            const is_parse_failed = r.is_parse_failed
            const finished_no_error = pp===100 && r.is_parse_finished && !is_parse_failed
            const is_queuing = r.parse_status === "queuing"
            const is_parsing = pp > 0 && pp < 100 && !is_parse_failed && !is_queuing
            const is_pending = pp === 0 && !is_parse_failed
            const base_classname= "text-left font-medium text-nowrap w-[7em]"
            return <div className={cn(base_classname, "flex items-center justify-start", {
                "text-sky-500": finished_no_error,
                "text-green-500": is_parsing,
                "text-orange-500": is_pending,
                "text-red-500": is_parse_failed,
                "text-orange-500 animate-pulse": is_queuing
            })}>
                <ToolTipText text={status} />
                {finished_no_error && <ToolTipButton tooltip="查看解析结果" icon={<ScanEye />} disabled = {hasProcessingFiles} onClick={async () => {
                    const kb_file_id = row.original.id
                    const assets = await getKbFileAssetsAsync(kb_file_id)
                    if (assets.data) {
                        setAssets({
                            figures: assets.data?.file_figures || [],
                            tables: assets.data?.file_tables || [],
                            texts: assets.data?.file_texts || [],
                        })
                        setIsOpen(true)
                    }
                }} />}
                <KbFileParseResult assets={assets} open={isOpen} onOpenChange={setIsOpen} />

            </div>
        },
    },
    {
        accessorKey: "parse_progress",
        header: () => (
            <span className="text-nowrap">
                解析进度
            </span>
        ),
        cell: ({ row }) => {
            const progress = row.original.parse_percentage
             const base_classname= "text-left font-medium text-nowrap"
            return <div className={cn(base_classname, "")}>{progress}%</div>
        },
    },
    {
        accessorKey: "build_status",
        header: () => (
            <span className="text-nowrap">
                构建状态
            </span>
        ),
        cell: ({ row }) => {
            const r = row.original
            const status = r.build_status
            const pp = r.build_percentage
            const is_build_failed = r.is_build_failed
            const finished_no_error = pp===100 && r.is_build_finished && !is_build_failed
            const is_queuing = r.build_status === "queuing"
            const is_building = pp > 0 && pp < 100 && !is_build_failed && !is_queuing
            const is_pending = pp === 0 && !is_build_failed
            const base_classname= "text-left font-medium text-nowrap w-[7em] gap-1"
            return <div className={cn(base_classname, "flex items-center justify-start", {
                "text-sky-500": finished_no_error,
                "text-green-500": is_building,
                "text-orange-500": is_pending,
                "text-red-500": is_build_failed,
                "text-orange-500 animate-pulse": is_queuing
            })  }>
                {is_building && <button  className="w-4 h-4 " onClick={() => {
                    const kb_file_id = row.original.id
                    AsyncStopBuildKbFile({ kb_id, kb_file_id })
                }}>
                    <StopCircle className="w-4 h-4 btn-red animate-pulse" />
                </button>}
                <ToolTipText text={status} />
            </div>
        },
    },
    {
        accessorKey: "build_progress",
        header: () => (
            <span className="text-nowrap">
                构建进度
            </span>
        ),
        cell: ({ row }) => {
            const progress = row.original.build_percentage
            const base_classname= "text-left font-medium text-nowrap w-[7em]"
            return <div className={cn(base_classname, "")}>{progress}%</div>
        },
    },
    {
        id: "actions",
        enableHiding: false,
        header: () => <div className="text-left pl-4">操作</div>,
        cell: ({ row }) => {
            const r = row.original
            const disable_parse = (r.parse_percentage > 0 && r.parse_percentage <100)  || (r.is_parse_failed === false && r.is_parse_finished === true ) 

            const disable_build = (r.build_percentage > 0 && r.build_percentage <100) || (r.is_build_failed === false && r.is_build_finished === true ) || r.is_parse_failed === true || r.is_parse_finished === false 

            const menuItems = [
                {
                    name: "查看", 
                    icon: <Eye />,
                    onClick: async () => {
                        await getFileContent({ file_id: r.id });
                    },
                    disabled: false,
                },
                {
                    name:"解析",
                    icon: <ListVideo />,
                    onClick: async () => {
                        const kb_file_id = r.id
                        await AsyncStartParseKBFile({ kb_file_id });
                    },  
                    disabled: disable_parse
                },
                {
                    name: "构建知识图谱",
                    icon: <Waypoints />,
                    onClick: async () => {
                        const kb_file_id = row.original.id
                        await AsyncStartBuildKbFile({ kb_id, kb_file_id})
                    },
                    disabled: disable_build
                },
                {
                    name: "从知识库中移除，但保留原文件",
                    icon: <Unlink  />,
                    onClick: async () => {
                        const kb_file_id = row.original.id
                        await AsyncRemoveFileFromKb({ kb_id, kb_file_id })
                    },
                    disabled: r.parse_percentage > 0 && r.parse_percentage <100 || r.build_percentage > 0 && r.build_percentage <100
                },

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
                </>
            )
        },
    },
]
return columns
}