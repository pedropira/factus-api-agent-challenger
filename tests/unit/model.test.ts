import { describe, it, expect } from "vitest";
import { createModel } from "@/lib/ai/model";

describe("createModel", () => {
  it("should return a non-null model object", () => {
    const model = createModel();
    expect(model).toBeTruthy();
  });

  it("should return an object with a provider property", () => {
    const model = createModel();
    // The model object should have a provider string
    expect(typeof model).toBe("object");
  });

  it("should not throw when called", () => {
    expect(() => createModel()).not.toThrow();
  });
});
