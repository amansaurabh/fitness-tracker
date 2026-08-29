"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Trash2,
  UtensilsCrossed,
  Settings,
  Check,
  Sparkles,
  ChevronDown,
  Calendar,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FoodItem {
  id?: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  source?: string;
}

interface FoodLogEntry {
  id: string;
  foodName: string;
  quantityG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  source: string;
  loggedAt: string;
}

interface DayHistoryItem {
  dateStr: string;
  dayName: string;
  formattedDate: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  adherenceScore: number;
}

export default function DietPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const todayStr = new Date().toISOString().split("T")[0];

  const [data, setData] = useState<{
    logs: FoodLogEntry[];
    plan: {
      dailyCalories: number;
      dailyProteinG: number;
      dailyCarbsG: number;
      dailyFatG: number;
      dailyFiberG: number;
    };
    totals: {
      calories: number;
      proteinG: number;
      carbsG: number;
      fatG: number;
      fiberG: number;
    };
    remaining: {
      calories: number;
      proteinG: number;
      carbsG: number;
      fatG: number;
      fiberG: number;
    };
    adherenceScore: number;
  } | null>(null);

  const [weekHistory, setWeekHistory] = useState<DayHistoryItem[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<{
    calories: number;
    adherence: number;
    loggedDays: number;
  }>({ calories: 0, adherence: 0, loggedDays: 0 });

  const [showWeeklyOverview, setShowWeeklyOverview] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantityG, setQuantityG] = useState("100");

  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isAddingCustomFood, setIsAddingCustomFood] = useState(false);

  // Edit plan state
  const [planForm, setPlanForm] = useState({
    dailyCalories: 2400,
    dailyProteinG: 160,
    dailyCarbsG: 240,
    dailyFatG: 65,
    dailyFiberG: 35,
  });

  // Custom food form state
  const [customForm, setCustomForm] = useState({
    name: "",
    caloriesPer100g: "",
    proteinPer100g: "",
    carbsPer100g: "",
    fatPer100g: "",
    fiberPer100g: "",
  });

  const fetchDietData = async (date: string) => {
    try {
      const [logRes, histRes] = await Promise.allSettled([
        fetch(`/api/diet/log?date=${date}`).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/diet/history?days=7").then((r) => (r.ok ? r.json() : null)),
      ]);

      if (logRes.status === "fulfilled" && logRes.value) {
        setData(logRes.value);
        if (logRes.value.plan) {
          setPlanForm({
            dailyCalories: logRes.value.plan.dailyCalories,
            dailyProteinG: logRes.value.plan.dailyProteinG,
            dailyCarbsG: logRes.value.plan.dailyCarbsG,
            dailyFatG: logRes.value.plan.dailyFatG,
            dailyFiberG: logRes.value.plan.dailyFiberG,
          });
        }
      }

      if (histRes.status === "fulfilled" && histRes.value) {
        setWeekHistory(histRes.value.history || []);
        if (histRes.value.weeklyAverage) {
          setWeeklyStats(histRes.value.weeklyAverage);
        }
      }
    } catch (err) {
      console.error("Failed to load diet data:", err);
    }
  };

  useEffect(() => {
    fetchDietData(selectedDate);
  }, [selectedDate]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const results = await res.json();
          setSearchResults(results);
        }
      } catch (err) {
        console.error("Food search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setQuantityG("100");
  };

  const handleLogFood = async () => {
    if (!selectedFood) return;
    const qty = parseFloat(quantityG) || 100;
    const factor = qty / 100;

    const entry = {
      foodName: selectedFood.name,
      quantityG: qty,
      calories: Math.round(selectedFood.caloriesPer100g * factor),
      proteinG: Math.round(selectedFood.proteinPer100g * factor * 10) / 10,
      carbsG: Math.round(selectedFood.carbsPer100g * factor * 10) / 10,
      fatG: Math.round(selectedFood.fatPer100g * factor * 10) / 10,
      fiberG: Math.round(selectedFood.fiberPer100g * factor * 10) / 10,
      source: selectedFood.source || "custom",
    };

    try {
      const res = await fetch("/api/diet/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });

      if (res.ok) {
        setSelectedFood(null);
        setSearchQuery("");
        setSearchResults([]);
        fetchDietData(selectedDate);
      }
    } catch (err) {
      console.error("Failed to log food:", err);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      const res = await fetch(`/api/diet/log?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchDietData(selectedDate);
      }
    } catch (err) {
      console.error("Failed to delete log:", err);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/diet/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planForm),
      });
      if (res.ok) {
        setIsEditingPlan(false);
        fetchDietData(selectedDate);
      }
    } catch (err) {
      console.error("Failed to save plan:", err);
    }
  };

  const handleSaveCustomFood = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/foods/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customForm),
      });
      if (res.ok) {
        const saved = await res.json();
        setIsAddingCustomFood(false);
        setCustomForm({
          name: "",
          caloriesPer100g: "",
          proteinPer100g: "",
          carbsPer100g: "",
          fatPer100g: "",
          fiberPer100g: "",
        });
        setSelectedFood({
          id: saved.id,
          name: saved.name,
          caloriesPer100g: Number(saved.caloriesPer100g),
          proteinPer100g: Number(saved.proteinPer100g),
          carbsPer100g: Number(saved.carbsPer100g),
          fatPer100g: Number(saved.fatPer100g),
          fiberPer100g: Number(saved.fiberPer100g),
          source: "custom",
        });
      }
    } catch (err) {
      console.error("Failed to save custom food:", err);
    }
  };

  // Generate 7-day selector array
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const str = d.toISOString().split("T")[0];
    return {
      dateStr: str,
      dayShort: d.toLocaleDateString("en-US", { weekday: "narrow" }),
      dayNum: d.getDate(),
      isToday: str === todayStr,
    };
  });

  const isViewingToday = selectedDate === todayStr;
  const totals = data?.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
  const plan = data?.plan ?? { dailyCalories: 2400, dailyProteinG: 160, dailyCarbsG: 240, dailyFatG: 65, dailyFiberG: 35 };
  const remaining = data?.remaining ?? { calories: 2400, proteinG: 160, carbsG: 240, fatG: 65, fiberG: 35 };
  const score = data?.adherenceScore ?? 0;

  return (
    <div className="w-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-[12px] text-lime font-semibold tracking-[0.08em] uppercase mb-0.5">
            Nutrition
          </div>
          <h1 className="font-space text-2xl font-bold text-text">Diet & Macros</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWeeklyOverview(!showWeeklyOverview)}
            className={cn(
              "flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-space font-medium border transition-colors",
              showWeeklyOverview
                ? "bg-lime text-bg border-lime shadow-glowLime/30"
                : "bg-surface border-border text-text-dim hover:text-text"
            )}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>7-Day History</span>
          </button>

          <button
            onClick={() => setIsEditingPlan(!isEditingPlan)}
            className="p-2 rounded-full bg-surface border border-border text-text-dim hover:text-text"
            title="Edit Daily Targets"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7-Day Day Selector Strip */}
      <div className="flex items-center justify-between gap-1.5 bg-surface border border-border rounded-2xl p-1.5 mb-5 shadow-sm">
        {last7Days.map((d) => {
          const isSelected = d.dateStr === selectedDate;
          return (
            <button
              key={d.dateStr}
              onClick={() => setSelectedDate(d.dateStr)}
              className={cn(
                "flex-1 flex flex-col items-center py-2 rounded-xl transition-all duration-200",
                isSelected
                  ? "bg-lime text-bg font-bold shadow-glowLime/30 scale-102"
                  : "text-text-dim hover:text-text hover:bg-white/5"
              )}
            >
              <span className="text-[10px] uppercase font-mono tracking-tight opacity-80">
                {d.dayShort}
              </span>
              <span className="text-xs font-space font-semibold mt-0.5">
                {d.dayNum}
              </span>
              {d.isToday && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-lime mt-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* 7-Day Past History Breakdown Card */}
      {showWeeklyOverview && (
        <div className="bg-surface-raised border border-lime/30 rounded-card-md p-5 mb-5 shadow-card animate-in fade-in">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] text-lime uppercase font-mono tracking-wider">
                Past 7 Days Analytics
              </span>
              <h3 className="font-space text-base font-bold text-text mt-0.5">
                Weekly Macro Overview
              </h3>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-text-dimmer uppercase">Weekly Avg</div>
              <div className="font-mono text-sm font-bold text-lime">
                {weeklyStats.calories} kcal/day
              </div>
            </div>
          </div>

          {/* Daily Mini Bars */}
          <div className="grid grid-cols-7 gap-2 my-2">
            {weekHistory.map((item, idx) => {
              const heightPct = plan.dailyCalories > 0 ? Math.min(100, Math.round((item.calories / plan.dailyCalories) * 100)) : 0;
              const isSelected = item.dateStr === selectedDate;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(item.dateStr)}
                  className="flex flex-col items-center group"
                >
                  <div className="text-[10px] font-mono text-text-dim mb-1">
                    {item.calories > 0 ? `${Math.round(item.calories / 100) / 10}k` : "-"}
                  </div>
                  <div className="w-full h-24 bg-white/5 rounded-lg relative overflow-hidden flex items-end p-1 border border-border group-hover:border-lime/40">
                    <div
                      className={cn(
                        "w-full rounded-md transition-all duration-500",
                        isSelected ? "bg-lime shadow-glowLime" : "bg-violet/70 group-hover:bg-violet"
                      )}
                      style={{ height: `${Math.max(8, heightPct)}%` }}
                    />
                  </div>
                  <span className={cn(
                    "text-[10px] font-mono uppercase mt-1.5",
                    isSelected ? "text-lime font-bold" : "text-text-dim"
                  )}>
                    {item.dayName}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex justify-between text-xs text-text-dim font-inter">
            <span>Logged {weeklyStats.loggedDays} of 7 days</span>
            <span className="font-mono text-text">Avg Adherence: <strong className="text-lime">{weeklyStats.adherence}%</strong></span>
          </div>
        </div>
      )}

      {/* Edit Target Plan Drawer */}
      {isEditingPlan && (
        <form
          onSubmit={handleSavePlan}
          className="bg-surface-raised border border-lime/30 rounded-card-md p-5 mb-5 shadow-glowLime/10"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-space text-base font-semibold text-text">
              Daily Target Plan
            </h3>
            <button
              type="button"
              onClick={() => setIsEditingPlan(false)}
              className="text-xs text-text-dim hover:text-text"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[11px] text-text-dim mb-1">Calories (kcal)</label>
              <input
                type="number"
                value={planForm.dailyCalories}
                onChange={(e) => setPlanForm({ ...planForm, dailyCalories: Number(e.target.value) })}
                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 font-mono text-sm text-text focus:outline-none focus:border-lime"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-dim mb-1">Protein (g)</label>
              <input
                type="number"
                value={planForm.dailyProteinG}
                onChange={(e) => setPlanForm({ ...planForm, dailyProteinG: Number(e.target.value) })}
                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 font-mono text-sm text-text focus:outline-none focus:border-lime"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-dim mb-1">Carbs (g)</label>
              <input
                type="number"
                value={planForm.dailyCarbsG}
                onChange={(e) => setPlanForm({ ...planForm, dailyCarbsG: Number(e.target.value) })}
                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 font-mono text-sm text-text focus:outline-none focus:border-lime"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-dim mb-1">Fat (g)</label>
              <input
                type="number"
                value={planForm.dailyFatG}
                onChange={(e) => setPlanForm({ ...planForm, dailyFatG: Number(e.target.value) })}
                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 font-mono text-sm text-text focus:outline-none focus:border-lime"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-full bg-lime text-bg font-space font-semibold text-xs shadow-glowLime"
          >
            Save Target Plan
          </button>
        </form>
      )}

      {/* Target vs Consumed Summary Card */}
      <div className="bg-gradient-to-br from-surface-raised to-surface rounded-card-md p-5 border border-border mb-5 relative overflow-hidden shadow-card">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-[11px] text-text-dim uppercase tracking-wider flex items-center gap-1.5">
              <span>{isViewingToday ? "Remaining Today" : `Intake for ${new Date(selectedDate + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}</span>
            </div>
            <div className="font-space text-3xl font-bold text-text mt-0.5">
              {isViewingToday ? remaining.calories : totals.calories}{" "}
              <span className="text-sm font-normal text-text-dim">
                {isViewingToday ? "kcal left" : `of ${plan.dailyCalories} kcal`}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] text-text-dimmer uppercase tracking-wider">
              Adherence
            </span>
            <span className="font-mono text-lg font-bold text-lime">
              {score}%
            </span>
          </div>
        </div>

        {/* Macro Progress Bars */}
        <div className="space-y-3 pt-2">
          {/* Protein */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-inter">
              <span className="text-text-dim flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-lime" /> Protein
              </span>
              <span className="font-mono text-text">
                {totals.proteinG} <span className="text-text-dimmer">/ {plan.dailyProteinG}g</span>
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-lime shadow-[0_0_8px_#CBFF4D] transition-all duration-500"
                style={{ width: `${Math.min(100, (totals.proteinG / (plan.dailyProteinG || 1)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-inter">
              <span className="text-text-dim flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-coral" /> Carbs
              </span>
              <span className="font-mono text-text">
                {totals.carbsG} <span className="text-text-dimmer">/ {plan.dailyCarbsG}g</span>
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-coral shadow-[0_0_8px_#FF6E52] transition-all duration-500"
                style={{ width: `${Math.min(100, (totals.carbsG / (plan.dailyCarbsG || 1)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Fat */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-inter">
              <span className="text-text-dim flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet" /> Fat
              </span>
              <span className="font-mono text-text">
                {totals.fatG} <span className="text-text-dimmer">/ {plan.dailyFatG}g</span>
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-violet shadow-[0_0_8px_#7B6CFF] transition-all duration-500"
                style={{ width: `${Math.min(100, (totals.fatG / (plan.dailyFatG || 1)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Food Search & Logging Section */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2.5">
          <label className="text-[12px] font-semibold tracking-[0.06em] uppercase text-text-dimmer ml-1">
            Log Food or Meal
          </label>
          <button
            onClick={() => setIsAddingCustomFood(!isAddingCustomFood)}
            className="text-xs font-mono text-lime hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Custom Recipe
          </button>
        </div>

        {/* Custom Recipe Modal */}
        {isAddingCustomFood && (
          <form
            onSubmit={handleSaveCustomFood}
            className="bg-surface-raised border border-coral/30 rounded-card-md p-4 mb-4 shadow-glowCoral/10"
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-space text-sm font-semibold text-text">
                Save Custom Food (per 100g)
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingCustomFood(false)}
                className="text-xs text-text-dim hover:text-text"
              >
                ✕
              </button>
            </div>

            <div className="mb-2.5">
              <input
                type="text"
                required
                placeholder="e.g. Roti with besan + soya flour"
                value={customForm.name}
                onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:border-lime"
              />
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3">
              <input
                type="number"
                placeholder="kcal"
                value={customForm.caloriesPer100g}
                onChange={(e) => setCustomForm({ ...customForm, caloriesPer100g: e.target.value })}
                className="bg-surface border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-center text-text focus:outline-none focus:border-lime"
              />
              <input
                type="number"
                placeholder="Protein"
                value={customForm.proteinPer100g}
                onChange={(e) => setCustomForm({ ...customForm, proteinPer100g: e.target.value })}
                className="bg-surface border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-center text-text focus:outline-none focus:border-lime"
              />
              <input
                type="number"
                placeholder="Carbs"
                value={customForm.carbsPer100g}
                onChange={(e) => setCustomForm({ ...customForm, carbsPer100g: e.target.value })}
                className="bg-surface border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-center text-text focus:outline-none focus:border-lime"
              />
              <input
                type="number"
                placeholder="Fat"
                value={customForm.fatPer100g}
                onChange={(e) => setCustomForm({ ...customForm, fatPer100g: e.target.value })}
                className="bg-surface border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-center text-text focus:outline-none focus:border-lime"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-full bg-coral text-bg font-space font-semibold text-xs shadow-glowCoral"
            >
              Save Custom Food
            </button>
          </form>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search foods (e.g. chicken, egg, rice, paneer)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-card-sm pl-10 pr-4 py-3 text-sm text-text placeholder:text-text-dimmer focus:outline-none focus:border-lime transition-colors"
          />
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-2 bg-surface-raised border border-border rounded-card-sm overflow-hidden shadow-2xl max-h-60 overflow-y-auto">
            {searchResults.map((food, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectFood(food)}
                className="w-full text-left p-3 border-b border-border/50 hover:bg-white/5 flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="text-xs font-medium text-text">{food.name}</div>
                  <div className="text-[11px] font-mono text-text-dim mt-0.5">
                    {food.caloriesPer100g} kcal · P: {food.proteinPer100g}g · C: {food.carbsPer100g}g · F: {food.fatPer100g}g (per 100g)
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase text-text-dimmer bg-white/5 px-2 py-0.5 rounded">
                  {food.source}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Selected Food Log Drawer */}
        {selectedFood && (
          <div className="mt-3 bg-surface border border-lime/30 rounded-card-sm p-4 animate-in fade-in">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] text-lime font-mono uppercase tracking-wider">
                  Selected Item
                </span>
                <h4 className="font-space text-sm font-semibold text-text">
                  {selectedFood.name}
                </h4>
              </div>
              <button
                onClick={() => setSelectedFood(null)}
                className="text-xs text-text-dim hover:text-text"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 my-3">
              <div className="flex-1">
                <label className="block text-[11px] text-text-dim mb-1">Quantity (grams)</label>
                <input
                  type="number"
                  value={quantityG}
                  onChange={(e) => setQuantityG(e.target.value)}
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 font-mono text-sm text-text focus:outline-none focus:border-lime"
                />
              </div>

              <div className="flex-1 text-right">
                <div className="text-[11px] text-text-dim mb-1">Total Macros</div>
                <div className="font-mono text-xs text-text">
                  {Math.round(selectedFood.caloriesPer100g * ((parseFloat(quantityG) || 0) / 100))} kcal
                </div>
                <div className="font-mono text-[11px] text-text-dimmer">
                  P: {Math.round(selectedFood.proteinPer100g * ((parseFloat(quantityG) || 0) / 100))}g · C: {Math.round(selectedFood.carbsPer100g * ((parseFloat(quantityG) || 0) / 100))}g
                </div>
              </div>
            </div>

            <button
              onClick={handleLogFood}
              className="w-full py-2 rounded-full bg-lime text-bg font-space font-semibold text-xs shadow-glowLime"
            >
              Confirm Log for {isViewingToday ? "Today" : selectedDate}
            </button>
          </div>
        )}
      </div>

      {/* Logged Foods List for Selected Day */}
      <div>
        <div className="text-[12px] font-semibold tracking-[0.06em] uppercase text-text-dimmer mb-3 ml-1 flex justify-between items-center">
          <span>{isViewingToday ? "Logged Today" : `Logged on ${new Date(selectedDate + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`} ({data?.logs.length || 0})</span>
          {!isViewingToday && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="text-xs text-lime font-mono hover:underline"
            >
              Jump to Today →
            </button>
          )}
        </div>

        {data?.logs && data.logs.length > 0 ? (
          <div className="space-y-2 mb-6">
            {data.logs.map((log) => (
              <div
                key={log.id}
                className="bg-surface border border-border rounded-card-sm p-3.5 flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-text">
                    {log.foodName}{" "}
                    <span className="font-mono text-text-dim font-normal">
                      ({Number(log.quantityG)}g)
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-text-dim mt-0.5">
                    {Number(log.calories)} kcal · P: {Number(log.proteinG)}g · C: {Number(log.carbsG)}g · F: {Number(log.fatG)}g
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteLog(log.id)}
                  className="text-text-dimmer hover:text-coral p-1 transition-colors"
                  title="Delete log"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface/50 border border-border rounded-card-sm p-6 text-center text-xs text-text-dim mb-6">
            No food entries logged for this date. Use the search bar above to log your meals.
          </div>
        )}
      </div>
    </div>
  );
}
