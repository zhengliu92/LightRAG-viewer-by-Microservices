import React from 'react'
import { Project } from '@/interfaces/proj'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Button } from '../ui/button'

type NumProjModalProps = {
    projects: Project[]
}

const NumProjModal = ({ projects }: NumProjModalProps) => {
  return (
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="p-0 w-5 h-5">
               {projects.length}
            </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[400px]">
            <DialogHeader>
                <DialogTitle className="text-xl font-semibold">项目列表</DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                    共 {projects.length} 个项目
                </DialogDescription>
            </DialogHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto">
                {projects.map((project) => (
                    <div 
                        key={project.id}
                        className="p-3 rounded-lg hover:bg-gray-100 transition-colors mb-2 border border-gray-200 cursor-pointer"
                    >
                        <div className="font-medium">{project.name}</div>
                    </div>
                ))}
            </div>       
        </DialogContent>
    </Dialog>
  )
}

export default NumProjModal