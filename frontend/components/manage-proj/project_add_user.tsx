import { PlusIcon, SearchIcon } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { addUserToProj, useProject } from '@/contexts/proj-context'
import { User } from '@/interfaces/user'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Input } from '../ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { ScrollArea } from '../ui/scroll-area'
import { getAvatar } from '@/utils/avatas'
import { useAuth } from '@/hooks/use-auth'

type ProjectAddUserProps = {
    existedUsers: User[]
    project_id: string
}

const ProjectAddUser = ({existedUsers, project_id}: ProjectAddUserProps) => {
    const {userWithProjects, isOwner} = useProject()
    const {user:useMe} = useAuth()
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [addedUserIds, setAddedUserIds] = useState<string[]>([])

    const existedUsernames = existedUsers.map(user => user.username)
    const allUsers = userWithProjects.filter(user => !existedUsernames.includes(user.username))
    const filteredUsers = allUsers.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    // 添加一个 isAdded 状态，表示用户是否已添加, 然后按照首字母排序
    const filteredUsersWithState = filteredUsers.map(user => ({
        ...user,
        isAdded: addedUserIds.includes(user.id)
    })).sort((a, b) => a.username.localeCompare(b.username))

    const handleAddUser = async (user_id: string, project_id: string) => {
        try {
            setIsLoading(true)
            const resp = await addUserToProj({user_id, project_id})
            if (resp.code === 200) {
                setAddedUserIds(prev => [...prev, user_id])
                toast.success('添加用户成功')
            } else {
                toast.error(resp.message || '添加用户失败')
            }
        } catch (error) {
            toast.error('添加用户失败')
        } finally {
            setIsLoading(false)
        }
    }

    const onOpenChange = (open: boolean) => {
        if (!open) {
            setSearchQuery('')
            setAddedUserIds([])
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["project", project_id] })
            if (useMe?.id && addedUserIds.includes(useMe?.id)) {
                queryClient.invalidateQueries({ queryKey: ["userProjs"] })
            }
            }, 150)
        }
        setIsOpen(open)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" disabled={!isOwner}>
                    <PlusIcon className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>  
                    <DialogTitle>添加项目成员</DialogTitle>
                    <DialogDescription>
                        从下列用户中选择要添加到项目的成员
                    </DialogDescription>
                </DialogHeader>
                
                <div className="relative">
                    <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索用户..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-2">
                        {filteredUsersWithState.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-4">
                                没有找到匹配的用户
                            </p>
                        ) : (
                            filteredUsersWithState.map(user => (
                                <div 
                                    key={user.id}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={getAvatar(user.avatar)} />
                                            <AvatarFallback>
                                                {user.username.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{user.username}</p>
                                            {user.email && (
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            )}
                                        </div>
                                    </div>
                                    <Button 
                                        size="sm"
                                        disabled={isLoading || user.isAdded}
                                        onClick={() => handleAddUser(user.id, project_id)}
                                    >
                                        {user.isAdded ? '已添加' : '添加'}
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

export default ProjectAddUser