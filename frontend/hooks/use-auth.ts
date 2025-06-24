import { LoginResponse } from "@/interfaces/login";
import { User } from "@/interfaces/user";
import { useRouter } from "next/navigation";
import { setCookie } from "typescript-cookie";
import { useLocalStorage } from "usehooks-ts";
import { useApiKey } from "./use-api";

export const useAuth = () => {
  const [user, setUser] = useLocalStorage<User | null>("user", null);
  const { clearAllKeys, setApiKey, setApiProvider } = useApiKey();
  const [session_id, setSessionId] = useLocalStorage<string | null>(
    "session_id",
    null
  );
  const router = useRouter();

  const setAccessToken = (token: string) => {
    setCookie("access_token", token, { expires: 7 });
  };

  const setRefreshToken = (token: string) => {
    setCookie("refresh_token", token, { expires: 30 });
  };

  const removeAccessToken = () => {
    setCookie("access_token", "", { expires: new Date(0) });
  };

  const removeRefreshToken = () => {
    setCookie("refresh_token", "", { expires: new Date(0) });
  };

  const afterLogin = (data: LoginResponse) => {
    setUser(data.user);
    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);
    setSessionId(data.session_id);
    setApiKey(
      "YQ/gW0nMSh0mHTZNgIRAQJsOdGiW21WGSoa+rxldVOCNb2LDgTlFsaAYlqW1J98NgjaJEQAIHcRfxmqphKA2nX/r2Z5MCuCGkasriWFPvE4JBWQGEMO11NpGUuCq5hNZMHeXDYuBob8S20JIs1oPPDiyo84WSzG18SP8c/OulGa/APLnGua9GDHJfD6IXsZ0FHFSMX1gS/Fqv/WbFQJhuBYMhHdJnYsn7JM9aJQnsLdlajqElthcynzR1eQUHMaoa0K6ie7SgNlR6x6Ed4SECuHJYc61l9rUoElPwcVf2sVL25gs7w2RwvdBG/TVYH2sORCzQRFHdI9XUYf7QIL7+A=="
    );
    setApiProvider("openai");
  };

  const clearUp = () => {
    setUser(null);
    clearAllKeys();
    removeAccessToken();
    removeRefreshToken();
    setSessionId(null);
    router.push("/login");
    router.refresh();
  };

  return {
    user,
    setUser,
    session_id,
    afterLogin,
    clearUp,
  };
};
