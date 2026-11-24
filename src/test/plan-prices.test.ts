import { expect, it } from "vitest";
import { planAmounts, planCurrency, planBillingInterval } from "../lib/catalog";

it("Pro costs 50 dollars", () => {
  expect(planAmounts.Pro).toBe(50);
});

it("Business costs 100 dollars", () => {
  expect(planAmounts.Business).toBe(100);
});

it("plan prices use US dollars", () => {
  expect(planCurrency).toBe("USD");
});

it("paid plans are billed monthly", () => {
  expect(planBillingInterval).toBe("month");
});