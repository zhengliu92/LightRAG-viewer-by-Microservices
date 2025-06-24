import { useLocalStorage } from "usehooks-ts";

type QueryMode = "global" | "local" | "hybrid";
export default function useChatConfig() {
  const [queryMode, setQueryMode] = useLocalStorage<QueryMode>(
    "query_mode",
    "global"
  );

  const [topN, setTopN] = useLocalStorage<number[]>("topN", [10]);

  const [maxMemory, setMaxMemory] = useLocalStorage<number[]>("max_memory", [
    10,
  ]);

  const [temperature, setTemperature] = useLocalStorage<number[]>(
    "temperature",
    [0.1]
  );
  const [threshold, setThreshold] = useLocalStorage<number[]>("threshold", [
    0.5,
  ]);

  return {
    topN,
    setTopN,
    maxMemory,
    setMaxMemory,
    threshold,
    setThreshold,
    temperature,
    setTemperature,
    queryMode,
    setQueryMode,
  };
}
