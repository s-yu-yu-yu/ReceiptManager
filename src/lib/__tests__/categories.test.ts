import { describe, it, expect } from "vitest";
import {
  DEFAULT_CATEGORIES,
  getCategoryNames,
  getCategoryByName,
} from "../categories";

describe("categories", () => {
  describe("DEFAULT_CATEGORIES", () => {
    it("should contain all expected categories", () => {
      expect(DEFAULT_CATEGORIES).toHaveLength(8);

      const categoryNames = DEFAULT_CATEGORIES.map((cat) => cat.name);
      expect(categoryNames).toContain("食費");
      expect(categoryNames).toContain("日用品");
      expect(categoryNames).toContain("交通費");
      expect(categoryNames).toContain("外食");
      expect(categoryNames).toContain("娯楽");
      expect(categoryNames).toContain("医療費");
      expect(categoryNames).toContain("衣服");
      expect(categoryNames).toContain("その他");
    });

    it("should have proper structure for each category", () => {
      DEFAULT_CATEGORIES.forEach((category) => {
        expect(category).toHaveProperty("name");
        expect(category).toHaveProperty("icon");
        expect(category).toHaveProperty("color");
        expect(category).toHaveProperty("order");
        expect(typeof category.name).toBe("string");
        expect(typeof category.icon).toBe("string");
        expect(typeof category.color).toBe("string");
        expect(typeof category.order).toBe("number");
      });
    });
  });

  describe("getCategoryNames", () => {
    it("should return array of category names", () => {
      const names = getCategoryNames();
      expect(names).toEqual([
        "食費",
        "日用品",
        "交通費",
        "外食",
        "娯楽",
        "医療費",
        "衣服",
        "その他",
      ]);
    });
  });

  describe("getCategoryByName", () => {
    it("should return category when name exists", () => {
      const category = getCategoryByName("食費");
      expect(category).toEqual({
        name: "食費",
        icon: "🍽️",
        color: "#FF6B6B",
        order: 1,
      });
    });

    it("should return undefined when name does not exist", () => {
      const category = getCategoryByName("存在しないカテゴリ");
      expect(category).toBeUndefined();
    });

    it("should handle empty string", () => {
      const category = getCategoryByName("");
      expect(category).toBeUndefined();
    });
  });

  // Note: getCategories() is not tested here as it requires database mocking
  // Integration tests should cover database operations
});
