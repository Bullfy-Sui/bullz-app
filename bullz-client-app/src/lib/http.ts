import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

export const BASE_AXIOS = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  timeout: 50000,
  headers: {
    Accept: "application/json",
  },
});
export const COUNTRY_AXIOS = axios.create({
  baseURL: "https://countriesnow.space/api/v0.1",
  timeout: 50000,
  headers: {
    Accept: "application/json",
  },
});

const requestConfig = (config: AxiosRequestConfig) => {
  const token = "";

  return {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    },
  };
};

const responseErrorConfig = (error: AxiosError) => {
  return Promise.reject(error);
};

BASE_AXIOS.interceptors.request.use(
  // @ts-expect-error -  -
  requestConfig,
  (error) => {
    return Promise.reject(error);
  }
);

BASE_AXIOS.interceptors.response.use((response) => {
  return response;
}, responseErrorConfig);
COUNTRY_AXIOS.interceptors.request.use(
  // @ts-expect-error -  -
  requestConfig,
  (error) => {
    return Promise.reject(error);
  }
);

COUNTRY_AXIOS.interceptors.response.use((response) => {
  return response;
}, responseErrorConfig);

export class HttpClient {
  private static async request<T>(
    axiosInstance: AxiosInstance,
    config: AxiosRequestConfig
  ): Promise<T> {
    const response = await axiosInstance.request<T>(config);
    return response.data;
  }

  static async get<T>(
    axiosInstance: AxiosInstance,
    { url, params }: { url: string; params?: unknown }
  ): Promise<T> {
    return this.request<T>(axiosInstance, { method: "get", url, params });
  }

  static async post<T>(
    axiosInstance: AxiosInstance,
    {
      url,
      data,
      options,
    }: { url: string; data: unknown; options?: AxiosRequestConfig }
  ): Promise<T> {
    console.log(data, url);
    return this.request<T>(axiosInstance, {
      method: "post",
      url,
      data,
      ...options,
    });
  }

  static async put<T>(
    axiosInstance: AxiosInstance,
    { url, data }: { url: string; data: unknown }
  ): Promise<T> {
    return this.request<T>(axiosInstance, { method: "put", url, data });
  }

  static async patch<T>(
    axiosInstance: AxiosInstance,
    { url, data }: { url: string; data?: unknown }
  ): Promise<T> {
    return this.request<T>(axiosInstance, { method: "patch", url, data });
  }

  static async delete<T>(
    axiosInstance: AxiosInstance,
    { url }: { url: string }
  ): Promise<T> {
    return this.request<T>(axiosInstance, { method: "delete", url });
  }
}
