"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { UseMutateAsyncFunction } from "@tanstack/react-query";
import { BaseResponse } from "@/interfaces/base";
import {
  ChangeKbNameRequest,
  ChangeKbNameResponse,
  CreateKbRequest,
  CreateKbResponse,
  IKb,
  IProjKb,
} from "@/interfaces/kb";
import { useKb } from "@/hooks/use-kb";

interface KnowledgeBaseContextType {
  kbs: IKb[] | undefined;
  activeKb: IKb | null;
  isLoading: boolean;
  createKbAsync: UseMutateAsyncFunction<
    BaseResponse<CreateKbResponse>,
    Error,
    CreateKbRequest,
    unknown
  >;
  renameKbAsync: UseMutateAsyncFunction<
    BaseResponse<ChangeKbNameResponse>,
    Error,
    ChangeKbNameRequest,
    unknown
  >;
  getKbById: (kb_id: string) => IKb | null | undefined;
  activeKbId: string | null;
  setActiveKbId: (kb_id: string) => void;
  projs: IProjKb[] | undefined;
  all_kbs: IKb[] | undefined;
  hasValidKb: boolean;
  isProjectKb: (kb_id: string) => boolean;
}

const KnowledgeBaseContext = createContext<
  KnowledgeBaseContextType | undefined
>(undefined);

export function KnowledgeBaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    kbs,
    isLoading,
    createKbAsync,
    renameKbAsync,
    getKbById,
    activeKbId,
    setActiveKbId,
    projs,
    all_kbs,
  } = useKb();
  const [activeKb, setActiveKb] = useState<IKb | null>(null);

  const hasValidKb = useMemo(() => {
    return Number(activeKb?.kb_file_build_finished_count) > 0;
  }, [activeKb]);

  const isProjectKb = (kb_id: string) => {
    return projs?.some((proj) => proj.kbs?.some((kb) => kb.id === kb_id));
  };

  useEffect(() => {
    if (activeKbId) {
      const kb = getKbById(activeKbId);
      if (kb) {
        setActiveKb(kb);
      }
    } else {
      setActiveKb(null);
    }
  }, [activeKbId, getKbById]);

  return (
    <KnowledgeBaseContext.Provider
      value={{
        hasValidKb,
        activeKb,
        kbs,
        isLoading,
        createKbAsync,
        renameKbAsync,
        getKbById,
        activeKbId,
        setActiveKbId,
        projs,
        all_kbs,
        isProjectKb,
      }}
    >
      {children}
    </KnowledgeBaseContext.Provider>
  );
}

export function useKnowledgeBase() {
  const context = useContext(KnowledgeBaseContext);
  if (context === undefined) {
    throw new Error(
      "useKnowledgeBase must be used within a KnowledgeBaseProvider"
    );
  }
  return context;
}
