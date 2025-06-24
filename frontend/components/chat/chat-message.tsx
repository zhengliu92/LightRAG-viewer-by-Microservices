import React, { useState, useRef, useEffect } from "react";
import { Message } from "@/interfaces/kb";
import { cn } from "@/lib/utils";
import { BarChart2, NotebookText, Table, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChatContext } from "@/contexts/chat-context";
import { useReadLocalStorage } from "usehooks-ts";
import { User as UserType } from "@/interfaces/user";
import { toast } from "sonner";
import { ToolTipButton } from "../tooltip_button";
import { FileFigure, QueryKBContextResponse, QueryTableResult } from "@/interfaces/kbfile-assets";
import SheetQueriedFigures from "./chat-queried-figures";
import SheetQueriedTables from "./chat-queried-tables";
import SheetQueriedContexts from "./chat-queried-contexts";
import { AvatarImg } from "../avata_img";

type ChatMessageProps = {
  message: Message;
};



const ChatMessage = ({ message }: ChatMessageProps) => {
  const { isLoading, queryFigures, queryTables, queryContexts } = useChatContext();
  const user = useReadLocalStorage<UserType | null>("user");
  const [showFigures, setShowFigures] = useState(false)
  const [showTables, setShowTables] = useState(false)
  const [showContexts, setShowContexts] = useState(false)
  const [queriedFigures, setQueriedFigures] = useState<FileFigure[]>([])
  const [queriedTables, setQueriedTables] = useState<QueryTableResult[]>([])
  const [queriedContexts, setQueriedContexts] = useState<QueryKBContextResponse | null>(null)
  const { deleteMessage } = useChatContext();
  const [showOptions, setShowOptions] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDelete = async () => {
    if (message.id) {
      deleteMessage(message.id);
      toast.success("消息已删除");
    }
  };

  const actions = [
    {
      icon: <Trash2 className="h-4 w-4" />,
      label: "删除",
      roles: ["user", "assistant"],
      onClick: async () => {
        await handleDelete();
      }
  },
  {
    label:"查找图表",
    icon: <BarChart2 className="h-4 w-4" />,
    roles: ["assistant"],
    onClick: async () => {
      const queriedFigures = await queryFigures(message.id, message.content);
      if (queriedFigures) {
        setQueriedFigures(queriedFigures)
        setShowFigures(true)
      }
    }
  },
  {
    label:"查找表格",
    icon: <Table className="h-4 w-4" />,
    roles: ["assistant"],
    onClick: async () => {
      const queriedTables = await queryTables(message.id, message.content);
      
      if (queriedTables) {
        setQueriedTables(queriedTables)
        setShowTables(true)
      }
    }
  },
  {
    label:"查看引用",
    icon: <NotebookText className="h-4 w-4" />,
    roles: ["assistant"],
    onClick: async () => {
      if (!message.query) {
        return
      }
      const queriedConext = await queryContexts(message.id, message.query);
      if (queriedConext) {    
        setQueriedContexts(queriedConext)
        setShowContexts(true)
      }
    }
  },
  ]

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className={cn(
        "flex items-start space-x-2",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div>{message.role !== "user" && <AvatarImg avatar={user.avatar} role={message.role} username={user.username} />}</div>

      <div
        ref={messageRef}
        className={cn(
          "relative cursor-pointer",
          "flex flex-col gap-1  max-w-[min(75%,42rem)] min-w-sm p-1 px-2 rounded-lg text-white  prose prose-p:mb-0 prose-h2:mt-3 ",
          message.role === "user" ? "bg-sky-600" : "bg-gray-600"
        )}
        onClick={() => setShowOptions(!showOptions)}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {message.content}
        </ReactMarkdown>

        <div className={cn(
          "absolute top-0 right-0 flex gap-2 p-1 rounded bg-black/80 shadow-sm transition-all duration-300 flex-col",
          showOptions ? "opacity-100" : "opacity-0",
          message.role === "user" ? "-left-10 -right-auto" : "-right-10"
        )}>
          {actions.map((action) => (
            action.roles.includes(message.role) && (
              <div
                key={action.label}
                className="relative group">
                  <ToolTipButton
                    className="hover:bg-accent/10"
                    icon={action.icon}
                    tooltip={action.label}
                    onClick={action.onClick}
                    side={message.role === "user" ? "left" : "right"}
                    sideOffset={5}
                />
            </div>
            )
          ))}
        </div>
      </div>

      <div>{message.role === "user" && <AvatarImg avatar={user.avatar} role={message.role} username={user.username} />}</div>

      <SheetQueriedFigures open={showFigures} onOpenChange={setShowFigures} queriedFigures={queriedFigures} />
      <SheetQueriedTables open={showTables} onOpenChange={setShowTables} queriedTables={queriedTables} />
      <SheetQueriedContexts open={showContexts} onOpenChange={setShowContexts} queriedContexts={queriedContexts} />
    </div>
  );
};

export default ChatMessage;
