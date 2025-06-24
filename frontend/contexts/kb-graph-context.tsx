import { GetKBGraphRequest } from "@/interfaces/kb";

import { api } from "@/utils/api";
import { makeRequest } from "@/services/services";
import { GetKBGraphResponse } from "@/interfaces/kb";
import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useKnowledgeBase } from "./knowledge-base-context";

export const getKbGraph = async (req: GetKBGraphRequest) => {
  return await makeRequest<typeof req, GetKBGraphResponse>(
    api.kb.get_graph,
    req
  );
};

interface KBGraphContextType {
  activeKbGraph: GetKBGraphResponse | null;
}

export const KBGraphContext = createContext<KBGraphContextType | undefined>(
  undefined
);

export function KBGraphContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const { activeKbId, hasValidKb } = useKnowledgeBase();

  const isQueryEnabled = Boolean(activeKbId) && Boolean(hasValidKb);


  const [activeKbGraph, setActiveKbGraph] = useState<GetKBGraphResponse | null>(
    null
  );

  
  const { data: graphData } = useQuery({
    queryKey: ['kbGraphs', activeKbId],
    queryFn: () => getKbGraph({ kb_id: activeKbId || "" }),
    enabled: isQueryEnabled,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000, 
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (graphData?.data) {
      setActiveKbGraph(graphData.data);
    }else{
      setActiveKbGraph(null);
    }
  }, [graphData, activeKbId]);

  return (
    <KBGraphContext.Provider
      value={{  activeKbGraph }}
    >
      {children}
    </KBGraphContext.Provider>
  );
}

export function useKBGraph() {
  const context = useContext(KBGraphContext);
  if (!context) {
    throw new Error("useKBGraph must be used within a KBGraphContextProvider");
  }
  return context;
}
