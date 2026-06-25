import { api } from "./base";

const API_V1 = "/api/v1/";

const ACCESS_TOKEN_API = API_V1 + "auth/access_token/";
const REFRESH_TOKEN_API = API_V1 + "auth/refresh_token/";

export const accessTokenAPI = async (data: { email: string; password: string }) => {
  const res = await api.post(ACCESS_TOKEN_API, data);
  return res.data;
};

export const refreshTokenAPI = async () => {
  const res = await api.post(REFRESH_TOKEN_API, {
    refresh_token: localStorage.getItem("refresh_token"),
  });
  return res.data;
};
