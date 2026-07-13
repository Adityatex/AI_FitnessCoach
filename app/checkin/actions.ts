"use server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function submitDailyCheckin(checkinData: any) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.userId;

  try {
    // Check if check-in for this date already exists and update, or create a new one
    await db.dailyCheckin.upsert({
      where: {
        id: checkinData.id || "temp-non-existent-uuid", // SQLite unique key
      },
      update: {
        date: checkinData.date,
        sessionCompleted: checkinData.sessionCompleted,
        exercisesLogged: JSON.stringify(checkinData.exercisesLogged || []),
        mealsLogged: parseInt(checkinData.mealsLogged || 0),
        mealsPlanned: parseInt(checkinData.mealsPlanned || 0),
        estKcal: parseFloat(checkinData.estKcal || 0),
        targetKcal: parseFloat(checkinData.targetKcal || 0),
        sleepHours: parseFloat(checkinData.sleepHours || 0),
        soreness1to10: parseInt(checkinData.soreness1to10 || 0),
        stress1to10: parseInt(checkinData.stress1to10 || 0),
        painFlag: checkinData.painFlag ? JSON.stringify(checkinData.painFlag) : null,
        notes: checkinData.notes || "",
      },
      create: {
        userId,
        date: checkinData.date,
        sessionCompleted: checkinData.sessionCompleted,
        exercisesLogged: JSON.stringify(checkinData.exercisesLogged || []),
        mealsLogged: parseInt(checkinData.mealsLogged || 0),
        mealsPlanned: parseInt(checkinData.mealsPlanned || 0),
        estKcal: parseFloat(checkinData.estKcal || 0),
        targetKcal: parseFloat(checkinData.targetKcal || 0),
        sleepHours: parseFloat(checkinData.sleepHours || 0),
        soreness1to10: parseInt(checkinData.soreness1to10 || 0),
        stress1to10: parseInt(checkinData.stress1to10 || 0),
        painFlag: checkinData.painFlag ? JSON.stringify(checkinData.painFlag) : null,
        notes: checkinData.notes || "",
      },
    });
  } catch (error) {
    console.error("Checkin submission failed:", error);
    return { error: "Failed to save daily check-in. Please try again." };
  }

  redirect("/dashboard");
}
