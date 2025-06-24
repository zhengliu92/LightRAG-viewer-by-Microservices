import { PencilIcon } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

type ClickSelectProp = {
    value: string
    className?: string
    contentClassName?: string
    onChange: (value: string) => Promise<void>
    listMap: {
        value: string
        label: string
    }[]
}

const ClickSelect = ({ value, className, contentClassName, onChange, listMap }: ClickSelectProp) => {
    const [isEditing, setIsEditing] = useState(false)
    const [selectedValue, setSelectedValue] = useState(value)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Check if the click target is a select element or its children
            const target = event.target as HTMLElement;
            const isSelectElement = target.closest('[role="combobox"]') || target.closest('[role="listbox"]');
            
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node) && !isSelectElement && isEditing) {
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
        setSelectedValue(value)
    }



    return (
        <div ref={wrapperRef} className={cn('relative flex items-center gap-2', className)}>
            {isEditing ? (
                <div className={cn('absolute flex items-center gap-2 bg-background')}>
                    <Select
                        value={selectedValue}
                        onValueChange={async (value) => {
                            console.log(value);
                            setIsEditing(false)
                            setSelectedValue(value)
                            await onChange(value)
                        }}
                    >
                        <SelectTrigger className={cn("h-8 w-[120px]", contentClassName)}>
                            {value}
                        </SelectTrigger>
                        <SelectContent className={cn("w-[120px] text-nowrap min-w-[75px]", contentClassName)}>
                            {listMap.map((item) => (
                                <SelectItem value={item.value} key={item.value} className="cursor-pointer">
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ) : (
                <button 
                    onClick={() => setIsEditing(true)}
                    className="group flex items-center gap-1.5"
                >
                    <span className='text-sm hover:underline hover:text-primary transition-colors text-nowrap'>
                        {value}
                    </span>
                    <PencilIcon className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                </button>
            )}
        </div>
    )
}

export default ClickSelect