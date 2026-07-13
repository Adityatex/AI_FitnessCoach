"use server";

import { generateAICall } from "@/lib/ai";
import { getSession } from "@/lib/auth";
import { classifyWeek } from "@/lib/classifier";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const ADJUST_PLAN_SYSTEM_PROMPT = `You are Coach Atlas, a certified strength and conditioning specialist (CSCS)
operating under NSCA (National Strength and Conditioning Association)
methodology. You design and adapt resistance training programs for
individual clients based on structured biometric and performance data.

You will receive: the user's profile, last week's assigned plan, this week's
aggregated check-in data, and a PRE-COMPUTED classification label, one of:
bad_day_session | life_disruption | under_recovery |
true_plateau_localized | true_plateau_systemic | injury_signal

Rules you must follow:
- If injury_signal: do not proceed with normal adjustment. Instead run
  the injury-modification protocol. Do not mix the two flows in one response.
- If bad_day_session: make no structural changes. Repeat the plan,
  optionally hold load flat on the affected lift only. Include one
  sentence of encouragement in your response.
- If life_disruption: hold all loads flat, do not progress volume. Note
  adherence supportively, without guilt-inducing language.
- If under_recovery: reduce total weekly volume 10-20% (drop 1 set from
  2-3 exercises) OR reduce intensity (RPE targets) for the week. Frame as
  a deliberate recovery week, not a failure.
- If true_plateau_localized: change ONE variable for the affected lift(s)
  — rep range, exercise variation, or added specialization volume. Do
  not change the rest of the program.
- If true_plateau_systemic: review whether caloric surplus/deficit is
  adequate given the goal, propose a 1-week deload (reduced
  volume/intensity), then a new 4-week block with adjusted rep ranges.
- Always override the pre-classification if the free-text notes clearly
  indicate a different real-world cause (illness, travel, personal
  event, new pain not yet flagged structurally) — if you override,
  explicitly say so and why.

Output ONLY valid JSON:
{
  "classification_used": "...",
  "classification_reasoning": "...",
  "adjusted_plan": {
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
  },
  "user_message": "short, supportive, plain-language explanation of the change"
}`;

const INJURY_SYSTEM_PROMPT = `You are Coach Atlas. You have received a pain/injury report that overrides
the normal weekly adaptation logic. Follow this sequence exactly:

1. TRIAGE FIRST. Classify as red-flag, yellow-flag, or DOMS using the
   criteria: red flag = sharp/sudden onset, worsening, pain at rest,
   numbness/tingling/radiating pain (if ANY present, STOP — advise
   pausing the affected pattern and consulting a doctor, do not suggest
   substitutions). DOMS = soreness only in a recently-trained muscle, no
   joint involvement, not worsening (route back to normal loop, no
   change). Yellow flag = everything else.

2. If yellow flag: IDENTIFY the affected joint/region and every exercise
   in the current program that loads it directly or indirectly.

3. REDESIGN by substituting each affected exercise with a pain-free
   alternative training the same muscle group/movement intent,
   preserving total weekly volume for that muscle group. Never delete
   volume without replacing it.

4. FLAG a re-assessment date (1-2 weeks out).

Never diagnose a specific medical condition — you are adjusting a
training program around a reported symptom, not providing medical advice.

Output ONLY valid JSON:
{
  "triage": "red_flag" | "yellow_flag" | "doms",
  "reasoning": "...",
  "modified_plan": {
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
  },
  "reassessment_date_weeks_out": 2,
  "user_message": "..."
}`;

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

const ADJUSTMENT_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    classification_used: { type: "STRING" },
    classification_reasoning: { type: "STRING" },
    adjusted_plan: WEEK1_RESPONSE_SCHEMA,
    user_message: { type: "STRING" }
  },
  required: ["classification_used", "classification_reasoning", "adjusted_plan", "user_message"]
};

const INJURY_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    triage: { type: "STRING" }, // red_flag | yellow_flag | doms
    reasoning: { type: "STRING" },
    modified_plan: {
      ...WEEK1_RESPONSE_SCHEMA,
      nullable: true
    },
    reassessment_date_weeks_out: { type: "INTEGER" },
    user_message: { type: "STRING" }
  },
  required: ["triage", "reasoning", "reassessment_date_weeks_out", "user_message"]
};

export async function advanceWeek() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.userId;

  try {
    // 1. Fetch data
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      throw new Error("User profile not found");
    }

    const weeklyPlans = await db.weeklyPlan.findMany({
      where: { userId },
      orderBy: { weekNumber: "asc" },
    });

    const currentWeekNum = weeklyPlans.length > 0 ? weeklyPlans[weeklyPlans.length - 1].weekNumber : 1;

    // Get check-ins for the current week
    const allCheckins = await db.dailyCheckin.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    });

    let firstCheckinTime = new Date().getTime();
    if (allCheckins.length > 0) {
      firstCheckinTime = new Date(allCheckins[0].date).getTime();
    }

    const currentWeekCheckins = allCheckins.filter(checkin => {
      const checkinTime = new Date(checkin.date).getTime();
      const daysDiff = Math.floor((checkinTime - firstCheckinTime) / (1000 * 60 * 60 * 24));
      const calculatedWeek = Math.max(1, Math.floor(daysDiff / 7) + 1);
      return calculatedWeek === currentWeekNum;
    });

    const prevWeekCheckins = allCheckins.filter(checkin => {
      const checkinTime = new Date(checkin.date).getTime();
      const daysDiff = Math.floor((checkinTime - firstCheckinTime) / (1000 * 60 * 60 * 24));
      const calculatedWeek = Math.max(1, Math.floor(daysDiff / 7) + 1);
      return calculatedWeek === (currentWeekNum - 1);
    });

    // 2. Perform pre-classification
    const classification = classifyWeek({
      currentWeekCheckins,
      prevWeekCheckins,
      daysPerWeek: user.profile.daysPerWeek,
      totalLoggedWeeks: weeklyPlans.length,
    });

    const lastPlan = weeklyPlans[weeklyPlans.length - 1];

    let newPlanDays: any = null;
    let newMealPlan: any = null;
    let classificationUsed = classification;
    let userMessage = "";

    // 3. Check for Injury Signal
    if (classification === "injury_signal") {
      const aiInput = {
        profile: user.profile,
        lastWeekPlan: {
          workoutPlan: JSON.parse(lastPlan.workoutPlan),
          mealPlan: JSON.parse(lastPlan.mealPlan),
        },
        checkins: currentWeekCheckins,
      };

      const rawRes = await generateAICall({
        systemPrompt: INJURY_SYSTEM_PROMPT,
        userContent: JSON.stringify(aiInput),
        model: "gemma-4-31b-it",
      });

      const res = Array.isArray(rawRes) ? rawRes[0] : rawRes;

      if (res.triage === "red_flag") {
        newPlanDays = JSON.parse(lastPlan.workoutPlan); // keep old plan
        newMealPlan = JSON.parse(lastPlan.mealPlan);
        userMessage = res.user_message || res.userMessage;
        classificationUsed = "injury_signal (Red Flag)";
      } else if (res.triage === "doms") {
        // Route back to normal loop
        const adjustInput = {
          profile: user.profile,
          lastWeekPlan: {
            workoutPlan: JSON.parse(lastPlan.workoutPlan),
            mealPlan: JSON.parse(lastPlan.mealPlan),
          },
          checkins: currentWeekCheckins,
          classification: "bad_day_session",
        };

        const rawAdjustRes = await generateAICall({
          systemPrompt: ADJUST_PLAN_SYSTEM_PROMPT,
          userContent: JSON.stringify(adjustInput),
          model: "gemma-4-31b-it",
        });

        const adjustRes = Array.isArray(rawAdjustRes) ? rawAdjustRes[0] : rawAdjustRes;

        const innerAdjust = adjustRes.adjusted_plan || adjustRes.adjustedPlan || adjustRes;
        let days = innerAdjust.days || innerAdjust.workoutPlan || innerAdjust.workout_plan || innerAdjust.workout;
        if (days && !Array.isArray(days) && typeof days === "object" && days.days) {
          days = days.days;
        }
        newPlanDays = days;
        newMealPlan = innerAdjust.meal_plan || innerAdjust.mealPlan || innerAdjust.meals;
        userMessage = adjustRes.user_message || adjustRes.userMessage || "Adapted plan due to DOMS.";
        classificationUsed = "bad_day_session (DOMS Downgrade)";
      } else {
        // Yellow flag
        const innerMod = res.modified_plan || res.modifiedPlan || res;
        let days = innerMod.days || innerMod.workoutPlan || innerMod.workout_plan || innerMod.workout;
        if (days && !Array.isArray(days) && typeof days === "object" && days.days) {
          days = days.days;
        }
        newPlanDays = days;
        newMealPlan = innerMod.meal_plan || innerMod.mealPlan || innerMod.meals;
        userMessage = res.user_message || res.userMessage || "Injury modified plan.";
        classificationUsed = "injury_signal (Yellow Flag)";
      }
    } else {
      // Normal plan adaptation
      const aiInput = {
        profile: user.profile,
        lastWeekPlan: {
          workoutPlan: JSON.parse(lastPlan.workoutPlan),
          mealPlan: JSON.parse(lastPlan.mealPlan),
        },
        checkins: currentWeekCheckins,
        classification: classification || "bad_day_session", // fallback for week 1 -> 2
      };

      const rawRes = await generateAICall({
        systemPrompt: ADJUST_PLAN_SYSTEM_PROMPT,
        userContent: JSON.stringify(aiInput),
        model: "gemma-4-31b-it",
      });

      const res = Array.isArray(rawRes) ? rawRes[0] : rawRes;

      const innerAdjust = res.adjusted_plan || res.adjustedPlan || res;
      let days = innerAdjust.days || innerAdjust.workoutPlan || innerAdjust.workout_plan || innerAdjust.workout;
      if (days && !Array.isArray(days) && typeof days === "object" && days.days) {
        days = days.days;
      }
      newPlanDays = days;
      newMealPlan = innerAdjust.meal_plan || innerAdjust.mealPlan || innerAdjust.meals;
      userMessage = res.user_message || res.userMessage || "Plan adjusted.";
      classificationUsed = res.classification_used || classification || "bad_day_session";
    }

    // 4. Save new weekly plan
    await db.weeklyPlan.create({
      data: {
        userId,
        weekNumber: currentWeekNum + 1,
        workoutPlan: JSON.stringify(newPlanDays),
        mealPlan: JSON.stringify(newMealPlan),
        classification: classificationUsed,
        claudeReasoning: userMessage,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to advance week:", error);
    return { error: "Failed to generate next week's plan. Please check your AI API configurations." };
  }
}
