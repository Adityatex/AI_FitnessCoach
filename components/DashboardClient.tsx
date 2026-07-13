"use client";

import { logoutAction } from "@/app/auth/actions";
import { advanceWeek } from "@/app/dashboard/actions";
import ProgressCharts from "@/components/ProgressCharts";
import { 
  Activity, 
  Calendar, 
  Clipboard, 
  Dumbbell, 
  LogOut, 
  PlusCircle, 
  Sparkles, 
  TrendingUp, 
  Utensils,
  User
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

interface DashboardClientProps {
  user: any;
  profile: any;
  weeklyPlans: any[];
  dailyCheckins: any[];
}

export default function DashboardClient({ user, profile, weeklyPlans, dailyCheckins }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"workout" | "meals" | "charts">("workout");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const currentPlan = weeklyPlans[weeklyPlans.length - 1];
  
  let workoutDays: any[] = [];
  let mealPlan: any = {};
  
  if (currentPlan) {
    try {
      workoutDays = JSON.parse(currentPlan.workoutPlan || "[]");
      mealPlan = JSON.parse(currentPlan.mealPlan || "{}");
    } catch (e) {
      console.error("Failed to parse plans", e);
    }
  }

  const handleAdvanceWeek = () => {
    if (confirm("Are you sure you want to end this week and generate your adapted plan for next week?")) {
      setError(null);
      startTransition(async () => {
        const res = await advanceWeek();
        if (res?.error) {
          setError(res.error);
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-150 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-brand">
              <Dumbbell className="w-5 h-5" />
            </div>
            <span className="font-bold text-gray-900 text-lg">Coach Atlas</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs font-semibold bg-blue-50 text-brand py-1 px-3 rounded-full border border-blue-100 capitalize">
              {profile.primaryGoal.replace("_", " ")}
            </span>
            <form action={logoutAction}>
              <button 
                type="submit" 
                className="text-gray-500 hover:text-red-600 transition-colors flex items-center space-x-1 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Hero Welcome Row */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, Athlete!</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Let's keep crushing it. You are currently on Week {currentPlan?.weekNumber || 1} of your program.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
            <Link
              href="/checkin"
              className="flex-1 md:flex-none py-3 px-5 bg-brand hover:bg-brand-hover text-white text-center text-sm font-bold rounded-full shadow-sm flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Daily Check-In</span>
            </Link>

            <button
              onClick={handleAdvanceWeek}
              disabled={isPending}
              className="flex-1 md:flex-none py-3 px-5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-full flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-brand" />
              )}
              <span>{isPending ? "Adapting Plan..." : "Advance to Next Week"}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 text-sm bg-red-50 text-red-600 rounded-xl border border-red-100 font-medium">
            {error}
          </div>
        )}

        {/* Coach Reasoning / Adjustment Banner */}
        {currentPlan && currentPlan.classification && (
          <div className="mt-4 p-5 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-brand shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-gray-900 text-sm">Coach Atlas Feedback</h3>
                <span className="text-[10px] font-bold bg-blue-100 text-brand py-0.5 px-2 rounded-full border border-blue-200/50 uppercase tracking-wide">
                  {currentPlan.classification.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1 italic font-medium leading-relaxed">
                "{currentPlan.claudeReasoning || "No comments from coach."}"
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Main Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Program Tabs & Details (Spans 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tab buttons */}
          <div className="flex p-1 bg-white border border-gray-150 rounded-2xl shadow-sm">
            <button
              onClick={() => setActiveTab("workout")}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 ${
                activeTab === "workout"
                  ? "bg-brand text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-950"
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              <span>Workout Program</span>
            </button>
            <button
              onClick={() => setActiveTab("meals")}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 ${
                activeTab === "meals"
                  ? "bg-brand text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-950"
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Meal Plan</span>
            </button>
            <button
              onClick={() => setActiveTab("charts")}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 ${
                activeTab === "charts"
                  ? "bg-brand text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-950"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Progress & Analytics</span>
            </button>
          </div>

          {/* TAB 1: WORKOUT PROGRAM */}
          {activeTab === "workout" && (
            <div className="space-y-4">
              {workoutDays.map((day, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-lg">{day.day_label || `Day ${idx + 1}`}</h3>
                    <Link
                      href={`/plan?day=${idx}`}
                      className="text-xs font-bold text-brand hover:underline flex items-center"
                    >
                      View Details &rarr;
                    </Link>
                  </div>

                  {/* Warm Up */}
                  {day.warm_up && day.warm_up.length > 0 && (
                    <div className="text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-150 space-y-1">
                      <span className="font-bold text-gray-400 uppercase tracking-wider block">Warm Up Routine</span>
                      <p className="text-gray-600 font-medium">{day.warm_up.join(" • ")}</p>
                    </div>
                  )}

                  {/* Main Lifts Summary */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Main & Accessory Lifts</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[...(day.main_lifts || []), ...(day.accessory_lifts || [])].map((lift: any, lIdx: number) => (
                        <div key={lIdx} className="p-3 bg-gray-50/50 rounded-xl border border-gray-150 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-sm text-gray-800">{lift.exercise}</span>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {lift.sets} sets x {lift.reps} reps
                            </div>
                          </div>
                          <span className="text-xs font-semibold bg-blue-50 text-brand py-1 px-2.5 rounded-lg border border-blue-100/50">
                            {lift.target}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coach Notes */}
                  {day.coaching_notes && (
                    <div className="text-xs border-t border-gray-100 pt-3 text-gray-500">
                      <strong className="text-gray-700">Coach Notes: </strong>
                      {day.coaching_notes}
                    </div>
                  )}
                </div>
              ))}
              {workoutDays.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-500 font-medium">
                  No workout plan generated yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MEAL PLAN */}
          {activeTab === "meals" && (
            <div className="space-y-4">
              {/* Daily Macros Targets */}
              {mealPlan.daily_kcal_target && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-blue-50 border border-blue-100/50 rounded-2xl">
                    <span className="text-[10px] font-bold text-brand uppercase tracking-wider">Calories</span>
                    <div className="text-xl sm:text-2xl font-black text-gray-900 mt-1">{mealPlan.daily_kcal_target}</div>
                    <span className="text-[10px] text-gray-400">kcal/day</span>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-100/50 rounded-2xl">
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Protein</span>
                    <div className="text-xl sm:text-2xl font-black text-gray-900 mt-1">{mealPlan.protein_g}g</div>
                    <span className="text-[10px] text-gray-400">Target</span>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-100/50 rounded-2xl">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Carbs</span>
                    <div className="text-xl sm:text-2xl font-black text-gray-900 mt-1">{mealPlan.carbs_g}g</div>
                    <span className="text-[10px] text-gray-400">Target</span>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-100/50 rounded-2xl">
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Fats</span>
                    <div className="text-xl sm:text-2xl font-black text-gray-900 mt-1">{mealPlan.fat_g}g</div>
                    <span className="text-[10px] text-gray-400">Target</span>
                  </div>
                </div>
              )}

              {/* Shopping List */}
              {mealPlan.shopping_list && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                  <h3 className="font-bold text-gray-900 text-lg flex items-center space-x-2">
                    <Clipboard className="w-5 h-5 text-brand" />
                    <span>Weekly Shopping List</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {Object.entries(mealPlan.shopping_list).map(([category, items]: any) => (
                      <div key={category} className="p-4 bg-gray-50 rounded-2xl border border-gray-150">
                        <span className="font-bold text-xs text-gray-400 uppercase tracking-wider capitalize block mb-2">{category}</span>
                        <ul className="space-y-1.5 font-medium text-gray-700">
                          {items.map((item: string, iIdx: number) => (
                            <li key={iIdx} className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-brand rounded-full mt-1.5 mr-2 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Daily Meal Schedule */}
              {mealPlan.days && mealPlan.days.map((day: any, idx: number) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                  <h3 className="font-bold text-gray-900 text-lg">{day.day} Meal Schedule</h3>
                  
                  <div className="space-y-3">
                    {day.meals.map((meal: any, mIdx: number) => (
                      <div key={mIdx} className="p-4 bg-gray-50/50 rounded-xl border border-gray-150 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div>
                          <span className="font-bold text-sm text-gray-800">{meal.name}</span>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed font-medium">
                            {meal.items}
                          </p>
                        </div>
                        <div className="flex gap-2 text-center text-[10px] font-bold tracking-wide shrink-0">
                          <span className="bg-blue-50 border border-blue-100 text-brand px-2 py-1 rounded-md">
                            {meal.kcal} kcal
                          </span>
                          <span className="bg-red-50 border border-red-100 text-red-600 px-2 py-1 rounded-md">
                            {meal.protein_g}g P
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: PROGRESS & ANALYTICS */}
          {activeTab === "charts" && (
            <ProgressCharts 
              weeklyPlans={weeklyPlans} 
              dailyCheckins={dailyCheckins} 
              daysPerWeek={profile.daysPerWeek} 
            />
          )}

        </div>

        {/* Right Side Sidebar: Details & Streaks (Spans 1 column) */}
        <div className="space-y-6">
          
          {/* Athlete Profile Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-base flex items-center space-x-2">
              <User className="w-5 h-5 text-brand" />
              <span>Athlete Profile</span>
            </h3>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="text-gray-400 font-medium">Age / Sex</span>
                <span className="font-bold text-gray-800 capitalize">{profile.age} yrs / {profile.sex}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="text-gray-400 font-medium">Weight / Height</span>
                <span className="font-bold text-gray-800">{profile.weightKg} kg / {profile.heightCm} cm</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="text-gray-400 font-medium">Experience Level</span>
                <span className="font-bold text-gray-800 capitalize">{profile.experienceLevel}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="text-gray-400 font-medium">Frequency</span>
                <span className="font-bold text-gray-800">{profile.daysPerWeek} Days / Week</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="text-gray-400 font-medium">Session Budget</span>
                <span className="font-bold text-gray-800">{profile.sessionLengthMin} Mins</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-gray-400 font-medium">Training Location</span>
                <span className="font-bold text-gray-800 capitalize">{profile.trainingLocation}</span>
              </div>
            </div>
          </div>

          {/* Calorie Adherence Quick Stats */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-base flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-brand" />
              <span>Nutrition Overview</span>
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 text-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Recommended Intake</span>
                <span className="text-2xl font-black text-gray-950 block mt-1">
                  {mealPlan.daily_kcal_target || 2500} kcal
                </span>
                <span className="text-[10px] text-gray-500 font-medium mt-0.5 block">
                  P: {mealPlan.protein_g || 120}g • C: {mealPlan.carbs_g || 300}g • F: {mealPlan.fat_g || 70}g
                </span>
              </div>

              <div className="space-y-2 text-xs text-gray-500 leading-relaxed font-medium">
                <p>💡 <strong className="text-gray-700">Dietary Restrictions: </strong>{JSON.parse(profile.dietaryRestrictions || "[]").join(", ") || "None"}</p>
                <p>⚠️ <strong className="text-gray-700">Allergies: </strong>{JSON.parse(profile.allergies || "[]").join(", ") || "None"}</p>
              </div>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
