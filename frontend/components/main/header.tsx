"use client";

import Link from "next/link";
import { FolderClosed, Menu, UserCog, Waypoints } from "lucide-react";
import { Database, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavAvata } from "../home/nav-avata";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect } from "react";
import { useState } from "react";
import { useReadLocalStorage } from "usehooks-ts";
import { User } from "@/interfaces/user";

const links = [
  {
    href: "/",
    label: "知识库",
    icon: <Database className="h-5 w-5" />,
    need_admin: false,
  },
  {
    href: "/chat",
    label: "聊天",
    icon: <MessageSquare className="h-5 w-5" />,
    need_admin: false,
  },
  {
    href: "/graph",
    label: "图谱",
    icon: <Waypoints className="h-5 w-5" />,
    need_admin: false,
  },
  {
    href: "/files",
    label: "文件",
    icon: <FolderClosed className="h-5 w-5" />,
    need_admin: false,
  },
  {
    href: "/manage",
    label: "管理",
    icon: <UserCog className="h-5 w-5" />,
    need_admin: true,
  },
];

type LinkComponentProps = {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
};

const showLink = (need_admin: boolean, isAdmin: boolean) => {
  if (need_admin) {
    return isAdmin;
  }
  return true;
};

const LinkComponent = ({ href, children, icon }: LinkComponentProps) => {
  const pathname = usePathname();
  let isActive = false;
  if (pathname === "/") {
    isActive = pathname === href;
  } else if (pathname.includes("/kb_")) {
    isActive = href === "/";
  } else {
    const path_splits = pathname.split("/");
    const href_splits = href.split("/");
    isActive = path_splits[1] === href_splits[1];
  }
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center p-2 rounded-lg transition-all duration-500 ease-in-out",
        isActive ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"
      )}
    >
      <span className="flex items-center gap-2">
        {icon}
        {children}
      </span>
    </Link>
  );
};

type HeaderMobileProps = {
  isAdmin: boolean;
};
const HeaderMobile = ({ isAdmin }: HeaderMobileProps) => {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between md:hidden p-4 w-full">
      <Link href="/" className="flex items-center gap-2">
        <span className="font-alibaba-bold text-xl">知识图谱引擎</span>
      </Link>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px] mt-2">
            {links.map(
              (link) =>
                showLink(link.need_admin, isAdmin) && (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center gap-2 w-full p-2 hover:bg-primary/10 hover:cursor-pointer",
                        pathname === link.href && "bg-primary/10"
                      )}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </Link>
                  </DropdownMenuItem>
                )
            )}
            <DropdownMenuItem className="p-0">
              <div className="w-full p-2">
                <NavAvata />
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export const Header = () => {
  const [isMounted, setIsMounted] = useState(false);

  const user = useReadLocalStorage<User | null>("user");
  const isAdmin = user?.role_name === "admin";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <HeaderMobile isAdmin={isAdmin} />

      <div className="hidden md:flex h-16 w-full px-4 items-center justify-between text-xl">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-alibaba-bold text-2xl text-nowrap">
            知识图谱引擎
          </span>
        </Link>

        <nav className="flex items-center gap-0 text-black rounded-lg text-nowrap">
          {links.map(
            (link) =>
              showLink(link.need_admin, isAdmin) && (
                <LinkComponent
                  href={link.href}
                  key={link.href}
                  icon={link.icon}
                >
                  {link.label}
                </LinkComponent>
              )
          )}
        </nav>

        <div className="flex items-center">
          <NavAvata />
        </div>
      </div>
    </header>
  );
};
