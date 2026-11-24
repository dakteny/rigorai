import { createFileRoute } from "@tanstack/react-router";
import { Billing } from "@/components/workspace";
import { workspaceOptions } from "@/lib/workspace-query";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/billing")({
  head: () =>
    pageHead("Billing & Subscription", "Manage your Rigor AI subscription and plan enquiries."),
  loader: ({ context }) => context.queryClient.ensureQueryData(workspaceOptions),
  component: Billing,
});
