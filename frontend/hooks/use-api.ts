import { useLocalStorage } from "usehooks-ts";

interface ApiKeyState {
  apiKey: string | null;
  projectApiKey: string | null;
  setApiKey: (key: string) => void;
  setProjectApiKey: (key: string) => void;
  clearApiKey: () => void;
  clearProjectApiKey: () => void;
  clearAllKeys: () => void;
  hasValidKey: () => boolean;
  hasValidProjectKey: () => boolean;
  apiProvider: string | null;
  setApiProvider: (provider: string) => void;
}

export const useApiKey = (): ApiKeyState => {
  const [apiKey, setApiKey] = useLocalStorage<string | null>("apiKey", null);
  const [projectApiKey, setProjectApiKey] = useLocalStorage<string | null>(
    "projectApiKey",
    null
  );
  const [apiProvider, setApiProvider] = useLocalStorage<string | null>(
    "apiProvider",
    null
  );

  const clearApiKey = () => setApiKey(null);
  const clearProjectApiKey = () => setProjectApiKey(null);
  const clearAllKeys = () => {
    setApiKey(null);
    setProjectApiKey(null);
    setApiProvider(null);
  };

  const hasValidKey = () => {
    return Boolean(apiKey && apiKey.startsWith("sk-") && apiKey.length > 20);
  };

  const hasValidProjectKey = () => {
    return Boolean(projectApiKey && projectApiKey.length >= 32);
  };

  return {
    apiKey,
    projectApiKey,
    setApiKey,
    setProjectApiKey,
    clearApiKey,
    clearProjectApiKey,
    clearAllKeys,
    hasValidKey,
    hasValidProjectKey,
    apiProvider,
    setApiProvider,
  };
};
