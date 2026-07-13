"use client";

import { submitOnboarding } from "@/app/onboarding/actions";
import { 
  ArrowLeft, 
  Check, 
  Dumbbell, 
  Flame, 
  Heart, 
  ShieldAlert, 
  Sparkles, 
  TrendingUp, 
  User 
} from "lucide-react";
import { useState } from "react";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    primaryGoal: "muscle_gain",
    targetTimeframeWeeks: 12,
    experienceLevel: "intermediate",
    age: "25",
    sex: "male",
    heightCm: "175",
    weightKg: "70",
    bodyFatPct: "",
    activityLevel: "moderately_active",
    trainingLocation: "gym",
    equipment: ["barbell", "dumbbells", "machines"],
    daysPerWeek: 4,
    sessionLengthMin: 60,
    dietaryRestrictions: ["none"],
    allergies: "",
    mealsPerDay: 4,
    cookingTimeBudgetMin: 30,
    currentInjuries: [] as string[],
    pastInjuries: [] as string[],
    injuryDetails: "",
    medicalConditions: [] as string[],
    doctorClearance: "n/a",
  });

  const nextStep = () => {
    if (step === 2) {
      if (!formData.age || !formData.heightCm || !formData.weightKg) {
        setError("Please fill out all biometric fields.");
        return;
      }
    }
    setError(null);
    setStep((prev) => Math.min(prev + 1, 6));
  };

  const prevStep = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleGoalSelect = (goal: string) => {
    setFormData((prev) => ({ ...prev, primaryGoal: goal }));
  };

  const handleToggleEquipment = (item: string) => {
    setFormData((prev) => {
      const eq = [...prev.equipment];
      if (eq.includes(item)) {
        return { ...prev, equipment: eq.filter((x) => x !== item) };
      } else {
        return { ...prev, equipment: [...eq, item] };
      }
    });
  };

  const handleToggleDietary = (item: string) => {
    setFormData((prev) => {
      const diet = [...prev.dietaryRestrictions];
      if (item === "none") {
        return { ...prev, dietaryRestrictions: ["none"] };
      }
      let filtered = diet.filter((x) => x !== "none");
      if (filtered.includes(item)) {
        if (filtered.length === 1) {
          filtered = ["none"];
        } else {
          filtered = filtered.filter((x) => x !== item);
        }
      } else {
        filtered.push(item);
      }
      return { ...prev, dietaryRestrictions: filtered };
    });
  };

  const handleToggleInjury = (joint: string) => {
    setFormData((prev) => {
      const current = [...prev.currentInjuries];
      if (current.includes(joint)) {
        return { ...prev, currentInjuries: current.filter((x) => x !== joint) };
      } else {
        return { ...prev, currentInjuries: [...current, joint] };
      }
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    
    // Combine injuryDetails into injuries arrays for saving
    const combinedData = {
      ...formData,
      currentInjuries: formData.currentInjuries.length > 0 
        ? formData.currentInjuries.map(j => `${j}: ${formData.injuryDetails || "no description"}`) 
        : [],
      pastInjuries: formData.pastInjuries,
      allergies: formData.allergies ? [formData.allergies] : [],
      medicalConditions: formData.medicalConditions,
    };

    const res = await submitOnboarding(combinedData);
    if (res?.error) {
      setError(res.error);
      setIsSubmitting(false);
    }
  };

  const goals = [
    { id: "muscle_gain", title: "Muscle Gain", desc: "Build strength and size", icon: Dumbbell },
    { id: "fat_loss", title: "Fat Loss", desc: "Lean out while keeping muscle", icon: Flame },
    { id: "general_fitness", title: "General Fitness", desc: "Feel better, move better", icon: Heart },
    { id: "endurance", title: "Endurance", desc: "Improve stamina and conditioning", icon: TrendingUp },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4 font-sans">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
        
        {/* Top Header & Progress */}
        <div className="flex flex-col mb-6">
          <div className="flex justify-between items-center mb-4">
            {step > 1 ? (
              <button onClick={prevStep} className="flex items-center text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </button>
            ) : (
              <div className="w-10" />
            )}
            <span className="text-xs font-bold text-brand uppercase tracking-widest">
              STEP {step} OF 6
            </span>
            <div className="w-10" />
          </div>

          {/* Progress Indicators */}
          <div className="flex gap-1.5 h-1.5 w-full">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div 
                key={num} 
                className={`flex-1 rounded-full transition-all duration-300 ${
                  num <= step ? "bg-brand" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Dynamic Form Content */}
        <div className="min-h-[380px] flex flex-col justify-between">
          
          {/* STEP 1: GOALS & TIMELINE */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">What's your main goal?</h2>
                <p className="text-sm text-gray-500">This shapes everything — your workouts, meals, and how we track progress.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {goals.map((g) => {
                  const Icon = g.icon;
                  const isSelected = formData.primaryGoal === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => handleGoalSelect(g.id)}
                      className={`flex items-center p-4 border rounded-xl text-left transition-all duration-200 ${
                        isSelected 
                          ? "border-brand bg-blue-50/50 ring-2 ring-brand/10 text-brand" 
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                        isSelected ? "bg-blue-100 text-brand" : "bg-gray-100 text-gray-500"
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{g.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{g.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Timeline (Weeks)
                  </label>
                  <select 
                    value={formData.targetTimeframeWeeks}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetTimeframeWeeks: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  >
                    <option value={6}>6 Weeks</option>
                    <option value={8}>8 Weeks</option>
                    <option value={12}>12 Weeks</option>
                    <option value={16}>16 Weeks</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Experience Level
                  </label>
                  <select 
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, experienceLevel: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BIOMETRICS */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Tell us about you</h2>
                <p className="text-sm text-gray-500">Used to calculate calorie and macro targets.</p>
              </div>

              {/* Sex Segmented Control */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Sex</label>
                <div className="flex p-1 bg-gray-100 rounded-xl">
                  {["male", "female"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, sex: s }))}
                      className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all duration-200 ${
                        formData.sex === s
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="25"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={formData.heightCm}
                    onChange={(e) => setFormData(prev => ({ ...prev, heightCm: e.target.value }))}
                    placeholder="175"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={formData.weightKg}
                    onChange={(e) => setFormData(prev => ({ ...prev, weightKg: e.target.value }))}
                    placeholder="70"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Body Fat % (Optional)</label>
                  <input
                    type="number"
                    value={formData.bodyFatPct}
                    onChange={(e) => setFormData(prev => ({ ...prev, bodyFatPct: e.target.value }))}
                    placeholder="15"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              </div>

              {/* Activity Level Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Activity Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "sedentary", label: "Sedentary" },
                    { id: "lightly_active", label: "Lightly Active" },
                    { id: "moderately_active", label: "Moderately Active" },
                    { id: "very_active", label: "Very Active" },
                  ].map((act) => {
                    const isSelected = formData.activityLevel === act.id;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, activityLevel: act.id }))}
                        className={`py-2 px-3 border rounded-xl text-xs font-semibold transition-all duration-200 ${
                          isSelected
                            ? "border-brand bg-blue-50/50 text-brand"
                            : "border-gray-200 hover:border-gray-300 text-gray-600 bg-gray-50"
                        }`}
                      >
                        {act.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: EQUIPMENT & SCHEDULE */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Equipment & schedule</h2>
                <p className="text-sm text-gray-500">So we never program something you can't do.</p>
              </div>

              {/* Training Location */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Training Location</label>
                <div className="flex p-1 bg-gray-100 rounded-xl">
                  {["home", "gym", "both"].map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, trainingLocation: loc }))}
                      className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all duration-200 ${
                        formData.trainingLocation === loc
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment Available */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Equipment Available</label>
                <div className="flex flex-wrap gap-2">
                  {["barbell", "dumbbells", "cables", "machines", "pull_up_bar", "bands"].map((eq) => {
                    const isSelected = formData.equipment.includes(eq);
                    return (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => handleToggleEquipment(eq)}
                        className={`py-1.5 px-3.5 border rounded-full text-xs font-semibold transition-all duration-200 capitalize ${
                          isSelected
                            ? "border-brand bg-blue-50/50 text-brand"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {eq.replace("_", " ")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Days Per Week & Session Length */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Days per Week</label>
                  <div className="flex gap-2">
                    {[3, 4, 5, 6].map((day) => {
                      const isSelected = formData.daysPerWeek === day;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, daysPerWeek: day }))}
                          className={`flex-1 h-9 rounded-full border text-xs font-bold transition-all duration-200 ${
                            isSelected
                              ? "border-brand bg-blue-50/50 text-brand"
                              : "border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Session Length</label>
                  <select
                    value={formData.sessionLengthMin}
                    onChange={(e) => setFormData(prev => ({ ...prev, sessionLengthMin: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: DIETARY CONSTRAINTS */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Any dietary needs?</h2>
                <p className="text-sm text-gray-500">We'll build every meal plan around these.</p>
              </div>

              {/* Restrictions */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Restrictions</label>
                <div className="flex flex-wrap gap-2">
                  {["none", "vegetarian", "vegan", "halal", "keto", "dairy-free", "gluten-free"].map((item) => {
                    const isSelected = formData.dietaryRestrictions.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleToggleDietary(item)}
                        className={`py-1.5 px-3.5 border rounded-full text-xs font-semibold transition-all duration-200 capitalize ${
                          isSelected
                            ? "border-brand bg-blue-50/50 text-brand"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Allergies (comma separated)</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                  placeholder="e.g. peanuts, soy"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>

              {/* Meals per Day & Cooking Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Meals per Day</label>
                  <div className="flex gap-2">
                    {[3, 4, 5].map((meal) => {
                      const isSelected = formData.mealsPerDay === meal;
                      return (
                        <button
                          key={meal}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, mealsPerDay: meal }))}
                          className={`flex-1 h-9 rounded-full border text-xs font-bold transition-all duration-200 ${
                            isSelected
                              ? "border-brand bg-blue-50/50 text-brand"
                              : "border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          {meal}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cooking Time Budget</label>
                  <select
                    value={formData.cookingTimeBudgetMin}
                    onChange={(e) => setFormData(prev => ({ ...prev, cookingTimeBudgetMin: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60+ min</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: INJURY & HEALTH HISTORY */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Injury & health history</h2>
                <p className="text-sm text-gray-500">This lets Coach Atlas avoid loading anything that could hurt you.</p>
              </div>

              {/* Past or Current Injuries */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Past or Current Injuries (tap to select)
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Shoulder", "Lower Back", "Knee", "Wrist", "Hip", "Ankle", "Neck"].map((joint) => {
                    const isSelected = formData.currentInjuries.includes(joint);
                    return (
                      <button
                        key={joint}
                        type="button"
                        onClick={() => handleToggleInjury(joint)}
                        className={`py-1.5 px-3.5 border rounded-full text-xs font-semibold transition-all duration-200 ${
                          isSelected
                            ? "border-brand bg-blue-50/50 text-brand"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {joint}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Injury Details */}
              {formData.currentInjuries.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 space-y-2">
                  <label className="block text-xs font-bold text-amber-800">
                    Specify joint/injury details (e.g. pain level, movements to avoid)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.injuryDetails}
                    onChange={(e) => setFormData(prev => ({ ...prev, injuryDetails: e.target.value }))}
                    placeholder="e.g. Mild strain, 2023 - currently pain-free, cleared by doctor."
                    className="w-full p-2 bg-white border border-amber-200 rounded-lg text-xs placeholder-amber-600/50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              )}

              {/* Doctor Clearance */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cleared by a doctor for exercise?</label>
                <div className="flex p-1 bg-gray-100 rounded-xl">
                  {["yes", "no", "n/a"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, doctorClearance: option }))}
                      className={`flex-1 py-2 text-sm font-semibold rounded-lg uppercase transition-all duration-200 ${
                        formData.doctorClearance === option
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      {option === "n/a" ? "N/A" : option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: SUMMARY & REVIEW */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Review your profile</h2>
                <p className="text-sm text-gray-500">Double-check everything before Coach Atlas builds your first plan.</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3.5 text-sm border border-gray-150">
                <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-medium">GOAL & TIMELINE</span>
                    <span className="font-semibold text-gray-800 capitalize">
                      {formData.primaryGoal.replace("_", " ")} • {formData.targetTimeframeWeeks} weeks
                    </span>
                  </div>
                  <button onClick={() => setStep(1)} className="text-xs font-bold text-brand hover:underline">Edit</button>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-medium">BIOMETRICS</span>
                    <span className="font-semibold text-gray-800 capitalize">
                      {formData.sex} • {formData.age} yrs • {formData.heightCm}cm • {formData.weightKg}kg
                    </span>
                  </div>
                  <button onClick={() => setStep(2)} className="text-xs font-bold text-brand hover:underline">Edit</button>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-medium">SCHEDULE</span>
                    <span className="font-semibold text-gray-800 capitalize">
                      {formData.trainingLocation} • {formData.daysPerWeek} days/week • {formData.sessionLengthMin} min
                    </span>
                  </div>
                  <button onClick={() => setStep(3)} className="text-xs font-bold text-brand hover:underline">Edit</button>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-medium">DIET</span>
                    <span className="font-semibold text-gray-800 capitalize">
                      {formData.dietaryRestrictions.join(", ")} • {formData.mealsPerDay} meals/day
                    </span>
                  </div>
                  <button onClick={() => setStep(4)} className="text-xs font-bold text-brand hover:underline">Edit</button>
                </div>

                <div className="flex justify-between items-center py-1">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-medium">HEALTH</span>
                    <span className="font-semibold text-gray-800">
                      {formData.currentInjuries.length > 0 
                        ? `${formData.currentInjuries.join(", ")} (Injury flagged)` 
                        : "No injuries flagged"}
                    </span>
                  </div>
                  <button onClick={() => setStep(5)} className="text-xs font-bold text-brand hover:underline">Edit</button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            {error && (
              <div className="mb-4 p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-100 font-medium">
                {error}
              </div>
            )}
            
            {step < 6 ? (
              <button
                type="button"
                onClick={nextStep}
                className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white font-bold rounded-full shadow-md transition-all duration-200 text-center block text-sm cursor-pointer"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white font-bold rounded-full shadow-md transition-all duration-200 flex items-center justify-center text-sm disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Coach Atlas is building plan...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Build My Plan</span>
                  </div>
                )}
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
