"use client";
import { Input } from "@/components/ui/input";
import {
  CircleStop,
  SendHorizonal,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useChatContext } from "@/contexts/chat-context";
import ChatSettingPopover from "./chat-setting-popover";
import { useKnowledgeBase } from "@/contexts/knowledge-base-context";


const ChatInput = () => {
  const [input, setInput] = React.useState("");
  const { hasValidKb } = useKnowledgeBase();
  const { sendMessage ,isLoading,stopStream} = useChatContext(); 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    } else {
      toast.error("请输入内容");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };


  const buttonClass = `flex items-center justify-center w-6 h-6   hover:text-primary/60 `;

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className='justify-start pl-2 border-t border-primary/10 py-2 flex items-center space-x-2'
      >
        <ChatSettingPopover />
        <Input
          aria-label='Chat input'
          disabled={isLoading|| !hasValidKb}
          value={input}
          onChange={handleChange}
          placeholder='给AI发送消息'
          className='rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 focus:ring-0'
        />
        {isLoading ? (
          <button
            disabled={!isLoading }
            onClick={(e) => {
              e.preventDefault();
                stopStream();
            }}
          >
            <CircleStop className={cn("mr-2", buttonClass,isLoading && "animate-pulse text-red-500")} />
          </button>
        ) : (
          <button
            aria-label='Send message'
            disabled={isLoading || !hasValidKb}
            className='disabled:opacity-50 disabled:cursor-not-allowed'
            type='submit'
          >
            <SendHorizonal className={cn("mr-2", buttonClass)} />
          </button>
        )}

      </form>
    </>
  );
};

export default ChatInput;
