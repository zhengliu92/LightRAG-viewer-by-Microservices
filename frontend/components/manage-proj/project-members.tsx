import React, { useState } from 'react'
import { User } from '@/interfaces/user'
import HandleProjectUser from './handle_project_user'
import { Pagination } from '../ui/pagination'
import { useQueryClient } from '@tanstack/react-query'
import { Input } from '../ui/input'
import {  Search } from 'lucide-react'
import ProjectAddUser from './project_add_user'
import { useOwner } from '@/contexts/owner-context'

interface Props {
    users: User[]
    project_id: string
    currentPage: number
    setCurrentPage: (page: number) => void
    itemsPerPage: number
}

const ProjectMembers = ({ users, project_id, currentPage, setCurrentPage, itemsPerPage }: Props) => {
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = useState('')

    // Filter users based on search query
    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const totalPages = filteredUsers ? Math.ceil(filteredUsers.length / itemsPerPage) : 0
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedUsers = filteredUsers?.slice(startIndex, startIndex + itemsPerPage)

    return (
        <div className="rounded-lg border bg-card p-6">
            <div className="mb-4">
                <div className="text-lg font-semibold mb-2">
                    <div className='flex items-center gap-2 justify-between'>
                        <div className='text-lg font-semibold'>项目成员</div>
                        <ProjectAddUser existedUsers={users} project_id={project_id} />
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索用户名..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setCurrentPage(1) 
                        }}
                        className="pl-8"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedUsers?.map((user: User) => (   
                    <HandleProjectUser 
                        key={user.id} 
                        user={user} 
                        project_id={project_id} 
                        onSuccess={() => {
                            setTimeout(() => {
                                queryClient.invalidateQueries({ queryKey: ["userProjs"] });
                                queryClient.invalidateQueries({ queryKey: ["projects"] });
                                queryClient.invalidateQueries({ queryKey: ["project", project_id] });
                            }, 300);
                        }} 
                    />
                ))}
            </div>
            {paginatedUsers.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                    没有找到匹配的用户
                </div>
            )}
            {filteredUsers.length > itemsPerPage && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    )
}

export default ProjectMembers 