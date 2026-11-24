import { createFileRoute } from "@tanstack/react-router";
import { AccountSettings } from "@/components/workspace";
import { workspaceOptions } from "@/lib/workspace-query";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/settings")({
  head: () => pageHead("Account Settings", "Update your profile and secure your Rigor AI account."),
  loader: ({ context }) => context.queryClient.ensureQueryData(workspaceOptions),
  component: AccountSettings,
});
