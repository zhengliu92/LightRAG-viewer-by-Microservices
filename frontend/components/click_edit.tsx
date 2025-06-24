import { PencilIcon, Check, X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import React, { useState, KeyboardEvent, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

type ClickEditProp = {
    value: string
    className?: string
    maxInputWidth?: number
    onChange: (value: any) => Promise<void>
}

const ClickEdit = ({ value, className, maxInputWidth, onChange }: ClickEditProp) => {
    const [isEditing, setIsEditing] = useState(false)
    const [inputValue, setInputValue] = useState(value)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node) && isEditing) {
                handleCancel()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isEditing])

    const handleCancel = () => {
        setIsEditing(false)
        setInputValue(value)
    }

    const handleSave = async () => {
        setIsEditing(false)
        await onChange(inputValue)
    }

    const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            await handleSave()
        } else if (e.key === 'Escape') {
            e.preventDefault()
            handleCancel()
        }
    }

    return (
        <div ref={wrapperRef} className={cn('relative flex items-center gap-2', className)}>
            {isEditing ? (
                <div className={cn('absolute flex items-center gap-2 bg-background')}>
                    <Input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={cn("h-5 pr-[45px]", maxInputWidth ? `w-[${maxInputWidth}px]` : "w-[180px]")}
                        autoFocus
                    />
                    <div className="absolute flex items-center gap-1 right-1">
                        <Button
                            onClick={handleSave}
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0"
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button
                            onClick={handleCancel}
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setIsEditing(true)}
                    className="group flex items-center gap-1.5"
                >
                    <span className='text-sm hover:underline hover:text-primary transition-colors'>
                        {value}
                    </span>
                    <PencilIcon className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                </button>
            )}
        </div>
    )
}

export default ClickEdit