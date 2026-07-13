import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardClient from "@/components/DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  if (!user.profile) {
    redirect("/onboarding");
  }

  // Fetch plans and checkins
  const weeklyPlans = await db.weeklyPlan.findMany({
    where: { userId: user.id },
    orderBy: { weekNumber: "asc" },
  });

  const dailyCheckins = await db.dailyCheckin.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
  });

  return (
    <DashboardClient 
      user={user} 
      profile={user.profile} 
      weeklyPlans={weeklyPlans} 
      dailyCheckins={dailyCheckins} 
    />
  );
}
