import * as React from "react"
import {
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    Table as TableInstance
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { KBFile } from "@/interfaces/kb"
import { useKBFileColumns } from "./kbfile-columns"

interface FileTableProps {
    data: KBFile[]
    hasProcessingFiles: boolean
    onTableInstanceChange?: (table: TableInstance<KBFile>) => void
    onSelectionChange?: (selectedRows: KBFile[]) => void
}
    
export function KBFileTable({ data, hasProcessingFiles, onTableInstanceChange,  onSelectionChange }: FileTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([
        { id: "name", desc: false }
    ])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    
    // 将分页状态持久化到组件外部
    const [pageIndex, setPageIndex] = React.useState(0)
    const [pageSize, setPageSize] = React.useState(10)

    const columns = useKBFileColumns(hasProcessingFiles)
    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        // 修改分页处理
        onPaginationChange: (updater) => {
            if (typeof updater === 'function') {
                const newPagination = updater({ pageIndex, pageSize })
                setPageIndex(newPagination.pageIndex)
                setPageSize(newPagination.pageSize)
            } else {
                setPageIndex(updater.pageIndex)
                setPageSize(updater.pageSize)
            }
        },
        onRowSelectionChange: (updater) => {
            const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
            setRowSelection(newSelection);
            const selectedRows = data.filter((_, index) => newSelection[index]);
            onSelectionChange?.(selectedRows);
        },
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination: {
                pageIndex,
                pageSize,
            },
        },
        // 添加自动重置配置
        autoResetPageIndex: false, // 防止数据变化时重置页码
    })

    React.useEffect(() => {
        if (data.length === 0) {
            setPageIndex(0)
            setPageSize(10)
        }
    }, [data])

    React.useEffect(() => {
        onTableInstanceChange?.(table)
    }, [table, onTableInstanceChange])

    return (
        <div className="w-full overflow-y-auto">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    没有结果
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex items-center space-x-2">
                    <p className="text-sm text-muted-foreground">
                        Page {table.getState().pagination.pageIndex + 1} of{" "}
                        {table.getPageCount()}
                    </p>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            table.setPageSize(Number(e.target.value))
                        }}
                        className="h-8 w-[70px] rounded-md border border-input bg-background px-2 py-1 text-sm"
                    >
                        {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                            <option key={pageSize} value={pageSize}>
                                {pageSize}
                            </option>
                        ))}
                    </select>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        上一页
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        下一页
                    </Button>
                </div>
            </div>
        </div>
    )
} 