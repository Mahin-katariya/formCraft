import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { ServerRouter } from "@repo/trpc/client";

export const trpc = createTRPCClient<ServerRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:8000/trpc",
    }),
  ],
});
