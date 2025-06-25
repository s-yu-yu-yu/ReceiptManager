import { describe, it, expect, vi } from "vitest";
import {
  getCurrentMonthString,
  formatDateForDisplay,
  getMainCategories,
} from "../homeHelpers";
import { type Receipt } from "@/types";

describe("homeHelpers", () => {
  describe("getCurrentMonthString", () => {
    it("should return current month string in Japanese format", () => {
      // Mock the current date
      const mockDate = new Date("2024-03-15");
      vi.spyOn(globalThis, "Date").mockImplementation(() => mockDate);

      const result = getCurrentMonthString();
      expect(result).toBe("2024年3月");

      vi.restoreAllMocks();
    });
  });

  describe("formatDateForDisplay", () => {
    it("should format date correctly in Japanese format", () => {
      const testDate = new Date("2024-03-15");
      const result = formatDateForDisplay(testDate);
      expect(result).toBe("3/15");
    });

    it("should handle different dates", () => {
      const testDate = new Date("2024-12-25");
      const result = formatDateForDisplay(testDate);
      expect(result).toBe("12/25");
    });
  });

  describe("getMainCategories", () => {
    it("should return main categories sorted by frequency", () => {
      const mockReceipt: Receipt = {
        id: 1,
        date: new Date(),
        storeName: "Test Store",
        totalAmount: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: "1",
            name: "Item 1",
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100,
            category: "食費",
          },
          {
            id: "2",
            name: "Item 2",
            quantity: 1,
            unitPrice: 200,
            totalPrice: 200,
            category: "食費",
          },
          {
            id: "3",
            name: "Item 3",
            quantity: 1,
            unitPrice: 300,
            totalPrice: 300,
            category: "日用品",
          },
          {
            id: "4",
            name: "Item 4",
            quantity: 1,
            unitPrice: 400,
            totalPrice: 400,
            category: "交通費",
          },
          {
            id: "5",
            name: "Item 5",
            quantity: 1,
            unitPrice: 500,
            totalPrice: 500,
            category: "食費",
          },
        ],
      };

      const result = getMainCategories(mockReceipt);
      expect(result).toEqual(["食費", "日用品", "交通費"]);
    });

    it("should handle receipts with no categories", () => {
      const mockReceipt: Receipt = {
        id: 1,
        date: new Date(),
        storeName: "Test Store",
        totalAmount: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: "1",
            name: "Item 1",
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100,
          },
          {
            id: "2",
            name: "Item 2",
            quantity: 1,
            unitPrice: 200,
            totalPrice: 200,
          },
        ],
      };

      const result = getMainCategories(mockReceipt);
      expect(result).toEqual([]);
    });

    it("should limit to maximum 3 categories", () => {
      const mockReceipt: Receipt = {
        id: 1,
        date: new Date(),
        storeName: "Test Store",
        totalAmount: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: "1",
            name: "Item 1",
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100,
            category: "食費",
          },
          {
            id: "2",
            name: "Item 2",
            quantity: 1,
            unitPrice: 200,
            totalPrice: 200,
            category: "日用品",
          },
          {
            id: "3",
            name: "Item 3",
            quantity: 1,
            unitPrice: 300,
            totalPrice: 300,
            category: "交通費",
          },
          {
            id: "4",
            name: "Item 4",
            quantity: 1,
            unitPrice: 400,
            totalPrice: 400,
            category: "娯楽",
          },
          {
            id: "5",
            name: "Item 5",
            quantity: 1,
            unitPrice: 500,
            totalPrice: 500,
            category: "医療費",
          },
        ],
      };

      const result = getMainCategories(mockReceipt);
      expect(result).toHaveLength(3);
    });
  });

  // Note: Database-dependent functions (getMonthlyTotal, getDailyTotal, getRecentReceipts)
  // are not tested here as they require database mocking
  // Integration tests should cover database operations
});
