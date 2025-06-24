"use client"

import { SearchInput } from "@/components/files/search-input"
import { UserManageTable } from "@/components/manage-user/user-manage-table"
import { useProject } from "@/contexts/proj-context"
import { UserWithProjects } from "@/interfaces/proj"
import { Table } from "@tanstack/react-table"
import { useState } from "react"
import UserAddDialog from "./user-add-dialog"
import { Button } from "../ui/button"
import HandleBatchUsers from "./handle-batch-users"
import { PlusIcon, Search } from "lucide-react"
import { CheckSquare, Square } from "lucide-react"

export default function UserManageComponent() {
    const { userWithProjects } = useProject()
    const [tableInstance, setTableInstance] = useState<Table<UserWithProjects> | null>(null)
    const [selectedRows, setSelectedRows] = useState<UserWithProjects[]>([])
    return <>
    <div className="flex justify-between items-center">
    <div className="flex items-center gap-2">
        
    {tableInstance && 
    <SearchInput table={tableInstance}  placeholder="查找用户" field="username" />
    }
    {/* <Button
     variant="outline"
     size="sm"
     className="flex items-center gap-2"
     onClick={() => {
        tableInstance?.toggleAllRowsSelected(true)
     }}>
        <CheckSquare className="w-4 h-4" />
        选择全部
    </Button>
    <Button
     variant="outline"
     size="sm"
     className="flex items-center gap-2"
     onClick={() => {
       tableInstance?.toggleAllRowsSelected(false)
     }}>
        <Square className="w-4 h-4" />
        取消选择
    </Button>
    {selectedRows.length > 0 && <HandleBatchUsers selectedRows={selectedRows} />}
     */}
    </div>
        <UserAddDialog />
    </div>
        <UserManageTable data={userWithProjects || []} onSelectionChange={setSelectedRows} onTableInstanceChange={setTableInstance} />
    </>
}