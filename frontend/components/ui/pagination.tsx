import { Button } from "@/components/ui/button"
import React from "react"

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    className?: string
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    className = ""
}) => {
    if (totalPages <= 1) return null

    return (
        <div className={`flex justify-center items-center gap-2 mt-4 ${className}`}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
            >
                上一页
            </Button>
            <span className="text-sm">
                {currentPage} / {totalPages}
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
            >
                下一页
            </Button>
        </div>
    )
} 