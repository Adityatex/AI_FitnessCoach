"use server";

import { generateAICall } from "@/lib/ai";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const WEEK1_SYSTEM_PROMPT = `You are Coach Atlas, a certified strength and conditioning specialist (CSCS)
operating under NSCA (National Strength and Conditioning Association)
methodology. You design and adapt resistance training programs for
individual clients based on structured biometric and performance data.

## Core principles you must apply
1. Progressive overload: each week must increase difficulty via one primary
   lever — load, reps, sets, density (rest reduction), or complexity —
   never all at once.
2. Periodization: default to a linear/undulating hybrid — heavier,
   lower-rep days paired with lighter, higher-rep accessory days across
   the week, cycling emphasis every 4 weeks (accumulation → intensification
   → deload).
3. Movement pattern balance: every week must include push, pull, hinge,
   squat, and carry/core patterns. Never program two consecutive heavy
   sessions for the same primary pattern without 48h recovery.
4. Volume landmarks: use NSCA-aligned set/rep prescriptions:
   - Strength: 3-6 reps, 3-5 sets, 2-4 min rest, 75-90% 1RM
   - Hypertrophy: 6-12 reps, 3-4 sets, 60-90s rest, 65-80% 1RM
   - Endurance: 12-20 reps, 2-3 sets, 30-60s rest, <65% 1RM
5. Equipment and time constraints are hard limits — never program equipment
   the user doesn't have, or a session longer than their stated time budget.
6. Injury flags are hard constraints — never program direct loading of a
   flagged area; use pain-free ranges of motion and substitute movement
   patterns.

## Output format
Return ONLY valid JSON (no markdown, no preamble) matching this shape:
{
  "days": [
    {
      "day_label": "Day 1 — Upper Push/Pull, Hypertrophy",
      "warm_up": ["..."],
      "main_lifts": [{"exercise": "...", "sets": 4, "reps": "8", "rest_sec": 90, "target": "RPE 7-8"}],
      "accessory_lifts": [{"exercise": "...", "sets": 3, "reps": "10", "rest_sec": 75, "target": "RPE 7"}],
      "conditioning_core": ["..."],
      "coaching_notes": "..."
    }
  ],
  "meal_plan": {
    "daily_kcal_target": 2950,
    "protein_g": 130,
    "carbs_g": 423,
    "fat_g": 82,
    "days": [
      {
        "day": "Day 1",
        "meals": [{"name": "Breakfast", "items": "...", "kcal": 620, "protein_g": 38, "carbs_g": 78, "fat_g": 16}]
      }
    ],
    "shopping_list": {"protein": ["..."], "carbs": ["..."], "produce": ["..."], "fats_extras": ["..."]}
  }
}

For nutrition values, use standard USDA-aligned per-100g estimates for
common foods (e.g. cooked chicken breast ≈165 kcal/100g, 31g protein/100g).`;

const WEEK1_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    days: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          day_label: { type: "STRING" },
          warm_up: { type: "ARRAY", items: { type: "STRING" } },
          main_lifts: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                exercise: { type: "STRING" },
                sets: { type: "INTEGER" },
                reps: { type: "STRING" },
                rest_sec: { type: "INTEGER" },
                target: { type: "STRING" }
              },
              required: ["exercise", "sets", "reps", "rest_sec", "target"]
            }
          },
          accessory_lifts: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                exercise: { type: "STRING" },
                sets: { type: "INTEGER" },
                reps: { type: "STRING" },
                rest_sec: { type: "INTEGER" },
                target: { type: "STRING" }
              },
              required: ["exercise", "sets", "reps", "rest_sec", "target"]
            }
          },
          conditioning_core: { type: "ARRAY", items: { type: "STRING" } },
          coaching_notes: { type: "STRING" }
        },
        required: ["day_label", "warm_up", "main_lifts", "accessory_lifts", "conditioning_core", "coaching_notes"]
      }
    },
    meal_plan: {
      type: "OBJECT",
      properties: {
        daily_kcal_target: { type: "INTEGER" },
        protein_g: { type: "INTEGER" },
        carbs_g: { type: "INTEGER" },
        fat_g: { type: "INTEGER" },
        days: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              day: { type: "STRING" },
              meals: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING" },
                    items: { type: "STRING" },
                    kcal: { type: "INTEGER" },
                    protein_g: { type: "INTEGER" },
                    carbs_g: { type: "INTEGER" },
                    fat_g: { type: "INTEGER" }
                  },
                  required: ["name", "items", "kcal", "protein_g", "carbs_g", "fat_g"]
                }
              }
            },
            required: ["day", "meals"]
          }
        },
        shopping_list: {
          type: "OBJECT",
          properties: {
            protein: { type: "ARRAY", items: { type: "STRING" } },
            carbs: { type: "ARRAY", items: { type: "STRING" } },
            produce: { type: "ARRAY", items: { type: "STRING" } },
            fats_extras: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["protein", "carbs", "produce", "fats_extras"]
        }
      },
      required: ["daily_kcal_target", "protein_g", "carbs_g", "fat_g", "days", "shopping_list"]
    }
  },
  required: ["days", "meal_plan"]
};

const safeParseInt = (val: any, fallback: number = 0): number => {
  const parsed = parseInt(val);
  return isNaN(parsed) ? fallback : parsed;
};

const safeParseFloat = (val: any, fallback: number = 0): number => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
};

const safeParseFloatOrNull = (val: any): number | null => {
  if (val === undefined || val === null || val === "") return null;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? null : parsed;
};

export async function submitOnboarding(profileData: any) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.userId;

  // Format and save to db
  try {
    const profile = await db.profile.upsert({
      where: { id: userId },
      update: {
        primaryGoal: profileData.primaryGoal,
        targetTimeframeWeeks: safeParseInt(profileData.targetTimeframeWeeks, 12),
        experienceLevel: profileData.experienceLevel,
        age: safeParseInt(profileData.age, 25),
        sex: profileData.sex,
        heightCm: safeParseFloat(profileData.heightCm, 170),
        weightKg: safeParseFloat(profileData.weightKg, 70),
        bodyFatPct: safeParseFloatOrNull(profileData.bodyFatPct),
        activityLevel: profileData.activityLevel,
        trainingLocation: profileData.trainingLocation || "gym",
        equipment: JSON.stringify(profileData.equipment || []),
        daysPerWeek: safeParseInt(profileData.daysPerWeek, 4),
        sessionLengthMin: safeParseInt(profileData.sessionLengthMin, 60),
        dietaryRestrictions: JSON.stringify(profileData.dietaryRestrictions || []),
        allergies: JSON.stringify(profileData.allergies || []),
        mealsPerDay: safeParseInt(profileData.mealsPerDay, 4),
        cookingTimeBudgetMin: safeParseInt(profileData.cookingTimeBudgetMin, 30),
        currentInjuries: JSON.stringify(profileData.currentInjuries || []),
        pastInjuries: JSON.stringify(profileData.pastInjuries || []),
        medicalConditions: JSON.stringify(profileData.medicalConditions || []),
        doctorClearance: profileData.doctorClearance === "yes" || profileData.doctorClearance === true,
      },
      create: {
        id: userId,
        primaryGoal: profileData.primaryGoal,
        targetTimeframeWeeks: safeParseInt(profileData.targetTimeframeWeeks, 12),
        experienceLevel: profileData.experienceLevel,
        age: safeParseInt(profileData.age, 25),
        sex: profileData.sex,
        heightCm: safeParseFloat(profileData.heightCm, 170),
        weightKg: safeParseFloat(profileData.weightKg, 70),
        bodyFatPct: safeParseFloatOrNull(profileData.bodyFatPct),
        activityLevel: profileData.activityLevel,
        trainingLocation: profileData.trainingLocation || "gym",
        equipment: JSON.stringify(profileData.equipment || []),
        daysPerWeek: safeParseInt(profileData.daysPerWeek, 4),
        sessionLengthMin: safeParseInt(profileData.sessionLengthMin, 60),
        dietaryRestrictions: JSON.stringify(profileData.dietaryRestrictions || []),
        allergies: JSON.stringify(profileData.allergies || []),
        mealsPerDay: safeParseInt(profileData.mealsPerDay, 4),
        cookingTimeBudgetMin: safeParseInt(profileData.cookingTimeBudgetMin, 30),
        currentInjuries: JSON.stringify(profileData.currentInjuries || []),
        pastInjuries: JSON.stringify(profileData.pastInjuries || []),
        medicalConditions: JSON.stringify(profileData.medicalConditions || []),
        doctorClearance: profileData.doctorClearance === "yes" || profileData.doctorClearance === true,
      },
    });

    // Invoke Gemini AI to generate Week 1 plan
    const responseJson = await generateAICall({
      systemPrompt: WEEK1_SYSTEM_PROMPT,
      userContent: JSON.stringify(profile),
      model: "gemma-4-26b-a4b-it",
    });

    console.log("Onboarding AI Response keys:", Object.keys(responseJson));

    // Resolve array wrap if model returns a single-item array
    const data = Array.isArray(responseJson) ? responseJson[0] : responseJson;

    // Extract workout days with fallback variations
    let days = data.days || data.workoutPlan || data.workout_plan || data.workout;
    if (days && !Array.isArray(days) && typeof days === "object" && days.days) {
      days = days.days;
    }
    
    // Extract meal plan with fallback variations
    const mealPlan = data.meal_plan || data.mealPlan || data.meals;

    if (!days || !Array.isArray(days)) {
      console.error("Failed to parse days. Full response:", JSON.stringify(responseJson));
      throw new Error("Workout plan 'days' array is missing or invalid in model output.");
    }
    if (!mealPlan) {
      console.error("Failed to parse meal plan. Full response:", JSON.stringify(responseJson));
      throw new Error("Meal plan 'meal_plan' object is missing in model output.");
    }

    // Save Week 1 Plan to db
    await db.weeklyPlan.create({
      data: {
        userId: userId,
        weekNumber: 1,
        workoutPlan: JSON.stringify(days),
        mealPlan: JSON.stringify(mealPlan),
        classification: null,
        claudeReasoning: "Initial Plan Generated by Coach Atlas",
      },
    });
  } catch (error) {
    console.error("Onboarding submission failed:", error);
    return { error: "Failed to generate initial plan. Please check your credentials/API key and try again." };
  }

  // Redirect to dashboard
  redirect("/dashboard");
}
