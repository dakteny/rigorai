import type { QueryClient } from "@tanstack/react-query";

// Cached private data must never survive a change of signed-in identity.
export function syncAccountCache(
  queryClient: QueryClient,
  previousUserId: string | null | undefined,
  nextUserId: string | null,
) {
  if (previousUserId !== nextUserId) {
    void queryClient.cancelQueries();
    queryClient.clear();
  }
  return nextUserId;
}