import { api, API_V1 } from "./base";


const USER_LIST = API_V1 + "user/list/";

export const userList = async () => {
  const res = await api.get(USER_LIST);
  return res.data;
};
