import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "@/components/workspace";
import { workspaceOptions } from "@/lib/workspace-query";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/activity")({
  head: () => pageHead("Activity Logs", "Review private workflow and account activity."),
  loader: ({ context }) => context.queryClient.ensureQueryData(workspaceOptions),
  component: Activity,
});
