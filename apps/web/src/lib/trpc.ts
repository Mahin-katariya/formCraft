import { createTRPCClient, httpBatchLink, TRPCClientError } from "@trpc/client";
import type { ServerRouter } from "@repo/trpc/client";
import { getAccessToken, setAccessToken } from "./auth-token";

export const trpc = createTRPCClient<ServerRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:8000/trpc",
      headers() {
        const token = getAccessToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      fetch(url, options) {
        return fetch(url, { ...options, credentials: "include" });
      },
    }),
  ],
});

export async function trpcWithRefresh<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (
      error instanceof TRPCClientError &&
      error.data?.code === "UNAUTHORIZED"
    ) {
      try {
        const refreshResult = await trpc.auth.refresh.mutate();
        setAccessToken(refreshResult.accessToken);
        return await fn();
      } catch {
        setAccessToken(null);
        throw error;
      }
    }
    throw error;
  }
}
