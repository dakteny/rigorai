import { expect, it } from "vitest";
import {
  planAmounts,
  planCurrency,
  planBillingInterval,
  planPriceLabel,
} from "../lib/catalog";

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

it("plan labels put the dollar sign after the amount with no US prefix", () => {
  expect(planPriceLabel("Free")).toBe("0$");
  expect(planPriceLabel("Pro")).toBe("50$/month");
  expect(planPriceLabel("Business")).toBe("100$/month");
});