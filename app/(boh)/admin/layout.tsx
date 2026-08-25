"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Layers,
  Boxes,
  Receipt,
  Store,
  Users,
  Send,
  LogOut,
  Coffee,
  Monitor,
  ChevronRight,
  Sun,
  Moon,
  TrendingUp,
  Sparkles,
  FolderTree,
  Sliders,
  Droplets,
  Package,
  Search,
  ArrowDownToLine,
  ArrowRightLeft,
  AlertTriangle,
  Command,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface SearchableItem {
  title: string;
  category: string;
  href: string;
  icon: any;
  keywords: string;
}

const GLOBAL_SEARCH_ITEMS: SearchableItem[] = [
  // Catalog & Menu
  { title: "Product Master", category: "Catalog & Menu", href: "/admin/products", icon: Coffee, keywords: "products items menu pricing sku drinks food cogs" },
  { title: "Categories", category: "Catalog & Menu", href: "/admin/categories", icon: FolderTree, keywords: "category categories station routing espresso kitchen pastry" },
  { title: "Option Groups", category: "Catalog & Menu", href: "/admin/option-groups", icon: Sliders, keywords: "options modifiers sweetness ice level single multiple radio checkbox" },
  { title: "Condiments & Add-ons", category: "Catalog & Menu", href: "/admin/condiments", icon: Sparkles, keywords: "condiments syrups toppings extra shots foam oat milk" },
  { title: "Combos & Bundles", category: "Catalog & Menu", href: "/admin/combos", icon: UtensilsCrossed, keywords: "combos bundles breakfast deals packages savings afternoon tea" },
  
  // Stock & Store Operations
  { title: "Live Stock & UOM", category: "Stock Operations", href: "/admin/inventory?tab=stock", icon: Boxes, keywords: "inventory ingredients beans dairy syrup stock levels uom units" },
  { title: "Goods Received (GRN)", category: "Stock Operations", href: "/admin/inventory?tab=grn", icon: ArrowDownToLine, keywords: "grn goods received supplier delivery invoice shipment receiving" },
  { title: "Stock Transfers", category: "Stock Operations", href: "/admin/inventory?tab=transfers", icon: ArrowRightLeft, keywords: "transfer stock warehouse barista counter bakery movements" },
  { title: "Waste & Write-Offs", category: "Stock Operations", href: "/admin/inventory?tab=writeoffs", icon: AlertTriangle, keywords: "waste write-offs spoilage grinder calibration spillage scrap" },
  { title: "Recipe BOM & Margins", category: "Stock Operations", href: "/admin/recipes", icon: Layers, keywords: "recipes bill of materials portion cost margins gross profit" },
  { title: "Multi-Store Price Sync", category: "Stock Operations", href: "/admin/menu", icon: Store, keywords: "stores price override publish menu schedule sync branch" },

  // Executive & Admin
  { title: "Executive Dashboard", category: "Executive & Admin", href: "/admin", icon: LayoutDashboard, keywords: "dashboard analytics revenue kpi sales hourly peak rush trends" },
  { title: "Shifts & Z-Reports", category: "Executive & Admin", href: "/admin/shifts", icon: Receipt, keywords: "shifts z-report x-report cash float audit cashier balance" },
  { title: "Staff & Permissions", category: "Executive & Admin", href: "/admin/staff", icon: Users, keywords: "staff employees passcodes roles pin manager cashier barista" },
  { title: "Telegram Bot & Settings", category: "Executive & Admin", href: "/admin/settings", icon: Send, keywords: "telegram bot alerts notifications webhook token store settings" },

  // Workstations
  { title: "Front POS Register", category: "Workstations", href: "/pos", icon: Coffee, keywords: "pos register cashier sales point of sale checkout payment" },
  { title: "Customer Facing Display (CFD)", category: "Workstations", href: "/cfd", icon: Monitor, keywords: "cfd customer display second screen qr order total" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const sessionStr = localStorage.getItem("pos_session");
    if (sessionStr) {
      try {
        setSession(JSON.parse(sessionStr));
      } catch (e) {}
    }

    const savedTheme = localStorage.getItem("boh_theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      document.documentElement.classList.add("dark");
    }

    // Keyboard shortcut for Command Palette (⌘K or Ctrl+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
      if (e.key === "Escape") {
        setShowSearchModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("boh_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("pos_token");
    localStorage.removeItem("pos_session");
    router.push("/login");
  };

  const isLight = theme === "light";

  // Filtered Search Items
  const filteredSearch = useMemo(() => {
    if (!searchQuery.trim()) return GLOBAL_SEARCH_ITEMS;
    const q = searchQuery.toLowerCase();
    return GLOBAL_SEARCH_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleNavigate = (href: string) => {
    setShowSearchModal(false);
    setSearchQuery("");
    router.push(href);
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-200 ${
      theme === "dark" ? "dark bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"
    }`}>
      {/* Sidebar */}
      <aside className={`w-64 border-r flex flex-col shrink-0 transition-colors duration-200 ${
        isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/90 border-slate-800"
      }`}>
        {/* Brand Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight ? "border-slate-100" : "border-slate-800"
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-white shadow-md shadow-amber-500/20">
              <Coffee size={20} />
            </div>
            <div>
              <h2 className={`text-sm font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                Artisan Roast
              </h2>
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Enterprise BOH</p>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all duration-200 active:scale-95 cursor-pointer ${
              isLight
                ? "bg-slate-100 text-amber-600 border-slate-200 hover:bg-slate-200"
                : "bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700"
            }`}
            title="Toggle Theme"
          >
            {isLight ? <Moon size={15} /> : <Sun size={15} />}
          </button>
        </div>

        {/* ── GLOBAL SEARCH TRIGGER BAR ── */}
        <div className="px-3 pt-3">
          <button
            id="global-search-btn"
            type="button"
            onClick={() => {
              setShowSearchModal(true);
              setSelectedIndex(0);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition active:scale-98 cursor-pointer ${
              isLight
                ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                : "bg-slate-800/80 border-slate-700/80 text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <Search size={14} className="text-amber-500" />
              <span className="font-semibold">Search functions...</span>
            </div>
            <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
              isLight ? "bg-white border-slate-200 text-slate-500" : "bg-slate-900 border-slate-700 text-slate-400"
            }`}>
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-2 space-y-3 overflow-y-auto no-scrollbar">
          {/* Executive Dashboard */}
          <div>
            <Link
              href="/admin"
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                pathname === "/admin"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                  : isLight
                  ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard size={15} />
                <span>Executive Dashboard</span>
              </div>
              {pathname === "/admin" && <ChevronRight size={13} />}
            </Link>
          </div>

          {/* ── SECTION 1: CATALOG & MENU ── */}
          <div className="space-y-0.5">
            <p className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 ${
              isLight ? "text-slate-400" : "text-slate-500"
            }`}>
              Catalog &amp; Menu
            </p>
            {[
              { href: "/admin/products", label: "Product Master", icon: Coffee },
              { href: "/admin/categories", label: "Categories", icon: FolderTree },
              { href: "/admin/option-groups", label: "Option Groups", icon: Sliders },
              { href: "/admin/condiments", label: "Condiments & Add-ons", icon: Sparkles },
              { href: "/admin/combos", label: "Combos & Bundles", icon: UtensilsCrossed },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                      : isLight
                      ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={14} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={12} />}
                </Link>
              );
            })}
          </div>

          {/* ── SECTION 2: SEPARATED INVENTORY & STORE OPERATIONS ── */}
          <div className="space-y-0.5">
            <p className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 ${
              isLight ? "text-slate-400" : "text-slate-500"
            }`}>
              Inventory &amp; Store Operations
            </p>
            {[
              { href: "/admin/inventory?tab=stock", label: "Live Raw Stock & UOM", icon: Boxes, match: "/admin/inventory?tab=stock" },
              { href: "/admin/inventory?tab=grn", label: "Goods Received (GRN)", icon: ArrowDownToLine, match: "/admin/inventory?tab=grn" },
              { href: "/admin/inventory?tab=transfers", label: "Stock Transfers", icon: ArrowRightLeft, match: "/admin/inventory?tab=transfers" },
              { href: "/admin/inventory?tab=writeoffs", label: "Waste & Write-Offs", icon: AlertTriangle, match: "/admin/inventory?tab=writeoffs" },
              { href: "/admin/recipes", label: "Recipe BOM & Margins", icon: Layers, match: "/admin/recipes" },
              { href: "/admin/menu", label: "Store Price Sync", icon: Store, match: "/admin/menu" },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href.split("?")[0] && (typeof window !== "undefined" ? window.location.search.includes(item.href.split("?")[1] || "") : false) || pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                      : isLight
                      ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={14} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={12} />}
                </Link>
              );
            })}
          </div>

          {/* ── SECTION 3: EXECUTIVE & ADMIN ── */}
          <div className="space-y-0.5">
            <p className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 ${
              isLight ? "text-slate-400" : "text-slate-500"
            }`}>
              Administration &amp; Audit
            </p>
            {[
              { href: "/admin/shifts", label: "Shifts & Z-Reports", icon: Receipt },
              { href: "/admin/staff", label: "Staff & Permissions", icon: Users },
              { href: "/admin/settings", label: "Telegram Bot & Settings", icon: Send },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                      : isLight
                      ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={14} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={12} />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Quick Launch Station Links */}
        <div className={`p-3 border-t space-y-1.5 ${isLight ? "border-slate-200" : "border-slate-800"}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider px-2 ${
            isLight ? "text-slate-400" : "text-slate-500"
          }`}>
            Workstation Access
          </p>
          <Link
            href="/pos"
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition border ${
              isLight
                ? "bg-amber-50/70 hover:bg-amber-100/80 text-amber-900 border-amber-200/60"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-white border-slate-700/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <Coffee size={14} className="text-amber-500" />
              <span>Launch POS Register</span>
            </div>
            <ChevronRight size={14} className="text-slate-400" />
          </Link>
          <Link
            href="/cfd"
            target="_blank"
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition border ${
              isLight
                ? "bg-teal-50/70 hover:bg-teal-100/80 text-teal-900 border-teal-200/60"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-white border-slate-700/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <Monitor size={14} className="text-teal-500" />
              <span>Customer Display (CFD)</span>
            </div>
            <ExternalLink size={13} className="text-slate-400" />
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition mt-1 cursor-pointer"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-w-0 overflow-y-auto ${
        isLight ? "bg-slate-50/60" : "bg-slate-950"
      }`}>
        {children}
      </main>

      {/* ── SPOTLIGHT GLOBAL SEARCH MODAL (COMMAND PALETTE) ── */}
      {showSearchModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 pt-20 p-4 backdrop-blur-sm animate-in fade-in duration-100"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSearchModal(false);
          }}
        >
          <div
            className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
              isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className={`p-4 border-b flex items-center gap-3 ${
              isLight ? "border-slate-200 bg-slate-50/90" : "border-slate-800 bg-slate-950/90"
            }`}>
              <Search size={18} className="text-amber-500 shrink-0" />
              <input
                id="spotlight-search-input"
                autoFocus
                type="text"
                placeholder="Search any function (e.g. GRN, Product, Categories, Shifts, Staff)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredSearch.length > 0) {
                    handleNavigate(filteredSearch[selectedIndex]?.href || filteredSearch[0].href);
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev + 1) % filteredSearch.length);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev - 1 + filteredSearch.length) % filteredSearch.length);
                  }
                }}
                className={`w-full bg-transparent text-sm font-semibold outline-none ${
                  isLight ? "text-slate-900 placeholder-slate-400" : "text-white placeholder-slate-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                ESC
              </button>
            </div>

            {/* Search Results List */}
            <div className="max-h-96 overflow-y-auto p-2 space-y-1">
              {filteredSearch.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No matching functions found for "{searchQuery}".
                </div>
              ) : (
                filteredSearch.map((item, idx) => {
                  const Icon = item.icon;
                  const isHighlighted = idx === selectedIndex;
                  return (
                    <button
                      key={item.href + item.title}
                      onClick={() => handleNavigate(item.href)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-left text-xs transition cursor-pointer ${
                        isHighlighted
                          ? isLight
                            ? "bg-amber-500/10 text-slate-900 border border-amber-500/30"
                            : "bg-slate-800 text-white border border-amber-500/30"
                          : isLight
                          ? "hover:bg-slate-100 text-slate-700"
                          : "hover:bg-slate-800/60 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold shrink-0">
                          <Icon size={17} />
                        </div>
                        <div>
                          <p className="font-bold">{item.title}</p>
                          <p className={`text-[10px] ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                            {item.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border ${
                          isLight ? "bg-slate-100 border-slate-200 text-slate-500" : "bg-slate-950 border-slate-800 text-slate-400"
                        }`}>
                          Jump
                        </span>
                        <ArrowRight size={14} className="text-amber-500" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Quick Navigation Footer */}
            <div className={`px-4 py-2.5 border-t flex items-center justify-between text-[11px] ${
              isLight ? "border-slate-100 bg-slate-50 text-slate-500" : "border-slate-800 bg-slate-950 text-slate-500"
            }`}>
              <span>Press <kbd className="font-mono font-bold">↵</kbd> to jump</span>
              <span>Global Spotlight Search</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
