import { avataList } from "@/utils/avatas";
import Image from "next/image";
import React from "react";
import { DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useUpdateUser } from "@/hooks/user-hooks";

const AvataList = () => {
  const { user, setUser } = useAuth();
  const { mutateAsync: updateUser } = useUpdateUser();
  const updateAvata = async (key: string) => {
    if (!user) return;
    setUser({ ...user, avatar: key });
    await updateUser({ username: user.username, avatar: key });
  };
  if (!user) return null;
  return (
    <DropdownMenuContent className='grid max-md:grid-cols-3 grid-cols-6'>
      {Object.keys(avataList).map((key) => {
        const avata = avataList[key];
        return (
          <DropdownMenuItem
            key={key}
            className={cn(
              "flex items-center space-x-2 cursor-pointer",
              user.avatar === key ? "bg-gray-100" : ""
            )}
          >
            <button onClick={() => updateAvata(key)}>
              <Image
                src={avata}
                alt={key}
                className='w-14 h-14 rounded-full '
                width={300}
                height={300}
              />
            </button>
          </DropdownMenuItem>
        );
      })}
    </DropdownMenuContent>
  );
};

export default AvataList;
