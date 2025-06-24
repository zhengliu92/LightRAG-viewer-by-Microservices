import { User } from '@/interfaces/user'
import React from 'react'
import { Button } from '../ui/button'
import { Crown, Trash2Icon } from 'lucide-react'
import { removeUserFromProj} from '@/contexts/proj-context'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { getAvatar } from '@/utils/avatas'
import { useAuth } from '@/hooks/use-auth'
import ToolTipText from '../tooltip_text'
import { useOwner } from '@/contexts/owner-context'

type HandleProjectUserProps = {
    user: User
    project_id: string
    onSuccess: () => void
}
const handleDeleteUser = async (user_id: string, project_id: string, onSuccess: () => void) => {
    try {
        const resp = await removeUserFromProj({user_id, project_id})
        if (resp.code === 200) {
            toast.success('操作成功')
            onSuccess()
        } else {
            toast.error(resp.message || '操作失败')
        }
    } catch (error) {
        toast.error('操作失败')
    }
}

const HandleProjectUser = ({ user, project_id, onSuccess }: HandleProjectUserProps) => {
    const {ownerId} = useOwner()
    const {user: currentUser} = useAuth()
    const is_owner = ownerId === user.id
    const is_current_user = currentUser?.id === user.id
  return (
    <div 
      key={user.id} 
      className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer"
    >
      <Avatar className='h-10 w-10 rounded-lg shrink-0'>
        <AvatarImage
          src={getAvatar(user.avatar)}
          alt={user.username}
        />
        <AvatarFallback className='rounded-lg'>
          {user.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">{user.username}</span>
        </div>
        <ToolTipText text={user.email} />
      </div>

      {!is_owner && <Button 
        variant="ghost" 
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteUser(user.id, project_id, onSuccess);
        }}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
      >
        <Trash2Icon className="w-4 h-4" />
      </Button>}

      {is_owner && <Button
        variant="ghost" 
        size="icon"
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
        onClick={(e) => {
            e.stopPropagation();
            toast.info(user.username + ' 是项目管理员')
        }}
      >
        <Crown className="h-4 w-4 " />
      </Button>
    }

    </div>
  )
}

export default HandleProjectUser