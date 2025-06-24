"use client"

import ComponentManageProj from "@/components/manage-proj/component-manage-proj"
import UserManageComponent from "@/components/manage-user/user-manage-component"
import { OwnerProvider } from "@/contexts/owner-context"
import { usePathname } from "next/navigation"

export default function ManagePage() {
    const pathname = usePathname()
    const path_splits = pathname.split('/')
    const proj_id= path_splits[path_splits.length - 1]
    if (proj_id==="manage") {
    return (
            <div className="p-4 flex flex-col gap-4">
                <UserManageComponent />
            </div>
            )
        }
    return  (
        <div className="p-4 flex flex-col gap-4">
            <OwnerProvider>
                <ComponentManageProj project_id={proj_id} />
            </OwnerProvider>
        </div>
    )

}