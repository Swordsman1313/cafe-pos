"use client";

import React, { useState, useReducer, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Coffee,
  Leaf,
  Snowflake,
  Cookie,
  LayoutGrid,
  Search,
  ClipboardList,
  ShoppingCart,
  CheckCircle2,
  Banknote,
  QrCode,
  AlertCircle,
  Trash2,
  Tag,
  Send,
  PauseCircle,
  Hash,
  ArrowRight,
  Store,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Delete,
  Printer,
  Settings,
  Users,
  Grid3X3,
  UserCheck,
  DollarSign,
} from "lucide-react";
import { soundFX } from "@/lib/sound";
import { offlineStorage } from "@/lib/offline-sync";

/* ------------------------------------------------------------------ */
/*  Types & Interfaces                                                */
/* ------------------------------------------------------------------ */

interface ProductItem {
  id: string;
  name: string;
  category: "espresso" | "tea" | "frappe" | "pastries";
  price: number;
  customizable: boolean;
}

interface CartItem {
  cartId: string;
  productId: string;
  name: string;
  category: "espresso" | "tea" | "frappe" | "pastries";
  price: number;
  basePrice: number;
  qty: number;
  size?: string; // "Small" | "Medium" | "Large"
  sweetness?: string; // "0%" | "30%" | "50%" | "70%" | "100%"
  ice?: string; // "No Ice" | "Less Ice" | "Normal Ice" | "Extra Ice"
  notes?: string; // "Hot" | "Iced" | "Warm Up" | "No Warm Up"
}

interface ShiftState {
  cashierName: string;
  openedAt: string;
  businessDate: string;
  shiftNumber: number;
  floatUSD: number;
  floatKHR: number;
  totalCashSalesUSD: number;
  totalQRSalesUSD: number;
  orderCount: number;
  isUnclosed?: boolean;
}

interface CompletedOrderRecord {
  id: string;
  ticketNumber: string;
  timestamp: string;
  items: { name: string; qty: number; unitPrice: number; total: number; modifiers?: string }[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  cashReceivedUSD: number;
  cashReceivedKHR: number;
  totalReceivedUSD: number;
  changeUSD: number;
  changeKHR: number;
  status: "Completed";
  channel: string;
  table?: string;
  customer?: string;
}

interface HeldOrder {
  id: string;
  tag: string;
  cart: CartItem[];
  savedAt: string;
  channel: string;
  table?: string;
  customer?: string;
}

interface StaffUser {
  id: string;
  name: string;
  role: "Cashier" | "Barista" | "Supervisor" | "Manager";
  pin: string;
  avatarBg: string;
  avatarText: string;
}

interface TableItem {
  id: string;
  name: string;
  status: "available" | "occupied" | "reserved";
  currentBillUSD?: number;
  guests: number;
}

interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  points: number;
  tier: "Gold" | "Silver" | "Regular";
}

/* ------------------------------------------------------------------ */
/*  Constants & Currency Helpers                                      */
/* ------------------------------------------------------------------ */

const KHR_RATE = 4100;

const roundKHR = (khr: number): number => {
  return Math.round(khr / 100) * 100;
};

const STAFF_LIST: StaffUser[] = [
  { id: "staff-1", name: "Dara", role: "Cashier", pin: "1234", avatarBg: "bg-emerald-600", avatarText: "DA" },
  { id: "staff-2", name: "Sophea", role: "Barista", pin: "2222", avatarBg: "bg-amber-600", avatarText: "SO" },
  { id: "staff-3", name: "Pisey", role: "Barista", pin: "3333", avatarBg: "bg-teal-600", avatarText: "PI" },
  { id: "staff-4", name: "Channary", role: "Supervisor", pin: "8888", avatarBg: "bg-indigo-600", avatarText: "CH" },
  { id: "staff-5", name: "Vannak", role: "Manager", pin: "9999", avatarBg: "bg-purple-600", avatarText: "VA" },
];

const INITIAL_TABLES: TableItem[] = [
  { id: "t1", name: "Table 01", status: "available", guests: 2 },
  { id: "t2", name: "Table 02", status: "occupied", currentBillUSD: 9.75, guests: 4 },
  { id: "t3", name: "Table 03", status: "available", guests: 2 },
  { id: "t4", name: "Table 04", status: "occupied", currentBillUSD: 14.50, guests: 4 },
  { id: "t5", name: "Table 05", status: "reserved", guests: 6 },
  { id: "t6", name: "Bar 01", status: "available", guests: 1 },
  { id: "t7", name: "Bar 02", status: "available", guests: 1 },
  { id: "t8", name: "Outdoor 01", status: "occupied", currentBillUSD: 6.25, guests: 4 },
];

const INITIAL_CUSTOMERS: CustomerItem[] = [
  { id: "c1", name: "Sokha Mean", phone: "012 345 678", points: 280, tier: "Gold" },
  { id: "c2", name: "Bopha Chan", phone: "089 987 654", points: 140, tier: "Silver" },
  { id: "c3", name: "Rithy Seng", phone: "077 112 233", points: 45, tier: "Regular" },
  { id: "c4", name: "Kosal Vong", phone: "096 445 566", points: 310, tier: "Gold" },
];

// High-density product catalog
const PRODUCTS: ProductItem[] = [
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
  { id: "p19", name: "Butter Croissant", category: "pastries", price: 2.50, customizable: true },
  { id: "p20", name: "Pain au Chocolat", category: "pastries", price: 3.00, customizable: true },
  { id: "p21", name: "Almond Croissant", category: "pastries", price: 3.50, customizable: true },
  { id: "p22", name: "Blueberry Muffin", category: "pastries", price: 2.75, customizable: true },
  { id: "p23", name: "Cheesecake Slice", category: "pastries", price: 4.00, customizable: false },
  { id: "p24", name: "Chocolate Brownie", category: "pastries", price: 3.00, customizable: false },
];

const CATEGORIES = [
  { id: "all", label: "All Items", icon: LayoutGrid },
  { id: "espresso", label: "Coffee", icon: Coffee },
  { id: "tea", label: "Tea", icon: Leaf },
  { id: "frappe", label: "Frappé", icon: Snowflake },
  { id: "pastries", label: "Pastries", icon: Cookie },
] as const;

const CATEGORY_ICON: Record<string, typeof Coffee> = {
  espresso: Coffee,
  tea: Leaf,
  frappe: Snowflake,
  pastries: Cookie,
};

const formatUSD = (val: number) => `$${val.toFixed(2)}`;
const formatKHRDirect = (khrVal: number) => `${Math.round(khrVal).toLocaleString("en-US")} ៛`;

/* ------------------------------------------------------------------ */
/*  Cart Reducer                                                      */
/* ------------------------------------------------------------------ */

type CartAction =
  | { type: "ADD_PRODUCT"; product: ProductItem; cartId?: string }
  | { type: "INCREMENT_QTY"; cartId: string }
  | { type: "UPDATE_QTY"; cartId: string; qty: number }
  | { type: "UPDATE_MODIFIER"; cartId: string; field: "size" | "sweetness" | "ice" | "notes"; value: string }
  | { type: "SET_CART"; items: CartItem[] }
  | { type: "CLEAR" };

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "ADD_PRODUCT": {
      const newCartId = action.cartId || `${action.product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      const newItem: CartItem = {
        cartId: newCartId,
        productId: action.product.id,
        name: action.product.name,
        category: action.product.category,
        basePrice: action.product.price,
        price: action.product.price,
        qty: 1,
        size: undefined,
        sweetness: undefined,
        ice: undefined,
        notes: undefined,
      };
      return [...state, newItem];
    }
    case "INCREMENT_QTY": {
      return state.map((i) => (i.cartId === action.cartId ? { ...i, qty: i.qty + 1 } : i));
    }
    case "UPDATE_QTY": {
      if (action.qty <= 0) {
        return state.filter((i) => i.cartId !== action.cartId);
      }
      return state.map((i) => (i.cartId === action.cartId ? { ...i, qty: action.qty } : i));
    }
    case "UPDATE_MODIFIER": {
      return state.map((item) => {
        if (item.cartId !== action.cartId) return item;
        const nextVal = item[action.field] === action.value ? undefined : action.value;
        const nextItem = { ...item, [action.field]: nextVal };

        // Price adjustments by size
        let sizeExtra = 0;
        if (nextItem.size === "Medium (+$0.30)") sizeExtra = 0.3;
        else if (nextItem.size === "Large (+$0.60)") sizeExtra = 0.6;
        nextItem.price = nextItem.basePrice + sizeExtra;

        return nextItem;
      });
    }
    case "SET_CART":
      return action.items;
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/*  Validation Helpers                                                */
/* ------------------------------------------------------------------ */

function getMissingModifiers(item: CartItem): string[] {
  const product = PRODUCTS.find((p) => p.id === item.productId);
  if (!product || !product.customizable) return [];

  // Conditional: Only beverage categories require Temp, Size, Sugar, Ice
  if (product.category === "espresso" || product.category === "tea" || product.category === "frappe") {
    const missing: string[] = [];
    if (!item.notes) missing.push("Temp");
    if (!item.size) missing.push("Size");
    if (!item.sweetness) missing.push("Sugar");
    if (!item.ice) missing.push("Ice");
    return missing;
  }
  return [];
}

function validateCartForCheckout(cart: CartItem[]): {
  valid: boolean;
  errorItem?: CartItem;
  missing?: string[];
} {
  if (cart.length === 0) return { valid: false };

  for (const item of cart) {
    const missing = getMissingModifiers(item);
    if (missing.length > 0) {
      return { valid: false, errorItem: item, missing };
    }
  }
  return { valid: true };
}

/* ------------------------------------------------------------------ */
/*  Main POS Register Page Component                                  */
/* ------------------------------------------------------------------ */

export default function PosRegisterPage() {
  const [activeNav, setActiveNav] = useState<"register" | "orders" | "tables" | "customers">("register");
  const [currentStaff, setCurrentStaff] = useState<StaffUser>(STAFF_LIST[0]);

  // Real-time live digital clock (HH:mm:ss A)
  const [currentTime, setCurrentTime] = useState<string>("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Shift State & Unclosed Shift Date Tracker
  const [shift, setShift] = useState<ShiftState>(() => {
    const openedDate = new Date();
    return {
      cashierName: "Dara",
      openedAt: openedDate.toISOString(),
      businessDate: openedDate.toISOString().split("T")[0],
      shiftNumber: 1,
      floatUSD: 100,
      floatKHR: 200000,
      totalCashSalesUSD: 0,
      totalQRSalesUSD: 0,
      orderCount: 0,
      isUnclosed: false,
    };
  });

  const shiftAlertInfo = useMemo(() => {
    if (!shift?.openedAt) return null;
    const opened = new Date(shift.openedAt);
    const today = new Date();
    const isSameDay =
      opened.getFullYear() === today.getFullYear() &&
      opened.getMonth() === today.getMonth() &&
      opened.getDate() === today.getDate();

    const formattedOpenDate = opened.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

    return {
      isUnclosedPriorDay: !isSameDay || shift.isUnclosed,
      shiftDateLabel: formattedOpenDate,
      shiftTime: opened.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  }, [shift]);

  // Cart State with Local Persistence
  const [cart, dispatch] = useReducer(cartReducer, [], () => {
    if (typeof window !== "undefined") {
      const saved = offlineStorage.loadCart<CartItem[]>();
      if (saved && Array.isArray(saved)) return saved;
    }
    return [];
  });

  const [activeCartId, setActiveCartId] = useState<string | null>(null);

  useEffect(() => {
    offlineStorage.saveCart(cart);
  }, [cart]);

  // Quantity Long-Press (Hold 400ms) vs Direct Tap (+1)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef<boolean>(false);

  const handleQtyTouchStart = (item: CartItem) => {
    isLongPressRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      soundFX.playBlip(850);
      setActiveCartId(item.cartId);
      setQtyInput(String(item.qty));
      setShowQtyModal(true);
    }, 400);
  };

  const handleQtyTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleQtyClick = (e: React.MouseEvent, item: CartItem) => {
    e.stopPropagation();
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    // Direct Tap: Immediately increments quantity by +1 (qty + 1)
    soundFX.playBlip(880);
    dispatch({ type: "UPDATE_QTY", cartId: item.cartId, qty: item.qty + 1 });
  };

  // Active cart item
  const activeItem = useMemo(() => {
    if (!activeCartId) return cart[cart.length - 1] || null;
    return cart.find((i) => i.cartId === activeCartId) || cart[cart.length - 1] || null;
  }, [cart, activeCartId]);

  // Order Details
  const [ticketNumber, setTicketNumber] = useState<string>(() => `T-${Math.floor(100 + Math.random() * 900)}`);
  const [orderChannel, setOrderChannel] = useState<"Walk-in" | "Takeaway" | "Delivery">("Walk-in");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [discountUSD, setDiscountUSD] = useState<number>(0);

  // Search & Category
  const [query, setQuery] = useState<string>("");
  const [category, setCategory] = useState<string>("all");
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Validation Toast
  const [validationToast, setValidationToast] = useState<{
    itemName: string;
    missingText: string;
  } | null>(null);

  const [generalToast, setGeneralToast] = useState<{
    title: string;
    message: string;
    type?: "success" | "info" | "warning";
  } | null>(null);

  const showNotification = useCallback((title: string, message: string, type: "success" | "info" | "warning" = "success") => {
    setGeneralToast({ title, message, type });
    setTimeout(() => setGeneralToast(null), 3000);
  }, []);

  // Offline Detection & Sync
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      setOfflineQueueCount(offlineStorage.getOfflineQueue().length);

      const handleOnline = () => {
        setIsOnline(true);
        const queue = offlineStorage.getOfflineQueue();
        if (queue.length > 0) {
          showNotification("Online Restored", `Auto-synced ${queue.length} offline orders!`, "success");
          soundFX.playSuccess();
          offlineStorage.clearOfflineQueue();
          setOfflineQueueCount(0);
        }
      };

      const handleOffline = () => {
        setIsOnline(false);
        showNotification("Offline Mode", "Orders queue locally until reconnected.", "warning");
        soundFX.playWarning();
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [showNotification]);

  // Held Orders & Completed History
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => {
    if (typeof window !== "undefined") {
      return offlineStorage.loadHeldOrders<HeldOrder[]>() || [];
    }
    return [];
  });

  const [completedOrders, setCompletedOrders] = useState<CompletedOrderRecord[]>(() => {
    if (typeof window !== "undefined") {
      return offlineStorage.loadCompletedOrders<CompletedOrderRecord[]>() || [];
    }
    return [];
  });

  useEffect(() => {
    offlineStorage.saveHeldOrders(heldOrders);
  }, [heldOrders]);

  useEffect(() => {
    offlineStorage.saveCompletedOrders(completedOrders);
  }, [completedOrders]);

  // Modals
  const [showCashModal, setShowCashModal] = useState<boolean>(false);
  const [showKHQRModal, setShowKHQRModal] = useState<boolean>(false);
  const [showQtyModal, setShowQtyModal] = useState<boolean>(false);
  const [showPromoModal, setShowPromoModal] = useState<boolean>(false);
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [showOperationsModal, setShowOperationsModal] = useState<boolean>(false);
  const [showCashierModal, setShowCashierModal] = useState<boolean>(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<CompletedOrderRecord | null>(null);

  // Cash Modal State
  const [activeCashField, setActiveCashField] = useState<"USD" | "KHR">("KHR");
  const [cashInputUSD, setCashInputUSD] = useState<string>("");
  const [cashInputKHR, setCashInputKHR] = useState<string>("");
  const [changeFormat, setChangeFormat] = useState<"ALL_KHR" | "SPLIT_USD_KHR">("ALL_KHR");
  const [customUSDChange, setCustomUSDChange] = useState<number | null>(null);

  // Receipt Modal Change Calculator State
  const [receiptChangeMode, setReceiptChangeMode] = useState<"ALL_KHR" | "SPLIT_USD_KHR">("ALL_KHR");
  const [receiptUSDInput, setReceiptUSDInput] = useState<string>("");

  // Qty Numpad State
  const [qtyInput, setQtyInput] = useState<string>("");

  // KHQR Countdown
  const [khqrTimer, setKhqrTimer] = useState<number>(120);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showKHQRModal && khqrTimer > 0) {
      timer = setInterval(() => {
        setKhqrTimer((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showKHQRModal, khqrTimer]);

  // Financial Calculations
  const rawSubtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const discountedSubtotal = useMemo(() => Math.max(0, rawSubtotal - discountUSD), [rawSubtotal, discountUSD]);
  const tax = useMemo(() => discountedSubtotal * 0.1, [discountedSubtotal]);
  const totalUSD = useMemo(() => discountedSubtotal + tax, [discountedSubtotal, tax]);
  const totalKHR = useMemo(() => roundKHR(totalUSD * KHR_RATE), [totalUSD]);

  // Dual Currency Calculations
  const totalReceivedUSD = useMemo(() => {
    const usd = parseFloat(cashInputUSD) || 0;
    const khr = parseFloat(cashInputKHR) || 0;
    return usd + khr / KHR_RATE;
  }, [cashInputUSD, cashInputKHR]);

  const remainingUSD = useMemo(() => Math.max(0, totalUSD - totalReceivedUSD), [totalUSD, totalReceivedUSD]);
  const changeDueUSD = useMemo(() => Math.max(0, totalReceivedUSD - totalUSD), [totalReceivedUSD, totalUSD]);
  const changeDueKHR = useMemo(() => roundKHR(changeDueUSD * KHR_RATE), [changeDueUSD]);
  const isCashSufficient = useMemo(() => totalReceivedUSD >= totalUSD - 0.001 && totalUSD > 0, [totalReceivedUSD, totalUSD]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchCat = category === "all" || p.category === category;
      const matchQ = !query || p.name.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQ;
    });
  }, [category, query]);

  const scrollCategories = (dir: "left" | "right") => {
    soundFX.playBlip(950);
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: dir === "left" ? -180 : 180,
        behavior: "smooth",
      });
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Card Tap Handler (Add or Increment Qty + Focus)                   */
  /* ------------------------------------------------------------------ */

  const handleProductCardClick = (product: ProductItem) => {
    soundFX.playBlip(880);
    if (activeItem && activeItem.productId === product.id) {
      dispatch({ type: "INCREMENT_QTY", cartId: activeItem.cartId });
      setActiveCartId(activeItem.cartId);
    } else {
      const newCartId = `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      dispatch({ type: "ADD_PRODUCT", product, cartId: newCartId });
      setActiveCartId(newCartId);
    }
  };

  const handleSelectModifierChip = (field: "size" | "sweetness" | "ice" | "notes", value: string) => {
    if (!activeItem) return;
    soundFX.playBlip(920);
    dispatch({ type: "UPDATE_MODIFIER", cartId: activeItem.cartId, field, value });

    if (validationToast && validationToast.itemName === activeItem.name) {
      setValidationToast(null);
    }
  };

  const handleInitiatePayment = (method: "CASH" | "PAYMENT" | "KITCHEN") => {
    if (cart.length === 0) {
      soundFX.playWarning();
      showNotification("Cart is Empty", "Add items from the menu before checkout.", "warning");
      return;
    }

    const validation = validateCartForCheckout(cart);
    if (!validation.valid && validation.errorItem) {
      soundFX.playWarning();
      setActiveCartId(validation.errorItem.cartId);
      const missingStr = validation.missing?.join(", ") || "Required condiments";
      setValidationToast({
        itemName: validation.errorItem.name,
        missingText: missingStr,
      });
      return;
    }

    setValidationToast(null);

    if (method === "CASH") {
      setCashInputUSD("");
      setCashInputKHR("");
      setActiveCashField("KHR");
      setShowCashModal(true);
      soundFX.playBlip(780);
    } else if (method === "PAYMENT") {
      setKhqrTimer(120);
      setShowKHQRModal(true);
      soundFX.playBlip(780);
    } else if (method === "KITCHEN") {
      soundFX.playKitchen();
      showNotification("Sent to Kitchen ☕", `Order #${ticketNumber} dispatched to Barista station.`, "info");
    }
  };

  const handleCompleteSale = (method: "CASH" | "BAKONG KHQR" | "CREDIT CARD") => {
    soundFX.playSuccess();

    const record: CompletedOrderRecord = {
      id: `ord-${Date.now()}`,
      ticketNumber,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      items: cart.map((i) => ({
        name: i.name,
        qty: i.qty,
        unitPrice: i.price,
        total: i.price * i.qty,
        modifiers: [i.notes, i.size, i.sweetness ? `${i.sweetness} Sugar` : "", i.ice ? `${i.ice}` : ""].filter(Boolean).join(" · "),
      })),
      subtotal: rawSubtotal,
      tax,
      total: totalUSD,
      paymentMethod: method,
      cashReceivedUSD: parseFloat(cashInputUSD) || (method === "CASH" ? totalUSD : 0),
      cashReceivedKHR: parseFloat(cashInputKHR) || 0,
      totalReceivedUSD: method === "CASH" ? totalReceivedUSD : totalUSD,
      changeUSD: method === "CASH" ? changeDueUSD : 0,
      changeKHR: method === "CASH" ? changeDueKHR : 0,
      status: "Completed",
      channel: orderChannel,
      table: selectedTable || undefined,
      customer: selectedCustomer?.name || undefined,
    };

    setCompletedOrders((prev) => [record, ...prev]);
    setLastCompletedSale(record);

    if (!isOnline) {
      offlineStorage.queueOfflineOrder({
        id: record.id,
        ticketNumber: record.ticketNumber,
        timestamp: record.timestamp,
        items: record.items,
        subtotal: record.subtotal,
        tax: record.tax,
        total: record.total,
        paymentMethod: record.paymentMethod,
        channel: record.channel,
        synced: false,
      });
      setOfflineQueueCount((prev) => prev + 1);
    }

    if (shift) {
      setShift((prev) => ({
        ...prev,
        orderCount: prev.orderCount + 1,
        totalCashSalesUSD: method === "CASH" ? prev.totalCashSalesUSD + totalUSD : prev.totalCashSalesUSD,
        totalQRSalesUSD: method !== "CASH" ? prev.totalQRSalesUSD + totalUSD : prev.totalQRSalesUSD,
      }));
    }

    setShowCashModal(false);
    setShowKHQRModal(false);
    dispatch({ type: "CLEAR" });
    setDiscountUSD(0);
    setSelectedTable(null);
    setSelectedCustomer(null);
    setReceiptChangeMode("ALL_KHR");
    setReceiptUSDInput("");
    setTicketNumber(`T-${Math.floor(100 + Math.random() * 900)}`);
    setShowReceiptModal(true);
  };

  const handleHoldCurrentOrder = () => {
    if (cart.length === 0) return;
    soundFX.playBlip(700);
    const newHeld: HeldOrder = {
      id: `hold-${Date.now()}`,
      tag: `Ticket ${ticketNumber} (${orderChannel}${selectedTable ? ` · ${selectedTable}` : ""})`,
      cart: [...cart],
      savedAt: new Date().toISOString(),
      channel: orderChannel,
      table: selectedTable || undefined,
      customer: selectedCustomer?.name || undefined,
    };
    setHeldOrders((prev) => [newHeld, ...prev]);
    dispatch({ type: "CLEAR" });
    setDiscountUSD(0);
    setSelectedTable(null);
    setTicketNumber(`T-${Math.floor(100 + Math.random() * 900)}`);
    showNotification("Order Held ⏸️", `Order parked in held drawer.`, "info");
  };

  const handleResumeHeldOrder = (held: HeldOrder) => {
    soundFX.playBlip(800);
    dispatch({ type: "SET_CART", items: held.cart });
    setOrderChannel(held.channel as "Walk-in" | "Takeaway" | "Delivery");
    if (held.table) setSelectedTable(held.table);
    setHeldOrders((prev) => prev.filter((o) => o.id !== held.id));
    setShowHeldOrdersModal(false);
    setActiveNav("register");
    showNotification("Order Resumed ▶️", `Restored ${held.cart.length} items to billing.`, "success");
  };

  const handleDiscardHeldOrder = (id: string) => {
    soundFX.playBlip(600);
    setHeldOrders((prev) => prev.filter((o) => o.id !== id));
  };

  // Category-Aware Modifier Determination
  const activeIsBeverage = activeItem && (activeItem.category === "espresso" || activeItem.category === "tea" || activeItem.category === "frappe");
  const activeIsPastry = activeItem && activeItem.category === "pastries";

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden font-sans antialiased select-none" style={{ background: "#FDFBF9" }}>
      {/* ── Top Bar: Real-Time Clock & Shift Tracker ── */}
      <header className="shrink-0 h-12 px-5 border-b border-stone-200/80 bg-white/80 backdrop-blur-md flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div
            className="flex h-7.5 w-7.5 items-center justify-center rounded-xl text-white font-black text-xs shadow-sm"
            style={{ background: "#4A2E1F" }}
          >
            K
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-black text-stone-900 tracking-tight">Artisan Roast</h1>
            <div className="h-3.5 w-px bg-stone-200" />
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
              <Clock size={11} className="text-stone-500" />
              <span>{currentTime || "00:00:00 AM"}</span>
            </div>
          </div>
        </div>

        {/* Center: Shift Business Date Alert */}
        <div className="flex items-center gap-2">
          {shiftAlertInfo?.isUnclosedPriorDay ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-300 text-rose-800 text-xs font-black animate-pulse">
              <AlertTriangle size={13} className="text-rose-600 shrink-0" />
              <span>Shift #{shift.shiftNumber} ({shiftAlertInfo.shiftDateLabel} - Unclosed ⚠️)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
              <span>Shift #{shift.shiftNumber} · Opened {shiftAlertInfo?.shiftDateLabel} ({shiftAlertInfo?.shiftTime})</span>
            </div>
          )}

          {selectedTable && (
            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 text-[11px] font-black border border-stone-200">
              Table: {selectedTable}
            </span>
          )}
          {selectedCustomer && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-black border border-emerald-200">
              Customer: {selectedCustomer.name}
            </span>
          )}
        </div>

        {/* Right: Online Indicator & Operations */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
              isOnline ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-900 border-amber-300 animate-pulse"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span>{isOnline ? "Online" : `Offline (${offlineQueueCount})`}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowOperationsModal(true)}
            className="flex items-center gap-1 text-[11px] font-black text-stone-700 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
          >
            <Settings size={12} />
            <span>Operations</span>
          </button>
        </div>
      </header>

      {/* ── Main Split: Left Workspace + Right Full-Height Cart ──────── */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        {/* ── LEFT WORKSPACE (Catalog + Modifier Drawer + Bottom Nav strictly confined to left!) ── */}
        <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden border-r border-stone-200/80">
          {/* Main Catalog View / Active Tab Content */}
          <main className="flex min-w-0 flex-1 flex-col overflow-hidden" style={{ background: "#FDFBF9" }}>
            {activeNav === "register" && (
              <>
                {/* Category Pills & Quick Search */}
                <div className="shrink-0 px-5 pt-2 pb-1.5 border-b border-stone-200/60 bg-white/60 backdrop-blur-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => scrollCategories("left")}
                      className="h-7.5 w-7.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={13} />
                    </button>

                    <div ref={categoryScrollRef} className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1">
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              soundFX.playBlip(900);
                              setCategory(cat.id);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-xs transition-all border shrink-0 cursor-pointer ${
                              isActive
                                ? "text-white shadow-xs border-transparent"
                                : "bg-white text-stone-600 border-stone-200/80 hover:border-stone-400 hover:bg-stone-50"
                            }`}
                            style={isActive ? { background: "#4A2E1F" } : {}}
                          >
                            <Icon size={12} />
                            <span>{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => scrollCategories("right")}
                      className="h-7.5 w-7.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>

                  <div className="relative w-44 shrink-0">
                    <Search size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search menu..."
                      className="h-7.5 w-full rounded-xl bg-stone-100/90 pl-8 pr-6 text-xs font-medium text-stone-800 outline-none transition-all placeholder:text-stone-400 focus:bg-white focus:ring-1 focus:ring-stone-800"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-[9px]"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* ── High-Density Product Grid: Compact Horizontal Tiles ── */}
                <div className="flex-1 overflow-y-auto px-5 py-2 min-h-0">
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                    {filteredProducts.map((product) => {
                      const ProductIcon = CATEGORY_ICON[product.category] || Coffee;

                      return (
                        <div
                          key={product.id}
                          onClick={() => handleProductCardClick(product)}
                          className="group rounded-2xl border border-stone-200/90 bg-white hover:border-stone-400 hover:shadow-xs p-2 flex items-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer shadow-2xs"
                        >
                          {/* Square Thumbnail on Left */}
                          <div
                            className="h-11 w-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                            style={{
                              background:
                                product.category === "espresso"
                                  ? "linear-gradient(135deg, #784A30, #4A2E1F)"
                                  : product.category === "tea"
                                  ? "linear-gradient(135deg, #447755, #254733)"
                                  : product.category === "frappe"
                                  ? "linear-gradient(135deg, #4A7A9E, #234E6F)"
                                  : "linear-gradient(135deg, #C28B5E, #8C5933)",
                            }}
                          >
                            <ProductIcon size={18} />
                          </div>

                          {/* Title & Dual Price on Right */}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-black text-xs text-stone-900 leading-tight truncate group-hover:text-amber-950">
                              {product.name}
                            </h3>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span className="text-xs font-black text-stone-900">{formatUSD(product.price)}</span>
                              <span className="text-[10px] font-bold text-stone-400">
                                {formatKHRDirect(roundKHR(product.price * KHR_RATE))}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Orders / History Tab */}
            {activeNav === "orders" && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div>
                    <h2 className="text-base font-black text-stone-900">Completed Orders History</h2>
                    <p className="text-xs text-stone-400">Synced cloud and offline sales records</p>
                  </div>
                  <span className="text-xs font-black text-stone-700 bg-stone-100 px-3 py-1 rounded-full">
                    {completedOrders.length} Orders
                  </span>
                </div>

                {completedOrders.length === 0 ? (
                  <div className="py-20 text-center text-stone-400 text-xs">No orders completed today yet.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {completedOrders.map((ord) => (
                      <div key={ord.id} className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-xs text-stone-900">Ticket #{ord.ticketNumber}</span>
                          <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {formatUSD(ord.total)} ({formatKHRDirect(roundKHR(ord.total * KHR_RATE))})
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 line-clamp-2">
                          {ord.items.map((i) => `${i.qty}x ${i.name} (${i.modifiers || "Regular"})`).join(", ")}
                        </p>
                        <div className="flex justify-between text-[10px] text-stone-400 pt-1.5 border-t border-stone-100">
                          <span>{ord.timestamp} · {ord.channel}</span>
                          <span className="font-black uppercase text-stone-800">{ord.paymentMethod}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tables Seating Tab */}
            {activeNav === "tables" && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div>
                    <h2 className="text-base font-black text-stone-900">Dine-In Table Seating Floor Plan</h2>
                    <p className="text-xs text-stone-400">Assign table to current ticket</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {INITIAL_TABLES.map((tbl) => (
                    <button
                      key={tbl.id}
                      type="button"
                      onClick={() => {
                        soundFX.playBlip();
                        setSelectedTable(tbl.name);
                        setActiveNav("register");
                        showNotification("Table Assigned", `Ticket assigned to ${tbl.name}`, "info");
                      }}
                      className={`p-4 rounded-3xl border-2 text-left transition-all cursor-pointer ${
                        selectedTable === tbl.name
                          ? "border-[#4A2E1F] bg-amber-50"
                          : tbl.status === "occupied"
                          ? "border-amber-300 bg-amber-50/40"
                          : tbl.status === "reserved"
                          ? "border-indigo-200 bg-indigo-50/40"
                          : "border-stone-200 bg-white hover:border-stone-400"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-black text-sm text-stone-900">{tbl.name}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            tbl.status === "occupied"
                              ? "bg-amber-100 text-amber-800"
                              : tbl.status === "reserved"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {tbl.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-2">{tbl.guests} Guests</p>
                      {tbl.currentBillUSD && (
                        <p className="text-xs font-black text-amber-900 mt-1">Bill: {formatUSD(tbl.currentBillUSD)}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Customers Loyalty Tab */}
            {activeNav === "customers" && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div>
                    <h2 className="text-base font-black text-stone-900">Customer Loyalty &amp; CRM</h2>
                    <p className="text-xs text-stone-400">Select customer profile</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {INITIAL_CUSTOMERS.map((cust) => (
                    <div key={cust.id} className="p-4 rounded-3xl bg-white border border-stone-200 shadow-2xs flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-stone-900">{cust.name}</span>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900">{cust.tier}</span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">{cust.phone}</p>
                        <p className="text-xs font-bold text-emerald-700 mt-1">⭐ {cust.points} Points Available</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playSuccess();
                          setSelectedCustomer(cust);
                          setActiveNav("register");
                          showNotification("Customer Attached", `${cust.name} attached`, "success");
                        }}
                        className="px-3 py-2 rounded-xl text-white font-black text-xs shadow-xs"
                        style={{ background: "#4A2E1F" }}
                      >
                        Attach
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* ── 2. Compact Multi-Row Modifier Panel with UNIFORM EQUAL BUTTON SIZES (5-Column Grid) ── */}
          {activeNav === "register" && activeItem && (activeIsBeverage || activeIsPastry) && (
            <div className="shrink-0 border-t border-stone-200/90 bg-white/95 backdrop-blur-md px-5 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-20">
              {/* Multi-Row Grid Stack with SHORTER, COMPACT BUTTON SIZES (grid-cols-5 max-w-xl) */}
              {activeIsBeverage ? (
                <div className="flex flex-col gap-1.5">
                  {/* Row 1 — Temp */}
                  <div className="flex items-center gap-2">
                    <span className="w-14 shrink-0 text-[11px] font-bold text-stone-500 uppercase tracking-tight">Temp:</span>
                    <div className="grid grid-cols-5 gap-1.5 w-full max-w-xl">
                      {["Hot", "Iced"].map((temp) => {
                        const isSel = activeItem.notes === temp;
                        return (
                          <button
                            key={temp}
                            type="button"
                            onClick={() => handleSelectModifierChip("notes", temp)}
                            className={`h-8 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center px-2 truncate ${
                              isSel ? "text-white shadow-2xs border-transparent" : "bg-stone-50 border-stone-200/90 text-stone-700 hover:bg-stone-100"
                            }`}
                            style={isSel ? { background: "#4A2E1F" } : {}}
                          >
                            {temp}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 2 — Size */}
                  <div className="flex items-center gap-2">
                    <span className="w-14 shrink-0 text-[11px] font-bold text-stone-500 uppercase tracking-tight">Size:</span>
                    <div className="grid grid-cols-5 gap-1.5 w-full max-w-xl">
                      {[
                        { val: "Small ($0.00)", label: "Small ($0.00)" },
                        { val: "Medium (+$0.30)", label: "Medium (+$0.30)" },
                        { val: "Large (+$0.60)", label: "Large (+$0.60)" },
                      ].map((s) => {
                        const isSel = activeItem.size === s.val;
                        return (
                          <button
                            key={s.val}
                            type="button"
                            onClick={() => handleSelectModifierChip("size", s.val)}
                            className={`h-8 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center px-1.5 truncate ${
                              isSel ? "text-white shadow-2xs border-transparent" : "bg-stone-50 border-stone-200/90 text-stone-700 hover:bg-stone-100"
                            }`}
                            style={isSel ? { background: "#4A2E1F" } : {}}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 3 — Sugar */}
                  <div className="flex items-center gap-2">
                    <span className="w-14 shrink-0 text-[11px] font-bold text-stone-500 uppercase tracking-tight">Sugar:</span>
                    <div className="grid grid-cols-5 gap-1.5 w-full max-w-xl">
                      {["0%", "30%", "50%", "70%", "100%"].map((sg) => {
                        const isSel = activeItem.sweetness === sg;
                        return (
                          <button
                            key={sg}
                            type="button"
                            onClick={() => handleSelectModifierChip("sweetness", sg)}
                            className={`h-8 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center px-2 truncate ${
                              isSel ? "text-white shadow-2xs border-transparent" : "bg-stone-50 border-stone-200/90 text-stone-700 hover:bg-stone-100"
                            }`}
                            style={isSel ? { background: "#4A2E1F" } : {}}
                          >
                            {sg}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 4 — Ice */}
                  <div className="flex items-center gap-2">
                    <span className="w-14 shrink-0 text-[11px] font-bold text-stone-500 uppercase tracking-tight">Ice:</span>
                    <div className="grid grid-cols-5 gap-1.5 w-full max-w-xl">
                      {["No Ice", "Less Ice", "Normal Ice", "Extra Ice"].map((ic) => {
                        const isSel = activeItem.ice === ic;
                        return (
                          <button
                            key={ic}
                            type="button"
                            onClick={() => handleSelectModifierChip("ice", ic)}
                            className={`h-8 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center px-2 truncate ${
                              isSel ? "text-white shadow-2xs border-transparent" : "bg-stone-50 border-stone-200/90 text-stone-700 hover:bg-stone-100"
                            }`}
                            style={isSel ? { background: "#4A2E1F" } : {}}
                          >
                            {ic}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Pastry Food Options */
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-14 shrink-0 text-[11px] font-bold text-stone-500 uppercase tracking-tight">Warm Up:</span>
                    <div className="grid grid-cols-5 gap-1.5 w-full max-w-xl">
                      {["Warm Up", "No Warm Up"].map((w) => {
                        const isSel = activeItem.notes === w;
                        return (
                          <button
                            key={w}
                            type="button"
                            onClick={() => handleSelectModifierChip("notes", w)}
                            className={`h-8 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center px-2 truncate ${
                              isSel ? "text-white shadow-2xs border-transparent" : "bg-stone-50 border-stone-200/90 text-stone-700 hover:bg-stone-100"
                            }`}
                            style={isSel ? { background: "#4A2E1F" } : {}}
                          >
                            {w}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 3. Bottom Navigation Bar (STRICTLY CONFINED TO LEFT WORKSPACE, NEVER UNDER CART!) ── */}
          <nav className="h-12 shrink-0 bg-white/95 backdrop-blur-md border-t border-stone-200 flex items-center justify-around px-3 z-20 select-none">
            <button
              type="button"
              onClick={() => {
                soundFX.playBlip(880);
                setActiveNav("register");
              }}
              className={`flex min-w-[52px] sm:min-w-[60px] h-9.5 flex-col items-center justify-center rounded-xl transition-all cursor-pointer px-2 py-0.5 relative ${
                activeNav === "register" ? "text-[#4A2E1F] font-black" : "text-stone-400 hover:text-stone-700"
              }`}
            >
              <Store size={16} className={activeNav === "register" ? "stroke-[2.5]" : "stroke-[1.8]"} />
              <span className="text-[10px] tracking-tight mt-0.5">Sales</span>
              {activeNav === "register" && (
                <motion.div layoutId="bottomNavDot" className="h-0.5 w-4 rounded-full bg-[#4A2E1F] absolute -bottom-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playBlip(880);
                setActiveNav("orders");
              }}
              className={`flex min-w-[52px] sm:min-w-[60px] h-9.5 flex-col items-center justify-center rounded-xl transition-all cursor-pointer px-2 py-0.5 relative ${
                activeNav === "orders" ? "text-[#4A2E1F] font-black" : "text-stone-400 hover:text-stone-700"
              }`}
            >
              <div className="relative">
                <ClipboardList size={16} className={activeNav === "orders" ? "stroke-[2.5]" : "stroke-[1.8]"} />
                {heldOrders.length > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 h-3 min-w-[12px] px-1 rounded-full bg-amber-600 text-white text-[8px] font-black flex items-center justify-center">
                    {heldOrders.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">Orders</span>
              {activeNav === "orders" && (
                <motion.div layoutId="bottomNavDot" className="h-0.5 w-4 rounded-full bg-[#4A2E1F] absolute -bottom-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playBlip(880);
                setActiveNav("tables");
              }}
              className={`flex min-w-[52px] sm:min-w-[60px] h-9.5 flex-col items-center justify-center rounded-xl transition-all cursor-pointer px-2 py-0.5 relative ${
                activeNav === "tables" ? "text-[#4A2E1F] font-black" : "text-stone-400 hover:text-stone-700"
              }`}
            >
              <Grid3X3 size={16} className={activeNav === "tables" ? "stroke-[2.5]" : "stroke-[1.8]"} />
              <span className="text-[10px] tracking-tight mt-0.5">Tables</span>
              {activeNav === "tables" && (
                <motion.div layoutId="bottomNavDot" className="h-0.5 w-4 rounded-full bg-[#4A2E1F] absolute -bottom-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playBlip(880);
                setActiveNav("customers");
              }}
              className={`flex min-w-[52px] sm:min-w-[60px] h-9.5 flex-col items-center justify-center rounded-xl transition-all cursor-pointer px-2 py-0.5 relative ${
                activeNav === "customers" ? "text-[#4A2E1F] font-black" : "text-stone-400 hover:text-stone-700"
              }`}
            >
              <Users size={16} className={activeNav === "customers" ? "stroke-[2.5]" : "stroke-[1.8]"} />
              <span className="text-[10px] tracking-tight mt-0.5">Customers</span>
              {activeNav === "customers" && (
                <motion.div layoutId="bottomNavDot" className="h-0.5 w-4 rounded-full bg-[#4A2E1F] absolute -bottom-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playBlip(800);
                setShowOperationsModal(true);
              }}
              className="flex min-w-[52px] sm:min-w-[60px] h-9.5 flex-col items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 transition-all cursor-pointer px-2 py-0.5"
            >
              <Settings size={16} className="stroke-[1.8]" />
              <span className="text-[10px] tracking-tight mt-0.5">Operations</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playBlip(800);
                setShowCashierModal(true);
              }}
              className="flex min-w-[60px] sm:min-w-[68px] h-9.5 items-center justify-center gap-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 transition-all cursor-pointer px-2 py-0.5"
            >
              <div className={`h-5 w-5 rounded-full ${currentStaff.avatarBg} text-white flex items-center justify-center text-[9px] font-black`}>
                {currentStaff.avatarText}
              </div>
              <div className="text-left">
                <span className="text-[10px] font-black text-stone-900 block leading-tight">{currentStaff.name}</span>
                <span className="text-[8px] font-bold text-stone-400 block leading-tight">S#{shift?.shiftNumber || 1}</span>
              </div>
            </button>
          </nav>
        </div>

        {/* ── RIGHT CART SIDEBAR (Extends full-height from topbar to the absolute bottom of the screen!) ── */}
        <aside className="flex w-84 sm:w-96 shrink-0 flex-col h-full bg-white shadow-lg z-30 overflow-hidden">
          {/* Header & Order Channel Selector */}
          <div className="shrink-0 px-4 py-2 border-b border-stone-100 space-y-1.5 bg-stone-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-stone-900">Ticket #{ticketNumber}</span>
                <span className="text-[10px] font-medium text-stone-400">({cart.length} {cart.length === 1 ? "item" : "items"})</span>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playBlip(600);
                    dispatch({ type: "CLEAR" });
                  }}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Order Channel Selector */}
            <div className="grid grid-cols-3 gap-1 bg-stone-100 p-0.5 rounded-xl">
              {(["Walk-in", "Takeaway", "Delivery"] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => {
                    soundFX.playBlip(900);
                    setOrderChannel(ch);
                  }}
                  className={`py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    orderChannel === ch ? "bg-white text-stone-900 shadow-2xs" : "text-stone-400 hover:text-stone-700"
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* ── Flat Spreadsheet Table Headers ── */}
          <div className="shrink-0 px-3 py-2 bg-stone-50/80 border-b border-stone-200/80 flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            <span className="flex-1">PRODUCT</span>
            <span className="w-16 text-right">PRICE</span>
            <span className="w-12 text-center">QTY</span>
            <span className="w-20 text-right">AMOUNT</span>
          </div>

          {/* ── Table Rows: Clean, Flat Spreadsheet Layout (No Bulky Cards) ── */}
          <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-stone-100">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center py-12 text-stone-300">
                <ShoppingCart size={32} className="mb-2 stroke-[1.5]" />
                <p className="text-xs font-bold text-stone-500">Cart is empty</p>
                <p className="text-[10px] text-stone-400 mt-0.5">Tap menu cards to add items</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {cart.map((item) => {
                  const effectiveActiveId = activeCartId || (cart.length > 0 ? cart[cart.length - 1].cartId : null);
                  const isSelected = effectiveActiveId === item.cartId;
                  const modifierValues = [
                    item.notes,
                    item.size?.replace(/\s*\(\+\$0\.00\)/, ""),
                    item.sweetness === "0%"
                      ? "No Sugar"
                      : item.sweetness === "30%"
                      ? "Less Sweet (30%)"
                      : item.sweetness === "50%"
                      ? "Half Sweet (50%)"
                      : item.sweetness === "70%"
                      ? "70% Sugar"
                      : item.sweetness === "100%"
                      ? "Normal Sweet"
                      : item.sweetness
                      ? `${item.sweetness} Sugar`
                      : "",
                    item.ice,
                  ]
                    .filter(Boolean)
                    .join(" · ");

                  return (
                    <motion.div
                      key={item.cartId}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -80 }}
                      className="relative overflow-hidden"
                    >
                      {/* Bottom Layer (Delete action) */}
                      <div
                        className="absolute inset-0 bg-red-600 flex items-center justify-end pr-4 text-white z-0 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundFX.playBlip(600);
                          dispatch({ type: "UPDATE_QTY", cartId: item.cartId, qty: 0 });
                        }}
                      >
                        <Trash2 size={16} />
                      </div>

                      {/* Top Layer (Interactive row with solid opaque background) */}
                      <motion.div
                        drag="x"
                        dragConstraints={{ left: -75, right: 0 }}
                        dragElastic={0.05}
                        onDragEnd={(_e, info) => {
                          if (info.offset.x < -50) {
                            soundFX.playBlip(600);
                            dispatch({ type: "UPDATE_QTY", cartId: item.cartId, qty: 0 });
                          }
                        }}
                        onClick={() => {
                          soundFX.playBlip(950);
                          setActiveCartId(item.cartId);
                        }}
                        className={`relative z-10 flex items-center py-2.5 px-3 border-b border-stone-100 transition-colors cursor-pointer w-full ${
                          isSelected
                            ? "bg-[#F5EFEB] text-stone-900 border-l-4 border-[#4A2E1F]"
                            : "bg-white hover:bg-stone-50/90 border-l-4 border-transparent"
                        }`}
                      >
                        {/* PRODUCT (flex-1) */}
                        <div className="flex-1 min-w-0 pr-2">
                          <span
                            className={`text-xs md:text-sm font-semibold truncate block leading-tight ${
                              isSelected ? "text-stone-950 font-bold" : "text-stone-900"
                            }`}
                          >
                            {item.name}
                          </span>
                          <span className="text-[11px] text-stone-400 font-normal leading-tight mt-0.5 whitespace-normal break-words block">
                            {modifierValues || "Regular"}
                          </span>
                        </div>

                        {/* PRICE (w-16 text-right) */}
                        <div className="w-16 text-right text-xs md:text-sm font-medium text-stone-600 shrink-0">
                          {formatUSD(item.price)}
                        </div>

                        {/* QTY (w-12 text-center): Seamless, blended text */}
                        <div className="w-12 flex items-center justify-center shrink-0">
                          <span
                            onMouseDown={() => handleQtyTouchStart(item)}
                            onMouseUp={handleQtyTouchEnd}
                            onMouseLeave={handleQtyTouchEnd}
                            onTouchStart={() => handleQtyTouchStart(item)}
                            onTouchEnd={handleQtyTouchEnd}
                            onClick={(e) => handleQtyClick(e, item)}
                            title="Tap to +1, Hold (400ms) to edit"
                            className="text-xs md:text-sm font-semibold text-stone-700 w-10 text-center py-1 cursor-pointer hover:text-stone-950 transition-colors select-none"
                          >
                            {item.qty}
                          </span>
                        </div>

                        {/* AMOUNT (w-20 text-right font-bold) */}
                        <div
                          className={`w-20 text-right text-xs md:text-sm font-bold shrink-0 ${
                            isSelected ? "text-stone-950 font-black" : "text-stone-900"
                          }`}
                        >
                          {formatUSD(item.price * item.qty)}
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* ── Totals & Bold Dual Currency (USD $X.XX | KHR X,XXX ៛) ── */}
          <div className="shrink-0 px-4 py-2 border-t border-stone-200/80 bg-stone-50/90 space-y-1">
            <div className="flex justify-between text-[11px] text-stone-500 font-medium">
              <span>Subtotal (Tax Included 10%)</span>
              <span>{formatUSD(rawSubtotal)}</span>
            </div>
            {discountUSD > 0 && (
              <div className="flex justify-between text-[11px] text-amber-700 font-bold">
                <span>Discount Promo</span>
                <span>-{formatUSD(discountUSD)}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-dashed border-stone-300 pt-1.5">
              <span className="text-xs font-black text-stone-800 uppercase tracking-wider">Total Due:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-stone-950 leading-none">USD {formatUSD(totalUSD)}</span>
                <span className="text-stone-300 text-sm font-light">|</span>
                <span className="text-xs font-black text-amber-900 leading-none bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-200">
                  KHR {formatKHRDirect(totalKHR)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Action Keypad Grid (Flush at bottom right corner) ── */}
          <div className="shrink-0 p-2.5 bg-stone-100/95 border-t border-stone-200">
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleInitiatePayment("CASH")}
                className="h-10 rounded-xl flex flex-col items-center justify-center text-white font-black text-[9px] shadow-2xs active:scale-95 transition-all cursor-pointer"
                style={{ background: "#15803D" }}
              >
                <Banknote size={14} />
                <span>CASH</span>
              </button>

              <button
                type="button"
                onClick={() => handleInitiatePayment("PAYMENT")}
                className="h-10 rounded-xl flex flex-col items-center justify-center text-white font-black text-[9px] shadow-2xs active:scale-95 transition-all cursor-pointer"
                style={{ background: "#4A2E1F" }}
              >
                <QrCode size={14} />
                <span>PAYMENT</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!activeItem) return;
                  soundFX.playBlip(800);
                  setQtyInput("");
                  setShowQtyModal(true);
                }}
                className="h-10 rounded-xl bg-white border border-stone-200 text-stone-800 hover:bg-stone-50 font-black text-[9px] flex flex-col items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                <Hash size={13} className="text-amber-800" />
                <span>QUANTITY</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playBlip(800);
                  setShowPromoModal(true);
                }}
                className={`h-10 rounded-xl border font-black text-[9px] flex flex-col items-center justify-center active:scale-95 transition-all cursor-pointer ${
                  discountUSD > 0 ? "bg-amber-100 border-amber-400 text-amber-950" : "bg-white border-stone-200 text-stone-800 hover:bg-stone-50"
                }`}
              >
                <Tag size={13} className={discountUSD > 0 ? "text-amber-800" : "text-stone-600"} />
                <span>PROMO</span>
              </button>

              <button
                type="button"
                onClick={() => handleInitiatePayment("KITCHEN")}
                className="h-9 rounded-xl bg-white border border-stone-200 text-stone-800 hover:bg-stone-50 font-black text-[8px] flex flex-col items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                <Send size={12} className="text-teal-700" />
                <span>KITCHEN</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playBlip(800);
                  try {
                    window.print();
                  } catch {}
                }}
                className="h-9 rounded-xl bg-white border border-stone-200 text-stone-800 hover:bg-stone-50 font-black text-[8px] flex flex-col items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                <Printer size={12} className="text-stone-600" />
                <span>PRINT</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playBlip(600);
                  if (activeItem) {
                    dispatch({ type: "UPDATE_QTY", cartId: activeItem.cartId, qty: 0 });
                  } else {
                    dispatch({ type: "CLEAR" });
                  }
                }}
                className="h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-black text-[8px] flex flex-col items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                <Trash2 size={12} />
                <span>VOID</span>
              </button>

              {/* HOLD ORDER BUTTON - OPENS HELD DRAWER */}
              <button
                type="button"
                onClick={() => {
                  if (heldOrders.length > 0 && cart.length === 0) {
                    setShowHeldOrdersModal(true);
                  } else {
                    handleHoldCurrentOrder();
                  }
                }}
                className={`h-9 rounded-xl border font-black text-[8px] flex flex-col items-center justify-center active:scale-95 transition-all cursor-pointer ${
                  heldOrders.length > 0 ? "bg-amber-100 border-amber-300 text-amber-900" : "bg-white border-stone-200 text-stone-800 hover:bg-stone-50"
                }`}
              >
                <PauseCircle size={12} className={heldOrders.length > 0 ? "text-amber-800" : "text-stone-600"} />
                <span>HOLD ({heldOrders.length})</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ── MODALS ── */}

      {/* 1. Cash Calculator Modal */}
      {showCashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <Banknote size={22} />
                </div>
                <div>
                  <h2 className="text-base font-black text-stone-900">Cash Calculator</h2>
                  <p className="text-xs text-stone-400">Standard Rate: $1 = 4,100 KHR · 100៛ Rounding Rule</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCashModal(false)}
                className="h-8 w-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Total Due</span>
                <span className="text-xl font-black text-stone-900 block leading-none">{formatUSD(totalUSD)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">KHR Total</span>
                <span className="text-base font-black text-amber-900 block leading-none">{formatKHRDirect(totalKHR)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActiveCashField("USD")}
                className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  activeCashField === "USD" ? "border-emerald-600 bg-emerald-50/50" : "border-stone-200 bg-white"
                }`}
              >
                <span className="text-[10px] font-black text-stone-500 uppercase">Received USD ($)</span>
                <span className="text-lg font-black text-stone-900 block mt-0.5">
                  {cashInputUSD ? `$${cashInputUSD}` : "$0.00"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCashField("KHR")}
                className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  activeCashField === "KHR" ? "border-emerald-600 bg-emerald-50/50" : "border-stone-200 bg-white"
                }`}
              >
                <span className="text-[10px] font-black text-stone-500 uppercase">Received KHR (៛)</span>
                <span className="text-lg font-black text-stone-900 block mt-0.5">
                  {cashInputKHR ? `${Number(cashInputKHR).toLocaleString("en-US")} ៛` : "0 ៛"}
                </span>
              </button>
            </div>

            {/* Balance / Change Due Display Box */}
            {(() => {
              const maxDollarBills = changeDueUSD > 0 ? Math.floor(changeDueUSD) : 0;
              const effectiveUSDGiven = customUSDChange !== null ? Math.min(maxDollarBills, customUSDChange) : 0;
              const remainingRielUSD = Math.max(0, changeDueUSD - effectiveUSDGiven);
              const remainingRielKHR = roundKHR(remainingRielUSD * KHR_RATE);

              return changeDueUSD > 0 ? (
                <div className="p-3.5 sm:p-4 rounded-3xl bg-emerald-50 border-2 border-emerald-300 space-y-2.5 shadow-xs">
                  {/* Big Prominent Readout */}
                  <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
                    <div>
                      <span className="text-[10px] font-black text-emerald-950 uppercase tracking-wider block">
                        {effectiveUSDGiven > 0 ? "Change to Hand (USD + Riel)" : "Change Due (All in Riel)"}
                      </span>
                      {effectiveUSDGiven > 0 ? (
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl sm:text-3xl font-black text-emerald-900 leading-none tracking-tight">
                            ${effectiveUSDGiven}.00
                          </span>
                          <span className="text-base font-bold text-emerald-600">+</span>
                          <span className="text-2xl sm:text-3xl font-black text-emerald-800 leading-none tracking-tight">
                            {formatKHRDirect(remainingRielKHR)}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-1">
                          <span className="text-2xl sm:text-3xl font-black text-emerald-800 leading-none tracking-tight block">
                            {formatKHRDirect(changeDueKHR)}
                          </span>
                          <span className="text-xs font-semibold text-stone-500 mt-1 block">
                            ≈ {formatUSD(changeDueUSD)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-full inline-block border border-emerald-200">
                        Total: {formatKHRDirect(changeDueKHR)}
                      </span>
                    </div>
                  </div>

                  {/* Interactive USD Bill Selector: Select dollars you have in drawer to see remaining riel */}
                  {maxDollarBills > 0 && (
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-stone-700">
                          💵 Have USD Dollar Bills? Tap amount:
                        </span>
                        <span className="text-[10px] font-bold text-stone-400">
                          Max: ${maxDollarBills}.00
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            soundFX.playBlip(880);
                            setCustomUSDChange(0);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            effectiveUSDGiven === 0
                              ? "bg-emerald-700 text-white shadow-xs"
                              : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50"
                          }`}
                        >
                          $0 (All in Riel)
                        </button>

                        {[1, 2, 5, 10, 20, 50, 100]
                          .filter((d) => d <= maxDollarBills)
                          .map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => {
                                soundFX.playBlip(900);
                                setCustomUSDChange(d);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                effectiveUSDGiven === d
                                  ? "bg-emerald-700 text-white shadow-xs"
                                  : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50"
                              }`}
                            >
                              ${d}
                            </button>
                          ))}

                        {maxDollarBills > 1 && ![1, 2, 5, 10, 20, 50, 100].includes(maxDollarBills) && (
                          <button
                            type="button"
                            onClick={() => {
                              soundFX.playBlip(900);
                              setCustomUSDChange(maxDollarBills);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              effectiveUSDGiven === maxDollarBills
                                ? "bg-emerald-700 text-white shadow-xs"
                                : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50"
                            }`}
                          >
                            ${maxDollarBills} (Max)
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-black text-rose-900 uppercase tracking-wider block">Remaining Balance</span>
                    <span className="text-base font-black text-rose-600 block leading-none">{formatUSD(remainingUSD)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-rose-900 uppercase tracking-wider block">In Cambodian Riel</span>
                    <span className="text-base font-black text-rose-600 block leading-none">{formatKHRDirect(roundKHR(remainingUSD * KHR_RATE))}</span>
                  </div>
                </div>
              );
            })()}

            {/* Quick Fill */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Quick Fill ({activeCashField})</span>
              {activeCashField === "USD" ? (
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCashInputUSD(totalUSD.toFixed(2))}
                    className="h-8 rounded-xl bg-emerald-100 text-emerald-900 font-black text-xs cursor-pointer"
                  >
                    Exact
                  </button>
                  {["5", "10", "20", "50", "100"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setCashInputUSD(d)}
                      className="h-8 rounded-xl bg-stone-100 text-stone-800 font-black text-xs hover:bg-stone-200 cursor-pointer"
                    >
                      ${d}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashInputUSD("")}
                    className="h-8 rounded-xl bg-rose-50 text-rose-700 font-black text-xs hover:bg-rose-100 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCashInputKHR(String(totalKHR))}
                    className="h-8 rounded-xl bg-emerald-100 text-emerald-900 font-black text-xs cursor-pointer"
                  >
                    Exact
                  </button>
                  {["1000", "2000", "5000", "10000", "20000", "50000"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setCashInputKHR(d)}
                      className="h-8 rounded-xl bg-stone-100 text-stone-800 font-black text-xs hover:bg-stone-200 cursor-pointer"
                    >
                      {Number(d).toLocaleString("en-US")} ៛
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashInputKHR("")}
                    className="h-8 rounded-xl bg-rose-50 text-rose-700 font-black text-xs hover:bg-rose-100 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    soundFX.playBlip(900);
                    if (activeCashField === "USD") setCashInputUSD((prev) => prev + String(n));
                    else setCashInputKHR((prev) => prev + String(n));
                  }}
                  className="h-9 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-sm font-black text-stone-900"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  soundFX.playBlip(600);
                  if (activeCashField === "USD") setCashInputUSD("");
                  else setCashInputKHR("");
                }}
                className="h-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black border border-rose-200"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playBlip(900);
                  if (activeCashField === "USD") {
                    if (!cashInputUSD.includes(".")) setCashInputUSD((prev) => prev + ".");
                  } else {
                    setCashInputKHR((prev) => prev + "0");
                  }
                }}
                className="h-9 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-sm font-black text-stone-900"
              >
                {activeCashField === "USD" ? "." : "0"}
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playBlip(800);
                  if (activeCashField === "USD") setCashInputUSD((prev) => prev.slice(0, -1));
                  else setCashInputKHR((prev) => prev.slice(0, -1));
                }}
                className="h-9 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-black flex items-center justify-center"
              >
                <Delete size={15} />
              </button>
            </div>

            <button
              type="button"
              disabled={!isCashSufficient}
              onClick={() => handleCompleteSale("CASH")}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-sm transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              <span>Complete Cash Sale ({formatUSD(totalUSD)})</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Bakong KHQR Dynamic Modal */}
      {showKHQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-center">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <span className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <QrCode size={16} className="text-teal-700" /> Bakong KHQR
              </span>
              <button
                type="button"
                onClick={() => setShowKHQRModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="relative mx-auto flex h-44 w-44 items-center justify-center rounded-3xl bg-stone-900 p-3 shadow-lg">
              <div className="absolute inset-0 rounded-3xl border-2 border-teal-400/40 animate-ping pointer-events-none" />
              <div className="h-full w-full bg-white rounded-2xl p-2 flex flex-col items-center justify-center">
                <QrCode size={100} className="text-stone-950" />
                <span className="text-[9px] font-black text-teal-800 tracking-wider mt-1">KHQR DYNAMIC PAY</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-xl font-black text-teal-900">{formatUSD(totalUSD)}</div>
              <div className="text-xs font-bold text-stone-500">{formatKHRDirect(totalKHR)}</div>
              <div className="text-[11px] font-bold text-amber-700 mt-1">
                ⏱️ QR Expires in: <span className="text-stone-900">{khqrTimer}s</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowKHQRModal(false)}
                className="py-2.5 rounded-2xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCompleteSale("BAKONG KHQR")}
                className="py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md active:scale-95"
              >
                Verify Payment ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Quantity Popover / Keypad Modal */}
      {showQtyModal && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="text-xs font-black text-stone-900 truncate">Quantity: {activeItem.name}</span>
              <button type="button" onClick={() => setShowQtyModal(false)} className="text-stone-400 hover:text-stone-700 text-xs font-bold">
                ✕
              </button>
            </div>

            {/* [ − ] / Display / [ + ] Steppers */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundFX.playBlip(750);
                  const current = parseInt(qtyInput) || activeItem.qty;
                  const next = Math.max(1, current - 1);
                  setQtyInput(String(next));
                }}
                className="h-11 w-11 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-lg font-black flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              >
                −
              </button>

              <div className="flex-1 h-11 rounded-2xl bg-stone-50 border-2 border-[#4A2E1F]/30 flex items-center justify-center text-xl font-black text-stone-900">
                {qtyInput || activeItem.qty}
              </div>

              <button
                type="button"
                onClick={() => {
                  soundFX.playBlip(880);
                  const current = parseInt(qtyInput) || activeItem.qty;
                  const next = current + 1;
                  setQtyInput(String(next));
                }}
                className="h-11 w-11 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-lg font-black flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Numeric Numpad */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    soundFX.playBlip(900);
                    setQtyInput((prev) => (prev === "0" ? String(n) : prev + String(n)));
                  }}
                  className="h-10 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-sm font-black text-stone-900 transition-colors cursor-pointer"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  soundFX.playBlip(600);
                  setQtyInput("");
                }}
                className="h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black border border-rose-200 transition-colors cursor-pointer"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playBlip(900);
                  if (qtyInput) setQtyInput((prev) => prev + "0");
                }}
                className="h-10 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-sm font-black text-stone-900 transition-colors cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playSuccess();
                  const targetQty = Math.max(1, parseInt(qtyInput) || activeItem.qty);
                  dispatch({ type: "UPDATE_QTY", cartId: activeItem.cartId, qty: targetQty });
                  setShowQtyModal(false);
                }}
                className="h-10 rounded-xl bg-[#4A2E1F] hover:bg-[#3b2418] text-white text-xs font-black transition-colors cursor-pointer"
              >
                Set ✓
              </button>
            </div>

            {/* Remove Item Button */}
            <button
              type="button"
              onClick={() => {
                soundFX.playBlip(600);
                dispatch({ type: "UPDATE_QTY", cartId: activeItem.cartId, qty: 0 });
                setShowQtyModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Remove Item</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Promo Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                <Tag size={15} className="text-amber-700" /> Apply Discount Promo
              </span>
              <button type="button" onClick={() => setShowPromoModal(false)} className="text-stone-400 text-xs font-bold">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "10% Off", val: rawSubtotal * 0.1 },
                { label: "20% Off", val: rawSubtotal * 0.2 },
                { label: "$1.00 Off", val: 1.0 },
                { label: "$2.00 Off", val: 2.0 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    soundFX.playBlip(900);
                    setDiscountUSD(Math.min(rawSubtotal, p.val));
                    setShowPromoModal(false);
                  }}
                  className="p-3 rounded-2xl bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-300 font-black text-xs text-stone-800 text-center transition-all cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {discountUSD > 0 && (
              <button
                type="button"
                onClick={() => {
                  setDiscountUSD(0);
                  setShowPromoModal(false);
                }}
                className="w-full py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-black hover:bg-rose-100"
              >
                Remove Discount
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. Held Orders Drawer Modal */}
      {showHeldOrdersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="text-xs font-black text-stone-900">Held Orders Drawer ({heldOrders.length})</span>
              <button type="button" onClick={() => setShowHeldOrdersModal(false)} className="text-stone-400 text-xs font-bold">
                ✕
              </button>
            </div>

            {heldOrders.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-xs">No orders currently on hold.</div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {heldOrders.map((h) => (
                  <div key={h.id} className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-stone-900">{h.tag}</span>
                      <span className="text-[11px] font-black text-amber-900">
                        {formatUSD(h.cart.reduce((s, i) => s + i.price * i.qty, 0) * 1.1)}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 line-clamp-1">{h.cart.map((i) => `${i.qty}x ${i.name}`).join(", ")}</p>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleDiscardHeldOrder(h.id)}
                        className="flex-1 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-[10px] font-black"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResumeHeldOrder(h)}
                        className="flex-2 py-1.5 rounded-xl text-white text-[10px] font-black shadow-xs"
                        style={{ background: "#4A2E1F" }}
                      >
                        Resume Order →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Completed Sale Receipt Modal */}
      {showReceiptModal && lastCompletedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-center max-h-[90vh] overflow-y-auto">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <CheckCircle2 size={28} />
            </div>

            <div>
              <h2 className="text-base font-black text-stone-900">Order #{lastCompletedSale.ticketNumber} Done!</h2>
              <p className="text-xs text-stone-400">{lastCompletedSale.timestamp} · {lastCompletedSale.paymentMethod}</p>
            </div>

            {/* Total Paid Row */}
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
              <span className="font-bold text-stone-500">Total Paid:</span>
              <span className="font-black text-stone-900 text-sm">
                {formatUSD(lastCompletedSale.total)} ({formatKHRDirect(roundKHR(lastCompletedSale.total * KHR_RATE))})
              </span>
            </div>

            {/* Change Calculator Section if Change > 0 */}
            {lastCompletedSale.paymentMethod === "CASH" && lastCompletedSale.changeUSD > 0 && (() => {
              const totalChangeUSD = lastCompletedSale.changeUSD;
              const maxUSD = Math.floor(totalChangeUSD);
              const parsedUSDInput = parseInt(receiptUSDInput);
              const givenUSD = isNaN(parsedUSDInput)
                ? (receiptChangeMode === "SPLIT_USD_KHR" ? maxUSD : 0)
                : Math.min(maxUSD, Math.max(0, parsedUSDInput));
              const remainingUSD = Math.max(0, totalChangeUSD - givenUSD);
              const remainingKHR = roundKHR(remainingUSD * KHR_RATE);

              return (
                <div className="space-y-3">
                  {/* Segmented Pill Toggle: [ All in Riel ] | [ Dollar + Riel ] */}
                  <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-2xl gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playBlip(900);
                        setReceiptChangeMode("ALL_KHR");
                        setReceiptUSDInput("0");
                      }}
                      className={`py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        receiptChangeMode === "ALL_KHR"
                          ? "bg-white text-stone-900 shadow-2xs"
                          : "text-stone-500 hover:text-stone-900"
                      }`}
                    >
                      All in Riel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playBlip(900);
                        setReceiptChangeMode("SPLIT_USD_KHR");
                        if (!receiptUSDInput || receiptUSDInput === "0") {
                          setReceiptUSDInput(String(maxUSD));
                        }
                      }}
                      className={`py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        receiptChangeMode === "SPLIT_USD_KHR"
                          ? "bg-white text-stone-900 shadow-2xs"
                          : "text-stone-500 hover:text-stone-900"
                      }`}
                    >
                      Dollar + Riel
                    </button>
                  </div>

                  {/* Mode 1: All in Riel Display */}
                  {receiptChangeMode === "ALL_KHR" ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                      <span className="text-[11px] font-black text-emerald-900 uppercase tracking-wider block">
                        Change Due (All in Riel)
                      </span>
                      <span className="text-3xl font-black text-emerald-700 block tracking-tight">
                        {formatKHRDirect(lastCompletedSale.changeKHR)}
                      </span>
                      <span className="text-xs font-semibold text-stone-500 block">
                        ≈ {formatUSD(lastCompletedSale.changeUSD)}
                      </span>
                    </div>
                  ) : (
                    /* Mode 2: Dynamic Split Dollar + Riel Mode */
                    <div className="space-y-3">
                      {/* Breakdown Box */}
                      <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                        <div className="p-2.5 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                            Give in USD
                          </span>
                          <span className="text-2xl font-black text-emerald-900 block mt-0.5">
                            ${givenUSD}.00
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                            Give in KHR
                          </span>
                          <span className="text-2xl font-black text-emerald-700 block mt-0.5">
                            {formatKHRDirect(remainingKHR)}
                          </span>
                        </div>
                      </div>

                      {/* Direct Numeric Input & Steppers */}
                      {maxUSD > 0 && (
                        <div className="space-y-1.5 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-stone-600">Enter USD Bills to Give:</span>
                            <span className="text-[10px] font-bold text-stone-400">Max: ${maxUSD}.00</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-stone-400 text-lg">$</span>
                              <input
                                type="number"
                                min={0}
                                max={maxUSD}
                                value={receiptUSDInput}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "" || parseInt(val) <= maxUSD) {
                                    setReceiptUSDInput(val);
                                  }
                                }}
                                placeholder="0"
                                className="w-full h-11 pl-8 pr-3 rounded-xl border border-stone-300 text-center text-lg font-bold text-stone-900 focus:border-emerald-500 focus:outline-none bg-white shadow-2xs"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playBlip(750);
                                const current = parseInt(receiptUSDInput) || 0;
                                setReceiptUSDInput(String(Math.max(0, current - 1)));
                              }}
                              className="h-11 w-11 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-lg font-black flex items-center justify-center transition-colors cursor-pointer"
                            >
                              −
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playBlip(880);
                                const current = parseInt(receiptUSDInput) || 0;
                                setReceiptUSDInput(String(Math.min(maxUSD, current + 1)));
                              }}
                              className="h-11 w-11 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-lg font-black flex items-center justify-center transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          {/* Quick Pill Buttons */}
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playBlip(880);
                                setReceiptUSDInput("0");
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                givenUSD === 0
                                  ? "bg-emerald-700 text-white shadow-xs"
                                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                              }`}
                            >
                              $0
                            </button>
                            {[1, 2, 5, 10, 20, 50, 100]
                              .filter((d) => d <= maxUSD)
                              .map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => {
                                    soundFX.playBlip(900);
                                    setReceiptUSDInput(String(d));
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                    givenUSD === d
                                      ? "bg-emerald-700 text-white shadow-xs"
                                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                                  }`}
                                >
                                  ${d}
                                </button>
                              ))}
                            {maxUSD > 1 && ![1, 2, 5, 10, 20, 50, 100].includes(maxUSD) && (
                              <button
                                type="button"
                                onClick={() => {
                                  soundFX.playBlip(900);
                                  setReceiptUSDInput(String(maxUSD));
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                  givenUSD === maxUSD
                                    ? "bg-emerald-700 text-white shadow-xs"
                                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                                }`}
                              >
                                ${maxUSD} (Max)
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Items Receipt Summary */}
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-left space-y-1 text-xs">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">
                Order Items ({lastCompletedSale.items.length})
              </span>
              <div className="text-[11px] text-stone-600 space-y-0.5 max-h-32 overflow-y-auto pr-1">
                {lastCompletedSale.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate pr-2">{it.qty}x {it.name}</span>
                    <span className="font-semibold text-stone-900 shrink-0">{formatUSD(it.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  try {
                    window.print();
                  } catch {}
                }}
                className="flex-1 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer size={14} /> Print Slip
              </button>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-3 rounded-2xl text-white font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                style={{ background: "#4A2E1F" }}
              >
                New Order →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Operations & System Settings Modal */}
      {showOperationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <span className="text-xs font-black text-stone-900 flex items-center gap-2">
                <Settings size={16} className="text-stone-700" /> POS Operations &amp; Shift
              </span>
              <button type="button" onClick={() => setShowOperationsModal(false)} className="text-stone-400 hover:text-stone-700 text-xs font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <Link
                href="/admin"
                className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={16} className="text-indigo-700" />
                  <div>
                    <span className="font-black block">Back-of-House (BOH) Admin</span>
                    <span className="text-[10px] text-stone-400">Inventory, catalog, users, reports</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-stone-400" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  soundFX.playWarning();
                  showNotification("Shift Closed", "Z-Report generated and synced to BOH.", "success");
                  setShowOperationsModal(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 text-left transition-colors cursor-pointer"
              >
                <div>
                  <span className="font-black block">Close Shift / End Business Day</span>
                  <span className="text-[10px] text-rose-600">Print Z-Report &amp; count drawer float</span>
                </div>
                <span className="text-[10px] font-black bg-rose-200 text-rose-900 px-2 py-0.5 rounded">Z-Report</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playBlip();
                  showNotification("Cash In/Out", "Drawer movement recorded.", "info");
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 text-left transition-colors cursor-pointer"
              >
                <div>
                  <span className="font-black block">Cash In / Cash Out (Petty Cash)</span>
                  <span className="text-[10px] text-stone-400">Drawer movement tracking</span>
                </div>
                <DollarSign size={14} className="text-stone-500" />
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playSuccess();
                  showNotification("Printer Ready", "Thermal printer calibrated.", "success");
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 text-left transition-colors cursor-pointer"
              >
                <div>
                  <span className="font-black block">Printer Calibration</span>
                  <span className="text-[10px] text-stone-400">80mm ESC/POS Network Printer</span>
                </div>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Ready</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowOperationsModal(false)}
              className="w-full py-2.5 rounded-2xl bg-stone-900 text-white font-black text-xs hover:bg-stone-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 8. Cashier Profile & Switch Modal */}
      {showCashierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <span className="text-xs font-black text-stone-900 flex items-center gap-2">
                <UserCheck size={16} className="text-stone-700" /> Cashier &amp; Shift Profile
              </span>
              <button type="button" onClick={() => setShowCashierModal(false)} className="text-stone-400 hover:text-stone-700 text-xs font-bold">
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-3">
              <div className={`h-11 w-11 rounded-2xl ${currentStaff.avatarBg} text-white flex items-center justify-center text-base font-black shadow-sm`}>
                {currentStaff.avatarText}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-stone-900">{currentStaff.name}</span>
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">On Duty</span>
                </div>
                <span className="text-xs text-stone-500 block">{currentStaff.role} · Shift #{shift?.shiftNumber || 1}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Quick Switch Staff</span>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {STAFF_LIST.map((staff) => (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => {
                      soundFX.playSuccess();
                      setCurrentStaff(staff);
                      showNotification("Staff Switched", `Logged in as ${staff.name} (${staff.role})`, "success");
                      setShowCashierModal(false);
                    }}
                    className={`w-full p-2 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                      currentStaff.id === staff.id ? "bg-amber-50 border-amber-300" : "bg-white border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-5 w-5 rounded-full ${staff.avatarBg} text-white flex items-center justify-center text-[9px] font-black`}>
                        {staff.avatarText}
                      </div>
                      <span className="text-xs font-bold text-stone-900">{staff.name}</span>
                    </div>
                    <span className="text-[10px] text-stone-500">{staff.role}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  soundFX.playBlip(600);
                  showNotification("Register Locked 🔒", "Enter passcode to unlock.", "warning");
                  setShowCashierModal(false);
                }}
                className="flex-1 py-2 rounded-2xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200"
              >
                Lock POS
              </button>
              <button
                type="button"
                onClick={() => setShowCashierModal(false)}
                className="flex-1 py-2 rounded-2xl text-white font-black text-xs shadow-sm"
                style={{ background: "#4A2E1F" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Animated Toast Validation on Payment Attempt */}
      <AnimatePresence>
        {validationToast && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 rounded-2xl bg-stone-900/95 text-white px-5 py-3 shadow-2xl border border-stone-700/80 backdrop-blur-md max-w-lg"
          >
            <div className="h-7 w-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} />
            </div>
            <div className="flex-1 text-xs">
              <p className="font-semibold text-stone-200 leading-snug">
                Failed: <span className="text-amber-300 font-bold">{validationToast.itemName}</span> must have the following required condiments:{" "}
                <span className="text-rose-300 font-bold">{validationToast.missingText}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setValidationToast(null)}
              className="text-stone-400 hover:text-white text-xs font-bold ml-1 cursor-pointer transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* General Toast */}
      {generalToast && (
        <div
          className={`fixed bottom-16 right-5 z-[80] flex items-center gap-2.5 rounded-2xl px-4 py-3 text-white shadow-xl animate-in slide-in-from-bottom-2 duration-200 ${
            generalToast.type === "warning" ? "bg-amber-600" : generalToast.type === "info" ? "bg-stone-900" : "bg-emerald-600"
          }`}
        >
          {generalToast.type === "warning" ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
          <div className="text-xs">
            <p className="font-black">{generalToast.title}</p>
            <p className="text-[11px] opacity-90">{generalToast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
