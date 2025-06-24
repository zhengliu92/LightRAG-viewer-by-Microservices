import { Button } from "./ui/button"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"
import React from "react"

type BreadcrumbCompProps = {
    folder: string
    setCurrentFolder: (folder: string) => void
}
export const BreadcrumbComp = ({ folder, setCurrentFolder }: BreadcrumbCompProps) => {
    const folder_split = folder.split("/")
    let folders
    if (folder_split.length ===1 && folder_split[0]==="") {
        folders = ["root"]
    } else {
        folders = ["root"].concat(folder.split("/")) 
    }
    
    return (
        <Breadcrumb>
            <BreadcrumbList>
                {folders.map((ifolder, index) => {
                    const ifolderLink = ifolder==="root"?"": ifolder
                    return (
                        <React.Fragment key={index}>
                            <BreadcrumbItem>
                                <Button variant="ghost" size="icon" 
                                className={cn("w-fit px-1 text-primary hover:bg-transparent hover:text-sky-700",index === folders.length - 1&&"text-black")} 
                                disabled={index === folders.length - 1 }
                                onClick={()=>{
                                    setCurrentFolder(ifolderLink)
                                }}>
                                {ifolder}
                            </Button>
                        </BreadcrumbItem>
                        {index < folders.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                )
            })}
            </BreadcrumbList>
        </Breadcrumb>
    )
}
