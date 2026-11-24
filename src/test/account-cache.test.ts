import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { syncAccountCache } from "../lib/account-cache";

describe("private account cache", () => {
  it("removes another user's dashboard and work when accounts change", () => {
    const cache = new QueryClient();
    cache.setQueryData(["workspace"], { userId: "customer-a", work: ["A private workflow"] });
    cache.setQueryData(["admin"], { users: ["customer-a"] });
    expect(syncAccountCache(cache, "customer-a", "customer-b")).toBe("customer-b");
    expect(cache.getQueryData(["workspace"])).toBeUndefined();
    expect(cache.getQueryData(["admin"])).toBeUndefined();
  });

  it("removes private work after sign-out", () => {
    const cache = new QueryClient();
    cache.setQueryData(["workspace"], { userId: "customer-a" });
    syncAccountCache(cache, "customer-a", null);
    expect(cache.getQueryData(["workspace"])).toBeUndefined();
  });

  it("retains the current user's work when identity has not changed", () => {
    const cache = new QueryClient();
    cache.setQueryData(["workspace"], { userId: "customer-a" });
    syncAccountCache(cache, "customer-a", "customer-a");
    expect(cache.getQueryData(["workspace"])).toEqual({ userId: "customer-a" });
  });
});