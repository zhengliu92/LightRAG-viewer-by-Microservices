import { Message } from "@/interfaces/kb";
import { api } from "@/utils/api";
import { useLocalStorage, useReadLocalStorage } from "usehooks-ts";
import { useState, useCallback } from "react";
import useChatConfig from "./use-chat-config";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { User } from "@/interfaces/user";
import { useApiKey } from "./use-api";
import { getCookie } from "typescript-cookie";
import { useQueryKBContext, useQueryKBTables } from "./use-kbfile-assets";
import { useQueryKBFigures } from "./use-kbfile-assets";
import { QueryKBContextResponse, QueryTableResult } from "@/interfaces/kbfile-assets";
import { FileFigure } from "@/interfaces/kbfile-assets";
import { useKnowledgeBase } from "@/contexts/knowledge-base-context";

const parseChunks = (chunk: string) => {
  try {
    const chunks = chunk.split("\r\n\n\n");
    const parsed_chunks = [];
    for (const chunk of chunks) {
      const jsonMatch = chunk.match(/data: data: ({.*})/);
      if (!jsonMatch) continue;

      const jsonStr = jsonMatch[1];
      const data = JSON.parse(jsonStr);
      parsed_chunks.push(data.chunk || "");
    }
    return parsed_chunks.join("");
  } catch (error) {
    console.error("Error parsing chunk:", error);
    return null;
  }
};

export const useChat = () => {
  const [messages, setMessages] = useLocalStorage<Record<string, Message[]>>(
    "messages",
    {}
  );
  const [figures, setFigures] = useState<Record<string, FileFigure[]>>({});
  const [tables, setTables] = useState<Record<string, QueryTableResult[]>>({});
  const [contexts, setContexts] = useState<Record<string, QueryKBContextResponse>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [numQuery, setNumQuery] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const { topN, threshold, maxMemory, temperature, queryMode } =
    useChatConfig();
  const access_token = getCookie("access_token");
  const headersWithToken = {
    Authorization: `Bearer ${access_token}`,
  };

  const user = useReadLocalStorage<User | null>("user");

  const { apiKey, projectApiKey, apiProvider } = useApiKey();

  const { activeKbId, activeKb } = useKnowledgeBase();

  const { queryKBFiguresAsync } = useQueryKBFigures();
  const { queryKBTablesAsync } = useQueryKBTables();
  const { queryKBContextAsync } = useQueryKBContext();

  const queryFigures = useCallback(
    async (message_id: string, query: string) => {
      if (figures[message_id]) return figures[message_id];

      const kb_id = activeKbId;
      if (!kb_id) return;
      if (!apiKey) {
        toast.error("请先设置API Key");
        return;
      }
      const res = await queryKBFiguresAsync({
        kb_id,
        message_id,
        query,
        api_key: apiKey,
        project_api_key: projectApiKey || "",
        api_provider: apiProvider || "",
        temperature: temperature[0],
        threshold: threshold[0],
        top_n: topN[0],
      });

      if (!res.data) return;

      if (!res.data.figures || res.data.figures.length === 0) {
        toast.error("未找到相关图片");
        return;
      }
      setFigures((prev) => ({
        ...prev,
        [message_id]: res.data?.figures || [],
      }));
      return res.data?.figures;
    },
    [
      figures,
      activeKbId,
      apiKey,
      projectApiKey,
      temperature,
      threshold,
      topN,
      queryKBFiguresAsync,
    ]
  );

  const queryTables = useCallback(
    async (message_id: string, query: string) => {
      if (tables[message_id]) return tables[message_id];
      const kb_id = activeKbId;
      if (!kb_id) return;
      if (!apiKey) {
        toast.error("请先设置API Key");
        return;
      }
      const res = await queryKBTablesAsync({
        kb_id,
        query,
        message_id,
        api_key: apiKey,
        project_api_key: projectApiKey || "",
        api_provider: apiProvider || "",
        temperature: temperature[0],
        threshold: threshold[0],
        top_n: topN[0],
      });
      if (!res.data) return;
      if (!res.data.tables || res.data.tables.length === 0) {
        toast.error("未找到相关表格");
        return;
      }
      setTables((prev) => ({ ...prev, [message_id]: res.data?.tables || [] }));
      return res.data?.tables;
    },
    [
      tables,
      activeKbId,
      apiKey,
      projectApiKey,
      temperature,
      threshold,
      topN,
      queryKBTablesAsync,
    ]
  );

  const queryContexts = useCallback(
    async (message_id: string, query: string) => {
      if (contexts[message_id]) return contexts[message_id];
      const kb_id = activeKbId;
      if (!kb_id) return;
      const res = await queryKBContextAsync({
        kb_id,
        query,
      })
      if (!res.data) return;
      const entities_context = res.data.entities_context 
      const relations_context = res.data.relations_context 
      const text_units_context = res.data.text_units_context
      setContexts((prev) => ({ ...prev, [message_id]: {entities_context, relations_context, text_units_context} }));
      return {entities_context, relations_context, text_units_context};
    },
    [
      contexts,
      activeKbId,
      queryKBContextAsync,
    ]
  )
  




  const stopStream = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  const clearMessages = useCallback(
    (kb_id: string) => {
      if (activeKbId === kb_id) {
        stopStream();
      }
      setMessages((prevMessages) => {
        const updatedMessages = { ...prevMessages };
        updatedMessages[kb_id] = [];
        return updatedMessages;
      });
      setTables((prev) => ({ ...prev, [kb_id]: [] }));
      setFigures((prev) => ({ ...prev, [kb_id]: [] }));
    },
    [activeKbId, stopStream]
  );

  const deleteMessage = useCallback(
    (msg_id: string) => {
      const kb_id = activeKbId;
      if (!kb_id) return;
      setMessages((prev) => {
        const newMessages = { ...prev };
        const kbMessages = newMessages[kb_id] || [];
        const newKbMessages = kbMessages.filter((msg) => msg.id !== msg_id);
        newMessages[kb_id] = newKbMessages;
        return newMessages;
      });
    },
    [activeKbId]
  );

  const fetchStreamData = useCallback(
    async (query: string) => {
      const kb_id = activeKbId;
      if (!kb_id || !user || !activeKb) return;
      if (!apiKey) {
        toast.error("请先设置API Key");
        return;
      }
      const url = api.kb.query.url;
      const controller = new AbortController();
      const history_msg = messages[kb_id]
        ? messages[kb_id].slice(0, messages[kb_id].length - 1)
        : [];
      
      setAbortController(controller);
      setIsStreaming(true);
      setIsLoading(true);
      setCurrentMessage("");

      try {
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        const response = await fetch(url, {
          signal: controller.signal,
          method: "POST",
          headers: {
            ...headersWithToken,
            "Keep-Alive": "timeout=120",
          },
          body: JSON.stringify({
            kb_id: kb_id,
            query: query,
            messages: history_msg,
            threshold: threshold[0],
            top_n: topN[0],
            max_memory: maxMemory[0],
            temperature: temperature[0],
            api_key: apiKey,
            project_api_key: projectApiKey,
            api_provider: apiProvider || "",
            query_mode: queryMode,
          }),
        });

        clearTimeout(timeoutId);

        if (response.status !== 200) {
          const data = await response.json();
          toast.error(data?.detail || "查询失败");
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("Failed to get reader from response body.");
        }

        while (true) {
          const { value, done } = await reader.read();

          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          let chunkObjs = null;
          try {
            chunkObjs = parseChunks(chunk);
            if (!chunkObjs) continue;
          } catch (error) {
            toast.error("解析失败");
            throw error;
          }
          setIsStreaming(false);
          setCurrentMessage((prevMessage) => {
            const updatedMessage = prevMessage + chunkObjs;
            setMessages((prevMessages) => {
              const updatedMessages = { ...prevMessages };
              const currentMessages = updatedMessages[kb_id];
              if (
                currentMessages.length > 0 &&
                currentMessages[currentMessages.length - 1].role === "assistant"
              ) {
                currentMessages[currentMessages.length - 1].content =
                  updatedMessage;
              } else {
                currentMessages.push({
                  role: "assistant",
                  content: updatedMessage,
                  query: query,
                  id: uuidv4(),
                });
              }
              return updatedMessages;
            });
            return updatedMessage;
          });
        }
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") {
          toast.error("Failed to stream response.");
          // reload page
        }
      } finally {
        console.log("Stream closed.");
        setIsLoading(false);
        setIsStreaming(false);
        setAbortController(null);
      }
    },
    [
      activeKbId,
      user,
      activeKb,
      apiKey,
      messages,
      threshold,
      topN,
      maxMemory,
      temperature,
      projectApiKey,
      headersWithToken,
    ]
  );

  const sendMessage = useCallback(
    async (query: string) => {
      const kb_id = activeKbId;
      if (!kb_id) return;
      setNumQuery((prev) => prev + 1);
      const newMessages = { ...messages };
      if (!newMessages[kb_id]) {
        newMessages[kb_id] = [];
      }
      newMessages[kb_id].push({
        id: uuidv4(),
        role: "user",
        content: query,
      });
      setMessages(newMessages);
      if (newMessages[kb_id].length > 0) {
        await fetchStreamData(query);
      }
    },
    [activeKbId, messages, fetchStreamData]
  );

  return {
    kbMessages: activeKbId ? messages[activeKbId] || [] : [],
    messages,
    sendMessage,
    isLoading,
    isStreaming,
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
};
