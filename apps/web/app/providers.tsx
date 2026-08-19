"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {httpBatchLink} from '@repo/trpc/client'

import { trpc } from "@/lib/trpc"
import { useState } from "react"

export function Provider({children}: {children: React.ReactNode}){
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() => trpc.createClient({
        links: [
            httpBatchLink({url: "http://localhost:8000/trpc"})
        ]
    }))

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </trpc.Provider>
    )
}