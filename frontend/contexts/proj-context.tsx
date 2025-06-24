"use client"

import { BaseResponse } from "@/interfaces/base";
import { AddUserToProjectRequest, AddUserToProjectResponse, CreateProjectRequest, CreateProjectResponse, GetProjectWithUsersKBsRequest, GetProjectWithUsersKBsResponse, ListProjectsRequest, ListProjectsResponse, ListUsersWithProjectsRequest, ListUsersWithProjectsResponse, Project, RemoveUserFromProjectRequest, RemoveUserFromProjectResponse, UserWithProjects } from "@/interfaces/proj";
import { makeRequest } from "@/services/services";
import { api } from "@/utils/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { UseMutateAsyncFunction } from "@tanstack/react-query"
import { usePathname } from "next/navigation";

const createProj = async (req: CreateProjectRequest) => {
  return await makeRequest<typeof req, CreateProjectResponse>(
    api.proj.create_proj,
    req
  );
};

export const addUserToProj = async (req: AddUserToProjectRequest) => {
  return await makeRequest<typeof req, AddUserToProjectResponse>(
    api.proj.add_user_to_proj,
    req
  );
};
  
export const removeUserFromProj = async (req: RemoveUserFromProjectRequest) => {
  return await makeRequest<typeof req, RemoveUserFromProjectResponse>(
    api.proj.remove_user_from_proj,
    req
  );
};

export const getProjectWithUsersKBs = async (req: GetProjectWithUsersKBsRequest) => {
  const { url, method } = api.proj.get_project_with_users_kbs;
  const new_api={
    url: url.replace("{project_id}", req.project_id),
    method,
  }
  return await makeRequest<any, GetProjectWithUsersKBsResponse>(
    new_api,
    {}
  );
};


const listProjects = async (req: ListProjectsRequest) => {
  return await makeRequest<any, ListProjectsResponse>(
    api.proj.list_projects,
    {}
  );
};


const listUsersWithProjects = async (req: ListUsersWithProjectsRequest) => {
  return await makeRequest<any, ListUsersWithProjectsResponse>(
    api.proj.list_users_with_projects,
    {}
  );
};


interface ProjectContextType {
    isMember: boolean
    isOwner: boolean
    userWithProjects: UserWithProjects[]
    projects: Project[]
    createProjAsync: UseMutateAsyncFunction<BaseResponse<CreateProjectResponse>, Error, CreateProjectRequest, unknown>
  }

  const ProjectContext = createContext<ProjectContextType | undefined>(undefined)
  

export function ProjectContextProvider({ children }: { children: React.ReactNode }) {

   const queryClient = useQueryClient()
   const pathname = usePathname()
   const proj_id = pathname.split("/")[2]
   const [isMember, setIsMember] = useState(false)
   const [isOwner, setIsOwner] = useState(false)

   const { data:usersWithProjects, isLoading, error } = useQuery({
    queryKey: ["usersWithProjects"],
    queryFn: () => listUsersWithProjects({}),
  });

  const { data:projectsData, isLoading:projectsLoading, error:projectsError } = useQuery({
    queryKey: ["projects"],
    queryFn: () => listProjects({}),
  });


  useEffect(() => {
    if (proj_id && projectsData?.data?.projects) {
      const found_proj = projectsData.data.projects.find((proj: Project) => proj.id === proj_id)
      setIsMember(Boolean(found_proj?.is_member))
      setIsOwner(Boolean(found_proj?.is_owner))
    } else {
      setIsMember(false)
      setIsOwner(false)
    }
  }, [proj_id, projectsData])


  const { mutateAsync: createProjAsync } = useMutation({
    mutationFn: (req: CreateProjectRequest) => createProj(req),
    onSuccess: (data) => {
      if (data?.code === 200) {
        toast.success("项目创建成功");
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["usersWithProjects"] });
          queryClient.invalidateQueries({ queryKey: ["projects"] });
        }, 300);
      }
    },
  });




  return (
    <ProjectContext.Provider value={{
      isMember,
      isOwner,
      userWithProjects: usersWithProjects?.data?.usersWithProjects || [],
      projects: projectsData?.data?.projects || [],
      createProjAsync,
    }}>
      {children}
    </ProjectContext.Provider>
  )

}

export function useProject() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error("useProject must be used within a ProjectContextProvider")
  }
  return context
}