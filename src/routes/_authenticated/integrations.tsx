import { createFileRoute } from "@tanstack/react-router";
import { Integrations } from "@/components/workspace";
import { workspaceOptions } from "@/lib/workspace-query";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => pageHead("Integrations", "Manage connections for your automation workspace."),
  loader: ({ context }) => context.queryClient.ensureQueryData(workspaceOptions),
  component: Integrations,
});
