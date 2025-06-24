"use client"

import ChatMessages from '@/components/chat/chat-messages'
import { useKnowledgeBase } from '@/contexts/knowledge-base-context'
import React from 'react'


const ChatPage = () => {  
  const { hasValidKb } = useKnowledgeBase()

  if (!hasValidKb) {
    return <div className='h-full w-full flex items-center justify-center text-muted-foreground'>没有可用文档</div>
  }


  return (
    <div className='h-full w-full flex flex-col mt-2 gap-2'>
      <ChatMessages />
    </div>
  )
}

export default ChatPage