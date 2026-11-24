import { createFileRoute } from "@tanstack/react-router";
import { Templates } from "@/components/workspace";
import { workspaceOptions } from "@/lib/workspace-query";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/templates")({
  head: () =>
    pageHead("Workflow Templates", "Start your next automation with a Rigor AI template."),
  loader: ({ context }) => context.queryClient.ensureQueryData(workspaceOptions),
  component: Templates,
});
