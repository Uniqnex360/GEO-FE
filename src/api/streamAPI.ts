import axios from "axios";
import { tokenStorage } from "../helpers/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/";

let isRefreshing = false;

let queue: {
  resolve: (token: string) => void;
  reject: (err: any) => void;
}[] = [];

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

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefresh();

  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const res = await axios.post(`${API_BASE_URL}api/v1/auth/refresh_token/`, {
    refresh_token: refreshToken,
  });

  const access = res.data?.access_token;
  // Keep existing refresh token if the API does not rotate it
  const refresh = res.data?.refresh_token || refreshToken;

  if (!access) {
    throw new Error("No access token in refresh response");
  }

  tokenStorage.setTokens(access, refresh);
  return access;
}

export async function streamApi<T>(
  endpoint: string,
  body: any,
  onMessage: (data: T) => void,
) {
  const token = tokenStorage.getAccess();

  //@ts-ignore
  async function executeRequest(accessToken?: string, hasRetried = false) {
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

    if (response.status === 401) {
      // Already refreshed once for this call — do not loop or wipe session
      // unless refresh itself fails below.
      if (hasRetried) {
        throw new Error("Unauthorized after token refresh");
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((newToken) => executeRequest(newToken, true));
      }

      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        // Release the lock before the long-lived stream starts
        isRefreshing = false;
        return executeRequest(newToken, true);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        tokenStorage.clear();
        window.location.href = "/login";
        throw err;
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response stream");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
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
