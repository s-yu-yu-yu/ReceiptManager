export interface Receipt {
  id?: number;
  store: string;
  amount: number;
  date: string; // YYYY-MM-DD形式
  category: string;
  items: ReceiptItem[];
  imageUrl?: string;
  memo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReceiptItem {
  id?: number;
  receiptId?: number;
  name: string;
  price: number;
  quantity: number;
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