import { createFileRoute } from "@tanstack/react-router";
import { Agents } from "@/components/workspace";
import { workspaceOptions } from "@/lib/workspace-query";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/agents")({
  head: () => pageHead("AI Agents", "Configure and test your Rigor AI agents."),
  loader: ({ context }) => context.queryClient.ensureQueryData(workspaceOptions),
  component: Agents,
});
