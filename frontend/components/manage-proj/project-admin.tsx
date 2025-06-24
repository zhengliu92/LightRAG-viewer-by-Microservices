import React from 'react'
import ShowUserInfo from '../show_user_info'
import { useOwner } from '@/contexts/owner-context'


const ProjectAdmin = () => {
    const {ownerId} = useOwner()
    return (
        <div className="rounded-lg border bg-card px-6 py-4 flex justify-between items-center">
            <div className="text-lg font-semibold">项目管理员</div>
            <ShowUserInfo user_id={ownerId || ''} title="项目管理员" />
        </div>
    )
}

export default ProjectAdmin 