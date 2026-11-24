import { createFileRoute } from "@tanstack/react-router";
import { Overview } from "@/components/workspace";
import { workspaceOptions } from "@/lib/workspace-query";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageHead("Overview", "Your private automation overview and recent activity."),
  loader: ({ context }) => context.queryClient.ensureQueryData(workspaceOptions),
  component: Overview,
});
