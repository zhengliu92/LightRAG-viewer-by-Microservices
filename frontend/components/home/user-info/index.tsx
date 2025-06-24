"use client"

import { useEffect, useState } from "react"
import { LogOut, Settings } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { useLogout } from "@/hooks/login-hooks"
import { useLocale } from "@/hooks/use-locale"
import { SelectAPIProvider } from "./select_api_provider"
import { UserDropdownTrigger } from "./user-dropdown-trigger"

export function UserInfo() {
  // State
  const [isMounted, setIsMounted] = useState(false)
  const [isApiProviderDialogOpen, setIsApiProviderDialogOpen] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Hooks
  const { user, session_id, clearUp } = useAuth()
  const { logout } = useLogout()
  const { locale: l } = useLocale()

  // Effects
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // Handlers
  const handleLogout = async () => {
    try {
      if (session_id) {
        await logout({ session_id })
      }
      clearUp()
    } catch (error) {
      // Handle error case - you might want to show an error message
      console.error('Logout failed:', error)
      // Still clear up local state even if server logout fails
      clearUp()
    }
  }

  // Guards
  if (!isMounted || !user) return null

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal>
        <DropdownMenuTrigger>
          <UserDropdownTrigger username={user.username} email={user.email} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
       
          <DropdownMenuItem
            onSelect={() => {
              setIsApiProviderDialogOpen(true)
              setIsOpen(false)
            }}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            API Provider
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            {l.login.signout}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SelectAPIProvider
        isOpen={isApiProviderDialogOpen}
        onOpenChange={setIsApiProviderDialogOpen}
      />
    </>
  )
} 