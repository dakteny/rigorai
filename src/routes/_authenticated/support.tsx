import { createFileRoute } from "@tanstack/react-router";
import { Support } from "@/components/workspace";
import { workspaceOptions } from "@/lib/workspace-query";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/support")({
  head: () => pageHead("Help & Support", "Get assistance with your Rigor AI workspace."),
  loader: ({ context }) => context.queryClient.ensureQueryData(workspaceOptions),
  component: Support,
});
