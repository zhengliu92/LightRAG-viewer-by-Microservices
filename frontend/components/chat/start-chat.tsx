"use client";

import React from "react"; 
import { cn } from "@/lib/utils";
import { useChatContext } from "@/contexts/chat-context";



const ChatItems = [
  { data: "知识库包含哪些材料？", clickable: true },
  { data: "材料的加工工艺是什么？", clickable: true },
  { data: "材料的性能参数有哪些？", clickable: true },
  { data: "不同材料之间的关系是什么？", clickable: true },
  { data: "材料的用途有哪些？", clickable: true },
];



const StartChat = () => {
  const { sendMessage } = useChatContext();

  return (
    <div className=' flex flex-col items-center '>
      <div className='flex flex-col items-center'>
        <h1 className={cn("text-3xl pb-1")}>
          我是大模型驱动知识图谱引擎
        </h1>
      </div>
      <div className='grid grid-cols-2  gap-5  items-center gap-y-2 mt-5 max-lg:grid-cols-1'>
        {ChatItems.map((item, index) => (
          <button
          key={index}
            disabled={!item.clickable}
            onClick={() => {
              sendMessage(item.data);
            }}
            className={cn(
              "text-lg w-[300px]  h-10 flex items-center justify-center border rounded-md cursor-pointer bg-sky-700 text-white hover:bg-sky-500  font-semibold transition-all duration-300 ease-in-out",
              item.clickable
                ? "hover:cursor-pointer"
                : "hover:cursor-not-allowed"
            )}
          >
            {item.data}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StartChat;
