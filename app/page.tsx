import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  if (!user.profile) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}
