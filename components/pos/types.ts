export interface ProductItem {
  id: string;
  name: string;
  category: "espresso" | "tea" | "frappe" | "pastries";
  price: number;
  customizable: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  basePrice: number;
  qty: number;
  size?: string;
  sweetness?: string;
  ice?: string;
}

export interface ShiftState {
  isOpen: boolean;
  cashierName: string;
  startedAt: string;
  businessDate: string;
  shiftNumber: number;
  floatUSD: number;
  floatKHR: number;
  totalCashSalesUSD: number;
  totalQRSalesUSD: number;
  orderCount: number;
  ordersCompleted: CompletedOrderRecord[];
}

export interface CompletedOrderRecord {
  id: string;
  ticketNumber: string;
  timestamp: string;
  items: { name: string; qty: number; total: number; customization: string }[];
  subtotal: number;
  tax: number;
  total: number;
  totalReceivedUSD: number;
  receivedUSD: string;
  receivedKHR: string;
  changeUSD: number;
  changeKHR: number;
  usdGiven: number;
  rielGiven: number;
  paymentMethod: string;
  channel: string;
  status: "Preparing" | "Ready" | "Completed";
}

export interface HeldOrder {
  id: string;
  tag: string;
  cart: CartItem[];
  savedAt: string;
}

export interface StaffUser {
  id: string;
  name: string;
  role: "Cashier" | "Barista" | "Supervisor" | "Manager";
  pin: string;
  avatarBg: string;
  avatarText: string;
}

export const KHR_RATE = 4000;

export const USD_DENOMS = [100, 50, 20, 10, 5, 2, 1];
export const KHR_DENOMS = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 100];

export const STAFF_LIST: StaffUser[] = [
  { id: "staff-1", name: "Dara", role: "Cashier", pin: "1234", avatarBg: "bg-emerald-600", avatarText: "DA" },
  { id: "staff-2", name: "Sophea", role: "Barista", pin: "2222", avatarBg: "bg-amber-600", avatarText: "SO" },
  { id: "staff-3", name: "Pisey", role: "Barista", pin: "3333", avatarBg: "bg-teal-600", avatarText: "PI" },
  { id: "staff-4", name: "Channary", role: "Supervisor", pin: "8888", avatarBg: "bg-indigo-600", avatarText: "CH" },
  { id: "staff-5", name: "Vannak", role: "Manager", pin: "9999", avatarBg: "bg-purple-600", avatarText: "VA" },
];

export const PRODUCTS: ProductItem[] = [
  { id: "p1", name: "Espresso", category: "espresso", price: 2.25, customizable: true },
  { id: "p2", name: "Americano", category: "espresso", price: 2.75, customizable: true },
  { id: "p3", name: "Cappuccino", category: "espresso", price: 3.50, customizable: true },
  { id: "p4", name: "Vanilla Latte", category: "espresso", price: 4.00, customizable: true },
  { id: "p5", name: "Caramel Macchiato", category: "espresso", price: 4.25, customizable: true },
  { id: "p6", name: "Mocha", category: "espresso", price: 4.25, customizable: true },
  { id: "p7", name: "Spanish Latte", category: "espresso", price: 4.50, customizable: true },
  { id: "p8", name: "Cold Brew", category: "espresso", price: 3.75, customizable: true },
  { id: "p9", name: "Flat White", category: "espresso", price: 3.75, customizable: true },
  { id: "p10", name: "Green Tea Latte", category: "tea", price: 3.75, customizable: true },
  { id: "p11", name: "Matcha Latte", category: "tea", price: 4.25, customizable: true },
  { id: "p12", name: "Lemon Iced Tea", category: "tea", price: 3.00, customizable: true },
  { id: "p13", name: "Earl Grey Tea", category: "tea", price: 2.75, customizable: false },
  { id: "p14", name: "Jasmine Blossom", category: "tea", price: 2.75, customizable: false },
  { id: "p15", name: "Coffee Frappe", category: "frappe", price: 4.50, customizable: true },
  { id: "p16", name: "Mocha Frappe", category: "frappe", price: 4.75, customizable: true },
  { id: "p17", name: "Caramel Frappe", category: "frappe", price: 4.75, customizable: true },
  { id: "p18", name: "Matcha Frappe", category: "frappe", price: 4.75, customizable: true },
  { id: "p19", name: "Butter Croissant", category: "pastries", price: 2.50, customizable: false },
  { id: "p20", name: "Pain au Chocolat", category: "pastries", price: 3.00, customizable: false },
  { id: "p21", name: "Almond Croissant", category: "pastries", price: 3.50, customizable: false },
  { id: "p22", name: "Blueberry Muffin", category: "pastries", price: 2.75, customizable: false },
  { id: "p23", name: "Cheesecake Slice", category: "pastries", price: 4.00, customizable: false },
  { id: "p24", name: "Chocolate Brownie", category: "pastries", price: 3.00, customizable: false },
];

export const formatUSD = (val: number) => `$${val.toFixed(2)}`;
export const formatKHR = (usdVal: number) => `${Math.round(usdVal * KHR_RATE).toLocaleString("en-US")} ៛`;
export const formatKHRDirect = (khrVal: number) => `${Math.round(khrVal).toLocaleString("en-US")} ៛`;

export type CartAction =
  | { type: "ADD_ITEM"; product: ProductItem }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "UPDATE_QTY"; id: string; qty: number }
  | { type: "UPDATE_CUSTOMIZATION"; id: string; size?: "Regular" | "Large"; sweetness?: "0%" | "25%" | "50%" | "100%"; ice?: "No Ice" | "Less Ice" | "Normal" }
  | { type: "SET_CART"; items: CartItem[] }
  | { type: "CLEAR" };

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.find(
        (i) => i.productId === action.product.id && i.size === "Regular" && i.sweetness === "100%" && i.ice === "Normal"
      );
      if (existing) {
        return state.map((i) => (i.id === existing.id ? { ...i, qty: i.qty + 1 } : i));
      }
      const newItem: CartItem = {
        id: `${action.product.id}-${Date.now()}`,
        productId: action.product.id,
        name: action.product.name,
        basePrice: action.product.price,
        qty: 1,
        size: "Regular",
        sweetness: "100%",
        ice: "Normal",
      };
      return [...state, newItem];
    }
    case "REMOVE_ITEM":
      return state.filter((i) => i.id !== action.id);
    case "UPDATE_QTY":
      if (action.qty <= 0) return state.filter((i) => i.id !== action.id);
      return state.map((i) => (i.id === action.id ? { ...i, qty: action.qty } : i));
    case "UPDATE_CUSTOMIZATION":
      return state.map((i) => {
        if (i.id !== action.id) return i;
        return {
          ...i,
          size: action.size !== undefined ? action.size : i.size,
          sweetness: action.sweetness !== undefined ? action.sweetness : i.sweetness,
          ice: action.ice !== undefined ? action.ice : i.ice,
        };
      });
    case "SET_CART":
      return action.items;
    case "CLEAR":
      return [];
    default:
      return state;
  }
}
