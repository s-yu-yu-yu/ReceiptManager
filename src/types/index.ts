export interface Receipt {
  id?: string;
  date: Date;
  storeName: string;
  items: ReceiptItem[];
  totalAmount: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

export interface Category {
  id?: number;
  name: string;
  icon?: string;
  color?: string;
  order: number;
}

export interface MonthlyBudget {
  id?: number;
  yearMonth: string; // YYYY-MM形式
  categoryId: number;
  amount: number;
}

export interface Settings {
  id?: number;
  key: string;
  value: string | number | boolean | object;
}
