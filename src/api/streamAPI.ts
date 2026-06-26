import axios from "axios";
import { tokenStorage } from "../helpers/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --------------------------
// Refresh state
// --------------------------
let isRefreshing = false;

let queue: {
  resolve: (token: string) => void;
  reject: (err: any) => void;
}[] = [];

// --------------------------
// Queue processor
// --------------------------
const processQueue = (error: any, token: string | null = null) => {
  queue.forEach((promise) => {
    if (token) {
      promise.resolve(token);
    } else {
      promise.reject(error);
    }
  });

  queue = [];
};

// --------------------------
// Refresh token helper
// --------------------------
async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefresh();

  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const res = await axios.post(`${API_BASE_URL}api/v1/auth/refresh_token/`, {
    refresh_token: refreshToken,
  });

  const access = res.data.access_token;
  const refresh = res.data.refresh_token;

  tokenStorage.setTokens(access, refresh);

  return access;
}

// --------------------------
// Main reusable stream API
// --------------------------
export async function streamApi<T>(
  endpoint: string,
  body: any,
  onMessage: (data: T) => void,
) {
  let token = tokenStorage.getAccess();
  //@ts-ignore
  async function executeRequest(accessToken?: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        ...(accessToken && {
          Authorization: `Bearer ${accessToken}`,
        }),
      },

      body: JSON.stringify(body),
    });

    // --------------------------
    // Handle token expiry
    // --------------------------

    if (response.status === 401) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          queue.push({
            resolve,
            reject,
          });
        }).then((newToken) => executeRequest(newToken));
      }

      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();

        processQueue(null, newToken);

        return executeRequest(newToken);
      } catch (err) {
        processQueue(err, null);

        tokenStorage.clear();

        window.location.href = "/login";

        throw err;
      } finally {
        isRefreshing = false;
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response stream");
    }

    // --------------------------
    // Stream reader
    // --------------------------

    const reader = response.body.getReader();

    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true,
      });

      const lines = buffer.split("\n");

      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const parsed = JSON.parse(line);

          onMessage(parsed);
        } catch (err) {
          console.error("Stream parse error", err);
        }
      }
    }
  }

  return executeRequest(token || undefined);
}
