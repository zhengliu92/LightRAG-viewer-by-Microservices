"use client";

import React, { createContext, useContext } from "react";
import { useChat } from "@/hooks/use-chat";
import { Message } from "@/interfaces/kb";
import { FileFigure, QueryKBContextResponse } from "@/interfaces/kbfile-assets";
import { QueryTableResult } from "@/interfaces/kbfile-assets";

type ChatContextProps = {
  kbMessages: Message[];
  messages: Record<string, Message[]>;
  sendMessage: (query: string) => void;
  isLoading: boolean;
  isStreaming: boolean;
  stopStream: () => void;
  clearMessages: (kb_id: string) => void;
  deleteMessage: (msg_id: string) => void;
  queryFigures: (message_id: string, query: string) => Promise<FileFigure[] | undefined>;
  queryTables: (message_id: string, query: string) => Promise<QueryTableResult[] | undefined>;
  queryContexts: (message_id: string, query: string) => Promise<QueryKBContextResponse | undefined>;
  figures: Record<string, FileFigure[]>;
  tables: Record<string, QueryTableResult[]>;
  numQuery: number;
};

export const ChatContext = createContext<ChatContextProps>({
  kbMessages: [],
  messages: {},
  isLoading: false,
  isStreaming: false,
  stopStream: () => {},
  clearMessages: (kb_id: string) => {},
  deleteMessage: (msg_id: string) => {},
  sendMessage: (content: string) => {},
  queryFigures: (message_id: string, query: string) => Promise.resolve([]),
  queryTables: (message_id: string, query: string) => Promise.resolve([]),
  queryContexts: (message_id: string, query: string) => Promise.resolve({
    entities_context: [],
    relations_context: [],
    text_units_context: []
  }),
  figures: {},
  tables: {},
  numQuery: 0,
});

type Props = {
  children: React.ReactNode;
};

// Create a provider component
export const ChatContextProvider = ({ children }: Props) => {
  const {
    kbMessages,
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    stopStream,
    clearMessages,
    deleteMessage,
    queryFigures,
    queryTables,
    queryContexts,
    figures,
    tables,
    numQuery,
  } = useChat();

    const contextValue = {
    kbMessages,
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    stopStream,
    clearMessages,
    deleteMessage,
    queryFigures,
    queryTables,
    queryContexts,
    figures,
    tables,
    numQuery,
  };

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
};

export function useChatContext() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}