export const planNames = ["Free", "Pro", "Business"] as const;
export type PlanName = (typeof planNames)[number];

export function resolvePlanAccess(roles: { role: string }[], currentPlan?: string | null) {
  const isAdministrator = roles.some((role) => role.role === "admin");
  const current =
    planNames.find((plan) => plan.toLowerCase() === currentPlan?.toLowerCase()) ?? "Free";
  return {
    isAdministrator,
    plans: isAdministrator ? [...planNames] : [current],
  };
}
