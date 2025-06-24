import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BeatLoader } from "react-spinners";
import { useChatContext } from "@/contexts/chat-context";
import { AvatarImg } from "../avata_img";

const StreamWaiting = () => {
  const { isStreaming, numQuery } = useChatContext();
  const [showWaiting, setShowWaiting] = useState(false);
  
  useEffect(() => {
    setShowWaiting(false);
    setTimeout(() => {
      setShowWaiting(true);
    }, 5000);
  }, [numQuery]);``

  if (!isStreaming) return null;

  return (
    <div className={cn("flex items-center space-x-2", "justify-start")}>
      <AvatarImg avatar={"avatar"} role={"assistant"} username={"AI"} />
      <div className={cn("max-w-xs p-3 rounded-lg text-white", "bg-gray-600 flex-center")}>
        {showWaiting && <p className='text-sm'>数据量较大，请耐心等待</p>}
        <BeatLoader
          color='white'
          size={5}
        />
      </div>
    </div>
  );
};

export default StreamWaiting;
