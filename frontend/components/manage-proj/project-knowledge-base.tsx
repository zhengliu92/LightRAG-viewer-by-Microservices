import React from 'react'
import { CreateKnowledgeBase } from '../main/create-knowledge-base'
import KBCardList from '../main/kb-card'
import { IKb } from '@/interfaces/kb'
import { useQueryClient } from '@tanstack/react-query'
import { useProject } from '@/contexts/proj-context'

interface ProjectKnowledgeBaseProps {
    project_id: string
    kbs: IKb[]
}

const ProjectKnowledgeBase = ({ project_id, kbs }: ProjectKnowledgeBaseProps) => {
    const queryClient = useQueryClient()
    const { isMember } = useProject()

    return (
        <div className="rounded-lg border bg-card p-6">
            <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-semibold">项目知识库</div>
            <CreateKnowledgeBase 
                isProjKb={true} 
                project_id={project_id} 
                disabled={!isMember}
                onSuccess={() => {
                    setTimeout(() => {
                        queryClient.invalidateQueries({ queryKey: ["project", project_id] });
                        queryClient.invalidateQueries({ queryKey: ["userProjs"] });
                    }, 300);
                }} 
                />
            </div>
            <KBCardList 
                kbs={kbs || []} 
                onSuccess={() => {
                    setTimeout(() => {
                        queryClient.invalidateQueries({ queryKey: ["project", project_id] });
                    }, 300);
                }} 
                itemsPerPage={3}
            />
            </div>
    )
}

export default ProjectKnowledgeBase 