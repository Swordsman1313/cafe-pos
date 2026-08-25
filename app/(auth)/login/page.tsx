"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, ShieldCheck, KeyRound, Lock, Store, ArrowRight, Sparkles, UserCheck, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"PIN" | "PASSWORD">("PIN");
  const [storeId, setStoreId] = useState("store-bkk1");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("owner@artisanroast.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePinDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(null);
      if (nextPin.length === 4) {
        submitPinLogin(nextPin);
      }
    }
  };

  const handlePinDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handlePinClear = () => {
    setPin("");
    setError(null);
  };

  const submitPinLogin = async (pinValue = pin) => {
    if (!pinValue || pinValue.length < 4) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinValue, storeId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid PIN");
      }

      localStorage.setItem("pos_token", data.token);
      localStorage.setItem("pos_session", JSON.stringify(data.user));
      localStorage.setItem("pos_store", JSON.stringify(data.store));

      router.push(data.redirectTo || "/pos");
    } catch (err: any) {
      setError(err.message || "Login failed");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const submitPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, storeId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid credentials");
      }

      localStorage.setItem("pos_token", data.token);
      localStorage.setItem("pos_session", JSON.stringify(data.user));
      localStorage.setItem("pos_store", JSON.stringify(data.store));

      router.push(data.redirectTo || "/admin");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const setDemoRole = (role: "CASHIER" | "BARISTA" | "OWNER") => {
    setError(null);
    if (role === "OWNER") {
      setAuthMode("PASSWORD");
      setEmail("owner@artisanroast.com");
      setPassword("admin123");
    } else {
      setAuthMode("PIN");
      setPin("1234");
      submitPinLogin("1234");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-white shadow-lg shadow-amber-500/20 mb-3">
            <Coffee size={30} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Artisan Roast Café</h1>
          <p className="text-xs text-slate-400 mt-1">Specialty POS & Enterprise Management Portal</p>
        </div>

        {/* Store Branch Selector (#4) */}
        <div className="mb-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-sm">
          <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
            <Store size={13} className="text-amber-400" /> Active Store Branch
          </label>
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="store-bkk1">📍 BKK1 Flagship (Phnom Penh)</option>
            <option value="store-ttp">📍 Toul Tom Poung Branch (Russian Market)</option>
            <option value="store-airport">📍 Phnom Penh Airport Kiosk (+15% Tier)</option>
          </select>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 mb-5">
          <button
            type="button"
            onClick={() => { setAuthMode("PIN"); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
              authMode === "PIN" ? "bg-amber-500 text-slate-950 shadow-md font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <KeyRound size={14} /> Quick Staff PIN
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode("PASSWORD"); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
              authMode === "PASSWORD" ? "bg-amber-500 text-slate-950 shadow-md font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={14} /> Management Login
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Card Body */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
          {authMode === "PIN" ? (
            <div>
              <div className="text-center mb-4">
                <p className="text-xs text-slate-400">Enter your 4-digit staff PIN</p>
                {/* Masked PIN Indicator */}
                <div className="flex justify-center gap-3 mt-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`h-4 w-4 rounded-full border transition-all duration-150 ${
                        pin.length > idx
                          ? "bg-amber-400 border-amber-400 shadow-md shadow-amber-400/40 scale-110"
                          : "border-slate-700 bg-slate-800"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto mb-4">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handlePinDigit(num)}
                    disabled={loading}
                    className="h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-lg font-bold text-white hover:bg-amber-500 hover:text-slate-950 hover:border-amber-400 active:scale-95 transition"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handlePinClear}
                  className="h-14 rounded-2xl bg-slate-800/40 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white active:scale-95 transition"
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={() => handlePinDigit("0")}
                  disabled={loading}
                  className="h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-lg font-bold text-white hover:bg-amber-500 hover:text-slate-950 active:scale-95 transition"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handlePinDelete}
                  className="h-14 rounded-2xl bg-slate-800/40 border border-slate-800 text-sm font-semibold text-slate-400 hover:text-white active:scale-95 transition"
                >
                  ⌫
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submitPasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Management Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="owner@artisanroast.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-xs font-bold text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 active:scale-95 transition"
              >
                {loading ? "Authenticating..." : "Sign In to Back-of-House"} <ArrowRight size={14} />
              </button>
            </form>
          )}

          {/* Demo Quick Logins */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-400" /> One-Tap Demo Roles:
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setDemoRole("CASHIER")}
                className="py-1.5 px-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-lg text-[10px] font-medium text-slate-300 transition text-center"
              >
                ☕ Cashier (1234)
              </button>
              <button
                type="button"
                onClick={() => setDemoRole("BARISTA")}
                className="py-1.5 px-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-lg text-[10px] font-medium text-slate-300 transition text-center"
              >
                🫘 Barista KDS
              </button>
              <button
                type="button"
                onClick={() => setDemoRole("OWNER")}
                className="py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-[10px] font-medium text-amber-300 transition text-center"
              >
                👑 Owner BOH
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
