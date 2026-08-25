"use client";

import React, { useEffect, useState } from "react";
import { UtensilsCrossed, Plus, Layers, DollarSign, Percent, Save, Coffee, Sparkles } from "lucide-react";

export default function RecipeBOMMaster() {
  const [products, setProducts] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pRes = await fetch("/api/catalog/products");
      const pData = await pRes.json();
      if (pData.success) {
        setProducts(pData.products);
        if (pData.products.length > 0 && !selectedProduct) {
          setSelectedProduct(pData.products[4] || pData.products[0]); // default to Iced Latte
        }
      }

      const iRes = await fetch("/api/inventory/ingredients");
      const iData = await iRes.json();
      if (iData.success) setIngredients(iData.ingredients);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalRecipeCost = selectedProduct?.recipes?.reduce(
    (sum: number, r: any) => sum + (r.costPerServing || 0),
    0
  ) || 0;

  const sellingPrice = selectedProduct?.effectivePrice || selectedProduct?.price || 0;
  const profitUSD = Number((sellingPrice - totalRecipeCost).toFixed(2));
  const profitMargin = sellingPrice > 0 ? Number(((profitUSD / sellingPrice) * 100).toFixed(1)) : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <UtensilsCrossed size={20} className="text-amber-400" /> Recipe Bill of Materials (BOM) & Portion Costing Master
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure exact raw ingredient measurements per drink to compute live Cost of Goods Sold (COGS) and profit margins
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selector Sidebar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-sm h-[600px] flex flex-col">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Menu Products</h3>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {products.map((prod) => (
              <button
                key={prod.id}
                onClick={() => setSelectedProduct(prod)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition ${
                  selectedProduct?.id === prod.id
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                    : "bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-700/40"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Coffee size={15} />
                  <div>
                    <p className="text-xs">{prod.name}</p>
                    <p className={`text-[10px] ${selectedProduct?.id === prod.id ? "text-slate-900/80" : "text-slate-400"}`}>
                      {prod.recipes?.length || 0} ingredients
                    </p>
                  </div>
                </div>
                <span className="text-xs">${prod.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recipe Builder & Live Costing Box */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProduct && (
            <>
              {/* Product Live Economics Header Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Coffee size={18} className="text-amber-400" /> {selectedProduct.name} Recipe Formulation
                    </h2>
                    <p className="text-xs text-slate-400">SKU: {selectedProduct.sku} | Station: {selectedProduct.station}</p>
                  </div>
                  <span className="text-sm font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
                    Selling Price: ${sellingPrice.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total Portion COGS</p>
                    <p className="text-lg font-bold text-purple-400 mt-1">${totalRecipeCost.toFixed(3)}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Gross Profit / Serving</p>
                    <p className="text-lg font-bold text-emerald-400 mt-1">${profitUSD.toFixed(2)}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Gross Profit Margin</p>
                    <p className="text-lg font-bold text-emerald-400 mt-1">{profitMargin}%</p>
                  </div>
                </div>
              </div>

              {/* Bill of Materials Ingredient Table */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers size={16} className="text-amber-400" /> Base Recipe Bill of Materials
                  </h3>
                  <span className="text-[11px] text-slate-400">Atomic deduction per serving</span>
                </div>

                <div className="space-y-2.5">
                  {selectedProduct.recipes?.map((recipe: any, idx: number) => (
                    <div
                      key={recipe.id || idx}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{recipe.ingredientName}</p>
                        <p className="text-[10px] text-slate-400">
                          Unit: {recipe.unit} | Deduction: <span className="font-bold text-amber-400">{recipe.quantity} {recipe.unit}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-white">${recipe.costPerServing.toFixed(3)}</p>
                        <p className="text-[10px] text-slate-400">Ingredient Cost</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Modifier Rule Previews */}
                <div className="mt-5 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-400" /> Recursive Modifier Substitution Rules:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                      🥛 <strong className="text-slate-200">Oat Milk:</strong> Swaps 200ml Whole Milk for 200ml Oat Milk (+ $0.60 delta)
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                      🥤 <strong className="text-slate-200">Large Size:</strong> Replaces 12oz cup with 16oz cup + scales liquid by 1.35x
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                      🍬 <strong className="text-slate-200">0% Sugar:</strong> Omits 25ml Cane Sugar Syrup from inventory deduction
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                      🧊 <strong className="text-slate-200">No Ice:</strong> Omits 120g Ice Cubes deduction
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
