import React, { useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Crown, Pencil, Trash } from 'lucide-react'
import RenameDialog from '../rename-dialog'
import { DeleteProjectResponse,DeleteProjectRequest, Project, RenameProjectRequest, RenameProjectResponse } from '@/interfaces/proj'
import { api } from '@/utils/api'
import { makeRequest } from '@/services/services'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

type Props = {
    project: Project
}



const deleteProj = async (req: DeleteProjectRequest) => {
    return await makeRequest<typeof req, DeleteProjectResponse>(
      api.proj.delete_proj,
      req
    );
  };



  const renameProj = async (req: RenameProjectRequest) => {
    return await makeRequest<typeof req, RenameProjectResponse>(
      api.proj.rename_proj,
      req
    )
  }




const ProjectRD = ({ project }: Props) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
    const queryClient = useQueryClient()
    const invalidateQueries= ()=>{
        queryClient.invalidateQueries({ queryKey: ['projects'] })
        queryClient.invalidateQueries({ queryKey: ['userProjs'] })
    }
    
    const handleDelete = async (event: Event) => {
        event.preventDefault()
          const reqp = await deleteProj({ project_id: project.id });
          if(reqp.code === 200) {
              toast.success("项目删除成功")
              invalidateQueries()
          }else {
              toast.error(reqp.message || "项目删除失败")
          }
          setIsOpen(false)
      };
    
      const handleRename = async (name: string) => {
          const resp = await renameProj({ project_id: project.id, new_name: name });
          if(resp.code === 200) {
            toast.success("项目重命名成功")
            setIsRenameDialogOpen(false);
            setIsOpen(false)
            invalidateQueries()
          }else{
            toast.error(resp.message || "重命名失败")
          }
          
      };


    return (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal>
            <DropdownMenuTrigger asChild>
                <Crown className="w-3 h-3 hover:text-primary cursor-pointer" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onEscapeKeyDown={() => setIsOpen(false)}
              onInteractOutside={() => setIsOpen(false)}
            >
              <DropdownMenuItem
                onSelect={() => {
                  setIsRenameDialogOpen(true)
                  setIsOpen(false)
                }}
                className="cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                <span>重命名</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
              onSelect={handleDelete}
              className="cursor-pointer">
                <Trash className="mr-2 h-4 w-4" />
                <span>删除</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
    
          <RenameDialog
            isOpen={isRenameDialogOpen}
            onOpenChange={setIsRenameDialogOpen}
            onRename={handleRename}
            title={`重命名项目 ${project.name}`}
          />
        </div>
      )
}

export default ProjectRD