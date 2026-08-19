"use client";

import { trpc } from "@/lib/trpc";

export function HealthStatus() {
  const { data, isLoading } = trpc.health.useQuery();

  if (isLoading) return <p>Loading...</p>;
  return <p>Status: {data?.status}</p>;
}