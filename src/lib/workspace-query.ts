import { queryOptions } from "@tanstack/react-query";
import { workspace } from "./platform.functions";
export const workspaceOptions = queryOptions({
  queryKey: ["workspace"],
  queryFn: () => workspace(),
  staleTime: 15000,
});
