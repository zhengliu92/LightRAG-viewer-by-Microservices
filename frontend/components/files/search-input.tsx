import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Table } from "@tanstack/react-table"
import { Search } from "lucide-react"
import { useState } from "react"

interface SearchInputProps<T> {
    table: Table<T>
    placeholder?: string
    field?: string
    className?: string
}

export function SearchInput<T>({ table, placeholder, field, className }: SearchInputProps<T>) {
    const [value, setValue] = useState("")
    return (
        <div className={cn("relative flex-1 flex items-center", className)}>
        <Search className="absolute left-2 h-4 w-4 text-muted-foreground" />
        <Input
            placeholder={placeholder || "过滤文件名"}
            value={value}
            onChange={(event) => {
                setValue(event.target.value)
                table.getColumn(field || "name")?.setFilterValue(event.target.value)
            }}
            className="max-w-[14em] pl-8"
        />
        </div>
    )
} 