'use client'

import { cn } from "@/lib/utils"
import { useManageSidebar } from "./manage-sidebar-provider"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import { Input } from "../ui/input"
import { useState, useEffect, useRef } from "react"
import { Ban, Crown, Ellipsis, Flag } from "lucide-react"
import { CreateProjDialog } from "./create-proj-dialog"
import { useProject } from "@/contexts/proj-context"
import { usePathname, useRouter } from "next/navigation"
import ToolTipText from "../tooltip_text"
import ProjectRD from "../manage-proj/proj-RD"
import { toast } from "sonner"
import { Dialog } from "@radix-ui/react-dialog"
import { DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"




const ProjectIntro = () => {

  return (
    <Dialog >
      <DialogTrigger asChild>
      <button className="btn-ghost text-nowrap text-sm" onClick={() => {
          }}>说明</button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[200px]">
        <DialogHeader>
          <DialogTitle/>
          <DialogDescription/>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
            <Crown/>
            <span>您是项目管理员</span>
            </div>
            <div className="flex items-center gap-2">
            <Flag/>
            <span>您是项目成员</span>
            </div>
            <div className="flex items-center gap-2">
            <Ban/>
            <span>您不是项目成员</span>
            </div>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>

  )
}


export function ManageSidebar() {
  const { isOpen, isSidebarOpen } = useManageSidebar()
  const [searchTerm, setSearchTerm] = useState("")
  const [isLastProjInView, setIsLastProjInView] = useState(false)
  const { projects } = useProject() 
  const pathname = usePathname()
  const path_splits = pathname.split('/')
  const proj_id = path_splits[path_splits.length - 1]
  const router = useRouter()


  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const totalProjects = projects.length

  // Create ref for the last project element
  const lastProjectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsLastProjInView(entry.isIntersecting)
      },
      { threshold: 0.5 }
    )

    const lastElement = lastProjectRef.current
    if (lastElement) {
      observer.observe(lastElement)
    }

    return () => {
      if (lastElement) {
        observer.unobserve(lastElement)
      }
    }
  }, [filteredProjects]) // Re-run when filtered projects change

  return (
    <aside 
      className={cn(
        "top-0 h-full border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "transition-all duration-300 ease-in-out relative",
        isOpen ? "w-[12rem]" : "w-0"
      )}
    >
      <div className={cn(
        "h-full flex flex-col gap-2 p-4",
        "transition-all duration-300 ease-in-out",
        isSidebarOpen ? "block" : "hidden"
      )}>
        <Button variant="outline" className={cn(
          "w-full justify-center text-sm font-medium",
          "hover:bg-muted/50",
        )}
        onClick={() => {
          router.push(`/manage`)
        }}>
          用户管理
        </Button>
        <div className="flex items-center justify-between my-2">
          <h2 className={cn(
            "font-semibold text-sm text-muted-foreground px-2 w-full",
          )}>项目管理 ({totalProjects})
          </h2>
          <ProjectIntro />
        </div>

        
        <Input 
          placeholder="搜索项目" 
          className="w-full my-1 h-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <ScrollArea className={cn(
          "h-[calc(100vh-16rem)]",
        )}>
          <div className="flex flex-col gap-1  ">
            {filteredProjects.map((project, index) => (
              <div className="flex items-center gap-2"  key={project.id}>
                <div 
                  ref={index === filteredProjects.length - 1 ? lastProjectRef : null}
                  onClick={() => {
                    router.push(`/manage/${project.id}`)
                  }}
                  className={cn(
                    "px-2 py-1.5 text-sm rounded-md",
                    "hover:bg-primary/50 cursor-pointer",
                    "transition-colors w-full",
                    proj_id === project.id ? "bg-primary/50" : ""
                  )}
                >
                  <ToolTipText  text={project.name} className="max-w-[8em]" />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-between">
                      {project.is_owner ? (
                        <ProjectRD project={project} />
                      ) : (
                        <span>{project.is_member ?
                          <Flag className="w-3 h-3" /> :
                          <Ban className="w-3 h-3" />}
                        </span>
                      )}
                </div>

              </div>

            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-center items-center">
            {totalProjects > 0 && !isLastProjInView && <Ellipsis className="w-4 h-4" />}
        </div>
        <CreateProjDialog className={cn(
          "absolute bottom-0 left-0 w-full justify-center text-sm font-medium"
        )}/>
      </div> 
    </aside>
  )
}
