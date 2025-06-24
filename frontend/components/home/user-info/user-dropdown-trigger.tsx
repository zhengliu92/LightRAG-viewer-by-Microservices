"use client"

import { forwardRef } from "react"

interface UserDropdownTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  username: string
  email: string
}

export const UserDropdownTrigger = forwardRef<HTMLDivElement, UserDropdownTriggerProps>(
  ({ username, email, className, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className='grid flex-1 text-left text-sm leading-tight cursor-pointer'
        {...props}
      >
        <span className='truncate font-semibold'>{username}</span>
        <span className='truncate text-xs'>{email}</span>
      </div>
    )
  }
) 