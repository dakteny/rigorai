import { createFileRoute } from "@tanstack/react-router";
import { Analytics } from "@/components/workspace";
import { workspaceOptions } from "@/lib/workspace-query";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => pageHead("Analytics", "Track verified automation performance and monthly usage."),
  loader: ({ context }) => context.queryClient.ensureQueryData(workspaceOptions),
  component: Analytics,
});
