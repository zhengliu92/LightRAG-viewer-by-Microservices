import { getCookie, setCookie } from "typescript-cookie";
import { BaseResponse } from "./../interfaces/base";
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { api } from "@/utils/api";

// Define supported HTTP methods

type ApiConfig = {
  url: string;
  method: string;
};

export async function makeRequest<Req, Res>(
  apiConfig: ApiConfig,
  req: Req,
  additionalConfig?: Partial<AxiosRequestConfig> // For optional extra configs
): Promise<BaseResponse<Res>> {
  // Construct base Axios configuration
  let access_token = getCookie("access_token");
  const refresh_token = getCookie("refresh_token");

  const headersWithToken = {
    Authorization: `Bearer ${access_token}`,
  };
  const headers = {
    ...headersWithToken,
    ...additionalConfig?.headers,
  };

  const config: AxiosRequestConfig = {
    method: apiConfig.method,
    url: apiConfig.url,
    headers: headers,
    ...additionalConfig,
  };

  if (["post", "put", "patch"].includes(apiConfig.method)) {
    config.data = req;
  } else {
    config.params = req;
  }

  const res = {} as BaseResponse<Res>;

  const handleRetry = async () => {
    try {
      const refreshConfig: AxiosRequestConfig = {
        method: "post",
        url: api.user.renew.url, // Replace with your refresh token endpoint
        data: { refresh_token },
        headers: headers,
      };
      const response = await axios(refreshConfig);

      // Update access token
      access_token = response.data.access_token;
      setCookie("access_token", access_token); // Save new token in cookies

      // Update headers with new access token
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${access_token}`,
      };
      // Retry original request
      const retryResponse = await axios(config);
      res.data = retryResponse.data;
      res.code = 200;
      return res;
    } catch (refreshError: any) {
      if (axios.isAxiosError(refreshError)) {
        const axiosRefreshError = refreshError as AxiosError;
        res.code = axiosRefreshError.response?.status || 500;
        res.message = "Failed to refresh token";
        return res;
      }
      res.code = 500;
      res.message = "Internal server error during token refresh";
      return res;
    }
  };

  try {
    // Make the HTTP request
    const response = await axios(config);
    // Return response data
    res.data = response.data;
    res.code = 200;
    return res;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const response = axiosError.response as AxiosResponse;
        res.code = response.status;
        res.message = response.data?.message || response.statusText;

        // Check if the error is due to an expired token
        if (res.code === 401 && refresh_token) {
          return await handleRetry(); // Attempt to refresh token and retry
        }
        return res;
      }
    }
    // Return generic error
    res.code = 500;
    res.message = "Internal server error";
    return res;
  }
}


