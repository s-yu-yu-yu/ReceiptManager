import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("utils", () => {
  describe("cn", () => {
    it("should merge class names correctly", () => {
      expect(cn("px-2 py-1", "bg-red-500")).toBe("px-2 py-1 bg-red-500");
    });

    it("should handle conditional classes", () => {
      const condition1 = true;
      const condition2 = false;
      expect(cn("px-2", condition1 && "py-1", condition2 && "bg-red-500")).toBe(
        "px-2 py-1"
      );
    });

    it("should handle Tailwind conflicts", () => {
      expect(cn("px-2 px-4")).toBe("px-4");
    });

    it("should handle empty inputs", () => {
      expect(cn()).toBe("");
    });

    it("should handle undefined and null inputs", () => {
      expect(cn("px-2", undefined, null, "py-1")).toBe("px-2 py-1");
    });
  });
});
