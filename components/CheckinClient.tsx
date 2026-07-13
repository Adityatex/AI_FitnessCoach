"use client";

import { submitDailyCheckin } from "@/app/checkin/actions";
import { ArrowLeft, Check, Clipboard, Dumbbell, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface CheckinClientProps {
  latestPlan: any;
  profile: any;
}

export default function CheckinClient({ latestPlan, profile }: CheckinClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current date in YYYY-MM-DD format
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getTodayString());
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  let workoutDays: any[] = [];
  try {
    workoutDays = JSON.parse(latestPlan?.workoutPlan || "[]");
  } catch (e) {}

  const currentWorkoutDay = workoutDays[selectedDayIndex];

  // Initialize exercise logs state based on the selected workout day
  const getInitialExerciseLogs = (day: any) => {
    if (!day) return [];
    const lifts = [...(day.main_lifts || []), ...(day.accessory_lifts || [])];
    return lifts.map((lift: any) => {
      const setsCount = parseInt(lift.sets) || 3;
      const repsCount = parseInt(lift.reps) || 8;
      const actual_sets = Array.from({ length: setsCount }, (_, i) => ({
        set_num: i + 1,
        reps: repsCount,
        weight_kg: 0,
        rpe: 7,
      }));
      return {
        name: lift.exercise,
        target: lift.target,
        actual_sets,
      };
    });
  };

  const [exerciseLogs, setExerciseLogs] = useState<any[]>(
    workoutDays.length > 0 ? getInitialExerciseLogs(workoutDays[0]) : []
  );

  const handleWorkoutDayChange = (idx: number) => {
    setSelectedDayIndex(idx);
    setExerciseLogs(getInitialExerciseLogs(workoutDays[idx]));
  };

  const handleSetChange = (exIdx: number, setIdx: number, field: string, val: any) => {
    setExerciseLogs((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exIdx] };
      const sets = [...ex.actual_sets];
      sets[setIdx] = { ...sets[setIdx], [field]: val };
      ex.actual_sets = sets;
      updated[exIdx] = ex;
      return updated;
    });
  };

  // Nutrition & Recovery Logs
  const [mealsLogged, setMealsLogged] = useState(profile.mealsPerDay || 4);
  const [estKcal, setEstKcal] = useState(2500);
  const [sleepHours, setSleepHours] = useState(8);
  const [soreness, setSoreness] = useState(3);
  const [stress, setStress] = useState(3);

  // Pain / Injury tracking
  const [hasPain, setHasPain] = useState(false);
  const [painJoint, setPainJoint] = useState("Lower Back");
  const [painDesc, setPainDesc] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    // Format pain flag
    const painFlag = hasPain ? { joint: painJoint, description: painDesc } : null;

    const checkinData = {
      date,
      sessionCompleted,
      exercisesLogged: sessionCompleted ? exerciseLogs : [],
      mealsLogged,
      mealsPlanned: profile.mealsPerDay || 4,
      estKcal,
      targetKcal: 2500, // Will be overridden on server
      sleepHours,
      soreness1to10: soreness,
      stress1to10: stress,
      painFlag,
      notes,
    };

    const res = await submitDailyCheckin(checkinData);
    if (res?.error) {
      setError(res.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center text-gray-500 hover:text-gray-900 text-sm font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
          </Link>
          <span className="text-xs font-bold bg-blue-50 text-brand py-1 px-3 border border-blue-100 rounded-full">
            Daily Logger
          </span>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-md space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">Daily Log</h1>
            <p className="text-sm text-gray-500 mt-1">Record your workout, nutrition, and recovery stats to track progress.</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            
            {/* Date selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Log Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-medium text-gray-700"
                />
              </div>

              {/* Workout Completed Toggle */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Did you workout today?
                </label>
                <div className="flex p-0.5 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSessionCompleted(true)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                      sessionCompleted
                        ? "bg-white text-gray-900 shadow-sm border border-gray-200/50"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Yes, completed session
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionCompleted(false)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                      !sessionCompleted
                        ? "bg-white text-gray-900 shadow-sm border border-gray-200/50"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    No workout
                  </button>
                </div>
              </div>
            </div>

            {/* IF WORKOUT COMPLETED: EXERCISE LOGGER */}
            {sessionCompleted && workoutDays.length > 0 && (
              <div className="p-4 sm:p-5 bg-blue-50/20 border border-blue-100/50 rounded-2xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <Dumbbell className="w-5 h-5 text-brand shrink-0" />
                    <span className="font-extrabold text-sm text-gray-900">Workout Exercise Logger</span>
                  </div>
                  
                  {/* Select which day to log */}
                  <select
                    value={selectedDayIndex}
                    onChange={(e) => handleWorkoutDayChange(parseInt(e.target.value))}
                    className="px-2.5 py-1.5 bg-white border border-gray-250 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    {workoutDays.map((day, idx) => (
                      <option key={idx} value={idx}>
                        {day.day_label || `Day ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Exercises list */}
                <div className="space-y-4 pt-1">
                  {exerciseLogs.map((log, exIdx) => (
                    <div key={exIdx} className="bg-white p-4 rounded-xl border border-gray-150 space-y-3 shadow-sm">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <span className="font-bold text-sm text-gray-950">{log.name}</span>
                        <span className="text-[10px] font-bold bg-blue-50 text-brand py-0.5 px-2 rounded-full border border-blue-100">
                          Target: {log.target}
                        </span>
                      </div>

                      {/* Set rows headers */}
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <span>Set</span>
                        <span>Weight (kg)</span>
                        <span>Reps</span>
                        <span>RPE</span>
                      </div>

                      {/* Set rows */}
                      {log.actual_sets.map((set: any, setIdx: number) => (
                        <div key={setIdx} className="grid grid-cols-4 gap-2 text-center items-center text-sm font-semibold">
                          <span className="text-gray-400">#{set.set_num}</span>
                          <input
                            type="number"
                            value={set.weight_kg || ""}
                            onChange={(e) => handleSetChange(exIdx, setIdx, "weight_kg", parseFloat(e.target.value) || 0)}
                            placeholder="kg"
                            className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-center text-xs focus:outline-none focus:ring-1 focus:ring-brand font-bold text-gray-800"
                          />
                          <input
                            type="number"
                            value={set.reps || ""}
                            onChange={(e) => handleSetChange(exIdx, setIdx, "reps", parseInt(e.target.value) || 0)}
                            placeholder="reps"
                            className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-center text-xs focus:outline-none focus:ring-1 focus:ring-brand font-bold text-gray-800"
                          />
                          <select
                            value={set.rpe}
                            onChange={(e) => handleSetChange(exIdx, setIdx, "rpe", parseInt(e.target.value))}
                            className="px-1.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center text-xs focus:outline-none focus:ring-1 focus:ring-brand font-bold text-gray-700"
                          >
                            {[6, 7, 8, 9, 10].map((num) => (
                              <option key={num} value={num}>RPE {num}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NUTRITION LOGS */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Meals Logged
                </label>
                <input
                  type="number"
                  value={mealsLogged}
                  onChange={(e) => setMealsLogged(parseInt(e.target.value) || 0)}
                  placeholder="4"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Calories Consumed (Estimated kcal)
                </label>
                <input
                  type="number"
                  value={estKcal}
                  onChange={(e) => setEstKcal(parseFloat(e.target.value) || 0)}
                  placeholder="2500"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
            </div>

            {/* RECOVERY LOGS */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Sleep (Hours)
                </label>
                <input
                  type="number"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(parseFloat(e.target.value) || 0)}
                  placeholder="8"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Soreness (1-10)
                </label>
                <select
                  value={soreness}
                  onChange={(e) => setSoreness(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-semibold text-gray-700"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n} - {n <= 3 ? "Light" : n <= 7 ? "Moderate" : "Severe"}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Stress (1-10)
                </label>
                <select
                  value={stress}
                  onChange={(e) => setStress(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-semibold text-gray-700"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n} - {n <= 3 ? "Low" : n <= 7 ? "Moderate" : "High"}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* PAIN / INJURY REPORT FLAG */}
            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-3.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1.5 text-amber-800">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Report Joint Pain or Injury</span>
                </div>

                <div className="flex p-0.5 bg-amber-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setHasPain(true)}
                    className={`px-3 py-1 text-[10px] font-extrabold rounded-md uppercase transition-all duration-200 ${
                      hasPain ? "bg-amber-600 text-white shadow-sm" : "text-amber-800 hover:text-amber-900"
                    }`}
                  >
                    Pain
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasPain(false)}
                    className={`px-3 py-1 text-[10px] font-extrabold rounded-md uppercase transition-all duration-200 ${
                      !hasPain ? "bg-white text-gray-700 shadow-sm" : "text-amber-800 hover:text-amber-900"
                    }`}
                  >
                    None
                  </button>
                </div>
              </div>

              {hasPain && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-800 uppercase mb-1">Affected Joint/Region</label>
                    <select
                      value={painJoint}
                      onChange={(e) => setPainJoint(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-250 rounded-xl text-xs font-semibold text-gray-750 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      {["Shoulder", "Lower Back", "Knee", "Wrist", "Hip", "Ankle", "Neck"].map((joint) => (
                        <option key={joint} value={joint}>{joint}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-amber-800 uppercase mb-1">Describe Pain (sharp/dull, movement triggers)</label>
                    <textarea
                      rows={2}
                      value={painDesc}
                      onChange={(e) => setPainDesc(e.target.value)}
                      placeholder="e.g. Dull ache when squatting below parallel, starts around set 3"
                      className="w-full p-2 bg-white border border-amber-250 rounded-xl text-xs placeholder-amber-600/40 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* GENERAL DAILY NOTES */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                General Daily Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Felt highly energetic, increased Squat weight by 2.5kg, body feels strong."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-medium text-gray-700"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-100 font-semibold">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white font-bold rounded-full shadow-md transition-all duration-200 flex items-center justify-center text-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="flex items-center space-x-1">
                  <Check className="w-4 h-4" />
                  <span>Submit Daily Log</span>
                </div>
              )}
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}
