"use client"
import { getProjectWithUsersKBs } from '@/contexts/proj-context'
import { useQuery } from '@tanstack/react-query'
import React, { useEffect, useState } from 'react'
import { GetProjectWithUsersKBsResponse } from '@/interfaces/proj'
import { BaseResponse } from '@/interfaces/base'
import ProjectAdmin from './project-admin'
import ProjectMembers from './project-members'
import ProjectKnowledgeBase from './project-knowledge-base'
import { useOwner } from '@/contexts/owner-context'

interface Props {
    project_id: string
}

const ComponentManageProj = ({ project_id }: Props) => {
    const {setOwnerId} = useOwner()
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 6 // Show 6 users per page (2 rows of 3 in desktop view)
    
    const { data, isLoading } = useQuery<BaseResponse<GetProjectWithUsersKBsResponse>, Error>({
        queryKey: ['project', project_id],
        queryFn: () => getProjectWithUsersKBs({ project_id }),
        staleTime: 1 * 60 * 1000,
        gcTime: 5 * 60 * 1000
    })

    const project = data?.data?.project

    const kbs = project?.kbs?.map(kb => ({
        ...kb,
        project_name: project?.name,
        project_id: project_id,
        is_project_kb: true
    }))
    
    const users = project?.users
    const owner_id = project?.owner_id

    useEffect(() => {
        setOwnerId(owner_id || null)
    }, [owner_id])

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-12 w-full bg-gray-200 animate-pulse rounded" />
                <div className="h-32 w-full bg-gray-200 animate-pulse rounded" />
                <div className="h-32 w-full bg-gray-200 animate-pulse rounded" />
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <ProjectAdmin />

            <ProjectKnowledgeBase 
                project_id={project_id}
                kbs={kbs || []}
            />

            <ProjectMembers 
                users={users || []}
                project_id={project_id}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                itemsPerPage={itemsPerPage}
            />


        </div>
    )
}

export default ComponentManageProj