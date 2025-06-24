import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import React, { useEffect } from "react";
import { Skeleton } from "../ui/skeleton";
import AvataList from "./avata-list";
import { getAvatar } from "@/utils/avatas";
import { UserInfo } from "./user-info/index";

export function NavAvata() {
  const [isMounted, setIsMounted] = React.useState(false);
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const { user } = useAuth();
  if (!isMounted) return <Skeleton className='h-[42px] w-[42px] rounded-lg' />;
  if (!user) {
    return <Skeleton className='h-[42px] w-[42px] rounded-lg' />;
  }
  return (
    <div className='flex-center gap-x-1'>
        <DropdownMenu>
          <div className='flex  gap-x-1 items-center'>
            <DropdownMenuTrigger asChild>
              <Avatar className='h-[42px] w-[42px] rounded-lg cursor-pointer'>
                <AvatarImage
                  src={getAvatar(user.avatar)}
                  alt={user.username}
                />
                <AvatarFallback className='rounded-lg'>CN</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
          </div>
          <AvataList />
        </DropdownMenu>
        <UserInfo />
    </div>

  );
}
