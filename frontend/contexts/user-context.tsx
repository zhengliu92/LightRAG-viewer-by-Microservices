"use client"

import { GetUserByIdRequest, GetUserByIdResponse, GetUserMeResponse, User } from "@/interfaces/user";
import { GetUserMeRequest } from "@/interfaces/user";
import { makeRequest } from "@/services/services";
import { api } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

const getUserById = async (req: GetUserByIdRequest) => {
  const apiConfig = {
    url: api.user.getUserByID.url.replace("{id}", req.id),
    method:  api.user.getUserByID.method,
  }
  return await makeRequest<any, GetUserByIdResponse>(
    apiConfig,
    {}
  );
};

export const getUserMe =async () => {
    return await makeRequest<GetUserMeRequest, GetUserMeResponse>(
      api.user.get_me,
      {}
    );
  };

export const useUserMe = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["userMe"],
    queryFn: () => getUserMe(),
    refetchInterval: 1000 * 60, 
    refetchOnWindowFocus: true,
  });

  return { data: data?.data?.user, isLoading, error };
};

export interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  getUserInfo: (user_id: string) => Promise<GetUserByIdResponse | null> ;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  getUserInfo: () => Promise.resolve(null),
}); 

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { data } = useUserMe();
  const [user, setUser] = useState<User | null>(null);
  const [usersInfo, setUsersInfo] = useState<Record<string, GetUserByIdResponse>>({})

  const getUserInfo = async (user_id: string) => {
    try {
      // Return cached data if available
      if(usersInfo[user_id]) return usersInfo[user_id]

      const res = await getUserById({id: user_id})
      if(res.data) {
        setUsersInfo(prev => ({...prev, [user_id]: res.data!}))
        return res.data
      }
      toast.error(res.message || '获取用户信息失败')
      return null
    } catch (error) {
      toast.error('获取用户信息失败')
      return null
    }
  }

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data]);

  return <UserContext.Provider value={{ user, setUser, getUserInfo }}>{children}</UserContext.Provider>;
};

export function useUserContext() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider")
  }
  return context
} 
