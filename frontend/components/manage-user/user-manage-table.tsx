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
import { UserWithProjects } from "@/interfaces/proj"
import { useUserManageColumns } from "./user-manage-columns"

interface UserManageTableProps {
    data: UserWithProjects[]
    onTableInstanceChange?: (table: TableInstance<UserWithProjects>) => void
    onSelectionChange?: (selectedRows: UserWithProjects[]) => void
}
    
export function UserManageTable({ data, onTableInstanceChange,  onSelectionChange }: UserManageTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([
        { id: "username", desc: false }
    ])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    const columns = useUserManageColumns()
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
        onRowSelectionChange: (updater) => {
            const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
            setRowSelection(newSelection);
            // Get selected rows
            const selectedRows = data.filter((_, index) => newSelection[index]);
            onSelectionChange?.(selectedRows);
        },
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,

        },
    })

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
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} 行被选中
                </div>
                <div className="flex items-center space-x-2">
                    <p className="text-sm text-muted-foreground">
                        Page {table.getState().pagination.pageIndex + 1} of{" "}
                        {table.getPageCount()}
                    </p>
                    <select
                        value={table.getState().pagination.pageSize}
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