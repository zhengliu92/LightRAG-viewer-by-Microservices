import React from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import { ChevronDown } from 'lucide-react'
import { addUserToProj, removeUserFromProj, useProject } from '@/contexts/proj-context'
import { User } from '@/interfaces/user'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

type HandleBatchUsersProps = {
    selectedRows: User[]
}

const HandleBatchUsers = ({ selectedRows }: HandleBatchUsersProps) => {
    const { projects } = useProject() 
    const queryClient = useQueryClient()
    const handleAddToKB = async (proj_id: string) => {
        try {
            const promises = selectedRows.map(user => 
                addUserToProj({
                    user_id: user.id,
                    project_id: proj_id
                })
            )
            const resp = await Promise.all(promises)
            if (resp.every(res => res.code === 200)) {
                toast.success("成功添加到项目")
                setTimeout(() => {
                    queryClient.invalidateQueries({ queryKey: ["usersWithProjects"] });
                    queryClient.invalidateQueries({ 
                        queryKey: ["project", proj_id],
                        exact: true
                    });
                }, 300);
            } else {
                toast.error(resp.find(res => res.code !== 200)?.message || "添加到项目失败")
            }

        } catch (error) {
            toast.error("添加到项目失败")
        }
    }

    
    const handleRemoveFromKB = async (proj_id: string) => {
        try {
            const promises = selectedRows.map(user => 
                removeUserFromProj({
                    user_id: user.id,
                    project_id: proj_id
                })
            )
            const resp = await Promise.all(promises)
            if (resp.every(res => res.code === 200)) {
                toast.success("成功从项目中移除")
                setTimeout(() => {
                    queryClient.invalidateQueries({ queryKey: ["usersWithProjects"] });
                queryClient.invalidateQueries({ 
                    queryKey: ["project", proj_id],
                    exact: true
                    });
                }, 300);
            } else {
                toast.error(resp.find(res => res.code !== 200)?.message || "从项目中移除失败")
            }
        } catch (error) {
            toast.error("从项目中移除失败")
        }
    }
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    批量操作
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">


                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2 cursor-pointer">
                        <span>添加到项目</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent >
                        {projects?.length && projects?.length > 0 ? projects?.map((proj) => (
                            <DropdownMenuItem
                                key={proj.id}
                                onClick={() => handleAddToKB(proj.id)}
                                className="cursor-pointer"
                            >
                                {proj.name}
                            </DropdownMenuItem>
                        )): <DropdownMenuItem className="text-xs text-muted-foreground">请先创建项目</DropdownMenuItem>}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2 cursor-pointer">
                        <span>从项目移除</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {projects?.length && projects?.length > 0 ? projects?.map((proj) => (
                            <DropdownMenuItem
                                key={proj.id}
                                onClick={() => handleRemoveFromKB(proj.id)}
                                className="cursor-pointer"
                            >
                                {proj.name}
                            </DropdownMenuItem>
                        )): <DropdownMenuItem className="text-xs text-muted-foreground">请先创建项目</DropdownMenuItem>}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default HandleBatchUsers