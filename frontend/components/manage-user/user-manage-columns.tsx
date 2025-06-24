import { ColumnDef } from "@tanstack/react-table"
import { UserWithProjects } from "@/interfaces/proj"
import { Checkbox } from "@/components/ui/checkbox"
import ClickEdit from "../click_edit"
import {  useUpdateUser } from "@/hooks/user-hooks"
import { useQueryClient } from "@tanstack/react-query"
import ClickSelect from "../click_select"
import { useState } from "react"
import ChangePasswordModal from "./change-password-modal"
import { useAuth } from "@/hooks/use-auth"
import NumProjModal from "./num-proj-modal"

export const useUserManageColumns = () => {
    const { mutateAsync: updateUser } = useUpdateUser()
    const [openChangePassword, setOpenChangePassword] = useState(false)
    const queryClient = useQueryClient()
    const { user , clearUp } = useAuth()

    const columns: ColumnDef<UserWithProjects>[] = [
        // {
        //     id: "select",
        //     header: ({ table }) => (
        //         <div className="flex h-4 items-center justify-center">
        //             <Checkbox
        //                 checked={
        //                     table.getIsAllPageRowsSelected() ||
        //                     (table.getIsSomePageRowsSelected() && "indeterminate")
        //                 }
        //                 onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        //                 aria-label="Select all"
        //                 className="h-4 w-4"
        //             />
        //         </div>
        //     ),
        //     cell: ({ row }) => (
        //         <div className="flex h-4 items-center justify-center">
        //             <Checkbox
        //                 checked={row.getIsSelected()}
        //                 onCheckedChange={(value) => row.toggleSelected(!!value)}
        //                 aria-label="Select row"
        //                 className="h-4 w-4"
        //             />
        //         </div>
        //     ),
        //     enableSorting: false,
        //     enableHiding: false,
        // },
        {
            accessorKey: "username",
            header: () => <div className="text-nowrap">用户名</div>,
            cell: ({ row }) => <div className="font-medium text-nowrap">{row.getValue("username")}</div>,
        },
        {
            accessorKey: "email",
            header: () => <div className="text-nowrap">邮箱</div>,
            cell: ({ row }) => {
                const email = row.getValue("email") as string
                const email_text = email ? email : "未绑定"
                return <ClickEdit className="w-[180px] z-50" value={email_text} maxInputWidth={220} onChange={async (value) => {
                    const res = await updateUser({
                        username: row.original.username,
                        email: value
                    })
                    if (res.code === 200) {
                        setTimeout(() => {
                            queryClient.invalidateQueries({ queryKey: ["usersWithProjects"] })
                        }, 300)
                    }
                }} />
            }
        },

        {
            accessorKey: "phone",
            header: () => <div className="text-nowrap">手机号</div>,
            cell: ({ row }) => {
                const phone = row.getValue("phone") as string
                const phone_text = phone ? phone : "未绑定"
                return <ClickEdit className="w-[80px] z-10" value={phone_text} onChange={async (value) => {
                    const res = await updateUser({
                        username: row.original.username,
                        phone: value
                    })
                    if (res.code === 200) {
                        setTimeout(() => {
                            queryClient.invalidateQueries({ queryKey: ["usersWithProjects"] })
                        }, 300)
                    }
                }} />
            },
        },
        {
            accessorKey: "role_name",
            header: () => <div className="text-nowrap">权限</div>,
            cell: ({ row }) => {
                const role_name = row.getValue("role_name") as string
                const role_name_text = role_name === "admin" ? "管理员" : "用户"
                return <ClickSelect value={role_name_text}
                    listMap={[{ value: "admin", label: "管理员" }, { value: "user", label: "用户" }]}
                    onChange={async (value) => {
                        const res = await updateUser({
                            username: row.original.username,
                            role_name: value
                    })
                    if (res.code === 200) {
                        setTimeout(() => {
                            queryClient.invalidateQueries({ queryKey: ["usersWithProjects"] })
                        }, 300)
                    }
                }} />
            },
        },
        {
            accessorKey: "projects",
            header: () => <div className="text-nowrap">项目数</div>,
            cell: ({ row }) => {
                const projects = row.original.projects
                return <NumProjModal projects={projects || []} />
            },
        },
        {
            accessorKey: "is_active",
            header: () => <div className="text-nowrap">是否激活</div>,
            cell: ({ row }) => {
                const is_active = row.getValue("is_active") as boolean
                return <ClickSelect value={is_active ? "是" : "否"} contentClassName="w-[75px]"
                    listMap={[{ value: "true", label: "是" }, { value: "false", label: "否" }]}
                    onChange={async (value) => {
                        const res = await updateUser({
                            username: row.original.username,
                            is_active: value === "true"
                        })
                        if (res.code === 200) {
                            setTimeout(() => {
                                queryClient.invalidateQueries({ queryKey: ["usersWithProjects"] })
                            }, 300)
                        }
                    }} />
            },
        },
        {
            accessorKey: "last_login",
            header: () => <div className="text-nowrap">最后登录</div>,
            cell: ({ row }) => {
                const last_login = row.getValue("last_login") as string
                return <div className="text-nowrap">{new Date(last_login).toLocaleString()}</div>
            },
        },        {
            accessorKey: "operations",
            header: () => <div className="text-nowrap">操作</div>,
            cell: ({ row }) => {
                const username = row.original.username
                return <div className="text-nowrap">
    
                   <ChangePasswordModal username={username} onSubmit={async (password) => {
                    const res = await updateUser({
                        username: row.original.username,
                        password: password
                    })
                    if (res.code === 200) {
                        if (username === user?.username) {
                            clearUp()
                        }
                    }
                   }} />
                </div>
            },
        },

    ]

    return columns
}