import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { deleteKBFiles } from "@/hooks/use-kb"
import {  addFileToKbAsync, removeFileFromKbAsync } from "@/hooks/use-kbfile"
import { useKnowledgeBase } from "@/contexts/knowledge-base-context"
import {  KBFileWithKBs } from "@/interfaces/kb"
import { Table } from "@tanstack/react-table"
import { Trash2, ChevronDown } from "lucide-react"
import { toast } from "sonner"

interface BatchOperationProps {
    table: Table<KBFileWithKBs> | null
    selectedRows: KBFileWithKBs[]; 
    onSuccess?: () => void;
}

export function BatchOperation({ table, selectedRows, onSuccess }: BatchOperationProps) {
    const {all_kbs:kbs} = useKnowledgeBase();

    const handleDelete = async () => {
        if (!table) return;
        try {
            // Get all selected files
            const file_ids = selectedRows.map(row => `${row.id}`);
            if (file_ids.length === 0) {
                toast.error("请选择要删除的文件");
                return;
            }
            await deleteKBFiles({ file_ids: file_ids });
            toast.success("删除成功");
            onSuccess?.();
            table.resetRowSelection();
        } catch (error) {
            toast.error("删除失败");
            console.error("Failed to delete files:", error);
        }
    }

    const handleAddToKB = async (kb_id: string) => {
        if (!table) return;
        try {
            if (selectedRows.length=== 0) {
                toast.error("请选择要添加的文件");
                return;
            }
            const reqs = []
            for (const file of selectedRows) {
                if (file.kbs && file.kbs.some(kb => kb.id === kb_id)) {
                    continue;
                }
                reqs.push(addFileToKbAsync({ kb_id, kb_file_id: file.id }));
            }
            if (reqs.length === 0) {
                toast.error("文件已存在");
                return;
            }
            await Promise.all(reqs);

            toast.success("添加成功");
            onSuccess?.();
            table.resetRowSelection();
        } catch (error) {
            toast.error("添加失败");
            console.error("Failed to add files to KB:", error);
        }
    }

    const handleRemoveFromKB = async (kb_id: string) => {
        if (!table) return;
        try {
            const file_ids = selectedRows.map(row => `${row.id}`);
            if (file_ids.length === 0) {
                toast.error("请选择要移除的文件");
                return;
            }
            const reqs = []
            for (const file of selectedRows) {
                if (file.kbs && file.kbs.some(kb => kb.id === kb_id)) {
                    reqs.push(removeFileFromKbAsync({ kb_id, kb_file_id: file.id }));
                }
            }
            if (reqs.length === 0) {
                toast.error("文件已不在知识库中");
                return;
            }
            await Promise.all(reqs);
            toast.success("移除成功");
            onSuccess?.();
            table.resetRowSelection();
        } catch (error) {
            toast.error("移除失败");
            console.error("Failed to remove files from KB:", error);
        }
    }





    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    批量操作
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600 gap-2 cursor-pointer"
                    onClick={handleDelete}
                >
                    <Trash2 className="h-4 w-4" />
                    <span>删除选中</span>
                </DropdownMenuItem>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2 cursor-pointer">
                        <span>添加到知识库</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {kbs?.length && kbs?.length > 0 ? kbs?.map((kb) => (
                            <DropdownMenuItem
                                key={kb.id}
                                onClick={() => handleAddToKB(kb.id)}
                                className="cursor-pointer"
                            >
                                <div className="flex items-center gap-2 justify-between w-full">
                                    <span className="text-sm flex-1">{kb.name}</span>
                                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary/50 rounded">
                                        {kb.is_project_kb ? "项目库" : "个人库"}
                                    </span>
                                </div>
                            </DropdownMenuItem>
                        )): <DropdownMenuItem className="text-xs text-muted-foreground">请先创建知识库</DropdownMenuItem>}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2 cursor-pointer">
                        <span>从知识库移除</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {kbs?.length && kbs?.length > 0 ? kbs?.map((kb) => (
                            <DropdownMenuItem
                                key={kb.id}
                                onClick={() => handleRemoveFromKB(kb.id)}
                                className="cursor-pointer"
                            >
                            <div className="flex items-center gap-2 justify-between w-full">
                            <span className="text-sm flex-1">{kb.name}</span>
                            <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary/50 rounded">
                                {kb.is_project_kb ? "项目库" : "个人库"}
                            </span>
                            </div>
                            </DropdownMenuItem>
                        )): <DropdownMenuItem className="text-xs text-muted-foreground">请先创建知识库</DropdownMenuItem>}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

            </DropdownMenuContent>
        </DropdownMenu>
    )
}
