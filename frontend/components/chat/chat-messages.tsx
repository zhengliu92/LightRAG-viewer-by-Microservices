import React, { ElementRef, useEffect, useRef } from "react";
import ChatMessage from "./chat-message";
import {  useChatContext } from "@/contexts/chat-context";
import { Message } from "@/interfaces/kb";
import StreamWaiting from "./stream-waiting";
import StartChat from "./start-chat";

const ChatMessages = () => {
  const scrollRef = useRef<ElementRef<"div">>(null);
  const { kbMessages } = useChatContext();
  const lastMessageLength = kbMessages[kbMessages.length - 1]?.content.length;
  useEffect(() => { 
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
    }
  }, [kbMessages.length,lastMessageLength]);

  return (
    <div className='p-4 space-y-4 flex-1 overflow-y-auto h-[calc(100vh-200px)]'>
      {kbMessages.length === 0 ? (
        <StartChat />
      ) : (
        kbMessages.map((message: Message) => (
          <ChatMessage
            key={message.id}
            message={message}
          />
        ))
      )}
      <StreamWaiting />
      <div ref={scrollRef} />

    </div>
  );
};

export default ChatMessages;
