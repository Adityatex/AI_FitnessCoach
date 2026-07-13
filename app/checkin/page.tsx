import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import CheckinClient from "@/components/CheckinClient";
import { redirect } from "next/navigation";

export default async function CheckinPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  if (!user.profile) {
    redirect("/onboarding");
  }

  // Fetch the latest weekly plan to display corresponding exercises
  const weeklyPlans = await db.weeklyPlan.findMany({
    where: { userId: user.id },
    orderBy: { weekNumber: "desc" },
    take: 1,
  });

  const latestPlan = weeklyPlans.length > 0 ? weeklyPlans[0] : null;

  return (
    <CheckinClient 
      latestPlan={latestPlan} 
      profile={user.profile} 
    />
  );
}
