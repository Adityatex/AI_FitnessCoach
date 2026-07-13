"use server";

import { comparePassword, hashPassword, setSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return { error: "Invalid email or password" };
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return { error: "Invalid email or password" };
    }

    await setSession(user.id, user.email);
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Something went wrong during login" };
  }

  // Redirect if successful
  redirect("/onboarding");
}

export async function signUpAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password || !confirmPassword) {
    return { error: "All fields are required" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  try {
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return { error: "Email is already registered" };
    }

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
      },
    });

    await setSession(user.id, user.email);
  } catch (error) {
    console.error("Sign up error:", error);
    return { error: "Something went wrong during registration" };
  }

  // Redirect if successful
  redirect("/onboarding");
}

export async function logoutAction() {
  const { clearSession } = await import("@/lib/auth");
  await clearSession();
  redirect("/auth");
}

