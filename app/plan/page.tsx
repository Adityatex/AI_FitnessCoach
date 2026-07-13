import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ArrowLeft, CheckCircle, Clock, Heart, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

interface PlanPageProps {
  searchParams: Promise<{ day?: string }>;
}

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  if (!user.profile) redirect("/onboarding");

  // Await searchParams in Next.js 15/16
  const params = await searchParams;
  const dayIndex = parseInt(params.day || "0") || 0;

  const weeklyPlans = await db.weeklyPlan.findMany({
    where: { userId: user.id },
    orderBy: { weekNumber: "desc" }, // latest first
    take: 1,
  });

  if (weeklyPlans.length === 0) {
    redirect("/dashboard");
  }

  const latestPlan = weeklyPlans[0];
  let days: any[] = [];
  try {
    days = JSON.parse(latestPlan.workoutPlan || "[]");
  } catch (e) {
    console.error(e);
  }

  const selectedDay = days[dayIndex] || days[0];

  if (!selectedDay) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Link 
            href="/dashboard" 
            className="flex items-center text-gray-500 hover:text-gray-900 text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
          </Link>
          <span className="text-xs font-bold bg-blue-50 text-brand py-1 px-3 border border-blue-100 rounded-full">
            Week {latestPlan.weekNumber} Plan
          </span>
        </div>

        {/* Card Main Info */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-md space-y-6">
          <div>
            <span className="text-xs font-extrabold text-brand uppercase tracking-widest block mb-1">
              Workout Details
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
              {selectedDay.day_label || `Day ${dayIndex + 1}`}
            </h1>
            {selectedDay.coaching_notes && (
              <p className="text-sm text-gray-500 mt-2 italic">
                "{selectedDay.coaching_notes}"
              </p>
            )}
          </div>

          {/* Warm Up */}
          {selectedDay.warm_up && selectedDay.warm_up.length > 0 && (
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 space-y-2">
              <span className="text-xs font-bold text-brand uppercase tracking-wider block">Warm Up Routine</span>
              <ul className="space-y-1 text-sm font-medium text-gray-700">
                {selectedDay.warm_up.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-brand rounded-full mr-2" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main Lifts Section */}
          {selectedDay.main_lifts && selectedDay.main_lifts.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-gray-900 text-base border-b border-gray-100 pb-2">
                Main Lifts (Overload Focus)
              </h3>
              <div className="space-y-3">
                {selectedDay.main_lifts.map((lift: any, idx: number) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-150 flex justify-between items-center gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{lift.exercise}</h4>
                      <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> Rest: {lift.rest_sec}s</span>
                        <span>•</span>
                        <span>Sets: {lift.sets} x {lift.reps} reps</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-blue-100 text-brand py-1 px-3 rounded-lg border border-blue-200/35 shrink-0">
                      {lift.target}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accessory Lifts Section */}
          {selectedDay.accessory_lifts && selectedDay.accessory_lifts.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-gray-900 text-base border-b border-gray-100 pb-2">
                Accessory Lifts (Hypertrophy & Balance)
              </h3>
              <div className="space-y-3">
                {selectedDay.accessory_lifts.map((lift: any, idx: number) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-150 flex justify-between items-center gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{lift.exercise}</h4>
                      <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> Rest: {lift.rest_sec}s</span>
                        <span>•</span>
                        <span>Sets: {lift.sets} x {lift.reps} reps</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-blue-50 text-brand py-1 px-3 rounded-lg border border-blue-100 shrink-0">
                      {lift.target}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conditioning & Core */}
          {selectedDay.conditioning_core && selectedDay.conditioning_core.length > 0 && (
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 space-y-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Conditioning & Core</span>
              <ul className="space-y-1 text-sm font-medium text-gray-700">
                {selectedDay.conditioning_core.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full mr-2" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
